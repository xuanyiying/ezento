import { useCallback, useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { App } from 'antd';
import { 
    addMessage, 
    setCurrentConversation, 
    setLoading, 
    fetchUserConversations, 
    createConversation,
    updateConversation,
    sendMessage,
    deleteConversation,
} from '@/store/slices/conversationSlice';
import { ConversationAPI } from '@/services/conversation';
import {Conversation } from '@/types/conversation';
import WebSocketService from '@/services/websocket';
import { RootState } from '@/store';
import { AiRoleType } from '@/types/ai.role';

interface UseConversationManagementProps {
    userId?: string;
    isAuthenticated: boolean;
}

export const useConversationManagement = ({ userId, isAuthenticated }: UseConversationManagementProps) => {
    const dispatch = useDispatch();
    const { message } = App.useApp();
    const wsService = WebSocketService.getInstance();
    const conversations = useSelector((state: RootState) => state.conversation.conversations);
    const currentConversation = useSelector((state: RootState) => state.conversation.currentConversation);
    const loading = useSelector((state: RootState) => state.conversation.loading);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    // 处理错误消息
    useEffect(() => {
        if (errorMessage) {
            message.error(errorMessage);
            setErrorMessage(null);
        }
    }, [errorMessage, message]);

    // 初始化会话
    const initializeConversation = useCallback(async () => {
        try {
            // 设置全局loading状态
            dispatch(setLoading(true));
            // 设置局部loading状态
            message.loading({ content: '正在初始化对话...', key: 'initConversation', duration: 0 });

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
            const initMessage = '我是你专业的诊前AI医生，有什么问题和疑惑都可以问我，帮助您了解症状和可能的诊断。';
            const newConversationData = {
                type: type,
                userId: userId,
                messages: [],
                initialMessage: initMessage
            };
            
            // 使用Redux action创建会话
            const result = await dispatch(createConversation(newConversationData) as any);
            const apiResponse = result.payload;

            if (!apiResponse || !apiResponse.id) {
                throw new Error('服务器创建会话失败，请稍后再试');
            }

            const conversation: Conversation = {
                id: apiResponse.id,
                type: type,
                userId: userId,
                messages: apiResponse.messages || [],
                status: apiResponse.status || 'ACTIVE',
                startTime: apiResponse.startTime || new Date().toISOString(),
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
    const createNewConversation = useCallback(async (type: AiRoleType = AiRoleType.DIAGNOSIS) => {
        try {
            // 显示加载状态
            message.loading({ content: '正在创建新会话...', key: 'createConversation' });

            if (!userId) {
                throw new Error('User ID is required to create a conversation');
            }

            // 根据类型选择合适的初始消息
            let initMessage = '';
            if (type === AiRoleType.DIAGNOSIS) {
                initMessage = '我是你专业的诊前AI医生，有什么问题和疑惑都可以问我，帮助您了解症状和可能的诊断。';
            } else if (type === AiRoleType.GUIDE) {
                initMessage = '我是您的智能导诊助手，请告诉我您的症状，我将帮您找到合适的科室和医生。';
            } else if (type === AiRoleType.REPORT) {
                initMessage = '我是您的报告解读助手，请上传您的医学检查报告，我将帮您解读报告内容。';
            }

            // 创建新会话数据
            const newConversationData = {
                type,
                userId: userId,
                messages: [],
                initialMessage: initMessage,
            };

            // 使用Redux action创建会话
            const result = await dispatch(createConversation(newConversationData) as any);
            const apiResponse = result.payload;

            if (!apiResponse || !apiResponse.id) {
                throw new Error('Failed to create conversation: Missing required fields in response');
            }

            // 确保对象符合Conversation类型定义
            const conversation: Conversation = {
                id: apiResponse.id,
                userId: userId,
                type: type,
                messages: apiResponse.messages || [],
                status: apiResponse.status || 'ACTIVE',
                startTime: apiResponse.startTime || new Date().toISOString(),
                consultationId: apiResponse.consultationId || '',
            };

            // 更新Redux状态
            dispatch(setCurrentConversation(conversation));

            // 保存新会话到本地存储
            localStorage.setItem('currentConversation', JSON.stringify(conversation));

            // 断开之前的WebSocket连接并建立新连接
            wsService.disconnect();

            // 使用setTimeout确保连接动作在断开后执行
            setTimeout(() => {
                wsService.connect(conversation.id);
                console.log('WebSocket连接已建立到会话:', conversation.id);
            }, 300);

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
        try {
            // 从 Redux store 中获取会话
            const conversation = conversations.find((conv: Conversation) => conv.id === conversationId);

            if (conversation) {
                return selectConversation(conversation);
            } else {
                // 如果在 Redux store 中找不到会话，尝试重新获取会话列表
                if (userId) {
                    setErrorMessage('无法获取指定会话');
                    dispatch(fetchUserConversations(userId) as any);
                } else {
                    setErrorMessage('无法获取会话列表：用户ID未定义');
                }
            }
        } catch (error) {
            console.error('选择会话失败:', error);
            setErrorMessage('加载会话失败，请重试');
        }
        return null;
    }, [selectConversation, conversations, dispatch, setErrorMessage, userId]);

    // 删除会话
    const handleDeleteConversation = useCallback(async (id: string, currentConversationId?: string) => {
        try {
            message.loading({ content: '正在删除会话...', key: 'deleteConversation' });

            // 如果要删除的是当前会话，先清除当前会话数据
            if (currentConversationId === id) {
                localStorage.removeItem('currentConversation');
            }
            
            // 调用Redux动作删除服务器上的会话
            await dispatch(deleteConversation(id) as any);
            
            // 触发 storage 事件，使侧边栏更新
            window.dispatchEvent(new Event('storage'));

           // message.success({ content: '会话已删除', key: 'deleteConversation' });
            return true;
        } catch (error: any) {
            console.error('删除会话失败:', error);
            message.error({
                content: `删除会话失败: ${error.message || '请重试'}`,
                key: 'deleteConversation'
            });
            return false;
        }
    }, [message, dispatch]);

    // 发送消息
    const handleSendMessage = useCallback((content: string, conversationId: string) => {
        try {
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

            // 发送消息到服务器
            dispatch(sendMessage({ content, conversationId }) as any);

            // 延迟更新 localStorage，避免频繁写入
            setTimeout(() => {
                const currentConversationJson = localStorage.getItem('currentConversation');
                if (currentConversationJson) {
                    try {
                        const currentConversation = JSON.parse(currentConversationJson);
                        if (currentConversation && currentConversation.id) {
                            localStorage.setItem(`currentConversation`, currentConversationJson);
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
        deleteConversation: handleDeleteConversation,
        sendMessage: handleSendMessage,
        conversations,
        currentConversation,
        isLoading: loading,
        loadConversations: (userId: string) => dispatch(fetchUserConversations(userId) as any),
        updateConversationTitle: (id: string, title: string) => 
            dispatch(updateConversation({ id, changes: { title } }) as any)
    };
};

export default useConversationManagement;