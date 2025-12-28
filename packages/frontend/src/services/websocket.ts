import { addMessage, setCurrentConversation } from '@/store/slices/conversationSlice';
import { store } from '@/store';
import { io, Socket } from 'socket.io-client';
import { TokenManager } from '@/utils/tokenManager';

class WebSocketService {
  private static instance: WebSocketService;
  private socket: Socket | null = null;
  private maxReconnectAttempts = 5;
    private reconnectDelay = 3000;
    private reconnectListeners: (() => void)[] = [];
    private disconnectListeners: (() => void)[] = [];
    private connectionAttempts = 0;

  private constructor() {}

    public static getInstance(): WebSocketService {
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
        this.disconnectListeners = this.disconnectListeners.filter(
            listener => listener !== callback
        );
  }

  connect(conversationId: string): void {
    if (this.socket?.connected) {
            console.log('WebSocket已连接，正在重用连接');
            this.socket.emit('join_conversation', conversationId);
      return;
    }

        // 获取token和userId
        const token = TokenManager.getToken();
        const userStr = localStorage.getItem('user');
        let userId = '';

    if (!token) {
            console.error('未找到认证token，无法建立WebSocket连接');
      return;
    }
    
        if (userStr) {
            try {
                const user = JSON.parse(userStr);
                userId = user.userId || user.id;
            } catch (error) {
                console.error('解析用户信息失败:', error);
            }
        }

      if (!userId) {
            console.error('未找到用户ID，无法建立WebSocket连接');
      return;
    }
    
        // 构建WebSocket URL
        const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const wsUrl =
            process.env.NODE_ENV === 'development'
                ? `${wsProtocol}//${window.location.hostname}:3000`
                : `${wsProtocol}//${window.location.host}`;
    
    try {
      // 先断开现有连接
      if (this.socket) {
        console.log('断开旧的WebSocket连接');
        this.socket.disconnect();
        this.socket = null;
      }

            console.log('正在创建新的WebSocket连接...', wsUrl);
      
      // 创建新连接
      this.socket = io(wsUrl, {
        path: '/ws',
        query: { conversationId },
        auth: { 
          token,
                    userId,
        },
        transports: ['websocket'],
        reconnection: true,
        reconnectionAttempts: this.maxReconnectAttempts,
        reconnectionDelay: this.reconnectDelay,
                timeout: 10000,
                autoConnect: true,
            });

            // 连接成功
            this.socket.on('connect', () => {
                console.log('WebSocket连接成功');
                this.connectionAttempts = 0;

                // 加入会话
                this.socket?.emit('join_conversation', conversationId);

                // 通知所有重连监听器
                this.reconnectListeners.forEach(listener => listener());
            });

            // 连接错误
            this.socket.on('connect_error', error => {
                console.error('WebSocket连接错误:', error);
                this.connectionAttempts++;

                if (this.connectionAttempts >= this.maxReconnectAttempts) {
                    console.error('WebSocket连接失败，已达到最大重试次数');
                }
            });

            // 连接超时
            this.socket.on('connect_timeout', timeout => {
                console.error('WebSocket连接超时:', timeout);
            });

            // 断开连接
            this.socket.on('disconnect', reason => {
                console.log('WebSocket断开连接:', reason);

                // 通知所有断开连接监听器
                this.disconnectListeners.forEach(listener => listener());
            });

            // 重新连接
            this.socket.on('reconnect', attemptNumber => {
                console.log('WebSocket重新连接成功，尝试次数:', attemptNumber);

                // 重新加入会话
        this.socket?.emit('join_conversation', conversationId);

                // 通知所有重连监听器
                this.reconnectListeners.forEach(listener => listener());
            });

            // 重新连接尝试
            this.socket.on('reconnect_attempt', attemptNumber => {
                console.log('WebSocket重新连接尝试:', attemptNumber);
            });

            // 重新连接错误
            this.socket.on('reconnect_error', error => {
                console.error('WebSocket重新连接错误:', error);
            });

            // 重新连接失败
            this.socket.on('reconnect_failed', () => {
                console.error('WebSocket重新连接失败');
            });

            // 错误
            this.socket.on('error', this.handleError.bind(this));

            // 消息接收
            this.socket.on('message_received', this.handleMessageReceived.bind(this));

            // AI响应块
            this.socket.on('ai_response_chunk', this.handleAiResponseChunk.bind(this));

            // AI响应完成
            this.socket.on('ai_response_complete', this.handleAiResponseComplete.bind(this));

            // 加入会话
            this.socket.on('joined_conversation', this.handleJoinedConversation.bind(this));
        } catch (error) {
            console.error('创建WebSocket连接失败:', error);
        }
    }

