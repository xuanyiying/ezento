import { Module, MiddlewareConsumer, NestModule } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { BullModule } from '@nestjs/bull';
import { WinstonModule } from 'nest-winston';
import { PrismaModule } from './prisma/prisma.module';
import { RedisModule } from './redis/redis.module';
import { HealthModule } from './health/health.module';
import { CommonModule } from './common/common.module';
import { LoggerModule } from './logger/logger.module';
import { MonitoringModule } from './monitoring/monitoring.module';
import { EmailModule } from './email/email.module';
import { AIProvidersModule } from './ai-providers/ai-providers.module';
import { AgentModule } from './agent/agent.module';
import { PaymentModule } from './payment/payment.module'; // Added PaymentModule
import { ConsultationModule } from './consultation/consultation.module';
import { MedicalRecordModule } from './medical-record/medical-record.module';
import { ReportModule } from './report/report.module';
import { GuideModule } from './guide/guide.module';
import { WebsocketModule } from './websocket/websocket.module';
import { ApiGatewayModule } from './api-gateway/api-gateway.module';
import { CircuitBreakerModule } from './circuit-breaker/circuit-breaker.module';
import { BillingModule } from './billing/billing.module';
import { RechargeModule } from './recharge/recharge.module';
import { TenantModule } from './tenant/tenant.module';
import { loggerConfig } from './logger/logger.config';
import {
    PerformanceMiddleware,
    CacheControlMiddleware,
} from './common/middleware/performance.middleware';
import { RequestLoggingMiddleware } from './common/middleware/request-logging.middleware';
import { TenantMiddleware } from './common/middleware/tenant.middleware';

import { MongooseModule } from '@nestjs/mongoose';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';

@Module({
    imports: [
        ConfigModule.forRoot({
            isGlobal: true,
            envFilePath: '.env',
        }),
        MongooseModule.forRootAsync({
            imports: [ConfigModule],
            useFactory: async (configService: ConfigService) => ({
                uri: configService.get<string>('MONGODB_URI'),
            }),
            inject: [ConfigService],
        }),
        WinstonModule.forRoot(loggerConfig),
        LoggerModule,
        CommonModule,
        PrismaModule,
        RedisModule,
        HealthModule,
        AuthModule,
        MonitoringModule,
        EmailModule,
        AIProvidersModule,
        AgentModule,
        PaymentModule, // Added PaymentModule
        ConsultationModule,
        MedicalRecordModule,
        ReportModule,
        GuideModule,
        WebsocketModule,
        ApiGatewayModule,
        CircuitBreakerModule,
        BillingModule,
        RechargeModule,
        TenantModule,
        BullModule.forRootAsync({
            imports: [ConfigModule],
            useFactory: async (configService: ConfigService) => ({
                redis: {
                    host: configService.get('REDIS_HOST', 'localhost'),
                    port: configService.get('REDIS_PORT', 6379),
                    password: configService.get('REDIS_PASSWORD'),
                },
                defaultJobOptions: {
                    attempts: 3,
                    backoff: {
                        type: 'exponential',
                        delay: 1000,
                    },
                },
            }),
            inject: [ConfigService],
        }),
    ],
    controllers: [AppController],
    providers: [AppService],
})
export class AppModule implements NestModule {
    configure(consumer: MiddlewareConsumer) {
        consumer.apply(RequestLoggingMiddleware).forRoutes('*');
        consumer.apply(TenantMiddleware).forRoutes('*');
        consumer
            .apply(PerformanceMiddleware, CacheControlMiddleware)
            .forRoutes('*');
    }
}
