import { ApiError } from './errorHandler';
import jwt from 'jsonwebtoken';
import { DIContainer } from '../di/container';
import { Request, Response, NextFunction } from 'express';
declare global {
    namespace Express {
        interface Request {
            user?: {
                id: string;
                email: string;
                name: string;
                password?: string;
                role: 'ADMIN' | 'TENANT_ADMIN' | 'USER';
                tenantId: string;
                createdAt: Date;
                updatedAt: Date;
            };
            tenantId?: string;
        }
    }
}
export const authMiddleware = async (req: Request, res: Response, next: NextFunction) => {
    try {
        // 获取认证头
        const authHeader = req.headers.authorization;
        if (!authHeader) {
            throw new ApiError(401, '未提供认证令牌');
        }

        // 验证令牌格式
        const [type, token] = authHeader.split(' ');
        if (type !== 'Bearer' || !token) {
            throw new ApiError(401, '无效的认证令牌格式');
        }

        // 验证令牌
        const decoded = jwt.verify(token, process.env.JWT_SECRET!) as {
            userId: string;
            tenantId?: string;
        };

        // 获取用户服务
        const userService = DIContainer.userService;

        // 获取用户信息
        const user = await userService.findById(decoded.userId);
        if (!user) {
            throw new ApiError(401, '用户不存在');
        }

        // 设置用户和租户信息到请求对象
        req.user = user;
        req.tenantId = decoded.tenantId;

        next();
    } catch (error) {
        if (error instanceof jwt.JsonWebTokenError) {
            next(new ApiError(401, '无效的认证令牌'));
        } else {
            next(error);
        }
    }
};
