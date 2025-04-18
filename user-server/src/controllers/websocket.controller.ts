import { Socket } from 'socket.io';
import { WebSocketServer } from '../config/socket';
import ConversationService from '../services/conversation.service';
import logger from '../config/logger';
import { AiService } from '../services/ai/ai.service';
import {
    IConversation,
    IConversationMessage,
    ConversationType,
} from '../interfaces/conversation.interface';
import { DepartmentService, DoctorService } from '../services';
import { generateMessageId } from '../utils/idGenerator';

export class WebSocketController {
    static async handleConnection(socket: Socket): Promise<void> {
        try {
            const userId = socket.handshake.auth.userId;
            if (!userId) {
                logger.warn(`Connection attempt without userId: ${socket.id}`);
                socket.disconnect();
                return;
            }

            // 设置socket.data中的userId，确保后续操作可以使用
            socket.data = { ...socket.data, userId };

            // 加入用户私人房间
            await WebSocketServer.joinRoom(socket.id, `user_${userId}`);

            logger.info(`用户 ${userId} 已连接 WebSocket`);

            // 设置事件监听器
            this.setupEventListeners(socket, userId);
        } catch (error: any) {
            logger.error(`WebSocket connection error: ${error.message || error}`);
            socket.disconnect();
        }
    }

    // 设置事件监听器
    private static setupEventListeners(socket: Socket, userId: string): void {
        // 处理加入会话房间
        socket.on('join_conversation', (conversationId: string) =>
            this.handleJoinConversation(socket, userId, conversationId)
        );

        // 处理离开会话房间
        socket.on('leave_conversation', (conversationId: string) =>
            this.handleLeaveConversation(socket, userId, conversationId)
        );

        // 处理新消息
        socket.on(
            'new_message',
            (data: {
                conversationId: string;
                content: string;
                metadata?: any;
                conversationType: string;
            }) => this.handleMessage(socket, data, userId)
        );

        // 处理断开连接
        socket.on('disconnect', () => {
            logger.info(`User ${userId} disconnected`);
        });
    }

            // 处理加入会话房间
    private static async handleJoinConversation(
        socket: Socket,
        userId: string,
        conversationId: string
    ): Promise<void> {
                try {
                    if (!conversationId) {
                        logger.warn(`Join conversation attempt without conversationId by user ${userId}`);
                        socket.emit('error', { message: '会话ID不能为空' });
                        return;
                    }

                    await WebSocketServer.joinRoom(socket.id, `conversation_${conversationId}`);
                    logger.info(`User ${userId} joined conversation ${conversationId}`);
                    socket.emit('joined_conversation', { conversationId });
                } catch (error: any) {
                    logger.error(`Error joining conversation: ${error.message || error}`);
                    socket.emit('error', { message: '加入会话失败' });
                }
    }

            // 处理离开会话房间
    private static async handleLeaveConversation(
        socket: Socket,
        userId: string,
        conversationId: string
    ): Promise<void> {
                try {
                    if (!conversationId) {
                        logger.warn(`Leave conversation attempt without conversationId by user ${userId}`);
                        return;
                    }

                    await WebSocketServer.leaveRoom(socket.id, `conversation_${conversationId}`);
                    logger.info(`User ${userId} left conversation ${conversationId}`);
                    socket.emit('left_conversation', { conversationId });
                } catch (error: any) {
                    logger.error(`Error leaving conversation: ${error.message || error}`);
                }
    }

    // 主要消息处理方法
    static async handleMessage(
        socket: Socket,
        data: {
                conversationId: string;
                content: string;
                metadata?: any;
                conversationType: string;
        },
        userId: string
    ): Promise<void> {
        try {
            const { conversationId, content, conversationType } = data;
            if (!conversationId || !content) {
                throw new Error('Missing required fields');
            }

            if (!userId) {
                throw new Error('必须提供用户ID');
            }

            // 记录详细日志
            logger.info(
                `处理新消息: conversationId=${conversationId}, userId=${userId}, contentLength=${content.length}`
            );

            // 创建或获取会话
            const conversation = await ConversationService.createOrGetConversation({
                userId: userId,
                conversationType: conversationType as ConversationType,
                initialMessage: content,
                consultationId: conversationId,
            });

            if (!conversation) {
                throw new Error('无法创建或获取会话');
            }

            // 添加用户消息
            await ConversationService.addMessage({
                conversationId: conversation.id,
                content: content,
                role: 'user',
                timestamp: new Date(),
                consultationId: conversation.consultationId,
                id: generateMessageId(),
            } as IConversationMessage);

            // 广播消息给房间内所有用户
            socket.to(conversationId).emit('message_received', {
                conversation,
                message: {
                    content: content,
                    role: 'user',
                    timestamp: new Date(),
                },
            });

            // 生成AI响应
            await this.generateAiResponse(socket, conversation, conversationType);
        } catch (error: any) {
            console.error('处理消息时出错:', error);
            socket.emit('error', { message: '处理消息时出错' });
        }
    }

