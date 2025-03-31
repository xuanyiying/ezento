export interface Rate {
    id: string;
    resourceType: 'API_CALL' | 'TOKEN' | 'STORAGE';
    modelId?: string;
    unitPrice: number;
    currency: string;
    effectiveDate: Date;
    expirationDate?: Date;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}

export interface OverageSettings {
    id: string;
    tenantId: string;
    allowOverage: boolean;
    notificationThreshold: number;
    notificationEmail?: string;
    autoDisable: boolean;
    disableThreshold?: number;
    createdAt: Date;
    updatedAt: Date;
} 