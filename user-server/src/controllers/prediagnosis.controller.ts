import { Request, Response } from 'express';
import logger from '../config/logger';
import { ResponseUtil } from '../utils/responseUtil';
import PrediagnosisService from '../services/prediagnosis.service';
import { PreDiagnosisDocument, PreDiagnosisListItem } from '../interfaces/prediagnosis.interface';

export class PreDiagnosisController {
    /**
     * 提交新的预诊断
     */
    static submitPrediagnosis(req: Request, res: Response): void {
        const { patientId, symptoms, duration, bodyParts, images, existingConditions } = req.body;

        if (!patientId || !symptoms || !duration) {
            ResponseUtil.badRequest(res, '缺少必填字段：患者ID、症状描述和持续时间');
            return;
        }

        PrediagnosisService.createPrediagnosis({
            patientId,
            symptoms,
            duration,
            bodyParts,
            images,
            existingConditions
        })
            .then(prediagnosis => {
                ResponseUtil.success(res, {
                    prediagnosisId: prediagnosis._id,
                    status: prediagnosis.status,
                    createTime: prediagnosis.createTime
                });
            })
            .catch(error => {
                logger.error(`提交预诊断错误: ${error}`);
                ResponseUtil.serverError(res, '提交预诊断失败，请稍后重试');
            });
    }

    /**
     * 获取患者的预诊断列表
     */
    static getPrediagnosisList(req: Request, res: Response): void {
        const { patientId } = req.query;
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 10;

        if (!patientId) {
            ResponseUtil.badRequest(res, '患者ID为必填参数');
            return;
        }

        PrediagnosisService.getPrediagnosisList(patientId as string, page, limit)
            .then(result => {
                ResponseUtil.success(res, result);
            })
            .catch(error => {
                logger.error(`获取预诊断列表错误: ${error}`);
                ResponseUtil.serverError(res, '获取预诊断列表失败，请稍后重试');
            });
    }

    /**
     * 获取预诊断详情
     */
    static getPrediagnosisDetails(req: Request, res: Response): void {
        const { id } = req.params;
        
        PrediagnosisService.getPrediagnosisDetails(id)
            .then(details => {
                if (!details) {
                    ResponseUtil.notFound(res, '未找到预诊断信息');
                    return;
                }

                ResponseUtil.success(res, details);
            })
            .catch(error => {
                logger.error(`获取预诊断详情错误: ${error}`);
                ResponseUtil.serverError(res, '获取预诊断详情失败，请稍后重试');
            });
    }

    /**
     * 获取当前患者的所有预诊断
     */
    static getPatientPreDiagnoses(req: Request, res: Response): void {
        const patientId = req.user?.userId;
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 10;

        if (!patientId) {
            ResponseUtil.badRequest(res, '无法识别患者身份，请重新登录');
            return;
        }

        PrediagnosisService.getPatientPreDiagnosis(patientId, page, limit)
            .then(({ prediagnoses, total }) => {
                // 格式化响应
                const formattedPreDiagnoses = prediagnoses.map((prediagnosis: PreDiagnosisListItem) => ({
                    ...prediagnosis,
                    patientId: patientId
                }));

                ResponseUtil.success(res, {
                    list: formattedPreDiagnoses,
                    total,
                    page,
                    limit
                });
            })
            .catch(error => {
                logger.error(`获取患者预诊断列表错误: ${error}`);
                ResponseUtil.serverError(res, '获取预诊断列表失败，请稍后重试');
            });
    }

    /**
     * 获取医生的所有预诊断
     */
    static getDoctorPreDiagnoses(req: Request, res: Response): void {
        const doctorId = req.user?.userId;
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 10;
        const status = req.query.status as string;

        if (!doctorId) {
            ResponseUtil.badRequest(res, '无法识别医生身份，请重新登录');
            return;
        }

        PrediagnosisService.getDoctorPreDiagnosis(status, page, limit)
            .then(({ prediagnoses, total }) => {
                // 格式化响应
                const formattedPreDiagnoses = prediagnoses.map((prediagnosis: PreDiagnosisDocument) => ({
                    ...prediagnosis.toObject(),
                    patientId: prediagnosis.patientId,
                    prediagnosisId: prediagnosis._id
                }));

                ResponseUtil.success(res, {
                    list: formattedPreDiagnoses,
                    total,
                    page,
                    limit
                });
            })
            .catch(error => {
                logger.error(`获取医生预诊断列表错误: ${error}`);
                ResponseUtil.serverError(res, '获取预诊断列表失败，请稍后重试');
            });
    }

    /**
     * 提交医生对预诊断的建议
     */
    static submitDoctorAdvice(req: Request, res: Response): void {
        const { prediagnosisId, advice, recommendDepartment, urgencyLevel } = req.body;

        if (!prediagnosisId || !advice) {
            ResponseUtil.badRequest(res, '缺少必填字段：预诊断ID、医生建议');
            return;
        }

        PrediagnosisService.submitDoctorAdvice(
            prediagnosisId,
            advice,
            recommendDepartment,
            urgencyLevel
        )
            .then(result => {
                const updatedPreDiagnosis = result as unknown as PreDiagnosisDocument | null;

                if (!updatedPreDiagnosis) {
                    ResponseUtil.notFound(res, '未找到预诊断信息');
                    return;
                }

                ResponseUtil.success(res, {
                    prediagnosisId: updatedPreDiagnosis._id,
                    status: updatedPreDiagnosis.status,
                    message: '医生建议提交成功'
                });
            })
            .catch(error => {
                logger.error(`提交医生建议错误: ${error}`);
                ResponseUtil.serverError(res, '提交医生建议失败，请稍后重试');
            });
    }
}

export default PreDiagnosisController;