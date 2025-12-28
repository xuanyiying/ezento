import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Tenant, TenantPlan, TenantStatus } from '@prisma/client';

@Injectable()
export class TenantService {
  constructor(private prisma: PrismaService) {}

  async findById(id: string): Promise<Tenant | null> {
    return this.prisma.tenant.findUnique({
      where: { id },
    });
  }

  async findByCode(code: string): Promise<Tenant | null> {
    return this.prisma.tenant.findUnique({
      where: { code },
    });
  }

  async findByDomain(domain: string): Promise<Tenant | null> {
    // 假设 domains 是 Json 格式，存储域名列表
    const tenants = await this.prisma.tenant.findMany({
      where: {
        domains: {
          path: ['list'],
          array_contains: domain,
        },
      },
    });
    return tenants[0] || null;
  }

  async findAll(): Promise<{ tenants: Tenant[]; total: number }> {
    const [tenants, total] = await Promise.all([
      this.prisma.tenant.findMany({
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.tenant.count(),
    ]);
    return { tenants, total };
  }

  async create(data: any): Promise<Tenant> {
    if (!data.name) {
      throw new BadRequestException('Tenant name is required');
    }

    if (!data.code) {
      throw new BadRequestException('Tenant code is required');
    }

    const existingTenant = await this.findByCode(data.code);
    if (existingTenant) {
      throw new BadRequestException('Tenant code already exists');
    }

    return this.prisma.tenant.create({
      data: {
        ...data,
        status: data.status || 'ACTIVE',
        plan: data.plan || 'FREE',
        settings: data.settings || {},
        theme: data.theme || {},
        apiCallLimits: data.apiCallLimits || { daily: 1000, monthly: 30000 },
      },
    });
  }

  async update(id: string, data: any): Promise<Tenant> {
    const tenant = await this.findById(id);
    if (!tenant) {
      throw new NotFoundException('Tenant not found');
    }

    if (data.code && data.code !== tenant.code) {
      const existingTenant = await this.findByCode(data.code);
      if (existingTenant) {
        throw new BadRequestException('Tenant code already exists');
      }
    }

    return this.prisma.tenant.update({
      where: { id },
      data,
    });
  }

  async delete(id: string): Promise<void> {
    const tenant = await this.findById(id);
    if (!tenant) {
      throw new NotFoundException('Tenant not found');
    }

    const userCount = await this.prisma.user.count({
      where: { tenantId: id },
    });
    if (userCount > 0) {
      throw new BadRequestException('Cannot delete tenant with associated users');
    }

    await this.prisma.tenant.delete({
      where: { id },
    });
  }

  async changeStatus(id: string, status: TenantStatus): Promise<Tenant> {
    await this.findById(id);
    return this.prisma.tenant.update({
      where: { id },
      data: { status },
    });
  }

  async changePlan(id: string, planCode: string): Promise<Tenant> {
    const tenant = await this.findById(id);
    if (!tenant) {
      throw new NotFoundException('Tenant not found');
    }

    const plan = await this.prisma.tenantPlan.findUnique({
      where: { code: planCode },
    });
    if (!plan) {
      throw new BadRequestException('Invalid plan code');
    }

    return this.prisma.tenant.update({
      where: { id },
      data: { plan: planCode },
    });
  }

  async getTenantPlans(): Promise<TenantPlan[]> {
    return this.prisma.tenantPlan.findMany();
  }

  async getTenantConfig(tenantId: string): Promise<Tenant | null> {
    return this.findById(tenantId);
  }

  async updateTenantConfig(tenantId: string, config: any): Promise<Tenant> {
    return this.update(tenantId, config);
  }

  async getTenantStats(tenantId: string): Promise<any> {
    const tenant = await this.findById(tenantId);
    if (!tenant) {
      throw new NotFoundException('Tenant not found');
    }

    const userCount = await this.prisma.user.count({
      where: { tenantId },
    });

    return {
      userCount,
      status: tenant.status,
      plan: tenant.plan,
      createdAt: tenant.createdAt,
    };
  }
}
