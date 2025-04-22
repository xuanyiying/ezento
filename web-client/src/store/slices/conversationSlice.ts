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

// 从localStorage获取会话数据
const getInitialConversationState = (): ConversationState => {
    try {
        const savedConversationsJson = localStorage.getItem('conversations');
        const savedCurrentConversationJson = localStorage.getItem('currentConversation');

        let conversations: Conversation[] = [];
        let currentConversation: Conversation | null = null;

        if (savedConversationsJson) {
            try {
                const parsed = JSON.parse(savedConversationsJson);
                if (Array.isArray(parsed)) {
                    conversations = parsed;
                }
            } catch (e) {
                console.error('解析本地会话列表失败:', e);
                localStorage.removeItem('conversations');
            }
        }

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
            conversations,
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

// 添加消息去重检查函数
const isDuplicateMessage = (existingMessage: Message, newMessage: Message): boolean => {
  // 如果有ID，优先使用ID比较
  if (existingMessage.id && newMessage.id) {
    return existingMessage.id === newMessage.id;
  }
  // 否则比较内容和角色
  return existingMessage.content === newMessage.content && 
         existingMessage.role === newMessage.role &&
         Math.abs(new Date(existingMessage.timestamp).getTime() - new Date(newMessage.timestamp).getTime()) < 1000;
};

// 添加批量更新标记
let isBatchUpdating = false;
let pendingUpdates: Message[] = [];

// 创建批量更新函数
const processBatchUpdates = (state: ConversationState) => {
  if (pendingUpdates.length === 0) return;

  const updates = [...pendingUpdates];
  pendingUpdates = [];

  updates.forEach(message => {
    if (!state.currentConversation) return;

    // 检查消息是否已存在
    const isDuplicate = state.currentConversation.messages.some(
      existingMsg => isDuplicateMessage(existingMsg, message)
    );

    if (!isDuplicate) {
      state.currentConversation.messages.push(message);
    }
  });

  // 更新会话列表中的当前会话
  if (state.currentConversation) {
    const index = state.conversations.findIndex(conv => 
      conv.id === state.currentConversation?.id
    );
    
    if (index !== -1) {
      state.conversations[index] = state.currentConversation;
    } else {
      // 如果会话不在列表中，添加到列表
      state.conversations.push(state.currentConversation);
    }
  }

  // 这里不再需要返回新状态，因为我们已经直接修改了state
  try {
    localStorage.setItem('currentConversation', JSON.stringify(state.currentConversation));
    localStorage.setItem('conversations', JSON.stringify(state.conversations));
  } catch (error) {
    console.error('Error updating localStorage:', error);
  }
};

// 修改 reducer
export const conversationSlice = createSlice({
  name: 'conversation',
  initialState,
  reducers: {
    setConversations: (state, action: PayloadAction<Conversation[]>) => {
      state.conversations = action.payload;
      state.lastFetchTime = Date.now(); // 更新最后获取时间
      // 保存到localStorage
      localStorage.setItem('conversations', JSON.stringify(action.payload));
    },
    setCurrentConversation: (state, action: PayloadAction<Conversation>) => {
      state.currentConversation = action.payload;
      // 保存到localStorage
      localStorage.setItem('currentConversation', JSON.stringify(action.payload));
    },
    addMessage: {
      reducer: (state, action: PayloadAction<Message>) => {
        if (!state.currentConversation) return;

        // 将消息添加到待处理队列
        pendingUpdates.push(action.payload);

        // 如果不是批量更新模式，立即处理更新
        if (!isBatchUpdating) {
          processBatchUpdates(state);
        }
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
      // 清除localStorage中的会话数据
      localStorage.removeItem('conversations');
      localStorage.removeItem('currentConversation');
    },
    toggleFavoriteLocal: (state, action: PayloadAction<string>) => {
      const conversationId = action.payload;
      const conversationIndex = state.conversations.findIndex(c => c.id === conversationId);
        
      if (conversationIndex !== -1) {
        // Toggle the favorite status
        const isFavorite = state.conversations[conversationIndex].favorite || false;
        state.conversations[conversationIndex].favorite = !isFavorite;
            
        // If the current conversation is being updated, also update it
        if (state.currentConversation && state.currentConversation.id === conversationId) {
          state.currentConversation.favorite = !isFavorite;
          localStorage.setItem('currentConversation', JSON.stringify(state.currentConversation));
        }
            
        // Update localStorage
        localStorage.setItem('conversations', JSON.stringify(state.conversations));
        
        // 更新时间戳
        const now = new Date().toISOString();
        state.conversations[conversationIndex].updateTime = now;
        if (state.currentConversation && state.currentConversation.id === conversationId) {
          state.currentConversation.updateTime = now;
        }
      }
    },
    renameConversationLocal: (state, action: PayloadAction<{ id: string; title: string }>) => {
      const { id, title } = action.payload;
      const conversationIndex = state.conversations.findIndex(c => c.id === id);
            
      if (conversationIndex !== -1) {
        // Update the title
        state.conversations[conversationIndex].title = title;
        
        // 更新时间戳
        const now = new Date().toISOString();
        state.conversations[conversationIndex].updateTime = now;
        
        // If the current conversation is being updated, also update it
        if (state.currentConversation && state.currentConversation.id === id) {
          state.currentConversation.title = title;
          state.currentConversation.updateTime = now;
          localStorage.setItem('currentConversation', JSON.stringify(state.currentConversation));
        }
            
        // Update localStorage
        localStorage.setItem('conversations', JSON.stringify(state.conversations));
      }
    },
    removeConversation: (state, action: PayloadAction<string>) => {
      const conversationId = action.payload;
      state.conversations = state.conversations.filter(c => c.id !== conversationId);
            
      // 如果当前会话被删除，清空当前会话
      if (state.currentConversation && state.currentConversation.id === conversationId) {
        state.currentConversation = null;
        localStorage.removeItem('currentConversation');
      }
            
      // 更新localStorage
      localStorage.setItem('conversations', JSON.stringify(state.conversations));
            
      // 同时删除会话的本地存储
      localStorage.removeItem(`conversation_${conversationId}`);
    },
    // 添加更新最后获取时间的 action
    updateLastFetchTime: (state) => {
      state.lastFetchTime = Date.now();
    },
    // 添加批量更新 actions
    startBatchUpdate: (_state) => {
      isBatchUpdating = true;
    },
    endBatchUpdate: (state) => {
      isBatchUpdating = false;
      processBatchUpdates(state);
    },
  },
});

// 导出 actions
export const {
  setCurrentConversation,
  setConversations,
  removeConversation,
  startBatchUpdate,
  endBatchUpdate,
  updateLastFetchTime,
  setLoading,
  setError,
  addMessage,
  clearConversations,
  toggleFavoriteLocal,
  renameConversationLocal,
} = conversationSlice.actions;

// 创建自定义的异步action creator
export const fetchUserConversations = () => async (dispatch: any) => {
  try {
    dispatch(setLoading(true));
    dispatch(setError(null));
    
    // 先从本地存储获取数据
    const savedConversationsJson = localStorage.getItem('conversations');
    let conversations: Conversation[] = [];
    
    if (savedConversationsJson) {
      try {
        const parsed = JSON.parse(savedConversationsJson);
        if (Array.isArray(parsed)) {
          conversations = parsed;
          console.log('从本地存储加载会话列表成功');
          dispatch(setConversations(conversations));
          dispatch(setLoading(false));
          return conversations;
        }
      } catch (e) {
        console.error('解析本地存储的会话数据失败:', e);
      }
    }
    
    // 如果本地没有数据，从服务器获取
    console.log('从服务器获取会话列表...');
    const serverConversations = await ConversationAPI.getUserConversations();
    
    // 更新Redux存储和本地存储
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
