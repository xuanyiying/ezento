import { InvoiceItemType, PrismaClient } from '@prisma/client';
import { IBillingRepository } from '../billing.repository';
import { Usage, DailyUsage, ModelUsage } from '../../domains/billing/usage.entity';
import { BillingPlan } from '../../domains/billing/billing-plan.entity';
import { Invoice } from '../../domains/billing/invoice.entity';
import { Rate, OverageSettings } from '../../domains/billing/rate.entity';

export class PrismaBillingRepository implements IBillingRepository {
    constructor(private prisma: PrismaClient) { }

    // 使用量统计
    async findUsageAll(): Promise<{ usages: Usage[]; total: number }> {
        const [usages, total] = await Promise.all([
            this.prisma.usage.findMany({
                orderBy: { date: 'desc' }
            }),
            this.prisma.usage.count()
        ]);

        return {
            usages: usages.map((usage: any) => this.mapUsageToEntity(usage)),
            total
        };
    }

    async findUsageByTenant(tenantId: string): Promise<Usage[]> {
        const usages = await this.prisma.usage.findMany({
            where: { tenantId },
            orderBy: { date: 'desc' }
        });

        return usages.map((usage: any) => this.mapUsageToEntity(usage));
    }

    async findDailyUsageByTenant(tenantId: string, startDate: Date, endDate: Date): Promise<DailyUsage[]> {
        const results = await this.prisma.$queryRaw`
            SELECT 
                DATE(date) as date,
                SUM(requestCount) as requestCount,
                SUM(tokenCount) as tokenCount,
                SUM(costAmount) as costAmount
            FROM Usage
            WHERE tenantId = ${tenantId}
                AND date BETWEEN ${startDate} AND ${endDate}
            GROUP BY DATE(date)
            ORDER BY date
        `;

        return results as DailyUsage[];
    }

    async findModelUsageByTenant(tenantId: string): Promise<ModelUsage[]> {
        const results = await this.prisma.$queryRaw`
            SELECT 
                u.modelId,
                m.name as modelName,
                SUM(u.requestCount) as requestCount,
                SUM(u.tokenCount) as tokenCount,
                SUM(u.costAmount) as costAmount
            FROM Usage u
            JOIN Model m ON u.modelId = m.id
            WHERE u.tenantId = ${tenantId}
            GROUP BY u.modelId, m.name
            ORDER BY costAmount DESC
        `;

        return results as ModelUsage[];
    }

    async recordUsage(usage: Partial<Usage>): Promise<Usage> {
        const newUsage = await this.prisma.usage.create({
            data: {
                tenantId: usage.tenantId!,
                date: usage.date || new Date(),
                modelId: usage.modelId,
                endpoint: usage.endpoint,
                requestCount: usage.requestCount || 1,
                tokenCount: usage.tokenCount || 0,
                costAmount: usage.costAmount || 0
            }
        });

        return this.mapUsageToEntity(newUsage);
    }

    // 套餐与计费
    async findAllBillingPlans(): Promise<BillingPlan[]> {
        const plans = await this.prisma.billingPlan.findMany({
            orderBy: { basePrice: 'asc' }
        });

        return plans.map((plan: any) => this.mapBillingPlanToEntity(plan));
    }

    async findBillingPlanById(id: string): Promise<BillingPlan | null> {
        const plan = await this.prisma.billingPlan.findUnique({
            where: { id }
        });

        return plan ? this.mapBillingPlanToEntity(plan) : null;
    }

    async createBillingPlan(plan: Partial<BillingPlan>): Promise<BillingPlan> {
        const newPlan = await this.prisma.billingPlan.create({
            data: {
                name: plan.name!,
                code: plan.code!,
                description: plan.description,
                basePrice: plan.basePrice!,
                currency: plan.currency!,
                billingCycle: plan.billingCycle!,
                includedResources: plan.includedResources!,
                overagePricing: plan.overagePricing!,
                isActive: plan.isActive ?? true
            }
        });

        return this.mapBillingPlanToEntity(newPlan);
    }

    async updateBillingPlan(id: string, plan: Partial<BillingPlan>): Promise<BillingPlan> {
        const updatedPlan = await this.prisma.billingPlan.update({
            where: { id },
            data: {
                name: plan.name,
                code: plan.code,
                description: plan.description,
                basePrice: plan.basePrice,
                currency: plan.currency,
                billingCycle: plan.billingCycle,
                includedResources: plan.includedResources,
                overagePricing: plan.overagePricing,
                isActive: plan.isActive
            }
        });

        return this.mapBillingPlanToEntity(updatedPlan);
    }

