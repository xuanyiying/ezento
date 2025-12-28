import {
  Controller,
  Post,
  Body,
  UseGuards,
  Request,
  Logger,
  InternalServerErrorException,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { ConsultationAgent, ReportInterpreterAgent, TriageAgent } from '../agents';

interface AuthRequest {
  user?: { id: string };
}

@Controller('medical-agents')
@UseGuards(JwtAuthGuard)
export class MedicalAgentController {
  private readonly logger = new Logger(MedicalAgentController.name);

  constructor(
    private readonly consultationAgent: ConsultationAgent,
    private readonly reportInterpreterAgent: ReportInterpreterAgent,
    private readonly triageAgent: TriageAgent
  ) {}

  @Post('consult')
  async consult(
    @Body() body: { sessionId: string; messages: any[]; userInput: string },
    @Request() req: AuthRequest
  ) {
    try {
      const userId = req.user?.id || 'anonymous';
      this.logger.log(`Consultation request from user ${userId}`);
      
      const response = await this.consultationAgent.consult(
        userId,
        body.sessionId,
        body.messages,
        body.userInput
      );
      
      return { response };
    } catch (error) {
      this.logger.error(`Consultation failed: ${error.message}`);
      throw new InternalServerErrorException(error.message);
    }
  }

  @Post('interpret-report')
  async interpretReport(
    @Body() body: { sessionId: string; reportData: string },
    @Request() req: AuthRequest
  ) {
    try {
      const userId = req.user?.id || 'anonymous';
      this.logger.log(`Report interpretation request from user ${userId}`);
      
      const response = await this.reportInterpreterAgent.interpret(
        userId,
        body.sessionId,
        body.reportData
      );
      
      return { response };
    } catch (error) {
      this.logger.error(`Report interpretation failed: ${error.message}`);
      throw new InternalServerErrorException(error.message);
    }
  }

  @Post('triage')
  async triage(
    @Body() body: { sessionId: string; symptoms: string },
    @Request() req: AuthRequest
  ) {
    try {
      const userId = req.user?.id || 'anonymous';
      this.logger.log(`Triage request from user ${userId}`);
      
      const response = await this.triageAgent.triage(
        userId,
        body.sessionId,
        body.symptoms
      );
      
      return { response };
    } catch (error) {
      this.logger.error(`Triage failed: ${error.message}`);
      throw new InternalServerErrorException(error.message);
    }
  }
}
