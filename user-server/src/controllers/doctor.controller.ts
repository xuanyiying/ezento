import { NextFunction, Request, Response } from 'express';
import DoctorService from '../services/doctor.service';
import { DoctorCreateData, DoctorUpdateData } from '../interfaces/doctor.interface';
import logger from '../config/logger';
import { ResponseHelper } from '../utils/response';

/**
 * 医生管理控制器
 * 处理医生相关的API请求
 */
class DoctorController {
    public static async toggleAvailability(req: Request, res: Response): Promise<void> {
        try {
            const doctorId = req.params.doctorId;
            const forceRefresh = req.query.refresh === 'true';
            const doctor = await DoctorService.getDoctorById(doctorId, !forceRefresh);
            if (!doctor) {
                ResponseHelper.notFound(res, '医生不存在');
                return;
            }
            const updatedDoctor = await DoctorService.toggleAvailability(doctorId);
            ResponseHelper.success(res, updatedDoctor);
        } catch (error: any) {
            logger.error(`切换医生可用性失败: ${error.message}`);
            ResponseHelper.serverError(res, '切换医生可用性失败');
        }
    }
    /**
     * 获取所有医生
     * GET /api/doctors
     */
    public static async getAllDoctors(req: Request, res: Response): Promise<void> {
        try {
            const forceRefresh = req.query.refresh === 'true';
            const { total, doctors } = await DoctorService.getAllDoctors(!forceRefresh);

            ResponseHelper.success(res, {
                total,
                doctors,
            });
        } catch (error: any) {
            logger.error(`获取所有医生失败: ${error.message}`);
            ResponseHelper.serverError(res, '获取医生列表失败');
        }
    }

    /**
     * 根据ID获取医生
     * GET /api/doctors/:id
     */
    public static async getDoctorById(req: Request, res: Response): Promise<void> {
        try {
            const id = req.params.id;
            const forceRefresh = req.query.refresh === 'true';

            const doctor = await DoctorService.getDoctorById(id, !forceRefresh);

            if (!doctor) {
                ResponseHelper.notFound(res, '医生不存在');
                return;
            }

            ResponseHelper.success(res, doctor);
        } catch (error: any) {
            logger.error(`获取医生详情失败: ${error.message}`);
            ResponseHelper.serverError(res, '获取医生详情失败');
        }
    }

    /**
     * 创建医生
     * POST /api/doctors
     */
    public static async createDoctor(req: Request, res: Response): Promise<void> {
        try {
            const {
                userId,
                userData,
                departmentId,
                title,
                specialties,
                introduction,
                consultationFee,
                isAvailable,
                availableTimes,
            } = req.body;

            // 验证必填字段
            if (!departmentId || !title) {
                ResponseHelper.badRequest(res, '科室ID和职称为必填字段');
                return;
            }

            // 如果没有提供userId，则必须提供userData
            if (!userId && (!userData || !userData.name)) {
                ResponseHelper.badRequest(res, '如果未提供用户ID，则必须提供用户数据（包括用户名）');
                return;
            }

            const doctorData: DoctorCreateData = {
                userId,
                userData,
                departmentId,
                title,
                specialties: specialties || [],
                introduction: introduction || '',
                consultationFee: consultationFee || 0,
                isAvailable,
                availableTimes,
            };

            const doctor = await DoctorService.createDoctor(doctorData);
            ResponseHelper.created(res, doctor);
        } catch (error: any) {
            logger.error(`创建医生失败: ${error.message}`);
            ResponseHelper.serverError(res, `创建医生失败: ${error.message}`);
        }
    }

    /**
     * 更新医生
     * PUT /api/doctors/:id
     */
    public static async updateDoctor(req: Request, res: Response): Promise<void> {
        try {
            const id = req.params.id;
            const {
                userData,
                departmentId,
                title,
                specialties,
                introduction,
                consultationFee,
                isAvailable,
                availableTimes,
            } = req.body;

            // 确保至少提供一个更新字段
            if (
                !userData &&
                !departmentId &&
                !title &&
                !specialties &&
                introduction === undefined &&
                consultationFee === undefined &&
                isAvailable === undefined &&
                !availableTimes
            ) {
                ResponseHelper.badRequest(res, '请提供至少一个要更新的字段');
                return;
            }

            const doctorData: DoctorUpdateData = {};

            if (userData !== undefined) doctorData.userData = userData;
            if (departmentId !== undefined) doctorData.departmentId = departmentId;
            if (title !== undefined) doctorData.title = title;
            if (specialties !== undefined) doctorData.specialties = specialties;
            if (introduction !== undefined) doctorData.introduction = introduction;
            if (consultationFee !== undefined) doctorData.consultationFee = consultationFee;
            if (isAvailable !== undefined) doctorData.isAvailable = isAvailable;
            if (availableTimes !== undefined) doctorData.availableTimes = availableTimes;

            const doctor = await DoctorService.updateDoctor(id, doctorData);

            if (!doctor) {
                ResponseHelper.notFound(res, '医生不存在');
                return;
            }

            ResponseHelper.success(res, doctor);
        } catch (error: any) {
            logger.error(`更新医生失败: ${error.message}`);
            ResponseHelper.serverError(res, `更新医生失败: ${error.message}`);
        }
    }

    /**
     * 删除医生
     * DELETE /api/doctors/:id
     */
    public static async deleteDoctor(req: Request, res: Response): Promise<void> {
        try {
            const id = req.params.id;
            const deleted = await DoctorService.deleteDoctor(id);

            if (!deleted) {
                ResponseHelper.notFound(res, '医生不存在');
                return;
            }

            ResponseHelper.success(res, { message: '医生已成功删除' });
        } catch (error: any) {
            logger.error(`删除医生失败: ${error.message}`);
            ResponseHelper.serverError(res, '删除医生失败');
        }
    }

    /**
     * 根据科室获取医生
     * GET /api/doctors/department/:departmentId
     */
    public static async getDoctorsByDepartment(req: Request, res: Response): Promise<void> {
        try {
            const departmentId = req.params.departmentId;
            const forceRefresh = req.query.refresh === 'true';

            const { total, doctors } = await DoctorService.getDoctorsByDepartment(
                departmentId,
                !forceRefresh
            );

            ResponseHelper.success(res, {
                total,
                doctors,
            });
        } catch (error: any) {
            logger.error(`获取科室医生失败: ${error.message}`);
            ResponseHelper.serverError(res, '获取科室医生失败');
        }
    }
}

export default DoctorController;
