import { Usage, DailyUsage, ModelUsage } from '../domains/billing/usage.entity';
import { BillingPlan } from '../domains/billing/billing-plan.entity';
import { Invoice } from '../domains/billing/invoice.entity';
import { Rate, OverageSettings } from '../domains/billing/rate.entity';

export interface IBillingRepository {
    // 使用量统计
    findUsageAll(): Promise<{ usages: Usage[]; total: number }>;
    findUsageByTenant(tenantId: string): Promise<Usage[]>;
    findDailyUsageByTenant(tenantId: string, startDate: Date, endDate: Date): Promise<DailyUsage[]>;
    findModelUsageByTenant(tenantId: string): Promise<ModelUsage[]>;
    recordUsage(usage: Partial<Usage>): Promise<Usage>;

    // 套餐与计费
    findAllBillingPlans(): Promise<BillingPlan[]>;
    findBillingPlanById(id: string): Promise<BillingPlan | null>;
    createBillingPlan(plan: Partial<BillingPlan>): Promise<BillingPlan>;
    updateBillingPlan(id: string, plan: Partial<BillingPlan>): Promise<BillingPlan>;
    deleteBillingPlan(id: string): Promise<void>;
    
    // 资源单价
    findAllRates(): Promise<Rate[]>;
    findRateById(id: string): Promise<Rate | null>;
    createRate(rate: Partial<Rate>): Promise<Rate>;
    updateRate(id: string, rate: Partial<Rate>): Promise<Rate>;
    
    // 账单管理
    findAllInvoices(): Promise<{ invoices: Invoice[]; total: number }>;
    findInvoiceById(id: string): Promise<Invoice | null>;
    findInvoicesByTenant(tenantId: string): Promise<Invoice[]>;
    createInvoice(invoice: Partial<Invoice>): Promise<Invoice>;
    updateInvoiceStatus(id: string, status: 'DRAFT' | 'PENDING' | 'PAID' | 'OVERDUE' | 'CANCELLED'): Promise<Invoice>;
    
    // 超额计费
    findOverages(tenantId?: string): Promise<Usage[]>;
    findOverageSettings(tenantId?: string): Promise<OverageSettings | null>;
    createOverageSettings(settings: Partial<OverageSettings>): Promise<OverageSettings>;
    updateOverageSettings(id: string, settings: Partial<OverageSettings>): Promise<OverageSettings>;
} 