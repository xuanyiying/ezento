import { Document } from 'mongoose';

/**
 * 会话类型使用AiRole类型
 */
export type Type = string;

/**
 * 会话消息接口
 */
export interface IConversationMessage {
    id: string; // 消息ID
    content: string; // 消息内容
    role: 'user' | 'system'; // 发送者类型
    timestamp: Date; // 发送时间
    metadata?: Record<string, any>; // 元数据（可包含图片链接等）
    conversationId: string; // 会话ID
    consultationId: string; // 咨询ID
}

/**
 * 会话接口
 */
export interface IConversation extends Document {
    id: string; // 会话ID
    type: Type; // 会话类型，对应AiRole的type字段
    consultationId: string; // 关联ID（预问诊ID、导诊ID或报告ID）
    userId: string; // 用户ID
    messages?: IConversationMessage[]; // 消息记录 - 可能来自关联查询，使用可选标记
    createdAt: Date; // 创建时间
    updatedAt: Date; // 更新时间
    status: 'ACTIVE' | 'CLOSED'; // 会话状态
    startTime: Date;
    endTime?: Date;
    isClosed: boolean;
    metadata?: Record<string, any>;
}

/**
 * 创建会话请求接口
 */
export interface CreateConversationRequest {
    conversationId?: string; // 会话ID (可选)
    type: Type;
    consultationId?: string;
    userId: string; // Changed from patientId to userId
    initialMessage?: string;
    timestamp?: Date;
}

/**
 * 添加消息请求接口
 */
export interface AddMessageRequest {
    conversationId: string; // 会话ID
    content: string; // 消息内容
    role: 'user' | 'system'; // 发送者类型
    metadata?: Record<string, any>; // 元数据（可包含图片链接等）
    consultationId?: string; // 关联ID（预问诊ID、导诊ID或报告ID）
    timestamp?: Date; // 发送时间
}

/**
 * 获取会话历史记录请求接口
 */
export interface GetConversationHistoryRequest {
    type: Type;
    consultationId: string;
}

/**
 * 导出会话历史记录请求接口
 */
export interface ExportConversationRequest {
    conversationId: string;
    format?: 'PDF' | 'TEXT';
}

export interface Message {
    id?: string;
    conversationId: string;
    role: 'user' | 'system';
    content: string;
    metadata?: Record<string, any>;
    consultationId: string;
    timestamp: Date;
}
