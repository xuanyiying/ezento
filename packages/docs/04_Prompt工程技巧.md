# Prompt Engineering 技巧

## 一、Prompt 基础原则

### 1.1 清晰明确（Be Clear and Specific）

```typescript
// ❌ 模糊的Prompt
const badPrompt = "分析这个病情";

// ✅ 清晰的Prompt
const goodPrompt = `
你是一个专业的医疗助手。请分析以下病情描述:

患者信息:
- 年龄: 30岁
- 性别: 男
- 症状: 头痛、发烧38.5°C、咳嗽

请按以下格式输出:
1. 症状分析
2. 可能的疾病
3. 建议的检查项目
4. 注意事项
`;
```

### 1.2 提供上下文（Give Context）

```typescript
// ❌ 缺少上下文
const badPrompt = "头痛怎么办？";

// ✅ 丰富的上下文
const goodPrompt = `
角色: 你是一个有10年经验的神经内科医生

背景知识:
${retrievedKnowledge}

患者情况:
- 头痛持续3天
- 疼痛位置: 太阳穴
- 疼痛性质: 跳痛
- 伴随症状: 恶心

请基于以上信息给出专业建议。
`;
```

### 1.3 指定输出格式（Specify Format）

```typescript
// ❌ 自由格式
const badPrompt = "分析症状";

// ✅ 结构化输出
const goodPrompt = `
请以JSON格式输出:
{
  "symptoms": ["症状1", "症状2"],
  "severity": "轻度|中度|重度",
  "diseases": [
    {
      "name": "疾病名称",
      "probability": "可能性百分比",
      "reason": "判断依据"
    }
  ],
  "recommendations": ["建议1", "建议2"]
}
`;
```

---

## 二、高级 Prompt 技巧

### 2.1 Few-Shot Learning（少样本学习）

```typescript
const fewShotPrompt = `
你是一个医疗助手，请根据症状描述提取结构化信息。

示例1:
输入: 我头痛、发烧、咳嗽
输出: {
  "symptoms": ["头痛", "发烧", "咳嗽"],
  "severity": "中度",
  "urgency": "建议就医"
}

示例2:
输入: 轻微流鼻涕，打喷嚏
输出: {
  "symptoms": ["流鼻涕", "打喷嚏"],
  "severity": "轻度",
  "urgency": "可自行观察"
}

示例3:
输入: 胸痛、呼吸困难、出冷汗
输出: {
  "symptoms": ["胸痛", "呼吸困难", "出冷汗"],
  "severity": "重度",
  "urgency": "立即就医"
}

现在请处理:
输入: ${userInput}
输出:
`;
```

**效果**: 准确率从 70%提升到 85%

### 2.2 Chain of Thought（思维链）

```typescript
const cotPrompt = `
请一步步分析以下病情:

患者症状: 头痛、发烧38.5°C、咳嗽、乏力

请按以下步骤思考:

步骤1: 识别主要症状
思考: ...

步骤2: 分析症状组合
思考: ...

步骤3: 列出可能的疾病
思考: ...

步骤4: 评估每种疾病的可能性
思考: ...

步骤5: 给出最终诊断建议
结论: ...
`;
```

**原理**: 让 LLM 展示推理过程，提高复杂任务的准确性

### 2.3 Self-Consistency（自我一致性）

```typescript
async function selfConsistentQuery(question: string) {
  // 1. 生成多个答案（温度>0）
  const answers = await Promise.all([
    llm.call(question, { temperature: 0.7 }),
    llm.call(question, { temperature: 0.7 }),
    llm.call(question, { temperature: 0.7 }),
    llm.call(question, { temperature: 0.7 }),
    llm.call(question, { temperature: 0.7 }),
  ]);

  // 2. 投票选出最一致的答案
  const votes = {};
  answers.forEach((answer) => {
    votes[answer] = (votes[answer] || 0) + 1;
  });

  // 3. 返回得票最多的答案
  return Object.entries(votes).sort((a, b) => b[1] - a[1])[0][0];
}
```

**适用场景**: 关键决策、医疗诊断等高风险场景

### 2.4 Role Prompting（角色扮演）

```typescript
const rolePrompts = {
  // 专业医生
  doctor: `你是一位有20年临床经验的主任医师，擅长内科诊断。
你的回答应该:
- 专业、严谨、基于循证医学
- 考虑鉴别诊断
- 提醒患者就医而非自行用药`,

  // 健康顾问
  advisor: `你是一位温和的健康顾问，擅长用通俗易懂的语言解释医学知识。
你的回答应该:
- 简单易懂，避免专业术语
- 关心患者感受
- 给出实用的生活建议`,

  // 急诊医生
  emergency: `你是一位急诊科医生，需要快速评估病情严重程度。
