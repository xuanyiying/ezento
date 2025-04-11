import { addMessage, setCurrentConversation } from '@/store/slices/conversationSlice';
import { Message } from '@/types/conversation';
import { store } from '@/store';
import { io, Socket } from 'socket.io-client';

class WebSocketService {
  private static instance: WebSocketService;
  private socket: Socket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 3000; // 增加重连延迟时间
  private isReconnecting = false;

  private constructor() {}

  static getInstance(): WebSocketService {
    if (!WebSocketService.instance) {
      WebSocketService.instance = new WebSocketService();
    }
    return WebSocketService.instance;
  }

  connect(conversationId: string): void {
    if (this.socket?.connected) {
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
    
    const wsUrl = `${wsProtocol}//${host}:${port}`;
    
    console.log('尝试连接WebSocket:', wsUrl);
    
    try {
      this.socket = io(wsUrl, {
        path: '/ws',
        query: { conversationId },
        auth: { token },
        transports: ['websocket'],
        reconnection: true,
        reconnectionAttempts: this.maxReconnectAttempts,
        reconnectionDelay: this.reconnectDelay,
      });

      this.socket.on('connect', () => {
        console.log('WebSocket连接成功');
        this.reconnectAttempts = 0;
        this.isReconnecting = false;
      });

      this.socket.on('message', (data: any) => {
        try {
          const { type, data: messageData } = data;
          const { chunk, status, text, error, conversation } = messageData;

          if (type === 'stream') {
            store.dispatch(addMessage({
              content: chunk,
              senderType: 'SYSTEM',
              metadata: {},
              conversationId: conversationId,
            } as Partial<Message>));
          }

          if (type === 'conversation_update') {
            store.dispatch(setCurrentConversation(conversation));
          }

          if (type === 'ocr') {
            if (status === 'success') {
              store.dispatch(addMessage({
                content: `OCR识别结果：${text}`,
                senderType: 'SYSTEM',
                metadata: {},
                conversationId: conversationId,
              } as Partial<Message>));
            } else if (status === 'failed') {
              store.dispatch(addMessage({
                content: `OCR识别失败：${error}`,
                senderType: 'SYSTEM',
                metadata: {},
                conversationId: conversationId,
              } as Partial<Message>));
            }
          }
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      });

      this.socket.on('disconnect', (reason) => {
        console.log('WebSocket disconnected:', reason);
        if (!this.isReconnecting && reason !== 'io client disconnect') {
          this.reconnect(conversationId);
        }
      });

      this.socket.on('connect_error', (error) => {
        console.error('WebSocket connection error:', error);
        if (!this.isReconnecting) {
          this.reconnect(conversationId);
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
    return this.socket?.connected ?? false;
  }

  sendMessage(message: string): void {
    if (!this.socket || !this.socket.connected) {
      console.error('WebSocket is not connected');
      return;
    }
    this.socket.emit('message', JSON.stringify({ type: 'message', content: message }));
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
    this.socket?.disconnect();
    this.socket = null;
  }

  private reconnect(conversationId: string): void {
    if (this.isReconnecting || this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('Max reconnect attempts reached or already reconnecting');
      return;
    }

    this.isReconnecting = true;
    this.reconnectAttempts++;

    console.log(`Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts})...`);
    
    setTimeout(() => {
      this.connect(conversationId);
      this.isReconnecting = false;
    }, this.reconnectDelay * this.reconnectAttempts); // 使用指数退避策略
  }
}

export default WebSocketService;