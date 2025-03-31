import { PrismaClient } from '@prisma/client';
import { ITenantRepository } from '../tenant.repository';
import { Tenant } from '../../domains/tenant/tenant.entity';
import { TenantPlan } from '../../domains/tenant-plan/tenant-plan.entity';

export class PrismaTenantRepository implements ITenantRepository {
    constructor(private prisma: PrismaClient) { }


    async findById(id: string): Promise<Tenant | null> {
        const tenant = await this.prisma.tenant.findUnique({
            where: { id }
        });
        return tenant ? this.mapToEntity(tenant) : null;
    }

    async findByCode(code: string): Promise<Tenant | null> {
        const tenant = await this.prisma.tenant.findUnique({
            where: { code }
        });
        return tenant ? this.mapToEntity(tenant) : null;
    }

    async findByDomain(domain: string): Promise<Tenant | null> {
        const tenant = await this.prisma.tenant.findFirst({
            where: {
                domains: {
                    array_contains: domain
                }
            }
        });
        return tenant ? this.mapToEntity(tenant) : null;
    }

    async findAll(): Promise<{ tenants: Tenant[]; total: number }> {
        const [tenants, total] = await Promise.all([
            this.prisma.tenant.findMany(),
            this.prisma.tenant.count()
        ]);
        return {
            tenants: tenants.map((tenant: any) => this.mapToEntity(tenant)),
            total
        };
    }

    async create(data: Partial<Tenant>): Promise<Tenant> {
        const tenant = await this.prisma.tenant.create({
            data: this.mapToPrisma(data)
        });
        return this.mapToEntity(tenant);
    }

    async update(id: string, data: Partial<Tenant>): Promise<Tenant> {
        const tenant = await this.prisma.tenant.update({
            where: { id },
            data: this.mapToPrisma(data)
        });
        return this.mapToEntity(tenant);
    }

    async delete(id: string): Promise<void> {
        await this.prisma.tenant.delete({
            where: { id }
        });
    }

    async changeStatus(id: string, status: 'ACTIVE' | 'SUSPENDED' | 'TERMINATED'): Promise<Tenant> {
        const tenant = await this.prisma.tenant.update({
            where: { id },
            data: { status }
        });
        return this.mapToEntity(tenant);
    }

    async changePlan(id: string, plan: string): Promise<Tenant> {
        const tenant = await this.prisma.tenant.update({
            where: { id },
            data: { plan }
        });
        return this.mapToEntity(tenant);
    }

    async getUserCount(id: string): Promise<number> {
        return this.prisma.user.count({
            where: { tenantId: id }
        });
    }

    async getTenantPlans(): Promise<TenantPlan[]> {
        const plans = await this.prisma.tenantPlan.findMany();
        return plans.map(plan => ({
            id: plan.id,
            code: plan.code,
            name: plan.name,
            price: plan.price,
            features: plan.features as string[],
            limits: plan.limits as Record<string, any>,
            createdAt: plan.createdAt,
            updatedAt: plan.updatedAt
        }));
    }

    private mapToEntity(prismaTenant: any): Tenant {
        return {
            id: prismaTenant.id,
            name: prismaTenant.name,
            code: prismaTenant.code,
            status: prismaTenant.status,
            plan: prismaTenant.plan,
            settings: prismaTenant.settings,
            theme: prismaTenant.theme,
            apiCallLimits: prismaTenant.apiCallLimits,
            createdAt: prismaTenant.createdAt,
            updatedAt: prismaTenant.updatedAt
        };
    }

    private mapToPrisma(tenant: Partial<Tenant>): any {
        return {
            name: tenant.name,
            code: tenant.code,
            status: tenant.status,
            plan: tenant.plan,
            settings: tenant.settings,
            theme: tenant.theme,
            apiCallLimits: tenant.apiCallLimits
        };
    }
} 