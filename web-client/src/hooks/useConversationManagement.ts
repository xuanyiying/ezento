import { useCallback } from 'react';
import { useDispatch } from 'react-redux';
import { App } from 'antd';
import { addMessage, setCurrentConversation, startBatchUpdate, endBatchUpdate } from '@/store/slices/conversationSlice';
import { ConversationAPI } from '@/services/conversation';
import { Types, Conversation } from '@/types/conversation';
import WebSocketService from '@/services/websocket';

interface UseConversationManagementProps {
  userId?: string;
  isAuthenticated: boolean;
}

export const useConversationManagement = ({ userId, isAuthenticated }: UseConversationManagementProps) => {
  const dispatch = useDispatch();
  const { message } = App.useApp();
  const wsService = WebSocketService.getInstance();

  // 初始化会话
  const initializeConversation = useCallback(async () => {
    try {
      // 设置loading状态
      message.loading({ content: '正在初始化对话...', key: 'initConversation' });

      if (!userId) {
        throw new Error('User ID is required to create a conversation');
      }

      if (!isAuthenticated) {
        throw new Error('请先登录后再开始对话');
      }

      // 1. 先检查本地存储是否有会话
      const savedConversationJson = localStorage.getItem('currentConversation');
      if (savedConversationJson && savedConversationJson !== 'undefined' && savedConversationJson !== 'null') {
        try {
          const parsed = JSON.parse(savedConversationJson);
          if (parsed && typeof parsed === 'object' && parsed.id) {
            // 2. 验证本地会话是否在服务器存在
            const serverConversation = await ConversationAPI.getConversation(parsed.id);
            if (serverConversation && serverConversation.id) {
              dispatch(setCurrentConversation(serverConversation));
              message.success({ content: '已恢复上次对话', key: 'initConversation' });
              return serverConversation;
            }
          }
        } catch (e) {
          console.error('解析本地会话数据失败:', e);
        }
        // 清除无效的本地存储
        localStorage.removeItem('currentConversation');
      }

      // 3. 如果本地没有有效会话或服务器验证失败，创建新会话
      const apiResponse = await ConversationAPI.createConversation({
        type: Types.DIAGNOSIS,
        userId: userId,
        messages: [],
      });

      if (!apiResponse || !apiResponse.id) {
        throw new Error('服务器创建会话失败，请稍后再试');
      }

      const conversation: Conversation = {
        id: apiResponse.id,
        type: Types.DIAGNOSIS,
        userId: userId,
        messages: apiResponse.messages || [],
        status: apiResponse.status || 'ACTIVE',
        startTime: apiResponse.startTime || new Date().toISOString(),
        conversationId: apiResponse.id,
        consultationId: apiResponse.consultationId || '',
      };

      dispatch(setCurrentConversation(conversation));
      localStorage.setItem('currentConversation', JSON.stringify(conversation));
      message.success({ content: '对话初始化成功', key: 'initConversation' });

      return conversation;
    } catch (error: any) {
      console.error('Error initializing conversation:', error);
      message.error({
        content: `对话初始化失败: ${error.message || '请刷新页面重试'}`,
        key: 'initConversation',
        duration: 5
      });
      return null;
    }
  }, [userId, isAuthenticated, dispatch, message]);

  // 创建新会话
  const createNewConversation = useCallback(async () => {
    try {
      // 显示加载状态
      message.loading({ content: '正在创建新会话...', key: 'createConversation' });

      if (!userId) {
        throw new Error('User ID is required to create a conversation');
      }

      // 创建新会话
      const apiResponse = await ConversationAPI.createConversation({
        type: Types.DIAGNOSIS,
        userId: userId,
        messages: [],
      });

      if (!apiResponse || !apiResponse.id) {
        throw new Error('Failed to create conversation: Missing required fields in response');
      }

      // 确保对象符合Conversation类型定义
      const conversation: Conversation = {
        id: apiResponse.id,
        type: Types.DIAGNOSIS,
        userId: userId,
        messages: apiResponse.messages || [],
        status: apiResponse.status || 'ACTIVE',
        startTime: apiResponse.startTime || new Date().toISOString(),
        conversationId: apiResponse.id,
        consultationId: apiResponse.consultationId || '',
      };

      // 更新Redux状态
      dispatch(setCurrentConversation(conversation));

      // 保存新会话到本地存储
      localStorage.setItem('currentConversation', JSON.stringify(conversation));

      // 建立WebSocket连接
      wsService.disconnect();
      setTimeout(() => {
        wsService.connect(conversation.id);
      }, 500);

      // 显示成功消息
      message.success({ content: '新会话已创建', key: 'createConversation' });

      return conversation;
    } catch (error: any) {
      console.error('创建新会话失败:', error);
      message.error({
        content: `创建新会话失败: ${error.message || '请重试'}`,
        key: 'createConversation'
      });
      return null;
    }
  }, [userId, dispatch, message, wsService]);

  // 选择会话
  const selectConversation = useCallback((conversation: Conversation) => {
    try {
      // 显示加载状态
      message.loading({ content: '正在加载会话...', key: 'loadConversation' });

      // 保存当前会话到本地存储
      const currentConversationJson = localStorage.getItem('currentConversation');
      if (currentConversationJson) {
        try {
          const currentConversation = JSON.parse(currentConversationJson);
          if (currentConversation && currentConversation.id) {
            localStorage.setItem(`conversation_${currentConversation.id}`, currentConversationJson);
          }
        } catch (e) {
          console.error('Error parsing current conversation:', e);
        }
      }

      // 断开当前WebSocket连接
      wsService.disconnect();

      // 更新当前会话
      dispatch(setCurrentConversation(conversation));
      localStorage.setItem('currentConversation', JSON.stringify(conversation));

      // 连接到新会话的WebSocket
      setTimeout(() => {
        wsService.connect(conversation.id);
        message.success({ content: '会话加载成功', key: 'loadConversation' });
      }, 500);

      return conversation;
    } catch (error: any) {
      console.error('加载会话失败:', error);
      message.error({
        content: `加载会话失败: ${error.message || '请重试'}`,
        key: 'loadConversation'
      });
      return null;
    }
  }, [dispatch, message, wsService]);

  // 选择会话(通过ID)
  const selectConversationById = useCallback((conversationId: string) => {
    // 从本地存储或Redux中获取会话对象
    const conversationJson = localStorage.getItem(`conversation_${conversationId}`);
    if (conversationJson) {
      try {
        const conversation = JSON.parse(conversationJson);
        return selectConversation(conversation);
      } catch (error) {
        console.error('解析会话数据失败:', error);
        message.error('加载会话失败，请重试');
      }
    } else {
      message.error('找不到指定的会话');
    }
    return null;
  }, [selectConversation, message]);

  // 删除会话
  const deleteConversation = useCallback(async (id: string, currentConversationId?: string) => {
    try {
      message.loading({ content: '正在删除会话...', key: 'deleteConversation' });

      // 如果要删除的是当前会话，先清除当前会话数据
      if (currentConversationId === id) {
        localStorage.removeItem('currentConversation');
      }

      // 删除本地存储中的会话
      localStorage.removeItem(`conversation_${id}`);

      // 调用API删除服务器上的会话
      try {
        await ConversationAPI.deleteConversation(id);
      } catch (apiError) {
        console.error('API删除会话失败:', apiError);
        // 继续执行，确保本地数据也被删除
      }

      // 触发 storage 事件，使侧边栏更新
      window.dispatchEvent(new Event('storage'));

      message.success({ content: '会话已删除', key: 'deleteConversation' });
      return true;
    } catch (error: any) {
      console.error('删除会话失败:', error);
      message.error({
        content: `删除会话失败: ${error.message || '请重试'}`,
        key: 'deleteConversation'
      });
      return false;
    }
  }, [dispatch, message]);

  // 发送消息
  const sendMessage = useCallback((content: string, conversationId: string) => {
    try {
      // 开始批量更新
      dispatch(startBatchUpdate());

      // 添加用户消息到界面
      dispatch(
        addMessage({
          content,
          role: 'user',
          timestamp: new Date().toISOString(),
          conversationId: conversationId,
          id: '',
          consultationId: '',
        })
      );

      // 通过WebSocket发送消息
      wsService.sendMessage(content, conversationId);

      // 结束批量更新
      dispatch(endBatchUpdate());

      // 延迟更新 localStorage，避免频繁写入
      setTimeout(() => {
        const currentConversationJson = localStorage.getItem('currentConversation');
        if (currentConversationJson) {
          try {
            const currentConversation = JSON.parse(currentConversationJson);
            if (currentConversation && currentConversation.id) {
              localStorage.setItem(`conversation_${currentConversation.id}`, currentConversationJson);
              // 触发 storage 事件，使侧边栏更新
              window.dispatchEvent(new Event('storage'));
            }
          } catch (e) {
            console.error('Error parsing current conversation:', e);
          }
        }
      }, 500);

      return true;
    } catch (error: any) {
      console.error('发送消息失败:', error);
      message.error(`发送消息失败: ${error.message || '请重试'}`);
      return false;
    }
  }, [dispatch, wsService, message]);

  return {
    initializeConversation,
    createNewConversation,
    selectConversation,
    selectConversationById,
    deleteConversation,
    sendMessage,
  };
};

export default useConversationManagement;