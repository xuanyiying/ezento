import { Injectable, Logger } from '@nestjs/common';
import { AIEngineService } from '../../ai-providers/ai-engine.service';
import { PerformanceMonitorService } from '../../ai-providers/monitoring/performance-monitor.service';
import { RedisService } from '../../redis/redis.service';
import { RAGService } from '../services/rag.service';
import { ContextCompressorService } from '../services/context-compressor.service';
import {
  WorkflowStep,
  WorkflowContext,
  WorkflowResult,
} from './workflow.interfaces';

/**
 * Workflow Orchestrator
 * Manages complex Agent workflows with sequential, parallel, and conditional execution
 * Validates: Requirements 8.1, 8.2, 8.3, 8.4, 8.5
 */
@Injectable()
export class WorkflowOrchestrator {
  private readonly logger = new Logger(WorkflowOrchestrator.name);
  private readonly CACHE_TTL = 3600; // 1 hour

  constructor(
    private aiEngineService: AIEngineService,
    private performanceMonitor: PerformanceMonitorService,
    private redisService: RedisService,
    private ragService: RAGService,
    private compressorService: ContextCompressorService
  ) {}

  /**
   * Execute workflow steps sequentially
   * Property 31: Workflow Step Logging
   * Validates: Requirements 8.1, 8.3, 7.6
   */
  async executeSequential(
    steps: WorkflowStep[],
    context: WorkflowContext
  ): Promise<WorkflowResult> {
    const startTime = Date.now();
    const results: Record<string, unknown>[] = [];
    const tokenUsageByStep: Record<string, number> = {};
    let totalTokens = 0;

    for (const step of steps) {
      try {
        this.logger.debug(
          `Executing step: ${step.id} (${step.name}) in sequential mode`
        );

        const stepStartTime = Date.now();

        // Check cache for intermediate results
        const cachedResult = await this.getIntermediateResult(
          context.sessionId,
          step.id
        );
        if (cachedResult) {
          this.logger.debug(`Cache hit for step: ${step.id}`);
          results.push(cachedResult);
          tokenUsageByStep[step.id] = 0; // No tokens used for cached result
          continue;
        }

        // Execute the step
        const stepResult = await this.executeStep(step, context, results);
        results.push(stepResult);

        // Record step metrics
        const stepDuration = Date.now() - stepStartTime;
        const stepTokens =
          (stepResult as Record<string, unknown>).tokenUsage || 0;
        tokenUsageByStep[step.id] = stepTokens as number;
        totalTokens += stepTokens as number;

        // Update step with execution metrics
        step.latency = stepDuration;
        step.tokenUsage = stepTokens as number;
        step.output = stepResult;

        // Cache intermediate result
        await this.cacheIntermediateResult(
          context.sessionId,
          step.id,
          stepResult
        );

        // Log step execution
        this.logStepExecution(
          step,
          stepDuration,
          stepTokens as number,
          'success'
        );
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : String(error);
        this.logger.error(`Step ${step.id} failed: ${errorMessage}`);

        // Handle step error with fallback
        const fallbackResult = await this.handleStepError(step, error);
        results.push(fallbackResult);

        step.error = errorMessage;
        step.output = fallbackResult;

        // Log step execution failure
        this.logStepExecution(step, 0, 0, 'failed', errorMessage);
      }
    }

    const duration = Date.now() - startTime;

    return {
      success: results.length === steps.length && !steps.some((s) => s.error),
      results,
      tokenUsage: {
        total: totalTokens,
        byStep: tokenUsageByStep,
      },
      duration,
    };
  }

  /**
   * Execute workflow steps in parallel
   * Property 31: Workflow Step Logging
   * Validates: Requirements 8.1
   */
  async executeParallel(
    steps: WorkflowStep[],
    context: WorkflowContext
  ): Promise<WorkflowResult> {
    const startTime = Date.now();
    const tokenUsageByStep: Record<string, number> = {};

    this.logger.debug(`Executing ${steps.length} steps in parallel mode`);

    // Execute all steps concurrently
    const promises = steps.map((step) =>
      this.executeStep(step, context, []).catch((error) =>
        this.handleStepError(step, error)
      )
    );

    const settledResults = await Promise.allSettled(promises);

    const results: (Record<string, unknown> | null)[] = [];
    let totalTokens = 0;

    for (let i = 0; i < settledResults.length; i++) {
      const settled = settledResults[i];
      const step = steps[i];

      if (settled.status === 'fulfilled') {
        results.push(settled.value);
        const stepTokens =
          (settled.value as Record<string, unknown>).tokenUsage || 0;
        tokenUsageByStep[step.id] = stepTokens as number;
        totalTokens += stepTokens as number;

        step.output = settled.value;
        step.tokenUsage = stepTokens as number;

        this.logStepExecution(step, 0, stepTokens as number, 'success');
      } else {
        const errorMessage =
          settled.reason instanceof Error
            ? settled.reason.message
            : String(settled.reason);
        results.push(null);
        step.error = errorMessage;

        this.logStepExecution(step, 0, 0, 'failed', errorMessage);
      }
    }

    const duration = Date.now() - startTime;

    return {
      success: settledResults.every((r) => r.status === 'fulfilled'),
      results,
      tokenUsage: {
        total: totalTokens,
        byStep: tokenUsageByStep,
      },
      duration,
    };
  }

