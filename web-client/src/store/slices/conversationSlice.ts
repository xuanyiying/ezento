import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Conversation, Message } from '@/types/conversation';
import { ConversationAPI } from '@/services/conversation';
import { Types } from '@/types/conversation';

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

        if (
            savedConversationsJson &&
            savedConversationsJson !== 'undefined' &&
            savedConversationsJson !== 'null'
        ) {
            try {
                const parsed = JSON.parse(savedConversationsJson);
                if (Array.isArray(parsed)) {
                    conversations = parsed;
                }
            } catch (e) {
                console.error('Error parsing saved conversations:', e);
                localStorage.removeItem('conversations');
            }
        }

        if (
            savedCurrentConversationJson &&
            savedCurrentConversationJson !== 'undefined' &&
            savedCurrentConversationJson !== 'null'
        ) {
            try {
                const parsed = JSON.parse(savedCurrentConversationJson);
                if (parsed && typeof parsed === 'object' && parsed.id) {
                    currentConversation = parsed;
                }
            } catch (e) {
                console.error('Error parsing saved current conversation:', e);
                localStorage.removeItem('currentConversation');
            }
        }

        return {
            conversations,
            currentConversation,
            loading: false,
            error: null,
            lastFetchTime: null, // 初始化为 null
        };
    } catch (error) {
        console.error('Error loading conversations from localStorage:', error);
        return {
  conversations: [],
  currentConversation: null,
  loading: false,
            error: null,
            lastFetchTime: null, // 初始化为 null
        };
    }
};

const initialState: ConversationState = getInitialConversationState();

// 缓存有效期（毫秒）- 增加到60分钟
const CACHE_DURATION = 60 * 60 * 1000;

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

// 创建自定义的异步action creator - 替代之前的thunk
export const fetchUserConversations = () => async (dispatch: any, getState: any) => {
  try {
    dispatch(setLoading(true));
    dispatch(setError(null));
    
    // 获取当前状态
    const state = getState().conversation as ConversationState;
    const { lastFetchTime } = state;
    const now = Date.now();

    // 检查缓存是否有效
    if (lastFetchTime && now - lastFetchTime < CACHE_DURATION) {
      console.log('使用缓存数据，上次获取时间:', new Date(lastFetchTime).toLocaleTimeString());
      // 如果缓存有效，可以直接使用现有数据，但仍然在后台同步
      const serverConversations = await ConversationAPI.getUserConversations();
      
      // 检查本地存储
      const savedConversationsJson = localStorage.getItem('conversations');
      let localConversations: Conversation[] = [];
      
      if (savedConversationsJson && savedConversationsJson !== 'undefined' && savedConversationsJson !== 'null') {
        try {
          const parsed = JSON.parse(savedConversationsJson);
          if (Array.isArray(parsed) && parsed.length > 0) {
            localConversations = parsed;
          }
        } catch (e) {
          console.error('解析本地存储的会话数据失败:', e);
        }
      }
      
      // 合并服务器和本地数据
      const mergedConversations = mergeConversations(serverConversations, localConversations);
      
      // 更新Redux存储
      dispatch(setConversations(mergedConversations));
      dispatch(updateLastFetchTime());
      dispatch(setLoading(false));
      return mergedConversations;
    }
    
    // 如果缓存已过期，强制刷新
    console.log('从API获取用户会话列表并同步...');
    const serverConversations = await ConversationAPI.getUserConversations();
    
    // 检查本地存储
    const savedConversationsJson = localStorage.getItem('conversations');
    let localConversations: Conversation[] = [];
    
    if (savedConversationsJson && savedConversationsJson !== 'undefined' && savedConversationsJson !== 'null') {
      try {
        const parsed = JSON.parse(savedConversationsJson);
        if (Array.isArray(parsed) && parsed.length > 0) {
          localConversations = parsed;
        }
      } catch (e) {
        console.error('解析本地存储的会话数据失败:', e);
      }
    }
    
    // 合并服务器和本地数据，确保数据同步
    const mergedConversations = mergeConversations(serverConversations, localConversations);
    
    // 同步到服务器
    if (needsSync(mergedConversations, serverConversations)) {
      console.log('本地数据与服务器不同步，开始同步...');
      await syncToServer(mergedConversations, serverConversations);
    }
    
    // 更新Redux存储
    dispatch(setConversations(mergedConversations));
    dispatch(updateLastFetchTime());
    dispatch(setLoading(false));
    return mergedConversations;
  } catch (error) {
    console.error('获取用户会话列表失败:', error);
    dispatch(setError('获取用户会话列表失败'));
    dispatch(setLoading(false));
    return [];
  }
};

