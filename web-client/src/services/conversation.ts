import { get, post, put, del } from '@/utils/http';
import { Types, Message, Conversation } from '@/types/conversation';

const API_URL = '/conversations';

// 定义标准API响应格式
export interface ApiResponse<T> {
    success: boolean;
    message: string;
    data: T;
}

export interface CreateConversationRequest {
    type: Types;
    userId: string;
    initialMessage?: string;
    messages: Message[];
}

export interface AddMessageRequest {
    content: string;
    role: 'user' | 'system';
    conversationId: string;
    userId: string;
    metadata?: any;
}

export interface ExportResponse {
    filePath: string;
    downloadUrl: string;
}

export const ConversationAPI = {
    createOrGetConversation: async (params: CreateConversationRequest): Promise<Conversation> => {
        try {
            console.log('Creating or getting conversation with params:', params);
            const response = await post<ApiResponse<Conversation>>(API_URL, params);
            console.log('API Response:', response);
            return response.data;
        } catch (error) {
            console.error('Error creating conversation:', error);
            throw error;
        }
    },

    getUserConversations: async (): Promise<Conversation[]> => {
        try {
            const response = await get<ApiResponse<Conversation[]>>(`${API_URL}/user/all`);
            return response.data;
        } catch (error) {
            console.error('Error getting user conversations:', error);
            throw error;
        }
    },

    addMessage: async (
        conversationId: string,
        params: AddMessageRequest
    ): Promise<Conversation> => {
        try {
            console.log(`Adding message to conversation ${conversationId}:`, params);
            const response = await post<ApiResponse<Conversation>>(
                `${API_URL}/${conversationId}/messages`,
                params
            );
            return response.data;
        } catch (error) {
            console.error('Error adding message:', error);
            throw error;
        }
    },

    getConversationHistory: async (
        type: string,
        referenceId: string
    ): Promise<Conversation> => {
        try {
            console.log(`Getting conversation history for ${type}/${referenceId}`);
            const response = await get<ApiResponse<Conversation>>(
                `${API_URL}/${type}/${referenceId}/history`
            );
            return response.data;
        } catch (error) {
            console.error('Error getting conversation history:', error);
            throw error;
        }
    },

    closeConversation: async (conversationId: string): Promise<void> => {
        try {
            console.log(`Closing conversation ${conversationId}`);
            await put<ApiResponse<void>>(`${API_URL}/${conversationId}/close`);
        } catch (error) {
            console.error('Error closing conversation:', error);
            throw error;
        }
    },
    deleteConversation: async (conversationId: string): Promise<void> => {
        try {
            await del<ApiResponse<void>>(`${API_URL}/${conversationId}`);
        } catch (error) {
            console.error('Error deleting conversation:', error);
            throw error;        
        }
    },
    renameConversation: async (conversationId: string, newName: string): Promise<void> => {
        try {
            await put<ApiResponse<void>>(`${API_URL}/${conversationId}/rename`, { newName });
        } catch (error) {
            console.error('Error renaming conversation:', error);
            throw error;
        }
    },
    exportConversation: async (
        conversationId: string,
        format: 'PDF' | 'TEXT' = 'PDF'
    ): Promise<ExportResponse> => {
        try {
            console.log(`Exporting conversation ${conversationId} as ${format}`);
            const response = await get<ApiResponse<ExportResponse>>(
                `${API_URL}/${conversationId}/export`,
                {
                    params: { format },
                }
            );
            return response.data;
        } catch (error) {
            console.error('Error exporting conversation:', error);
            throw error;
        }
    },
    updateConversation: async (
        conversationId: string,
        data: {
            title?: string;
            favorite?: boolean;
            status?: 'ACTIVE' | 'CLOSED';
        }
    ): Promise<void> => {
        try {
            console.log(`更新会话 ${conversationId}:`, data);
            await put<ApiResponse<void>>(
                `${API_URL}/${conversationId}`,
                data
            );
        } catch (error) {
            console.error('更新会话失败:', error);
            throw error;
        }
    },
};
