import { Tenant } from '../domains/tenant/tenant.entity';
import { TenantPlan } from '../domains/tenant-plan/tenant-plan.entity';

export interface ITenantRepository {
    findById(id: string): Promise<Tenant | null>;
    findByCode(code: string): Promise<Tenant | null>;
    findByDomain(domain: string): Promise<Tenant | null>;
    findAll(): Promise<{ tenants: Tenant[]; total: number }>;
    create(data: Partial<Tenant>): Promise<Tenant>;
    update(id: string, data: Partial<Tenant>): Promise<Tenant>;
    delete(id: string): Promise<void>;
    changeStatus(id: string, status: 'ACTIVE' | 'SUSPENDED' | 'TERMINATED'): Promise<Tenant>;
    changePlan(id: string, plan: string): Promise<Tenant>;
    getUserCount(id: string): Promise<number>;
    getTenantPlans(): Promise<TenantPlan[]>;
}
