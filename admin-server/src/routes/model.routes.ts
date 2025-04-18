import { Router } from 'express';
import { ModelController } from '../controllers/model.controller';
import { DIContainer } from '../di/container';
import { authMiddleware } from '../middlewares/auth.middleware';

const router = Router();
const modelController = new ModelController(DIContainer.modelService);

// 应用授权中间件到所有路由
router.use(authMiddleware);

// 模型管理
router.get('/', modelController.getAllModels);
router.post('/', modelController.createModel);
router.get('/:id', modelController.getModelById);
router.put('/:id', modelController.updateModel);
router.delete('/:id', modelController.deleteModel);
router.patch('/:id/status', modelController.toggleModelStatus);
router.put('/:id/parameters', modelController.updateModelParameters);

// 租户模型配置
router.get('/tenant/:tenantId', modelController.getTenantModels);
router.get('/tenant/:tenantId/model/:modelId', modelController.getTenantModelConfig);
router.put('/tenant/:tenantId/model/:modelId', modelController.configureTenantModel);

// API密钥管理
router.get('/api-keys', modelController.getAllApiKeys);
router.post('/api-keys', modelController.createApiKey);
router.get('/api-keys/:id', modelController.getApiKeyById);
router.delete('/api-keys/:id', modelController.deleteApiKey);
router.post('/api-keys/:id/rotate', modelController.rotateApiKey);
router.get('/tenant/:tenantId/api-keys', modelController.getTenantApiKeys);

// 推理调用
router.post('/tenant/:tenantId/inference', modelController.inference);

export default router;
