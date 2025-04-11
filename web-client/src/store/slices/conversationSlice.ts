import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Conversation, Message } from '@/types/conversation';

interface ConversationState {
  conversations: Conversation[];
  currentConversation: Conversation | null;
  loading: boolean;
  error: string | null;
}

const initialState: ConversationState = {
  conversations: [],
  currentConversation: null,
  loading: false,
  error: null
};

const conversationSlice = createSlice({
  name: 'conversation',
  initialState,
  reducers: {
    setConversations: (state, action: PayloadAction<Conversation[]>) => {
      state.conversations = action.payload;
    },
    setCurrentConversation: (state, action: PayloadAction<Conversation>) => {
      state.currentConversation = action.payload;
    },
    addMessage: (state, action: PayloadAction<Partial<Message>>) => {
      if (state.currentConversation) {
        const now = new Date().toISOString();
        const newMessage: Message = {
          _id: Math.random().toString(36).substr(2, 9), // Temporary ID
          content: action.payload.content || '',
          metadata: action.payload.metadata || {},
          createdAt: now,
          updatedAt: now,
          senderType: action.payload.senderType || 'SYSTEM',
          conversationId: action.payload.conversationId || ''
        };
        state.currentConversation.messages.push(newMessage);
      }
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    }
  }
});

export const {
  setConversations,
  setCurrentConversation,
  addMessage,
  setLoading,
  setError
} = conversationSlice.actions;

export default conversationSlice.reducer;