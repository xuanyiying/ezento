export type TenantStatus = 'ACTIVE' | 'SUSPENDED' | 'TERMINATED';
export type IsolationPolicy = 'DEFAULT' | 'STRICT' | 'CUSTOM';

export interface TenantDomain {
    domain: string;
    isPrimary: boolean;
    isVerified: boolean;
}

export interface TenantSettings {
    theme?: Record<string, any>;
    features?: string[];
    apiCallLimits?: {
        defaultLimit: number;
        defaultWindow: number;
    };
}

export interface TenantPlan {
    id: string;
    name: string;
    description: string;
    price: number;
    features: string[];
    limits: {
        users: number;
        storage: number;
        apiCalls: number;
    };
}

export interface CreateTenantDto {
    name: string;
    planId: string;
    isolationPolicy?: IsolationPolicy;
    domains: TenantDomain[];
    settings?: TenantSettings;
    adminEmail: string;
    adminName: string;
    adminPassword: string;
}

export interface UpdateTenantDto {
    name?: string;
    planId?: string;
    isolationPolicy?: IsolationPolicy;
    status?: TenantStatus;
    settings?: TenantSettings;
}

export interface TenantStats {
    tenantId: string;
    userCount: number;
    apiUsage: {
        total: number;
        daily: Record<string, number>;
        endpoints: Record<string, number>;
    };
} 