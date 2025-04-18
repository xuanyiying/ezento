import { Request, Response, NextFunction } from 'express';
import { ApiGatewayService } from '../services/api-gateway.service';

export class ApiGatewayController {
    constructor(private apiGatewayService: ApiGatewayService) {}

    // API网关管理
    getGatewayById = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { id } = req.params;
            const gateway = await this.apiGatewayService.getGatewayById(id);
            res.json(gateway);
        } catch (error) {
            next(error);
        }
    };

    getGatewaysByTenant = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { tenantId } = req.params;
            const page = parseInt(req.query.page as string) || 1;
            const limit = parseInt(req.query.limit as string) || 10;
            const result = await this.apiGatewayService.getGatewaysByTenant(tenantId, page, limit);
            res.json(result);
        } catch (error) {
            next(error);
        }
    };

    createGateway = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const gateway = await this.apiGatewayService.createGateway(req.body);
            res.status(201).json(gateway);
        } catch (error) {
            next(error);
        }
    };

    updateGateway = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { id } = req.params;
            const gateway = await this.apiGatewayService.updateGateway(id, req.body);
            res.json(gateway);
        } catch (error) {
            next(error);
        }
    };

    deleteGateway = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { id } = req.params;
            await this.apiGatewayService.deleteGateway(id);
            res.status(204).send();
        } catch (error) {
            next(error);
        }
    };

    updateGatewayStatus = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { id } = req.params;
            const { status } = req.body;
            const gateway = await this.apiGatewayService.updateGatewayStatus(id, status);
            res.json(gateway);
        } catch (error) {
            next(error);
        }
    };

    // API路由管理
    getRouteById = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { id } = req.params;
            const route = await this.apiGatewayService.getRouteById(id);
            res.json(route);
        } catch (error) {
            next(error);
        }
    };

    getRoutesByGateway = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { gatewayId } = req.params;
            const routes = await this.apiGatewayService.getRoutesByGateway(gatewayId);
            res.json(routes);
        } catch (error) {
            next(error);
        }
    };

    createRoute = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const route = await this.apiGatewayService.createRoute(req.body);
            res.status(201).json(route);
        } catch (error) {
            next(error);
        }
    };

    updateRoute = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { id } = req.params;
            const route = await this.apiGatewayService.updateRoute(id, req.body);
            res.json(route);
        } catch (error) {
            next(error);
        }
    };

    deleteRoute = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { id } = req.params;
            await this.apiGatewayService.deleteRoute(id);
            res.status(204).send();
        } catch (error) {
            next(error);
        }
    };

    // API密钥管理
    getApiKeyById = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { id } = req.params;
            const apiKey = await this.apiGatewayService.getApiKeyById(id);
            res.json(apiKey);
        } catch (error) {
            next(error);
        }
    };

    getApiKeysByGateway = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { gatewayId } = req.params;
            const apiKeys = await this.apiGatewayService.getApiKeysByGateway(gatewayId);
            res.json(apiKeys);
        } catch (error) {
            next(error);
        }
    };

    createApiKey = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const apiKey = await this.apiGatewayService.createApiKey(req.body);
            res.status(201).json(apiKey);
        } catch (error) {
            next(error);
        }
    };

    updateApiKey = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { id } = req.params;
            const apiKey = await this.apiGatewayService.updateApiKey(id, req.body);
            res.json(apiKey);
        } catch (error) {
            next(error);
        }
    };

    deleteApiKey = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { id } = req.params;
            await this.apiGatewayService.deleteApiKey(id);
            res.status(204).send();
        } catch (error) {
            next(error);
        }
    };

    updateApiKeyStatus = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { id } = req.params;
            const { status } = req.body;
            const apiKey = await this.apiGatewayService.updateApiKeyStatus(id, status);
            res.json(apiKey);
        } catch (error) {
            next(error);
        }
    };

    // API日志管理
    getLogsByGateway = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { gatewayId } = req.params;
            const page = parseInt(req.query.page as string) || 1;
            const limit = parseInt(req.query.limit as string) || 10;
            const result = await this.apiGatewayService.getLogsByGateway(gatewayId, page, limit);
            res.json(result);
        } catch (error) {
            next(error);
        }
    };

    getLogsByRoute = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { routeId } = req.params;
            const page = parseInt(req.query.page as string) || 1;
            const limit = parseInt(req.query.limit as string) || 10;
            const result = await this.apiGatewayService.getLogsByRoute(routeId, page, limit);
            res.json(result);
        } catch (error) {
            next(error);
        }
    };

    createLog = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const log = await this.apiGatewayService.createLog(req.body);
            res.status(201).json(log);
        } catch (error) {
            next(error);
        }
    };

    getLogById = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { id } = req.params;
            const log = await this.apiGatewayService.getLogById(id);
            res.json(log);
        } catch (error) {
            next(error);
        }
    };
}
