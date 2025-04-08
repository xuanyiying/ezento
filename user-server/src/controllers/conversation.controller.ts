import { Request, Response } from 'express';
import ConversationService from '../services/conversation.service';
import { ResponseUtil } from '../utils/responseUtil';
import { SenderType, ConversationType } from '../interfaces/conversation.interface';
import logger from '../config/logger';

/**
 * 会话控制器
 * 处理会话相关的HTTP请求
 */
class ConversationController {
    /**
     * 创建新会话或获取已存在的会话
     */
    static async createOrGetConversation(req: Request, res: Response): Promise<void> {
        try {
            const { conversationType, referenceId, initialMessage } = req.body;
            const patientId = req.user?.userId;

            logger.info(`Creating conversation: type=${conversationType}, refId=${referenceId}, userId=${patientId}`);

            if (!patientId || !conversationType || !referenceId) {
                ResponseUtil.badRequest(res, '缺少必要参数');
                return;
            }

            // 验证会话类型是否有效
            if (!Object.values(ConversationType).includes(conversationType)) {
                ResponseUtil.badRequest(res, '无效的会话类型');
                return;
            }

            const conversation = await ConversationService.createOrGetConversation({
                conversationType,
                referenceId,
                patientId,
                initialMessage
            });

            ResponseUtil.success(res, conversation);
        } catch (error: any) {
            logger.error(`创建会话失败: ${error.message}`);
            ResponseUtil.serverError(res, `创建会话失败: ${error.message}`);
        }
    }

    /**
     * 向会话添加新消息
     */
    static async addMessage(req: Request, res: Response): Promise<void> {
        try {
            const { conversationId } = req.params;
            const { content, metadata } = req.body;
            const patientId = req.user?.userId;

            logger.info(`Adding message: conversationId=${conversationId}, userId=${patientId}, content=${content?.substring(0, 30)}...`);

            if (!patientId || !conversationId || !content) {
                ResponseUtil.badRequest(res, '缺少必要参数');
                return;
            }

            const conversation = await ConversationService.addMessage({
                conversationId,
                content,
                senderType: SenderType.PATIENT,
                metadata
            });

            ResponseUtil.success(res, conversation);
        } catch (error: any) {
            logger.error(`添加消息失败: ${error.message}`);
            ResponseUtil.serverError(res, `添加消息失败: ${error.message}`);
        }
    }

    /**
     * 获取会话历史记录
     */
    static async getConversationHistory(req: Request, res: Response): Promise<void> {
        try {
            const { conversationType, referenceId } = req.params;
            const patientId = req.user?.userId;

            logger.info(`Getting conversation history: type=${conversationType}, refId=${referenceId}, userId=${patientId}`);

            if (!patientId || !conversationType || !referenceId) {
                ResponseUtil.badRequest(res, '缺少必要参数');
                return;
            }

            // 验证会话类型是否有效
            if (!Object.values(ConversationType).includes(conversationType as ConversationType)) {
                ResponseUtil.badRequest(res, '无效的会话类型');
                return;
            }

            const conversation = await ConversationService.getConversationHistory({
                conversationType: conversationType as ConversationType,
                referenceId
            });

            ResponseUtil.success(res, conversation);
        } catch (error: any) {
            logger.error(`获取会话历史失败: ${error.message}`);
            ResponseUtil.serverError(res, `获取会话历史失败: ${error.message}`);
        }
    }

    /**
     * 关闭会话
     */
    static async closeConversation(req: Request, res: Response): Promise<void> {
        try {
            const { conversationId } = req.params;

            logger.info(`Closing conversation: conversationId=${conversationId}`);

            if (!conversationId) {
                ResponseUtil.badRequest(res, '缺少会话ID');
                return;
            }

            const success = await ConversationService.closeConversation(conversationId);

            if (success) {
                ResponseUtil.success(res, { message: '会话已成功关闭' });
            } else {
                ResponseUtil.notFound(res, '会话不存在或已关闭');
            }
        } catch (error: any) {
            logger.error(`关闭会话失败: ${error.message}`);
            ResponseUtil.serverError(res, `关闭会话失败: ${error.message}`);
        }
    }

    /**
     * 导出会话历史记录
     */
    static async exportConversation(req: Request, res: Response): Promise<void> {
        try {
            const { conversationId } = req.params;
            const { format = 'PDF' } = req.query;

            logger.info(`Exporting conversation: conversationId=${conversationId}, format=${format}`);

            if (!conversationId) {
                ResponseUtil.badRequest(res, '缺少会话ID');
                return;
            }

            // 验证导出格式是否有效
            if (format !== 'PDF' && format !== 'TEXT') {
                ResponseUtil.badRequest(res, '无效的导出格式，只支持 PDF 或 TEXT');
                return;
            }

            const filePath = await ConversationService.exportConversationHistory({
                conversationId,
                format: format as 'PDF' | 'TEXT'
            });

            // 返回文件下载链接
            ResponseUtil.success(res, { filePath, downloadUrl: `/api/conversation/download?path=${encodeURIComponent(filePath)}` });
        } catch (error: any) {
            logger.error(`导出会话历史失败: ${error.message}`);
            ResponseUtil.serverError(res, `导出会话历史失败: ${error.message}`);
        }
    }

    /**
     * 下载导出的文件
     */
    static async downloadExportedFile(req: Request, res: Response): Promise<void> {
        try {
            const { path } = req.query;

            logger.info(`Downloading file: path=${path}`);

            if (!path || typeof path !== 'string') {
                ResponseUtil.badRequest(res, '缺少文件路径');
                return;
            }

            // 发送文件
            res.download(path, (err) => {
                if (err) {
                    logger.error(`文件下载失败: ${err.message}`);
                    ResponseUtil.serverError(res, '文件下载失败');
                }
            });
        } catch (error: any) {
            logger.error(`文件下载失败: ${error.message}`);
            ResponseUtil.serverError(res, `文件下载失败: ${error.message}`);
        }
    }
}

export default ConversationController; 