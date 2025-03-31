import { Request, Response, NextFunction } from 'express';
import { CircuitBreakerService } from '../services/circuit-breaker.service';

export class CircuitBreakerController {
    constructor(private circuitBreakerService: CircuitBreakerService) { }

    // 熔断器管理
    getCircuitBreakerById = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { id } = req.params;
            const breaker = await this.circuitBreakerService.getCircuitBreakerById(id);
            res.json(breaker);
        } catch (error) {
            next(error);
        }
    };

    getCircuitBreakersByTenant = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { tenantId } = req.params;
            const page = parseInt(req.query.page as string) || 1;
            const limit = parseInt(req.query.limit as string) || 10;
            const result = await this.circuitBreakerService.getCircuitBreakersByTenant(tenantId, page, limit);
            res.json(result);
        } catch (error) {
            next(error);
        }
    };

    createCircuitBreaker = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const breaker = await this.circuitBreakerService.createCircuitBreaker(req.body);
            res.status(201).json(breaker);
        } catch (error) {
            next(error);
        }
    };

    updateCircuitBreaker = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { id } = req.params;
            const breaker = await this.circuitBreakerService.updateCircuitBreaker(id, req.body);
            res.json(breaker);
        } catch (error) {
            next(error);
        }
    };

    deleteCircuitBreaker = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { id } = req.params;
            await this.circuitBreakerService.deleteCircuitBreaker(id);
            res.status(204).send();
        } catch (error) {
            next(error);
        }
    };

    updateCircuitBreakerStatus = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { id } = req.params;
            const { status } = req.body;
            const breaker = await this.circuitBreakerService.updateCircuitBreakerStatus(id, status);
            res.json(breaker);
        } catch (error) {
            next(error);
        }
    };

    // 熔断规则管理
    getCircuitBreakerRules = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { breakerId } = req.params;
            const rules = await this.circuitBreakerService.getCircuitBreakerRules(breakerId);
            res.json(rules);
        } catch (error) {
            next(error);
        }
    };

    createCircuitBreakerRule = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const rule = await this.circuitBreakerService.createCircuitBreakerRule(req.body);
            res.status(201).json(rule);
        } catch (error) {
            next(error);
        }
    };

    updateCircuitBreakerRule = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { id } = req.params;
            const rule = await this.circuitBreakerService.updateCircuitBreakerRule(id, req.body);
            res.json(rule);
        } catch (error) {
            next(error);
        }
    };

    deleteCircuitBreakerRule = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { id } = req.params;
            await this.circuitBreakerService.deleteCircuitBreakerRule(id);
            res.status(204).send();
        } catch (error) {
            next(error);
        }
    };

    updateRulePriority = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { id } = req.params;
            const { priority } = req.body;
            const rule = await this.circuitBreakerService.updateRulePriority(id, priority);
            res.json(rule);
        } catch (error) {
            next(error);
        }
    };

    // 熔断事件管理
    getCircuitBreakerEvents = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { breakerId } = req.params;
            const page = parseInt(req.query.page as string) || 1;
            const limit = parseInt(req.query.limit as string) || 10;
            const result = await this.circuitBreakerService.getCircuitBreakerEvents(breakerId, page, limit);
            res.json(result);
        } catch (error) {
            next(error);
        }
    };

    createCircuitBreakerEvent = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const event = await this.circuitBreakerService.createCircuitBreakerEvent(req.body);
            res.status(201).json(event);
        } catch (error) {
            next(error);
        }
    };
} 