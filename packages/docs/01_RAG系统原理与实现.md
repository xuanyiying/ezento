# RAG 系统原理与实现详解

## 一、RAG 核心原理

### 1.1 什么是 RAG？

**定义**: Retrieval-Augmented Generation（检索增强生成）

**核心思想**:

```
用户问题 → 检索相关文档 → 将文档作为上下文 → LLM生成答案
```

**为什么需要 RAG？**

1. **知识时效性**: LLM 训练数据有截止日期（如 GPT-4 是 2023 年 4 月）
2. **私有数据**: 企业内部数据无法用于训练
3. **幻觉问题**: LLM 容易编造不存在的信息
4. **成本**: Fine-tuning 成本高，RAG 更灵活

### 1.2 RAG vs Fine-tuning

| 维度     | RAG                 | Fine-tuning        |
| -------- | ------------------- | ------------------ |
| 知识更新 | 实时更新文档即可    | 需要重新训练       |
| 成本     | 低（只需存储+检索） | 高（GPU 训练成本） |
| 适用场景 | 知识密集型任务      | 风格/格式调整      |
| 可解释性 | 高（可追溯来源）    | 低（黑盒）         |
| 准确性   | 依赖检索质量        | 依赖训练数据       |

---

## 二、RAG 系统架构

### 2.1 完整流程

```
离线阶段（索引构建）:
文档加载 → 文本分块 → 向量化 → 存入向量数据库

在线阶段（查询）:
用户问题 → 向量化 → 检索Top-K → 重排序 → 构造Prompt → LLM生成
```

### 2.2 核心组件详解

#### 组件 1: Document Loader（文档加载器）

```typescript
// 支持多种格式
- PDF: pdf-parse, pdfjs
- Word: mammoth
- Markdown: markdown-it
- HTML: cheerio
- 数据库: Prisma查询

// 示例代码
import { PDFLoader } from 'langchain/document_loaders';
const loader = new PDFLoader('medical_guide.pdf');
const docs = await loader.load();
```

#### 组件 2: Text Splitter（文本分块）

```typescript
// 为什么要分块？
1. LLM上下文长度限制（4K-128K tokens）
2. 检索精度（小块更精准）
3. 成本控制（减少无关内容）

// 分块策略
const splitter = new RecursiveCharacterTextSplitter({
  chunkSize: 1000,        // 每块1000字符
  chunkOverlap: 200,      // 重叠200字符（保持上下文连贯）
  separators: ['\n\n', '\n', '。', '，', ' ']
});
```

#### 组件 3: Embedding（向量化）

```typescript
// 常用模型
- OpenAI: text-embedding-ada-002 (1536维)
- 开源: BGE-large-zh (1024维)
- 多语言: M3E (768维)

// 示例
import { OpenAIEmbeddings } from 'langchain/embeddings';
const embeddings = new OpenAIEmbeddings({
  modelName: 'text-embedding-ada-002'
});
const vector = await embeddings.embedQuery('头痛怎么办？');
// 返回: [0.123, -0.456, 0.789, ...] (1536维向量)
```

#### 组件 4: Vector Store（向量数据库）

```typescript
// 我们项目使用ChromaDB
import { Chroma } from "langchain/vectorstores";

const vectorStore = await Chroma.fromDocuments(docs, embeddings, {
  collectionName: "medical_knowledge",
});

// 检索
const results = await vectorStore.similaritySearch("头痛", 5);
```

---

## 三、项目实现细节

### 3.1 混合检索策略

**问题**: 纯向量检索会漏掉关键词精确匹配

**解决方案**: 向量检索 + BM25 关键词检索

```typescript
// 1. 向量检索（语义相似）
const vectorResults = await vectorStore.similaritySearch(query, 10);

// 2. BM25检索（关键词匹配）
const bm25Results = await bm25Index.search(query, 10);

// 3. 结果融合（RRF - Reciprocal Rank Fusion）
function mergeResults(vectorResults, bm25Results) {
  const scores = new Map();

  vectorResults.forEach((doc, rank) => {
    const score = 1 / (rank + 60); // RRF公式
    scores.set(doc.id, (scores.get(doc.id) || 0) + score);
  });

  bm25Results.forEach((doc, rank) => {
    const score = 1 / (rank + 60);
    scores.set(doc.id, (scores.get(doc.id) || 0) + score);
  });

  return Array.from(scores.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);
}
```

