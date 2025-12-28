import { Injectable, Logger } from '@nestjs/common';
import { WorkflowOrchestrator } from '../workflows/workflow.orchestrator';

@Injectable()
export class DemoAgent {
    private readonly logger = new Logger(DemoAgent.name);

    constructor(private readonly workflowOrchestrator: WorkflowOrchestrator) { }

    async runDemo(input: string): Promise<string> {
        this.logger.log(`Running Demo Agent with input: ${input}`);
        // Example usage of workflow orchestrator
        // In a real agent, this would be more complex
        return `Processed: ${input}`;
    }
}
