import { PrismaClient } from '@prisma/client';
import { IRechargeRepository } from '../recharge.repository';
import {
    RechargeCard,
    RechargeRecord,
    RechargeCardBatch,
} from '../../domains/recharge/recharge.entity';

export class PrismaRechargeRepository implements IRechargeRepository {
    constructor(private prisma: PrismaClient) {}

    async findRechargeCardByCode(code: string): Promise<RechargeCard | null> {
        const card = await this.prisma.rechargeCard.findUnique({
            where: { code },
        });
        return card ? this.mapToRechargeCard(card) : null;
    }

    async findRechargeCardById(id: string): Promise<RechargeCard | null> {
        const card = await this.prisma.rechargeCard.findUnique({
            where: { id },
        });
        return card ? this.mapToRechargeCard(card) : null;
    }

    async findRechargeCardsByTenant(
        tenantId: string,
        page: number,
        limit: number
    ): Promise<{ cards: RechargeCard[]; total: number }> {
        const [cards, total] = await Promise.all([
            this.prisma.rechargeCard.findMany({
                where: { tenantId },
                skip: (page - 1) * limit,
                take: limit,
                orderBy: { createdAt: 'desc' },
            }),
            this.prisma.rechargeCard.count({
                where: { tenantId },
            }),
        ]);

        return {
            cards: cards.map(card => this.mapToRechargeCard(card)),
            total,
        };
    }

    async createRechargeCard(card: Partial<RechargeCard>): Promise<RechargeCard> {
        const newCard = await this.prisma.rechargeCard.create({
            data: {
                tenantId: card.tenantId!,
                code: card.code!,
                amount: card.amount!,
                status: card.status || 'UNUSED',
                expiredAt: card.expiredAt!,
            } as any,
        });
        return this.mapToRechargeCard(newCard);
    }

    async updateRechargeCard(id: string, card: Partial<RechargeCard>): Promise<RechargeCard> {
        const updatedCard = await this.prisma.rechargeCard.update({
            where: { id },
            data: {
                code: card.code,
                amount: card.amount,
                status: card.status,
                expiredAt: card.expiredAt,
            },
        });
        return this.mapToRechargeCard(updatedCard);
    }

    async deleteRechargeCard(id: string): Promise<void> {
        await this.prisma.rechargeCard.delete({
            where: { id },
        });
    }

    async findRechargeCardBatchById(id: string): Promise<RechargeCardBatch | null> {
        const batch = await this.prisma.rechargeCardBatch.findUnique({
            where: { id },
        });
        return batch ? this.mapToRechargeCardBatch(batch) : null;
    }

    async findRechargeCardBatchesByTenant(
        tenantId: string,
        page: number,
        limit: number
    ): Promise<{ batches: RechargeCardBatch[]; total: number }> {
        const [batches, total] = await Promise.all([
            this.prisma.rechargeCardBatch.findMany({
                where: { tenantId },
                skip: (page - 1) * limit,
                take: limit,
                orderBy: { createdAt: 'desc' },
            }),
            this.prisma.rechargeCardBatch.count({
                where: { tenantId },
            }),
        ]);

        return {
            batches: batches.map(batch => this.mapToRechargeCardBatch(batch)),
            total,
        };
    }

    async createRechargeCardBatch(batch: Partial<RechargeCardBatch>): Promise<RechargeCardBatch> {
        const newBatch = await this.prisma.rechargeCardBatch.create({
            data: {
                tenantId: batch.tenantId!,
                name: batch.name!,
                amount: batch.amount!,
                count: batch.count!,
                expiredAt: batch.expiredAt!,
                status: batch.status || 'ACTIVE',
                metadata: batch.metadata || {},
            },
        });
        return this.mapToRechargeCardBatch(newBatch);
    }

    async updateRechargeCardBatch(
        id: string,
        batch: Partial<RechargeCardBatch>
    ): Promise<RechargeCardBatch> {
        const updatedBatch = await this.prisma.rechargeCardBatch.update({
            where: { id },
            data: {
                name: batch.name,
                amount: batch.amount,
                count: batch.count,
                expiredAt: batch.expiredAt,
                status: batch.status,
                metadata: batch.metadata,
            },
        });
        return this.mapToRechargeCardBatch(updatedBatch);
    }

    async deleteRechargeCardBatch(id: string): Promise<void> {
        await this.prisma.rechargeCardBatch.delete({
            where: { id },
        });
    }

    async findRechargeRecordsByTenant(
        tenantId: string,
        page: number,
        limit: number
    ): Promise<{ records: RechargeRecord[]; total: number }> {
        const [records, total] = await Promise.all([
            this.prisma.rechargeRecord.findMany({
                where: { tenantId },
                skip: (page - 1) * limit,
                take: limit,
                orderBy: { createdAt: 'desc' },
            }),
            this.prisma.rechargeRecord.count({
                where: { tenantId },
            }),
        ]);

        return {
            records: records.map((record: any) => this.mapToRechargeRecord(record)),
            total,
        };
    }

    async findRechargeRecordsByUser(
        userId: string,
        page: number,
        limit: number
    ): Promise<{ records: RechargeRecord[]; total: number }> {
        const [records, total] = await Promise.all([
            this.prisma.rechargeRecord.findMany({
                where: { userId },
                skip: (page - 1) * limit,
                take: limit,
                orderBy: { createdAt: 'desc' },
            }),
            this.prisma.rechargeRecord.count({
                where: { userId },
            }),
        ]);

        return {
            records: records.map((record: any) => this.mapToRechargeRecord(record)),
            total,
        };
    }

    async createRechargeRecord(record: Partial<RechargeRecord>): Promise<RechargeRecord> {
        const newRecord = await this.prisma.rechargeRecord.create({
            data: {
                tenantId: record.tenantId!,
                userId: record.userId!,
                cardId: record.cardId!,
                amount: record.amount!,
                balanceBefore: record.balanceBefore!,
                balanceAfter: record.balanceAfter!,
                type: record.type!,
                description: record.description!,
                metadata: record.metadata || {},
            },
        });
        return this.mapToRechargeRecord(newRecord);
    }

    private mapToRechargeCard(data: any): RechargeCard {
        return {
            id: data.id,
            tenantId: data.tenantId,
            code: data.code,
            amount: data.amount,
            status: data.status,
            usedBy: data.usedBy,
            usedAt: data.usedAt,
            expiredAt: data.expiredAt,
            createdAt: data.createdAt,
            updatedAt: data.updatedAt,
        };
    }

    private mapToRechargeCardBatch(data: any): RechargeCardBatch {
        return {
            id: data.id,
            tenantId: data.tenantId,
            name: data.name,
            amount: data.amount,
            count: data.count,
            usedCount: data.usedCount,
            expiredAt: data.expiredAt,
            status: data.status,
            metadata: data.metadata,
            createdAt: data.createdAt,
            updatedAt: data.updatedAt,
        };
    }

    private mapToRechargeRecord(data: any): RechargeRecord {
        return {
            id: data.id,
            tenantId: data.tenantId,
            userId: data.userId,
            cardId: data.cardId,
            amount: data.amount,
            balanceBefore: data.balanceBefore,
            balanceAfter: data.balanceAfter,
            type: data.type,
            description: data.description,
            metadata: data.metadata,
            createdAt: data.createdAt,
        };
    }
}
