import { Injectable, Logger } from '@nestjs/common';
import { WorkflowOrchestrator } from '../workflows/workflow.orchestrator';
import { WorkflowContext, WorkflowStep } from '../workflows/workflow.interfaces';

@Injectable()
export class TriageAgent {
  private readonly logger = new Logger(TriageAgent.name);

  constructor(private readonly workflowOrchestrator: WorkflowOrchestrator) {}

  /**
   * Run the smart triage workflow
   * @param userId The ID of the user
   * @param sessionId The ID of the session
   * @param symptoms The user's symptom description
   */
  async triage(
    userId: string,
    sessionId: string,
    symptoms: string
  ): Promise<string> {
    this.logger.log(`Running Triage Agent for user ${userId}, session ${sessionId}`);

    const context: WorkflowContext = {
      userId,
      sessionId,
    };

    const steps: WorkflowStep[] = [
      // 1. Retrieve department info and triage guidelines
      {
        id: 'retrieve-departments',
        name: 'Retrieve Department Guidelines',
        type: 'rag-retrieval',
        modelTier: 'balanced',
        input: {
          query: symptoms,
          k: 3,
        },
      },
      // 2. Determine department and urgency
      {
        id: 'recommend-department',
        name: 'Recommend Department',
        type: 'llm-call',
        modelTier: 'balanced',
        input: {
          symptoms,
          systemPrompt: `你是一位专业的医院导诊医生。
你的任务是根据用户的症状描述，推荐合适的就诊科室，并判断病情的紧急程度。
请遵循以下原则：
1. 准确判断科室（如：呼吸内科、消化内科、急诊等）。
2. 如果病情看起来很严重，务必建议用户立即就医或挂急诊。
3. 简要说明推荐该科室的原因。
4. 提醒用户带好相关的检查资料或医保卡。`,
          prompt: `用户症状描述：
{{symptoms}}

科室分类与导诊参考：
{{knowledge}}

请给出你的导诊建议，包括：
1. 推荐科室
2. 紧急程度
3. 挂号建议与注意事项`,
        },
      },
    ];

    const result = await this.workflowOrchestrator.executeSequential(steps, context);

    if (!result.success) {
      throw new Error(`Triage workflow failed: ${result.error || 'Unknown error'}`);
    }

    const lastResult = result.results[result.results.length - 1];
    return lastResult.content as string;
  }
}