    async deleteBillingPlan(id: string): Promise<void> {
        await this.prisma.billingPlan.delete({
            where: { id }
        });
    }

    // 资源单价
    async findAllRates(): Promise<Rate[]> {
        const rates = await this.prisma.rate.findMany({
            where: { isActive: true },
            orderBy: { resourceType: 'asc' }
        });

        return rates.map((rate: any) => this.mapRateToEntity(rate));
    }

    async findRateById(id: string): Promise<Rate | null> {
        const rate = await this.prisma.rate.findUnique({
            where: { id }
        });

        return rate ? this.mapRateToEntity(rate) : null;
    }

    async createRate(rate: Partial<Rate>): Promise<Rate> {
        const newRate = await this.prisma.rate.create({
            data: {
                resourceType: rate.resourceType!,
                modelId: rate.modelId,
                unitPrice: rate.unitPrice!,
                currency: rate.currency!,
                effectiveDate: rate.effectiveDate || new Date(),
                expirationDate: rate.expirationDate,
                isActive: rate.isActive ?? true
            }
        });

        return this.mapRateToEntity(newRate);
    }

    async updateRate(id: string, rate: Partial<Rate>): Promise<Rate> {
        const updatedRate = await this.prisma.rate.update({
            where: { id },
            data: {
                resourceType: rate.resourceType,
                modelId: rate.modelId,
                unitPrice: rate.unitPrice,
                currency: rate.currency,
                effectiveDate: rate.effectiveDate,
                expirationDate: rate.expirationDate,
                isActive: rate.isActive
            }
        });

        return this.mapRateToEntity(updatedRate);
    }

    // 账单管理
    async findAllInvoices(): Promise<{ invoices: Invoice[]; total: number }> {
        const [invoices, total] = await Promise.all([
            this.prisma.invoice.findMany({
                include: { items: true },
                orderBy: { createdAt: 'desc' }
            }),
            this.prisma.invoice.count()
        ]);

        return {
            invoices: invoices.map((invoice: any) => this.mapInvoiceToEntity(invoice)),
            total
        };
    }

    async findInvoiceById(id: string): Promise<Invoice | null> {
        const invoice = await this.prisma.invoice.findUnique({
            where: { id },
            include: { items: true }
        });

        return invoice ? this.mapInvoiceToEntity(invoice) : null;
    }

    async findInvoicesByTenant(tenantId: string): Promise<Invoice[]> {
        const invoices = await this.prisma.invoice.findMany({
            where: { tenantId },
            include: { items: true },
            orderBy: { createdAt: 'desc' }
        });

        return invoices.map((invoice: any) => this.mapInvoiceToEntity(invoice));
    }

    async createInvoice(invoice: Partial<Invoice>): Promise<Invoice> {
        const newInvoice = await this.prisma.invoice.create({
            data: {
                tenantId: invoice.tenantId!,
                invoiceNumber: invoice.invoiceNumber!,
                status: invoice.status || 'DRAFT',
                amount: invoice.amount!,
                currency: invoice.currency!,
                dueDate: invoice.dueDate!,
                paidDate: invoice.paidDate,
                billingPeriodStart: invoice.billingPeriodStart!,
                billingPeriodEnd: invoice.billingPeriodEnd!,
                items: {
                    create: invoice.items?.map(item => ({
                        id: item.id,
                        invoiceId: item.invoiceId,
                        description: item.description,
                        quantity: item.quantity,
                        unitPrice: item.unitPrice,
                        amount: item.amount,
                        type: item.type as InvoiceItemType
                    }))
                }
            },
            include: { items: true }
        });

        return this.mapInvoiceToEntity(newInvoice);
    }

    async updateInvoiceStatus(id: string, status: 'DRAFT' | 'PENDING' | 'PAID' | 'OVERDUE' | 'CANCELLED'): Promise<Invoice> {
        const updatedData: any = { status };

        if (status === 'PAID') {
            updatedData.paidDate = new Date();
        }

        const updatedInvoice = await this.prisma.invoice.update({
            where: { id },
            data: updatedData,
            include: { items: true }
        });

        return this.mapInvoiceToEntity(updatedInvoice);
    }

