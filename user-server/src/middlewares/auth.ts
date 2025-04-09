import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import config from '../config/config';
import { Resp } from '../utils/response';
import { UserService } from '../services';
import logger from '../config/logger';

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
            };
            token?: string;
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
            res.status(401).json(Resp.fail('Authentication failed: No token provided', 401));
            return;
        }

        const token = authHeader.split(' ')[1];
        if (!token) {
            res.status(401).json(Resp.fail('Authentication failed: No token provided', 401));
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
            ...(decoded.tenantId ? { tenantId: decoded.tenantId } : {})
        };

        next();
    } catch (error) {
        res.status(401).json(Resp.fail('Authentication failed: Invalid token', 401));
    }
};

/**
 * Middleware to check if user is a patient
 */
export const patientAuth = (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
        res.status(401).json(Resp.fail('Authentication failed', 401));
        return;
    }

    // Case insensitive role check
    const role = req.user.role?.toUpperCase();
    if ( !role || role === 'PATIENT' ) {
        next();
    } else {
        res.status(403).json(Resp.fail('Access denied: Patient only', 403));
    }
};

/**
 * Middleware to check if user is a doctor
 */
export const doctorAuth = (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
        res.status(401).json(Resp.fail('Authentication failed', 401));
        return;
    }

    // Case insensitive role check
    const role = req.user.role?.toUpperCase();
    if (role === 'DOCTOR' || role === 'ADMIN') {
        next();
    } else {
        res.status(403).json(Resp.fail('Access denied: Doctor only', 403));
    }
};

/**
 * Middleware to check if user is an admin
 */
export const adminAuth = (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
        res.status(401).json(Resp.fail('Authentication failed', 401));
        return;
    }

    // Case insensitive role check
    const role = req.user.role?.toUpperCase();
    if (role === 'ADMIN') {
        next();
    } else {
        res.status(403).json(Resp.fail('Access denied: Admin only', 403));
    }
};

/**
 * Middleware to check if user belongs to the current tenant
 * This middleware should be used after auth and tenantContext
 */
export const tenantAuth = (req: Request, res: Response, next: NextFunction) => {
    if (!req.user || !req.tenant) {
        res.status(401).json(Resp.fail('Authentication failed', 401));
        return;
    }

    // Check if user belongs to the current tenant
    if (req.user.tenantId && req.user.tenantId !== req.tenant.id) {
        res.status(403).json(Resp.fail('Access denied: User does not belong to this tenant', 403));
        return;
    }

    next();
};