export interface BillingPlan {
    id: string;
    name: string;
    code: string;
    description?: string;
    basePrice: number;
    currency: string;
    billingCycle: 'MONTHLY' | 'QUARTERLY' | 'YEARLY';
    includedResources: {
        apiCalls?: number;
        tokens?: number;
        storage?: number;
        models?: string[];
    };
    overagePricing: {
        apiCalls?: number;
        tokens?: number;
        storage?: number;
    };
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}
