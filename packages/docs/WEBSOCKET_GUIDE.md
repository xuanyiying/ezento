# WebSocket 集成使用指南

## 后端配置

### 1. 环境变量

在 `packages/backend/.env` 中添加：

```env
# WebSocket 配置
FRONTEND_URL=http://localhost:5173
```

### 2. 启动服务

```bash
cd packages/backend
pnpm dev
```

WebSocket 服务将在 `ws://localhost:3000/chat` 上运行。

---

## 前端配置

### 1. 环境变量

在 `packages/frontend/.env` 中添加：

```env
VITE_WEBSOCKET_URL=http://localhost:3000
```

### 2. 在 ChatPage 中集成 WebSocket

#### 方式一：使用自定义 Hook（推荐）

```typescript
import { useWebSocketChat } from '@/hooks/useWebSocketChat';

const ChatPage = () => {
  const [aiThinking, setAiThinking] = useState(false);
  
  const { sendMessage } = useWebSocketChat({
    consultationId: currentConversation?.id,
    userId: user?.userId,
    tenantId: user?.tenantId,
    onMessageReceived: (message) => {
      // 添加消息到对话列表
      dispatch(addMessage(message));
    },
    onAiThinking: (isThinking) => {
      setAiThinking(isThinking);
    },
    onError: (error) => {
      message.error(error);
    },
  });

  const handleSend = (content: string) => {
    // 发送消息
    sendMessage(content);
    
    // 立即显示用户消息
    dispatch(addMessage({
      role: 'user',
      content,
      timestamp: new Date(),
    }));
  };

  return (
    <div>
      <MessageList messages={messages} aiThinking={aiThinking} />
      <MessageInput onSend={handleSend} />
    </div>
  );
};
```

#### 方式二：直接使用 SocketService

```typescript
import socketService from '@/services/socket.service';

useEffect(() => {
  socketService.connect();
  socketService.joinConsultation(consultationId);

  socketService.onAiMessage((data) => {
    console.log('AI 回复:', data.content);
  });

  return () => {
    socketService.leaveConsultation(consultationId);
    socketService.disconnect();
  };
}, [consultationId]);

const handleSend = (content: string) => {
  socketService.sendMessage({
    consultationId,
    content,
    userId,
    tenantId,
  });
};
```

---

## WebSocket 事件说明

### 客户端发送事件

| 事件名 | 参数 | 说明 |
|--------|------|------|
| `joinConsultation` | `{ consultationId }` | 加入问诊房间 |
| `sendMessage` | `{ consultationId, content, userId, tenantId }` | 发送消息 |
| `leaveConsultation` | `{ consultationId }` | 离开问诊房间 |

### 服务端推送事件

| 事件名 | 数据格式 | 说明 |
|--------|----------|------|
| `userMessage` | `{ content, userId, timestamp }` | 用户消息（广播到房间） |
| `aiThinking` | `{ status: 'processing' }` | AI 正在思考 |
| `aiMessage` | `{ content, timestamp }` | AI 回复消息 |
| `error` | `{ message }` | 错误信息 |

---

## 测试 WebSocket 连接

### 1. 使用浏览器控制台

```javascript
// 连接 WebSocket
const socket = io('http://localhost:3000/chat');

// 监听连接事件
socket.on('connect', () => {
  console.log('✅ 已连接:', socket.id);
});

// 加入房间
socket.emit('joinConsultation', { consultationId: 'test-123' });

// 发送消息
socket.emit('sendMessage', {
  consultationId: 'test-123',
  content: '我头疼怎么办？',
  userId: 'user-1',
  tenantId: 'tenant-1',
});

// 监听 AI 回复
socket.on('aiMessage', (data) => {
  console.log('AI 回复:', data.content);
});
```

### 2. 使用 Postman（WebSocket 功能）

1. 创建新的 WebSocket 请求
2. URL: `ws://localhost:3000/chat`
3. 连接后发送消息：

```json
{
  "event": "sendMessage",
  "data": {
    "consultationId": "test-123",
    "content": "测试消息",
    "userId": "user-1",
    "tenantId": "tenant-1"
  }
}
```

---

## 常见问题

### Q1: WebSocket 连接失败

**检查清单：**

- ✅ 后端服务是否启动
- ✅ 端口 3000 是否被占用
- ✅ CORS 配置是否正确
- ✅ 防火墙是否阻止连接

**解决方案：**

```typescript
// 在 chat.gateway.ts 中检查 CORS 配置
@WebSocketGateway({
  cors: {
    origin: '*', // 开发环境可以使用 *
    credentials: true,
  },
})
```

### Q2: 消息发送后没有响应

**可能原因：**

1. AI 服务未配置或 API Key 无效
2. consultationId 不存在
3. 权限验证失败

**调试方法：**

```bash
# 查看后端日志
cd packages/backend
pnpm dev

# 应该看到类似输出：
# Client connected: xxx
# Client xxx joined consultation test-123
# AI response error: ...（如果有错误）
```

### Q3: 断线重连

Socket.io 已自动处理重连，配置如下：

```typescript
io(`${this.serverUrl}/chat`, {
  reconnection: true,        // 启用自动重连
  reconnectionDelay: 1000,   // 重连延迟 1 秒
  reconnectionAttempts: 5,   // 最多重连 5 次
});
```

---

## 下一步优化

### 1. AI 流式输出

修改 `chat.gateway.ts` 支持流式响应：

```typescript
// 使用 Server-Sent Events 或 WebSocket 流式推送
for await (const chunk of aiStreamResponse) {
  this.server.to(consultationId).emit('aiChunk', {
    content: chunk,
    isComplete: false,
  });
}
```

### 2. 消息持久化

在发送消息时同步保存到数据库：

```typescript
// 保存用户消息
await this.conversationService.addMessage({
  consultationId,
  role: 'user',
  content,
});

// 保存 AI 回复
await this.conversationService.addMessage({
  consultationId,
  role: 'assistant',
  content: aiResponse.content,
});
```

### 3. 在线状态显示

添加用户在线状态：

```typescript
@SubscribeMessage('updateStatus')
handleStatusUpdate(@ConnectedSocket() client: Socket) {
  this.server.emit('userOnline', { userId: client.data.userId });
}
```

---

## 生产环境部署

### Nginx 配置

```nginx
location /chat {
    proxy_pass http://localhost:3000;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
    proxy_set_header Host $host;
    proxy_cache_bypass $http_upgrade;
}
```

### 负载均衡

使用 Redis Adapter 支持多实例：

```bash
pnpm add @socket.io/redis-adapter redis
```

```typescript
import { createAdapter } from '@socket.io/redis-adapter';
import { createClient } from 'redis';

const pubClient = createClient({ url: 'redis://localhost:6379' });
const subClient = pubClient.duplicate();

await Promise.all([pubClient.connect(), subClient.connect()]);

io.adapter(createAdapter(pubClient, subClient));
```

---

## 完成

WebSocket 已成功集成。您现在可以：

✅ 实时双向通信
✅ AI 即时响应
✅ 自动重连机制
✅ 房间管理（多个问诊隔离）

如有问题，请查看日志或联系技术支持。
