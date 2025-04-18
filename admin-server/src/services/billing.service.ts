import { IBillingRepository } from '../repositories/billing.repository';
import { Usage, DailyUsage, ModelUsage } from '../domains/billing/usage.entity';
import { BillingPlan } from '../domains/billing/billing-plan.entity';
import { Invoice } from '../domains/billing/invoice.entity';
import { Rate, OverageSettings } from '../domains/billing/rate.entity';
import { ApiError } from '../middlewares/errorHandler';

export class BillingService {
    constructor(private billingRepository: IBillingRepository) {}

    // 使用量统计
    async getAllUsage(): Promise<{ usages: Usage[]; total: number }> {
        return this.billingRepository.findUsageAll();
    }

    async getTenantUsage(tenantId: string): Promise<Usage[]> {
        return this.billingRepository.findUsageByTenant(tenantId);
    }

    async getTenantDailyUsage(
        tenantId: string,
        startDate: Date,
        endDate: Date
    ): Promise<DailyUsage[]> {
        return this.billingRepository.findDailyUsageByTenant(tenantId, startDate, endDate);
    }

    async getTenantModelUsage(tenantId: string): Promise<ModelUsage[]> {
        return this.billingRepository.findModelUsageByTenant(tenantId);
    }

    async recordUsage(usage: Partial<Usage>): Promise<Usage> {
        if (!usage.tenantId) {
            throw new ApiError(400, '租户ID不能为空');
        }

        return this.billingRepository.recordUsage(usage);
    }

    // 套餐与计费
    async getAllBillingPlans(): Promise<BillingPlan[]> {
        return this.billingRepository.findAllBillingPlans();
    }

    async getBillingPlanById(id: string): Promise<BillingPlan> {
        const plan = await this.billingRepository.findBillingPlanById(id);
        if (!plan) {
            throw new ApiError(404, '计费套餐不存在');
        }
        return plan;
    }

    async createBillingPlan(plan: Partial<BillingPlan>): Promise<BillingPlan> {
        if (!plan.name) {
            throw new ApiError(400, '套餐名称不能为空');
        }

        if (!plan.code) {
            throw new ApiError(400, '套餐代码不能为空');
        }

        if (!plan.basePrice) {
            throw new ApiError(400, '基础价格不能为空');
        }

        if (!plan.currency) {
            throw new ApiError(400, '货币单位不能为空');
        }

        if (!plan.billingCycle) {
            throw new ApiError(400, '计费周期不能为空');
        }

        return this.billingRepository.createBillingPlan(plan);
    }

    async updateBillingPlan(id: string, plan: Partial<BillingPlan>): Promise<BillingPlan> {
        await this.getBillingPlanById(id);
        return this.billingRepository.updateBillingPlan(id, plan);
    }

    async deleteBillingPlan(id: string): Promise<void> {
        await this.getBillingPlanById(id);
        return this.billingRepository.deleteBillingPlan(id);
    }

    // 资源单价
    async getAllRates(): Promise<Rate[]> {
        return this.billingRepository.findAllRates();
    }

    async getRateById(id: string): Promise<Rate> {
        const rate = await this.billingRepository.findRateById(id);
        if (!rate) {
            throw new ApiError(404, '资源单价不存在');
        }
        return rate;
    }

    async createRate(rate: Partial<Rate>): Promise<Rate> {
        if (!rate.resourceType) {
            throw new ApiError(400, '资源类型不能为空');
        }

        if (!rate.unitPrice) {
            throw new ApiError(400, '单价不能为空');
        }

        if (!rate.currency) {
            throw new ApiError(400, '货币单位不能为空');
        }

        return this.billingRepository.createRate(rate);
    }

    async updateRate(id: string, rate: Partial<Rate>): Promise<Rate> {
        await this.getRateById(id);
        return this.billingRepository.updateRate(id, rate);
    }

    // 账单管理
    async getAllInvoices(): Promise<{ invoices: Invoice[]; total: number }> {
        return this.billingRepository.findAllInvoices();
    }

    async getInvoiceById(id: string): Promise<Invoice> {
        const invoice = await this.billingRepository.findInvoiceById(id);
        if (!invoice) {
            throw new ApiError(404, '账单不存在');
        }
        return invoice;
    }

    async getTenantInvoices(tenantId: string): Promise<Invoice[]> {
        return this.billingRepository.findInvoicesByTenant(tenantId);
    }

    async generateInvoice(invoice: Partial<Invoice>): Promise<Invoice> {
        if (!invoice.tenantId) {
            throw new ApiError(400, '租户ID不能为空');
        }

        if (!invoice.amount) {
            throw new ApiError(400, '账单金额不能为空');
        }

        if (!invoice.currency) {
            throw new ApiError(400, '货币单位不能为空');
        }

        if (!invoice.dueDate) {
            throw new ApiError(400, '到期日不能为空');
        }

        if (!invoice.billingPeriodStart || !invoice.billingPeriodEnd) {
            throw new ApiError(400, '账单周期不能为空');
        }

        // 生成唯一的账单编号
        if (!invoice.invoiceNumber) {
            invoice.invoiceNumber = `INV-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
        }

        return this.billingRepository.createInvoice(invoice);
    }

    async updateInvoiceStatus(
        id: string,
        status: 'DRAFT' | 'PENDING' | 'PAID' | 'OVERDUE' | 'CANCELLED'
    ): Promise<Invoice> {
        await this.getInvoiceById(id);
        return this.billingRepository.updateInvoiceStatus(id, status);
    }

    // 超额计费
    async getOverages(tenantId?: string): Promise<Usage[]> {
        return this.billingRepository.findOverages(tenantId);
    }

    async getOverageSettings(tenantId?: string): Promise<OverageSettings | null> {
        return this.billingRepository.findOverageSettings(tenantId);
    }

    async createOverageSettings(settings: Partial<OverageSettings>): Promise<OverageSettings> {
        if (!settings.tenantId) {
            throw new ApiError(400, '租户ID不能为空');
        }

        if (settings.notificationThreshold === undefined) {
            throw new ApiError(400, '通知阈值不能为空');
        }

        const existingSettings = await this.billingRepository.findOverageSettings(
            settings.tenantId
        );
        if (existingSettings) {
            throw new ApiError(400, '超额设置已存在');
        }

        return this.billingRepository.createOverageSettings(settings);
    }

    async updateOverageSettings(
        id: string,
        settings: Partial<OverageSettings>
    ): Promise<OverageSettings> {
        const existingSettings = await this.billingRepository.findOverageSettings();
        if (!existingSettings || existingSettings.id !== id) {
            throw new ApiError(404, '超额设置不存在');
        }

        return this.billingRepository.updateOverageSettings(id, settings);
    }

    async notifyOverage(tenantId: string): Promise<void> {
        const settings = await this.billingRepository.findOverageSettings(tenantId);
        if (!settings) {
            throw new ApiError(404, '超额设置不存在');
        }

        if (!settings.notificationEmail) {
            throw new ApiError(400, '未设置通知邮箱');
        }

        // 实现发送邮件的逻辑，此处略
        console.log(`发送超额使用通知到 ${settings.notificationEmail}`);
    }
}
