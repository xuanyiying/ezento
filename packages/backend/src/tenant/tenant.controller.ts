import { 
  Controller, 
  Get, 
  Post, 
  Put, 
  Delete, 
  Body, 
  Param, 
  Patch 
} from '@nestjs/common';
import { TenantService } from './tenant.service';
import { TenantStatus } from '@prisma/client';

@Controller('tenants')
export class TenantController {
  constructor(private readonly tenantService: TenantService) {}

  @Get()
  async findAll() {
    return this.tenantService.findAll();
  }

  @Get(':id')
  async findById(@Param('id') id: string) {
    return this.tenantService.findById(id);
  }

  @Get('code/:code')
  async findByCode(@Param('code') code: string) {
    return this.tenantService.findByCode(code);
  }

  @Post()
  async create(@Body() data: any) {
    return this.tenantService.create(data);
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() data: any) {
    return this.tenantService.update(id, data);
  }

  @Delete(':id')
  async delete(@Param('id') id: string) {
    return this.tenantService.delete(id);
  }

  @Patch(':id/status')
  async changeStatus(@Param('id') id: string, @Body('status') status: TenantStatus) {
    return this.tenantService.changeStatus(id, status);
  }

  @Patch(':id/plan')
  async changePlan(@Param('id') id: string, @Body('plan') plan: string) {
    return this.tenantService.changePlan(id, plan);
  }

  @Get('plans')
  async getPlans() {
    return this.tenantService.getTenantPlans();
  }

  @Get(':id/stats')
  async getStats(@Param('id') id: string) {
    return this.tenantService.getTenantStats(id);
  }

  @Get(':id/config')
  async getConfig(@Param('id') id: string) {
    return this.tenantService.getTenantConfig(id);
  }

  @Patch(':id/config')
  async updateConfig(@Param('id') id: string, @Body() config: any) {
    return this.tenantService.updateTenantConfig(id, config);
  }
}
