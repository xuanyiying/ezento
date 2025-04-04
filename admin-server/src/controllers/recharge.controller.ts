import { Request, Response, NextFunction } from 'express';
import { RechargeService } from '../services/recharge.service';

export class RechargeController {
    constructor(private rechargeService: RechargeService) { }

    // 充值卡管理
    getRechargeCardByCode = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { code } = req.params;
            const card = await this.rechargeService.getRechargeCardByCode(code);
            res.json(card);
        } catch (error) {
            next(error);
        }
    };

    getRechargeCardById = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { id } = req.params;
            const card = await this.rechargeService.getRechargeCardById(id);
            res.json(card);
        } catch (error) {
            next(error);
        }
    };

    getRechargeCardsByTenant = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { tenantId } = req.params;
            const page = parseInt(req.query.page as string) || 1;
            const limit = parseInt(req.query.limit as string) || 10;
            const result = await this.rechargeService.getRechargeCardsByTenant(tenantId, page, limit);
            res.json(result);
        } catch (error) {
            next(error);
        }
    };

    createRechargeCard = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const card = await this.rechargeService.createRechargeCard(req.body);
            res.status(201).json(card);
        } catch (error) {
            next(error);
        }
    };

    updateRechargeCard = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { id } = req.params;
            const card = await this.rechargeService.updateRechargeCard(id, req.body);
            res.json(card);
        } catch (error) {
            next(error);
        }
    };

    deleteRechargeCard = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { id } = req.params;
            await this.rechargeService.deleteRechargeCard(id);
            res.status(204).send();
        } catch (error) {
            next(error);
        }
    };

    // 充值卡批次管理
    getRechargeCardBatchById = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { id } = req.params;
            const batch = await this.rechargeService.getRechargeCardBatchById(id);
            res.json(batch);
        } catch (error) {
            next(error);
        }
    };

    getRechargeCardBatchesByTenant = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { tenantId } = req.params;
            const page = parseInt(req.query.page as string) || 1;
            const limit = parseInt(req.query.limit as string) || 10;
            const result = await this.rechargeService.getRechargeCardBatchesByTenant(tenantId, page, limit);
            res.json(result);
        } catch (error) {
            next(error);
        }
    };

    createRechargeCardBatch = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const batch = await this.rechargeService.createRechargeCardBatch(req.body);
            res.status(201).json(batch);
        } catch (error) {
            next(error);
        }
    };

    updateRechargeCardBatch = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { id } = req.params;
            const batch = await this.rechargeService.updateRechargeCardBatch(id, req.body);
            res.json(batch);
        } catch (error) {
            next(error);
        }
    };

    deleteRechargeCardBatch = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { id } = req.params;
            await this.rechargeService.deleteRechargeCardBatch(id);
            res.status(204).send();
        } catch (error) {
            next(error);
        }
    };

    // 充值记录管理
    getRechargeRecordsByTenant = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { tenantId } = req.params;
            const page = parseInt(req.query.page as string) || 1;
            const limit = parseInt(req.query.limit as string) || 10;
            const result = await this.rechargeService.getRechargeRecordsByTenant(tenantId, page, limit);
            res.json(result);
        } catch (error) {
            next(error);
        }
    };

    getRechargeRecordsByUser = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { userId } = req.params;
            const page = parseInt(req.query.page as string) || 1;
            const limit = parseInt(req.query.limit as string) || 10;
            const result = await this.rechargeService.getRechargeRecordsByUser(userId, page, limit);
            res.json(result);
        } catch (error) {
            next(error);
        }
    };

    createRechargeRecord = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const record = await this.rechargeService.createRechargeRecord(req.body);
            res.status(201).json(record);
        } catch (error) {
            next(error);
        }
    };
} 