import { Request, Response, NextFunction } from 'express';
import { Tenant  } from '../models';
import { Resp } from '../utils/response';
import mongoose from 'mongoose';
import {ITenant} from "../models/Tenant";

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
            // If no tenant is specified, use the default tenant
            // In a real application, you might want to redirect to a tenant selection page
            // or return an error
            res.status(400).json(Resp.fail('Tenant not specified', 400));
            return;
        }

        // Find tenant in database
        Tenant.findOne({ code: tenantCode, isActive: true })
            .then((tenant: ITenant | null) => {
                if (!tenant) {
                    res.status(404).json(Resp.fail('Tenant not found', 404));
                    return;
                }

                // Set tenant in request
                req.tenant = {
                    id: (tenant._id as mongoose.Types.ObjectId).toString(),
                    code: tenant.code,
                    name: tenant.name
                };

                next();
            })
            .catch(error => {
                console.error('Error finding tenant:', error);
                res.status(500).json(Resp.fail('Error finding tenant', 500));
            });
    } catch (error) {
        console.error('Error in tenant middleware:', error);
        res.status(500).json(Resp.fail('Error in tenant middleware', 500));
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
        res.status(400).json(Resp.fail('Tenant context not set', 400));
        return;
    }
    next();
}; 