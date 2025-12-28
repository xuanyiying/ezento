import { 
  Controller, 
  Get, 
  Post, 
  Put, 
  Delete, 
  Body, 
  Param, 
  Query, 
  ParseIntPipe, 
  Patch 
} from '@nestjs/common';
import { ApiGatewayService } from './api-gateway.service';
import { ApiGatewayStatus, ApiKeyStatus } from '@prisma/client';

@Controller('api-gateways')
export class ApiGatewayController {
  constructor(private readonly apiGatewayService: ApiGatewayService) {}

  @Get()
  async getGateways(@Query('tenantId') tenantId: string, @Query('page') page?: string, @Query('limit') limit?: string) {
    return this.apiGatewayService.getGatewaysByTenant(
      tenantId,
      page ? parseInt(page) : 1,
      limit ? parseInt(limit) : 10
    );
  }

  @Get(':id')
  async getGateway(@Param('id') id: string) {
    return this.apiGatewayService.getGatewayById(id);
  }

  @Post()
  async createGateway(@Body() data: any) {
    return this.apiGatewayService.createGateway(data);
  }

  @Put(':id')
  async updateGateway(@Param('id') id: string, @Body() data: any) {
    return this.apiGatewayService.updateGateway(id, data);
  }

  @Delete(':id')
  async deleteGateway(@Param('id') id: string) {
    return this.apiGatewayService.deleteGateway(id);
  }

  @Patch(':id/status')
  async updateStatus(@Param('id') id: string, @Body('status') status: ApiGatewayStatus) {
    return this.apiGatewayService.updateGatewayStatus(id, status);
  }

  // Routes
  @Get(':id/routes')
  async getRoutes(@Param('id') id: string) {
    return this.apiGatewayService.getRoutesByGateway(id);
  }

  @Post('routes')
  async createRoute(@Body() data: any) {
    return this.apiGatewayService.createRoute(data);
  }

  @Get('routes/:id')
  async getRoute(@Param('id') id: string) {
    return this.apiGatewayService.getRouteById(id);
  }

  @Put('routes/:id')
  async updateRoute(@Param('id') id: string, @Body() data: any) {
    return this.apiGatewayService.updateRoute(id, data);
  }

  @Delete('routes/:id')
  async deleteRoute(@Param('id') id: string) {
    return this.apiGatewayService.deleteRoute(id);
  }

  // API Keys
  @Get(':id/keys')
  async getKeys(@Param('id') id: string) {
    return this.apiGatewayService.getApiKeysByGateway(id);
  }

  @Post('keys')
  async createApiKey(@Body() data: any) {
    return this.apiGatewayService.createApiKey(data);
  }

  @Patch('keys/:id/status')
  async updateKeyStatus(@Param('id') id: string, @Body('status') status: ApiKeyStatus) {
    return this.apiGatewayService.updateApiKeyStatus(id, status);
  }

  @Delete('keys/:id')
  async deleteApiKey(@Param('id') id: string) {
    return this.apiGatewayService.deleteApiKey(id);
  }

  // Logs
  @Get(':id/logs')
  async getLogs(
    @Param('id') id: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string
  ) {
    return this.apiGatewayService.getLogsByGateway(
      id,
      page ? parseInt(page) : 1,
      limit ? parseInt(limit) : 10
    );
  }
}
