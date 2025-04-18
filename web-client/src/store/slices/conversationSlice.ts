import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Conversation, Message } from '@/types/conversation';

interface ConversationState {
    conversations: Conversation[];
    currentConversation: Conversation | null;
    loading: boolean;
    error: string | null;
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
        };
    } catch (error) {
        console.error('Error loading conversations from localStorage:', error);
        return {
            conversations: [],
            currentConversation: null,
            loading: false,
            error: null,
        };
    }
};

const initialState: ConversationState = getInitialConversationState();

const conversationSlice = createSlice({
    name: 'conversation',
    initialState,
    reducers: {
        setConversations: (state, action: PayloadAction<Conversation[]>) => {
            state.conversations = action.payload;
            // 保存到localStorage
            localStorage.setItem('conversations', JSON.stringify(action.payload));
        },
        setCurrentConversation: (state, action: PayloadAction<Conversation>) => {
            state.currentConversation = action.payload;
            // 保存到localStorage
            localStorage.setItem('currentConversation', JSON.stringify(action.payload));
        },
        addMessage: (state, action: PayloadAction<Partial<Message>>) => {
            if (state.currentConversation) {
                const now = new Date().toISOString();
                const newMessage: Message = {
                    id: action.payload.id || Math.random().toString(36).substr(2, 9), // 使用提供的ID或生成临时ID
                    content: action.payload.content || '',
                    role: action.payload.role || 'system',
                    metadata: action.payload.metadata || {},
                    timestamp: action.payload.timestamp || now,
                    conversationId:
                        action.payload.conversationId || state.currentConversation.id || '',
                    consultationId:
                        action.payload.consultationId ||
                        state.currentConversation.referenceId ||
                        '',
                };
                state.currentConversation.messages.push(newMessage);
                // 更新localStorage
                localStorage.setItem(
                    'currentConversation',
                    JSON.stringify(state.currentConversation)
                );
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
    },
});

export const {
    setConversations,
    setCurrentConversation,
    addMessage,
    setLoading,
    setError,
    clearConversations,
} = conversationSlice.actions;

export default conversationSlice.reducer;
