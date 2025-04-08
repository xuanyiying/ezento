import { Socket } from 'socket.io';
import { WebSocketServer } from '../config/socket';
import ConversationService from '../services/conversation.service';
import { SenderType, ConversationType } from '../interfaces/conversation.interface';
import logger from '../config/logger';
import { AiService } from '../services/ai.service';
import Report from '../models/Report';

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

            // 处理新消息
            socket.on('new_message', async (data: {
                conversationId: string;
                content: string;
                metadata?: any;
            }) => {
                try {
                    const { conversationId, content, metadata } = data;
                    
                    if (!conversationId || !content) {
                        logger.warn(`New message attempt with invalid data by user ${userId}`);
                        socket.emit('error', { message: '消息内容不能为空' });
                        return;
                    }

                    logger.info(`User ${userId} sent message to conversation ${conversationId}`);

                    // 添加用户消息到会话
                    const conversation = await ConversationService.addMessage({
                        conversationId,
                        content,
                        senderType: SenderType.PATIENT,
                        metadata
                    });

                    // 广播消息到会话房间
                    await WebSocketServer.emitToRoom(
                        `conversation_${conversationId}`,
                        'message_received',
                        {
                            message: conversation.messages[conversation.messages.length - 1],
                            conversation
                        }
                    );

                    // 触发AI响应
                    const aiResponse = await ConversationService.generateStreamingAiResponse(
                        conversation,
                        (chunk: string) => {
                            WebSocketServer.emitToRoom(
                                `conversation_${conversationId}`,
                                'ai_response_chunk',
                                { chunk }
                            );
                        }
                    );

                    // 发送AI响应完成事件
                    await WebSocketServer.emitToRoom(
                        `conversation_${conversationId}`,
                        'ai_response_complete',
                        { conversation: aiResponse }
                    );
                } catch (error: any) {
                    logger.error(`Error handling new message: ${error.message || error}`);
                    socket.emit('error', { message: '消息处理失败' });
                }
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
                    
                    // 更新报告内容
                    const report = await Report.findById(reportId);
                    if (!report) {
                        throw new Error('报告不存在');
                    }
                    
                    report.description = extractedText;
                    await report.save();
                    
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
}