    // 准备AI服务所需的上下文数据
    private static async prepareContextData(
        conversationType: string,
        metadata?: Record<string, any>
    ): Promise<any> {
        const additionalData: any = {};

        try {
            if (conversationType === 'GUIDE') {
                // 导诊需要科室和医生数据
                const departments = await DepartmentService.getAllDepartments();
                const doctors = await DoctorService.getAllDoctors();

                additionalData.departments = departments;
                additionalData.doctors = doctors;
                logger.info(
                    `已加载导诊所需数据: ${departments.total}个科室, ${doctors.total}个医生`
                );
            } else if (
                conversationType === 'REPORT_INTERPRETATION' &&
                metadata &&
                metadata.reportId
            ) {
                // 报告解读需要报告数据
                additionalData.reportData = {
                    reportType: metadata.reportType,
                    description: metadata.description,
                    reportImages: metadata.reportImages,
                    hospital: metadata.hospital,
                    reportDate: metadata.reportDate,
                };
                logger.info(`已加载报告解读所需数据: ${metadata.reportId}`);
            }
        } catch (error: any) {
            logger.error(`准备额外数据失败: ${error.message || error}`);
            // 继续处理
        }

        return additionalData;
    }

    // 生成AI响应
    private static async generateAiResponse(
        socket: Socket,
        conversation: IConversation,
        conversationType: string
    ): Promise<void> {
        try {
            logger.info(`开始调用AI处理服务...`);

            // 准备上下文数据
            const contextData = await this.prepareContextData(
                conversationType,
                conversation.metadata
            );

            // 构建流式响应处理器
            const streamHandler = this.createStreamHandler(conversation.id, conversationType);
            // 获取会话的消息记录
            const messages = await ConversationService.getConversationMessages(conversation.id);
            // 生成AI响应
            const aiResponse = await this.generateAIResponse(
                messages.map(msg => msg.content),
                conversation,
                conversationType,
                streamHandler,
                contextData
            );
            logger.info('aiResponse', JSON.stringify(aiResponse));

            // 构建AI消息对象
            const aiMessage = this.createAIMessage(conversation.id, aiResponse, conversation);
            logger.info('aiMessage', JSON.stringify(aiMessage));

            // 直接发送AI消息到客户端
            logger.info(`直接向客户端发送AI消息, socket.id: ${socket.id}`);
            socket.emit('message_received', {
                message: aiMessage,
                conversation: {
                    id: conversation.id,
                    conversationType: conversation.conversationType,
                    consultationId: conversation.consultationId,
                },
            });

            // 向会话房间中的所有客户端发送AI消息
            logger.info(`向会话房间发送AI消息: conversation_${conversation.id}`);
            await WebSocketServer.emitToRoom(
                `conversation_${conversation.id}`,
                'message_received',
                {
                    message: aiMessage,
                    conversation: {
                        id: conversation.id,
                        conversationType: conversation.conversationType,
                        consultationId: conversation.consultationId,
                    },
                }
            );

            // 将用户消息和AI响应一起保存到数据库并广播完成事件
            await this.saveMessagePair(
                socket,
                conversation.id,
                messages.map(msg => msg.content),
                aiMessage,
                conversationType
            );
        } catch (error: any) {
            console.error('AI处理服务调用失败:', error);
            socket.emit('error', { message: 'AI处理服务调用失败，请稍后重试' });
        }
    }

    // 创建流式响应处理器
    private static createStreamHandler(
        conversationId: string,
        conversationType: string
    ): (chunk: string) => void {
        return (chunk: string) => {
            try {
                // 确保chunk是有效字符串
                if (typeof chunk !== 'string') {
                    logger.warn(`收到非字符串数据块: ${typeof chunk}`);
                    return;
                }

                // 记录数据块长度而非内容，避免大日志
                logger.debug(`发送AI响应数据块，长度: ${chunk.length}`);

                // 尝试发送数据块
                WebSocketServer.emitToRoom(`conversation_${conversationId}`, 'ai_response_chunk', {
                    chunk,
                    type: conversationType,
                });
            } catch (error: any) {
                logger.error(`发送AI响应数据块失败: ${error.message || error}`);
                // 继续处理下一个数据块
            }
        };
    }

