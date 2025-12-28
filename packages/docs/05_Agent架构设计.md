# Agent 架构设计模式

## 一、什么是 AI Agent？

### 1.1 定义

**AI Agent** = LLM + 记忆 + 规划 + 工具

```
传统LLM调用:
用户输入 → LLM → 输出

AI Agent:
用户输入 → Agent决策 → 调用工具 → 观察结果 → 继续决策 → 输出
```

### 1.2 核心特征

```typescript
interface AIAgent {
  // 1. 感知（Perception）
  perceive(input: string): Context;

  // 2. 决策（Decision）
  decide(context: Context): Action;

  // 3. 执行（Action）
  execute(action: Action): Result;

  // 4. 学习（Learning）
  learn(result: Result): void;
}
```

---

## 二、Agent 架构模式

### 2.1 ReAct 模式（Reasoning + Acting）

**原理**: 思考 → 行动 → 观察 → 思考 → ...

```typescript
export class ReActAgent {
  async run(task: string) {
    let thought = "";
    let action = "";
    let observation = "";
    let finalAnswer = "";

    for (let step = 0; step < this.maxSteps; step++) {
      // 1. 思考（Reasoning）
      thought = await this.think(task, observation);

      // 2. 决定行动（Acting）
      action = this.parseAction(thought);

      if (action.type === "Final Answer") {
        finalAnswer = action.content;
        break;
      }

      // 3. 执行工具（Observation）
      observation = await this.executeTool(action);

      // 4. 记录历史
      this.history.push({ thought, action, observation });
    }

    return finalAnswer;
  }

  private async think(task: string, observation: string) {
    const prompt = `
任务: ${task}

你可以使用以下工具:
${this.tools.map((t) => `- ${t.name}: ${t.description}`).join("\n")}

之前的观察: ${observation}

请按以下格式思考:
Thought: 我需要做什么？
Action: 工具名称
Action Input: 工具输入
或者
Thought: 我已经知道答案了
Final Answer: 最终答案

开始:
`;

    return await this.llm.call(prompt);
  }

  private parseAction(thought: string) {
    // 解析LLM输出的Action
    const actionMatch = thought.match(/Action: (.+)/);
    const inputMatch = thought.match(/Action Input: (.+)/);
    const finalMatch = thought.match(/Final Answer: (.+)/);

    if (finalMatch) {
      return { type: "Final Answer", content: finalMatch[1] };
    }

    return {
      type: "Tool",
      tool: actionMatch[1],
      input: inputMatch[1],
    };
  }

  private async executeTool(action: any) {
    const tool = this.tools.find((t) => t.name === action.tool);
    if (!tool) {
      return `错误: 工具 ${action.tool} 不存在`;
    }

    try {
      return await tool.execute(action.input);
    } catch (error) {
      return `错误: ${error.message}`;
    }
  }
}
```

**示例执行流程**:

```
Task: 计算 (25 + 37) * 2 的结果

Step 1:
Thought: 我需要先计算 25 + 37
Action: Calculator
Action Input: 25 + 37
Observation: 62

Step 2:
Thought: 现在我需要计算 62 * 2
Action: Calculator
Action Input: 62 * 2
Observation: 124

Step 3:
Thought: 我已经得到最终答案
Final Answer: 124
```

### 2.2 Plan-and-Execute 模式

**原理**: 先规划整体步骤，再逐步执行

```typescript
export class PlanAndExecuteAgent {
  async run(task: string) {
    // 1. 规划阶段
    const plan = await this.plan(task);
    console.log("执行计划:", plan);

    // 2. 执行阶段
    const results = [];
    for (const step of plan.steps) {
      const result = await this.executeStep(step, results);
      results.push(result);

      // 动态调整计划
      if (result.needReplan) {
        plan = await this.replan(task, results);
      }
    }

    // 3. 总结阶段
    return await this.summarize(task, results);
  }

  private async plan(task: string) {
    const prompt = `
任务: ${task}

可用工具:
${this.tools.map((t) => `- ${t.name}: ${t.description}`).join("\n")}

请制定详细的执行计划，以JSON格式输出:
{
  "steps": [
    {
      "id": 1,
      "description": "步骤描述",
      "tool": "工具名称",
      "input": "工具输入",
      "expectedOutput": "预期输出"
    }
  ]
}
`;

    const response = await this.llm.call(prompt);
    return JSON.parse(response);
  }

  private async executeStep(step: any, previousResults: any[]) {
    console.log(`执行步骤 ${step.id}: ${step.description}`);

    const tool = this.tools.find((t) => t.name === step.tool);
    const result = await tool.execute(step.input);

    return {
      stepId: step.id,
      result,
      success: true,
    };
  }

  private async replan(task: string, results: any[]) {
    const prompt = `
