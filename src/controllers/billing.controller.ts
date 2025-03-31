import { Request, Response, NextFunction } from 'express';
import { BillingService } from '../services/billing.service';
import { ApiError } from '../middlewares/errorHandler';

export class BillingController {
    constructor(private billingService: BillingService) { }

    // 使用量统计
    async getAllUsage(req: Request, res: Response, next: NextFunction) {
        try {
            // 验证权限 - 只有管理员可以查看所有使用量
            if (req.user?.role !== 'ADMIN') {
                throw new ApiError(403, '无权执行此操作');
            }

            const result = await this.billingService.getAllUsage();
            res.json({
                status: 'success',
                data: result
            });
        } catch (error) {
            next(error);
        }
    }

    async getTenantUsage(req: Request, res: Response, next: NextFunction) {
        try {
            const { tenantId } = req.params;

            // 验证权限 - 只有管理员或租户自身的管理员可以查看
            if (req.user?.role !== 'ADMIN' &&
                (req.tenantId !== tenantId || req.user?.role !== 'TENANT_ADMIN')) {
                throw new ApiError(403, '无权执行此操作');
            }

            const result = await this.billingService.getTenantUsage(tenantId);
            res.json({
                status: 'success',
                data: result
            });
        } catch (error) {
            next(error);
        }
    }

    async getTenantDailyUsage(req: Request, res: Response, next: NextFunction) {
        try {
            const { tenantId } = req.params;
            const { startDate, endDate } = req.query;

            // 验证权限 - 只有管理员或租户自身的管理员可以查看
            if (req.user?.role !== 'ADMIN' &&
                (req.tenantId !== tenantId || req.user?.role !== 'TENANT_ADMIN')) {
                throw new ApiError(403, '无权执行此操作');
            }

            // 参数验证
            if (!startDate || !endDate) {
                throw new ApiError(400, '起止日期不能为空');
            }

            const start = new Date(startDate as string);
            const end = new Date(endDate as string);

            if (isNaN(start.getTime()) || isNaN(end.getTime())) {
                throw new ApiError(400, '日期格式不正确');
            }

            const result = await this.billingService.getTenantDailyUsage(tenantId, start, end);
            res.json({
                status: 'success',
                data: result
            });
        } catch (error) {
            next(error);
        }
    }

    async getTenantModelUsage(req: Request, res: Response, next: NextFunction) {
        try {
            const { tenantId } = req.params;

            // 验证权限 - 只有管理员或租户自身的管理员可以查看
            if (req.user?.role !== 'ADMIN' &&
                (req.tenantId !== tenantId || req.user?.role !== 'TENANT_ADMIN')) {
                throw new ApiError(403, '无权执行此操作');
            }

            const result = await this.billingService.getTenantModelUsage(tenantId);
            res.json({
                status: 'success',
                data: result
            });
        } catch (error) {
            next(error);
        }
    }

    // 套餐与计费
    /**
     * @swagger
     * /billing/plans:
     *   get:
     *     summary: 获取所有计费套餐
     *     description: 获取系统中所有可用的计费套餐
     *     tags: [Billing]
     *     security:
     *       - bearerAuth: []
     *     responses:
     *       200:
     *         description: 成功返回计费套餐列表
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 status:
     *                   type: string
     *                   example: success
     *                 data:
     *                   type: array
     *                   items:
     *                     $ref: '#/components/schemas/BillingPlan'
     *       500:
     *         description: 服务器错误
     */
    async getAllBillingPlans(req: Request, res: Response, next: NextFunction) {
        try {
            const plans = await this.billingService.getAllBillingPlans();
            res.json({
                status: 'success',
                data: plans
            });
        } catch (error) {
            next(error);
        }
    }

    async getBillingPlanById(req: Request, res: Response, next: NextFunction) {
        try {
            const { id } = req.params;
            const plan = await this.billingService.getBillingPlanById(id);
            res.json({
                status: 'success',
                data: plan
            });
        } catch (error) {
            next(error);
        }
    }

    async createBillingPlan(req: Request, res: Response, next: NextFunction) {
        try {
            // 验证权限 - 只有管理员可以创建计费套餐
            if (req.user?.role !== 'ADMIN') {
                throw new ApiError(403, '无权执行此操作');
            }

            const plan = await this.billingService.createBillingPlan(req.body);
            res.status(201).json({
                status: 'success',
                data: plan
            });
        } catch (error) {
            next(error);
        }
    }

    async updateBillingPlan(req: Request, res: Response, next: NextFunction) {
        try {
            const { id } = req.params;

            // 验证权限 - 只有管理员可以更新计费套餐
            if (req.user?.role !== 'ADMIN') {
                throw new ApiError(403, '无权执行此操作');
            }

            const plan = await this.billingService.updateBillingPlan(id, req.body);
            res.json({
                status: 'success',
                data: plan
            });
        } catch (error) {
            next(error);
        }
    }

