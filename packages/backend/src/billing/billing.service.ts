import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { 
  Usage, 
  BillingPlan, 
  Invoice, 
  Rate, 
  OverageSettings,
  InvoiceStatus
} from '@prisma/client';

@Injectable()
export class BillingService {
  constructor(private prisma: PrismaService) {}

  // 使用量统计
  async getAllUsage(): Promise<{ usages: Usage[]; total: number }> {
    const [usages, total] = await Promise.all([
      this.prisma.usage.findMany({
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.usage.count(),
    ]);
    return { usages, total };
  }

  async getTenantUsage(tenantId: string): Promise<Usage[]> {
    return this.prisma.usage.findMany({
      where: { tenantId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async recordUsage(data: any): Promise<Usage> {
    if (!data.tenantId) {
      throw new BadRequestException('Tenant ID is required');
    }
    return this.prisma.usage.create({
      data,
    });
  }

  // 套餐与计费
  async getAllBillingPlans(): Promise<BillingPlan[]> {
    return this.prisma.billingPlan.findMany();
  }

  async getBillingPlanById(id: string): Promise<BillingPlan> {
    const plan = await this.prisma.billingPlan.findUnique({
      where: { id },
    });
    if (!plan) {
      throw new NotFoundException('Billing plan not found');
    }
    return plan;
  }

  async createBillingPlan(data: any): Promise<BillingPlan> {
    this.validateBillingPlan(data);
    return this.prisma.billingPlan.create({
      data,
    });
  }

  async updateBillingPlan(id: string, data: any): Promise<BillingPlan> {
    await this.getBillingPlanById(id);
    return this.prisma.billingPlan.update({
      where: { id },
      data,
    });
  }

  async deleteBillingPlan(id: string): Promise<void> {
    await this.getBillingPlanById(id);
    await this.prisma.billingPlan.delete({
      where: { id },
    });
  }

  // 资源单价
  async getAllRates(): Promise<Rate[]> {
    return this.prisma.rate.findMany();
  }

  async getRateById(id: string): Promise<Rate> {
    const rate = await this.prisma.rate.findUnique({
      where: { id },
    });
    if (!rate) {
      throw new NotFoundException('Rate not found');
    }
    return rate;
  }

  async createRate(data: any): Promise<Rate> {
    this.validateRate(data);
    return this.prisma.rate.create({
      data,
    });
  }

  async updateRate(id: string, data: any): Promise<Rate> {
    await this.getRateById(id);
    return this.prisma.rate.update({
      where: { id },
      data,
    });
  }

  // 账单管理
  async getAllInvoices(): Promise<{ invoices: Invoice[]; total: number }> {
    const [invoices, total] = await Promise.all([
      this.prisma.invoice.findMany({
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.invoice.count(),
    ]);
    return { invoices, total };
  }

  async getInvoiceById(id: string): Promise<Invoice> {
    const invoice = await this.prisma.invoice.findUnique({
      where: { id },
    });
    if (!invoice) {
      throw new NotFoundException('Invoice not found');
    }
    return invoice;
  }

  async getTenantInvoices(tenantId: string): Promise<Invoice[]> {
    return this.prisma.invoice.findMany({
      where: { tenantId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async generateInvoice(data: any): Promise<Invoice> {
    this.validateInvoice(data);
    if (!data.invoiceNumber) {
      data.invoiceNumber = `INV-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    }
    return this.prisma.invoice.create({
      data,
    });
  }

  async updateInvoiceStatus(id: string, status: InvoiceStatus): Promise<Invoice> {
    await this.getInvoiceById(id);
    return this.prisma.invoice.update({
      where: { id },
      data: { status },
    });
  }

  // 超额计费
  async getOverages(tenantId?: string): Promise<Usage[]> {
    return this.prisma.usage.findMany({
      where: {
        tenantId,
        isOverage: true,
      },
    });
  }

  async getOverageSettings(tenantId: string): Promise<OverageSettings | null> {
    return this.prisma.overageSettings.findUnique({
      where: { tenantId },
    });
  }

  async createOverageSettings(data: any): Promise<OverageSettings> {
    if (!data.tenantId) {
      throw new BadRequestException('Tenant ID is required');
    }
    if (data.notificationThreshold === undefined) {
      throw new BadRequestException('Notification threshold is required');
    }

    const existing = await this.getOverageSettings(data.tenantId);
    if (existing) {
      throw new BadRequestException('Overage settings already exist for this tenant');
    }

    return this.prisma.overageSettings.create({
      data,
    });
  }

  private validateBillingPlan(plan: any): void {
    if (!plan.name) throw new BadRequestException('Plan name is required');
    if (!plan.code) throw new BadRequestException('Plan code is required');
    if (!plan.basePrice) throw new BadRequestException('Base price is required');
    if (!plan.currency) throw new BadRequestException('Currency is required');
    if (!plan.billingCycle) throw new BadRequestException('Billing cycle is required');
  }

  private validateRate(rate: any): void {
    if (!rate.resourceType) throw new BadRequestException('Resource type is required');
    if (!rate.unitPrice) throw new BadRequestException('Unit price is required');
    if (!rate.currency) throw new BadRequestException('Currency is required');
  }

  private validateInvoice(invoice: any): void {
    if (!invoice.tenantId) throw new BadRequestException('Tenant ID is required');
    if (!invoice.amount) throw new BadRequestException('Amount is required');
    if (!invoice.currency) throw new BadRequestException('Currency is required');
    if (!invoice.dueDate) throw new BadRequestException('Due date is required');
    if (!invoice.billingPeriodStart || !invoice.billingPeriodEnd) {
      throw new BadRequestException('Billing period is required');
    }
  }
}
