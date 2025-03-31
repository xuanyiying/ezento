import { Router } from 'express';
import { TenantController } from '../controllers/tenant.controller';
import { authMiddleware } from '../middlewares/auth.middleware';
import { DIContainer } from '../di/container';

const router = Router();
const tenantController = new TenantController(DIContainer.tenantService);

// 所有租户路由都需要认证
router.use(authMiddleware);

// 租户基础操作
router.get('/', tenantController.getAllTenants.bind(tenantController));
router.post('/', tenantController.createTenant.bind(tenantController));
router.get('/:id', tenantController.getTenantById.bind(tenantController));
router.put('/:id', tenantController.updateTenant.bind(tenantController));
router.delete('/:id', tenantController.deleteTenant.bind(tenantController));

// 租户状态管理
router.post('/:id/activate', tenantController.changeTenantStatus.bind(tenantController));
router.post('/:id/suspend', tenantController.changeTenantStatus.bind(tenantController));
router.post('/:id/terminate', tenantController.changeTenantStatus.bind(tenantController));

// 租户计划管理
router.post('/:id/change-plan', tenantController.changeTenantPlan.bind(tenantController));
router.get('/plans', tenantController.getTenantPlans.bind(tenantController));

// 租户统计
router.get('/:id/stats', tenantController.getTenantStats.bind(tenantController));

export default router; 