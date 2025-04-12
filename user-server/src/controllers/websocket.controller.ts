import { Socket } from 'socket.io';
import { WebSocketServer } from '../config/socket';
import ConversationService from '../services/conversation.service';
import logger from '../config/logger';
import { AiService } from '../services/ai/ai.service';
import mongoose from 'mongoose';
import { Department, Doctor } from '../models';
import { IConversation, IConversationMessage } from '../interfaces/conversation.interface';

export class WebSocketController {
    static async handleConnection(socket: Socket): Promise<void> {
        try {
            const userId = socket.handshake.auth.userId;
            if (!userId) {
                logger.warn(`Connection attempt without userId: ${socket.id}`);
                socket.disconnect();
                return;
            }
            // 加入用户私人房间
            await WebSocketServer.joinRoom(socket.id, `user_${userId}`);

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
            this.handleJoinConversation(socket, userId, conversationId));

        // 处理离开会话房间
        socket.on('leave_conversation', (conversationId: string) => 
            this.handleLeaveConversation(socket, userId, conversationId));

        // 处理新消息
        socket.on('new_message', (data: {
            conversationId: string;
            content: string;
            metadata?: any;
            conversationType: string;
        }) => this.handleMessage(socket, data, userId));

        // 处理断开连接
        socket.on('disconnect', () => {
            logger.info(`User ${userId} disconnected`);
        });
    }

    // 处理加入会话房间
    private static async handleJoinConversation(socket: Socket, userId: string, conversationId: string): Promise<void> {
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
    private static async handleLeaveConversation(socket: Socket, userId: string, conversationId: string): Promise<void> {
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
    static async handleMessage(socket: Socket, data: {
        conversationId: string;
        content: string;
        metadata?: any;
        conversationType: string;
    }, userId: string): Promise<void> {
        try {
            // 1. 验证输入数据
            const { conversationId, content, metadata, conversationType } = data;
            if (!this.validateMessageData(socket, userId, conversationId, content)) {
                return;
            }

            // 2. 获取会话信息
            const conversation = await this.getConversation(socket, conversationId);
            if (!conversation) return;

            // 3. 构建用户消息对象
            const userMessage = this.createUserMessage(conversationId, content, metadata, conversation);
            
            // 4. 广播接收到的用户消息（但尚未保存到数据库）
            await this.broadcastUserMessage(conversationId, userMessage, conversation);

            // 5. 准备AI服务所需的上下文数据
            const contextData = await this.prepareContextData(conversationType, metadata);

            // 6. 构建流式响应处理器
            const streamHandler = this.createStreamHandler(conversationId, conversationType);

            // 7. 生成AI响应
            const aiResponse = await this.generateAIResponse(content, conversation, conversationType, streamHandler, contextData);
            
            // 8. 构建AI消息对象
            const aiMessage = this.createAIMessage(conversationId, aiResponse, conversation);
            
            // 9. 将用户消息和AI响应一起保存到数据库
            await this.saveMessagePair(socket, conversationId, userMessage, aiMessage, conversationType);
            
        } catch (error: any) {
            this.handleMessageError(socket, error);
        }
    }

    // 验证消息数据
    private static validateMessageData(socket: Socket, userId: string, conversationId: string, content: string): boolean {
        if (!conversationId || !content) {
            logger.warn(`New message attempt with invalid data by user ${userId}`);
            socket.emit('error', { message: '消息内容不能为空' });
            return false;
        }
        
        logger.info(`用户消息详情 - userId: ${userId}, conversationId: ${conversationId}`, `消息内容: ${content}`);
        return true;
    }

    // 获取会话
    private static async getConversation(socket: Socket, conversationId: string): Promise<IConversation | null> {
        try {
            return await ConversationService.get(conversationId);
        } catch (error: any) {
            logger.error(`获取会话失败: ${error.message || error}`);
            socket.emit('error', { message: '获取会话失败，请刷新页面重试' });
            return null;
        }
    }

    // 创建用户消息对象
    private static createUserMessage(conversationId: string, content: string, metadata: any, conversation: IConversation): any {
        return {
            conversationId: new mongoose.Types.ObjectId(conversationId),
            content,
            role: 'user' as const,
            metadata,
            referenceId: conversation.referenceId,
            timestamp: new Date()
        };
    }

    // 保存用户消息到数据库并广播
    private static async broadcastUserMessage(conversationId: string, userMessage: any, conversation: IConversation): Promise<void> {
        try {
            // 仅广播用户消息，不保存到数据库（稍后在完整流程结束后保存）
            logger.info(`准备广播用户消息到会话房间: conversation_${conversationId}`);
            
            await WebSocketServer.emitToRoom(
                `conversation_${conversationId}`,
                'message_received',
                {
                    message: userMessage,
                    conversation
                }
            );
            logger.info(`已成功广播用户消息到会话房间: conversation_${conversationId}`);
        } catch (error: any) {
            logger.error(`广播用户消息失败: ${error.message || error}`);
            // 继续处理，不中断流程
        }
    }

    // 准备上下文数据
    private static async prepareContextData(conversationType: string, metadata: any): Promise<any> {
        const additionalData: any = {};
        
        try {
            if (conversationType === 'GUIDE') {
                // 导诊需要科室和医生数据
                const departments = await Department.find().lean();
                const doctors = await Doctor.find()
                    .populate('departmentId')
                    .populate('schedules')
                    .lean();
                
                additionalData.departments = departments;
                additionalData.doctors = doctors;
                logger.info(`已加载导诊所需数据: ${departments.length}个科室, ${doctors.length}个医生`);
            } 
            else if (conversationType === 'REPORT_INTERPRETATION' && metadata && metadata.reportId) {
                // 报告解读需要报告数据
                additionalData.reportData = {
                    reportType: metadata.reportType,
                    description: metadata.description,
                    reportImages: metadata.reportImages,
                    hospital: metadata.hospital,
                    reportDate: metadata.reportDate
                };
                logger.info(`已加载报告解读所需数据: ${metadata.reportId}`);
            }
        } catch (error: any) {
            logger.error(`准备额外数据失败: ${error.message || error}`);
            // 继续处理
        }
        
        return additionalData;
    }

    // 创建流式响应处理器
    private static createStreamHandler(conversationId: string, conversationType: string): (chunk: string) => void {
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
                WebSocketServer.emitToRoom(
                    `conversation_${conversationId}`,
                    'ai_response_chunk',
                    { 
                        chunk, 
                        type: conversationType 
                    }
                );
            } catch (error: any) {
                logger.error(`发送AI响应数据块失败: ${error.message || error}`);
                // 继续处理下一个数据块
            }
        };
    }

