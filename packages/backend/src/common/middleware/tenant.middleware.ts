import { Injectable, NestMiddleware, NotFoundException } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { PrismaService } from '../../prisma/prisma.service';

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

@Injectable()
export class TenantMiddleware implements NestMiddleware {
    constructor(private prisma: PrismaService) { }

    async use(req: Request, res: Response, next: NextFunction) {
        const tenantCode = this.getTenantFromRequest(req);

        if (!tenantCode) {
            throw new NotFoundException('Tenant not specified');
        }

        const tenant = await this.prisma.tenant.findUnique({
            where: { code: tenantCode, status: 'ACTIVE' },
        });

        if (!tenant) {
            throw new NotFoundException('Tenant not found or inactive');
        }

        req.tenant = {
            id: tenant.id,
            code: tenant.code,
            name: tenant.name,
        };

        next();
    }

    private getTenantFromRequest(req: Request): string | null {
        // Option 1: Get tenant from x-tenant-code header
        const headerTenant = req.get('x-tenant-code');
        if (headerTenant) return headerTenant;

        // Option 2: Get tenant from subdomain
        const host = req.get('host') || '';
        const subdomain = host.split('.')[0];

        if (subdomain !== 'www' && subdomain !== 'localhost' && subdomain !== 'api') {
            return subdomain;
        }

        return null;
    }
}
