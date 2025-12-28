import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { 
  ApiGateway, 
  ApiRoute, 
  ApiKey, 
  ApiLog, 
  ApiGatewayStatus, 
  ApiKeyStatus 
} from '@prisma/client';

@Injectable()
export class ApiGatewayService {
  constructor(private prisma: PrismaService) {}

  // API网关管理
  async getGatewayById(id: string): Promise<ApiGateway> {
    const gateway = await this.prisma.apiGateway.findUnique({
      where: { id },
    });
    if (!gateway) {
      throw new NotFoundException('API Gateway not found');
    }
    return gateway;
  }

  async getGatewaysByTenant(
    tenantId: string,
    page = 1,
    limit = 10
  ): Promise<{ gateways: ApiGateway[]; total: number }> {
    const skip = (page - 1) * limit;
    const [gateways, total] = await Promise.all([
      this.prisma.apiGateway.findMany({
        where: { tenantId },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.apiGateway.count({
        where: { tenantId },
      }),
    ]);
    return { gateways, total };
  }

  async createGateway(data: any): Promise<ApiGateway> {
    this.validateGateway(data);
    return this.prisma.apiGateway.create({
      data,
    });
  }

  async updateGateway(id: string, data: any): Promise<ApiGateway> {
    await this.getGatewayById(id);
    this.validateGateway(data);
    return this.prisma.apiGateway.update({
      where: { id },
      data,
    });
  }

  async deleteGateway(id: string): Promise<void> {
    await this.getGatewayById(id);
    await this.prisma.apiGateway.delete({
      where: { id },
    });
  }

  async updateGatewayStatus(id: string, status: ApiGatewayStatus): Promise<ApiGateway> {
    await this.getGatewayById(id);
    return this.prisma.apiGateway.update({
      where: { id },
      data: { status },
    });
  }

  // API路由管理
  async getRouteById(id: string): Promise<ApiRoute> {
    const route = await this.prisma.apiRoute.findUnique({
      where: { id },
    });
    if (!route) {
      throw new NotFoundException('API Route not found');
    }
    return route;
  }

  async getRoutesByGateway(gatewayId: string): Promise<ApiRoute[]> {
    await this.getGatewayById(gatewayId);
    return this.prisma.apiRoute.findMany({
      where: { gatewayId },
      orderBy: { path: 'asc' },
    });
  }

  async createRoute(data: any): Promise<ApiRoute> {
    await this.getGatewayById(data.gatewayId);
    this.validateRoute(data);
    return this.prisma.apiRoute.create({
      data,
    });
  }

  async updateRoute(id: string, data: any): Promise<ApiRoute> {
    await this.getRouteById(id);
    if (data.gatewayId) {
      await this.getGatewayById(data.gatewayId);
    }
    this.validateRoute(data);
    return this.prisma.apiRoute.update({
      where: { id },
      data,
    });
  }

  async deleteRoute(id: string): Promise<void> {
    await this.getRouteById(id);
    await this.prisma.apiRoute.delete({
      where: { id },
    });
  }

  // API密钥管理
  async getApiKeyById(id: string): Promise<ApiKey> {
    const apiKey = await this.prisma.apiKey.findUnique({
      where: { id },
    });
    if (!apiKey) {
      throw new NotFoundException('API Key not found');
    }
    return apiKey;
  }

  async getApiKeysByGateway(gatewayId: string): Promise<ApiKey[]> {
    await this.getGatewayById(gatewayId);
    return this.prisma.apiKey.findMany({
      where: { gatewayId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async createApiKey(data: any): Promise<ApiKey> {
    await this.getGatewayById(data.gatewayId);
    this.validateApiKey(data);
    return this.prisma.apiKey.create({
      data,
    });
  }

  async updateApiKey(id: string, data: any): Promise<ApiKey> {
    await this.getApiKeyById(id);
    if (data.gatewayId) {
      await this.getGatewayById(data.gatewayId);
    }
    this.validateApiKey(data);
    return this.prisma.apiKey.update({
      where: { id },
      data,
    });
  }

  async deleteApiKey(id: string): Promise<void> {
    await this.getApiKeyById(id);
    await this.prisma.apiKey.delete({
      where: { id },
    });
  }

  async updateApiKeyStatus(id: string, status: ApiKeyStatus): Promise<ApiKey> {
    await this.getApiKeyById(id);
    return this.prisma.apiKey.update({
      where: { id },
      data: { status },
    });
  }

  // API日志管理
  async getLogsByGateway(
    gatewayId: string,
    page = 1,
    limit = 10
  ): Promise<{ logs: ApiLog[]; total: number }> {
    await this.getGatewayById(gatewayId);
    const skip = (page - 1) * limit;
    const [logs, total] = await Promise.all([
      this.prisma.apiLog.findMany({
        where: { gatewayId },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.apiLog.count({
        where: { gatewayId },
      }),
    ]);
    return { logs, total };
  }

  async getLogsByRoute(
    routeId: string,
    page = 1,
    limit = 10
  ): Promise<{ logs: ApiLog[]; total: number }> {
    await this.getRouteById(routeId);
    const skip = (page - 1) * limit;
    const [logs, total] = await Promise.all([
      this.prisma.apiLog.findMany({
        where: { routeId },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.apiLog.count({
        where: { routeId },
      }),
    ]);
    return { logs, total };
  }

  async createLog(data: any): Promise<ApiLog> {
    return this.prisma.apiLog.create({
      data,
    });
  }

  async getLogById(id: string): Promise<ApiLog> {
    const log = await this.prisma.apiLog.findUnique({
      where: { id },
    });
    if (!log) {
      throw new NotFoundException('API Log not found');
    }
    return log;
  }

  // 私有验证方法
  private validateGateway(gateway: any): void {
    if (!gateway.name) {
      throw new BadRequestException('Gateway name is required');
    }
    if (!gateway.baseUrl) {
      throw new BadRequestException('Base URL is required');
    }
  }

  private validateRoute(route: any): void {
    if (!route.path) {
      throw new BadRequestException('Route path is required');
    }
    if (!route.method) {
      throw new BadRequestException('Route method is required');
    }
    if (!route.target) {
      throw new BadRequestException('Route target is required');
    }
  }

  private validateApiKey(apiKey: any): void {
    if (!apiKey.name) {
      throw new BadRequestException('API Key name is required');
    }
    if (!apiKey.key) {
      throw new BadRequestException('API Key value is required');
    }
  }
}
