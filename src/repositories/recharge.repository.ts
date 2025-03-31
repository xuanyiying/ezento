import { RechargeCard, RechargeRecord, RechargeCardBatch } from '../domains/recharge/recharge.entity';

export interface IRechargeRepository {
    // 充值卡管理
    findRechargeCardByCode(code: string): Promise<RechargeCard | null>;
    findRechargeCardById(id: string): Promise<RechargeCard | null>;
    findRechargeCardsByTenant(tenantId: string, page: number, limit: number): Promise<{ cards: RechargeCard[]; total: number }>;
    createRechargeCard(card: Partial<RechargeCard>): Promise<RechargeCard>;
    updateRechargeCard(id: string, card: Partial<RechargeCard>): Promise<RechargeCard>;
    deleteRechargeCard(id: string): Promise<void>;

    // 充值卡批次管理
    findRechargeCardBatchById(id: string): Promise<RechargeCardBatch | null>;
    findRechargeCardBatchesByTenant(tenantId: string, page: number, limit: number): Promise<{ batches: RechargeCardBatch[]; total: number }>;
    createRechargeCardBatch(batch: Partial<RechargeCardBatch>): Promise<RechargeCardBatch>;
    updateRechargeCardBatch(id: string, batch: Partial<RechargeCardBatch>): Promise<RechargeCardBatch>;
    deleteRechargeCardBatch(id: string): Promise<void>;

    // 充值记录管理
    findRechargeRecordsByTenant(tenantId: string, page: number, limit: number): Promise<{ records: RechargeRecord[]; total: number }>;
    findRechargeRecordsByUser(userId: string, page: number, limit: number): Promise<{ records: RechargeRecord[]; total: number }>;
    createRechargeRecord(record: Partial<RechargeRecord>): Promise<RechargeRecord>;
} 