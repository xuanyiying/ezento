import { Router } from 'express';
import { DIContainer } from '../di/container';
import { authMiddleware } from '../middlewares/auth.middleware';

const router = Router();
const authController = DIContainer.authController;

// 登录接口 - 不需要认证
router.post('/login', authController.login);

// 验证令牌接口 - 需要认证
router.get('/verify', authMiddleware, authController.verifyToken);

export default router; 