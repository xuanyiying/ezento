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
import { AiRole } from '@/types/ai.role';

interface UseConversationManagementProps {
    userId?: string;
    isAuthenticated: boolean;
    aiRole: AiRole | undefined; // 允许 aiRole 为 undefined
}

export const useConversationManagement = ({ userId, isAuthenticated, aiRole }: UseConversationManagementProps) => {
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
            
            // 如果没有提供 aiRole，则无法初始化特定类型的会话
            if (!aiRole) {
                console.warn('初始化会话时未提供 aiRole，将尝试恢复或创建默认会话');
                // 这里可以添加逻辑来处理没有 aiRole 的情况，例如尝试恢复上一个会话
                // 或者如果需要强制选择角色，则抛出错误
                // throw new Error('AI role is required to initialize a conversation');
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
                            // 检查恢复的会话类型是否与当前期望的 aiRole 匹配（如果 aiRole 存在）
                            if (!aiRole || serverConversation.type === aiRole.type) {
                                dispatch(setCurrentConversation(serverConversation));
                                message.success({ content: '已恢复上次对话', key: 'initConversation' });
                                return serverConversation;
                            } else {
                                console.warn('恢复的会话类型与当前选择的角色不匹配，将创建新会话');
                                localStorage.removeItem('currentConversation'); // 清除不匹配的本地会话
                            }
                        }
                    }
                } catch (e) {
                    console.error('解析本地会话数据失败:', e);
                }
                // 清除无效的本地存储
                localStorage.removeItem('currentConversation');
            }

            // 3. 如果本地没有有效会话或服务器验证失败，并且提供了 aiRole，则创建新会话
            if (aiRole) {
                const initMessage = aiRole.description || '我是你专业的诊前AI医生，有什么问题和疑惑都可以问我，帮助您了解症状和可能的诊断。';
                const newConversationData = {
                    type: aiRole.type, // 使用传入的 aiRole 类型
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
                    type: aiRole.type,
                    userId: userId,
                    messages: apiResponse.messages || [],
                    status: apiResponse.status || 'ACTIVE',
                    startTime: apiResponse.startTime || new Date().toISOString(),
                    consultationId: apiResponse.consultationId || '',
                    initMessage: initMessage
                };

                dispatch(setCurrentConversation(conversation));
                localStorage.setItem('currentConversation', JSON.stringify(conversation));
                message.success({ content: '对话初始化成功', key: 'initConversation' });

                return conversation;
            } else {
                 // 如果没有 aiRole，并且无法恢复会话，则提示用户选择角色
                 message.info({ content: '请先选择一个服务类型以开始对话', key: 'initConversation', duration: 5 });
                 dispatch(setLoading(false)); // 取消加载状态
                 return null; // 返回 null 表示未成功初始化
            }

        } catch (error: any) {
            console.error('Error initializing conversation:', error);
            message.error({
                content: `对话初始化失败: ${error.message || '请刷新页面重试'}`, 
                key: 'initConversation',
                duration: 5
            });
            dispatch(setLoading(false)); // 确保错误时也取消加载
            return null;
        }
    }, [userId, isAuthenticated, aiRole, dispatch, message]); // 添加 aiRole 到依赖项

    // 创建新会话
    const createNewConversation = useCallback(async (selectedAiRole : AiRole) => { // 参数名改为 selectedAiRole 避免混淆
        try {
            // 显示加载状态
            message.loading({ content: '正在创建新会话...', key: 'createConversation' });

            if (!userId) {
                throw new Error('User ID is required to create a conversation');
            }
            
            // 确保传入了有效的 aiRole
            if (!selectedAiRole) {
                throw new Error('AI Role is required to create a new conversation');
            }

            // 创建新会话数据
            const newConversationData = {
                type: selectedAiRole.type,
                userId: userId,
                messages: [],
                initialMessage: selectedAiRole.description,
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
                type: selectedAiRole.type,
                messages: apiResponse.messages || [],
                status: apiResponse.status || 'ACTIVE',
                startTime: apiResponse.startTime || new Date().toISOString(),
                consultationId: apiResponse.consultationId || '',
                initMessage: selectedAiRole.description,
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
    const selectConversationById = useCallback(async (conversationId: string) => {
        try {
            // 显示加载状态
            message.loading({ content: '正在加载会话...', key: 'loadConversation' });

            // 从服务器获取完整的会话数据
            const conversation = await ConversationAPI.getConversation(conversationId);

            if (!conversation || !conversation.id) {
                throw new Error('无法加载会话，请重试');
            }

            // 更新Redux状态
            dispatch(setCurrentConversation(conversation));

            // 保存到本地存储
            localStorage.setItem('currentConversation', JSON.stringify(conversation));

            // 断开旧连接，连接到新会话
            wsService.disconnect();
            setTimeout(() => {
                wsService.connect(conversation.id);
                console.log('WebSocket连接已切换到会话:', conversation.id);
            }, 300);

            message.success({ content: '会话已加载', key: 'loadConversation' });
            return conversation;
        } catch (error: any) {
            console.error('选择会话失败:', error);
            message.error({ 
                content: `加载会话失败: ${error.message || '请重试'}`, 
                key: 'loadConversation' 
            });
            return null;
        }
    }, [dispatch, message, wsService]);

    // 发送消息
    const handleSendMessage = useCallback(async (content: string, conversationId: string) => {
        if (!content.trim()) {
            message.warning('消息内容不能为空');
            return;
        }

        if (!conversationId) {
            message.error('无法发送消息：未指定会话ID');
            return;
        }

        // 构造用户消息
        const userMessage = {
            id: `temp-${Date.now()}`,
            sender: 'user',
            content: content,
            timestamp: new Date().toISOString(),
        };

        // 立即更新UI，显示用户消息
        dispatch(addMessage({ conversationId, message: userMessage }));

        try {
            // 调用Redux action发送消息
            await dispatch(sendMessage({ conversationId, content }) as any);
            // 发送成功后通常由WebSocket接收AI回复，这里不需要额外操作
        } catch (error: any) {
            console.error('发送消息失败:', error);
            message.error(`发送消息失败: ${error.message || '请重试'}`);
            // 可选：如果发送失败，可以考虑从UI中移除临时消息或标记为失败
        }
    }, [dispatch, message]);

    // 删除会话
    const handleDeleteConversation = useCallback(async (idToDelete: string, currentConvId?: string) => {
        try {
            message.loading({ content: '正在删除会话...', key: 'deleteConversation' });
            await dispatch(deleteConversation(idToDelete) as any);

            // 如果删除的是当前会话，则清空当前会话状态并尝试加载其他会话或提示创建
            if (idToDelete === currentConvId) {
                dispatch(setCurrentConversation(null));
                localStorage.removeItem('currentConversation');
                wsService.disconnect();
                // 尝试加载最新的会话（如果还有的话）
                if (userId) {
                    await dispatch(fetchUserConversations(userId) as any);
                    // 这里可以添加逻辑来自动选择一个会话，或者留空让用户选择/创建
                }
            } else {
                // 如果删除的不是当前会话，只需刷新列表
                 if (userId) {
                    await dispatch(fetchUserConversations(userId) as any);
                 }
            }

            message.success({ content: '会话已删除', key: 'deleteConversation' });
        } catch (error: any) {
            console.error('删除会话失败:', error);
            message.error({ 
                content: `删除会话失败: ${error.message || '请重试'}`, 
                key: 'deleteConversation' 
            });
        }
    }, [dispatch, message, userId, wsService]);

    // 重命名会话（假设有API支持）
    const renameConversation = useCallback(async (id: string, newTitle: string) => {
        try {
            message.loading({ content: '正在重命名会话...', key: 'renameConversation' });
            // 假设 updateConversation action 可以处理重命名
            await dispatch(renameConversation({ id,  newTitle }) as any);
            // 如果重命名的是当前会话，更新本地存储
            if (currentConversation?.id === id) {
                const updatedConversation = { ...currentConversation, title: newTitle };
                dispatch(setCurrentConversation(updatedConversation));
                localStorage.setItem('currentConversation', JSON.stringify(updatedConversation));
            }
            message.success({ content: '会话已重命名', key: 'renameConversation' });
        } catch (error: any) {
            console.error('重命名会话失败:', error);
            message.error({ 
                content: `重命名会话失败: ${error.message || '请重试'}`, 
                key: 'renameConversation' 
            });
        }
    }, [dispatch, message, currentConversation]);

    // WebSocket消息处理
    useEffect(() => {
        const handleWsMessage = (event: MessageEvent) => {
            try {
                const data = JSON.parse(event.data);
                console.log('收到WebSocket消息:', data);

                // 检查是否是AI消息
                if (data.type === 'ai_message' && data.payload && data.payload.conversationId === currentConversation?.id) {
                    const aiMessage = {
                        id: data.payload.id || `ai-${Date.now()}`,
                        sender: 'ai',
                        content: data.payload.content,
                        timestamp: data.payload.timestamp || new Date().toISOString(),
                        // 可以添加其他需要的字段，如 citations, suggestions 等
                    };
                    dispatch(addMessage({ conversationId: data.payload.conversationId, message: aiMessage }));
                } else if (data.type === 'error') {
                    // 处理WebSocket错误消息
                    message.error(`服务器错误: ${data.message || '未知错误'}`);
                }
                // 可以根据需要处理其他类型的WebSocket消息

            } catch (error) {
                console.error('处理WebSocket消息失败:', error);
            }
        };

        wsService.addMessageHandler(handleWsMessage);

        // 组件卸载时移除处理器
        return () => {
            wsService.removeMessageHandler(handleWsMessage);
        };
    }, [wsService, dispatch, currentConversation?.id, message]);

    // WebSocket连接管理
    useEffect(() => {
        if (currentConversation?.id) {
            // 如果当前有会话，确保WebSocket连接
            if (!wsService.isConnected()) {
                wsService.connect(currentConversation.id);
                console.log('WebSocket连接已建立到会话:', currentConversation.id);
            }
        } else {
            // 如果没有当前会话，断开连接
            wsService.disconnect();
            console.log('WebSocket连接已断开');
        }

        // 组件卸载时确保断开连接
        return () => {
            wsService.disconnect();
        };
    }, [currentConversation?.id, wsService]);

    return {
        conversations,
        currentConversation,
        loading,
        initializeConversation,
        createNewConversation,
        selectConversationById,
        handleSendMessage, // 重命名为 handleSendMessage 以区分 Redux action
        deleteConversation: handleDeleteConversation, // 重命名
        renameConversation,
    };
};