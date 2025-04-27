import { get, post, put, del } from '@/utils/http';
import {  Message, Conversation, ExportResponse, CreateConversationRequest } from '@/types/conversation';
import { ApiResponse } from '@/types';
const API_URL = '/conversations';

// 定义标准API响应格式


export const ConversationAPI = {
    createConversation: async (params: CreateConversationRequest): Promise<Conversation> => {
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
        params: Message
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

    getConversation: async (
        conversationId: string
    ): Promise<Conversation> => {
        try {
            const response = await get<ApiResponse<Conversation>>(
                `${API_URL}/${conversationId}`
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
            console.log(`删除会话 ${conversationId}`);
            await del<ApiResponse<void>>(
                `${API_URL}/${conversationId}`
            );
        } catch (error) {
            console.error('Error deleting conversation:', error);
            throw error;
        }
    },
    toggleFavorite: async (conversationId: string): Promise<void> => {
        try {
            await put<ApiResponse<void>>(`${API_URL}/${conversationId}/toggle-favorite`);
        } catch (error) {
            console.error('Error toggling favorite:', error);
            throw error;
        }
    },
    togglePin: async (conversationId: string): Promise<void> => {
        try {
            await put<ApiResponse<void>>(`${API_URL}/${conversationId}/toggle-pin`);
        } catch (error) {
            console.error('Error toggling pin:', error);
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
