import { CircuitBreakerEventType, PrismaClient } from '@prisma/client';
import { ICircuitBreakerRepository } from '../circuit-breaker.repository';
import {
    CircuitBreaker,
    CircuitBreakerRule,
    CircuitBreakerEvent,
} from '../../domains/circuit-breaker/circuit-breaker.entity';

export class PrismaCircuitBreakerRepository implements ICircuitBreakerRepository {
    constructor(private prisma: PrismaClient) {}

    // 熔断器管理
    async findCircuitBreakerById(id: string): Promise<CircuitBreaker | null> {
        const breaker = await this.prisma.circuitBreaker.findUnique({
            where: { id },
            include: {
                rules: true,
                events: true,
            },
        });
        return breaker ? this.mapToCircuitBreaker(breaker) : null;
    }

    async findCircuitBreakersByTenant(
        tenantId: string,
        page: number,
        limit: number
    ): Promise<{ breakers: CircuitBreaker[]; total: number }> {
        const [breakers, total] = await Promise.all([
            this.prisma.circuitBreaker.findMany({
                where: { tenantId },
                skip: (page - 1) * limit,
                take: limit,
                include: {
                    rules: true,
                    events: true,
                },
            }),
            this.prisma.circuitBreaker.count({
                where: { tenantId },
            }),
        ]);

        return {
            breakers: breakers.map(this.mapToCircuitBreaker),
            total,
        };
    }

    async createCircuitBreaker(breaker: Partial<CircuitBreaker>): Promise<CircuitBreaker> {
        const created = await this.prisma.circuitBreaker.create({
            data: {
                tenantId: breaker.tenantId!,
                name: breaker.name!,
                description: breaker.description,
                target: breaker.target!,
                threshold: breaker.threshold!,
                timeout: breaker.timeout!,
                halfOpenTimeout: breaker.halfOpenTimeout!,
                status: breaker.status!,
                failureCount: breaker.failureCount || 0,
                lastFailureTime: breaker.lastFailureTime,
                lastSuccessTime: breaker.lastSuccessTime,
                metadata: breaker.metadata,
            },
            include: {
                rules: true,
                events: true,
            },
        });
        return this.mapToCircuitBreaker(created);
    }

    async updateCircuitBreaker(
        id: string,
        breaker: Partial<CircuitBreaker>
    ): Promise<CircuitBreaker> {
        const updated = await this.prisma.circuitBreaker.update({
            where: { id },
            data: {
                name: breaker.name,
                description: breaker.description,
                target: breaker.target,
                threshold: breaker.threshold,
                timeout: breaker.timeout,
                halfOpenTimeout: breaker.halfOpenTimeout,
                status: breaker.status,
                failureCount: breaker.failureCount,
                lastFailureTime: breaker.lastFailureTime,
                lastSuccessTime: breaker.lastSuccessTime,
                metadata: breaker.metadata,
            },
            include: {
                rules: true,
                events: true,
            },
        });
        return this.mapToCircuitBreaker(updated);
    }

    async deleteCircuitBreaker(id: string): Promise<void> {
        await this.prisma.circuitBreaker.delete({
            where: { id },
        });
    }

    async updateCircuitBreakerStatus(
        id: string,
        status: CircuitBreaker['status']
    ): Promise<CircuitBreaker> {
        const updated = await this.prisma.circuitBreaker.update({
            where: { id },
            data: { status },
            include: {
                rules: true,
                events: true,
            },
        });
        return this.mapToCircuitBreaker(updated);
    }

    // 熔断规则管理
    async findCircuitBreakerRules(breakerId: string): Promise<CircuitBreakerRule[]> {
        const rules = await this.prisma.circuitBreakerRule.findMany({
            where: { circuitBreakerId: breakerId },
            orderBy: { priority: 'asc' },
        });
        return rules.map(this.mapToCircuitBreakerRule);
    }

