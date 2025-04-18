import { ApiRouteMethod, PrismaClient } from '@prisma/client';
import { IApiGatewayRepository } from '../api-gateway.repository';
import { ApiGateway, ApiRoute, ApiKey, ApiLog } from '../../domains/api-gateway/api-gateway.entity';

export class PrismaApiGatewayRepository implements IApiGatewayRepository {
    constructor(private prisma: PrismaClient) {}

    // API网关管理
    async findGatewayById(id: string): Promise<ApiGateway | null> {
        const gateway = await this.prisma.apiGateway.findUnique({
            where: { id },
            include: {
                routes: true,
                apiKeys: true,
                logs: true,
            },
        });
        return gateway ? this.mapToApiGateway(gateway) : null;
    }

    async findGatewaysByTenant(
        tenantId: string,
        page: number,
        limit: number
    ): Promise<{ gateways: ApiGateway[]; total: number }> {
        const [gateways, total] = await Promise.all([
            this.prisma.apiGateway.findMany({
                where: { tenantId },
                skip: (page - 1) * limit,
                take: limit,
                include: {
                    routes: true,
                    apiKeys: true,
                    logs: true,
                },
            }),
            this.prisma.apiGateway.count({
                where: { tenantId },
            }),
        ]);

        return {
            gateways: gateways.map(this.mapToApiGateway),
            total,
        };
    }

    async createGateway(gateway: Partial<ApiGateway>): Promise<ApiGateway> {
        const created = await this.prisma.apiGateway.create({
            data: {
                tenantId: gateway.tenantId!,
                name: gateway.name!,
                description: gateway.description,
                baseUrl: gateway.baseUrl!,
                status: gateway.status!,
                rateLimit: gateway.rateLimit!,
                cors: gateway.cors!,
                authentication: gateway.authentication!,
                metadata: gateway.metadata,
            },
            include: {
                routes: true,
                apiKeys: true,
                logs: true,
            },
        });
        return this.mapToApiGateway(created);
    }

    async updateGateway(id: string, gateway: Partial<ApiGateway>): Promise<ApiGateway> {
        const updated = await this.prisma.apiGateway.update({
            where: { id },
            data: {
                name: gateway.name,
                description: gateway.description,
                baseUrl: gateway.baseUrl,
                status: gateway.status,
                rateLimit: gateway.rateLimit,
                cors: gateway.cors,
                authentication: gateway.authentication,
                metadata: gateway.metadata,
            },
            include: {
                routes: true,
                apiKeys: true,
                logs: true,
            },
        });
        return this.mapToApiGateway(updated);
    }

    async deleteGateway(id: string): Promise<void> {
        await this.prisma.apiGateway.delete({
            where: { id },
        });
    }

    async updateGatewayStatus(id: string, status: ApiGateway['status']): Promise<ApiGateway> {
        const updated = await this.prisma.apiGateway.update({
            where: { id },
            data: { status },
            include: {
                routes: true,
                apiKeys: true,
                logs: true,
            },
        });
        return this.mapToApiGateway(updated);
    }

    // API路由管理
    async findRouteById(id: string): Promise<ApiRoute | null> {
        const route = await this.prisma.apiRoute.findUnique({
            where: { id },
        });
        return route ? this.mapToApiRoute(route) : null;
    }

    async findRoutesByGateway(gatewayId: string): Promise<ApiRoute[]> {
        const routes = await this.prisma.apiRoute.findMany({
            where: { gatewayId },
        });
        return routes.map(this.mapToApiRoute);
    }

    async createRoute(route: Partial<ApiRoute>): Promise<ApiRoute> {
        const created = await this.prisma.apiRoute.create({
            data: {
                gatewayId: route.gatewayId!,
                path: route.path!,
                method: route.method!,
                target: route.target!,
                rateLimit: route.rateLimit,
                authentication: route.authentication,
                validation: route.validation,
                transformation: route.transformation,
                metadata: route.metadata,
            },
        });
        return this.mapToApiRoute(created);
    }

    async updateRoute(id: string, route: Partial<ApiRoute>): Promise<ApiRoute> {
        const updated = await this.prisma.apiRoute.update({
            where: { id },
            data: {
                path: route.path,
                method: route.method,
                target: route.target,
                rateLimit: route.rateLimit,
                authentication: route.authentication,
                validation: route.validation,
                transformation: route.transformation,
                metadata: route.metadata,
            },
        });
        return this.mapToApiRoute(updated);
    }

    async deleteRoute(id: string): Promise<void> {
        await this.prisma.apiRoute.delete({
            where: { id },
        });
    }

    // API密钥管理
    async findApiKeyById(id: string): Promise<ApiKey | null> {
        const apiKey = await this.prisma.apiKey.findUnique({
            where: { id },
        });
        return apiKey ? this.mapToApiKey(apiKey) : null;
    }

    async findApiKeysByGateway(gatewayId: string): Promise<ApiKey[]> {
        const apiKeys = await this.prisma.apiKey.findMany({
            where: { gatewayId },
        });
        return apiKeys.map(this.mapToApiKey);
    }

    async createApiKey(apiKey: Partial<ApiKey>): Promise<ApiKey> {
        const created = await this.prisma.apiKey.create({
            data: {
                gatewayId: apiKey.gatewayId!,
                key: apiKey.key!,
                name: apiKey.name!,
                description: apiKey.description,
                status: apiKey.status!,
                expiresAt: apiKey.expiresAt,
                metadata: apiKey.metadata,
            },
        });
        return this.mapToApiKey(created);
    }

