import { Conversation } from '../models/Conversation';
import {
    IConversation,
    IConversationMessage,
    ConversationType,
    CreateConversationRequest,
    AddMessageRequest,
    GetConversationHistoryRequest,
    ExportConversationRequest
} from '../interfaces/conversation.interface';
import logger from '../config/logger';
import { AiService } from './ai/ai.service';
import { ConversationRedisService } from './conversation.redis.service';
import * as fs from 'fs';
import * as path from 'path';
import PDFDocument from 'pdfkit';
import { User } from '../models';
import mongoose, { Document } from 'mongoose';

/**
 * 会话服务类，处理AI多轮对话相关功能
 */
class ConversationService {
    static async get(conversationId: string): Promise<IConversation> {
        const conversation = await Conversation.findById(conversationId);
        if (!conversation) {
            throw new Error('会话不存在');
        }
        return conversation;
    }
    /**
     * 创建新会话或返回已存在的会话
     * 本方法根据提供的参数查找现有会话，如果不存在则创建新会话
     * 
     * @param params 创建会话的参数，包含会话类型、关联ID、用户ID和初始消息等
     * @returns 会话对象（Mongoose文档）
     * @throws 如果未提供必要的用户ID或创建过程中出现错误
     */
    static async createOrGetConversation(params: CreateConversationRequest): Promise<Document<unknown, {}, IConversation> & IConversation & Required<{ _id: mongoose.Types.ObjectId }> & { __v: number }> {
        try {
            const { conversationId, conversationType, referenceId, userId, initialMessage } = params;
            // 使用userId作为用户标识符
            const userIdentifier = userId;
            
            if (!userIdentifier) {
                throw new Error('必须提供userId');
            }
            // 如果提供了具体的conversationId，则查找对应会话
            let conversation;
            if (conversationId) {
                conversation = await Conversation.findById(conversationId);
                if (conversation) {
                    logger.info(`找到现有会话，会话ID: ${conversation._id}`);
                    return conversation;
                }
            }

            // 创建一个新的会话
            conversation = new Conversation({
                conversationType,
                referenceId,
                userId: userIdentifier,
                messages: [],
                status: 'ACTIVE'
            });

            // 如果提供了初始消息，添加系统欢迎消息
            if (initialMessage) {
                conversation.messages.push({
                    content: initialMessage,
                    role: 'system',
                    timestamp: new Date(),
                    referenceId: referenceId?.toString() || '',
                    conversationId: conversation._id
                });
            }

            // 保存新会话到数据库
            await conversation.save();
            logger.info(`新会话创建成功，会话ID: ${conversation._id}，类型: ${conversationType}，用户ID: ${userIdentifier}`);

            return conversation;
        } catch (error: any) {
            logger.error(`创建会话失败: ${error}`);
            throw new Error(`创建会话失败: ${error.message}`);
        }
    }

    /**
     * 添加消息到现有会话
     * 本方法将消息添加到指定的会话中，并可能触发AI响应生成
     * 消息会同时保存到Redis缓存和MongoDB数据库
     * 
     * @param params 添加消息的参数，包含会话ID、消息内容、发送者类型等
     * @returns 更新后的会话对象
     * @throws 如果会话不存在、已关闭或添加消息过程中出现错误
     */
    static async addMessage(params: AddMessageRequest | IConversationMessage): Promise<IConversation> {
        try {
            const { conversationId, content, role, metadata, referenceId } = params;

            // 查找会话
            const conversation = await Conversation.findById(conversationId);
            if (!conversation) {
                logger.error(`添加消息失败: 会话不存在 [conversationId=${conversationId}]`);
                throw new Error('会话不存在');
            }

            // 检查会话是否已关闭
            if (conversation.status === 'CLOSED') {
                logger.error(`添加消息失败: 会话已关闭，无法添加新消息 [conversationId=${conversationId}, status=${conversation.status}]`);
                throw new Error('会话已关闭，无法添加新消息');
            }

            // 确保referenceId有效
            const validReferenceId = referenceId || conversation.referenceId?.toString() || '';

            // 构造消息对象
            const message: IConversationMessage = {
                content,
                role: role === 'user' ? 'user' : 'system',
                timestamp: new Date(),
                metadata,
                referenceId: validReferenceId,
                conversationId,
            };

            // 先保存到Redis缓存，实现快速访问
            await ConversationRedisService.saveMessage(
                conversationId.toString(),
                message
            );

            // 添加消息到会话
            conversation.messages.push(message);
            // 持久化到MongoDB
            await conversation.save();

            return conversation;
        } catch (error: any) {
            logger.error(`添加消息失败: ${error.message || error}`);
            throw new Error(`添加消息失败: ${error.message}`);
        }
    }

    /**
     * 批量添加消息到会话
     * 可以同时添加用户消息和AI响应
     * 
     * @param userMessage 用户消息
     * @param aiMessage AI响应消息
     * @returns 更新后的会话对象
     */
    static async addMessagePair(userMessage: IConversationMessage, aiMessage: IConversationMessage): Promise<IConversation> {
        try {
            const conversationId = userMessage.conversationId;
            
            // 查找会话
            const conversation = await Conversation.findById(conversationId);
            if (!conversation) {
                logger.error(`添加消息对失败: 会话不存在 [conversationId=${conversationId}]`);
                throw new Error('会话不存在');
            }

            // 检查会话是否已关闭
            if (conversation.status === 'CLOSED') {
                logger.error(`添加消息对失败: 会话已关闭 [conversationId=${conversationId}]`);
                throw new Error('会话已关闭，无法添加新消息');
            }

            // 保存用户消息到Redis
            await ConversationRedisService.saveMessage(
                conversationId.toString(),
                userMessage
            );

            // 保存AI消息到Redis
            await ConversationRedisService.saveMessage(
                conversationId.toString(),
                aiMessage
            );

            // 添加两条消息到会话
            conversation.messages.push(userMessage);
            conversation.messages.push(aiMessage);
            
            // 持久化到MongoDB
            await conversation.save();
            logger.info(`消息对已成功添加到会话 ${conversationId}`);

            return conversation;
        } catch (error: any) {
            logger.error(`添加消息对失败: ${error.message || error}`);
            throw new Error(`添加消息对失败: ${error.message}`);
        }
    }