// 合并会话数据，保留两边的唯一会话，并更新现有会话
const mergeConversations = (serverConvs: Conversation[], localConvs: Conversation[]): Conversation[] => {
  const mergedMap = new Map<string, Conversation>();
  
  // 先添加服务器数据
  serverConvs.forEach(conv => {
    mergedMap.set(conv.id, { ...conv });
  });
  
  // 添加或更新本地数据
  localConvs.forEach(localConv => {
    const existingConv = mergedMap.get(localConv.id);
    
    if (!existingConv) {
      // 本地有但服务器没有的会话
      mergedMap.set(localConv.id, { ...localConv });
    } else {
      // 两边都有的会话，保留更新时间更晚的
      const serverTime = new Date(existingConv.updateTime || existingConv.timestamp || 0).getTime();
      const localTime = new Date(localConv.updateTime || localConv.timestamp || 0).getTime();
      
      if (localTime > serverTime) {
        // 本地更新时间更晚，使用本地数据
        mergedMap.set(localConv.id, { 
          ...existingConv, 
          ...localConv,
          messages: mergeMessages(existingConv.messages, localConv.messages)
        });
      } else {
        // 服务器更新时间更晚，但仍需合并消息
        mergedMap.set(existingConv.id, {
          ...existingConv,
          messages: mergeMessages(existingConv.messages, localConv.messages)
        });
      }
    }
  });
  
  // 转换回数组并按更新时间排序
  return Array.from(mergedMap.values()).sort((a, b) => {
    const timeA = new Date(a.updateTime || a.timestamp || 0).getTime();
    const timeB = new Date(b.updateTime || b.timestamp || 0).getTime();
    return timeB - timeA;
  });
};

// 合并消息，去重并保持顺序
const mergeMessages = (serverMsgs: Message[] = [], localMsgs: Message[] = []): Message[] => {
  const uniqueMessages = new Map<string, Message>();
  
  // 添加服务器消息
  serverMsgs.forEach(msg => {
    const key = msg.id || `${msg.content}-${msg.role}-${msg.timestamp}`;
    uniqueMessages.set(key, { ...msg });
  });
  
  // 添加本地消息
  localMsgs.forEach(msg => {
    const key = msg.id || `${msg.content}-${msg.role}-${msg.timestamp}`;
    if (!uniqueMessages.has(key)) {
      uniqueMessages.set(key, { ...msg });
    }
  });
  
  // 按时间戳排序
  return Array.from(uniqueMessages.values()).sort((a, b) => {
    return new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime();
  });
};

// 检查是否需要同步到服务器
const needsSync = (merged: Conversation[], server: Conversation[]): boolean => {
  if (merged.length !== server.length) return true;
  
  // 创建服务器会话ID集合，用于快速查找
  const serverIds = new Set(server.map(conv => conv.id));
  
  // 检查合并后的数据中是否有服务器没有的会话
  for (const conv of merged) {
    if (!serverIds.has(conv.id)) return true;
  }
  
  return false;
};

// 同步数据到服务器
const syncToServer = async (merged: Conversation[], server: Conversation[]): Promise<void> => {
  const serverIds = new Set(server.map(conv => conv.id));
  
  // 找出本地有但服务器没有的会话
  const localOnlyConvs = merged.filter(conv => !serverIds.has(conv.id));
  
  // 将本地独有的会话同步到服务器
  // 为了避免冗余API调用，这里只处理没有在服务器上的会话
  try {
    await Promise.all(localOnlyConvs.map(async (conv) => {
      try {
        // 创建新会话，处理类型兼容性问题
        const convType = conv.type || conv.type;
        
        await ConversationAPI.createOrGetConversation({
          type: convType as Types,
          referenceId: conv.id,
          userId: conv.userId || '',
          messages: conv.messages || [],
        });
        console.log(`已同步会话到服务器: ${conv.id}`);
      } catch (err) {
        console.error(`同步会话 ${conv.id} 失败:`, err);
      }
    }));
  } catch (error) {
    console.error('同步会话到服务器时发生错误:', error);
  }
};

// 创建删除会话的异步 action creator
export const deleteConversation = (conversationId: string) => async (dispatch: any) => {
  try {
    dispatch(setLoading(true));
    
    // 调用服务端 API 删除会话
    await ConversationAPI.deleteConversation(conversationId);
    
    // 删除成功后，从本地状态中移除会话
    dispatch(removeConversation(conversationId));
    
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
