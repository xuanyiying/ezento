export enum Types {
    DIAGNOSIS = 'DIAGNOSIS',
    GUIDE = 'GUIDE',
    REPORT = 'REPORT',
}

export interface Message {
    id: string;
    content: string;
    role: 'user' | 'system';
    metadata?: any;
    timestamp: string;
    conversationId: string;
    consultationId: string;
}

export interface Conversation {
    consultationId: string;
    id: string;
    userId?: string;  // 用户ID
    type: Types;
    messages: Message[];
    status: 'ACTIVE' | 'CLOSED';
    startTime: string;
    updateTime?: string;  // 会话更新时间
    timestamp?: string; // ISO timestamp for the conversation
    title?: string; // Custom title for the conversation
    pinned?: boolean; // Whether the conversation is pinned to the top
    favorite?: boolean; // Whether the conversation is marked as favorite
}

export interface CreateConversationRequest {
    type: Types;
    userId: string;
    initialMessage?: string;
    messages: Message[];
}

export interface ExportResponse {
    filePath: string;
    downloadUrl: string;
}