import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { AIProvidersModule } from '../ai-providers/ai-providers.module';
import { PrismaModule } from '../prisma/prisma.module';
import { RedisModule } from '../redis/redis.module';

import { WorkflowOrchestrator } from './workflows/workflow.orchestrator';
import { ContextCompressorService, EmbeddingService, RAGService, VectorDbService } from './services';
import { DemoAgent, ConsultationAgent, ReportInterpreterAgent, TriageAgent } from './agents';
import { MedicalAgentController } from './controllers/medical-agent.controller';

@Module({
  imports: [
    AIProvidersModule,
    PrismaModule,
    RedisModule,
    ScheduleModule.forRoot(),
  ],
  controllers: [MedicalAgentController],
  providers: [
    EmbeddingService,
    VectorDbService,
    RAGService,
    ContextCompressorService,
    WorkflowOrchestrator,
    DemoAgent,
    ConsultationAgent,
    ReportInterpreterAgent,
    TriageAgent,
  ],
  exports: [
    EmbeddingService,
    VectorDbService,
    RAGService,
    ContextCompressorService,
    WorkflowOrchestrator,
    DemoAgent,
    ConsultationAgent,
    ReportInterpreterAgent,
    TriageAgent,
  ],
})
export class AgentModule { }
