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
import fs from 'fs';
import path from 'path';
import PDFDocument from 'pdfkit';
import { PatientPreDiagnosisInfo, ReportInfo } from './ai.service';

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
                throw new Error('会话不存在');
            }
            
            // 检查会话是否已关闭
            if (conversation.status === 'CLOSED') {
                throw new Error('会话已关闭，无法添加新消息');
            }
            
            // 添加消息
            const message: IConversationMessage = {
                content,
                senderType,
                timestamp: new Date(),
                metadata
            };
            
            conversation.messages.push(message);
            await conversation.save();
            
            // 如果是用户消息，自动生成AI回复
            if (senderType === SenderType.PATIENT) {
                await this.generateAiResponse(conversation);
            }
            
            return conversation;
        } catch (error : any) {
            logger.error(`添加消息失败: ${error}`);
            throw new Error(`添加消息失败: ${error.message}`);
        }
    }
    
    /**
     * 生成AI回复
     * @param conversation 会话对象
     * @returns 更新后的会话对象
     */
    private static async generateAiResponse(conversation: IConversation): Promise<IConversation> {
        try {
            // 获取会话历史
            const conversationHistory = conversation.messages.map(msg => ({
                role: msg.senderType === SenderType.PATIENT ? 'user' : 'assistant',
                content: msg.content
            }));
            
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
                    aiResponse = '抱歉，我无法理解您的问题。';
            }
            
            // 添加AI回复消息
            conversation.messages.push({
                content: aiResponse,
                senderType: SenderType.AI,
                timestamp: new Date()
            });
            
            await conversation.save();
            return conversation;
        } catch (error) {
            logger.error(`生成AI回复失败: ${error}`);
            
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
                symptoms: prediagnosis.symptoms,
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
     * 导出会话历史记录
     * @param params 导出参数
     * @returns 导出文件的路径
     */
    static async exportConversationHistory(params: ExportConversationRequest): Promise<string> {
        try {
            const { conversationId, format = 'PDF' } = params;
            
            // 获取会话
            const conversation = await Conversation.findById(conversationId);
            if (!conversation) {
                throw new Error('会话不存在');
            }
            
            // 创建导出目录
            const exportDir = path.join(__dirname, '../../exports');
            if (!fs.existsSync(exportDir)) {
                fs.mkdirSync(exportDir, { recursive: true });
            }
            
            let exportPath = '';
            
            // 根据格式导出会话历史
            if (format === 'PDF') {
                exportPath = await this.exportToPdf(conversation, exportDir);
            } else {
                exportPath = await this.exportToText(conversation, exportDir);
            }
            
            return exportPath;
        } catch (error : any) {
            logger.error(`导出会话历史失败: ${error}`);
            throw new Error(`导出会话历史失败: ${error.message}`);
        }
    }
    
    /**
     * 导出会话历史为PDF
     * @param conversation 会话对象
     * @param exportDir 导出目录
     * @returns PDF文件路径
     */
    private static async exportToPdf(conversation: IConversation, exportDir: string): Promise<string> {
        return new Promise((resolve, reject) => {
            try {
                const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
                const filePath = path.join(exportDir, `conversation_${conversation._id}_${timestamp}.pdf`);
                
                // 创建PDF文档
                const doc = new PDFDocument();
                const stream = fs.createWriteStream(filePath);
                
                doc.pipe(stream);
                
                // 添加标题
                doc.fontSize(16).text('对话历史记录', { align: 'center' });
                doc.moveDown();
                
                // 添加会话信息
                doc.fontSize(12).text(`会话类型: ${conversation.conversationType}`);
                doc.text(`创建时间: ${conversation.createdAt.toLocaleString()}`);
                doc.text(`状态: ${conversation.status}`);
                doc.moveDown();
                
                // 添加消息记录
                conversation.messages.forEach((msg, index) => {
                    const sender = msg.senderType === SenderType.PATIENT ? '患者' : 
                                  msg.senderType === SenderType.AI ? 'AI助手' : '系统';
                    
                    doc.fontSize(10).text(`[${msg.timestamp.toLocaleString()}] ${sender}:`);
                    doc.fontSize(12).text(msg.content);
                    doc.moveDown();
                });
                
                // 添加页脚
                doc.fontSize(8).text(`导出时间: ${new Date().toLocaleString()}`, { align: 'right' });
                
                doc.end();
                
                stream.on('finish', () => {
                    resolve(filePath);
                });
                
                stream.on('error', (err) => {
                    reject(err);
                });
            } catch (error) {
                reject(error);
            }
        });
    }
    
    /**
     * 导出会话历史为文本文件
     * @param conversation 会话对象
     * @param exportDir 导出目录
     * @returns 文本文件路径
     */
    private static async exportToText(conversation: IConversation, exportDir: string): Promise<string> {
        try {
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            const filePath = path.join(exportDir, `conversation_${conversation._id}_${timestamp}.txt`);
            
            let content = '=== 对话历史记录 ===\n\n';
            
            // 添加会话信息
            content += `会话类型: ${conversation.conversationType}\n`;
            content += `创建时间: ${conversation.createdAt.toLocaleString()}\n`;
            content += `状态: ${conversation.status}\n\n`;
            
            // 添加消息记录
            conversation.messages.forEach((msg) => {
                const sender = msg.senderType === SenderType.PATIENT ? '患者' : 
                              msg.senderType === SenderType.AI ? 'AI助手' : '系统';
                
                content += `[${msg.timestamp.toLocaleString()}] ${sender}:\n`;
                content += `${msg.content}\n\n`;
            });
            
            // 添加导出信息
            content += `\n导出时间: ${new Date().toLocaleString()}`;
            
            // 写入文件
            fs.writeFileSync(filePath, content, 'utf8');
            
            return filePath;
        } catch (error) {
            throw error;
        }
    }
}

export default ConversationService; 