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
import { CircuitBreakerService } from './circuit-breaker.service';
import { CircuitBreakerStatus } from '@prisma/client';

@Controller('circuit-breakers')
export class CircuitBreakerController {
  constructor(private readonly circuitBreakerService: CircuitBreakerService) {}

  @Get()
  async getBreakers(@Query('tenantId') tenantId: string, @Query('page') page?: string, @Query('limit') limit?: string) {
    return this.circuitBreakerService.getCircuitBreakersByTenant(
      tenantId,
      page ? parseInt(page) : 1,
      limit ? parseInt(limit) : 10
    );
  }

  @Get(':id')
  async getBreaker(@Param('id') id: string) {
    return this.circuitBreakerService.getCircuitBreakerById(id);
  }

  @Post()
  async createBreaker(@Body() data: any) {
    return this.circuitBreakerService.createCircuitBreaker(data);
  }

  @Put(':id')
  async updateBreaker(@Param('id') id: string, @Body() data: any) {
    return this.circuitBreakerService.updateCircuitBreaker(id, data);
  }

  @Delete(':id')
  async deleteBreaker(@Param('id') id: string) {
    return this.circuitBreakerService.deleteCircuitBreaker(id);
  }

  @Patch(':id/status')
  async updateStatus(@Param('id') id: string, @Body('status') status: CircuitBreakerStatus) {
    return this.circuitBreakerService.updateCircuitBreakerStatus(id, status);
  }

  // Rules
  @Get(':id/rules')
  async getRules(@Param('id') id: string) {
    return this.circuitBreakerService.getCircuitBreakerRules(id);
  }

  @Post('rules')
  async createRule(@Body() data: any) {
    return this.circuitBreakerService.createCircuitBreakerRule(data);
  }

  @Put('rules/:id')
  async updateRule(@Param('id') id: string, @Body() data: any) {
    return this.circuitBreakerService.updateCircuitBreakerRule(id, data);
  }

  @Delete('rules/:id')
  async deleteRule(@Param('id') id: string) {
    return this.circuitBreakerService.deleteCircuitBreakerRule(id);
  }

  @Patch('rules/:id/priority')
  async updatePriority(@Param('id') id: string, @Body('priority') priority: number) {
    return this.circuitBreakerService.updateRulePriority(id, priority);
  }

  // Events
  @Get(':id/events')
  async getEvents(
    @Param('id') id: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string
  ) {
    return this.circuitBreakerService.getCircuitBreakerEvents(
      id,
      page ? parseInt(page) : 1,
      limit ? parseInt(limit) : 10
    );
  }
}