原始任务: ${task}

已完成的步骤:
${results.map((r) => `步骤${r.stepId}: ${r.result}`).join("\n")}

请重新规划剩余步骤:
`;

    const response = await this.llm.call(prompt);
    return JSON.parse(response);
  }
}
```

**适用场景**: 复杂任务、多步骤流程

### 2.3 Multi-Agent 协作模式

**原理**: 多个专门化 Agent 协作完成任务

```typescript
// 我们项目中的实现
export class MultiAgentSystem {
  private agents: {
    strategist: StrategistAgent; // 策略分析
    roleplay: RolePlayAgent; // 对话管理
    feedback: PitchPerfectAgent; // 反馈优化
  };

  async consultPatient(symptoms: string) {
    // 1. 策略Agent分析症状
    const analysis = await this.agents.strategist.analyze({
      symptoms,
      patientHistory: await this.getPatientHistory(),
    });

    // 2. 对话Agent进行问诊
    const conversation = await this.agents.roleplay.conduct({
      initialAnalysis: analysis,
      questionBank: analysis.questions,
    });

    // 3. 反馈Agent优化建议
    const finalAdvice = await this.agents.feedback.optimize({
      conversation,
      analysis,
    });

    return finalAdvice;
  }
}

// 策略Agent
export class StrategistAgent {
  async analyze(input: { symptoms: string; patientHistory: any }) {
    // 1. RAG检索相关知识
    const knowledge = await this.ragService.retrieve(input.symptoms);

    // 2. 分析症状
    const analysis = await this.llm.call(`
基于以下信息分析患者情况:

症状: ${input.symptoms}
病史: ${JSON.stringify(input.patientHistory)}
医学知识: ${knowledge}

请输出:
1. 症状分析
2. 可能的疾病
3. 需要询问的问题
4. 建议的检查
`);

    return this.parseAnalysis(analysis);
  }
}

// 对话Agent
export class RolePlayAgent {
  private conversationState: ConversationState;

  async conduct(input: { initialAnalysis: any; questionBank: string[] }) {
    this.conversationState = {
      questions: input.questionBank,
      askedQuestions: [],
      answers: [],
      currentQuestion: 0,
    };

    while (!this.isComplete()) {
      const question = this.getNextQuestion();
      const answer = await this.askQuestion(question);

      this.conversationState.askedQuestions.push(question);
      this.conversationState.answers.push(answer);

      // 动态调整问题
      if (this.needsFollowUp(answer)) {
        const followUp = await this.generateFollowUp(answer);
        this.conversationState.questions.push(followUp);
      }
    }

    return this.conversationState;
  }

  private async askQuestion(question: string): Promise<string> {
    // 通过WebSocket发送问题给用户
    this.socket.emit("aiQuestion", { question });

    // 等待用户回答
    return new Promise((resolve) => {
      this.socket.once("userAnswer", (answer) => {
        resolve(answer);
      });
    });
  }
}

// 反馈Agent
export class PitchPerfectAgent {
  async optimize(input: { conversation: any; analysis: any }) {
    const prompt = `
基于以下对话和分析，生成最终的健康建议:

初步分析: ${JSON.stringify(input.analysis)}
对话记录: ${JSON.stringify(input.conversation)}

请生成:
1. 综合诊断意见
2. 详细的健康建议
3. 生活方式调整
4. 就医建议

要求:
- 专业、准确、易懂
- 考虑患者的具体情况
- 给出可操作的建议
`;

    const advice = await this.llm.call(prompt);
    return this.formatAdvice(advice);
  }
}
```

---

## 三、Agent 工具设计

### 3.1 工具接口

```typescript
interface Tool {
  name: string;
  description: string;
  inputSchema: JSONSchema;
  execute(input: any): Promise<any>;
}

// 示例: 症状分析工具
export class SymptomAnalyzerTool implements Tool {
  name = "symptom_analyzer";
  description = "分析患者症状，返回可能的疾病列表";
  inputSchema = {
    type: "object",
    properties: {
      symptoms: {
        type: "array",
        items: { type: "string" },
        description: "症状列表",
      },
      duration: {
        type: "string",
        description: "持续时间",
      },
    },
    required: ["symptoms"],
  };

  async execute(input: { symptoms: string[]; duration?: string }) {
    // 1. RAG检索
    const knowledge = await this.ragService.retrieve(input.symptoms.join(" "));

    // 2. LLM分析
    const analysis = await this.llm.call(`
症状: ${input.symptoms.join("、")}
持续时间: ${input.duration || "未知"}

相关知识:
${knowledge}