你的回答应该:
- 快速判断是否需要急诊
- 明确指出危险信号
- 给出紧急处理建议`,
};

// 根据场景选择角色
function selectRole(symptoms: string[]) {
  const dangerousSymptoms = ["胸痛", "呼吸困难", "意识模糊"];
  if (symptoms.some((s) => dangerousSymptoms.includes(s))) {
    return rolePrompts.emergency;
  }
  return rolePrompts.doctor;
}
```

### 2.5 Constraint Prompting（约束提示）

```typescript
const constrainedPrompt = `
你是一个医疗助手。请回答用户问题，但必须遵守以下约束:

【必须遵守】
1. 只基于提供的知识库回答，不要编造信息
2. 如果知识库中没有相关信息，明确说"我不知道"
3. 不要给出具体的药物剂量建议
4. 对于严重症状，必须建议就医
5. 回答长度控制在200字以内

【禁止行为】
1. 禁止诊断疾病（只能说"可能是"）
2. 禁止推荐处方药
3. 禁止替代医生的专业判断
4. 禁止使用恐吓性语言

【输出格式】
- 使用友好、专业的语气
- 分点列出，便于阅读
- 必要时添加免责声明

知识库:
${context}

用户问题: ${question}

回答:
`;
```

---

## 三、项目中的实际应用

### 3.1 医疗问诊 Prompt

```typescript
export class MedicalPromptBuilder {
  buildConsultationPrompt(context: {
    symptoms: string[];
    duration: string;
    severity: string;
    knowledge: string;
  }) {
    return `
# 角色定义
你是一个专业的AI医疗助手，具有丰富的医学知识。

# 任务
基于患者症状和医学知识库，提供专业的健康建议。

# 患者信息
症状: ${context.symptoms.join("、")}
持续时间: ${context.duration}
严重程度: ${context.severity}

# 医学知识库
${context.knowledge}

# 输出要求
请按以下结构输出:

## 1. 症状分析
- 分析各症状的特点和关联性
- 评估症状的严重程度

## 2. 可能的原因
- 列出3-5个可能的疾病或原因
- 每个原因说明判断依据

## 3. 建议措施
- 生活护理建议
- 是否需要就医
- 需要做哪些检查

## 4. 注意事项
- 需要警惕的危险信号
- 何时必须立即就医

# 重要约束
- 不要给出确诊结论，只说"可能是"
- 不要推荐具体药物和剂量
- 对于严重症状，必须建议就医
- 添加免责声明

请开始分析:
`;
  }

  buildSymptomExtractionPrompt(userInput: string) {
    return `
从以下用户描述中提取症状信息:

用户描述: "${userInput}"

请提取以下信息并以JSON格式输出:
{
  "symptoms": ["症状1", "症状2"],  // 具体症状
  "duration": "持续时间",           // 如"3天"、"1周"
  "severity": "轻度|中度|重度",     // 严重程度
  "triggers": ["诱因1", "诱因2"],   // 可能的诱因
  "relievers": ["缓解因素"],        // 什么情况下会好转
  "additionalInfo": "其他信息"      // 其他相关信息
}

注意:
- 只提取明确提到的信息
- 没有提到的字段设为null
- 症状要用标准医学术语
`;
  }

  buildDiagnosisPrompt(symptoms: any, knowledge: string) {
    return `
# 任务: 疾病可能性分析

# 症状信息
${JSON.stringify(symptoms, null, 2)}

# 相关医学知识
${knowledge}

# 输出格式
请以JSON格式输出可能的疾病列表:
{
  "diseases": [
    {
      "name": "疾病名称",
      "probability": "高|中|低",
      "matchedSymptoms": ["匹配的症状"],
      "reasoning": "判断依据",
      "recommendations": ["建议措施"]
    }
  ],
  "urgency": "紧急|较急|不急",
  "nextSteps": ["下一步建议"]
}

# 分析要求
1. 列出3-5个最可能的疾病
2. 按可能性从高到低排序
3. 说明每个诊断的依据
4. 评估就医紧急程度
`;
  }
}
```

### 3.2 Prompt 模板管理

