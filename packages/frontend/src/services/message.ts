import { get, post } from '@/utils/http';
import { Message } from '@/types/conversation';
import { ApiResponse } from '@/types';

export const MessageAPI = {
  getByConversation: async (conversationId: string): Promise<Message[]> => {
    try {
      const response = await get<ApiResponse<Message[]>>(`/conversations/${conversationId}/messages`);
      return response.data || [];
    } catch (error) {
      console.error('Error getting messages by conversation:', error);
      throw error;
    }
  },

  sendMessage: async (conversationId: string, content: string): Promise<Message> => {
    try {
      const response = await post<ApiResponse<Message>>(`/conversations/${conversationId}/messages`, {
        content,
        role: 'user'
      });
      if (!response.data) {
        throw new Error('Invalid response from server: message data is missing');
      }
      return response.data;
    } catch (error) {
      console.error('Error sending message:', error);
      throw error;
    }
  }
};

export default MessageAPI; 