    // 生成AI响应
    private static async generateAIResponse(
        content: string, 
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
                consultationType: conversationType
            };
            
            // 如果有上下文数据，添加到选项中
            if (Object.keys(contextData).length > 0) {
                options.additionalContext = JSON.stringify(contextData);
            }
            
            const aiResponse = await AiService.processConversationMessage(
                content,
                conversation.messages.map(msg => ({
                    role: msg.role,
                    content: msg.content
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
    private static createAIMessage(conversationId: string, aiResponse: string, conversation: IConversation): any {
        return {
            conversationId: new mongoose.Types.ObjectId(conversationId),
            content: aiResponse,
            role: 'system' as const,
            metadata: {},
            referenceId: conversation.referenceId,
            timestamp: new Date()
        };
    }

    // 保存用户消息和AI响应到数据库并广播完成事件
    private static async saveMessagePair(
        socket: Socket, 
        conversationId: string, 
        userMessage: IConversationMessage, 
        aiMessage: IConversationMessage, 
        conversationType: string
    ): Promise<void> {
        try {
            logger.info(`准备添加消息对到会话...`);
            
            // 使用新的批量添加方法同时保存用户消息和AI响应
            const updatedConversation = await ConversationService.addMessagePair(userMessage, aiMessage);
            
            logger.info(`消息对已成功添加到会话 ${conversationId}`);

            // 发送AI响应完成事件
            logger.info(`发送AI响应完成事件到房间: conversation_${conversationId}`);
            
            await WebSocketServer.emitToRoom(
                `conversation_${conversationId}`,
                'ai_response_complete',
                { 
                    conversation: updatedConversation,
                    conversationType
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
                        conversationType
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
                message: '消息已处理，但保存失败' 
            });
        } catch (innerError: any) {
            logger.error(`发送简单完成通知也失败: ${innerError.message || innerError}`);
        }
    }

    // 处理消息过程中的错误
    private static handleMessageError(socket: Socket, error: any): void {
        logger.error(`处理消息时发生严重错误: ${error.message || error}`);
        logger.error(`错误堆栈: ${error.stack}`);
        
        try {
            socket.emit('error', { message: '消息处理失败，请稍后重试' });
        } catch (emitError: any) {
            logger.error(`无法向客户端发送错误通知: ${emitError.message || emitError}`);
        }
    }
}