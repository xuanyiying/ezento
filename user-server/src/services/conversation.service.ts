import mongoose from 'mongoose';
import { Conversation } from '../models/Conversation';
import { 
    IConversation, 
    IConversationMessage, 
    ConversationType, 
    SenderType,
    CreateConversationRequest,
    AddMessageRequest,
    GetConversationHistoryRequest,
    ExportConversationRequest
} from '../interfaces/conversation.interface';
import logger from '../config/logger';
import { AiService } from './ai.service';
import PreDiagnosis from '../models/PreDiagnosis';
import Report from '../models/Report';
import { ConversationRedisService } from './conversation.redis.service';
import { PatientPreDiagnosisInfo, ReportInfo } from './ai.service';
import * as fs from 'fs';
import * as path from 'path';
import PDFDocument from 'pdfkit';

/**
 * 会话服务类，处理AI多轮对话相关功能
 */
class ConversationService {
    /**
     * 创建新会话或返回已存在的会话
     * @param params 创建会话的参数
     * @returns 会话对象
     */
    static async createOrGetConversation(params: CreateConversationRequest): Promise<IConversation> {
        try {
            const { conversationType, referenceId, patientId, initialMessage } = params;
            
            // 检查会话是否已存在
            let conversation = await Conversation.findOne({
                conversationType,
                referenceId: new mongoose.Types.ObjectId(referenceId)
            });
            
            // 如果会话不存在，则创建新会话
            if (!conversation) {
                conversation = new Conversation({
                    conversationType,
                    referenceId: new mongoose.Types.ObjectId(referenceId),
                    patientId: new mongoose.Types.ObjectId(patientId),
                    messages: [],
                    status: 'ACTIVE'
                });
                
                // 如果提供了初始消息，添加系统欢迎消息
                if (initialMessage) {
                    conversation.messages.push({
                        content: initialMessage,
                        senderType: SenderType.SYSTEM,
                        timestamp: new Date()
                    });
                }
                
                await conversation.save();
            }
            
            return conversation;
        } catch (error : any) {
            logger.error(`创建会话失败: ${error}`);
            throw new Error(`创建会话失败: ${error.message}`);
        }
    }
    
