import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { 
  CircuitBreaker, 
  CircuitBreakerRule, 
  CircuitBreakerEvent,
  CircuitBreakerStatus,
  CircuitBreakerRuleType,
  CircuitBreakerEventType
} from '@prisma/client';

@Injectable()
export class CircuitBreakerService {
  constructor(private prisma: PrismaService) {}

  // 熔断器管理
  async getCircuitBreakerById(id: string): Promise<CircuitBreaker> {
    const breaker = await this.prisma.circuitBreaker.findUnique({
      where: { id },
    });
    if (!breaker) {
      throw new NotFoundException('Circuit breaker not found');
    }
    return breaker;
  }

  async getCircuitBreakersByTenant(
    tenantId: string,
    page = 1,
    limit = 10
  ): Promise<{ breakers: CircuitBreaker[]; total: number }> {
    const skip = (page - 1) * limit;
    const [breakers, total] = await Promise.all([
      this.prisma.circuitBreaker.findMany({
        where: { tenantId },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.circuitBreaker.count({
        where: { tenantId },
      }),
    ]);
    return { breakers, total };
  }

  async createCircuitBreaker(data: any): Promise<CircuitBreaker> {
    this.validateCircuitBreaker(data);
    return this.prisma.circuitBreaker.create({
      data,
    });
  }

  async updateCircuitBreaker(id: string, data: any): Promise<CircuitBreaker> {
    await this.getCircuitBreakerById(id);
    return this.prisma.circuitBreaker.update({
      where: { id },
      data,
    });
  }

  async deleteCircuitBreaker(id: string): Promise<void> {
    await this.getCircuitBreakerById(id);
    await this.prisma.circuitBreaker.delete({
      where: { id },
    });
  }

  async updateCircuitBreakerStatus(id: string, status: CircuitBreakerStatus): Promise<CircuitBreaker> {
    await this.getCircuitBreakerById(id);
    return this.prisma.circuitBreaker.update({
      where: { id },
      data: { status },
    });
  }

  // 熔断规则管理
  async getCircuitBreakerRules(breakerId: string): Promise<CircuitBreakerRule[]> {
    await this.getCircuitBreakerById(breakerId);
    return this.prisma.circuitBreakerRule.findMany({
      where: { circuitBreakerId: breakerId },
      orderBy: { priority: 'asc' },
    });
  }

  async createCircuitBreakerRule(data: any): Promise<CircuitBreakerRule> {
    await this.getCircuitBreakerById(data.circuitBreakerId);
    this.validateCircuitBreakerRule(data);
    return this.prisma.circuitBreakerRule.create({
      data,
    });
  }

  async updateCircuitBreakerRule(id: string, data: any): Promise<CircuitBreakerRule> {
    const existingRule = await this.getCircuitBreakerRuleById(id);
    return this.prisma.circuitBreakerRule.update({
      where: { id },
      data,
    });
  }

  async deleteCircuitBreakerRule(id: string): Promise<void> {
    await this.getCircuitBreakerRuleById(id);
    await this.prisma.circuitBreakerRule.delete({
      where: { id },
    });
  }

  async updateRulePriority(id: string, priority: number): Promise<CircuitBreakerRule> {
    await this.getCircuitBreakerRuleById(id);
    return this.prisma.circuitBreakerRule.update({
      where: { id },
      data: { priority },
    });
  }

  // 熔断事件管理
  async getCircuitBreakerEvents(
    breakerId: string,
    page = 1,
    limit = 10
  ): Promise<{ events: CircuitBreakerEvent[]; total: number }> {
    await this.getCircuitBreakerById(breakerId);
    const skip = (page - 1) * limit;
    const [events, total] = await Promise.all([
      this.prisma.circuitBreakerEvent.findMany({
        where: { circuitBreakerId: breakerId },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.circuitBreakerEvent.count({
        where: { circuitBreakerId: breakerId },
      }),
    ]);
    return { events, total };
  }

  async createCircuitBreakerEvent(data: any): Promise<CircuitBreakerEvent> {
    await this.getCircuitBreakerById(data.circuitBreakerId);
    return this.prisma.circuitBreakerEvent.create({
      data,
    });
  }

  // 私有辅助方法
  private async getCircuitBreakerRuleById(id: string): Promise<CircuitBreakerRule> {
    const rule = await this.prisma.circuitBreakerRule.findUnique({
      where: { id },
    });
    if (!rule) {
      throw new NotFoundException('Circuit breaker rule not found');
    }
    return rule;
  }

  private validateCircuitBreaker(breaker: any): void {
    if (!breaker.tenantId) {
      throw new BadRequestException('Tenant ID is required');
    }
    if (!breaker.name) {
      throw new BadRequestException('Name is required');
    }
    if (!breaker.target) {
      throw new BadRequestException('Target is required');
    }
    if (!breaker.threshold || breaker.threshold <= 0) {
      throw new BadRequestException('Threshold must be greater than 0');
    }
    if (!breaker.timeout || breaker.timeout <= 0) {
      throw new BadRequestException('Timeout must be greater than 0');
    }
    if (!breaker.halfOpenTimeout || breaker.halfOpenTimeout <= 0) {
      throw new BadRequestException('Half-open timeout must be greater than 0');
    }
  }

  private validateCircuitBreakerRule(rule: any): void {
    if (!rule.circuitBreakerId) {
      throw new BadRequestException('Circuit breaker ID is required');
    }
    if (!rule.type) {
      throw new BadRequestException('Rule type is required');
    }
    if (!rule.condition) {
      throw new BadRequestException('Condition expression is required');
    }
    if (!rule.threshold || rule.threshold <= 0) {
      throw new BadRequestException('Threshold must be greater than 0');
    }
    if (!rule.action) {
      throw new BadRequestException('Action is required');
    }
    if (rule.priority === undefined || rule.priority < 0) {
      throw new BadRequestException('Priority must be a non-negative number');
    }
  }
}
