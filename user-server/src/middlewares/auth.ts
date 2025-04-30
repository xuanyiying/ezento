import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import config from '../config/config';
import { UserService } from '../services';
import logger from '../config/logger';
import { ResponseHelper } from '../utils/response';

// Add user to request object with proper type definition
declare global {
    namespace Express {
        interface Request {
            user?: {
                userId: string;
                name?: string;
                role?: string;
                avatar?: string;
                tenantId?: string;
                email?: string;
                phone?: string;
                gender?: string;
                birthDate?: string;
            };
            token?: string;
            isNewUser?: boolean;
        }
    }
}

interface JwtPayload {
    userId: string;
    role: string;
    tenantId?: string;
    name?: string;
}

/**
 * Middleware to authenticate user based on JWT token
 */
export const auth = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            ResponseHelper.unauthorized(res, '未授权，请先登录');
            return;
        }

        const token = authHeader.split(' ')[1];
        if (!token) {
            ResponseHelper.unauthorized(res, '未授权，请先登录');
            return;
        }

        const decoded = jwt.verify(token, config.jwtSecret) as JwtPayload;
        const user = await UserService.findUserById(decoded.userId);
        logger.info(`login user: ${JSON.stringify(user)}`);
        // Normalize the role to uppercase for easier comparison
        req.user = {
            userId: decoded.userId,
            name: user?.name,
            role: user?.role?.toUpperCase(),
            avatar: user?.avatar,
            email: user?.email,
            phone: user?.phone,
            gender: user?.gender,
            birthDate: user?.birthDate?.toDateString(),
            ...(decoded.tenantId ? { tenantId: decoded.tenantId } : {}),
        };

        next();
    } catch (error) {
       
        ResponseHelper.unauthorized(res, '未授权，请先登录');
    }
};

/**
 * Middleware to check if user is a patient
 */
export const patientAuth = (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
        ResponseHelper.unauthorized(res, '未授权，请先登录');
        return;
    }

    // Case insensitive role check
    const role = req.user.role?.toUpperCase();
    if (!role || role === 'PATIENT') {
        next();
    } else {
        ResponseHelper.forbidden(res, '禁止访问: 患者权限');
    }
};

/**
 * Middleware to check if user is a doctor
 */
export const doctorAuth = (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
        ResponseHelper.unauthorized(res, '未授权，请先登录');
        return;
    }

    // Case insensitive role check
    const role = req.user.role?.toUpperCase();
    if (role === 'DOCTOR' || role === 'ADMIN') {
        next();
    } else {
        ResponseHelper.forbidden(res, '禁止访问: 医生权限');
    }
};

/**
 * Middleware to check if user is an admin
 */
export const adminAuth = (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
        ResponseHelper.unauthorized(res, '未授权，请先登录');
        return;
    }

    // Case insensitive role check
    const role = req.user.role?.toUpperCase();
    if (role === 'ADMIN') {
        next();
    } else {
      ResponseHelper.forbidden(res, '禁止访问: 管理员权限');
    }
};

/**
 * Middleware to check if user belongs to the current tenant
 * This middleware should be used after auth and tenantContext
 */
export const tenantAuth = (req: Request, res: Response, next: NextFunction) => {
    if (!req.user || !req.tenant) {
        ResponseHelper.unauthorized(res, '未授权，请先登录');
        return;
    }

    // Check if user belongs to the current tenant
    if (req.user.tenantId && req.user.tenantId !== req.tenant.id) {
        ResponseHelper.forbidden(res, '禁止访问: 租户权限');
        return;
    }

    next();
};