    // 生成AI响应
    private static async generateAIResponse(
        messages: string[],
        conversation: IConversation,
        conversationType: string,
        streamHandler: (chunk: string) => void,
        contextData: any
    ): Promise<string> {
        try {
            logger.info(`开始调用AI处理服务...`);

            // 构造选项对象
            const options: any = {
                chunkCallback: streamHandler,
                consultationType: conversationType,
            };

            // 如果有上下文数据，添加到选项中
            if (Object.keys(contextData).length > 0) {
                options.additionalContext = JSON.stringify(contextData);
            }

            // 获取会话的消息记录
            const conversationMessages = await ConversationService.getConversationMessages(
                conversation.id
            );

            const aiResponse = await AiService.processConversationMessage(
                messages[messages.length - 1],
                conversationMessages.map(msg => ({
                    role: msg.role,
                    content: msg.content,
                })),
                options
            );
            logger.info(`AI处理服务调用成功, 响应长度: ${aiResponse?.length || 0}`);
            return aiResponse;
        } catch (error: any) {
            logger.error(`AI处理服务调用失败: ${error.message || error}, 堆栈: ${error.stack}`);
            return '抱歉，系统暂时无法处理您的请求，请稍后再试。';
        }
    }

    // 创建AI消息对象
    private static createAIMessage(
        conversationId: string,
        aiResponse: string,
        conversation: IConversation
    ): any {
        return {
            id: generateMessageId(),
            conversationId: conversationId,
                content: aiResponse,
            role: 'system' as const,
            metadata: {},
            consultationId: conversation.consultationId,
            timestamp: new Date(),
        };
    }

    // 保存用户消息和AI响应到数据库并广播完成事件
    private static async saveMessagePair(
        socket: Socket,
        conversationId: string,
        userMessages: string[],
        aiMessage: IConversationMessage,
        conversationType: string
    ): Promise<void> {
        try {
            logger.info(`准备添加消息对到会话...`);

            // 获取会话以获取userId
            const conversation = await ConversationService.getConversationById(conversationId);

            // 使用新的批量添加方法同时保存用户消息和AI响应
            const userMessageObjects = userMessages.map(
                content =>
                    ({
                        conversationId: conversationId,
                        content,
                        role: 'user' as const,
                        timestamp: new Date(),
                        consultationId: conversation.consultationId,
                        id: generateMessageId(),
                metadata: {},
                    }) as IConversationMessage
            );

            const updatedConversation = await ConversationService.addMessagePair(
                userMessageObjects[0],
                aiMessage
            );

            // 在发送前获取最新消息
            const latestMessages =
                await ConversationService.getConversationMessages(conversationId);
            logger.info(`获取到 ${latestMessages.length} 条最新消息`);

            const conversationWithMessages = {
                ...updatedConversation.toObject(),
                messages: latestMessages,
            };

            // 发送AI响应完成事件
            logger.info(`发送AI响应完成事件到房间: conversation_${conversationId}`);

            await WebSocketServer.emitToRoom(
                `conversation_${conversationId}`,
                'ai_response_complete',
                { 
                    conversation: conversationWithMessages,
                    conversationType,
                }
            );

            logger.info(`AI响应流程完成`);
        } catch (error: any) {
            logger.error(`保存消息对或发送完成事件失败: ${error.message || error}`);

            // 尝试单独保存AI消息，作为后备方案
            try {
                logger.info(`尝试单独保存AI消息...`);
                const updatedConversation = await ConversationService.addMessage(aiMessage);

                await WebSocketServer.emitToRoom(
                    `conversation_${conversationId}`,
                    'ai_response_complete',
                    {
                        conversation: updatedConversation,
                        conversationType,
                    }
                );
            } catch (secondError: any) {
                logger.error(`备用方案也失败: ${secondError.message || secondError}`);
                this.sendSimpleCompletionNotification(socket, error);
            }
        }
    }

    // 发送简单完成通知（出错时的后备方案）
    private static sendSimpleCompletionNotification(socket: Socket, error: any): void {
        try {
            socket.emit('ai_response_complete', {
                message: '消息已处理，但保存失败',
                error: error.message,
            });
        } catch (innerError: any) {
            logger.error(`发送简单完成通知也失败: ${innerError.message || innerError}`);
        }
    }
}
