export interface CircuitBreaker {
    id: string;
    tenantId: string;
    name: string;
    description: string;
    target: string; // 目标服务/接口
    threshold: number; // 失败阈值
    timeout: number; // 熔断超时时间(ms)
    halfOpenTimeout: number; // 半开超时时间(ms)
    status: 'CLOSED' | 'OPEN' | 'HALF_OPEN';
    failureCount: number;
    lastFailureTime?: Date;
    lastSuccessTime?: Date;
    metadata: Record<string, any>;
    createdAt: Date;
    updatedAt: Date;
    rules: CircuitBreakerRule[];
    events: CircuitBreakerEvent[];
}

export interface CircuitBreakerRule {
    id: string;
    circuitBreakerId: string;
    type: 'ERROR_RATE' | 'LATENCY' | 'CUSTOM';
    condition: string; // 条件表达式
    threshold: number; // 阈值
    action: 'OPEN' | 'CLOSE' | 'HALF_OPEN';
    priority: number;
    metadata: Record<string, any>;
    createdAt: Date;
    updatedAt: Date;
}

export interface CircuitBreakerEvent {
    id: string;
    circuitBreakerId: string;
    type: 'OPEN' | 'CLOSE' | 'HALF_OPEN' | 'RESET';
    reason: string;
    metadata: Record<string, any>;
    createdAt: Date;
}
