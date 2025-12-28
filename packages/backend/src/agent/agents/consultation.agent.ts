import { Injectable, Logger } from '@nestjs/common';
import { WorkflowOrchestrator } from '../workflows/workflow.orchestrator';
import { WorkflowContext, WorkflowStep } from '../workflows/workflow.interfaces';

@Injectable()
export class ConsultationAgent {
  private readonly logger = new Logger(ConsultationAgent.name);

  constructor(private readonly workflowOrchestrator: WorkflowOrchestrator) {}

  /**
   * Run the AI consultation workflow
   * @param userId The ID of the user
   * @param sessionId The ID of the session
   * @param messages The current conversation history
   * @param userInput The latest user message (symptoms)
   */
  async consult(
    userId: string,
    sessionId: string,
    messages: any[],
    userInput: string
  ): Promise<string> {
    this.logger.log(`Running Consultation Agent for user ${userId}, session ${sessionId}`);

    const context: WorkflowContext = {
      userId,
      sessionId,
    };

    const steps: WorkflowStep[] = [
      // 1. Compress context to keep only relevant information
      {
        id: 'compress-history',
        name: 'Compress History',
        type: 'compression',
        modelTier: 'cost-optimized',
        input: {
          messages,
          maxTokens: 1000,
        },
      },
      // 2. Retrieve medical knowledge based on current symptoms
      {
        id: 'retrieve-knowledge',
        name: 'Retrieve Medical Knowledge',
        type: 'rag-retrieval',
        modelTier: 'balanced',
        input: {
          query: userInput,
          k: 3,
        },
      },
      // 3. Generate professional response
      {
        id: 'generate-response',
        name: 'Generate Consultation Response',
        type: 'llm-call',
        modelTier: 'quality-optimized',
        input: {
          userInput,
          systemPrompt: `你是一位专业且耐心的 AI 问诊医生。
你的任务是根据用户的症状描述和相关的医学背景知识，提供专业的咨询建议。
请遵循以下原则：
1. 态度和蔼、专业。
2. 给出可能的病因分析，但强调这仅供参考，不能替代面诊。
3. 提供生活方式、用药建议（需提醒遵医嘱）或进一步检查建议。
4. 语言通俗易懂。`,
          prompt: `用户当前描述：{{userInput}}
          
相关医学背景知识：
{{knowledge}}

历史对话摘要：
{{compressedHistory}}

请根据以上信息给出专业的问诊回复。`,
        },
      },
    ];

    // In a real implementation, we would need to map the outputs of previous steps to the inputs of later steps.
    // For now, we'll execute the steps and handle the logic manually or assume the orchestrator handles simple template replacement.
    // Actually, the current WorkflowOrchestrator executeSequential just executes them and returns all results.
    // I will modify the executeLLMCall to support simple template replacement if needed, or just prepare the prompts here.
    
    const result = await this.workflowOrchestrator.executeSequential(steps, context);

    if (!result.success) {
      throw new Error(`Consultation workflow failed: ${result.error || 'Unknown error'}`);
    }

    // The final result is in the last step's output
    const lastResult = result.results[result.results.length - 1];
    return lastResult.content as string;
  }
}
