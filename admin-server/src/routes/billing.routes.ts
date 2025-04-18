import { Router } from 'express';
import { BillingController } from '../controllers/billing.controller';
import { authMiddleware } from '../middlewares/auth.middleware';
import { DIContainer } from '../di/container';

const router = Router();
const billingController = new BillingController(DIContainer.billingService);

// 所有计费路由都需要认证
router.use(authMiddleware);

// 使用量统计
router.get('/usage', billingController.getAllUsage.bind(billingController));
router.get('/usage/:tenantId', billingController.getTenantUsage.bind(billingController));
router.get('/usage/:tenantId/daily', billingController.getTenantDailyUsage.bind(billingController));
router.get(
    '/usage/:tenantId/models',
    billingController.getTenantModelUsage.bind(billingController)
);

// 套餐与计费
router.get('/plans', billingController.getAllBillingPlans.bind(billingController));
router.post('/plans', billingController.createBillingPlan.bind(billingController));
router.get('/plans/:id', billingController.getBillingPlanById.bind(billingController));
router.put('/plans/:id', billingController.updateBillingPlan.bind(billingController));
router.delete('/plans/:id', billingController.deleteBillingPlan.bind(billingController));

// 资源单价
router.get('/rates', billingController.getAllRates.bind(billingController));
router.put('/rates/:id', billingController.updateRate.bind(billingController));

// 账单管理
router.get('/invoices', billingController.getAllInvoices.bind(billingController));
router.get('/invoices/:id', billingController.getInvoiceById.bind(billingController));
router.post('/invoices/generate', billingController.generateInvoice.bind(billingController));
router.put('/invoices/:id/status', billingController.updateInvoiceStatus.bind(billingController));
router.get(
    '/tenants/:tenantId/invoices',
    billingController.getTenantInvoices.bind(billingController)
);

// 超额计费
router.get('/overages', billingController.getOverages.bind(billingController));
router.get('/overages/settings', billingController.getOverageSettings.bind(billingController));
router.post('/overages/settings', billingController.createOverageSettings.bind(billingController));
router.put(
    '/overages/settings/:id',
    billingController.updateOverageSettings.bind(billingController)
);
router.post('/overages/notify', billingController.notifyOverage.bind(billingController));

export default router;
