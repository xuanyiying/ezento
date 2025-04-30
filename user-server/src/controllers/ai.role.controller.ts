import { Request, Response } from 'express';
import AiRoleService from '../services/ai.role.service';
import { AiRoleCreateData, AiRoleUpdateData } from '../interfaces/ai.role.interface';
import logger from '../config/logger';
import { ResponseHelper } from '../utils/response';

/**
 * 角色管理控制器
 * 处理角色相关的API请求
 */
class AiRoleController {
    /**
     * 获取所有角色
     * GET /api/roles
     */
    public static async getAllRoles(req: Request, res: Response): Promise<void> {
        try {
            const forceRefresh = req.query.refresh === 'true';
            const { total, roles } = await AiRoleService.getAllRoles(!forceRefresh);

            ResponseHelper.success(res, {
                total,
                roles,
            });
        } catch (error: any) {
            logger.error(`获取所有角色失败: ${error.message}`);
            ResponseHelper.error(res, 500, '获取角色列表失败');
        }
    }

    /**
     * 根据ID获取角色
     * GET /api/roles/:id
     */
    public static async getRoleById(req: Request, res: Response): Promise<void> {
        try {
            const id = req.params.id;
            const forceRefresh = req.query.refresh === 'true';

            const role = await AiRoleService.getRoleById(id, !forceRefresh);

            if (!role) {
                ResponseHelper.notFound(res, '角色不存在');
                return;
            }

            ResponseHelper.success(res, role);
        } catch (error: any) {
            logger.error(`获取角色详情失败: ${error.message}`);
            ResponseHelper.error(res, 500, '获取角色详情失败');
        }
    }

    /**
     * 根据类型获取角色
     * GET /api/roles/type/:type
     */
    public static async getRoleByType(req: Request, res: Response): Promise<void> {
        try {
            const type = req.params.type;
            const forceRefresh = req.query.refresh === 'true';

            const role = await AiRoleService.getRoleByType(type, !forceRefresh);

            if (!role) {
                ResponseHelper.notFound(res, '角色不存在');
                return;
            }

            ResponseHelper.success(res, role);
        } catch (error: any) {
            logger.error(`获取角色详情失败: ${error.message}`);
            ResponseHelper.error(res, 500, '获取角色详情失败');
        }
    }

    /**
     * 创建角色
     * POST /api/roles
     */
    public static async createRole(req: Request, res: Response): Promise<void> {
        try {
            const { type, title, description, systemPrompt, status, order } = req.body;

            // 验证必填字段
            if (!type || !title || !description || !systemPrompt) {
                ResponseHelper.error(res, 400, '角色类型、标题、描述和系统提示词为必填字段',);
                return;
            }

            const roleData: AiRoleCreateData = {
                type,
                title,
                description,
                systemPrompt,
                status,
                order,
                id: ''
            };

            const role = await AiRoleService.createRole(roleData);
            ResponseHelper.success(res, role);
        } catch (error: any) {
            logger.error(`创建角色失败: ${error.message}`);

            if (error.message.includes('已存在')) {
                ResponseHelper.error(res, 400, error.message,);
            } else {
                ResponseHelper.error(res, 500, '创建角色失败');
            }
        }
    }

    /**
     * 更新角色
     * PUT /api/roles/:id
     */
    public static async updateRole(req: Request, res: Response): Promise<void> {
        try {
            const id = req.params.id;
            const { title, description, systemPrompt, status, order } = req.body;

            // 确保至少提供一个更新字段
            if (!title && !description && !systemPrompt && status === undefined && order === undefined) {
                ResponseHelper.error(res, 400, '请提供至少一个要更新的字段');
                return;
            }

            const updateData: AiRoleUpdateData = {};
            if (title !== undefined) updateData.title = title;
            if (description !== undefined) updateData.description = description;
            if (systemPrompt !== undefined) updateData.systemPrompt = systemPrompt;
            if (status !== undefined) updateData.status = status;
            if (order !== undefined) updateData.order = order;

            const updatedRole = await AiRoleService.updateRole(id, updateData);

            if (!updatedRole) {
                ResponseHelper.notFound(res, '角色不存在');
                return;
            }

            ResponseHelper.success(res, updatedRole);
        } catch (error: any) {
            logger.error(`更新角色失败: ${error.message}`);
            ResponseHelper.error(res, 500, '更新角色失败');
        }
    }

    /**
     * 删除角色
     * DELETE /api/roles/:id
     */
    public static async deleteRole(req: Request, res: Response): Promise<void> {
        try {
            const id = req.params.id;
            const success = await AiRoleService.deleteRole(id);

            if (!success) {
                ResponseHelper.notFound(res, '角色不存在');
                return;
            }

            ResponseHelper.success(res, { message: '角色已成功删除' });
        } catch (error: any) {
            logger.error(`删除角色失败: ${error.message}`);
            ResponseHelper.error(res, 500, '删除角色失败');
        }
    }
}

export default AiRoleController;