    /**
     * 添加消息到会话
     * @param params 添加消息的参数
     * @returns 添加后的会话对象
     */
    static async addMessage(params: AddMessageRequest): Promise<IConversation> {
        try {
            const { conversationId, content, senderType, metadata } = params;
            
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
            
            // 添加消息
            const message: IConversationMessage = {
                content,
                senderType,
                timestamp: new Date(),
                metadata
            };
            
            // 保存到Redis
            await ConversationRedisService.saveMessage(
                conversationId,
                message
            );
            
            conversation.messages.push(message);
            await conversation.save();
            
            // 如果是用户消息，自动生成AI回复（仅在REST API模式下）
            // WebSocket模式下，AI回复由WebSocketController处理
            if (senderType === SenderType.PATIENT) {
                await this.generateAiResponse(conversation);
            }
            
            return conversation;
        } catch (error : any) {
            logger.error(`添加消息失败: ${error.message || error}`);
            throw new Error(`添加消息失败: ${error.message}`);
        }
    }

    
    /**
     * 生成AI回复（WebSocket流式响应版本）
     * @param conversation 会话对象
     * @param onChunk 处理每个响应块的回调函数
     * @returns 更新后的会话对象
     */
    public static async generateStreamingAiResponse(
        conversation: IConversation,
        onChunk: (chunk: string) => void
    ): Promise<IConversation> {
        try {
            // 获取会话历史
            const conversationHistory = conversation.messages.map(msg => {
                let role: 'user' | 'assistant' | 'system';
                if (msg.senderType === SenderType.PATIENT) {
                    role = 'user';
                } else if (msg.senderType === SenderType.AI) {
                    role = 'assistant';
                } else {
                    role = 'system';
                }
                return {
                    role,
                    content: msg.content
                };
            });
            
            // 获取最后一条用户消息
            const lastUserMessage = conversation.messages
                .filter(msg => msg.senderType === SenderType.PATIENT)
                .pop();
                
            if (!lastUserMessage) {
                return conversation;
            }
            
            let aiResponse = '';
            
            // 根据会话类型生成不同的AI回复
            try {
                // 通知客户端AI开始响应
                onChunk('AI_RESPONSE_START');
                
                const streamResponse = await AiService.generateStreamingResponse(
                    lastUserMessage.content,
                    conversationHistory,
                    conversation.conversationType,
                    conversation.referenceId.toString()
                );

                for await (const chunk of streamResponse) {
                    aiResponse += chunk;
                    onChunk(chunk);
                }
                
                // 通知客户端AI响应结束
                onChunk('AI_RESPONSE_END');
            } catch (error: any) {
                logger.error(`生成AI流式响应失败: ${error.message || error}`);
                aiResponse = '抱歉，系统暂时无法处理您的请求，请稍后再试。';
                onChunk(aiResponse);
                onChunk('AI_RESPONSE_END');
            }
            
            // 添加AI回复消息到Redis和MongoDB
            const aiMessage = {
                content: aiResponse,
                senderType: SenderType.AI,
                timestamp: new Date()
            };

            // 保存到Redis
            await ConversationRedisService.saveMessage(
                conversation._id.toString(),
                aiMessage
            );

            // 保存到MongoDB
            conversation.messages.push({
                content: aiResponse,
                senderType: SenderType.AI,
                timestamp: new Date()
            });
            
            await conversation.save();
            return conversation;
        } catch (error: any) {
            logger.error(`生成AI回复失败: ${error.message || error}`);
            
            // 添加错误提示消息
            const errorMessage = {
                content: '抱歉，系统暂时无法处理您的请求，请稍后再试。',
                senderType: SenderType.AI,
                timestamp: new Date()
            };
            
            conversation.messages.push(errorMessage);
            
            // 尝试保存到Redis
            try {
                await ConversationRedisService.saveMessage(
                    conversation._id.toString(),
                    errorMessage
                );
            } catch (redisError: any) {
                logger.error(`保存错误消息到Redis失败: ${redisError.message || redisError}`);
            }
            
            await conversation.save();
            return conversation;
        }
    }
    
    /**
     * 生成AI回复（非流式版本，用于REST API）
     * @param conversation 会话对象
     * @returns 更新后的会话对象
     */
    public static async generateAiResponse(conversation: IConversation): Promise<IConversation> {
        try {
            // 获取会话历史
            const conversationHistory = conversation.messages.map(msg => {
                let role: 'user' | 'assistant' | 'system';
                if (msg.senderType === SenderType.PATIENT) {
                    role = 'user';
                } else if (msg.senderType === SenderType.AI) {
                    role = 'assistant';
                } else {
                    role = 'system';
                }
                return {
                    role,
                    content: msg.content
                };
            });
            
            // 获取最后一条用户消息
            const lastUserMessage = conversation.messages
                .filter(msg => msg.senderType === SenderType.PATIENT)
                .pop();
                
            if (!lastUserMessage) {
                return conversation;
            }
            
            let aiResponse = '';
            
            // 根据会话类型生成不同的AI回复
            switch (conversation.conversationType) {
                case ConversationType.PRE_DIAGNOSIS:
                    aiResponse = await this.generatePreDiagnosisResponse(
                        conversation.referenceId.toString(),
                        lastUserMessage.content,
                        conversationHistory
                    );
                    break;
                    
                case ConversationType.GUIDE:
                    aiResponse = await this.generateGuideResponse(
                        lastUserMessage.content,
                        conversationHistory
                    );
                    break;
                    
                case ConversationType.REPORT:
                    aiResponse = await this.generateReportResponse(
                        conversation.referenceId.toString(),
                        lastUserMessage.content,
                        conversationHistory
                    );
                    break;
                    
                default:
                    aiResponse = '抱歉，不支持的会话类型。';
            }
            
            // 添加AI回复消息
            conversation.messages.push({
                content: aiResponse,
                senderType: SenderType.AI,
                timestamp: new Date()
            });
            
            await conversation.save();
            return conversation;
        } catch (error: any) {
            logger.error(`生成AI回复失败: ${error.message || error}`);
            
            // 添加错误提示消息
            conversation.messages.push({
                content: '抱歉，系统暂时无法处理您的请求，请稍后再试。',
                senderType: SenderType.AI,
                timestamp: new Date()
            });
            
            await conversation.save();
            return conversation;
        }
    }
    
