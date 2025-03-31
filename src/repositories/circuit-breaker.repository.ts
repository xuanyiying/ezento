import { CircuitBreaker, CircuitBreakerRule, CircuitBreakerEvent } from '../domains/circuit-breaker/circuit-breaker.entity';

export interface ICircuitBreakerRepository {
    // 熔断器管理
    findCircuitBreakerById(id: string): Promise<CircuitBreaker | null>;
    findCircuitBreakersByTenant(tenantId: string, page: number, limit: number): Promise<{ breakers: CircuitBreaker[]; total: number }>;
    createCircuitBreaker(breaker: Partial<CircuitBreaker>): Promise<CircuitBreaker>;
    updateCircuitBreaker(id: string, breaker: Partial<CircuitBreaker>): Promise<CircuitBreaker>;
    deleteCircuitBreaker(id: string): Promise<void>;
    updateCircuitBreakerStatus(id: string, status: CircuitBreaker['status']): Promise<CircuitBreaker>;

    // 熔断规则管理
    findCircuitBreakerRules(breakerId: string): Promise<CircuitBreakerRule[]>;
    createCircuitBreakerRule(rule: Partial<CircuitBreakerRule>): Promise<CircuitBreakerRule>;
    updateCircuitBreakerRule(id: string, rule: Partial<CircuitBreakerRule>): Promise<CircuitBreakerRule>;
    deleteCircuitBreakerRule(id: string): Promise<void>;
    updateRulePriority(id: string, priority: number): Promise<CircuitBreakerRule>;

    // 熔断事件管理
    findCircuitBreakerEvents(breakerId: string, page: number, limit: number): Promise<{ events: CircuitBreakerEvent[]; total: number }>;
    createCircuitBreakerEvent(event: Partial<CircuitBreakerEvent>): Promise<CircuitBreakerEvent>;
} 