import { IRechargeRepository } from '../repositories/recharge.repository';
import { RechargeCard, RechargeRecord, RechargeCardBatch } from '../domains/recharge/recharge.entity';
import { ApiError } from '../middlewares/errorHandler';
import { generateRandomCode } from '../utils/codeGenerator';

export class RechargeService {
    constructor(private rechargeRepository: IRechargeRepository) { }

    // 充值卡管理
    async getRechargeCardByCode(code: string): Promise<RechargeCard> {
        const card = await this.rechargeRepository.findRechargeCardByCode(code);
        if (!card) {
            throw new ApiError(404, '充值卡不存在');
        }
        return card;
    }

    async getRechargeCardById(id: string): Promise<RechargeCard> {
        const card = await this.rechargeRepository.findRechargeCardById(id);
        if (!card) {
            throw new ApiError(404, '充值卡不存在');
        }
        return card;
    }

    async getRechargeCardsByTenant(tenantId: string, page = 1, limit = 10): Promise<{ cards: RechargeCard[]; total: number }> {
        return this.rechargeRepository.findRechargeCardsByTenant(tenantId, page, limit);
    }

    async createRechargeCard(card: Partial<RechargeCard>): Promise<RechargeCard> {
        this.validateRechargeCard(card);
        return this.rechargeRepository.createRechargeCard(card);
    }

    async updateRechargeCard(id: string, card: Partial<RechargeCard>): Promise<RechargeCard> {
        await this.getRechargeCardById(id);
        return this.rechargeRepository.updateRechargeCard(id, card);
    }

    async deleteRechargeCard(id: string): Promise<void> {
        await this.getRechargeCardById(id);
        return this.rechargeRepository.deleteRechargeCard(id);
    }

    // 充值卡批次管理
    async getRechargeCardBatchById(id: string): Promise<RechargeCardBatch> {
        const batch = await this.rechargeRepository.findRechargeCardBatchById(id);
        if (!batch) {
            throw new ApiError(404, '充值卡批次不存在');
        }
        return batch;
    }

    async getRechargeCardBatchesByTenant(tenantId: string, page = 1, limit = 10): Promise<{ batches: RechargeCardBatch[]; total: number }> {
        return this.rechargeRepository.findRechargeCardBatchesByTenant(tenantId, page, limit);
    }

    async createRechargeCardBatch(batch: Partial<RechargeCardBatch>): Promise<RechargeCardBatch> {
        this.validateRechargeCardBatch(batch);
        return this.rechargeRepository.createRechargeCardBatch(batch);
    }

    async updateRechargeCardBatch(id: string, batch: Partial<RechargeCardBatch>): Promise<RechargeCardBatch> {
        await this.getRechargeCardBatchById(id);
        return this.rechargeRepository.updateRechargeCardBatch(id, batch);
    }

    async deleteRechargeCardBatch(id: string): Promise<void> {
        await this.getRechargeCardBatchById(id);
        return this.rechargeRepository.deleteRechargeCardBatch(id);
    }

    // 充值记录管理
    async getRechargeRecordsByTenant(tenantId: string, page = 1, limit = 10): Promise<{ records: RechargeRecord[]; total: number }> {
        return this.rechargeRepository.findRechargeRecordsByTenant(tenantId, page, limit);
    }

    async getRechargeRecordsByUser(userId: string, page = 1, limit = 10): Promise<{ records: RechargeRecord[]; total: number }> {
        return this.rechargeRepository.findRechargeRecordsByUser(userId, page, limit);
    }

    async createRechargeRecord(record: Partial<RechargeRecord>): Promise<RechargeRecord> {
        this.validateRechargeRecord(record);
        return this.rechargeRepository.createRechargeRecord(record);
    }

    // 私有验证方法
    private validateRechargeCard(card: Partial<RechargeCard>): void {
        if (!card.tenantId) {
            throw new ApiError(400, '租户ID不能为空');
        }
        if (!card.amount || card.amount <= 0) {
            throw new ApiError(400, '充值金额必须大于0');
        }
        if (!card.expiredAt) {
            throw new ApiError(400, '过期时间不能为空');
        }
        if (card.expiredAt <= new Date()) {
            throw new ApiError(400, '过期时间必须大于当前时间');
        }
    }

    private validateRechargeCardBatch(batch: Partial<RechargeCardBatch>): void {
        if (!batch.tenantId) {
            throw new ApiError(400, '租户ID不能为空');
        }
        if (!batch.name) {
            throw new ApiError(400, '批次名称不能为空');
        }
        if (!batch.amount || batch.amount <= 0) {
            throw new ApiError(400, '充值金额必须大于0');
        }
        if (!batch.count || batch.count <= 0) {
            throw new ApiError(400, '生成数量必须大于0');
        }
        if (!batch.expiredAt) {
            throw new ApiError(400, '过期时间不能为空');
        }
        if (batch.expiredAt <= new Date()) {
            throw new ApiError(400, '过期时间必须大于当前时间');
        }
    }

    private validateRechargeRecord(record: Partial<RechargeRecord>): void {
        if (!record.tenantId) {
            throw new ApiError(400, '租户ID不能为空');
        }
        if (!record.userId) {
            throw new ApiError(400, '用户ID不能为空');
        }
        if (!record.cardId) {
            throw new ApiError(400, '充值卡ID不能为空');
        }
        if (!record.amount || record.amount <= 0) {
            throw new ApiError(400, '充值金额必须大于0');
        }
        if (!record.description) {
            throw new ApiError(400, '描述不能为空');
        }
    }
} 