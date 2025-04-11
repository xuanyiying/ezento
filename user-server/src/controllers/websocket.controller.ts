import { Socket } from 'socket.io';
import { WebSocketServer } from '../config/socket';
import ConversationService from '../services/conversation.service';
import { SenderType } from '../interfaces/conversation.interface';
import logger from '../config/logger';
import { AiService } from '../services/ai.service';
import mongoose from 'mongoose';
import { Department, Doctor } from '../models';

export class WebSocketController {
    static async handleConnection(socket: Socket): Promise<void> {
        try {
            const userId = socket.handshake.auth.userId;
            if (!userId) {
                logger.warn(`Connection attempt without userId: ${socket.id}`);
                socket.disconnect();
                return;
            }

            logger.info(`User ${userId} connected with socket ${socket.id}`);

            // 加入用户私人房间
            await WebSocketServer.joinRoom(socket.id, `user_${userId}`);
            logger.info(`User ${userId} joined personal room`);

            // 处理加入会话房间
            socket.on('join_conversation', async (conversationId: string) => {
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
            });

            // 处理离开会话房间
            socket.on('leave_conversation', async (conversationId: string) => {
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
            });

            // 使用handleMessage处理新消息事件
            socket.on('new_message', async (data: {
                conversationId: string;
                content: string;
                metadata?: any;
                conversationType: string;
            }) => {
                await WebSocketController.handleMessage(socket, data, userId);
            });
            // 预问诊
            socket.on('pre_diagnosis', async (data: {
                conversationId: string;
                content: string;
                metadata?: any;
                conversationType: string;
            }) => {
                await WebSocketController.handleMessage(socket, data, userId);
            });
            // 处理报告OCR解析
            socket.on('process_report', async (data: {
                reportId: string;
                imageBase64: string;
            }) => {
                try {
                    const { reportId, imageBase64 } = data;
                    
                    // 通知客户端OCR处理开始
                    socket.emit('ocr_processing', { status: 'started' });
                    
                    // 调用百度OCR API提取文本
                    const extractedText = await AiService.extractTextFromImage(imageBase64);
                                        
                    // 通知客户端OCR处理完成
                    socket.emit('ocr_processing', { 
                        status: 'completed',
                        text: extractedText,
                        reportId
                    });
                } catch (error: any) {
                    logger.error(`Error processing report OCR: ${error.message || error}`);
                    socket.emit('ocr_processing', { 
                        status: 'failed',
                        error: error.message || '处理失败'
                    });
                }
            });
            
            // 处理生成标准病历
            socket.on('generate_medical_record', async (data: {
                conversationId: string;
            }) => {
                try {
                    const { conversationId } = data;
                    
                    // 通知客户端生成开始
                    socket.emit('medical_record_generation', { status: 'started' });
                    
                    // 生成标准病历
                    const medicalRecord = await ConversationService.generateMedicalRecord(conversationId);
                    
                    // 通知客户端生成完成
                    socket.emit('medical_record_generation', { 
                        status: 'completed',
                        medicalRecord,
                        conversationId
                    });
                } catch (error: any) {
                    logger.error(`Error generating medical record: ${error.message || error}`);
                    socket.emit('medical_record_generation', { 
                        status: 'failed',
                        error: error.message || '生成失败'
                    });
                }
            });

            // 处理断开连接
            socket.on('disconnect', () => {
                logger.info(`User ${userId} disconnected`);
            });

        } catch (error: any) {
            logger.error(`WebSocket connection error: ${error.message || error}`);
            socket.disconnect();
        }
    }

