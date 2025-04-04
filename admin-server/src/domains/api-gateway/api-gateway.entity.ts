import { ApiRouteMethod } from "@prisma/client";

export interface ApiGateway {
    id: string;
    tenantId: string;
    name: string;
    description?: string;
    baseUrl: string;
    status: 'ACTIVE' | 'INACTIVE' | 'MAINTENANCE';
    rateLimit: {
        requests: number;
        period: number;
    };
    cors: {
        enabled: boolean;
        allowedOrigins: string[];
        allowedMethods: string[];
        allowedHeaders: string[];
    };
    authentication: {
        type: string;
        config: any;
    };
    metadata?: any;
    createdAt: Date;
    updatedAt: Date;
    routes: ApiRoute[];
    apiKeys: ApiKey[];
    logs: ApiLog[];
}

export interface ApiRoute {
    id: string;
    gatewayId: string;
    path: string;
    method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
    target: {
        service: string;
        path: string;
        timeout: number;
    };
    rateLimit?: {
        requests: number;
        period: number;
    };
    authentication?: {
        required: boolean;
        type: string;
        config: any;
    };
    validation?: {
        requestSchema?: any;
        responseSchema?: any;
    };
    transformation?: {
        request?: any;
        response?: any;
    };
    metadata?: any;
    createdAt: Date;
    updatedAt: Date;
}

export interface ApiKey {
    id: string;
    gatewayId: string;
    key: string;
    name: string;
    description?: string;
    status: 'ACTIVE' | 'INACTIVE' | 'EXPIRED';
    expiresAt?: Date;
    lastUsedAt?: Date;
    metadata?: any;
    createdAt: Date;
    updatedAt: Date;
}

export interface ApiLog {
    id: string;
    gatewayId: string;
    routeId: string;
    requestId: string;
    method: string;
    path: string;
    statusCode: number;
    duration: number;
    clientIp: string;
    userAgent?: string;
    requestHeaders?: any;
    requestBody?: any;
    responseHeaders?: any;
    responseBody?: any;
    error?: string;
    metadata?: any;
    createdAt: Date;
} 