  /**
   * Execute workflow with conditional branching
   * Property 31: Workflow Step Logging
   * Validates: Requirements 8.1, 8.2
   */
  async executeConditional(
    condition: (context: WorkflowContext) => boolean,
    trueBranch: WorkflowStep[],
    falseBranch: WorkflowStep[],
    context: WorkflowContext
  ): Promise<WorkflowResult> {
    this.logger.debug('Executing conditional workflow');

    const shouldExecuteTrueBranch = condition(context);
    const selectedBranch = shouldExecuteTrueBranch ? trueBranch : falseBranch;

    this.logger.debug(
      `Condition evaluated to ${shouldExecuteTrueBranch}, executing ${selectedBranch.length} steps`
    );

    return this.executeSequential(selectedBranch, context);
  }

  /**
   * Execute a single workflow step
   * Property 31: Workflow Step Logging
   * Validates: Requirements 8.4
   */
  private async executeStep(
    step: WorkflowStep,
    context: WorkflowContext,
    previousResults: Record<string, unknown>[]
  ): Promise<Record<string, unknown>> {
    switch (step.type) {
      case 'llm-call':
        return this.executeLLMCall(step, context, previousResults);
      case 'tool-use':
        return this.executeToolUse(step, context, previousResults);
      case 'rag-retrieval':
        return this.executeRAGRetrieval(step, context);
      case 'compression':
        return this.executeCompression(step, context, previousResults);
      default:
        throw new Error(`Unknown step type: ${step.type}`);
    }
  }

  /**
   * Execute LLM call step
   * Validates: Requirements 8.1
   */
  private async executeLLMCall(
    step: WorkflowStep,
    context: WorkflowContext,
    previousResults: Record<string, unknown>[] = []
  ): Promise<Record<string, unknown>> {
    let { prompt, temperature, maxTokens, systemPrompt } = step.input as Record<
      string,
      unknown
    >;

    // Simple template replacement from previous results
    if (typeof prompt === 'string') {
      previousResults.forEach((res, index) => {
        // Support replacement by step ID or index
        const prefix = `step_${index}_`;
        Object.entries(res).forEach(([key, value]) => {
          if (typeof value === 'string' || typeof value === 'number') {
            const search = `{{${prefix}${key}}}`;
            prompt = (prompt as string).replace(new RegExp(search, 'g'), String(value));
          }
        });
      });

      // Special handling for RAG and Compression common outputs
      previousResults.forEach((res) => {
        if (res.documents && Array.isArray(res.documents)) {
          const docsStr = (res.documents as any[])
            .map((d) => d.content)
            .join('\n\n');
          prompt = (prompt as string).replace(/{{knowledge}}/g, docsStr);
        }
        if (res.summary && typeof res.summary === 'string') {
          prompt = (prompt as string).replace(/{{compressedHistory}}/g, res.summary);
        }
      });

      // User input replacement if available in step input
      if (step.input.userInput) {
        prompt = (prompt as string).replace(/{{userInput}}/g, String(step.input.userInput));
      }
      if (step.input.reportData) {
        prompt = (prompt as string).replace(/{{reportData}}/g, String(step.input.reportData));
      }
      if (step.input.symptoms) {
        prompt = (prompt as string).replace(/{{symptoms}}/g, String(step.input.symptoms));
      }
    }

    const response = await this.aiEngineService.call(
      {
        model: '',
        prompt: prompt as string,
        systemPrompt: systemPrompt as string,
        temperature: (temperature as number) || 0.7,
        maxTokens: (maxTokens as number) || 1000,
      },
      context.userId,
      this.mapModelTierToScenario(step.modelTier)
    );

    return {
      content: response.content,
      tokenUsage: response.usage.totalTokens || 0,
    };
  }

