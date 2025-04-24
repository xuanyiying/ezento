import { Conversation } from '../models/Conversation';
import {
    IConversation,
    IConversationMessage,
    CreateConversationRequest,
    AddMessageRequest,
    ExportConversationRequest,
    Types,
} from '../interfaces/conversation.interface';
import logger from '../config/logger';
import { ConversationRedisService } from './conversation.redis.service';
import * as fs from 'fs';
import * as path from 'path';
import PDFDocument from 'pdfkit';
import { generateConversationId, generateMessageId } from '../utils/idGenerator';
import { Consultation, Message } from '../models';
import ConsultationService from './consultation.service';

/**
 * 会话服务类，处理AI多轮对话相关功能
 */
class ConversationService {
    static async deleteConversation(conversationId: string, userId: string) {
        // 检查会话是否存在且属于当前用户
        const conversation = await Conversation.findOne({
            id: conversationId,
            userId
        });

        if (!conversation) {
            logger.error(`删除会话失败: 会话不存在 [conversationId=${conversationId}]`);
            throw new Error('会话不存在');
        }
        // 删除会诊记录
        await Consultation.deleteOne({ conversationId, userId, id: conversation.consultationId });
        // 删除会话的消息记录
        await Message.deleteMany({ conversationId });
        // 删除会话
        await Conversation.deleteOne({ id: conversationId });

    }
    static async getConversationById(conversationId: string): Promise<IConversation> {
        const conversation = await Conversation.findOne({ id: conversationId });
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
    static async createOrGetConversation(
        params: CreateConversationRequest
    ): Promise<IConversation | null> {
        try {
            const { conversationId, type, userId, initialMessage } = params;

            if (!userId) {
                throw new Error('必须提供userId');
            }

            // 如果提供了具体的conversationId，则查找对应会话
            let conversation = null;
            if (conversationId) {
                conversation = await Conversation.findOne({ id: conversationId ,status: 'ACTIVE' });
                if (conversation) {
                    return conversation;
                } else {
                    logger.warn(`会话不存在，尝试使用关联ID创建新会话 [conversationId=${conversationId}]`);
                }
            } else {
                // 创建一个新的咨询会话
                const consultationId = params.consultationId || generateConversationId(); // 如果没有提供，则生成一个新的 ID
                const consultation = await ConsultationService.createConsultation({
                    id: consultationId,
                    userId,
                    type: type as Types,
                    symptoms: '',
                    fee: 0,
                });
                // 创建一个新的会话 - 不再包含messages字段
                const conversationId = generateConversationId();
                const conversationData = {
                    id: conversationId,
                    type,
                    consultationId: consultation.id, // 设置 consultationId
                    userId,
                    status: 'ACTIVE',
                    startTime: new Date(),
                };

                // 保存新会话到数据库
                conversation = await Conversation.create(conversationData);
                conversation.id = conversationId;
                logger.info(
                    `新会话创建成功，会话ID: ${conversation.id}，类型: ${type}，用户ID: ${userId}，consultationId: ${consultation.id}`
                );

                // 如果提供了初始消息，创建系统欢迎消息并单独保存到Message集合
                if (initialMessage) {
                    const messageData = {
                        id: generateMessageId(),
                        content: initialMessage,
                        role: 'system' as const,
                        timestamp: new Date(),
                        conversationId: conversation.id,
                        consultationId: consultation.id,
                        metadata: {},
                    };

                    // 创建新消息并存储在独立的消息集合中
                    await Message.create(messageData);

                    // 保存消息到Redis缓存
                    await ConversationRedisService.saveMessage(conversation.id, messageData);
                }
                return conversation;
            }
            return conversation;
        } catch (error: any) {
            logger.error(`ConversationService.createOrGetConversation 创建会话失败: ${error}`);
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
    static async addMessage(params: AddMessageRequest): Promise<IConversation> {
        try {
            const { conversationId, content, role, metadata } = params;

            // 查找会话，使用 id 字段而不是 _id
            const conversation = await Conversation.findOne({ id: conversationId });
            if (!conversation) {
                logger.error(`添加消息失败: 会话不存在 [conversationId=${conversationId}]`);
                throw new Error('会话不存在');
            }

            // 检查会话是否已关闭
            if (conversation.status === 'CLOSED') {
                logger.error(
                    `添加消息失败: 会话已关闭，无法添加新消息 [conversationId=${conversationId}, status=${conversation.status}]`
                );
                throw new Error('会话已关闭，无法添加新消息');
            }

            // 构造消息对象
            const message = {
                id: generateMessageId(),
                conversationId,
                content,
                role: role === 'user' ? ('user' as const) : ('system' as const),
                timestamp: new Date(),
                consultationId: conversation.consultationId, // 使用会话的 consultationId
                metadata: metadata || {},
            };

            logger.info(
                `准备添加消息: ${JSON.stringify({
                    id: message.id,
                    conversationId: message.conversationId,
                    consultationId: message.consultationId,
                    role: message.role,
                })}`
            );

            // 先保存到Redis缓存，实现快速访问
            await ConversationRedisService.saveMessage(conversationId, message);

            // 消息直接保存到MongoDB的Messages集合，不再保存到conversation的messages数组
            await Message.create(message);

            // 更新会话的最后修改时间，但不存储消息
            conversation.updatedAt = new Date();
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
    static async addMessagePair(
        userMessage: IConversationMessage,
        aiMessage: IConversationMessage
    ): Promise<IConversation> {
        try {
            const conversationId = userMessage.conversationId;

            // 查找会话，使用 id 字段而不是 _id
            const conversation = await Conversation.findOne({ id: conversationId });
            if (!conversation) {
                logger.error(`添加消息对失败: 会话不存在 [conversationId=${conversationId}]`);
                throw new Error('会话不存在');
            }

            // 检查会话是否已关闭
            if (conversation.status === 'CLOSED') {
                logger.error(`添加消息对失败: 会话已关闭 [conversationId=${conversationId}]`);
                throw new Error('会话已关闭，无法添加新消息');
            }

            // 确保消息有正确的 consultationId
            userMessage.consultationId = conversation.consultationId;
            aiMessage.consultationId = conversation.consultationId;

            logger.info(
                `准备添加消息对: ${JSON.stringify({
                    conversationId,
                    userMessageId: userMessage.id,
                    aiMessageId: aiMessage.id,
                    consultationId: conversation.consultationId,
                })}`
            );

            // 保存用户消息到Redis
            await ConversationRedisService.saveMessage(conversationId, userMessage);

            // 保存AI消息到Redis
            await ConversationRedisService.saveMessage(conversationId, aiMessage);

            // 保存消息到MongoDB
            await Message.create(userMessage);
            await Message.create(aiMessage);

            // 更新会话的最后修改时间
            conversation.updatedAt = new Date();
            await conversation.save();

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
        return new Promise(async (resolve, reject) => {
            try {
                // 获取会话的消息记录
                const messages = await Message.find({
                    conversationId: conversation.id,
                }).sort({ timestamp: 1 });

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
                doc.fontSize(12).text(`会话类型: ${conversation.type}`);
                doc.text(`创建时间: ${conversation.createdAt.toLocaleString()}`);
                doc.text(`状态: ${conversation.status === 'ACTIVE' ? '活跃' : '已关闭'}`);
                doc.moveDown();

                // 添加消息记录
                doc.fontSize(14).text('消息记录:', { underline: true });
                doc.moveDown();

                messages.forEach(message => {
                    const sender =
                        message.role === 'user'
                            ? '患者'
                            : message.role === 'system'
                                ? '系统'
                                : '管理员';

                    doc.fontSize(10).text(`${sender} (${message.timestamp.toLocaleString()})`, {
                        continued: true,
                    });
                    doc.fontSize(12).text(`:`, { underline: false });
                    doc.fontSize(11).text(message.content);
                    doc.moveDown();
                });

                // 添加页脚
                doc.fontSize(8).text(`导出时间: ${new Date().toLocaleString()}`, {
                    align: 'right',
                });

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
    private static async generateTextFile(
        conversation: IConversation,
        filePath: string
    ): Promise<void> {
        return new Promise(async (resolve, reject) => {
            try {
                // 获取会话的消息记录
                const messages = await Message.find({
                    conversationId: conversation.id,
                }).sort({ timestamp: 1 });

                let content = '会话历史记录\n';
                content += '=================\n\n';

                // 添加会话信息
                content += `会话类型: ${conversation.type}\n`;
                content += `创建时间: ${conversation.createdAt.toLocaleString()}\n`;
                content += `状态: ${conversation.status === 'ACTIVE' ? '活跃' : '已关闭'}\n\n`;

                // 添加消息记录
                content += '消息记录:\n';
                content += '-----------------\n\n';

                messages.forEach((message, index) => {
                    const sender =
                        message.role === 'user'
                            ? '患者'
                            : message.role === 'system'
                                ? '系统'
                                : '管理员';

                    content += `${sender} (${message.timestamp.toLocaleString()}):\n`;
                    content += `${message.content}\n\n`;
                });

                // 添加页脚
                content += `\n导出时间: ${new Date().toLocaleString()}`;

                // 写入文件
                fs.writeFile(filePath, content, err => {
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

    /**
     * 获取会话的消息记录
     * 从Message集合获取指定会话的所有消息
     *
     * @param conversationId 会话ID
     * @returns 会话消息数组
     */
    static async getConversationMessages(conversationId: string): Promise<IConversationMessage[]> {
        const messages = await Message.find({ conversationId }).sort({ timestamp: 1 });
        return messages;
    }

    /**
     * 获取用户的所有会话
     * 根据用户ID获取该用户的所有会话列表
     * 
     * @param userId 用户ID
     * @returns 会话列表
     */
    static async getUserConversations(userId: string): Promise<IConversation[]> {
        try {
            if (!userId) {
                throw new Error('必须提供userId');
            }

            const conversations = await Conversation.find({ userId })
                .sort({ updatedAt: -1 }); // 按更新时间倒序排列，最新的在前面

            return conversations;
        } catch (error) {
            logger.error('获取用户会话列表失败', error);
            throw error;
        }
    }
}

export default ConversationService;
