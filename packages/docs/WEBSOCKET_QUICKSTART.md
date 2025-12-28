# WebSocket 快速启动指南

## ✅ 已完成的工作

### 后端 (packages/backend)

- ✅ 安装 WebSocket 依赖
  - `@nestjs/websockets`
  - `@nestjs/platform-socket.io`
  - `socket.io`
  - `@types/socket.io`
- ✅ 创建 `ChatGateway` (src/websocket/chat.gateway.ts)
- ✅ 创建 `WebsocketModule` (src/websocket/websocket.module.ts)
- ✅ 注册到 `AppModule`

### 前端 (packages/frontend)

- ✅ 安装 `socket.io-client`
- ✅ 创建 `SocketService` (src/services/socket.service.ts)
- ✅ 创建 `useWebSocketChat` Hook (src/hooks/useWebSocketChat.ts)

---

## 🚀 快速测试

### 1. 启动后端

```bash
cd packages/backend
pnpm dev
```

**预期输出：**

```
[Nest] INFO [NestFactory] Starting Nest application...
[Nest] INFO [WebSocketsController] WebSocket server initialized
[Nest] INFO Application is running on: http://localhost:3000
```

### 2. 启动前端

```bash
cd packages/frontend
pnpm dev
```

### 3. 测试 WebSocket 连接

打开浏览器控制台 (F12)，粘贴以下代码：

```javascript
// 1. 引入 Socket.io 客户端（如果未全局可用，先在 HTML 中添加）
const socket = io('http://localhost:3000/chat');

// 2. 监听连接
socket.on('connect', () => {
  console.log('✅ WebSocket 已连接:', socket.id);
});

// 3. 加入问诊房间
socket.emit('joinConsultation', { consultationId: 'test-consultation-1' });

// 4. 监听 AI 消息
socket.on('aiMessage', (data) => {
  console.log('🤖 AI 回复:', data.content);
});

// 5. 监听 AI 思考状态
socket.on('aiThinking', (data) => {
  console.log('💭 AI 正在思考...', data.status);
});

// 6. 发送测试消息
socket.emit('sendMessage', {
  consultationId: 'test-consultation-1',
  content: '我最近头疼，应该看哪个科室？',
  userId: 'test-user-1',
  tenantId: 'test-tenant-1'
});
```

---

## 📝 在 ChatPage 中集成

### 方法一：使用自定义 Hook（推荐）

在 `ChatPage.tsx` 中添加：

```typescript
import { useWebSocketChat } from '@/hooks/useWebSocketChat';
import { useState } from 'react';

const ChatPage = () => {
  const [aiThinking, setAiThinking] = useState(false);
  
  // 使用 WebSocket Hook
  const { sendMessage } = useWebSocketChat({
    consultationId: currentConversation?.id,
    userId: user?.userId,
    tenantId: user?.tenantId || 'default-tenant',
    onMessageReceived: (message) => {
      // 添加 AI 消息到对话列表
      console.log('收到 AI 消息:', message);
      // TODO: dispatch(addMessage(message));
    },
    onAiThinking: (isThinking) => {
      setAiThinking(isThinking);
    },
    onError: (error) => {
      message.error(error);
    },
  });

  // 修改发送消息函数
  const handleSendMessage = (content: string) => {
    // 使用 WebSocket 发送
    sendMessage(content);
    
    // 立即显示用户消息（无需等待服务器响应）
    // TODO: dispatch(addMessage({ role: 'user', content }));
  };

  return (
    <div className="chat-page">
      <MessageList 
        messages={messages} 
        aiThinking={aiThinking}  {/* 显示 AI 思考动画 */}
      />
      <MessageInput onSend={handleSendMessage} />
    </div>
  );
};
```

### 方法二：直接使用 SocketService

```typescript
import socketService from '@/services/socket.service';
import { useEffect } from 'react';

const ChatPage = () => {
  useEffect(() => {
    // 连接并加入房间
    socketService.connect();
    socketService.joinConsultation(currentConversation?.id);

    // 监听消息
    socketService.onAiMessage((data) => {
      console.log('AI 回复:', data.content);
    });

    // 清理
    return () => {
      socketService.leaveConsultation(currentConversation?.id);
      socketService.offAllListeners();
    };
  }, [currentConversation?.id]);

  const handleSend = (content: string) => {
    socketService.sendMessage({
      consultationId: currentConversation?.id,
      content,
      userId: user?.userId,
      tenantId: user?.tenantId,
    });
  };

  return <MessageInput onSend={handleSend} />;
};
```

---

## 🔧 环境配置

### 后端 (.env)

```env
# WebSocket CORS 配置
FRONTEND_URL=http://localhost:5173
```

### 前端 (.env)

```env
# WebSocket 服务器地址
VITE_WEBSOCKET_URL=http://localhost:3000
```

---

## 🎯 功能特性

### ✅ 已实现

- [x] 实时双向通信
- [x] 房间管理（多个问诊隔离）
- [x] AI 思考状态提示
- [x] 自动重连机制
- [x] 错误处理
- [x] 连接状态管理

### 🚧 待优化

- [ ] AI 流式输出（逐字显示）
- [ ] 消息持久化到数据库
- [ ] 用户在线状态
- [ ] 消息已读/未读状态
- [ ] 打字指示器

---

## 🐛 故障排查

### 问题 1: 连接失败

**症状：** 控制台显示 `WebSocket connection error`

**解决方案：**

1. 检查后端是否启动：`curl http://localhost:3000/health`
2. 检查 CORS 配置：确保 `chat.gateway.ts` 中 `cors.origin` 包含前端地址
3. 检查防火墙：确保端口 3000 未被阻止

### 问题 2: 消息发送后无响应

**症状：** 发送消息后没有收到 AI 回复

**可能原因：**

- AI 服务未配置（检查 `.env` 中的 `OPENAI_API_KEY`）
- consultationId 不存在
- 权限验证失败

**调试步骤：**

```bash
# 查看后端日志
cd packages/backend
pnpm dev

# 应该看到：
# [ChatGateway] Client xxx joined consultation test-consultation-1
# [ChatGateway] AI response error: ... (如果有错误)
```

### 问题 3: TypeScript 错误

**症状：** IDE 显示类型错误

**解决方案：**

```bash
# 重启 TypeScript 服务器
# VS Code: Cmd+Shift+P -> "TypeScript: Restart TS Server"

# 或重新生成类型
cd packages/backend
pnpm prisma generate
```

---

## 📚 相关文档

- [完整使用指南](./WEBSOCKET_GUIDE.md)
- [Socket.io 官方文档](https://socket.io/docs/v4/)
- [NestJS WebSocket 文档](https://docs.nestjs.com/websockets/gateways)

---

## ✨ 下一步

1. **测试基本功能**

   ```bash
   # 启动后端和前端，测试消息收发
   ```

2. **集成到 ChatPage**

   ```typescript
   // 使用 useWebSocketChat Hook
   ```

3. **添加 AI 流式输出**

   ```typescript
   // 修改 chat.gateway.ts 支持流式响应
   ```

4. **优化用户体验**
   - 添加"正在输入..."动画
   - 消息发送成功/失败提示
   - 离线消息队列

---

**🎉 WebSocket 集成完成！现在您可以享受实时对话体验了！**
