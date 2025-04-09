import { Request, Response } from 'express';
import ConsultationService from '../services/consultation.service';
import { ResponseUtil } from '../utils/responseUtil';
import { logger } from '../utils/logger';
import { ConsultationType, ConsultationStatus } from '../interfaces/consultation.interface';
import { Types } from 'mongoose';

/**
 * 会诊控制器
 * 处理会诊相关的HTTP请求
 */
class ConsultationController {
    /**
     * 创建新的会诊
     */
    static async createConsultation(req: Request, res: Response): Promise<Response> {
        try {
            const { 
                consultationType, 
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
                fee
            } = req.body;
            const patientId = req.user?.userId;

            logger.info(`Creating consultation: type=${consultationType}, userId=${patientId}`);

            if (!patientId || !consultationType || !symptoms || !fee) {
                return ResponseUtil.badRequest(res, '缺少必要参数');
            }

            // 验证会诊类型是否有效
            if (!Object.values(ConsultationType).includes(consultationType)) {
                return ResponseUtil.badRequest(res, '无效的会诊类型');
            }

            const validPatientId = Types.ObjectId.isValid(patientId) ? patientId : new Types.ObjectId();

            const consultation = await ConsultationService.createConsultation({
                userId: validPatientId.toString(),
                consultationType,
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
                fee
            });

            return ResponseUtil.success(res, {
                consultationId: consultation._id,
                status: consultation.status,
                createTime: consultation.createdAt
            });
        } catch (error: any) {
            logger.error(`创建会诊失败: ${error.message}`);
            return ResponseUtil.serverError(res, `创建会诊失败: ${error.message}`);
        }
    }

    /**
     * 获取会诊列表
     */
    static async getConsultationList(req: Request, res: Response): Promise<Response> {
        try {
            const { 
                patientId, 
                doctorId, 
                consultationType, 
                status, 
                page, 
                limit 
            } = req.query;

            const result = await ConsultationService.getConsultationList({
                patientId: patientId as string,
                doctorId: doctorId as string,
                consultationType: consultationType as ConsultationType,
                status: status as ConsultationStatus,
                page: page ? parseInt(page as string) : undefined,
                limit: limit ? parseInt(limit as string) : undefined
            });

            return ResponseUtil.success(res, result);
        } catch (error: any) {
            logger.error(`获取会诊列表失败: ${error.message}`);
            return ResponseUtil.serverError(res, `获取会诊列表失败: ${error.message}`);
        }
    }

    /**
     * 获取会诊详情
     */
    static async getConsultationDetails(req: Request, res: Response): Promise<Response> {
        try {
            const { id } = req.params;
            
            if (!id) {
                return ResponseUtil.badRequest(res, '缺少会诊ID');
            }

            const details = await ConsultationService.getConsultationDetails(id);

            if (!details) {
                return ResponseUtil.notFound(res, '未找到会诊信息');
            }

            return ResponseUtil.success(res, details);
        } catch (error: any) {
            logger.error(`获取会诊详情失败: ${error.message}`);
            return ResponseUtil.serverError(res, `获取会诊详情失败: ${error.message}`);
        }
    }

    /**
     * 更新会诊
     */
    static async updateConsultation(req: Request, res: Response): Promise<Response> {
        try {
            const { id } = req.params;
            const { 
                diagnosis, 
                prescription, 
                notes, 
                status, 
                endTime, 
                doctorAdvice 
            } = req.body;
            const doctorId = req.user?.userId;

            if (!id) {
                return ResponseUtil.badRequest(res, '缺少会诊ID');
            }

            if (!doctorId) {
                return ResponseUtil.badRequest(res, '无法识别医生身份，请重新登录');
            }

            const result = await ConsultationService.updateConsultation({
                consultationId: id,
                diagnosis,
                prescription,
                notes,
                status,
                endTime,
                doctorAdvice: doctorAdvice ? {
                    ...doctorAdvice,
                    doctorId: doctorId.toString()
                } : undefined
            });

            if (!result) {
                return ResponseUtil.notFound(res, '未找到会诊信息');
            }

            return ResponseUtil.success(res, {
                consultationId: result._id,
                status: result.status,
                message: '会诊更新成功'
            });
        } catch (error: any) {
            logger.error(`更新会诊失败: ${error.message}`);
            return ResponseUtil.serverError(res, `更新会诊失败: ${error.message}`);
        }
    }

    /**
     * 获取患者的会诊列表
     */
    static async getPatientConsultations(req: Request, res: Response): Promise<Response> {
        try {
            const patientId = req.user?.userId;
            const { page, limit } = req.query;

            if (!patientId) {
                return ResponseUtil.badRequest(res, '无法识别患者身份，请重新登录');
            }

            const result = await ConsultationService.getPatientConsultations(
                patientId,
                page ? parseInt(page as string) : 1,
                limit ? parseInt(limit as string) : 10
            );

            return ResponseUtil.success(res, result);
        } catch (error: any) {
            logger.error(`获取患者会诊列表失败: ${error.message}`);
            return ResponseUtil.serverError(res, `获取患者会诊列表失败: ${error.message}`);
        }
    }

    /**
     * 获取医生的会诊列表
     */
    static async getDoctorConsultations(req: Request, res: Response): Promise<Response> {
        try {
            const doctorId = req.user?.userId;
            const { status, page, limit } = req.query;

            if (!doctorId) {
                return ResponseUtil.badRequest(res, '无法识别医生身份，请重新登录');
            }

            const result = await ConsultationService.getDoctorConsultations(
                doctorId,
                status as ConsultationStatus,
                page ? parseInt(page as string) : 1,
                limit ? parseInt(limit as string) : 10
            );

            return ResponseUtil.success(res, result);
        } catch (error: any) {
            logger.error(`获取医生会诊列表失败: ${error.message}`);
            return ResponseUtil.serverError(res, `获取医生会诊列表失败: ${error.message}`);
        }
    }

    /**
     * 提交医生建议
     */
    static async submitDoctorAdvice(req: Request, res: Response): Promise<Response> {
        try {
            const { consultationId, advice, recommendDepartment, urgencyLevel } = req.body;
            const doctorId = req.user?.userId;

            if (!consultationId || !advice) {
                return ResponseUtil.badRequest(res, '缺少必要参数');
            }

            if (!doctorId) {
                return ResponseUtil.badRequest(res, '无法识别医生身份，请重新登录');
            }

            const result = await ConsultationService.submitDoctorAdvice(
                consultationId,
                doctorId,
                advice,
                recommendDepartment,
                urgencyLevel
            );

            if (!result) {
                return ResponseUtil.notFound(res, '未找到会诊信息');
            }

            return ResponseUtil.success(res, {
                consultationId: result._id,
                status: result.status,
                message: '医生建议提交成功'
            });
        } catch (error: any) {
            logger.error(`提交医生建议失败: ${error.message}`);
            return ResponseUtil.serverError(res, `提交医生建议失败: ${error.message}`);
        }
    }
}

export default ConsultationController; 