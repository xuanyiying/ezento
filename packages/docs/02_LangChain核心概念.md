# LangChain 核心概念与 API

## 一、LangChain 是什么？

### 1.1 定义

LangChain 是一个用于开发 LLM 应用的框架，提供了标准化的组件和工具链。

### 1.2 核心价值

```
1. 标准化接口: 统一不同LLM的调用方式
2. 可组合性: 像乐高一样组装AI应用
3. 内置工具: RAG、Agent、Memory等开箱即用
4. 生态丰富: 集成100+工具和服务
```

---

## 二、核心组件

### 2.1 Models（模型层）

#### LLMs（大语言模型）

```typescript
import { OpenAI } from "langchain/llms/openai";

const llm = new OpenAI({
  modelName: "gpt-4",
  temperature: 0.7,
  maxTokens: 2000,
  openAIApiKey: process.env.OPENAI_API_KEY,
});

const response = await llm.call("什么是RAG？");
```

#### Chat Models（对话模型）

```typescript
import { ChatOpenAI } from "langchain/chat_models/openai";
import { HumanMessage, SystemMessage } from "langchain/schema";

const chat = new ChatOpenAI({ temperature: 0 });

const messages = [
  new SystemMessage("你是一个医疗助手"),
  new HumanMessage("头痛怎么办？"),
];

const response = await chat.call(messages);
```

#### Embeddings（嵌入模型）

```typescript
import { OpenAIEmbeddings } from "langchain/embeddings/openai";

const embeddings = new OpenAIEmbeddings();

// 单个文本
const vector = await embeddings.embedQuery("头痛");

// 批量文本
const vectors = await embeddings.embedDocuments([
  "头痛的症状",
  "头痛的治疗",
  "头痛的预防",
]);
```

### 2.2 Prompts（提示词模板）

#### PromptTemplate

```typescript
import { PromptTemplate } from "langchain/prompts";

const template = new PromptTemplate({
  template: `你是一个{role}。
  
用户问题: {question}
相关知识: {context}

请基于以上知识回答问题，如果知识中没有相关信息，请说"我不知道"。

回答:`,
  inputVariables: ["role", "question", "context"],
});

const prompt = await template.format({
  role: "医疗助手",
  question: "头痛吃什么药？",
  context: "对乙酰氨基酚可以缓解头痛...",
});
```

#### ChatPromptTemplate

```typescript
import { ChatPromptTemplate } from "langchain/prompts";

const chatPrompt = ChatPromptTemplate.fromMessages([
  ["system", "你是一个{role}"],
  ["human", "{question}"],
  ["ai", "让我基于以下知识回答: {context}"],
]);
```

#### Few-Shot Prompts

```typescript
import { FewShotPromptTemplate } from "langchain/prompts";

const examples = [
  {
    question: "感冒了怎么办？",
    answer: "建议多喝水、休息，必要时服用感冒药。",
  },
  {
    question: "发烧了怎么办？",
    answer: "体温超过38.5°C建议服用退烧药，并及时就医。",
  },
];

const fewShotPrompt = new FewShotPromptTemplate({
  examples,
  examplePrompt: new PromptTemplate({
    template: "Q: {question}\nA: {answer}",
    inputVariables: ["question", "answer"],
  }),
  prefix: "以下是一些医疗咨询的例子:",
  suffix: "Q: {input}\nA:",
  inputVariables: ["input"],
});
```

### 2.3 Chains（链式调用）

#### LLMChain（基础链）

```typescript
import { LLMChain } from "langchain/chains";

const chain = new LLMChain({
  llm,
  prompt: template,
});

const result = await chain.call({
  role: "医疗助手",
  question: "头痛怎么办？",
  context: "...",
});
```

#### Sequential Chain（顺序链）