    async deleteBillingPlan(req: Request, res: Response, next: NextFunction) {
        try {
            const { id } = req.params;

            // 验证权限 - 只有管理员可以删除计费套餐
            if (req.user?.role !== 'ADMIN') {
                throw new ApiError(403, '无权执行此操作');
            }

            await this.billingService.deleteBillingPlan(id);
            res.json({
                status: 'success',
                data: null
            });
        } catch (error) {
            next(error);
        }
    }

    // 资源单价
    /**
     * @swagger
     * /billing/rates:
     *   get:
     *     summary: 获取所有资源单价
     *     description: 获取系统中所有资源的计费单价
     *     tags: [Billing]
     *     security:
     *       - bearerAuth: []
     *     responses:
     *       200:
     *         description: 成功返回资源单价列表
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 status:
     *                   type: string
     *                   example: success
     *                 data:
     *                   type: array
     *                   items:
     *                     $ref: '#/components/schemas/ResourceRate'
     *       500:
     *         description: 服务器错误
     */
    async getAllRates(req: Request, res: Response, next: NextFunction) {
        try {
            const rates = await this.billingService.getAllRates();
            res.json({
                status: 'success',
                data: rates
            });
        } catch (error) {
            next(error);
        }
    }

    async updateRate(req: Request, res: Response, next: NextFunction) {
        try {
            const { id } = req.params;

            // 验证权限 - 只有管理员可以更新资源单价
            if (req.user?.role !== 'ADMIN') {
                throw new ApiError(403, '无权执行此操作');
            }

            const rate = await this.billingService.updateRate(id, req.body);
            res.json({
                status: 'success',
                data: rate
            });
        } catch (error) {
            next(error);
        }
    }

