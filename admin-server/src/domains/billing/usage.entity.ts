export interface Usage {
    id: string;
    tenantId: string;
    date: Date;
    modelId?: string;
    endpoint?: string;
    requestCount: number;
    tokenCount: number;
    costAmount: number;
    createdAt: Date;
    updatedAt: Date;
}

export interface DailyUsage {
    date: string;
    requestCount: number;
    tokenCount: number;
    costAmount: number;
}

export interface ModelUsage {
    modelId: string;
    modelName: string;
    requestCount: number;
    tokenCount: number;
    costAmount: number;
}
