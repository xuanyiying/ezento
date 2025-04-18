import { Router } from 'express';
import { ApiGatewayController } from '../controllers/api-gateway.controller';
import { DIContainer } from '../di/container';
import { authMiddleware } from '../middlewares/auth.middleware';

const router = Router();
const apiGatewayController = new ApiGatewayController(DIContainer.apiGatewayService);

// API网关管理路由
router.get('/:id', authMiddleware, apiGatewayController.getGatewayById);
router.get('/tenant/:tenantId', authMiddleware, apiGatewayController.getGatewaysByTenant);
router.post('/', authMiddleware, apiGatewayController.createGateway);
router.put('/:id', authMiddleware, apiGatewayController.updateGateway);
router.delete('/:id', authMiddleware, apiGatewayController.deleteGateway);
router.patch('/:id/status', authMiddleware, apiGatewayController.updateGatewayStatus);

// API路由管理路由
router.get('/:gatewayId/routes', authMiddleware, apiGatewayController.getRoutesByGateway);
router.get('/routes/:id', authMiddleware, apiGatewayController.getRouteById);
router.post('/routes', authMiddleware, apiGatewayController.createRoute);
router.put('/routes/:id', authMiddleware, apiGatewayController.updateRoute);
router.delete('/routes/:id', authMiddleware, apiGatewayController.deleteRoute);

// API密钥管理路由
router.get('/:gatewayId/api-keys', authMiddleware, apiGatewayController.getApiKeysByGateway);
router.get('/api-keys/:id', authMiddleware, apiGatewayController.getApiKeyById);
router.post('/api-keys', authMiddleware, apiGatewayController.createApiKey);
router.put('/api-keys/:id', authMiddleware, apiGatewayController.updateApiKey);
router.delete('/api-keys/:id', authMiddleware, apiGatewayController.deleteApiKey);
router.patch('/api-keys/:id/status', authMiddleware, apiGatewayController.updateApiKeyStatus);

// API日志管理路由
router.get('/:gatewayId/logs', authMiddleware, apiGatewayController.getLogsByGateway);
router.get('/routes/:routeId/logs', authMiddleware, apiGatewayController.getLogsByRoute);
router.get('/logs/:id', authMiddleware, apiGatewayController.getLogById);
router.post('/logs', authMiddleware, apiGatewayController.createLog);

export const apiGatewayRoutes = router;
