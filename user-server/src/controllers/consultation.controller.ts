import { Request, Response } from 'express';
import ConsultationService from '../services/consultation.service';
import { ResponseHelper } from '../utils/response';

import { logger } from '../utils/logger';
import { ConsultationStatus } from '../interfaces/consultation.interface';
import { Type } from '../interfaces/conversation.interface';

/**
 * 会诊控制器
 * 处理会诊相关的HTTP请求
 */
class ConsultationController {
    /**
     * 创建新的会诊
     */
    static async createConsultation(req: Request, res: Response): Promise<void> {
        try {
            const {
                type,
                symptoms,
                bodyParts,
                duration,
                existingConditions,
                images,
                reportType,
                reportDate,
                hospital,
                reportImages,
                description,
                fee,
            } = req.body;
            const userId = req.user?.userId;

            logger.info(`Creating consultation: type=${type}, userId=${userId}`);

            if (!userId || !type || !symptoms || !fee) {
                ResponseHelper.badRequest(res, '缺少必要参数');
                return;
            }

            // 验证会诊类型是否有效
            if (!Object.values(type).includes(type)) {
                ResponseHelper.badRequest(res, '无效的会诊类型');
                return;
            }

            const consultation = await ConsultationService.createConsultation({
                userId: userId,
                type,
                symptoms,
                bodyParts,
                duration,
                existingConditions,
                images,
                reportType,
                reportDate,
                hospital,
                reportImages,
                description,
                fee,
            });
            ResponseHelper.success(res, {
                consultationId: consultation.id,
                status: consultation.status,
                createTime: consultation.createdAt,
            });
        } catch (error: any) {
            logger.error(`创建会诊失败: ${error.message}`);
            ResponseHelper.serverError(res, `创建会诊失败: ${error.message}`);
        }
    }

    /**
     * 获取会诊列表
     */
    static async getConsultationList(req: Request, res: Response): Promise<void> {
        try {
            const { userId, type, status, page, limit } = req.query;

            const result = await ConsultationService.getConsultationList({
                userId: userId as string,
                type: type as Type,
                status: status as ConsultationStatus,
                page: page ? parseInt(page as string) : undefined,
                limit: limit ? parseInt(limit as string) : undefined,
            });

            ResponseHelper.success(res, result);
        } catch (error: any) {
            logger.error(`获取会诊列表失败: ${error.message}`);
            ResponseHelper.serverError(res, `获取会诊列表失败: ${error.message}`);
        }
    }

    /**
     * 获取会诊详情
     */
    static async getConsultationDetails(req: Request, res: Response): Promise<void> {
        try {
            const { id } = req.params;

            if (!id) {
                ResponseHelper.badRequest(res, '缺少会诊ID');
                return;
            }

            const details = await ConsultationService.getConsultationDetails(id);

            if (!details) {
                ResponseHelper.notFound(res, '未找到会诊信息');
                return;
            }

            ResponseHelper.success(res, details);
            return;
        } catch (error: any) {
            logger.error(`获取会诊详情失败: ${error.message}`);
            ResponseHelper.serverError(res, `获取会诊详情失败: ${error.message}`);
        }
    }

    /**
     * 更新会诊
     */
    static async updateConsultation(req: Request, res: Response): Promise<void> {
        try {
            const { id } = req.params;
            const { diagnosis, prescription, notes, status, endTime, doctorAdvice } = req.body;

            if (!id) {
                ResponseHelper.badRequest(res, '缺少会诊ID');
                return;
            }
            const result = await ConsultationService.updateConsultation({
                consultationId: id,
                diagnosis,
                prescription,
                notes,
                status,
                endTime,
            });

            if (!result) {
                ResponseHelper.notFound(res, '未找到会诊信息');
            }

            ResponseHelper.success(res, {
                consultationId: result.id,
                status: result.status,
                message: '会诊更新成功',
            });
        } catch (error: any) {
            logger.error(`更新会诊失败: ${error.message}`);
            ResponseHelper.serverError(res, `更新会诊失败: ${error.message}`);
        }
    }

    /**
     * 获取患者的会诊列表
     */
    static async getUserConsultations(req: Request, res: Response): Promise<void> {
        try {
            const userId = req.user?.userId;
            const { page, limit } = req.query;

            if (!userId) {
                ResponseHelper.badRequest(res, '无法识别患者身份，请重新登录');
                return;
            }

            const result = await ConsultationService.getPatientConsultations(
                userId,
                page ? parseInt(page as string) : 1,
                limit ? parseInt(limit as string) : 10
            );

            ResponseHelper.success(res, result);
        } catch (error: any) {
            logger.error(`获取患者会诊列表失败: ${error.message}`);
            ResponseHelper.serverError(res, `获取患者会诊列表失败: ${error.message}`);
        }
    }
}

export default ConsultationController;
