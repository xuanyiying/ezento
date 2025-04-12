import { Document } from 'mongoose';
import mongoose from 'mongoose';

/**
 * 会话类型枚举
 */
export enum ConversationType {
    PRE_DIAGNOSIS = 'PRE_DIAGNOSIS', // 预问诊
    GUIDE = 'GUIDE',                 // 导诊
    REPORT = 'REPORT'                // 报告解读
}

/**
 * 会话消息接口
 */
export interface IConversationMessage {
    content: string;             // 消息内容
    role: 'user' | 'system';      // 发送者类型
    timestamp: Date;             // 发送时间
    metadata?: Record<string, any>; // 元数据（可包含图片链接等）
    referenceId: string;         // 关联ID（预问诊ID、导诊ID或报告ID）
    conversationId: mongoose.Types.ObjectId;      // 会话ID
}

/**
 * 会话接口
 */
export interface IConversation extends Document {
    _id: mongoose.Types.ObjectId;        // 会话ID
    conversationType: ConversationType;  // 会话类型
    referenceId: string;                 // 关联ID（预问诊ID、导诊ID或报告ID）
    userId: mongoose.Types.ObjectId;     // 用户ID
    messages: IConversationMessage[];    // 消息记录
    createdAt: Date;                     // 创建时间
    updatedAt: Date;                     // 更新时间
    status: 'ACTIVE' | 'CLOSED';         // 会话状态
    startTime: Date;
    endTime?: Date;
    isClosed: boolean;
}

/**
 * 创建会话请求接口
 */
export interface CreateConversationRequest {
    conversationId?: mongoose.Types.ObjectId; // 会话ID (可选)
    conversationType: ConversationType;
    referenceId?: string;
    userId: string;  // Changed from patientId to userId
    initialMessage?: string;
    timestamp?: Date;
}

/**
 * 添加消息请求接口
 */
export interface AddMessageRequest {
    conversationId: mongoose.Types.ObjectId; // 会话ID
    content: string; // 消息内容
    role: 'user' | 'system'; // 发送者类型
    metadata?: Record<string, any>; // 元数据（可包含图片链接等）
    referenceId: string; // 关联ID（预问诊ID、导诊ID或报告ID）
    timestamp: Date; // 发送时间
}

/**
 * 获取会话历史记录请求接口
 */
export interface GetConversationHistoryRequest {
    conversationType: ConversationType;
    referenceId: string;
}

/**
 * 导出会话历史记录请求接口
 */
export interface ExportConversationRequest {
    conversationId: mongoose.Types.ObjectId;
    format?: 'PDF' | 'TEXT';
}

export interface Message {
    _id?: string;
    conversationId: string;
    sender: string;
    content: string;
    metadata?: Record<string, any>;
    timestamp: Date;
}