    async createCircuitBreakerRule(rule: Partial<CircuitBreakerRule>): Promise<CircuitBreakerRule> {
        const created = await this.prisma.circuitBreakerRule.create({
            data: {
                circuitBreakerId: rule.circuitBreakerId!,
                type: rule.type!,
                condition: rule.condition!,
                threshold: rule.threshold!,
                action: rule.action!,
                priority: rule.priority!,
                metadata: rule.metadata,
            },
        });
        return this.mapToCircuitBreakerRule(created);
    }

    async updateCircuitBreakerRule(
        id: string,
        rule: Partial<CircuitBreakerRule>
    ): Promise<CircuitBreakerRule> {
        const updated = await this.prisma.circuitBreakerRule.update({
            where: { id },
            data: {
                type: rule.type,
                condition: rule.condition,
                threshold: rule.threshold,
                action: rule.action,
                priority: rule.priority,
                metadata: rule.metadata,
            },
        });
        return this.mapToCircuitBreakerRule(updated);
    }

    async deleteCircuitBreakerRule(id: string): Promise<void> {
        await this.prisma.circuitBreakerRule.delete({
            where: { id },
        });
    }

    async updateRulePriority(id: string, priority: number): Promise<CircuitBreakerRule> {
        const updated = await this.prisma.circuitBreakerRule.update({
            where: { id },
            data: { priority },
        });
        return this.mapToCircuitBreakerRule(updated);
    }

    // 熔断事件管理
    async findCircuitBreakerEvents(
        breakerId: string,
        page: number,
        limit: number
    ): Promise<{ events: CircuitBreakerEvent[]; total: number }> {
        const [events, total] = await Promise.all([
            this.prisma.circuitBreakerEvent.findMany({
                where: { circuitBreakerId: breakerId },
                skip: (page - 1) * limit,
                take: limit,
                orderBy: { createdAt: 'desc' },
            }),
            this.prisma.circuitBreakerEvent.count({
                where: { circuitBreakerId: breakerId },
            }),
        ]);

        return {
            events: events.map(this.mapToCircuitBreakerEvent),
            total,
        };
    }

    async createCircuitBreakerEvent(
        event: Partial<CircuitBreakerEvent>
    ): Promise<CircuitBreakerEvent> {
        const created = await this.prisma.circuitBreakerEvent.create({
            data: {
                circuitBreakerId: event.circuitBreakerId!,
                type: event.type as CircuitBreakerEventType,
                reason: event.reason!,
                metadata: event.metadata,
            },
        });
        return this.mapToCircuitBreakerEvent(created);
    }

    // 私有映射方法
    private mapToCircuitBreaker(data: any): CircuitBreaker {
        return {
            id: data.id,
            tenantId: data.tenantId,
            name: data.name,
            description: data.description,
            target: data.target,
            threshold: data.threshold,
            timeout: data.timeout,
            halfOpenTimeout: data.halfOpenTimeout,
            status: data.status,
            failureCount: data.failureCount,
            lastFailureTime: data.lastFailureTime,
            lastSuccessTime: data.lastSuccessTime,
            metadata: data.metadata,
            createdAt: data.createdAt,
            updatedAt: data.updatedAt,
            rules: data.rules?.map(this.mapToCircuitBreakerRule) || [],
            events: data.events?.map(this.mapToCircuitBreakerEvent) || [],
        };
    }

    private mapToCircuitBreakerRule(data: any): CircuitBreakerRule {
        return {
            id: data.id,
            circuitBreakerId: data.circuitBreakerId,
            type: data.type,
            condition: data.condition,
            threshold: data.threshold,
            action: data.action,
            priority: data.priority,
            metadata: data.metadata,
            createdAt: data.createdAt,
            updatedAt: data.updatedAt,
        };
    }

    private mapToCircuitBreakerEvent(data: any): CircuitBreakerEvent {
        return {
            id: data.id,
            circuitBreakerId: data.circuitBreakerId,
            type: data.type,
            reason: data.reason,
            metadata: data.metadata,
            createdAt: data.createdAt,
        };
    }
}