    // 账单管理
    /**
     * @swagger
     * /billing/invoices:
     *   get:
     *     summary: 获取所有账单
     *     description: 获取系统中所有账单(仅管理员可用)
     *     tags: [Billing]
     *     security:
     *       - bearerAuth: []
     *     responses:
     *       200:
     *         description: 成功返回账单列表
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 status:
     *                   type: string
     *                   example: success
     *                 data:
     *                   type: array
     *                   items:
     *                     $ref: '#/components/schemas/Invoice'
     *       403:
     *         description: 无权访问
     *       500:
     *         description: 服务器错误
     */
    async getAllInvoices(req: Request, res: Response, next: NextFunction) {
        try {
            // 验证权限 - 只有管理员可以查看所有账单
            if (req.user?.role !== 'ADMIN') {
                throw new ApiError(403, '无权执行此操作');
            }

            const result = await this.billingService.getAllInvoices();
            res.json({
                status: 'success',
                data: result
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * @swagger
     * /billing/invoices/{id}:
     *   get:
     *     summary: 获取账单详情
     *     description: 获取特定账单的详细信息
     *     tags: [Billing]
     *     security:
     *       - bearerAuth: []
     *     parameters:
     *       - in: path
     *         name: id
     *         required: true
     *         schema:
     *           type: string
     *         description: 账单ID
     *     responses:
     *       200:
     *         description: 成功返回账单详情
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 status:
     *                   type: string
     *                   example: success
     *                 data:
     *                   $ref: '#/components/schemas/Invoice'
     *       404:
     *         description: 账单不存在
     *       403:
     *         description: 无权访问此账单
     *       500:
     *         description: 服务器错误
     */
    async getInvoiceById(req: Request, res: Response, next: NextFunction) {
        try {
            const { id } = req.params;
            const invoice = await this.billingService.getInvoiceById(id);

            // 验证权限 - 只有管理员或账单所属租户可以查看
            if (req.user?.role !== 'ADMIN' && invoice.tenantId !== req.user?.tenantId) {
                throw new ApiError(403, '无权查看此账单');
            }

            res.json({
                status: 'success',
                data: invoice
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * @swagger
     * /tenant/{tenantId}/invoices:
     *   get:
     *     summary: 获取租户账单
     *     description: 获取特定租户的所有账单
     *     tags: [Billing]
     *     security:
     *       - bearerAuth: []
     *     parameters:
     *       - in: path
     *         name: tenantId
     *         required: true
     *         schema:
     *           type: string
     *         description: 租户ID
     *     responses:
     *       200:
     *         description: 成功返回租户账单列表
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 status:
     *                   type: string
     *                   example: success
     *                 data:
     *                   type: array
     *                   items:
     *                     $ref: '#/components/schemas/Invoice'
     *       403:
     *         description: 无权访问此租户账单
     *       404:
     *         description: 租户不存在
     *       500:
     *         description: 服务器错误
     */
    async getTenantInvoices(req: Request, res: Response, next: NextFunction) {
        try {
            const { tenantId } = req.params;

            // 验证权限 - 只有管理员或租户所有者可以查看租户账单
            if (req.user?.role !== 'ADMIN' && tenantId !== req.user?.tenantId) {
                throw new ApiError(403, '无权查看此租户账单');
            }

            const invoices = await this.billingService.getTenantInvoices(tenantId);
            res.json({
                status: 'success',
                data: invoices
            });
        } catch (error) {
            next(error);
        }
    }

    async generateInvoice(req: Request, res: Response, next: NextFunction) {
        try {
            // 验证权限 - 只有管理员可以生成账单
            if (req.user?.role !== 'ADMIN') {
                throw new ApiError(403, '无权执行此操作');
            }

            const invoice = await this.billingService.generateInvoice(req.body);
            res.status(201).json({
                status: 'success',
                data: invoice
            });
        } catch (error) {
            next(error);
        }
    }

    async updateInvoiceStatus(req: Request, res: Response, next: NextFunction) {
        try {
            const { id } = req.params;
            const { status } = req.body;

            // 验证权限 - 只有管理员可以更新账单状态
            if (req.user?.role !== 'ADMIN') {
                throw new ApiError(403, '无权执行此操作');
            }

            // 验证状态值
            if (!['DRAFT', 'PENDING', 'PAID', 'OVERDUE', 'CANCELLED'].includes(status)) {
                throw new ApiError(400, '无效的状态值');
            }

            const invoice = await this.billingService.updateInvoiceStatus(id, status);
            res.json({
                status: 'success',
                data: invoice
            });
        } catch (error) {
            next(error);
        }
    }

    // 超额计费
    async getOverages(req: Request, res: Response, next: NextFunction) {
        try {
            const { tenantId } = req.query;

            // 验证权限 - 只有管理员可以查看所有超额记录
            // 如果指定了租户，则租户管理员也可以查看自己的记录
            if (req.user?.role !== 'ADMIN' &&
                (tenantId && (req.tenantId !== tenantId || req.user?.role !== 'TENANT_ADMIN'))) {
                throw new ApiError(403, '无权执行此操作');
            }

            const overages = await this.billingService.getOverages(tenantId as string);
            res.json({
                status: 'success',
                data: overages
            });
        } catch (error) {
            next(error);
        }
    }

    async getOverageSettings(req: Request, res: Response, next: NextFunction) {
        try {
            const { tenantId } = req.query;

            // 验证权限 - 只有管理员可以查看所有设置
            // 如果指定了租户，则租户管理员也可以查看自己的设置
            if (req.user?.role !== 'ADMIN' &&
                (tenantId && (req.tenantId !== tenantId || req.user?.role !== 'TENANT_ADMIN'))) {
                throw new ApiError(403, '无权执行此操作');
            }

            const settings = await this.billingService.getOverageSettings(tenantId as string);
            res.json({
                status: 'success',
                data: settings
            });
        } catch (error) {
            next(error);
        }
    }

    async createOverageSettings(req: Request, res: Response, next: NextFunction) {
        try {
            // 验证权限 - 只有管理员可以创建超额设置
            if (req.user?.role !== 'ADMIN') {
                throw new ApiError(403, '无权执行此操作');
            }

            const settings = await this.billingService.createOverageSettings(req.body);
            res.status(201).json({
                status: 'success',
                data: settings
            });
        } catch (error) {
            next(error);
        }
    }

    async updateOverageSettings(req: Request, res: Response, next: NextFunction) {
        try {
            const { id } = req.params;

            // 验证权限 - 只有管理员可以更新超额设置
            if (req.user?.role !== 'ADMIN') {
                throw new ApiError(403, '无权执行此操作');
            }

            const settings = await this.billingService.updateOverageSettings(id, req.body);
            res.json({
                status: 'success',
                data: settings
            });
        } catch (error) {
            next(error);
        }
    }

    async notifyOverage(req: Request, res: Response, next: NextFunction) {
        try {
            const { tenantId } = req.body;

            // 验证权限 - 只有管理员可以发送超额通知
            if (req.user?.role !== 'ADMIN') {
                throw new ApiError(403, '无权执行此操作');
            }

            if (!tenantId) {
                throw new ApiError(400, '租户ID不能为空');
            }

            await this.billingService.notifyOverage(tenantId);
            res.json({
                status: 'success',
                message: '超额使用通知已发送'
            });
        } catch (error) {
            next(error);
        }
    }
} 