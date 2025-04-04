import { IApiGatewayRepository } from '../repositories/api-gateway.repository';
import { ApiGateway, ApiRoute, ApiKey, ApiLog } from '../domains/api-gateway/api-gateway.entity';
import { ApiError } from '../middlewares/errorHandler';

export class ApiGatewayService {
    constructor(private apiGatewayRepository: IApiGatewayRepository) { }

    // API网关管理
    async getGatewayById(id: string): Promise<ApiGateway> {
        const gateway = await this.apiGatewayRepository.findGatewayById(id);
        if (!gateway) {
            throw new ApiError(404, 'API Gateway not found');
        }
        return gateway;
    }

    async getGatewaysByTenant(tenantId: string, page = 1, limit = 10): Promise<{ gateways: ApiGateway[]; total: number }> {
        return this.apiGatewayRepository.findGatewaysByTenant(tenantId, page, limit);
    }

    async createGateway(gateway: Partial<ApiGateway>): Promise<ApiGateway> {
        this.validateGateway(gateway);
        return this.apiGatewayRepository.createGateway(gateway);
    }

    async updateGateway(id: string, gateway: Partial<ApiGateway>): Promise<ApiGateway> {
        await this.getGatewayById(id);
        this.validateGateway(gateway);
        return this.apiGatewayRepository.updateGateway(id, gateway);
    }

    async deleteGateway(id: string): Promise<void> {
        await this.getGatewayById(id);
        await this.apiGatewayRepository.deleteGateway(id);
    }

    async updateGatewayStatus(id: string, status: ApiGateway['status']): Promise<ApiGateway> {
        await this.getGatewayById(id);
        return this.apiGatewayRepository.updateGatewayStatus(id, status);
    }

    // API路由管理
    async getRouteById(id: string): Promise<ApiRoute> {
        const route = await this.apiGatewayRepository.findRouteById(id);
        if (!route) {
            throw new ApiError(404, 'API Route not found');
        }
        return route;
    }

    async getRoutesByGateway(gatewayId: string): Promise<ApiRoute[]> {
        await this.getGatewayById(gatewayId);
        return this.apiGatewayRepository.findRoutesByGateway(gatewayId);
    }

    async createRoute(route: Partial<ApiRoute>): Promise<ApiRoute> {
        await this.getGatewayById(route.gatewayId!);
        this.validateRoute(route);
        return this.apiGatewayRepository.createRoute(route);
    }

    async updateRoute(id: string, route: Partial<ApiRoute>): Promise<ApiRoute> {
        await this.getRouteById(id);
        if (route.gatewayId) {
            await this.getGatewayById(route.gatewayId);
        }
        this.validateRoute(route);
        return this.apiGatewayRepository.updateRoute(id, route);
    }

    async deleteRoute(id: string): Promise<void> {
        await this.getRouteById(id);
        await this.apiGatewayRepository.deleteRoute(id);
    }

    // API密钥管理
    async getApiKeyById(id: string): Promise<ApiKey> {
        const apiKey = await this.apiGatewayRepository.findApiKeyById(id);
        if (!apiKey) {
            throw new ApiError(404, 'API Key not found');
        }
        return apiKey;
    }

    async getApiKeysByGateway(gatewayId: string): Promise<ApiKey[]> {
        await this.getGatewayById(gatewayId);
        return this.apiGatewayRepository.findApiKeysByGateway(gatewayId);
    }

    async createApiKey(apiKey: Partial<ApiKey>): Promise<ApiKey> {
        await this.getGatewayById(apiKey.gatewayId!);
        this.validateApiKey(apiKey);
        return this.apiGatewayRepository.createApiKey(apiKey);
    }

    async updateApiKey(id: string, apiKey: Partial<ApiKey>): Promise<ApiKey> {
        await this.getApiKeyById(id);
        if (apiKey.gatewayId) {
            await this.getGatewayById(apiKey.gatewayId);
        }
        this.validateApiKey(apiKey);
        return this.apiGatewayRepository.updateApiKey(id, apiKey);
    }

    async deleteApiKey(id: string): Promise<void> {
        await this.getApiKeyById(id);
        await this.apiGatewayRepository.deleteApiKey(id);
    }

    async updateApiKeyStatus(id: string, status: ApiKey['status']): Promise<ApiKey> {
        await this.getApiKeyById(id);
        return this.apiGatewayRepository.updateApiKeyStatus(id, status);
    }

    // API日志管理
    async getLogsByGateway(gatewayId: string, page = 1, limit = 10): Promise<{ logs: ApiLog[]; total: number }> {
        await this.getGatewayById(gatewayId);
        return this.apiGatewayRepository.findLogsByGateway(gatewayId, page, limit);
    }

    async getLogsByRoute(routeId: string, page = 1, limit = 10): Promise<{ logs: ApiLog[]; total: number }> {
        await this.getRouteById(routeId);
        return this.apiGatewayRepository.findLogsByRoute(routeId, page, limit);
    }

    async createLog(log: Partial<ApiLog>): Promise<ApiLog> {
        await this.getGatewayById(log.gatewayId!);
        await this.getRouteById(log.routeId!);
        return this.apiGatewayRepository.createLog(log);
    }

    async getLogById(id: string): Promise<ApiLog> {
        const log = await this.apiGatewayRepository.findLogById(id);
        if (!log) {
            throw new ApiError(404, 'API Log not found');
        }
        return log;
    }

    // 私有验证方法
    private validateGateway(gateway: Partial<ApiGateway>): void {
        if (!gateway.name) {
            throw new ApiError(400, 'Gateway name is required');
        }
        if (!gateway.baseUrl) {
            throw new ApiError(400, 'Base URL is required');
        }
        if (!gateway.rateLimit) {
            throw new ApiError(400, 'Rate limit configuration is required');
        }
        if (!gateway.cors) {
            throw new ApiError(400, 'CORS configuration is required');
        }
        if (!gateway.authentication) {
            throw new ApiError(400, 'Authentication configuration is required');
        }
    }

    private validateRoute(route: Partial<ApiRoute>): void {
        if (!route.path) {
            throw new ApiError(400, 'Route path is required');
        }
        if (!route.method) {
            throw new ApiError(400, 'Route method is required');
        }
        if (!route.target) {
            throw new ApiError(400, 'Route target is required');
        }
    }

    private validateApiKey(apiKey: Partial<ApiKey>): void {
        if (!apiKey.name) {
            throw new ApiError(400, 'API Key name is required');
        }
        if (!apiKey.key) {
            throw new ApiError(400, 'API Key value is required');
        }
    }
} 