```typescript
import { SimpleSequentialChain } from "langchain/chains";

// Chain 1: 提取症状
const symptomChain = new LLMChain({
  llm,
  prompt: new PromptTemplate({
    template: "从以下描述中提取症状: {input}",
    inputVariables: ["input"],
  }),
});

// Chain 2: 诊断
const diagnosisChain = new LLMChain({
  llm,
  prompt: new PromptTemplate({
    template: "根据症状{symptoms}，可能的诊断是什么？",
    inputVariables: ["symptoms"],
  }),
});

// 组合
const overallChain = new SimpleSequentialChain({
  chains: [symptomChain, diagnosisChain],
});

const result = await overallChain.run("我头痛、发烧、咳嗽");
```

#### Router Chain（路由链）

```typescript
import { MultiPromptChain } from "langchain/chains";

const promptInfos = [
  {
    name: "内科",
    description: "处理内科相关问题",
    promptTemplate: "作为内科医生，回答: {input}",
  },
  {
    name: "外科",
    description: "处理外科相关问题",
    promptTemplate: "作为外科医生，回答: {input}",
  },
];

const chain = MultiPromptChain.fromPrompts(llm, promptInfos);
const result = await chain.call({ input: "骨折了怎么办？" });
// 自动路由到"外科"
```

### 2.4 Memory（记忆）

#### ConversationBufferMemory（缓冲记忆）

```typescript
import { ConversationBufferMemory } from "langchain/memory";

const memory = new ConversationBufferMemory();

await memory.saveContext({ input: "我叫张三" }, { output: "你好张三！" });

await memory.saveContext(
  { input: "我今年30岁" },
  { output: "知道了，你30岁。" }
);

const history = await memory.loadMemoryVariables({});
console.log(history);
// {
//   history: 'Human: 我叫张三\nAI: 你好张三！\nHuman: 我今年30岁\nAI: 知道了，你30岁。'
// }
```

#### ConversationSummaryMemory（摘要记忆）

```typescript
import { ConversationSummaryMemory } from "langchain/memory";

const memory = new ConversationSummaryMemory({
  llm,
  maxTokenLimit: 1000, // 超过1000 tokens自动摘要
});

// 长对话会被自动压缩成摘要
```

#### VectorStoreMemory（向量记忆）

```typescript
import { VectorStoreRetrieverMemory } from "langchain/memory";

const memory = new VectorStoreRetrieverMemory({
  vectorStoreRetriever: vectorStore.asRetriever(),
  memoryKey: "history",
  inputKey: "input",
  returnDocs: true,
});

// 自动检索相关历史对话
```

### 2.5 Retrievers（检索器）

#### VectorStoreRetriever

```typescript
const retriever = vectorStore.asRetriever({
  searchType: "similarity",
  k: 5, // 返回Top 5
});

const docs = await retriever.getRelevantDocuments("头痛怎么办？");
```

#### MultiQueryRetriever（多查询检索）

```typescript
import { MultiQueryRetriever } from "langchain/retrievers";

// 自动生成多个相关查询，提高召回率
const retriever = MultiQueryRetriever.fromLLM({
  llm,
  retriever: vectorStore.asRetriever(),
  verbose: true,
});

// 输入: "头痛怎么办？"
// 自动生成: ["头痛的治疗方法", "如何缓解头痛", "头痛吃什么药"]
// 分别检索后合并结果
```

#### ContextualCompressionRetriever（压缩检索）

```typescript
import { ContextualCompressionRetriever } from "langchain/retrievers";

// 检索后压缩，只保留相关部分
const compressor = new LLMChainExtractor({ llm });

const retriever = new ContextualCompressionRetriever({
  baseCompressor: compressor,
  baseRetriever: vectorStore.asRetriever(),
});
```

---

## 三、项目中的实际应用

### 3.1 RAG 实现