请分析可能的疾病，以JSON格式输出:
{
  "diseases": [
    {
      "name": "疾病名称",
      "probability": "高|中|低",
      "reasoning": "判断依据"
    }
  ]
}
`);

    return JSON.parse(analysis);
  }
}

// 示例: 药物查询工具
export class DrugCheckerTool implements Tool {
  name = "drug_checker";
  description = "查询药物信息、用法用量、副作用";
  inputSchema = {
    type: "object",
    properties: {
      drugName: {
        type: "string",
        description: "药物名称",
      },
    },
    required: ["drugName"],
  };

  async execute(input: { drugName: string }) {
    // 查询药物数据库
    const drug = await this.prisma.drug.findFirst({
      where: {
        name: { contains: input.drugName },
      },
    });

    if (!drug) {
      return { error: "未找到该药物" };
    }

    return {
      name: drug.name,
      usage: drug.usage,
      dosage: drug.dosage,
      sideEffects: drug.sideEffects,
      contraindications: drug.contraindications,
    };
  }
}
```

### 3.2 工具注册与管理

```typescript
export class ToolRegistry {
  private tools: Map<string, Tool> = new Map();

  register(tool: Tool) {
    this.tools.set(tool.name, tool);
    console.log(`工具已注册: ${tool.name}`);
  }

  get(name: string): Tool | undefined {
    return this.tools.get(name);
  }

  list(): Tool[] {
    return Array.from(this.tools.values());
  }

  // 生成工具描述（给LLM看的）
  getToolDescriptions(): string {
    return this.list()
      .map((tool) => `${tool.name}: ${tool.description}`)
      .join("\n");
  }

  // 验证工具输入
  validateInput(toolName: string, input: any): boolean {
    const tool = this.get(toolName);
    if (!tool) return false;

    // 使用JSON Schema验证
    const ajv = new Ajv();
    const validate = ajv.compile(tool.inputSchema);
    return validate(input);
  }
}

// 使用
const registry = new ToolRegistry();
registry.register(new SymptomAnalyzerTool());
registry.register(new DrugCheckerTool());
registry.register(new CalculatorTool());
```

---

## 四、Agent 记忆系统

### 4.1 短期记忆（对话历史）

```typescript
export class ShortTermMemory {
  private messages: Message[] = [];
  private maxMessages: number = 10;

  add(role: "user" | "assistant", content: string) {
    this.messages.push({
      role,
      content,
      timestamp: new Date(),
    });

    // 保持最近N条消息
    if (this.messages.length > this.maxMessages) {
      this.messages = this.messages.slice(-this.maxMessages);
    }
  }

  getContext(): string {
    return this.messages.map((m) => `${m.role}: ${m.content}`).join("\n");
  }

  clear() {
    this.messages = [];
  }
}
```

### 4.2 长期记忆（向量存储）

```typescript
export class LongTermMemory {
  private vectorStore: Chroma;

  async remember(content: string, metadata: any) {
    await this.vectorStore.addDocuments([
      {
        pageContent: content,
        metadata: {
          ...metadata,
          timestamp: new Date().toISOString(),
        },
      },
    ]);
  }

  async recall(query: string, k: number = 5) {
    return await this.vectorStore.similaritySearch(query, k);
  }

  // 记住重要信息
  async rememberImportant(conversation: Message[]) {
    // 提取关键信息
    const summary = await this.llm.call(`
总结以下对话中的关键信息:
${conversation.map((m) => `${m.role}: ${m.content}`).join("\n")}

提取:
- 患者基本信息
- 主要症状
- 重要病史
- 诊断结论
`);

    await this.remember(summary, {
      type: "consultation",
      date: new Date(),
    });
  }
}
```

### 4.3 工作记忆（任务状态）

```typescript
export class WorkingMemory {
  private state: Map<string, any> = new Map();

  set(key: string, value: any) {
    this.state.set(key, value);
  }

  get(key: string): any {
    return this.state.get(key);
  }

  has(key: string): boolean {
    return this.state.has(key);
  }

  // 保存任务进度
  saveProgress(taskId: string, progress: any) {
    this.set(`task:${taskId}:progress`, progress);
  }

  // 恢复任务
  loadProgress(taskId: string): any {
    return this.get(`task:${taskId}:progress`);
  }
}
```

---

## 五、Workflow 编排

### 5.1 WorkflowOrchestrator