    private handleMessageReceived(data: any): void {
        try {
            console.log('收到消息:', data);
            const { message, conversation } = data;
            if (message) {
                // 添加收到的消息到Redux store
                store.dispatch(
                    addMessage({
                        id: message.id || Date.now().toString(),
                        content: message.content || '',
                        role: message.role || 'system',
                        timestamp: message.timestamp || new Date().toISOString(),
                        conversationId: conversation?.id || message.conversationId || '',
                        consultationId: conversation?.consultationId || message.consultationId || '',
                    })
                );
                console.log('已添加收到的消息到Redux存储');
            }

            if (conversation && conversation.id) {
                // 确保会话对象有必要的字段
                const safeConversation = {
                    ...conversation,
                    messages: conversation.messages || [],
                    status: conversation.status || 'ACTIVE',
                    startTime: conversation.startTime || new Date().toISOString(),
                    patientId: conversation.patientId || '',
                    referenceId: conversation.referenceId || '',
                };
                store.dispatch(setCurrentConversation(safeConversation));
            }
        } catch (error) {
            console.error('处理消息时出错:', error);
        }
    }

    private handleAiResponseChunk(data: any): void {
        try {
            const { chunk } = data;
            if (chunk) {
                // 生成唯一ID
                const uniqueId = `system_chunk_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
                
                // 处理AI响应片段
                store.dispatch(
                    addMessage({
                        id: uniqueId,
                        content: chunk,
                        role: 'system',
                        timestamp: new Date().toISOString(),
                        conversationId: '',
                        consultationId: '',
                    })
                );
          }
        } catch (error) {
            console.error('处理AI响应片段时出错:', error);
        }
    }

    private handleAiResponseComplete(data: any): void {
        try {
            console.log('AI响应完成事件数据:', data);
            
            // 确保数据有效
            if (!data || !data.conversation || !data.conversation.id) {
                console.warn('AI响应完成事件缺少必要的会话数据');
                return;
            }
            
            const { conversation } = data;
            
            try {
                // 安全更新当前会话
                const safeConversation = {
                    ...conversation,
                    messages: Array.isArray(conversation.messages) ? conversation.messages : [],
                    type: conversation.type || 'DIAGNOSIS',
                    status: conversation.status || 'ACTIVE',
                    startTime: conversation.startTime || new Date().toISOString(),
                    referenceId: conversation.referenceId || '',
                    patientId: conversation.patientId || '',
                    consultationId: conversation.consultationId || '',
                };
                
                // 更新Redux中的当前会话
                store.dispatch(setCurrentConversation(safeConversation));
                
                // 处理最后一条消息
                if (Array.isArray(conversation.messages) && conversation.messages.length > 0) {
                    const lastMessage = conversation.messages[conversation.messages.length - 1];
                    
                    if (lastMessage && lastMessage.role === 'system') {
                        // 添加响应消息
                        store.dispatch(
                            addMessage({
                                id: lastMessage.id || Date.now().toString(),
                                content: lastMessage.content || '',
                                role: lastMessage.role,
                                timestamp: lastMessage.timestamp || new Date().toISOString(),
                                conversationId: conversation.id,
                                consultationId: conversation.consultationId || '',
                            })
                        );
                    }
                }
            } finally {
          }
        } catch (error) {
            console.error('处理AI响应完成事件时出错:', error);
        }
    }

    private handleJoinedConversation(data: any): void {
        console.log('已加入会话:', data);
    }

    private handleError(error: any): void {
        console.error('WebSocket错误:', error);
    }

    disconnect(): void {
        if (this.socket) {
            this.socket.disconnect();
            this.socket = null;
    }
  }

  isConnected(): boolean {
        return this.socket?.connected || false;
    }

    // 发送消息方法
    sendMessage(message: string, conversationId?: string, type?: string, role: 'user' | 'system' = 'user'): void {
        if (!this.socket?.connected) {
            console.error('WebSocket未连接，无法发送消息');
            return;
        }
    
        const state = store.getState() as any;
        const msgConversationId = conversationId || state.conversation?.currentConversation?.id;
        const msgConversationType =
            type || state.conversation?.currentConversation?.type || 'DIAGNOSIS';

        if (!msgConversationId) {
            console.error('找不到会话ID，无法发送消息');
            return;
        }
    
        const messageData = {
            conversationId: msgConversationId,
            content: message,
            type: msgConversationType,
            role: role,
            metadata: {},
        };
    
        try {
            this.socket.emit('new_message', messageData);
            console.log('消息已发送:', messageData);
        } catch (error) {
            console.error('发送消息失败:', error);
            throw error;
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
}

export default WebSocketService;
