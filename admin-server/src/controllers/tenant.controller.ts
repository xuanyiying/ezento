import { Request, Response, NextFunction } from 'express';
import { TenantService } from '../services/tenant.service';
import { ApiError } from '../middlewares/errorHandler';

export class TenantController {
    constructor(private tenantService: TenantService) {}

    /**
     * @swagger
     * /tenants:
     *   get:
     *     summary: 获取所有租户
     *     description: 获取系统中所有租户的列表(仅限管理员)
     *     tags: [Tenants]
     *     security:
     *       - bearerAuth: []
     *     responses:
     *       200:
     *         description: 成功返回租户列表
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 status:
     *                   type: string
     *                   example: success
     *                 data:
     *                   type: object
     *                   properties:
     *                     tenants:
     *                       type: array
     *                       items:
     *                         $ref: '#/components/schemas/Tenant'
     *                     total:
     *                       type: number
     *       403:
     *         description: 无权限访问
     *       500:
     *         description: 服务器错误
     */
    async getAllTenants(req: Request, res: Response, next: NextFunction) {
        try {
            // 验证权限 - 只有管理员可以查看所有租户
            if (req.user?.role !== 'ADMIN') {
                throw new ApiError(403, '无权执行此操作');
            }

            const result = await this.tenantService.findAll();
            res.json({
                status: 'success',
                data: result,
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * @swagger
     * /tenants/{id}:
     *   get:
     *     summary: 获取特定租户信息
     *     description: 根据ID获取特定租户的详细信息
     *     tags: [Tenants]
     *     security:
     *       - bearerAuth: []
     *     parameters:
     *       - in: path
     *         name: id
     *         required: true
     *         schema:
     *           type: string
     *         description: 租户ID
     *     responses:
     *       200:
     *         description: 成功返回租户信息
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 status:
     *                   type: string
     *                   example: success
     *                 data:
     *                   $ref: '#/components/schemas/Tenant'
     *       403:
     *         description: 无权限访问
     *       404:
     *         description: 租户不存在
     *       500:
     *         description: 服务器错误
     */
    async getTenantById(req: Request, res: Response, next: NextFunction) {
        try {
            const { id } = req.params;

            // 验证权限 - 只有管理员或租户自身的管理员可以查看
            if (
                req.user?.role !== 'ADMIN' &&
                (req.tenantId !== id || req.user?.role !== 'TENANT_ADMIN')
            ) {
                throw new ApiError(403, '无权执行此操作');
            }

            const tenant = await this.tenantService.findById(id);
            if (!tenant) {
                throw new ApiError(404, '租户不存在');
            }

            res.json({
                status: 'success',
                data: tenant,
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * @swagger
     * /tenants:
     *   post:
     *     summary: 创建新租户
     *     description: 创建一个新的租户(仅限管理员)
     *     tags: [Tenants]
     *     security:
     *       - bearerAuth: []
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             required:
     *               - name
     *               - code
     *               - plan
     *             properties:
     *               name:
     *                 type: string
     *                 description: 租户名称
     *               code:
     *                 type: string
     *                 description: 租户代码
     *               plan:
     *                 type: string
     *                 description: 租户套餐计划
     *               settings:
     *                 type: object
     *                 description: 租户设置
     *               theme:
     *                 type: object
     *                 description: 租户主题设置
     *     responses:
     *       201:
     *         description: 成功创建租户
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 status:
     *                   type: string
     *                   example: success
     *                 data:
     *                   $ref: '#/components/schemas/Tenant'
     *       400:
     *         description: 参数错误
     *       403:
     *         description: 无权限访问
     *       500:
     *         description: 服务器错误
     */
    async createTenant(req: Request, res: Response, next: NextFunction) {
        try {
            // 验证权限 - 只有管理员可以创建租户
            if (req.user?.role !== 'ADMIN') {
                throw new ApiError(403, '无权执行此操作');
            }

            const tenant = await this.tenantService.create(req.body);
            res.status(201).json({
                status: 'success',
                data: tenant,
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * @swagger
     * /tenants/{id}:
     *   put:
     *     summary: 更新租户信息
     *     description: 更新特定租户的信息
     *     tags: [Tenants]
     *     security:
     *       - bearerAuth: []
     *     parameters:
     *       - in: path
     *         name: id
     *         required: true
     *         schema:
     *           type: string
     *         description: 租户ID
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             properties:
     *               name:
     *                 type: string
     *               code:
     *                 type: string
     *               settings:
     *                 type: object
     *               theme:
     *                 type: object
     *     responses:
     *       200:
     *         description: 成功更新租户
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 status:
     *                   type: string
     *                   example: success
     *                 data:
     *                   $ref: '#/components/schemas/Tenant'
     *       400:
     *         description: 参数错误
     *       403:
     *         description: 无权限访问
     *       404:
     *         description: 租户不存在
     *       500:
     *         description: 服务器错误
     */
    async updateTenant(req: Request, res: Response, next: NextFunction) {
        try {
            const { id } = req.params;

            // 验证权限 - 只有管理员或租户自身的管理员可以更新
            if (
                req.user?.role !== 'ADMIN' &&
                (req.tenantId !== id || req.user?.role !== 'TENANT_ADMIN')
            ) {
                throw new ApiError(403, '无权执行此操作');
            }

            const tenant = await this.tenantService.update(id, req.body);
            res.json({
                status: 'success',
                data: tenant,
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * @swagger
     * /tenants/{id}:
     *   delete:
     *     summary: 删除租户
     *     description: 删除特定租户(仅限管理员)
     *     tags: [Tenants]
     *     security:
     *       - bearerAuth: []
     *     parameters:
     *       - in: path
     *         name: id
     *         required: true
     *         schema:
     *           type: string
     *         description: 租户ID
     *     responses:
     *       200:
     *         description: 成功删除租户
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 status:
     *                   type: string
     *                   example: success
     *                 data:
     *                   type: null
     *       403:
     *         description: 无权限访问
     *       404:
     *         description: 租户不存在
     *       500:
     *         description: 服务器错误
     */
    async deleteTenant(req: Request, res: Response, next: NextFunction) {
        try {
            const { id } = req.params;

            // 验证权限 - 只有管理员可以删除租户
            if (req.user?.role !== 'ADMIN') {
                throw new ApiError(403, '无权执行此操作');
            }

            await this.tenantService.delete(id);
            res.json({
                status: 'success',
                data: null,
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * @swagger
     * /tenants/{id}/status:
     *   patch:
     *     summary: 修改租户状态
     *     description: 更新特定租户的状态(仅限管理员)
     *     tags: [Tenants]
     *     security:
     *       - bearerAuth: []
     *     parameters:
     *       - in: path
     *         name: id
     *         required: true
     *         schema:
     *           type: string
     *         description: 租户ID
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             required:
     *               - status
     *             properties:
     *               status:
     *                 type: string
     *                 enum: [ACTIVE, SUSPENDED, TERMINATED]
     *                 description: 新的租户状态
     *     responses:
     *       200:
     *         description: 成功更新状态
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 status:
     *                   type: string
     *                   example: success
     *                 data:
     *                   $ref: '#/components/schemas/Tenant'
     *       400:
     *         description: 参数错误
     *       403:
     *         description: 无权限访问
     *       404:
     *         description: 租户不存在
     *       500:
     *         description: 服务器错误
     */
    async changeTenantStatus(req: Request, res: Response, next: NextFunction) {
        try {
            const { id } = req.params;
            const { status } = req.body;

            // 验证权限 - 只有管理员可以更改租户状态
            if (req.user?.role !== 'ADMIN') {
                throw new ApiError(403, '无权执行此操作');
            }

            // 验证状态值
            if (!['ACTIVE', 'SUSPENDED', 'TERMINATED'].includes(status)) {
                throw new ApiError(400, '无效的状态值');
            }

            const tenant = await this.tenantService.changeStatus(id, status);
            res.json({
                status: 'success',
                data: tenant,
            });
        } catch (error) {
            next(error);
        }
    }

    async changeTenantPlan(req: Request, res: Response, next: NextFunction) {
        try {
            const { id } = req.params;
            const { plan } = req.body;

            // 验证权限 - 只有管理员可以更改租户套餐
            if (req.user?.role !== 'ADMIN') {
                throw new ApiError(403, '无权执行此操作');
            }

            if (!plan) {
                throw new ApiError(400, '套餐不能为空');
            }

            const tenant = await this.tenantService.changePlan(id, plan);
            res.json({
                status: 'success',
                data: tenant,
            });
        } catch (error) {
            next(error);
        }
    }

    async getTenantPlans(req: Request, res: Response, next: NextFunction) {
        try {
            const plans = await this.tenantService.getTenantPlans();
            res.json({
                status: 'success',
                data: plans,
            });
        } catch (error) {
            next(error);
        }
    }

    async getTenantStats(req: Request, res: Response, next: NextFunction) {
        try {
            const { id } = req.params;

            // 验证权限 - 只有管理员或租户自身的管理员可以查看统计
            if (
                req.user?.role !== 'ADMIN' &&
                (req.tenantId !== id || req.user?.role !== 'TENANT_ADMIN')
            ) {
                throw new ApiError(403, '无权执行此操作');
            }

            const stats = await this.tenantService.getTenantStats(id);
            res.json({
                status: 'success',
                data: stats,
            });
        } catch (error) {
            next(error);
        }
    }

    async getTenantConfig(req: Request, res: Response, next: NextFunction) {
        try {
            const { id } = req.params;

            // 验证权限 - 只有管理员或租户自身的管理员可以查看配置
            if (
                req.user?.role !== 'ADMIN' &&
                (req.tenantId !== id || req.user?.role !== 'TENANT_ADMIN')
            ) {
                throw new ApiError(403, '无权执行此操作');
            }

            const config = await this.tenantService.getTenantConfig(id);
            if (!config) {
                throw new ApiError(404, '租户不存在');
            }

            res.json({
                status: 'success',
                data: {
                    settings: config.settings,
                    theme: config.theme,
                    apiCallLimits: config.apiCallLimits,
                },
            });
        } catch (error) {
            next(error);
        }
    }

    async updateTenantConfig(req: Request, res: Response, next: NextFunction) {
        try {
            const { id } = req.params;
            const { settings, theme, apiCallLimits } = req.body;

            // 验证权限 - 只有管理员或租户自身的管理员可以更新配置
            if (
                req.user?.role !== 'ADMIN' &&
                (req.tenantId !== id || req.user?.role !== 'TENANT_ADMIN')
            ) {
                throw new ApiError(403, '无权执行此操作');
            }

            // 准备更新数据
            const updateData: any = {};
            if (settings) updateData.settings = settings;
            if (theme) updateData.theme = theme;
            if (apiCallLimits) updateData.apiCallLimits = apiCallLimits;

            const updatedConfig = await this.tenantService.updateTenantConfig(id, updateData);

            res.json({
                status: 'success',
                data: {
                    settings: updatedConfig.settings,
                    theme: updatedConfig.theme,
                    apiCallLimits: updatedConfig.apiCallLimits,
                },
            });
        } catch (error) {
            next(error);
        }
    }
}
