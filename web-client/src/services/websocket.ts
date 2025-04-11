import { addMessage, setCurrentConversation } from '@/store/slices/conversationSlice';
import { Message } from '@/types/conversation';
import { store } from '@/store';
import { io, Socket } from 'socket.io-client';
import { jwtDecode } from 'jwt-decode';

class WebSocketService {
  private static instance: WebSocketService;
  private socket: Socket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 3000; // 增加重连延迟时间
  private isReconnecting = false;
  private reconnectListeners: (() => void)[] = [];
  private disconnectListeners: (() => void)[] = [];

  private constructor() {}

  static getInstance(): WebSocketService {
    if (!WebSocketService.instance) {
      WebSocketService.instance = new WebSocketService();
    }
    return WebSocketService.instance;
  }

  // 添加重连事件监听
  onReconnect(callback: () => void): void {
    this.reconnectListeners.push(callback);
  }

  // 移除重连事件监听
  offReconnect(callback: () => void): void {
    this.reconnectListeners = this.reconnectListeners.filter(listener => listener !== callback);
  }

  // 添加断开连接事件监听
  onDisconnect(callback: () => void): void {
    this.disconnectListeners.push(callback);
  }

  // 移除断开连接事件监听
  offDisconnect(callback: () => void): void {
    this.disconnectListeners = this.disconnectListeners.filter(listener => listener !== callback);
  }

  // 触发重连事件
  private triggerReconnect(): void {
    this.reconnectListeners.forEach(listener => listener());
  }

  // 触发断开连接事件
  private triggerDisconnect(): void {
    this.disconnectListeners.forEach(listener => listener());
  }

  connect(conversationId: string): void {
    if (this.socket?.connected) {
      console.log('WebSocket已连接，无需重连');
      return;
    }

    // 构建Socket.IO URL
    const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = window.location.hostname;
    const port = import.meta.env.VITE_WS_PORT || '3000';
    
    // 获取用户token
    const token = localStorage.getItem('token');
    if (!token) {
      console.error('No authentication token found');
      return;
    }
    
    // 从token中获取userId
    let userId;
    try {
      const decodedToken = jwtDecode(token) as { userId: string };
      userId = decodedToken.userId;
      if (!userId) {
        console.error('No userId found in token');
        return;
      }
      console.log('Using userId for WebSocket connection:', userId);
    } catch (error) {
      console.error('Failed to decode token:', error);
      return;
    }
    
    const wsUrl = `${wsProtocol}//${host}:${port}`;
    
    console.log('尝试连接WebSocket:', wsUrl, '路径:', '/ws');
    
    try {
      // 先断开现有连接
      if (this.socket) {
        console.log('断开旧的WebSocket连接');
        this.socket.disconnect();
        this.socket = null;
      }
      
      // 创建新连接
      this.socket = io(wsUrl, {
        path: '/ws',
        query: { conversationId },
        auth: { 
          token,
          userId // 添加userId到auth对象
        },
        transports: ['websocket'],
        reconnection: true,
        reconnectionAttempts: this.maxReconnectAttempts,
        reconnectionDelay: this.reconnectDelay,
      });

      console.log('WebSocket对象创建成功，等待连接...');

      // 打印所有WebSocket事件以便调试
      this.socket.onAny((event, ...args) => {
        console.log(`[WebSocket Event] ${event}:`, args);
      });

      this.socket.on('connect', () => {
        console.log('WebSocket连接成功', this.socket?.id);
        this.reconnectAttempts = 0;
        this.isReconnecting = false;
        
        // 连接成功后自动加入会话
        this.socket?.emit('join_conversation', conversationId);
        console.log(`请求加入会话: ${conversationId}`);
        
        // 如果是重连，触发重连事件
        if (this.reconnectAttempts > 0) {
          this.triggerReconnect();
        }
      });

      // 处理消息收到的事件
      this.socket.on('message_received', (data: any) => {
        try {
          console.log('收到消息确认:', data);
          const { message, conversation } = data;
          
          if (message && conversation) {
            console.log('更新会话状态:', conversation._id);
            // 更新当前会话
            store.dispatch(setCurrentConversation(conversation));
          }
        } catch (error) {
          console.error('处理message_received事件时出错:', error);
        }
      });

      // 处理AI响应流
      this.socket.on('ai_response_chunk', (data: any) => {
        try {
          console.log('收到AI响应片段:', data);
          const { chunk, type } = data;
          
          if (chunk) {
            console.log('添加AI响应片段到消息列表:', chunk.substring(0, 50) + (chunk.length > 50 ? '...' : ''));
            store.dispatch(addMessage({
              content: chunk,
              senderType: 'SYSTEM',
              metadata: { type },
              conversationId: conversationId,
            } as Partial<Message>));
          }
        } catch (error) {
          console.error('处理ai_response_chunk事件时出错:', error);
        }
      });

      // 处理AI响应完成事件
      this.socket.on('ai_response_complete', (data: any) => {
        try {
          console.log('AI响应完成:', data);
          const { conversation, conversationType } = data;
          
          if (conversation) {
            console.log('更新完整会话:', conversation._id);
            store.dispatch(setCurrentConversation(conversation));
          }
        } catch (error) {
          console.error('处理ai_response_complete事件时出错:', error);
        }
      });

      // 加入会话的响应
      this.socket.on('joined_conversation', (data: any) => {
        console.log('已加入会话:', data);
      });

      this.socket.on('error', (error: any) => {
        console.error('WebSocket服务器错误:', error);
      });

      this.socket.on('message', (data: any) => {
        try {
          console.log('收到通用消息:', data);
          const { type, data: messageData } = data;
          const { chunk, status, text, error, conversation } = messageData || {};

          if (type === 'stream') {
            console.log('收到流式响应:', chunk);
            store.dispatch(addMessage({
              content: chunk,
              senderType: 'SYSTEM',
              metadata: {},
              conversationId: conversationId,
            } as Partial<Message>));
          }

          if (type === 'conversation_update') {
            console.log('收到会话更新:', conversation?._id);
            store.dispatch(setCurrentConversation(conversation));
          }

          if (type === 'ocr') {
            if (status === 'success') {
              console.log('OCR识别成功:', text);
              store.dispatch(addMessage({
                content: `OCR识别结果：${text}`,
                senderType: 'SYSTEM',
                metadata: {},
                conversationId: conversationId,
              } as Partial<Message>));
            } else if (status === 'failed') {
              console.log('OCR识别失败:', error);
              store.dispatch(addMessage({
                content: `OCR识别失败：${error}`,
                senderType: 'SYSTEM',
                metadata: {},
                conversationId: conversationId,
              } as Partial<Message>));
            }
          }
        } catch (error) {
          console.error('解析WebSocket消息时出错:', error);
        }
      });

      this.socket.on('disconnect', (reason) => {
        console.log('WebSocket断开连接，原因:', reason);
        // 触发断开连接事件
        this.triggerDisconnect();
        
        if (!this.isReconnecting && reason !== 'io client disconnect') {
          this.reconnect(conversationId);
        }
      });

      this.socket.on('connect_error', (error) => {
        console.error('WebSocket连接错误:', error);
        if (!this.isReconnecting) {
          this.reconnect(conversationId);
        }
      });

      // 测试监听new_message事件
      this.socket.on('new_message', (data: any) => {
        try {
          console.log('接收到new_message事件:', data);
          // 可以在这里处理，也可以仅用于调试
        } catch (error) {
          console.error('处理new_message事件出错:', error);
        }
      });
    } catch (error) {
      console.error('WebSocket连接创建失败:', error);
      if (!this.isReconnecting) {
        this.reconnect(conversationId);
      }
    }
  }

