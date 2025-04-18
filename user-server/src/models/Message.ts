// 导入所需的mongoose模块和相关接口
import mongoose, { Document, Schema } from 'mongoose';
import { IConversationMessage } from '../interfaces/conversation.interface';

// 消息接口定义
export interface IMessage extends Document {
    id: string;
    consultationId: string; // 关联的问诊ID
    role: 'user' | 'system'; // 发送者类型：患者/系统
    content: string; // 消息内容
    messageType: 'text' | 'image' | 'document'; // 消息类型：文本/图片/文档
    timestamp: Date; // 创建时间
    conversationId: string;
    metadata: Record<string, any>; // 元数据（可包含图片链接等）
}

// 消息Schema定义
export const MessageSchema: Schema = new Schema(
    {
        id: {
            type: String,
            required: true,
        },
        conversationId: {
            type: String,
            required: true,
            index: true,
        },
        content: {
            type: String,
            required: true,
        },
        role: {
            type: String,
            enum: ['user', 'system'],
            required: true,
        },
        timestamp: {
            type: Date,
            default: Date.now,
        },
        consultationId: {
            type: String,
            required: true,
        },
        metadata: {
            type: Schema.Types.Mixed,
            default: {},
        },
    },
    {
        timestamps: true,
    }
);

// 创建索引以提高查询性能
MessageSchema.index({ conversationId: 1, timestamp: 1 });

export const Message = mongoose.model<IConversationMessage & Document>('Message', MessageSchema);