    /**
     * 生成预问诊场景的AI回复
     * @param prediagnosisId 预问诊ID
     * @param userMessage 用户消息
     * @param conversationHistory 会话历史
     * @returns AI回复文本
     */
    private static async generatePreDiagnosisResponse(
        prediagnosisId: string,
        userMessage: string,
        conversationHistory: Array<{role: string, content: string}>
    ): Promise<string> {
        try {
            // 获取预问诊信息
            const prediagnosis = await PreDiagnosis.findById(prediagnosisId);
            if (!prediagnosis) {
                return '抱歉，无法找到相关的预问诊记录。';
            }
            
            // 构建患者信息
            const patientInfo: PatientPreDiagnosisInfo = {
                symptoms: prediagnosis.symptoms ? [prediagnosis.symptoms] : [],
                bodyParts: prediagnosis.bodyParts,
                duration: prediagnosis.duration,
                existingConditions: prediagnosis.existingConditions
            };
            
            // 使用AI服务生成回复
            const systemPrompt = `你是一位经验丰富的医学顾问，正在回答关于症状初步分析的问题。请根据患者已提供的症状信息进行回答。
保持专业、准确，但不要给出确定的诊断。提供有用的健康建议和解释，同时鼓励患者及时就医。`;
            
            const result = await AiService.generateText({
                prompt: userMessage,
                systemPrompt,
                patientInfo: {
                    symptoms: patientInfo.symptoms,
                    medicalHistory: patientInfo.existingConditions
                },
                temperature: 0.7
            });
            
            return result.text;
        } catch (error) {
            logger.error(`生成预问诊回复失败: ${error}`);
            throw error;
        }
    }
    
    /**
     * 生成导诊场景的AI回复
     * @param userMessage 用户消息
     * @param conversationHistory 会话历史
     * @returns AI回复文本
     */
    private static async generateGuideResponse(
        userMessage: string,
        conversationHistory: Array<{role: string, content: string}>
    ): Promise<string> {
        try {
            // 使用AI服务生成回复
            const systemPrompt = `你是一位专业的医疗导诊助手，帮助患者了解应该去哪个科室就诊。
提供专业的科室推荐和就诊建议，但不要给出具体的诊断和治疗方案。
回答应该简洁明了，重点突出推荐科室和就诊建议。`;
            
            const result = await AiService.generateText({
                prompt: userMessage,
                systemPrompt,
                temperature: 0.7
            });
            
            return result.text;
        } catch (error) {
            logger.error(`生成导诊回复失败: ${error}`);
            throw error;
        }
    }
    