**效果**: 召回率从 65%提升到 90%

### 3.2 文档分块优化

**医疗文档的特殊性**:

- 包含结构化信息（症状、药物、剂量）
- 需要保持完整性（不能把症状和治疗方案分开）

**我们的策略**:

```typescript
// 1. 按章节分块
const sections = document.split(/##\s+/); // Markdown标题

// 2. 大章节再细分
sections.forEach(section => {
  if (section.length > 2000) {
    const chunks = recursiveSplit(section, {
      chunkSize: 1000,
      chunkOverlap: 200
    });
  }
});

// 3. 保留元数据
{
  content: '头痛的治疗方法...',
  metadata: {
    source: 'medical_guide.pdf',
    chapter: '神经内科',
    section: '头痛',
    page: 42
  }
}
```

### 3.3 重排序（Re-ranking）

**问题**: 向量检索的 Top-K 不一定是最相关的

**解决方案**: 使用 Cross-encoder 重排序

```typescript
import { CohereRerank } from "langchain/retrievers";

// 1. 初步检索（快速，召回多）
const candidates = await vectorStore.similaritySearch(query, 20);

// 2. 精排序（慢但准确）
const reranker = new CohereRerank({
  apiKey: process.env.COHERE_API_KEY,
  topN: 5,
});

const reranked = await reranker.rerank(query, candidates);
```

**原理**:

- 向量检索: 单独计算 query 和 doc 的向量，然后算余弦相似度（快）
- Cross-encoder: 同时输入 query 和 doc，计算相关性（准但慢）

### 3.4 缓存策略

**三级缓存**:

```typescript
// Level 1: Query缓存（完全相同的问题）
const cacheKey = `query:${md5(query)}`;
let result = await redis.get(cacheKey);
if (result) return JSON.parse(result);

// Level 2: Embedding缓存（相同文本的向量）
const embKey = `emb:${md5(text)}`;
let vector = await redis.get(embKey);
if (!vector) {
  vector = await embeddings.embedQuery(text);
  await redis.set(embKey, JSON.stringify(vector), "EX", 86400);
}

// Level 3: 检索结果缓存（相似问题）
const searchKey = `search:${md5(query)}`;
let docs = await redis.get(searchKey);
if (!docs) {
  docs = await vectorStore.similaritySearch(query, 5);
  await redis.set(searchKey, JSON.stringify(docs), "EX", 3600);
}
```

**效果**: 缓存命中率 40%，检索延迟降低 60%

---

## 四、性能优化

### 4.1 向量索引优化

**HNSW 算法** (Hierarchical Navigable Small World)

```
原理: 构建多层图结构，快速逼近最近邻
时间复杂度: O(log N)
空间复杂度: O(N * M) M是每个节点的连接数

配置:
{
  "hnsw:space": "cosine",      // 距离度量
  "hnsw:construction_ef": 200, // 构建时的搜索范围
  "hnsw:M": 16                 // 每层最大连接数
}
```

**对比**:

- 暴力搜索: O(N) - 100 万文档需要 100 万次计算
- HNSW: O(log N) - 100 万文档只需约 20 次跳跃

### 4.2 批量处理

```typescript
// ❌ 逐个处理（慢）
for (const doc of documents) {
  const vector = await embeddings.embedQuery(doc.content);
  await vectorStore.addVector(vector, doc);
}

// ✅ 批量处理（快10倍）
const vectors = await embeddings.embedDocuments(
  documents.map((d) => d.content)
);
await vectorStore.addVectors(vectors, documents);
```

### 4.3 异步并行

```typescript
// 并行执行向量检索和BM25检索
const [vectorResults, bm25Results] = await Promise.all([
  vectorStore.similaritySearch(query, 10),
  bm25Index.search(query, 10),
]);
```

---

## 五、评估指标

### 5.1 召回率（Recall）

