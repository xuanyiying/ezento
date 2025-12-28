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
import { RechargeService } from './recharge.service';

@Controller('recharge')
export class RechargeController {
  constructor(private readonly rechargeService: RechargeService) {}

  // Cards
  @Get('cards/:id')
  async getCard(@Param('id') id: string) {
    return this.rechargeService.getRechargeCardById(id);
  }

  @Get('cards/code/:code')
  async getCardByCode(@Param('code') code: string) {
    return this.rechargeService.getRechargeCardByCode(code);
  }

  @Get('cards/tenant/:tenantId')
  async getTenantCards(
    @Param('tenantId') tenantId: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string
  ) {
    return this.rechargeService.getRechargeCardsByTenant(
      tenantId,
      page ? parseInt(page) : 1,
      limit ? parseInt(limit) : 10
    );
  }

  @Post('cards')
  async createCard(@Body() data: any) {
    return this.rechargeService.createRechargeCard(data);
  }

  @Put('cards/:id')
  async updateCard(@Param('id') id: string, @Body() data: any) {
    return this.rechargeService.updateRechargeCard(id, data);
  }

  @Delete('cards/:id')
  async deleteCard(@Param('id') id: string) {
    return this.rechargeService.deleteRechargeCard(id);
  }

  // Batches
  @Get('batches/:id')
  async getBatch(@Param('id') id: string) {
    return this.rechargeService.getRechargeCardBatchById(id);
  }

  @Get('batches/tenant/:tenantId')
  async getTenantBatches(
    @Param('tenantId') tenantId: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string
  ) {
    return this.rechargeService.getRechargeCardBatchesByTenant(
      tenantId,
      page ? parseInt(page) : 1,
      limit ? parseInt(limit) : 10
    );
  }

  @Post('batches')
  async createBatch(@Body() data: any) {
    return this.rechargeService.createRechargeCardBatch(data);
  }

  @Put('batches/:id')
  async updateBatch(@Param('id') id: string, @Body() data: any) {
    return this.rechargeService.updateRechargeCardBatch(id, data);
  }

  @Delete('batches/:id')
  async deleteBatch(@Param('id') id: string) {
    return this.rechargeService.deleteRechargeCardBatch(id);
  }

  // Records
  @Get('records/tenant/:tenantId')
  async getTenantRecords(
    @Param('tenantId') tenantId: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string
  ) {
    return this.rechargeService.getRechargeRecordsByTenant(
      tenantId,
      page ? parseInt(page) : 1,
      limit ? parseInt(limit) : 10
    );
  }

  @Get('records/user/:userId')
  async getUserRecords(
    @Param('userId') userId: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string
  ) {
    return this.rechargeService.getRechargeRecordsByUser(
      userId,
      page ? parseInt(page) : 1,
      limit ? parseInt(limit) : 10
    );
  }

  @Post('records')
  async createRecord(@Body() data: any) {
    return this.rechargeService.createRechargeRecord(data);
  }
}