    /**
     * 生成报告解读场景的AI回复
     * @param reportId 报告ID
     * @param userMessage 用户消息
     * @param conversationHistory 会话历史
     * @returns AI回复文本
     */
    private static async generateReportResponse(
        reportId: string,
        userMessage: string,
        conversationHistory: Array<{role: string, content: string}>
    ): Promise<string> {
        try {
            // 获取报告信息
            const report = await Report.findById(reportId);
            if (!report) {
                return '抱歉，无法找到相关的报告记录。';
            }
            
            // 构建报告信息
            const reportInfo: ReportInfo = {
                reportType: report.reportType,
                reportDate: report.reportDate.toISOString().split('T')[0],
                hospital: report.hospital,
                description: report.description,
                reportContent: report.aiInterpretation?.content || '报告内容不可用'
            };
            
            // 使用AI服务生成回复
            const systemPrompt = `你是一位专业的医学报告解读专家，正在帮助患者理解医疗报告的内容。
基于提供的报告信息，用通俗易懂的语言解释报告结果和意义。不要给出确定的诊断或治疗方案，但可以解释异常指标的含义。
保持专业、客观，并在必要时建议患者咨询医生以获取进一步的建议。`;
            
            const result = await AiService.generateText({
                prompt: userMessage,
                systemPrompt,
                temperature: 0.7
            });
            
            return result.text;
        } catch (error) {
            logger.error(`生成报告解读回复失败: ${error}`);
            throw error;
        }
    }
    
    /**
     * 获取会话历史记录
     * @param params 获取历史记录的参数
     * @returns 会话对象
     */
    static async getConversationHistory(params: GetConversationHistoryRequest): Promise<IConversation> {
        try {
            const { conversationType, referenceId } = params;
            
            const conversation = await Conversation.findOne({
                conversationType,
                referenceId: new mongoose.Types.ObjectId(referenceId)
            });
            
            if (!conversation) {
                throw new Error('会话不存在');
            }
            
            return conversation;
        } catch (error : any) {
            logger.error(`获取会话历史失败: ${error}`);
            throw new Error(`获取会话历史失败: ${error.message}`);
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
        } catch (error : any) {
            logger.error(`关闭会话失败: ${error}`);
            throw new Error(`关闭会话失败: ${error.message}`);
        }
    }
    
    /**
     * 生成标准病历
     * @param conversationId 会话ID
     * @returns 生成的病历内容
     */
    static async generateMedicalRecord(conversationId: string): Promise<string> {
        try {
            // 查找会话
            const conversation = await Conversation.findById(conversationId);
            if (!conversation) {
                logger.error(`生成标准病历失败: 会话不存在 [conversationId=${conversationId}]`);
                throw new Error('会话不存在');
            }
            
            // 只处理预问诊类型的会话
            if (conversation.conversationType !== ConversationType.PRE_DIAGNOSIS) {
                logger.error(`生成标准病历失败: 只有预问诊会话可以生成病历 [conversationId=${conversationId}, type=${conversation.conversationType}]`);
                throw new Error('只有预问诊会话可以生成病历');
            }
            
            // 获取会话历史
            const conversationHistory = conversation.messages.map(msg => {
                let role: 'user' | 'assistant' | 'system';
                if (msg.senderType === SenderType.PATIENT) {
                    role = 'user';
                } else if (msg.senderType === SenderType.AI) {
                    role = 'assistant';
                } else {
                    role = 'system';
                }
                return {
                    role,
                    content: msg.content
                };
            });
            
            // 使用AI服务生成标准病历
            const systemPrompt = `你是一位经验丰富的医生，需要根据患者的描述和对话历史，生成一份标准的病历记录。
病历应包含：主诉、现病史、既往史、个人史、家族史、体格检查、初步诊断等标准病历要素。
请使用专业医学术语，保持客观准确。`;
            
            const result = await AiService.generateText({
                prompt: '请根据我们的对话生成一份标准病历',
                systemPrompt,
                conversationHistory,
                temperature: 0.3
            });
            
            return result.text;
        } catch (error: any) {
            logger.error(`生成标准病历失败: ${error.message || error}`);
            throw new Error(`生成标准病历失败: ${error.message}`);
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
                
                conversation.messages.forEach((message, index) => {
                    const sender = message.senderType === SenderType.PATIENT ? '患者' :
                                message.senderType === SenderType.AI ? 'AI助手' : '系统';
                    
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
                    const sender = message.senderType === SenderType.PATIENT ? '患者' :
                                message.senderType === SenderType.AI ? 'AI助手' : '系统';
                    
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