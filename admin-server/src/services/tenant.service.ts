import { ITenantRepository } from '../repositories/tenant.repository';
import { Tenant } from '../domains/tenant/tenant.entity';
import { TenantPlan } from '../domains/tenant-plan/tenant-plan.entity';
import { ApiError } from '../middlewares/errorHandler';

export class TenantService {
    constructor(private tenantRepository: ITenantRepository) { }

    async findById(id: string): Promise<Tenant | null> {
        return this.tenantRepository.findById(id);
    }

    async findByCode(code: string): Promise<Tenant | null> {
        return this.tenantRepository.findByCode(code);
    }

    async findByDomain(domain: string): Promise<Tenant | null> {
        return this.tenantRepository.findByDomain(domain);
    }

    async findAll(): Promise<{ tenants: Tenant[]; total: number }> {
        return this.tenantRepository.findAll();
    }

    async create(data: Partial<Tenant>): Promise<Tenant> {
        if (!data.name) {
            throw new ApiError(400, '租户名称不能为空');
        }

        if (!data.code) {
            throw new ApiError(400, '租户代码不能为空');
        }

        const existingTenant = await this.findByCode(data.code);
        if (existingTenant) {
            throw new ApiError(400, '租户代码已存在');
        }

        // 设置默认值
        return this.tenantRepository.create({
            ...data,
            status: data.status || 'ACTIVE',
            plan: data.plan || 'FREE',
            settings: data.settings || {},
            theme: data.theme || {},
            apiCallLimits: data.apiCallLimits || { daily: 1000, monthly: 30000 }
        });
    }

    async update(id: string, data: Partial<Tenant>): Promise<Tenant> {
        const tenant = await this.findById(id);
        if (!tenant) {
            throw new ApiError(404, '租户不存在');
        }

        if (data.code && data.code !== tenant.code) {
            const existingTenant = await this.findByCode(data.code);
            if (existingTenant) {
                throw new ApiError(400, '租户代码已存在');
            }
        }

        return this.tenantRepository.update(id, data);
    }

    async delete(id: string): Promise<void> {
        const tenant = await this.findById(id);
        if (!tenant) {
            throw new ApiError(404, '租户不存在');
        }

        const userCount = await this.tenantRepository.getUserCount(id);
        if (userCount > 0) {
            throw new ApiError(400, '租户下存在用户，无法删除');
        }

        await this.tenantRepository.delete(id);
    }

    async changeStatus(id: string, status: 'ACTIVE' | 'SUSPENDED' | 'TERMINATED'): Promise<Tenant> {
        const tenant = await this.findById(id);
        if (!tenant) {
            throw new ApiError(404, '租户不存在');
        }

        return this.tenantRepository.changeStatus(id, status);
    }

    async changePlan(id: string, plan: string): Promise<Tenant> {
        const tenant = await this.findById(id);
        if (!tenant) {
            throw new ApiError(404, '租户不存在');
        }

        const plans = await this.getTenantPlans();
        const validPlan = plans.find(p => p.code === plan);
        if (!validPlan) {
            throw new ApiError(400, '无效的套餐');
        }

        return this.tenantRepository.changePlan(id, plan);
    }

    async getTenantPlans(): Promise<TenantPlan[]> {
        return this.tenantRepository.getTenantPlans();
    }

    async getTenantConfig(tenantId: string): Promise<Tenant | null> {
        return this.findById(tenantId);
    }

    async updateTenantConfig(tenantId: string, config: Partial<Tenant>): Promise<Tenant> {
        const tenant = await this.findById(tenantId);
        if (!tenant) {
            throw new ApiError(404, '租户不存在');
        }

        return this.tenantRepository.update(tenantId, config);
    }

    async getTenantStats(tenantId: string): Promise<any> {
        const tenant = await this.findById(tenantId);
        if (!tenant) {
            throw new ApiError(404, '租户不存在');
        }

        const userCount = await this.tenantRepository.getUserCount(tenantId);

        // 这里未来可以扩展添加更多统计数据，如API调用量，存储使用量等
        return {
            userCount,
            status: tenant.status,
            plan: tenant.plan,
            createdAt: tenant.createdAt
        };
    }
} 