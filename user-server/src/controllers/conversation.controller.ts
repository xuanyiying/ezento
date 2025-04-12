import { Request, Response } from 'express';
import { Message } from '../models';
import ConsultationService from '../services/consultation.service';
import ConversationService from '../services/conversation.service';
import { ResponseUtil } from '../utils/responseUtil';
import { logger } from '../utils/logger';
import mongoose from 'mongoose';
import { IConsultation } from '../interfaces/consultation.interface';
import path from 'path';
import fs from 'fs';

/**
 * 会话控制器
 * 处理AI聊天和预问诊对话
 */ 
class ConversationController {
    /**
     * 创建或获取会话
     * 根据会话类型和关联ID创建新会话或获取已存在的会话
     * 
     * @param req - 请求对象，包含conversationType、referenceId和initialMessage参数
     * @param res - 响应对象
     */
    static async createOrGetConversation(req: Request, res: Response): Promise<void> {
        try {
            // 从请求体中获取参数
            const { conversationType, referenceId: referenceId, initialMessage } = req.body;
            const userId = req.user?.userId;
            
            // 验证权限和必要参数
            if (!userId) {
                 ResponseUtil.unauthorized(res, '未授权，请先登录');
                 return;
            }
            
            if (!conversationType) {
                 ResponseUtil.error(res, 400, '会话类型不能为空');
                 return;
            }
            
            // 处理referenceId，如果为空则创建一个新的会诊
            let finalReferenceId = referenceId;
            if (!finalReferenceId) {
                // 创建新的会诊
                const consultationData = {
                    userId,
                    consultationType: conversationType,
                    symptoms: '',
                    fee: 0
                };
                
                const consultation = await ConsultationService.createConsultation(consultationData) as IConsultation;
                // @ts-ignore: MongoDB _id访问错误
                finalReferenceId = consultation._id.toString();
            }
            
            // 创建或获取会话
            const conversationData = {
                conversationType,
                referenceId: finalReferenceId,
                userId,
                initialMessage
            };
            
            const conversation = await ConversationService.createOrGetConversation(conversationData);
            
             ResponseUtil.success(res, conversation);
             return ;
        } catch (error) {
            logger.error('创建或获取会话失败', error);
             ResponseUtil.serverError(res, '创建或获取会话失败');
        }
    }
    
    /**
     * 添加消息
     * 向指定会话添加新消息
     * 
     * @param req - 请求对象，包含conversationId和消息内容
     * @param res - 响应对象
     */
    static async addMessage(req: Request, res: Response): Promise<void> {
        try {
            const { conversationId } = req.params;
            const { content, metadata } = req.body;
            const userId = req.user?.userId;
            
            if (!userId) {
                 ResponseUtil.unauthorized(res, '未授权，请先登录');
                 return;
            }
            
            if (!content) {
                 ResponseUtil.error(res, 400, '消息内容不能为空');
                 return;
            }
            
            // 创建添加消息的请求对象
            const addMessageRequest = {
                conversationId: new mongoose.Types.ObjectId(conversationId),
                content,
                role: 'user' as const,
                metadata,
                referenceId: '',
                timestamp: new Date()
            };
            
            const conversation = await ConversationService.addMessage(addMessageRequest);
            
             ResponseUtil.success(res, conversation);
        } catch (error) {
            logger.error('添加消息失败', error);
             ResponseUtil.serverError(res, '添加消息失败');
        }
    }
    
    /**
     * 获取会话历史
     * 获取指定会话的历史消息记录
     * 
     * @param req - 请求对象，包含conversationId参数
     * @param res - 响应对象
     */
    static async getConversationHistory(req: Request, res: Response): Promise<void> {
        try {
            const { conversationId } = req.params;
            const userId = req.user?.userId;
            
            if (!userId) {
                 ResponseUtil.unauthorized(res, '未授权，请先登录');
                 return;
            }
            
            const conversation = await ConversationService.get(conversationId);
            
            if (!conversation) {
                 ResponseUtil.notFound(res, '未找到会话');
                 return;
            }
            
            // 获取会话消息
            const messages = await Message.find({
                conversationId: conversation._id
            }).sort({ timestamp: 1 });
            
             ResponseUtil.success(res, {
                conversation,
                messages
            });
        } catch (error) {
            logger.error('获取会话历史失败', error);
             ResponseUtil.serverError(res, '获取会话历史失败');
        }
    }
    
    /**
     * 关闭会话
     * 将指定会话标记为已关闭状态
     * 
     * @param req - 请求对象，包含conversationId参数
     * @param res - 响应对象
     */
    static async closeConversation(req: Request, res: Response): Promise<void> {
        try {
            const { conversationId } = req.params;
            const userId = req.user?.userId;
            
            if (!userId) {
                 ResponseUtil.unauthorized(res, '未授权，请先登录');
                 return;
            }
            
            const success = await ConversationService.closeConversation(conversationId);
            
            if (!success) {
                 ResponseUtil.notFound(res, '未找到会话');
                 return;
            }
            
             ResponseUtil.success(res, { message: '会话已关闭' });
        } catch (error) {
            logger.error('关闭会话失败', error);
             ResponseUtil.serverError(res, '关闭会话失败');
        
        }
    }
    
    /**
     * 导出会话记录
     * 将会话历史记录导出为PDF或TEXT格式
     * 
     * @param req - 请求对象，包含conversationId和format参数
     * @param res - 响应对象
     */
    static async exportConversation(req: Request, res: Response): Promise<void> {
        try {
            const { conversationId } = req.params;
            const format = (req.query.format as 'PDF' | 'TEXT') || 'PDF';
            const userId = req.user?.userId;
            
            if (!userId) {
                 ResponseUtil.unauthorized(res, '未授权，请先登录');
                 return;
            }
            
            // 转换会话ID为ObjectId
            const exportRequest = {
                conversationId: new mongoose.Types.ObjectId(conversationId),
                format
            };
            
            const filePath = await ConversationService.exportConversationHistory(exportRequest);
            
             ResponseUtil.success(res, {
                filePath,
                downloadUrl: `/api/conversations/exports/download/${path.basename(filePath)}`
            });
        } catch (error) {
            logger.error('导出会话失败', error);
             ResponseUtil.serverError(res, '导出会话失败');
        }
    }
    
    /**
     * 下载导出的会话文件
     * 提供已导出的会话文件下载
     * 
     * @param req - 请求对象，包含filename参数
     * @param res - 响应对象
     */
    static async downloadExportedFile(req: Request, res: Response): Promise<Response | void> {
        try {
            const { filename } = req.params;
            const userId = req.user?.userId;
            
            if (!userId) {
                return ResponseUtil.unauthorized(res, '未授权，请先登录');
            }
            
            // 构建导出文件路径
            const exportDir = path.join(__dirname, '../../exports');
            const filePath = path.join(exportDir, filename);
            
            // 检查文件是否存在
            if (!fs.existsSync(filePath)) {
                return ResponseUtil.notFound(res, '未找到文件');
            }
            
            // 发送文件
            return res.download(filePath);
        } catch (error) {
            logger.error('下载导出文件失败', error);
            return ResponseUtil.serverError(res, '下载导出文件失败');
        }
    }
}

export default ConversationController; 