  /**
   * Execute tool use step
   * Validates: Requirements 8.1
   */
  private async executeToolUse(
    step: WorkflowStep,
    _context: WorkflowContext,
    _previousResults: Record<string, unknown>[]
  ): Promise<Record<string, unknown>> {
    const { toolName, toolInput } = step.input;

    // TODO: Implement actual tool registry and execution
    this.logger.debug(`Executing tool: ${toolName} with input:`, toolInput);

    return {
      result: `Tool ${toolName} executed`,
      tokenUsage: 0,
    };
  }

  /**
   * Execute RAG retrieval step
   * Validates: Requirements 8.1
   */
  private async executeRAGRetrieval(
    step: WorkflowStep,
    _context: WorkflowContext
  ): Promise<Record<string, unknown>> {
    const { query, k } = step.input;

    this.logger.debug(`Executing RAG retrieval for query: ${query}`);

    const documents = await this.ragService.retrieve(query as string, (k as number) || 5);

    return {
      documents,
      tokenUsage: 0,
    };
  }

  /**
   * Execute compression step
   * Validates: Requirements 8.1
   */
  private async executeCompression(
    step: WorkflowStep,
    _context: WorkflowContext,
    _previousResults: Record<string, unknown>[]
  ): Promise<Record<string, unknown>> {
    const { content, messages, maxTokens } = step.input;

    this.logger.debug(`Executing compression step`);

    if (messages) {
      const result = await this.compressorService.compress(messages, (maxTokens as number) || 500);
      return {
        ...result,
        tokenUsage: result.compressedTokens,
      };
    }

    const result = await this.compressorService.compress(
      [{ role: 'user', content: content as string }],
      (maxTokens as number) || 500
    );

    return {
      ...result,
      tokenUsage: result.compressedTokens,
    };
  }

  /**
   * Map model tier to scenario type for AIEngineService
   */
  private mapModelTierToScenario(
    modelTier: 'cost-optimized' | 'balanced' | 'quality-optimized'
  ): string {
    switch (modelTier) {
      case 'cost-optimized':
        return 'medical-assistant';
      case 'balanced':
        return 'medical-general';
      case 'quality-optimized':
        return 'medical-expert';
      default:
        return 'medical-general';
    }
  }

  /**
   * Log step execution metrics
   */
  private logStepExecution(
    step: WorkflowStep,
    duration: number,
    tokenUsage: number,
    status: 'success' | 'failed' | string,
    error?: string
  ): void {
    const logData = {
      stepId: step.id,
      stepName: step.name,
      stepType: step.type,
      modelTier: step.modelTier,
      duration,
      tokenUsage,
      status,
      error,
    };

    if (status === 'success') {
      this.logger.debug(`Step execution completed: ${JSON.stringify(logData)}`);
    } else {
      this.logger.error(`Step execution failed: ${JSON.stringify(logData)}`);
    }

    // Report metrics to performance monitor for LLM calls
    if (step.type === 'llm-call') {
      this.performanceMonitor.recordMetrics(
        `workflow-step-${step.id}`,
        'orchestrator',
        duration,
        status === 'success'
      );
    }
  }

  /**
   * Handle step error with fallback strategy
   */
  private async handleStepError(
    step: WorkflowStep,
    error: any
  ): Promise<Record<string, unknown>> {
    this.logger.warn(`Step ${step.id} failed, applying fallback if available`);

    if (step.fallback) {
      try {
        this.logger.log(`Executing fallback for step ${step.id}`);
        // Simple fallback mechanism - can be extended
        return {
          content: step.fallback,
          isFallback: true,
          error: error instanceof Error ? error.message : String(error),
        };
      } catch (fallbackError) {
        this.logger.error(`Fallback failed for step ${step.id}`);
      }
    }

    // Default error response if no fallback
    return {
      error: error instanceof Error ? error.message : String(error),
      success: false,
    };
  }

  /**
   * Cache intermediate result in Redis
   */
  private async cacheIntermediateResult(
    sessionId: string,
    stepId: string,
    result: Record<string, unknown>
  ): Promise<void> {
    const key = `workflow:cache:${sessionId}:${stepId}`;
    try {
      await this.redisService.set(key, JSON.stringify(result), this.CACHE_TTL);
    } catch (error) {
      this.logger.warn(`Failed to cache intermediate result: ${error.message}`);
    }
  }

  /**
   * Get intermediate result from Redis cache
   */
  private async getIntermediateResult(
    sessionId: string,
    stepId: string
  ): Promise<Record<string, unknown> | null> {
    const key = `workflow:cache:${sessionId}:${stepId}`;
    try {
      const cached = await this.redisService.get(key);
      return cached ? JSON.parse(cached as string) : null;
    } catch (error) {
      this.logger.warn(`Failed to get cached result: ${error.message}`);
      return null;
    }
  }
}
