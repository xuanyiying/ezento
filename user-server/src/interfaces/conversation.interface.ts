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
 * 消息发送者类型枚举
 */
export enum SenderType {
    PATIENT = 'PATIENT', // 患者
    AI = 'AI',           // AI助手
    SYSTEM = 'SYSTEM'    // 系统消息
}

/**
 * 会话消息接口
 */
export interface IConversationMessage {
    content: string;             // 消息内容
    senderType: SenderType;      // 发送者类型
    timestamp: Date;             // 发送时间
    metadata?: Record<string, any>; // 元数据（可包含图片链接等）
}

/**
 * 会话接口
 */
export interface IConversation extends Document {
    conversationType: ConversationType;  // 会话类型
    referenceId: mongoose.Types.ObjectId;// 关联ID（预问诊ID、导诊ID或报告ID）
    patientId: mongoose.Types.ObjectId;  // 患者ID
    messages: IConversationMessage[];    // 消息记录
    createdAt: Date;                     // 创建时间
    updatedAt: Date;                     // 更新时间
    status: 'ACTIVE' | 'CLOSED';         // 会话状态
}

/**
 * 创建会话请求接口
 */
export interface CreateConversationRequest {
    conversationType: ConversationType;
    referenceId: string;
    patientId: string;
    initialMessage?: string;
}

/**
 * 添加消息请求接口
 */
export interface AddMessageRequest {
    conversationId: string;
    content: string;
    senderType: SenderType;
    metadata?: Record<string, any>;
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
    conversationId: string;
    format?: 'PDF' | 'TEXT';
} 