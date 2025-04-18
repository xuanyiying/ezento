import { get, post, put } from '@/utils/http';
import { ConversationType, Message, Conversation } from '@/types/conversation';

const API_URL = '/conversations';

// 定义标准API响应格式
export interface ApiResponse<T> {
    success: boolean;
    message: string;
    data: T;
}

export const createOrGetConversation = async (
    conversationType: ConversationType,
    referenceId: string,
    initialMessage?: string
): Promise<Conversation> => {
    const response = await post<ApiResponse<Conversation>>(API_URL, {
        conversationType,
        referenceId,
        initialMessage,
    });
    return response.data;
};

export const addMessage = async (conversationId: string, content: string): Promise<Message> => {
    const response = await post<ApiResponse<Message>>(`${API_URL}/${conversationId}/messages`, {
        content,
    });
    return response.data;
};

export const getConversationHistory = async (conversationId: string): Promise<Conversation> => {
    const response = await get<ApiResponse<Conversation>>(`${API_URL}/${conversationId}`);
    return response.data;
};

export const closeConversation = async (conversationId: string): Promise<Conversation> => {
    const response = await put<ApiResponse<Conversation>>(`${API_URL}/${conversationId}/close`);
    return response.data;
};

export interface CreateConversationRequest {
    conversationType: ConversationType;
    referenceId: string;
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
        conversationType: string,
        referenceId: string
    ): Promise<Conversation> => {
        try {
            console.log(`Getting conversation history for ${conversationType}/${referenceId}`);
            const response = await get<ApiResponse<Conversation>>(
                `${API_URL}/${conversationType}/${referenceId}/history`
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
};