```typescript
export class WorkflowOrchestrator {
  async execute(workflow: Workflow, input: any) {
    const context = { input, results: {} };

    for (const step of workflow.steps) {
      console.log(`执行步骤: ${step.name}`);

      try {
        // 执行步骤
        const result = await this.executeStep(step, context);
        context.results[step.id] = result;

        // 检查条件
        if (
          step.condition &&
          !this.evaluateCondition(step.condition, context)
        ) {
          console.log(`跳过后续步骤: 条件不满足`);
          break;
        }

        // 缓存结果
        if (step.cacheable) {
          await this.cacheResult(step.id, result);
        }
      } catch (error) {
        // 错误处理
        if (step.onError === "continue") {
          console.warn(`步骤失败但继续: ${error.message}`);
          continue;
        } else if (step.onError === "retry") {
          const result = await this.retryStep(step, context);
          context.results[step.id] = result;
        } else {
          throw error;
        }
      }
    }

    return context.results;
  }

  private async executeStep(step: WorkflowStep, context: any) {
    switch (step.type) {
      case "agent":
        return await this.executeAgent(step, context);
      case "tool":
        return await this.executeTool(step, context);
      case "llm":
        return await this.executeLLM(step, context);
      case "parallel":
        return await this.executeParallel(step, context);
      default:
        throw new Error(`未知步骤类型: ${step.type}`);
    }
  }

  private async executeParallel(step: WorkflowStep, context: any) {
    const tasks = step.tasks.map((task) => this.executeStep(task, context));
    return await Promise.all(tasks);
  }

  private async retryStep(step: WorkflowStep, context: any) {
    const maxRetries = step.maxRetries || 3;
    let lastError;

    for (let i = 0; i < maxRetries; i++) {
      try {
        return await this.executeStep(step, context);
      } catch (error) {
        lastError = error;
        await this.sleep(1000 * Math.pow(2, i)); // 指数退避
      }
    }

    throw lastError;
  }
}
```

### 5.2 Workflow 定义

```typescript
const consultationWorkflow: Workflow = {
  name: "医疗问诊流程",
  steps: [
    {
      id: "extract_symptoms",
      name: "提取症状",
      type: "llm",
      prompt: "从用户描述中提取症状...",
      cacheable: true,
    },
    {
      id: "retrieve_knowledge",
      name: "检索知识",
      type: "tool",
      tool: "rag_retriever",
      input: "${results.extract_symptoms.symptoms}",
      cacheable: true,
    },
    {
      id: "analyze_parallel",
      name: "并行分析",
      type: "parallel",
      tasks: [
        {
          id: "analyze_severity",
          name: "分析严重程度",
          type: "agent",
          agent: "severity_analyzer",
        },
        {
          id: "check_drugs",
          name: "检查药物",
          type: "tool",
          tool: "drug_checker",
        },
      ],
    },
    {
      id: "generate_advice",
      name: "生成建议",
      type: "agent",
      agent: "advice_generator",
      input: {
        symptoms: "${results.extract_symptoms}",
        knowledge: "${results.retrieve_knowledge}",
        severity: "${results.analyze_parallel[0]}",
        drugs: "${results.analyze_parallel[1]}",
      },
    },
  ],
};
```

---

## 六、面试高频问题

**Q: Agent 和普通 LLM 调用有什么区别？**

A: "核心区别是自主性和工具使用:

**普通 LLM**:

- 单次调用，输入 → 输出
- 无状态，不记忆
- 不能调用外部工具

**Agent**:

- 多步推理，可以循环决策
- 有记忆，保持上下文
- 可以调用工具获取信息

**举例**:

- LLM: '北京天气怎么样？' → '我不知道实时天气'
- Agent: '北京天气怎么样？' → 调用天气 API → '北京今天晴，25°C'

在我们项目中，Agent 可以:

1. 调用 RAG 检索医学知识
2. 查询药物数据库
3. 分析病历记录
4. 多轮对话收集信息"

**Q: 如何设计 Agent 的工具？**

A: "我遵循三个原则:

1. **原子化**: 每个工具只做一件事

   - ✅ symptom_analyzer: 分析症状
   - ❌ medical_assistant: 做所有事情

2. **标准化**: 统一的接口

   ```typescript
   interface Tool {
     name: string;
     description: string; // 给LLM看的
     inputSchema: JSONSchema; // 输入验证
     execute(input): Promise<output>;
   }
   ```

3. **可组合**: 工具可以互相调用
   - symptom_analyzer 调用 rag_retriever
   - advice_generator 调用 drug_checker

**效果**: 我们有 20+工具，Agent 可以灵活组合使用。"

**Q: Multi-Agent 协作怎么实现？**

A: "我们用了专门化+协作的模式:

**三个专门化 Agent**:

1. StrategistAgent: 策略分析，制定问诊计划
2. RolePlayAgent: 对话管理，多轮问诊
3. PitchPerfectAgent: 反馈优化，生成最终建议

**协作机制**:

```
用户输入
  ↓
StrategistAgent分析 → 生成问题列表
  ↓
RolePlayAgent问诊 → 收集详细信息
  ↓
PitchPerfectAgent优化 → 输出最终建议
```

**优势**:

- 每个 Agent 专注自己的领域
- 可以独立优化和测试
- 易于扩展新 Agent

**效果**: 问诊准确率 85%，用户满意度 4.5/5.0"
