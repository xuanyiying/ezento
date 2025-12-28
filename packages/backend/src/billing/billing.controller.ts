import { 
  Controller, 
  Get, 
  Post, 
  Put, 
  Delete, 
  Body, 
  Param, 
  Query, 
  Patch 
} from '@nestjs/common';
import { BillingService } from './billing.service';
import { InvoiceStatus } from '@prisma/client';

@Controller('billing')
export class BillingController {
  constructor(private readonly billingService: BillingService) {}

  // Usage
  @Get('usage')
  async getAllUsage() {
    return this.billingService.getAllUsage();
  }

  @Get('usage/tenant/:tenantId')
  async getTenantUsage(@Param('tenantId') tenantId: string) {
    return this.billingService.getTenantUsage(tenantId);
  }

  @Post('usage')
  async recordUsage(@Body() data: any) {
    return this.billingService.recordUsage(data);
  }

  // Plans
  @Get('plans')
  async getPlans() {
    return this.billingService.getAllBillingPlans();
  }

  @Get('plans/:id')
  async getPlan(@Param('id') id: string) {
    return this.billingService.getBillingPlanById(id);
  }

  @Post('plans')
  async createPlan(@Body() data: any) {
    return this.billingService.createBillingPlan(data);
  }

  @Put('plans/:id')
  async updatePlan(@Param('id') id: string, @Body() data: any) {
    return this.billingService.updateBillingPlan(id, data);
  }

  @Delete('plans/:id')
  async deletePlan(@Param('id') id: string) {
    return this.billingService.deleteBillingPlan(id);
  }

  // Rates
  @Get('rates')
  async getRates() {
    return this.billingService.getAllRates();
  }

  @Post('rates')
  async createRate(@Body() data: any) {
    return this.billingService.createRate(data);
  }

  @Put('rates/:id')
  async updateRate(@Param('id') id: string, @Body() data: any) {
    return this.billingService.updateRate(id, data);
  }

  // Invoices
  @Get('invoices')
  async getInvoices() {
    return this.billingService.getAllInvoices();
  }

  @Get('invoices/:id')
  async getInvoice(@Param('id') id: string) {
    return this.billingService.getInvoiceById(id);
  }

  @Get('invoices/tenant/:tenantId')
  async getTenantInvoices(@Param('tenantId') tenantId: string) {
    return this.billingService.getTenantInvoices(tenantId);
  }

  @Post('invoices')
  async generateInvoice(@Body() data: any) {
    return this.billingService.generateInvoice(data);
  }

  @Patch('invoices/:id/status')
  async updateInvoiceStatus(@Param('id') id: string, @Body('status') status: InvoiceStatus) {
    return this.billingService.updateInvoiceStatus(id, status);
  }

  // Overages
  @Get('overages')
  async getOverages(@Query('tenantId') tenantId?: string) {
    return this.billingService.getOverages(tenantId);
  }

  @Get('overages/settings/:tenantId')
  async getOverageSettings(@Param('tenantId') tenantId: string) {
    return this.billingService.getOverageSettings(tenantId);
  }

  @Post('overages/settings')
  async createOverageSettings(@Body() data: any) {
    return this.billingService.createOverageSettings(data);
  }
}
