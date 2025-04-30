import { createSlice, PayloadAction, createAsyncThunk } from '@reduxjs/toolkit';
import { Conversation, Message, Types } from '@/types/conversation';
import { ConversationAPI } from '@/services/conversation';
import MessageAPI from '@/services/message';

// 添加缺失的导入
interface RootState {
    conversation: ConversationState;
}

// 定义WebSocket URL常量
const WS_URL = process.env.NODE_ENV === 'production'
    ? `${window.location.protocol === 'https:' ? 'wss:' : 'ws:'}//${window.location.host}/ws`
    : 'ws://localhost:3000/ws';

// 定义创建会话的接口
export interface NewConversationData {
    type: Types;
    userId: string;
    initialMessage?: string;
    messages?: Message[];
}

interface ConversationState {
    conversations: Conversation[];
    currentConversation: Conversation | null;
    loading: boolean;
    error: string | null;
    lastFetchTime: number | null; // 添加最后一次获取时间状态
}

// 从localStorage获取当前会话数据，会话列表不再从本地存储获取
const getInitialConversationState = (): ConversationState => {
    try {
        const savedCurrentConversationJson = localStorage.getItem('currentConversation');
        let currentConversation: Conversation | null = null;

        if (savedCurrentConversationJson) {
            try {
                const parsed = JSON.parse(savedCurrentConversationJson);
                if (parsed && typeof parsed === 'object' && parsed.id) {
                    currentConversation = parsed;
                }
            } catch (e) {
                console.error('解析当前会话失败:', e);
                localStorage.removeItem('currentConversation');
            }
        }

        return {
            conversations: [], // 会话列表初始为空，将通过useEffect从服务端加载
            currentConversation,
            loading: false,
            error: null,
            lastFetchTime: null
        };
    } catch (error) {
        console.error('从本地存储加载会话数据失败:', error);
        return {
            conversations: [],
            currentConversation: null,
            loading: false,
            error: null,
            lastFetchTime: null
        };
    }
};

const initialState: ConversationState = getInitialConversationState();

// 异步action创建器
export const fetchConversations = createAsyncThunk(
    'conversation/fetchConversations',
    async (userId: string, { dispatch, rejectWithValue }) => {
        try {
            dispatch(setLoading(true));
            const conversations = await ConversationAPI.getUserConversations(userId);
            return conversations;
        } catch (error: any) {
            return rejectWithValue(error.message || 'Failed to fetch conversations');
        } finally {
            dispatch(setLoading(false));
        }
    }
);

// 在conversationSlice.ts中添加缓存逻辑
export const fetchMessages = createAsyncThunk(
    'conversation/fetchMessages',
    async ({conversationId, forceRefresh = false}: {conversationId: string, forceRefresh?: boolean}, 
          {getState, rejectWithValue}) => {
        try {
            // 检查缓存是否有效
            const state = getState() as RootState;
            const conversation = state.conversation.conversations.find((c: Conversation) => c.id === conversationId);
            
            // 如果已有缓存且不强制刷新，直接使用缓存
            if (conversation?.messages && !forceRefresh) {
                return conversation.messages;
            }
            
            // 否则发起请求
            return await MessageAPI.getByConversation(conversationId);
        } catch (error: any) {
            return rejectWithValue(error.message);
        }
    }
);

// 添加缺失的函数
export const updateConversationInList = (conversation: Conversation) => ({
    type: 'conversation/updateConversationInList',
    payload: conversation
});

// 添加创建会话的异步action
export const createConversation = createAsyncThunk(
    'conversation/createConversation',
    async (data: NewConversationData, { rejectWithValue }) => {
        try {
            const result = await ConversationAPI.createConversation({
                type: data.type,
                userId: data.userId,
                messages: data.messages || [],
                initialMessage: data.initialMessage
            });
            return result;
        } catch (error: any) {
            return rejectWithValue(error.message || 'Failed to create conversation');
        }
    }
);

// 添加更新会话的异步action
export const updateConversation = createAsyncThunk(
    'conversation/update',
    async ({ id, changes }: { id: string, changes: Partial<Conversation> }, { getState, rejectWithValue }) => {
        try {
            await ConversationAPI.updateConversation(id, changes);
            
            // Get current state
            const state = getState() as RootState;
            
            // Find the conversation in the current state
            const existingConversation = state.conversation.conversations.find(conv => conv.id === id);
            
            // Return the updated conversation object
            if (existingConversation) {
                // Return merged conversation
                return { ...existingConversation, ...changes };
            }
            
            // If conversation not found, fetch it
            return await ConversationAPI.getConversation(id);
        } catch (error: any) {
            return rejectWithValue(error.message);
        }
    }
);