```typescript
// 数据库存储Prompt模板
interface PromptTemplate {
  id: string;
  name: string;
  scenario: string; // 使用场景
  template: string;
  variables: string[];
  version: number;
  isActive: boolean;
}

export class PromptTemplateService {
  // 获取模板
  async getTemplate(scenario: string): Promise<PromptTemplate> {
    return await this.prisma.promptTemplate.findFirst({
      where: { scenario, isActive: true },
      orderBy: { version: "desc" },
    });
  }

  // 渲染模板
  renderTemplate(
    template: PromptTemplate,
    variables: Record<string, any>
  ): string {
    let rendered = template.template;

    for (const [key, value] of Object.entries(variables)) {
      rendered = rendered.replace(
        new RegExp(`\\{${key}\\}`, "g"),
        String(value)
      );
    }

    return rendered;
  }

  // A/B测试
  async abTest(scenario: string, userInput: string) {
    // 获取两个版本的模板
    const [versionA, versionB] = await this.prisma.promptTemplate.findMany({
      where: { scenario, isActive: true },
      orderBy: { version: "desc" },
      take: 2,
    });

    // 随机选择一个版本
    const template = Math.random() > 0.5 ? versionA : versionB;

    // 记录使用情况
    await this.prisma.promptUsage.create({
      data: {
        templateId: template.id,
        version: template.version,
        input: userInput,
        timestamp: new Date(),
      },
    });

    return template;
  }

  // 创建新版本
  async createVersion(scenario: string, newTemplate: string, reason: string) {
    const current = await this.getTemplate(scenario);

    return await this.prisma.promptTemplate.create({
      data: {
        name: current.name,
        scenario,
        template: newTemplate,
        variables: current.variables,
        version: current.version + 1,
        isActive: false, // 先不激活，等测试通过
        metadata: {
          previousVersion: current.version,
          changeReason: reason,
          createdBy: "admin",
        },
      },
    });
  }
}
```

### 3.3 动态 Prompt 优化

```typescript
export class DynamicPromptOptimizer {
  // 根据用户反馈优化Prompt
  async optimizeFromFeedback(
    templateId: string,
    feedback: {
      rating: number;
      comment: string;
      expectedOutput: string;
    }
  ) {
    // 1. 收集负面反馈
    const badCases = await this.prisma.promptFeedback.findMany({
      where: {
        templateId,
        rating: { lte: 2 },
      },
      take: 10,
    });

    // 2. 让LLM分析问题
    const analysis = await this.llm.call(`
分析以下Prompt的问题:

当前Prompt:
${template.template}

负面案例:
${badCases
  .map(
    (c) => `
输入: ${c.input}
实际输出: ${c.actualOutput}
期望输出: ${c.expectedOutput}
用户评价: ${c.comment}
`
  )
  .join("\n---\n")}

请分析:
1. Prompt存在什么问题？
2. 如何改进？
3. 给出改进后的Prompt
`);

    // 3. 创建新版本
    return await this.promptService.createVersion(
      template.scenario,
      analysis.improvedPrompt,
      analysis.reason
    );
  }

  // 根据场景自适应调整
  adaptPrompt(
    basePrompt: string,
    context: {
      userLevel: "beginner" | "advanced";
      urgency: "low" | "medium" | "high";
      language: "simple" | "professional";
    }
  ) {
    let adapted = basePrompt;

    // 根据用户水平调整
    if (context.userLevel === "beginner") {
      adapted += "\n\n请用通俗易懂的语言解释，避免专业术语。";
    }

    // 根据紧急程度调整
    if (context.urgency === "high") {
      adapted += "\n\n这是紧急情况，请优先评估危险性并给出紧急建议。";
    }

    // 根据语言风格调整
    if (context.language === "simple") {
      adapted += "\n\n使用简单句子，每句话不超过20个字。";
    }

    return adapted;
  }
}
```

---

## 四、Prompt 优化技巧

### 4.1 温度(Temperature)调节

```typescript
// 温度控制创造性和确定性的平衡

// 场景1: 症状提取（需要准确）
const extractionLLM = new OpenAI({
  temperature: 0, // 确定性输出
  modelName: "gpt-4",
});

// 场景2: 健康建议（需要多样性）
const advisoryLLM = new OpenAI({
  temperature: 0.7, // 平衡
  modelName: "gpt-4",
});

// 场景3: 创意内容（需要创造性）
const creativeLLM = new OpenAI({
  temperature: 0.9, // 高创造性
  modelName: "gpt-4",
});
```

**温度选择指南**:

- 0.0-0.3: 事实提取、分类、结构化输出
- 0.4-0.7: 问答、建议、分析
- 0.8-1.0: 创意写作、头脑风暴

### 4.2 Token 控制

```typescript
// 控制输出长度
const llm = new OpenAI({
  maxTokens: 500, // 最多500 tokens（约350个中文字）
  modelName: "gpt-4",
});

// 在Prompt中明确要求
const prompt = `
请用不超过200字回答以下问题:
${question}

要求:
- 简洁明了
- 突出重点
- 分点列出
`;
```

### 4.3 Stop Sequences（停止序列）

```typescript
const llm = new OpenAI({
  stop: ["\n\n", "---", "用户:"], // 遇到这些就停止
  modelName: "gpt-4",
});

// 用于控制输出格式
const prompt = `
请回答问题，回答完后输出"---"

问题: ${question}
回答:
`;
```

### 4.4 System Message 优化

