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
      
      const savedConversationJson = localStorage.getItem('currentConversation');
      let savedConversation: Conversation | null = null;

      if (
        savedConversationJson &&
        savedConversationJson !== 'undefined' &&
        savedConversationJson !== 'null'
      ) {
        try {
          const parsed = JSON.parse(savedConversationJson);
          if (parsed && typeof parsed === 'object' && parsed.id) {
            console.log('Found saved conversation:', parsed.id);
            savedConversation = parsed;
          }
        } catch (e) {
          console.error('Error parsing saved conversation:', e);
          localStorage.removeItem('currentConversation');
        }
      }

      if (!savedConversation) {
        console.log('No saved conversation found, creating new one');
        
        if (!userId) {
          throw new Error('User ID is required to create a conversation');
        }

        // 确保用户已登录
        if (!isAuthenticated) {
          throw new Error('请先登录后再开始对话');
        }

        const apiResponse = await ConversationAPI.createOrGetConversation({
          type: Types.DIAGNOSIS, 
          userId: userId,
          referenceId: '',
          messages: [],
        });

        console.log('API Response:', apiResponse);

        // 检查API响应是否包含必要的字段
        if (!apiResponse) {
          throw new Error('服务器未能创建对话，请稍后再试');
        }

        if (!apiResponse.id) {
          throw new Error('服务器响应缺少必要的对话ID，请联系管理员');
        }

        // 直接使用API返回的数据
        const conversation: Conversation = {
          id: apiResponse.id,
          type: Types.DIAGNOSIS,
          referenceId: apiResponse.referenceId || '',
          patientId: userId,
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
      } else {
        dispatch(setCurrentConversation(savedConversation));
        message.success({ content: '已恢复上次对话', key: 'initConversation' });
        
        return savedConversation;
      }
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
      
      // 现有会话保存到本地存储中
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
      
      // 清除当前会话
      localStorage.removeItem('currentConversation');
      
      if (!userId) {
        throw new Error('User ID is required to create a conversation');
      }

      // 创建新会话
      const apiResponse = await ConversationAPI.createOrGetConversation({
        type: Types.DIAGNOSIS,
        userId: userId,
        referenceId: '',
        messages: [],
      });

      if (apiResponse && apiResponse.id) {
        // 确保对象符合Conversation类型定义
        const conversation: Conversation = {
          id: apiResponse.id,
          type: Types.DIAGNOSIS,
          referenceId: apiResponse.referenceId || '',
          patientId: userId,
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
      } else {
        throw new Error('Failed to create conversation: Missing required fields in response');
      }
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
        // 创建一个空的会话对象，而不是传递null
        const emptyConversation: Conversation = {
          id: '',
          type: Types.DIAGNOSIS,
          messages: [],
          status: 'ACTIVE',
          startTime: new Date().toISOString(),
          conversationId: '',
          referenceId: '',
          patientId: '',
          consultationId: '',
        };
        dispatch(setCurrentConversation(emptyConversation));
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