// 添加发送消息的异步action
export const sendMessage = createAsyncThunk(
    'conversation/sendMessage',
    async ({ content, conversationId }: { content: string, conversationId: string }, { rejectWithValue }) => {
        try {
            const response = await MessageAPI.sendMessage(conversationId, content);
            return response;
        } catch (error: any) {
            return rejectWithValue(error.message || 'Failed to send message');
        }
    }
);

// 在conversationSlice.ts中添加WebSocket处理
export const startWebSocketConnection = createAsyncThunk(
    'conversation/startWebSocket',
    async (userId: string, {dispatch}) => {
        const socket = new WebSocket(`${WS_URL}/conversations?userId=${userId}`);
        
        socket.onmessage = (event) => {
            const data = JSON.parse(event.data);
            
            // 根据不同事件类型分发不同action
            switch (data.type) {
                case 'NEW_MESSAGE':
                    dispatch(addMessage(data.payload));
                    break;
                case 'CONVERSATION_UPDATED':
                    dispatch(updateConversationInList(data.payload));
                    break;
                // 其他事件处理...
            }
        };
        
        return socket;
    }
);

// 修改 reducer
const conversationSlice = createSlice({
    name: 'conversation',
    initialState,
    reducers: {
        setConversations: (state, action: PayloadAction<Conversation[]>) => {
            state.conversations = action.payload;
            state.lastFetchTime = Date.now(); // 更新最后获取时间
            // 不再保存会话列表到localStorage
        },
        setCurrentConversation: (state, action: PayloadAction<Conversation | null>) => {
            state.currentConversation = action.payload;
            // 保存到localStorage
            localStorage.setItem('currentConversation', JSON.stringify(action.payload));
        },
        addMessage: (state, action: PayloadAction<Message>) => {
            if (state.currentConversation) {
                state.currentConversation.messages = [
                    ...state.currentConversation.messages,
                    action.payload
                ];
            }
        },
        setLoading: (state, action: PayloadAction<boolean>) => {
            state.loading = action.payload;
        },
        setError: (state, action: PayloadAction<string | null>) => {
            state.error = action.payload;
        },
        clearConversations: state => {
            state.conversations = [];
            state.currentConversation = null;
            localStorage.removeItem('currentConversation');
        },
        toggleFavoriteLocal: (state, action: PayloadAction<string>) => {
            const conversationId = action.payload;
            state.conversations = state.conversations.map(conv => 
                conv.id === conversationId 
                    ? { ...conv, favorite: !conv.favorite } 
                    : conv
            );

            // 如果是当前会话，也更新currentConversation
            if (state.currentConversation && state.currentConversation.id === conversationId) {
                state.currentConversation = {
                    ...state.currentConversation,
                    favorite: !state.currentConversation.favorite
                };
            }
        },
        renameConversationLocal: (state, action: PayloadAction<{ id: string; title: string }>) => {
            const { id, title } = action.payload;
            // 更新会话列表中的标题
            state.conversations = state.conversations.map(conv => 
                conv.id === id ? { ...conv, title } : conv
            );

            // 如果是当前会话，也更新currentConversation
            if (state.currentConversation && state.currentConversation.id === id) {
                state.currentConversation = {
                    ...state.currentConversation,
                    title
                };
            }
        },
        removeConversation: (state, action: PayloadAction<string>) => {
            const conversationId = action.payload;
            state.conversations = state.conversations.filter(conv => conv.id !== conversationId);
        },
        // 添加对updateConversationInList的处理
        updateConversationInList: (state, action: PayloadAction<{ id: string, changes: Partial<Conversation> }>) => {
            const { id, changes } = action.payload;
            const index = state.conversations.findIndex(c => c.id === id);
            if (index !== -1) {
                state.conversations[index] = { ...state.conversations[index], ...changes };
            }
            
            // 如果是当前会话，也更新currentConversation
            if (state.currentConversation && state.currentConversation.id === id) {
                state.currentConversation = { ...state.currentConversation, ...changes };
            }
        }
    },
    extraReducers: (builder) => {
        // 处理异步action
        builder
            .addCase(fetchConversations.fulfilled, (state, action) => {
                state.conversations = action.payload;
                state.loading = false;
                state.lastFetchTime = Date.now();
            })
            .addCase(fetchConversations.rejected, (state, action) => {
                state.error = action.payload as string || 'Failed to fetch conversations';
                state.loading = false;
            })
            .addCase(createConversation.pending, (state) => {
                state.loading = true;
            })
            .addCase(createConversation.fulfilled, (state, action) => {
                state.loading = false;
                state.conversations = [action.payload, ...state.conversations];
                state.currentConversation = action.payload;
            })
            .addCase(createConversation.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload as string || 'Failed to create conversation';
            })
            .addCase(updateConversation.fulfilled, (state, action) => {
                const updatedConv = action.payload;
                // Only update if we have a valid conversation object
                if (updatedConv && typeof updatedConv === 'object' && updatedConv.id) {
                    state.conversations = state.conversations.map(conv => 
                        conv.id === updatedConv.id ? updatedConv : conv
                    );
                    
                    if (state.currentConversation && state.currentConversation.id === updatedConv.id) {
                        state.currentConversation = updatedConv;
                    }
                }
            })
            .addCase(sendMessage.pending, (state) => {
                // 可以在这里设置消息发送状态
            })
            .addCase(sendMessage.fulfilled, (state, action) => {
                // 消息发送成功处理
            })
            .addCase(sendMessage.rejected, (state, action) => {
                state.error = action.payload as string || 'Failed to send message';
            });
    }
});