```typescript
import { RetrievalQAChain } from "langchain/chains";

export class RAGService {
  private chain: RetrievalQAChain;

  async initialize() {
    // 1. 初始化向量存储
    const vectorStore = await Chroma.fromExistingCollection(embeddings, {
      collectionName: "medical_knowledge",
    });

    // 2. 创建检索器
    const retriever = vectorStore.asRetriever({
      searchType: "mmr", // Maximum Marginal Relevance
      k: 5,
    });

    // 3. 创建QA链
    this.chain = RetrievalQAChain.fromLLM(llm, retriever, {
      returnSourceDocuments: true,
      prompt: this.buildPrompt(),
    });
  }

  async query(question: string) {
    const result = await this.chain.call({ query: question });

    return {
      answer: result.text,
      sources: result.sourceDocuments.map((doc) => ({
        content: doc.pageContent,
        metadata: doc.metadata,
      })),
    };
  }

  private buildPrompt() {
    return PromptTemplate.fromTemplate(`
你是一个专业的医疗助手。请基于以下知识回答用户问题。

知识库:
{context}

用户问题: {question}

回答要求:
1. 只基于提供的知识回答
2. 如果知识中没有相关信息，明确说"我不知道"
3. 回答要专业、准确、易懂
4. 必要时提醒用户就医

回答:`);
  }
}
```

### 3.2 Agent 实现

```typescript
import { initializeAgentExecutorWithOptions } from "langchain/agents";
import { Calculator } from "langchain/tools/calculator";
import { SerpAPI } from "langchain/tools";

export class MedicalAgent {
  private agent: AgentExecutor;

  async initialize() {
    // 1. 定义工具
    const tools = [
      new Calculator(), // 计算工具（如BMI计算）
      new SerpAPI(), // 搜索工具
      this.createSymptomAnalyzer(), // 自定义症状分析工具
      this.createDrugChecker(), // 自定义药物查询工具
    ];

    // 2. 创建Agent
    this.agent = await initializeAgentExecutorWithOptions(tools, llm, {
      agentType: "openai-functions",
      verbose: true,
      maxIterations: 5,
    });
  }

  async run(input: string) {
    return await this.agent.call({ input });
  }

  private createSymptomAnalyzer() {
    return new DynamicTool({
      name: "symptom_analyzer",
      description: "分析用户描述的症状，返回可能的疾病",
      func: async (symptoms: string) => {
        // 调用RAG系统
        const result = await this.ragService.query(
          `症状: ${symptoms}，可能的疾病是什么？`
        );
        return result.answer;
      },
    });
  }

  private createDrugChecker() {
    return new DynamicTool({
      name: "drug_checker",
      description: "查询药物信息、用法用量、副作用",
      func: async (drugName: string) => {
        // 查询药物数据库
        const drug = await this.drugService.findByName(drugName);
        return JSON.stringify(drug);
      },
    });
  }
}
```

### 3.3 流式输出

```typescript
import { CallbackManager } from "langchain/callbacks";

export class StreamingService {
  async streamResponse(question: string, onToken: (token: string) => void) {
    const callbackManager = CallbackManager.fromHandlers({
      handleLLMNewToken: async (token: string) => {
        onToken(token); // 实时推送token
      },
    });

    const llm = new ChatOpenAI({
      streaming: true,
      callbackManager,
    });

    await llm.call([new HumanMessage(question)]);
  }
}

// 在WebSocket中使用
socket.on("sendMessage", async (data) => {
  await streamingService.streamResponse(data.content, (token) => {
    socket.emit("aiChunk", { content: token });
  });
  socket.emit("aiComplete");
});
```

---

## 四、高级特性

### 4.1 Output Parsers（输出解析）

```typescript
import { StructuredOutputParser } from "langchain/output_parsers";
import { z } from "zod";

// 定义输出结构
const parser = StructuredOutputParser.fromZodSchema(
  z.object({
    symptoms: z.array(z.string()).describe("提取的症状列表"),
    severity: z.enum(["轻度", "中度", "重度"]).describe("严重程度"),
    recommendation: z.string().describe("建议"),
  })
);

const prompt = new PromptTemplate({
  template: `分析以下病情描述:
{input}

