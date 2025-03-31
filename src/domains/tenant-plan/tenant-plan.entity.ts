export interface TenantPlan {
    id: string;
    code: string;
    name: string;
    price: number;
    features: string[];
    limits: {
        users?: number;
        storage?: number;
        apiCalls?: number;
        models?: string[];
    };
    createdAt: Date;
    updatedAt: Date;
} 