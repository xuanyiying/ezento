import { ApiGateway, ApiRoute, ApiKey, ApiLog } from '../domains/api-gateway/api-gateway.entity';

export interface IApiGatewayRepository {
    // API网关管理
    findGatewayById(id: string): Promise<ApiGateway | null>;
    findGatewaysByTenant(
        tenantId: string,
        page: number,
        limit: number
    ): Promise<{ gateways: ApiGateway[]; total: number }>;
    createGateway(gateway: Partial<ApiGateway>): Promise<ApiGateway>;
    updateGateway(id: string, gateway: Partial<ApiGateway>): Promise<ApiGateway>;
    deleteGateway(id: string): Promise<void>;
    updateGatewayStatus(id: string, status: ApiGateway['status']): Promise<ApiGateway>;

    // API路由管理
    findRouteById(id: string): Promise<ApiRoute | null>;
    findRoutesByGateway(gatewayId: string): Promise<ApiRoute[]>;
    createRoute(route: Partial<ApiRoute>): Promise<ApiRoute>;
    updateRoute(id: string, route: Partial<ApiRoute>): Promise<ApiRoute>;
    deleteRoute(id: string): Promise<void>;

    // API密钥管理
    findApiKeyById(id: string): Promise<ApiKey | null>;
    findApiKeysByGateway(gatewayId: string): Promise<ApiKey[]>;
    createApiKey(apiKey: Partial<ApiKey>): Promise<ApiKey>;
    updateApiKey(id: string, apiKey: Partial<ApiKey>): Promise<ApiKey>;
    deleteApiKey(id: string): Promise<void>;
    updateApiKeyStatus(id: string, status: ApiKey['status']): Promise<ApiKey>;
    findApiKeyByKey(key: string): Promise<ApiKey | null>;

    // API日志管理
    findLogsByGateway(
        gatewayId: string,
        page: number,
        limit: number
    ): Promise<{ logs: ApiLog[]; total: number }>;
    findLogsByRoute(
        routeId: string,
        page: number,
        limit: number
    ): Promise<{ logs: ApiLog[]; total: number }>;
    createLog(log: Partial<ApiLog>): Promise<ApiLog>;
    findLogById(id: string): Promise<ApiLog | null>;
}
