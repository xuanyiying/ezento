import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RechargeCard, RechargeCardBatch, RechargeRecord } from '@prisma/client';
@Injectable()
export class RechargeService {
  constructor(private prisma: PrismaService) {}

  // 充值卡管理
  async getRechargeCardByCode(code: string): Promise<RechargeCard> {
    const card = await this.prisma.rechargeCard.findUnique({
      where: { code },
    });
    if (!card) {
      throw new NotFoundException('Recharge card not found');
    }
    return card;
  }

  async getRechargeCardById(id: string): Promise<RechargeCard> {
    const card = await this.prisma.rechargeCard.findUnique({
      where: { id },
    });
    if (!card) {
      throw new NotFoundException('Recharge card not found');
    }
    return card;
  }

  async getRechargeCardsByTenant(
    tenantId: string,
    page = 1,
    limit = 10
  ): Promise<{ cards: RechargeCard[]; total: number }> {
    const skip = (page - 1) * limit;
    const [cards, total] = await Promise.all([
      this.prisma.rechargeCard.findMany({
        where: { tenantId },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.rechargeCard.count({
        where: { tenantId },
      }),
    ]);
    return { cards, total };
  }

  async createRechargeCard(data: any): Promise<RechargeCard> {
    this.validateRechargeCard(data);
    return this.prisma.rechargeCard.create({
      data,
    });
  }

  async updateRechargeCard(id: string, data: any): Promise<RechargeCard> {
    await this.getRechargeCardById(id);
    return this.prisma.rechargeCard.update({
      where: { id },
      data,
    });
  }

  async deleteRechargeCard(id: string): Promise<void> {
    await this.getRechargeCardById(id);
    await this.prisma.rechargeCard.delete({
      where: { id },
    });
  }

  // 充值卡批次管理
  async getRechargeCardBatchById(id: string): Promise<RechargeCardBatch> {
    const batch = await this.prisma.rechargeCardBatch.findUnique({
      where: { id },
    });
    if (!batch) {
      throw new NotFoundException('Recharge card batch not found');
    }
    return batch;
  }

  async getRechargeCardBatchesByTenant(
    tenantId: string,
    page = 1,
    limit = 10
  ): Promise<{ batches: RechargeCardBatch[]; total: number }> {
    const skip = (page - 1) * limit;
    const [batches, total] = await Promise.all([
      this.prisma.rechargeCardBatch.findMany({
        where: { tenantId },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.rechargeCardBatch.count({
        where: { tenantId },
      }),
    ]);
    return { batches, total };
  }

  async createRechargeCardBatch(data: any): Promise<RechargeCardBatch> {
    this.validateRechargeCardBatch(data);
    return this.prisma.rechargeCardBatch.create({
      data,
    });
  }

  async updateRechargeCardBatch(id: string, data: any): Promise<RechargeCardBatch> {
    await this.getRechargeCardBatchById(id);
    return this.prisma.rechargeCardBatch.update({
      where: { id },
      data,
    });
  }

  async deleteRechargeCardBatch(id: string): Promise<void> {
    await this.getRechargeCardBatchById(id);
    await this.prisma.rechargeCardBatch.delete({
      where: { id },
    });
  }

  // 充值记录管理
  async getRechargeRecordsByTenant(
    tenantId: string,
    page = 1,
    limit = 10
  ): Promise<{ records: RechargeRecord[]; total: number }> {
    const skip = (page - 1) * limit;
    const [records, total] = await Promise.all([
      this.prisma.rechargeRecord.findMany({
        where: { tenantId },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.rechargeRecord.count({
        where: { tenantId },
      }),
    ]);
    return { records, total };
  }

  async getRechargeRecordsByUser(
    userId: string,
    page = 1,
    limit = 10
  ): Promise<{ records: RechargeRecord[]; total: number }> {
    const skip = (page - 1) * limit;
    const [records, total] = await Promise.all([
      this.prisma.rechargeRecord.findMany({
        where: { userId },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.rechargeRecord.count({
        where: { userId },
      }),
    ]);
    return { records, total };
  }

  async createRechargeRecord(data: any): Promise<RechargeRecord> {
    this.validateRechargeRecord(data);
    return this.prisma.rechargeRecord.create({
      data,
    });
  }

  private validateRechargeCard(card: any): void {
    if (!card.tenantId) throw new BadRequestException('Tenant ID is required');
    if (!card.amount || card.amount <= 0) throw new BadRequestException('Amount must be greater than 0');
    if (!card.expiredAt) throw new BadRequestException('Expiration date is required');
    if (new Date(card.expiredAt) <= new Date()) throw new BadRequestException('Expiration date must be in the future');
  }

  private validateRechargeCardBatch(batch: any): void {
    if (!batch.tenantId) throw new BadRequestException('Tenant ID is required');
    if (!batch.name) throw new BadRequestException('Batch name is required');
    if (!batch.amount || batch.amount <= 0) throw new BadRequestException('Amount must be greater than 0');
    if (!batch.count || batch.count <= 0) throw new BadRequestException('Count must be greater than 0');
    if (!batch.expiredAt) throw new BadRequestException('Expiration date is required');
    if (new Date(batch.expiredAt) <= new Date()) throw new BadRequestException('Expiration date must be in the future');
  }

  private validateRechargeRecord(record: any): void {
    if (!record.tenantId) throw new BadRequestException('Tenant ID is required');
    if (!record.userId) throw new BadRequestException('User ID is required');
    if (!record.cardId) throw new BadRequestException('Card ID is required');
    if (!record.amount || record.amount <= 0) throw new BadRequestException('Amount must be greater than 0');
    if (!record.description) throw new BadRequestException('Description is required');
  }
}