    static async handleMessage(socket: Socket, data: {
        conversationId: string;
        content: string;
        metadata?: any;
        conversationType: string;
    }, userId: string): Promise<void> {
        try {
            // 记录所有收到的消息数据，用于调试
            logger.info(`收到消息: ${JSON.stringify({
                userId,
                conversationId: data.conversationId,
                content: data.content,
                conversationType: data.conversationType,
                metadata: data.metadata
            })}`);

            const { conversationId, content, metadata, conversationType } = data;
            
            if (!conversationId || !content) {
                logger.warn(`New message attempt with invalid data by user ${userId}`);
                socket.emit('error', { message: '消息内容不能为空' });
                return;
            }

            // 添加详细日志
            logger.info(`用户消息详情 - userId: ${userId}, conversationId: ${conversationId}, conversationType: ${conversationType}`);
            logger.info(`消息内容: ${content}`);
            logger.info(`元数据: ${JSON.stringify(metadata || {})}`);

            // 防止处理过程中的错误导致服务器崩溃
            let conversation;
            try {
                conversation = await ConversationService.get(conversationId);
            } catch (error: any) {
                logger.error(`获取会话失败: ${error.message || error}`);
                socket.emit('error', { message: '获取会话失败，请刷新页面重试' });
                return;
            }

            // 添加用户消息到会话
            const userMessage = {
                conversationId: new mongoose.Types.ObjectId(conversationId),
                content,
                senderType: SenderType.PATIENT,
                metadata,
                referenceId: conversation.referenceId,
                timestamp: new Date()
            };
            
            // 记录消息处理流程
            logger.info(`正在添加用户消息到会话 ${conversationId}`);
            
            try {
                conversation = await ConversationService.addMessage(userMessage);
                logger.info(`用户消息已成功添加到会话 ${conversationId}`);
            } catch (error: any) {
                logger.error(`添加消息到会话失败: ${error.message || error}`);
                socket.emit('error', { message: '保存消息失败，但会继续处理' });
                // 继续处理，不要中断整个流程
            }

            // 记录广播前信息
            logger.info(`准备广播消息到会话房间: conversation_${conversationId}`);
            
            try {
                // 广播消息到会话房间
                await WebSocketServer.emitToRoom(
                    `conversation_${conversationId}`,
                    'message_received',
                    {
                        message: conversation.messages[conversation.messages.length - 1],
                        conversation
                    }
                );
                logger.info(`已成功广播消息到会话房间: conversation_${conversationId}`);
            } catch (error: any) {
                logger.error(`广播消息失败: ${error.message || error}`);
                // 继续处理，不中断流程
            }

            // 根据会话类型处理不同的AI响应
            let aiResponse: string = '';
            let additionalData: any = {};
            
            try {
                // 准备特定类型会话所需的数据
                if (conversationType === 'GUIDE') {
                    try {
                        // 导诊需要科室和医生数据
                        const departments = await Department.find().lean();
                        const doctors = await Doctor.find()
                            .populate('departmentId')
                            .populate('schedules')
                            .lean();
                        
                        additionalData = { departments, doctors };
                        logger.info(`已加载导诊所需数据: ${departments.length}个科室, ${doctors.length}个医生`);
                    } catch (error: any) {
                        logger.error(`加载导诊数据失败: ${error.message || error}`);
                        // 不中断处理流程
                    }
                } 
                else if (conversationType === 'REPORT_INTERPRETATION' && metadata && metadata.reportId) {
                    // 报告解读需要报告数据
                    additionalData = {
                        reportData: {
                            reportType: metadata.reportType,
                            description: metadata.description,
                            reportImages: metadata.reportImages,
                            hospital: metadata.hospital,
                            reportDate: metadata.reportDate
                        }
                    };
                    logger.info(`已加载报告解读所需数据: ${metadata.reportId}`);
                }
            } catch (error: any) {
                logger.error(`准备额外数据失败: ${error.message || error}`);
                // 继续处理
            }

            // 统一处理AI响应
            logger.info(`准备处理AI响应 conversationType=${conversationType}`);
            
            // 增强流式处理器错误捕获
            const streamHandler = (chunk: string) => {
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
            
            try {
                logger.info(`开始调用AI处理服务...`);
                aiResponse = await AiService.processConversationMessage(
                    userId,
                    conversationId,
                    content,
                    conversationType,
                    streamHandler,
                    Object.keys(additionalData).length > 0 ? additionalData : undefined
                );
                logger.info(`AI处理服务调用成功, 响应长度: ${aiResponse?.length || 0}`);
            } catch (error: any) {
                logger.error(`AI处理服务调用失败: ${error.message || error}, 堆栈: ${error.stack}`);
                aiResponse = '抱歉，系统暂时无法处理您的请求，请稍后再试。';
            }

            // 为AI响应创建消息
            const aiMessage = {
                conversationId: new mongoose.Types.ObjectId(conversationId),
                content: aiResponse,
                senderType: SenderType.SYSTEM,
                metadata: {},
                referenceId: conversation.referenceId,
                timestamp: new Date()
            };
            
            // 更新会话
            try {
                logger.info(`准备添加AI响应到会话...`);
                const updatedConversation = await ConversationService.addMessage(aiMessage);
                logger.info(`AI响应已成功添加到会话 ${conversationId}`);

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
                logger.error(`保存AI响应或发送完成事件失败: ${error.message || error}`);
                // 尝试发送一个简单的完成通知
                try {
                    socket.emit('ai_response_complete', { 
                        message: '消息已处理，但保存失败' 
                    });
                } catch (innerError: any) {
                    logger.error(`发送简单完成通知也失败: ${innerError.message || innerError}`);
                }
            }
        } catch (error: any) {
            logger.error(`处理消息时发生严重错误: ${error.message || error}`);
            logger.error(`错误堆栈: ${error.stack}`);
            // 尝试通知客户端
            try {
                socket.emit('error', { message: '消息处理失败，请稍后重试' });
            } catch (emitError: any) {
                logger.error(`无法向客户端发送错误通知: ${emitError.message || emitError}`);
            }
        }
    }
}