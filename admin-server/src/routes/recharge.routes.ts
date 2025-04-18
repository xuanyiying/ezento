import { Router } from 'express';
import { RechargeController } from '../controllers/recharge.controller';
import { DIContainer } from '../di/container';
import { authMiddleware } from '../middlewares/auth.middleware';

const router = Router();
const rechargeController = new RechargeController(DIContainer.rechargeService);

// 应用认证中间件
router.use(authMiddleware);

// 充值卡管理
router.get('/cards/code/:code', rechargeController.getRechargeCardByCode);
router.get('/cards/:id', rechargeController.getRechargeCardById);
router.get('/tenants/:tenantId/cards', rechargeController.getRechargeCardsByTenant);
router.post('/cards', rechargeController.createRechargeCard);
router.put('/cards/:id', rechargeController.updateRechargeCard);
router.delete('/cards/:id', rechargeController.deleteRechargeCard);

// 充值卡批次管理
router.get('/batches/:id', rechargeController.getRechargeCardBatchById);
router.get('/tenants/:tenantId/batches', rechargeController.getRechargeCardBatchesByTenant);
router.post('/batches', rechargeController.createRechargeCardBatch);
router.put('/batches/:id', rechargeController.updateRechargeCardBatch);
router.delete('/batches/:id', rechargeController.deleteRechargeCardBatch);

// 充值记录管理
router.get('/tenants/:tenantId/records', rechargeController.getRechargeRecordsByTenant);
router.get('/users/:userId/records', rechargeController.getRechargeRecordsByUser);
router.post('/records', rechargeController.createRechargeRecord);

export default router;