  isConnected(): boolean {
    const connected = this.socket?.connected ?? false;
    console.log('检查WebSocket连接状态:', connected);
    return connected;
  }

  sendMessage(message: string): void {
    console.log('准备发送消息:', message);
    
    if (!this.socket) {
      console.error('WebSocket对象不存在，无法发送消息');
      return;
    }
    
    if (!this.socket.connected) {
      console.error('WebSocket未连接，无法发送消息，当前状态:', this.socket.disconnected ? '已断开' : '正在连接');
      return;
    }
    
    // 获取当前会话信息
    const state = store.getState();
    const conversationId = state.conversation.currentConversation?._id;
    const conversationType = state.conversation.currentConversation?.type || 'PRE_DIAGNOSIS';
    
    if (!conversationId) {
      console.error('找不到当前会话，无法发送消息');
      return;
    }
    
    // 构建消息对象
    const messageData = {
      conversationId,
      content: message,
      conversationType,
      metadata: {}
    };
    
    console.log('发送消息对象:', JSON.stringify(messageData));
    
    // 发送消息
    try {
      console.log('尝试使用不同的事件名称发送消息');
      
      // 尝试不同的事件名称
      this.socket.emit('new_message', messageData);
      console.log('new_message事件已发送');
      
      this.socket.emit('message', messageData);
      console.log('message事件已发送');
      
      this.socket.emit('pre_diagnosis', messageData);
      console.log('pre_diagnosis事件已发送');
      
    } catch (error) {
      console.error('消息发送失败:', error);
    }
  }

  sendImage(imageData: string): void {
    if (!this.socket || !this.socket.connected) {
      console.error('WebSocket is not connected');
      return;
    }
    this.socket.emit('image', JSON.stringify({ type: 'image', data: imageData }));
  }

  sendOCRRequest(imageData: string): void {
    if (!this.socket || !this.socket.connected) {
      console.error('WebSocket is not connected');
      return;
    }
    this.socket.emit('ocr_request', JSON.stringify({ type: 'ocr_request', data: imageData }));
  }

  requestAIResponse(prompt: string): void {
    if (!this.socket || !this.socket.connected) {
      console.error('WebSocket is not connected');
      return;
    }
    this.socket.emit('ai_request', JSON.stringify({ type: 'ai_request', prompt }));
  }

  requestConversationHistory(): void {
    if (!this.socket || !this.socket.connected) {
      console.error('WebSocket is not connected');
      return;
    }
    this.socket.emit('history_request', JSON.stringify({ type: 'history_request' }));
  }

  disconnect(): void {
    if (this.socket) {
      console.log('主动断开WebSocket连接');
      this.socket.disconnect();
      this.socket = null;
    }
  }

  private reconnect(conversationId: string): void {
    if (this.isReconnecting || this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('已达到最大重连次数或正在重连中');
      return;
    }

    this.isReconnecting = true;
    this.reconnectAttempts++;

    console.log(`尝试重连 (${this.reconnectAttempts}/${this.maxReconnectAttempts})...`);
    
    setTimeout(() => {
      this.connect(conversationId);
      this.isReconnecting = false;
    }, this.reconnectDelay * this.reconnectAttempts); // 使用指数退避策略
  }
}

export default WebSocketService;