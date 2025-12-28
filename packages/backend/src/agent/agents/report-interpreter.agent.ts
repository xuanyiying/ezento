import { Injectable, Logger } from '@nestjs/common';
import { WorkflowOrchestrator } from '../workflows/workflow.orchestrator';
import { WorkflowContext, WorkflowStep } from '../workflows/workflow.interfaces';

@Injectable()
export class ReportInterpreterAgent {
  private readonly logger = new Logger(ReportInterpreterAgent.name);

  constructor(private readonly workflowOrchestrator: WorkflowOrchestrator) {}

  /**
   * Run the medical report interpretation workflow
   * @param userId The ID of the user
   * @param sessionId The ID of the session
   * @param reportData The raw text or data from the medical report
   */
  async interpret(
    userId: string,
    sessionId: string,
    reportData: string
  ): Promise<string> {
    this.logger.log(`Running Report Interpreter Agent for user ${userId}, session ${sessionId}`);

    const context: WorkflowContext = {
      userId,
      sessionId,
    };

    const steps: WorkflowStep[] = [
      // 1. Retrieve reference values and terminology
      {
        id: 'retrieve-reference',
        name: 'Retrieve Reference Values',
        type: 'rag-retrieval',
        modelTier: 'balanced',
        input: {
          query: reportData,
          k: 5,
        },
      },
      // 2. Analyze report data
      {
        id: 'analyze-report',
        name: 'Analyze Report',
        type: 'llm-call',
        modelTier: 'quality-optimized',
        input: {
          reportData,
          systemPrompt: `你是一位专业的医学报告解读专家。
你的任务是帮助用户理解他们的医学检查报告（如血常规、生化、影像学报告等）。
请遵循以下原则：
1. 解释异常指标的含义（高了或低了意味着什么）。
2. 用通俗易懂的语言解释专业术语。
3. 提供可能的医学建议，但务必提醒用户以主治医生意见为准。
4. 结构化你的回复，让用户一目了然。`,
          prompt: `待解读的报告数据：
{{reportData}}

参考医学知识与指标范围：
{{knowledge}}

请对该报告进行深度解读，并给出易于理解的总结和建议。`,
        },
      },
    ];

    const result = await this.workflowOrchestrator.executeSequential(steps, context);

    if (!result.success) {
      throw new Error(`Report interpretation workflow failed: ${result.error || 'Unknown error'}`);
    }

    const lastResult = result.results[result.results.length - 1];
    return lastResult.content as string;
  }
}
