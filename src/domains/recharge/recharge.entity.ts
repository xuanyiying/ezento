export interface RechargeCard {
    id: string;
    tenantId: string;
    code: string;
    amount: number;
    status: 'UNUSED' | 'USED' | 'EXPIRED';
    usedBy?: string;
    usedAt?: Date;
    expiredAt: Date;
    createdAt: Date;
    updatedAt: Date;
}

export interface RechargeRecord {
    id: string;
    tenantId: string;
    userId: string;
    cardId: string;
    amount: number;
    balanceBefore: number;
    balanceAfter: number;
    type: 'RECHARGE' | 'CONSUME';
    description: string;
    metadata: Record<string, any>;
    createdAt: Date;
}

export interface RechargeCardBatch {
    id: string;
    tenantId: string;
    name: string;
    amount: number;
    count: number;
    usedCount: number;
    expiredAt: Date;
    status: 'ACTIVE' | 'COMPLETED' | 'EXPIRED';
    metadata: Record<string, any>;
    createdAt: Date;
    updatedAt: Date;
} 