    /**
     * 关闭会话
     * @param conversationId 会话ID
     * @returns 是否成功关闭
     */
    static async closeConversation(conversationId: string): Promise<boolean> {
        try {
            const result = await Conversation.updateOne(
                { _id: conversationId },
                { status: 'CLOSED' }
            );

            return result.modifiedCount > 0;
        } catch (error: any) {
            logger.error(`关闭会话失败: ${error}`);
            throw new Error(`关闭会话失败: ${error.message}`);
        }
    }

    /**
     * 导出会话历史记录
     * @param params 导出会话的参数
     * @returns 导出文件的路径
     */
    static async exportConversationHistory(params: ExportConversationRequest): Promise<string> {
        try {
            const { conversationId, format = 'PDF' } = params;

            // 查找会话
            const conversation = await Conversation.findById(conversationId);
            if (!conversation) {
                throw new Error('会话不存在');
            }

            // 创建导出目录
            const exportDir = path.join(__dirname, '../../exports');
            if (!fs.existsSync(exportDir)) {
                fs.mkdirSync(exportDir, { recursive: true });
            }

            // 生成文件名
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            const fileName = `conversation_${conversationId}_${timestamp}`;
            let filePath = '';

            if (format === 'PDF') {
                filePath = path.join(exportDir, `${fileName}.pdf`);
                await this.generatePDF(conversation, filePath);
            } else {
                filePath = path.join(exportDir, `${fileName}.txt`);
                await this.generateTextFile(conversation, filePath);
            }

            return filePath;
        } catch (error: any) {
            logger.error(`导出会话历史失败: ${error.message || error}`);
            throw new Error(`导出会话历史失败: ${error.message}`);
        }
    }

    /**
     * 生成PDF格式的会话历史记录
     * @param conversation 会话对象
     * @param filePath 文件保存路径
     */
    private static async generatePDF(conversation: IConversation, filePath: string): Promise<void> {
        return new Promise((resolve, reject) => {
            try {
                const doc = new PDFDocument();
                const stream = fs.createWriteStream(filePath);

                // 设置文件结束时的回调
                stream.on('finish', () => {
                    resolve();
                });

                doc.pipe(stream);

                // 添加标题
                doc.fontSize(18).text('会话历史记录', { align: 'center' });
                doc.moveDown();

                // 添加会话信息
                doc.fontSize(12).text(`会话类型: ${conversation.conversationType}`);
                doc.text(`创建时间: ${conversation.createdAt.toLocaleString()}`);
                doc.text(`状态: ${conversation.status === 'ACTIVE' ? '活跃' : '已关闭'}`);
                doc.moveDown();

                // 添加消息记录
                doc.fontSize(14).text('消息记录:', { underline: true });
                doc.moveDown();

                conversation.messages.forEach((message) => {
                    const sender = message.role === 'user' ? '患者' :
                        message.role === 'system' ? '系统' : '管理员';

                    doc.fontSize(10).text(`${sender} (${message.timestamp.toLocaleString()})`, { continued: true });
                    doc.fontSize(12).text(`:`, { underline: false });
                    doc.fontSize(11).text(message.content);
                    doc.moveDown();
                });

                // 添加页脚
                doc.fontSize(8).text(`导出时间: ${new Date().toLocaleString()}`, { align: 'right' });

                // 结束文档
                doc.end();
            } catch (error: any) {
                reject(error);
            }
        });
    }

    /**
     * 生成文本格式的会话历史记录
     * @param conversation 会话对象
     * @param filePath 文件保存路径
     */
    private static async generateTextFile(conversation: IConversation, filePath: string): Promise<void> {
        return new Promise((resolve, reject) => {
            try {
                let content = '会话历史记录\n';
                content += '=================\n\n';

                // 添加会话信息
                content += `会话类型: ${conversation.conversationType}\n`;
                content += `创建时间: ${conversation.createdAt.toLocaleString()}\n`;
                content += `状态: ${conversation.status === 'ACTIVE' ? '活跃' : '已关闭'}\n\n`;

                // 添加消息记录
                content += '消息记录:\n';
                content += '-----------------\n\n';

                conversation.messages.forEach((message, index) => {
                    const sender = message.role === 'user' ? '患者' :
                        message.role === 'system' ? '系统' : '管理员';

                    content += `${sender} (${message.timestamp.toLocaleString()}):\n`;
                    content += `${message.content}\n\n`;
                });

                // 添加页脚
                content += `\n导出时间: ${new Date().toLocaleString()}`;

                // 写入文件
                fs.writeFile(filePath, content, (err) => {
                    if (err) {
                        reject(err);
                    } else {
                        resolve();
                    }
                });
            } catch (error: any) {
                reject(error);
            }
        });
    }
}

export default ConversationService;