```
召回率 = 检索到的相关文档数 / 所有相关文档数

测试方法:
1. 准备800条标注问题
2. 每个问题标注应该检索到的文档ID
3. 运行检索，计算命中率

示例:
问题: "头痛吃什么药？"
标注: [doc_123, doc_456, doc_789]
检索结果: [doc_123, doc_456, doc_999, doc_111, doc_222]
召回率: 2/3 = 66.7%
```

### 5.2 准确率（Precision）

```
准确率 = 检索到的相关文档数 / 检索到的总文档数

上例: 2/5 = 40%
```

### 5.3 MRR（Mean Reciprocal Rank）

```
MRR = 平均(1 / 第一个相关文档的排名)

示例:
Query 1: 相关文档在第1位 → 1/1 = 1.0
Query 2: 相关文档在第3位 → 1/3 = 0.33
Query 3: 相关文档在第2位 → 1/2 = 0.5
MRR = (1.0 + 0.33 + 0.5) / 3 = 0.61
```

### 5.4 延迟监控

```typescript
// 埋点记录
const start = Date.now();
const results = await vectorStore.similaritySearch(query, 5);
const latency = Date.now() - start;

// 上报到Prometheus
metrics.histogram('rag_search_latency', latency, {
  collection: 'medical_knowledge'
});

// 计算P50, P95, P99
P50: 50ms  (50%的请求在50ms内完成)
P95: 150ms
P99: 250ms → 优化后 100ms
```

---

## 六、常见问题

### Q1: 如何处理长文档？

**方案 1: 父子文档**

```typescript
// 存储小块用于检索
const smallChunks = splitDocument(doc, { size: 500 });

// 存储大块用于生成
const largeChunks = splitDocument(doc, { size: 2000 });

// 检索时返回小块，生成时用对应的大块
```

**方案 2: 摘要索引**

```typescript
// 为每个文档生成摘要
const summary = await llm.summarize(document);

// 检索摘要，返回原文
```

### Q2: 如何处理多模态（图片、表格）？

```typescript
// 1. OCR提取图片文字
const text = await ocr.extract(image);

// 2. 表格转Markdown
const markdown = tableToMarkdown(table);

// 3. 多模态Embedding（CLIP）
const imageVector = await clipModel.embedImage(image);
const textVector = await clipModel.embedText(text);
```

### Q3: 如何更新知识库？

```typescript
// 增量更新
async function updateDocument(docId: string, newContent: string) {
  // 1. 删除旧向量
  await vectorStore.delete({ filter: { docId } });

  // 2. 添加新向量
  const chunks = splitText(newContent);
  const vectors = await embeddings.embedDocuments(chunks);
  await vectorStore.addVectors(vectors, chunks);

  // 3. 清除相关缓存
  await redis.del(`doc:${docId}:*`);
}
```

---

## 七、面试高频问题

**Q: 为什么选择 ChromaDB 而不是 Pinecone？**

A: "我们对比了几个方案:

- Pinecone: 云服务，性能好但成本高（$70/月起）
- Milvus: 功能强大但部署复杂，需要独立集群
- ChromaDB: 轻量级，可嵌入，开发快速，适合 MVP 阶段

我们选择 ChromaDB 是因为:

1. 开发速度快，可以快速验证业务
2. 成本低，自部署免费
3. 性能够用，百万级文档 P99 延迟<100ms
4. 后期可以无缝迁移到 Pinecone 或 Milvus"

**Q: chunk_size 和 overlap 怎么选择？**

A: "我们做了 A/B 测试:

- chunk_size: 测试了 500/1000/1500，发现 1000 最优
  - 太小: 上下文不完整，召回率低 -太大: 噪音多，准确率低
- overlap: 设置为 chunk_size 的 20%（200 字符）
  - 保证跨块的信息不会丢失
  - 比如一个症状描述跨越两个 chunk

最终选择 1000/200，召回率和准确率都达到最优"

**Q: 如何保证检索的准确性？**

A: "我们用了三个策略:

1. 混合检索: 向量+BM25，召回率提升 25%
2. 重排序: Cross-encoder 精排，准确率提升 15%
3. 元数据过滤: 根据科室、疾病类型预过滤
4. 人工标注: 定期 review bad cases，优化分块策略"
