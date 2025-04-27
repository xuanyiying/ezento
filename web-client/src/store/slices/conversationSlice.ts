import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Conversation, Message } from '@/types/conversation';
import { ConversationAPI } from '@/services/conversation';

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

// 修改 reducer
export const conversationSlice = createSlice({
    name: 'conversation',
    initialState,
    reducers: {
        setConversations: (state, action: PayloadAction<Conversation[]>) => {
            state.conversations = action.payload;
            state.lastFetchTime = Date.now(); // 更新最后获取时间
            // 不再保存会话列表到localStorage
        },
        setCurrentConversation: (state, action: PayloadAction<Conversation>) => {
            state.currentConversation = action.payload;
            // 保存到localStorage
            localStorage.setItem('currentConversation', JSON.stringify(action.payload));
        },
        addMessage: {
            reducer: (state, action: PayloadAction<Message>) => {
                if (!state.currentConversation) return;
                state.currentConversation.messages.push(action.payload);
            },
            prepare: (message: Message) => {
                return { payload: message };
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
        }
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
export const fetchUserConversations = () => async (dispatch: any) => {
    try {
        dispatch(setLoading(true));
        dispatch(setError(null));

        // 直接从服务器获取会话列表数据
        console.log('从服务器获取会话列表...');
        const serverConversations = await ConversationAPI.getUserConversations();

        // 更新Redux存储
        dispatch(setConversations(serverConversations));
        dispatch(setLoading(false));
        return serverConversations;

    } catch (error) {
        console.error('获取用户会话列表失败:', error);
        dispatch(setError('获取用户会话列表失败'));
        dispatch(setLoading(false));
        return [];
    }
};



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
    } catch (error) {
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
export const renameConversation =
    ({ id, title }: { id: string; title: string }) =>
        async (dispatch: any, getState: any) => {
            try {
                dispatch(setLoading(true));

                // 获取最新状态
                const state = getState().conversation as ConversationState;
                const conversation = state.conversations.find(c => c.id === id);

                if (!conversation) {
                    dispatch(setLoading(false));
                    return;
                }

                // 更新本地状态
                dispatch(renameConversationLocal({ id, title }));

                // 然后更新服务器
                try {
                    await ConversationAPI.renameConversation(id, title);
                    console.log(`会话 ${id} 重命名已同步到服务器: ${title}`);
                } catch (error) {
                    console.error('更新会话标题到服务器失败:', error);
                    // 即使服务器更新失败，也保留本地更改
                }

                dispatch(setLoading(false));
            } catch (error) {
                console.error('重命名会话失败:', error);
                dispatch(setError('重命名会话失败'));
                dispatch(setLoading(false));
            }
        };

export default conversationSlice.reducer;