// 导出 actions
export const {
    setCurrentConversation,
    setConversations,
    removeConversation,
    setLoading,
    setError,
    addMessage,
    clearConversations,
    toggleFavoriteLocal,
    renameConversationLocal
} = conversationSlice.actions;

// 创建自定义的异步action creator
export const fetchUserConversations = createAsyncThunk(
    'conversation/fetchUserConversations',
    async (userId: string, { dispatch }) => {
        try {
            dispatch(setLoading(true));
            const conversations = await ConversationAPI.getUserConversations(userId);
            dispatch(setConversations(conversations));
            return conversations;
        } catch (error: any) {
            console.error('Failed to fetch conversations:', error);
            throw error;
        } finally {
            dispatch(setLoading(false));
        }
    }
);

// 创建删除会话的异步 action creator
export const deleteConversation = (conversationId: string) => async (dispatch: any, getState: any) => {
    try {
        // 获取当前状态
        const state = getState().conversation as ConversationState;

        // 检查是否为当前会话
        if (state.currentConversation && state.currentConversation.id === conversationId) {
            dispatch(setError('不能删除当前正在进行的会话'));
            return false;
        }

        dispatch(setLoading(true));

        // 调用服务端 API 删除会话
        await ConversationAPI.deleteConversation(conversationId);

        // 删除成功后，从本地状态中移除会话
        dispatch(removeConversation(conversationId));

        // 清除localStorage中的相关数据
        localStorage.removeItem(`conversation_${conversationId}`);

        dispatch(setLoading(false));
        return true;
    } catch (error: any) {
        console.error('删除会话失败:', error);
        dispatch(setError('删除会话失败'));
        dispatch(setLoading(false));
        return false;
    }
};

// 异步收藏/取消收藏会话
export const toggleFavorite = (conversationId: string) => async (dispatch: any, getState: any) => {
    try {
        dispatch(setLoading(true));

        // 获取当前会话状态
        const state = getState().conversation as ConversationState;
        const conversation = state.conversations.find(c => c.id === conversationId);

        if (!conversation) {
            dispatch(setLoading(false));
            return;
        }

        // 切换收藏状态
        const newFavoriteState = !conversation.favorite;

        // 先更新本地状态
        dispatch(toggleFavoriteLocal(conversationId));

        // 然后尝试更新服务器
        try {
            // 调用API更新收藏状态
            await ConversationAPI.updateConversation(conversationId, {
                favorite: newFavoriteState
            });
            console.log(`会话 ${conversationId} 收藏状态已同步到服务器: ${newFavoriteState}`);
        } catch (error) {
            console.error('更新收藏状态到服务器失败:', error);
            // 即使服务器更新失败，我们也保留本地更改，以便下次同步时能解决
        }

        dispatch(setLoading(false));
    } catch (error) {
        console.error('切换收藏状态失败:', error);
        dispatch(setError('切换收藏状态失败'));
        dispatch(setLoading(false));
    }
};

// 异步重命名会话
export const renameConversation = createAsyncThunk(
    'conversation/renameConversation',
    async ({ id, title }: { id: string, title: string }, { rejectWithValue }) => {
        try {
            await ConversationAPI.updateConversation(id, { title });
            return { id, title };
        } catch (error: any) {
            return rejectWithValue(error.message || 'Failed to rename conversation');
        }
    }
);

export default conversationSlice.reducer;
