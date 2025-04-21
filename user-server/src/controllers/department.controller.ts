import { Request, Response } from 'express';
import DepartmentService from '../services/department.service';
import { DepartmentCreateData, DepartmentUpdateData } from '../interfaces/department.interface';
import logger from '../config/logger';
import { successResponse, errorResponse, notFoundResponse } from '../utils/response';

/**
 * 科室管理控制器
 * 处理科室相关的API请求
 */
class DepartmentController {
    /**
     * 获取所有科室
     * GET /api/departments
     */
    public static async getAllDepartments(req: Request, res: Response): Promise<void> {
        try {
            const forceRefresh = req.query.refresh === 'true';
            const { total, departments } = await DepartmentService.getAllDepartments(!forceRefresh);

            successResponse(res, {
                total,
                departments,
            });
        } catch (error: any) {
            logger.error(`获取所有科室失败: ${error.message}`);
            errorResponse(res, '获取科室列表失败', 500);
        }
    }

    /**
     * 根据ID获取科室
     * GET /api/departments/:id
     */
    public static async getDepartmentById(req: Request, res: Response): Promise<void> {
        try {
            const id = req.params.id;
            const forceRefresh = req.query.refresh === 'true';

            const department = await DepartmentService.getDepartmentById(id, !forceRefresh);

            if (!department) {
                notFoundResponse(res, '科室不存在');
                return;
            }

            successResponse(res, department);
        } catch (error: any) {
            logger.error(`获取科室详情失败: ${error.message}`);
            errorResponse(res, '获取科室详情失败', 500);
        }
    }

    /**
     * 创建科室
     * POST /api/departments
     */
    public static async createDepartment(req: Request, res: Response): Promise<void> {
        try {
            const { name, description, iconUrl, status, parentId, order } = req.body;

            // 验证必填字段
            if (!name || !description || !iconUrl) {
                errorResponse(res, '科室名称、描述和图标URL为必填字段', 400);
                return;
            }

            const departmentData: DepartmentCreateData = {
                name,
                description,
                iconUrl,
                status,
                parentId,
                order,
                id: ''
            };

            const department = await DepartmentService.createDepartment(departmentData);
            successResponse(res, department, 201);
        } catch (error: any) {
            logger.error(`创建科室失败: ${error.message}`);

            if (error.message.includes('已存在')) {
                errorResponse(res, error.message, 400);
            } else {
                errorResponse(res, '创建科室失败', 500);
            }
        }
    }

    /**
     * 更新科室
     * PUT /api/departments/:id
     */
    public static async updateDepartment(req: Request, res: Response): Promise<void> {
        try {
            const id = req.params.id;
            const { name, description, iconUrl, status, parentId, order } = req.body;

            // 确保至少提供一个更新字段
            if (
                !name &&
                !description &&
                !iconUrl &&
                !status &&
                parentId === undefined &&
                order === undefined
            ) {
                errorResponse(res, '请提供至少一个要更新的字段', 400);
                return;
            }

            const departmentData: DepartmentUpdateData = {};

            if (name !== undefined) departmentData.name = name;
            if (description !== undefined) departmentData.description = description;
            if (iconUrl !== undefined) departmentData.iconUrl = iconUrl;
            if (status !== undefined) departmentData.status = status;
            if (parentId !== undefined) departmentData.parentId = parentId;
            if (order !== undefined) departmentData.order = order;

            const department = await DepartmentService.updateDepartment(id, departmentData);

            if (!department) {
                notFoundResponse(res, '科室不存在');
                return;
            }

            successResponse(res, department);
        } catch (error: any) {
            logger.error(`更新科室失败: ${error.message}`);

            if (error.message.includes('已存在')) {
                errorResponse(res, error.message, 400);
            } else {
                errorResponse(res, '更新科室失败', 500);
            }
        }
    }

    /**
     * 删除科室
     * DELETE /api/departments/:id
     */
    public static async deleteDepartment(req: Request, res: Response): Promise<void> {
        try {
            const id = req.params.id;
            const deleted = await DepartmentService.deleteDepartment(id);

            if (!deleted) {
                notFoundResponse(res, '科室不存在');
                return;
            }

            successResponse(res, { message: '科室已成功删除' });
        } catch (error: any) {
            logger.error(`删除科室失败: ${error.message}`);
            errorResponse(res, '删除科室失败', 500);
        }
    }
}

export default DepartmentController;