    // 超额计费
    async findOverages(tenantId?: string): Promise<Usage[]> {
        const usages = await this.prisma.usage.findMany({
            where: {
                tenantId: tenantId ? tenantId : undefined,
                isOverage: true
            },
            orderBy: { date: 'desc' }
        });

        return usages.map((usage: any) => this.mapUsageToEntity(usage));
    }

    async findOverageSettings(tenantId?: string): Promise<OverageSettings | null> {
        const settings = await this.prisma.overageSettings.findFirst({
            where: { tenantId: tenantId ? tenantId : undefined }
        });

        return settings ? this.mapOverageSettingsToEntity(settings) : null;
    }

    async createOverageSettings(settings: Partial<OverageSettings>): Promise<OverageSettings> {
        const newSettings = await this.prisma.overageSettings.create({
            data: {
                tenantId: settings.tenantId!,
                allowOverage: settings.allowOverage ?? false,
                notificationThreshold: settings.notificationThreshold!,
                notificationEmail: settings.notificationEmail,
                autoDisable: settings.autoDisable ?? false,
                disableThreshold: settings.disableThreshold
            }
        });

        return this.mapOverageSettingsToEntity(newSettings);
    }

    async updateOverageSettings(id: string, settings: Partial<OverageSettings>): Promise<OverageSettings> {
        const updatedSettings = await this.prisma.overageSettings.update({
            where: { id },
            data: {
                allowOverage: settings.allowOverage,
                notificationThreshold: settings.notificationThreshold,
                notificationEmail: settings.notificationEmail,
                autoDisable: settings.autoDisable,
                disableThreshold: settings.disableThreshold
            }
        });

        return this.mapOverageSettingsToEntity(updatedSettings);
    }

    // 映射方法
    private mapUsageToEntity(usage: any): Usage {
        return {
            id: usage.id,
            tenantId: usage.tenantId,
            date: usage.date,
            modelId: usage.modelId,
            endpoint: usage.endpoint,
            requestCount: usage.requestCount,
            tokenCount: usage.tokenCount,
            costAmount: usage.costAmount,
            createdAt: usage.createdAt,
            updatedAt: usage.updatedAt
        };
    }

    private mapBillingPlanToEntity(plan: any): BillingPlan {
        return {
            id: plan.id,
            name: plan.name,
            code: plan.code,
            description: plan.description,
            basePrice: plan.basePrice,
            currency: plan.currency,
            billingCycle: plan.billingCycle,
            includedResources: plan.includedResources,
            overagePricing: plan.overagePricing,
            isActive: plan.isActive,
            createdAt: plan.createdAt,
            updatedAt: plan.updatedAt
        };
    }

    private mapRateToEntity(rate: any): Rate {
        return {
            id: rate.id,
            resourceType: rate.resourceType,
            modelId: rate.modelId,
            unitPrice: rate.unitPrice,
            currency: rate.currency,
            effectiveDate: rate.effectiveDate,
            expirationDate: rate.expirationDate,
            isActive: rate.isActive,
            createdAt: rate.createdAt,
            updatedAt: rate.updatedAt
        };
    }

    private mapInvoiceToEntity(invoice: any): Invoice {
        return {
            id: invoice.id,
            tenantId: invoice.tenantId,
            invoiceNumber: invoice.invoiceNumber,
            status: invoice.status,
            amount: invoice.amount,
            currency: invoice.currency,
            dueDate: invoice.dueDate,
            paidDate: invoice.paidDate,
            billingPeriodStart: invoice.billingPeriodStart,
            billingPeriodEnd: invoice.billingPeriodEnd,
            items: invoice.items.map((item: any) => ({
                id: item.id,
                invoiceId: item.invoiceId,
                description: item.description,
                quantity: item.quantity,
                unitPrice: item.unitPrice,
                amount: item.amount,
                type: item.type
            })),
            createdAt: invoice.createdAt,
            updatedAt: invoice.updatedAt
        };
    }

    private mapOverageSettingsToEntity(settings: any): OverageSettings {
        return {
            id: settings.id,
            tenantId: settings.tenantId,
            allowOverage: settings.allowOverage,
            notificationThreshold: settings.notificationThreshold,
            notificationEmail: settings.notificationEmail,
            autoDisable: settings.autoDisable,
            disableThreshold: settings.disableThreshold,
            createdAt: settings.createdAt,
            updatedAt: settings.updatedAt
        };
    }
} 