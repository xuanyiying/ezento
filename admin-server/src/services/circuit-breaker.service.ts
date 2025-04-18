import { ICircuitBreakerRepository } from '../repositories/circuit-breaker.repository';
import {
    CircuitBreaker,
    CircuitBreakerRule,
    CircuitBreakerEvent,
} from '../domains/circuit-breaker/circuit-breaker.entity';
import { ApiError } from '../middlewares/errorHandler';

export class CircuitBreakerService {
    constructor(private circuitBreakerRepository: ICircuitBreakerRepository) {}

    // 熔断器管理
    async getCircuitBreakerById(id: string): Promise<CircuitBreaker> {
        const breaker = await this.circuitBreakerRepository.findCircuitBreakerById(id);
        if (!breaker) {
            throw new ApiError(404, '熔断器不存在');
        }
        return breaker;
    }

    async getCircuitBreakersByTenant(
        tenantId: string,
        page = 1,
        limit = 10
    ): Promise<{ breakers: CircuitBreaker[]; total: number }> {
        return this.circuitBreakerRepository.findCircuitBreakersByTenant(tenantId, page, limit);
    }

    async createCircuitBreaker(breaker: Partial<CircuitBreaker>): Promise<CircuitBreaker> {
        this.validateCircuitBreaker(breaker);
        return this.circuitBreakerRepository.createCircuitBreaker(breaker);
    }

    async updateCircuitBreaker(
        id: string,
        breaker: Partial<CircuitBreaker>
    ): Promise<CircuitBreaker> {
        await this.getCircuitBreakerById(id);
        return this.circuitBreakerRepository.updateCircuitBreaker(id, breaker);
    }

    async deleteCircuitBreaker(id: string): Promise<void> {
        await this.getCircuitBreakerById(id);
        return this.circuitBreakerRepository.deleteCircuitBreaker(id);
    }

    async updateCircuitBreakerStatus(
        id: string,
        status: CircuitBreaker['status']
    ): Promise<CircuitBreaker> {
        await this.getCircuitBreakerById(id);
        return this.circuitBreakerRepository.updateCircuitBreakerStatus(id, status);
    }

    // 熔断规则管理
    async getCircuitBreakerRules(breakerId: string): Promise<CircuitBreakerRule[]> {
        await this.getCircuitBreakerById(breakerId);
        return this.circuitBreakerRepository.findCircuitBreakerRules(breakerId);
    }

    async createCircuitBreakerRule(rule: Partial<CircuitBreakerRule>): Promise<CircuitBreakerRule> {
        await this.getCircuitBreakerById(rule.circuitBreakerId!);
        this.validateCircuitBreakerRule(rule);
        return this.circuitBreakerRepository.createCircuitBreakerRule(rule);
    }

    async updateCircuitBreakerRule(
        id: string,
        rule: Partial<CircuitBreakerRule>
    ): Promise<CircuitBreakerRule> {
        const existingRule = await this.getCircuitBreakerRuleById(id);
        await this.getCircuitBreakerById(existingRule.circuitBreakerId);
        return this.circuitBreakerRepository.updateCircuitBreakerRule(id, rule);
    }

    async deleteCircuitBreakerRule(id: string): Promise<void> {
        const rule = await this.getCircuitBreakerRuleById(id);
        await this.getCircuitBreakerById(rule.circuitBreakerId);
        return this.circuitBreakerRepository.deleteCircuitBreakerRule(id);
    }

    async updateRulePriority(id: string, priority: number): Promise<CircuitBreakerRule> {
        const rule = await this.getCircuitBreakerRuleById(id);
        await this.getCircuitBreakerById(rule.circuitBreakerId);
        return this.circuitBreakerRepository.updateRulePriority(id, priority);
    }

    // 熔断事件管理
    async getCircuitBreakerEvents(
        breakerId: string,
        page = 1,
        limit = 10
    ): Promise<{ events: CircuitBreakerEvent[]; total: number }> {
        await this.getCircuitBreakerById(breakerId);
        return this.circuitBreakerRepository.findCircuitBreakerEvents(breakerId, page, limit);
    }

    async createCircuitBreakerEvent(
        event: Partial<CircuitBreakerEvent>
    ): Promise<CircuitBreakerEvent> {
        await this.getCircuitBreakerById(event.circuitBreakerId!);
        this.validateCircuitBreakerEvent(event);
        return this.circuitBreakerRepository.createCircuitBreakerEvent(event);
    }

    // 私有辅助方法
    private async getCircuitBreakerRuleById(id: string): Promise<CircuitBreakerRule> {
        const rules = await this.circuitBreakerRepository.findCircuitBreakerRules(id);
        const rule = rules.find(r => r.id === id);
        if (!rule) {
            throw new ApiError(404, '熔断规则不存在');
        }
        return rule;
    }

    private validateCircuitBreaker(breaker: Partial<CircuitBreaker>): void {
        if (!breaker.tenantId) {
            throw new ApiError(400, '租户ID不能为空');
        }
        if (!breaker.name) {
            throw new ApiError(400, '名称不能为空');
        }
        if (!breaker.target) {
            throw new ApiError(400, '目标不能为空');
        }
        if (!breaker.threshold || breaker.threshold <= 0) {
            throw new ApiError(400, '失败阈值必须大于0');
        }
        if (!breaker.timeout || breaker.timeout <= 0) {
            throw new ApiError(400, '熔断超时时间必须大于0');
        }
        if (!breaker.halfOpenTimeout || breaker.halfOpenTimeout <= 0) {
            throw new ApiError(400, '半开超时时间必须大于0');
        }
    }

    private validateCircuitBreakerRule(rule: Partial<CircuitBreakerRule>): void {
        if (!rule.circuitBreakerId) {
            throw new ApiError(400, '熔断器ID不能为空');
        }
        if (!rule.type) {
            throw new ApiError(400, '规则类型不能为空');
        }
        if (!rule.condition) {
            throw new ApiError(400, '条件表达式不能为空');
        }
        if (!rule.threshold || rule.threshold <= 0) {
            throw new ApiError(400, '阈值必须大于0');
        }
        if (!rule.action) {
            throw new ApiError(400, '动作不能为空');
        }
        if (rule.priority === undefined || rule.priority < 0) {
            throw new ApiError(400, '优先级不能为空且必须大于等于0');
        }
    }

    private validateCircuitBreakerEvent(event: Partial<CircuitBreakerEvent>): void {
        if (!event.circuitBreakerId) {
            throw new ApiError(400, '熔断器ID不能为空');
        }
        if (!event.type) {
            throw new ApiError(400, '事件类型不能为空');
        }
        if (!event.reason) {
            throw new ApiError(400, '原因不能为空');
        }
    }
}
