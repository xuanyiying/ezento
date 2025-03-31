import { v4 as uuidv4 } from 'uuid';
import { TenantStatus, TenantPlan, IsolationPolicy } from './tenant.types';

/**
 * @swagger
 * components:
 *   schemas:
 *     Tenant:
 *       type: object
 *       required:
 *         - id
 *         - name
 *         - code
 *         - status
 *         - plan
 *       properties:
 *         id:
 *           type: string
 *           description: 租户唯一标识符
 *         name:
 *           type: string
 *           description: 租户名称
 *         code:
 *           type: string
 *           description: 租户代码，用于URL等标识
 *         status:
 *           type: string
 *           enum: [ACTIVE, SUSPENDED, TERMINATED]
 *           description: 租户状态
 *         plan:
 *           type: string
 *           description: 租户套餐计划
 *         settings:
 *           type: object
 *           description: 租户设置
 *           properties:
 *             logo:
 *               type: string
 *             colors:
 *               type: object
 *             features:
 *               type: object
 *         theme:
 *           type: object
 *           description: 租户主题设置
 *         apiCallLimits:
 *           type: object
 *           description: API调用限制
 *           properties:
 *             daily:
 *               type: number
 *             monthly:
 *               type: number
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: 创建时间
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: 最后更新时间
 */
export interface Tenant {
    id: string;
    name: string;
    code: string;
    status: 'ACTIVE' | 'SUSPENDED' | 'TERMINATED';
    plan: string;
    settings: {
        logo?: string;
        colors?: {
            primary?: string;
            secondary?: string;
        };
        features?: {
            [key: string]: boolean;
        };
    };
    theme: {
        [key: string]: any;
    };
    apiCallLimits: {
        daily?: number;
        monthly?: number;
        perModel?: {
            [model: string]: {
                daily?: number;
                monthly?: number;
            };
        };
    };
    createdAt: Date;
    updatedAt: Date;
}

export class TenantEntity {
    private readonly id: string;
    private name: string;
    private status: TenantStatus;
    private planId: string;
    private isolationPolicy: IsolationPolicy;
    private createdAt: Date;
    private updatedAt: Date;
    private domains: string[];
    private settings: Record<string, any>;



    constructor(
        name: string,
        planId: string,
        isolationPolicy: IsolationPolicy = 'DEFAULT',
        domains: string[] = [],
        settings: Record<string, any> = {}
    ) {
        this.id = uuidv4();
        this.name = name;
        this.status = 'ACTIVE';
        this.planId = planId;
        this.isolationPolicy = isolationPolicy;
        this.domains = domains;
        this.settings = settings;
        this.createdAt = new Date();
        this.updatedAt = new Date();
    }

    // Getters
    getId(): string {
        return this.id;
    }

    getName(): string {
        return this.name;
    }

    getStatus(): TenantStatus {
        return this.status;
    }

    getPlanId(): string {
        return this.planId;
    }

    getIsolationPolicy(): IsolationPolicy {
        return this.isolationPolicy;
    }

    getDomains(): string[] {
        return [...this.domains];
    }

    getSettings(): Record<string, any> {
        return { ...this.settings };
    }

    // Business methods
    updateName(name: string): void {
        if (!name) {
            throw new Error('租户名称不能为空');
        }
        this.name = name;
        this.updatedAt = new Date();
    }

    updatePlan(planId: string): void {
        if (!planId) {
            throw new Error('计划ID不能为空');
        }
        this.planId = planId;
        this.updatedAt = new Date();
    }

    updateIsolationPolicy(policy: IsolationPolicy): void {
        this.isolationPolicy = policy;
        this.updatedAt = new Date();
    }

    updateStatus(status: TenantStatus): void {
        this.status = status;
        this.updatedAt = new Date();
    }

    addDomain(domain: string): void {
        if (!domain) {
            throw new Error('域名不能为空');
        }
        if (this.domains.includes(domain)) {
            throw new Error('域名已存在');
        }
        this.domains.push(domain);
        this.updatedAt = new Date();
    }

    removeDomain(domain: string): void {
        const index = this.domains.indexOf(domain);
        if (index === -1) {
            throw new Error('域名不存在');
        }
        this.domains.splice(index, 1);
        this.updatedAt = new Date();
    }

    updateSettings(settings: Record<string, any>): void {
        this.settings = { ...this.settings, ...settings };
        this.updatedAt = new Date();
    }

    // Domain validation
    validate(): void {
        if (!this.name) {
            throw new Error('租户名称不能为空');
        }
        if (!this.planId) {
            throw new Error('计划ID不能为空');
        }
        if (this.domains.length === 0) {
            throw new Error('至少需要一个域名');
        }
    }
} 