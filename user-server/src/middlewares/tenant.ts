import { Request, Response, NextFunction } from 'express';
import { Tenant } from '../models';
import { ITenant } from '../models/Tenant';
import { ResponseHelper } from '../utils/response';

// Add tenant to request object with proper type definition
declare global {
    namespace Express {
        interface Request {
            tenant?: {
                id: string;
                code: string;
                name: string;
            };
        }
    }
}

/**
 * Middleware to set tenant context based on subdomain or header
 * This middleware should be used after authentication
 */
export const tenantContext = (req: Request, res: Response, next: NextFunction) => {
    try {
        // Get tenant from subdomain or header
        const tenantCode = getTenantFromRequest(req);

        if (!tenantCode) {
            ResponseHelper.notFound(res, 'Tenant not specified');
            return;
        }

        // Find tenant in database
        Tenant.findOne({ code: tenantCode, isActive: true })
            .then((tenant: ITenant | null) => {
                if (!tenant) {
                    ResponseHelper.notFound(res, 'Tenant not found');
                    return;
                }

                // Set tenant in request
                req.tenant = {
                    id: tenant.id,
                    code: tenant.code,
                    name: tenant.name,
                };

                next();
            })
            .catch(error => {
                console.error('Error finding tenant:', error);
                ResponseHelper.serverError(res, 'Error finding tenant');
            });
    } catch (error) {
        console.error('Error in tenant middleware:', error);
        ResponseHelper.serverError(res, 'Error in tenant middleware');
    }
};

/**
 * Helper function to get tenant from request
 * This can be customized based on your requirements
 */
function getTenantFromRequest(req: Request): string | null {
    // Option 1: Get tenant from subdomain
    const host = req.get('host') || '';
    const subdomain = host.split('.')[0];

    // If subdomain is 'www' or 'localhost', try to get from header
    if (subdomain === 'www' || subdomain === 'localhost') {
        // Option 2: Get tenant from header
        return req.get('x-tenant-code') || null;
    }

    return subdomain;
}

/**
 * Middleware to ensure tenant context is set
 * This middleware should be used after tenantContext
 */
export const requireTenant = (req: Request, res: Response, next: NextFunction) => {
    if (!req.tenant) {
        ResponseHelper.notFound(res, 'Tenant not found');
        return;
    }
    next();
};
