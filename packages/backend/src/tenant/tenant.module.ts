import { Module } from '@nestjs/common';
import { TenantService } from './tenant.service';
import { PrismaModule } from '../prisma/prisma.module';
import { TenantController } from './tenant.controller';

@Module({
  imports: [PrismaModule],
  controllers: [TenantController],
  providers: [TenantService],
  exports: [TenantService],
})
export class TenantModule {}
