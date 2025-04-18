import { Router } from 'express';
import { CircuitBreakerController } from '../controllers/circuit-breaker.controller';
import { DIContainer } from '../di/container';
import { authMiddleware } from '../middlewares/auth.middleware';

const router = Router();
const circuitBreakerController = new CircuitBreakerController(DIContainer.circuitBreakerService);

// 熔断器管理路由
router.get('/:id', authMiddleware, circuitBreakerController.getCircuitBreakerById);
router.get(
    '/tenant/:tenantId',
    authMiddleware,
    circuitBreakerController.getCircuitBreakersByTenant
);
router.post('/', authMiddleware, circuitBreakerController.createCircuitBreaker);
router.put('/:id', authMiddleware, circuitBreakerController.updateCircuitBreaker);
router.delete('/:id', authMiddleware, circuitBreakerController.deleteCircuitBreaker);
router.patch('/:id/status', authMiddleware, circuitBreakerController.updateCircuitBreakerStatus);

// 熔断规则管理路由
router.get('/:breakerId/rules', authMiddleware, circuitBreakerController.getCircuitBreakerRules);
router.post('/rules', authMiddleware, circuitBreakerController.createCircuitBreakerRule);
router.put('/rules/:id', authMiddleware, circuitBreakerController.updateCircuitBreakerRule);
router.delete('/rules/:id', authMiddleware, circuitBreakerController.deleteCircuitBreakerRule);
router.patch('/rules/:id/priority', authMiddleware, circuitBreakerController.updateRulePriority);

// 熔断事件管理路由
router.get('/:breakerId/events', authMiddleware, circuitBreakerController.getCircuitBreakerEvents);
router.post('/events', authMiddleware, circuitBreakerController.createCircuitBreakerEvent);

export const circuitBreakerRoutes = router;
