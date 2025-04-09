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
                await this.handleMessage(socket, data, userId);
            });
            // 预问诊
            socket.on('pre_diagnosis', async (data: {
                conversationId: string;
                content: string;
                metadata?: any;
                conversationType: string;
            }) => {
                await this.handleMessage(socket, data, userId);
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
            const { conversationId, content, metadata, conversationType } = data;
            
            if (!conversationId || !content) {
                logger.warn(`New message attempt with invalid data by user ${userId}`);
                socket.emit('error', { message: '消息内容不能为空' });
                return;
            }

            logger.info(`User ${userId} sent ${conversationType} message to conversation ${conversationId}`);
            let conversation = await ConversationService.get(conversationId);
            // 添加用户消息到会话
            const userMessage = {
                conversationId: new mongoose.Types.ObjectId(conversationId),
                content,
                senderType: SenderType.PATIENT,
                metadata,
                referenceId: conversation.referenceId,
                timestamp: new Date()
            };
            
             conversation = await ConversationService.addMessage(userMessage);

            // 广播消息到会话房间
            await WebSocketServer.emitToRoom(
                `conversation_${conversationId}`,
                'message_received',
                {
                    message: conversation.messages[conversation.messages.length - 1],
                    conversation
                }
            );

            // 根据会话类型处理不同的AI响应
            let aiResponse: string;
            let additionalData: any = {};
            
            // 准备特定类型会话所需的数据
            if (conversationType === 'GUIDE') {
                // 导诊需要科室和医生数据
                const departments = await Department.find().lean();
                const doctors = await Doctor.find()
                    .populate('departmentId')
                    .populate('schedules')
                    .lean();
                
                additionalData = { departments, doctors };
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
                
            }

            // 统一处理AI响应
            const streamHandler = (chunk: string) => {
                WebSocketServer.emitToRoom(
                    `conversation_${conversationId}`,
                    'ai_response_chunk',
                    { 
                        chunk, 
                        type: conversationType 
                    }
                );
            };
            
            aiResponse = await AiService.processConversationMessage(
                userId,
                conversationId,
                content,
                conversationType,
                streamHandler,
                Object.keys(additionalData).length > 0 ? additionalData : undefined
            );

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
            const updatedConversation = await ConversationService.addMessage(aiMessage);

            // 发送AI响应完成事件
            await WebSocketServer.emitToRoom(
                `conversation_${conversationId}`,
                'ai_response_complete',
                { 
                    conversation: updatedConversation,
                    conversationType
                }
            );
        } catch (error: any) {
            logger.error(`Error handling new message: ${error.message || error}`);
            socket.emit('error', { message: '消息处理失败' });
        }
    }
}