{format_instructions}`,
  inputVariables: ["input"],
  partialVariables: {
    format_instructions: parser.getFormatInstructions(),
  },
});

const chain = new LLMChain({ llm, prompt });
const response = await chain.call({ input: "我头痛、发烧、咳嗽" });
const parsed = await parser.parse(response.text);

console.log(parsed);
// {
//   symptoms: ['头痛', '发烧', '咳嗽'],
//   severity: '中度',
//   recommendation: '建议就医检查'
// }
```

### 4.2 Caching（缓存）

```typescript
import { InMemoryCache } from "langchain/cache";
import { Redis } from "ioredis";

// 内存缓存
const cache = new InMemoryCache();

// Redis缓存
class RedisCache extends BaseCache {
  private redis: Redis;

  constructor() {
    super();
    this.redis = new Redis();
  }

  async lookup(prompt: string, llmKey: string) {
    const key = `llm:${llmKey}:${md5(prompt)}`;
    const cached = await this.redis.get(key);
    return cached ? JSON.parse(cached) : null;
  }

  async update(prompt: string, llmKey: string, value: any) {
    const key = `llm:${llmKey}:${md5(prompt)}`;
    await this.redis.set(key, JSON.stringify(value), "EX", 3600);
  }
}

const llm = new OpenAI({ cache: new RedisCache() });
```

### 4.3 Callbacks（回调）

```typescript
import { BaseCallbackHandler } from "langchain/callbacks";

class CustomCallbackHandler extends BaseCallbackHandler {
  name = "custom_handler";

  async handleLLMStart(llm: any, prompts: string[]) {
    console.log("LLM开始调用", { prompts });
    // 记录到监控系统
    metrics.increment("llm_calls");
  }

  async handleLLMEnd(output: any) {
    console.log("LLM调用结束", { output });
    // 记录token使用量
    metrics.gauge("tokens_used", output.llmOutput.tokenUsage.totalTokens);
  }

  async handleLLMError(err: Error) {
    console.error("LLM调用失败", err);
    // 告警
    alerting.send("LLM调用失败", err.message);
  }

  async handleChainStart(chain: any, inputs: any) {
    console.log("Chain开始执行", { chain: chain.name, inputs });
  }

  async handleChainEnd(outputs: any) {
    console.log("Chain执行结束", { outputs });
  }
}

const llm = new OpenAI({
  callbacks: [new CustomCallbackHandler()],
});
```

---

## 五、面试高频问题

**Q: LangChain 的核心优势是什么？**

A: "LangChain 的核心优势是标准化和可组合性:

1. 统一接口: 不管是 OpenAI、Anthropic 还是本地模型，都用同样的 API
2. 模块化: Prompt、Model、Memory、Chain 可以自由组合
3. 生态丰富: 内置 100+工具，开箱即用
4. 生产就绪: 内置缓存、重试、监控等企业级特性

在我们项目中，LangChain 让我们快速实现了 RAG、Agent 等复杂功能，开发效率提升 3 倍。"

**Q: LangChain 的性能怎么样？有什么坑？**

A: "LangChain 的抽象层会带来一些性能开销，我们遇到过几个问题:

1. 内存泄漏: 长时间运行会积累 Memory，需要定期清理
2. 序列化开销: Chain 的中间结果序列化比较慢
3. 类型安全: TypeScript 类型定义不够完善

我们的优化方案:

1. 自己实现关键路径，绕过 LangChain 的抽象
2. 使用 Redis 缓存替代内存 Memory
3. 添加自定义类型定义

总体来说，LangChain 适合快速开发和 MVP，生产环境需要针对性优化。"

**Q: 如何选择 Chain 类型？**

A: "根据场景选择:

- 简单问答: LLMChain
- 多步骤: SequentialChain
- 需要检索: RetrievalQAChain
- 需要决策: Agent

我们项目中:

- 症状分析用 LLMChain（单步）
- 诊断流程用 SequentialChain（多步）
- 知识问答用 RetrievalQAChain（RAG）
- 复杂任务用 Agent（需要调用工具）"