    async updateApiKey(id: string, apiKey: Partial<ApiKey>): Promise<ApiKey> {
        const updated = await this.prisma.apiKey.update({
            where: { id },
            data: {
                name: apiKey.name,
                description: apiKey.description,
                status: apiKey.status,
                expiresAt: apiKey.expiresAt,
                metadata: apiKey.metadata,
            },
        });
        return this.mapToApiKey(updated);
    }

    async deleteApiKey(id: string): Promise<void> {
        await this.prisma.apiKey.delete({
            where: { id },
        });
    }

    async updateApiKeyStatus(id: string, status: ApiKey['status']): Promise<ApiKey> {
        const updated = await this.prisma.apiKey.update({
            where: { id },
            data: { status },
        });
        return this.mapToApiKey(updated);
    }

    async findApiKeyByKey(key: string): Promise<ApiKey | null> {
        const apiKey = await this.prisma.apiKey.findFirst({
            where: { key },
        });
        return apiKey ? this.mapToApiKey(apiKey) : null;
    }

    // API日志管理
    async findLogsByGateway(
        gatewayId: string,
        page: number,
        limit: number
    ): Promise<{ logs: ApiLog[]; total: number }> {
        const [logs, total] = await Promise.all([
            this.prisma.apiLog.findMany({
                where: { gatewayId },
                skip: (page - 1) * limit,
                take: limit,
                orderBy: { createdAt: 'desc' },
            }),
            this.prisma.apiLog.count({
                where: { gatewayId },
            }),
        ]);

        return {
            logs: logs.map(this.mapToApiLog),
            total,
        };
    }

    async findLogsByRoute(
        routeId: string,
        page: number,
        limit: number
    ): Promise<{ logs: ApiLog[]; total: number }> {
        const [logs, total] = await Promise.all([
            this.prisma.apiLog.findMany({
                where: { routeId },
                skip: (page - 1) * limit,
                take: limit,
                orderBy: { createdAt: 'desc' },
            }),
            this.prisma.apiLog.count({
                where: { routeId },
            }),
        ]);

        return {
            logs: logs.map(this.mapToApiLog),
            total,
        };
    }

    async createLog(log: Partial<ApiLog>): Promise<ApiLog> {
        const created = await this.prisma.apiLog.create({
            data: {
                gatewayId: log.gatewayId!,
                routeId: log.routeId!,
                requestId: log.requestId!,
                method: log.method as ApiRouteMethod,
                path: log.path!,
                statusCode: log.statusCode!,
                duration: log.duration!,
                clientIp: log.clientIp!,
                userAgent: log.userAgent,
                requestHeaders: log.requestHeaders,
                requestBody: log.requestBody,
                responseHeaders: log.responseHeaders,
                responseBody: log.responseBody,
                error: log.error,
                metadata: log.metadata,
            },
        });
        return this.mapToApiLog(created);
    }

    async findLogById(id: string): Promise<ApiLog | null> {
        const log = await this.prisma.apiLog.findUnique({
            where: { id },
        });
        return log ? this.mapToApiLog(log) : null;
    }

    // 私有映射方法
    private mapToApiGateway(data: any): ApiGateway {
        return {
            id: data.id,
            tenantId: data.tenantId,
            name: data.name,
            description: data.description,
            baseUrl: data.baseUrl,
            status: data.status,
            rateLimit: data.rateLimit,
            cors: data.cors,
            authentication: data.authentication,
            metadata: data.metadata,
            createdAt: data.createdAt,
            updatedAt: data.updatedAt,
            routes: data.routes?.map(this.mapToApiRoute) || [],
            apiKeys: data.apiKeys?.map(this.mapToApiKey) || [],
            logs: data.logs?.map(this.mapToApiLog) || [],
        };
    }

    private mapToApiRoute(data: any): ApiRoute {
        return {
            id: data.id,
            gatewayId: data.gatewayId,
            path: data.path,
            method: data.method,
            target: data.target,
            rateLimit: data.rateLimit,
            authentication: data.authentication,
            validation: data.validation,
            transformation: data.transformation,
            metadata: data.metadata,
            createdAt: data.createdAt,
            updatedAt: data.updatedAt,
        };
    }

    private mapToApiKey(data: any): ApiKey {
        return {
            id: data.id,
            gatewayId: data.gatewayId,
            key: data.key,
            name: data.name,
            description: data.description,
            status: data.status,
            expiresAt: data.expiresAt,
            lastUsedAt: data.lastUsedAt,
            metadata: data.metadata,
            createdAt: data.createdAt,
            updatedAt: data.updatedAt,
        };
    }

    private mapToApiLog(data: any): ApiLog {
        return {
            id: data.id,
            gatewayId: data.gatewayId,
            routeId: data.routeId,
            requestId: data.requestId,
            method: data.method,
            path: data.path,
            statusCode: data.statusCode,
            duration: data.duration,
            clientIp: data.clientIp,
            userAgent: data.userAgent,
            requestHeaders: data.requestHeaders,
            requestBody: data.requestBody,
            responseHeaders: data.responseHeaders,
            responseBody: data.responseBody,
            error: data.error,
            metadata: data.metadata,
            createdAt: data.createdAt,
        };
    }
}