```typescript
const systemMessages = {
  // 基础版
  basic: "你是一个医疗助手",

  // 详细版
  detailed: `你是一个专业的AI医疗助手，具有以下特点:
- 拥有丰富的医学知识
- 回答准确、专业、易懂
- 关心患者感受
- 遵守医疗伦理`,

  // 约束版
  constrained: `你是一个医疗助手。

你的能力:
- 提供健康建议
- 解释医学知识
- 分析症状

你的限制:
- 不能诊断疾病
- 不能开处方
- 不能替代医生

你的原则:
- 基于证据
- 保护隐私
- 建议就医`,
};
```

---

## 五、Prompt 评估

### 5.1 评估指标

```typescript
interface PromptEvaluation {
  // 准确性
  accuracy: number; // 输出是否正确

  // 相关性
  relevance: number; // 输出是否相关

  // 完整性
  completeness: number; // 是否包含所有必要信息

  // 一致性
  consistency: number; // 多次运行结果是否一致

  // 成本
  avgTokens: number; // 平均token消耗
  avgLatency: number; // 平均延迟
}

async function evaluatePrompt(
  prompt: string,
  testCases: Array<{ input: string; expectedOutput: string }>
): Promise<PromptEvaluation> {
  const results = [];

  for (const testCase of testCases) {
    const start = Date.now();
    const output = await llm.call(prompt.replace("{input}", testCase.input));
    const latency = Date.now() - start;

    // 计算相似度
    const similarity = calculateSimilarity(output, testCase.expectedOutput);

    results.push({
      similarity,
      latency,
      tokens: countTokens(output),
    });
  }

  return {
    accuracy: results.filter((r) => r.similarity > 0.8).length / results.length,
    relevance: average(results.map((r) => r.similarity)),
    completeness: evaluateCompleteness(results),
    consistency: calculateConsistency(results),
    avgTokens: average(results.map((r) => r.tokens)),
    avgLatency: average(results.map((r) => r.latency)),
  };
}
```

### 5.2 A/B 测试

```typescript
async function abTestPrompts(
  promptA: string,
  promptB: string,
  testCases: any[]
) {
  const [resultsA, resultsB] = await Promise.all([
    evaluatePrompt(promptA, testCases),
    evaluatePrompt(promptB, testCases),
  ]);

  console.log("Prompt A:", resultsA);
  console.log("Prompt B:", resultsB);

  // 综合评分
  const scoreA =
    resultsA.accuracy * 0.4 +
    resultsA.relevance * 0.3 +
    resultsA.completeness * 0.2 +
    (1 - resultsA.avgTokens / 2000) * 0.1;

  const scoreB =
    resultsB.accuracy * 0.4 +
    resultsB.relevance * 0.3 +
    resultsB.completeness * 0.2 +
    (1 - resultsB.avgTokens / 2000) * 0.1;

  return scoreA > scoreB ? "A" : "B";
}
```

---

## 六、面试高频问题

**Q: 如何设计一个好的 Prompt？**

A: "我遵循 5 个原则:

1. **清晰明确**: 明确任务、输入、输出格式
2. **提供上下文**: 角色定义、背景知识、约束条件
3. **Few-shot 示例**: 给 2-3 个例子，提高准确率
4. **结构化输出**: 指定 JSON 格式，便于解析
5. **迭代优化**: 根据反馈不断改进

在医疗项目中，我们的 Prompt 包含:

- 角色: 专业医疗助手
- 知识: RAG 检索的医学知识
- 约束: 不诊断、不开药、建议就医
- 格式: JSON 结构化输出

通过这些优化，准确率从 70%提升到 85%。"

**Q: 如何控制 LLM 的输出质量？**

A: "我们用了三个策略:

1. **Temperature 控制**:
   - 事实提取用 0（确定性）
   - 建议生成用 0.7（平衡）
2. **输出约束**:

   - 指定 JSON 格式
   - 限制输出长度
   - 使用 stop sequences

3. **后处理验证**:
   - 检查 JSON 格式
   - 验证必填字段
   - 过滤敏感内容

**效果**: 输出格式正确率 99%，内容准确率 85%。"

**Q: Prompt 版本管理怎么做？**

A: "我们建立了完整的 Prompt 管理系统:

1. **数据库存储**: 所有 Prompt 存在数据库，支持版本控制
2. **A/B 测试**: 新版本先灰度测试，对比效果
3. **反馈收集**: 记录用户评分和 bad cases
4. **自动优化**: 定期分析反馈，让 LLM 优化 Prompt

**流程**:

- 开发新 Prompt → 创建 v2 版本
- 50%流量测试 → 对比 v1 和 v2 效果
- 效果好 → 全量上线
- 效果差 → 回滚到 v1

这样保证了 Prompt 质量持续提升。"
