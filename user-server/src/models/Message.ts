// 导入所需的mongoose模块和相关接口
import mongoose, { Document, Schema } from 'mongoose';
import { IConsultation } from './Consultation';
import { UserDocument } from '../interfaces/user.interface';

// 消息接口定义
export interface IMessage extends Document {
    consultationId: IConsultation['_id'] | IConsultation;  // 关联的问诊ID
    senderId: UserDocument['_id'] | string;               // 发送者ID
    role: 'user' | 'system';             // 发送者类型：患者/系统
    content: string;                                     // 消息内容
    messageType: 'text' | 'image' | 'document';   // 消息类型：文本/图片/文档
    timestamp: Date;                                     // 创建时间
    referenceId: string; // 关联ID（预问诊ID、导诊ID或报告ID）
    conversationId: mongoose.Types.ObjectId;
    sender: string;
    createdAt: Date;
    updatedAt: Date;
    metadata: Record<string, any>; // 元数据（可包含图片链接等）
}

// 消息Schema定义
const MessageSchema: Schema = new Schema({
    consultationId: {
        type: Schema.Types.ObjectId,
        ref: 'Consultation',
        required: true
    },
    senderId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    role: {
        type: String,
        enum: ['user', 'system'],
        required: true
    },
    content: {
        type: String,
        required: true
    },
    messageType: {
        type: String,
        enum: ['text', 'image', 'pdf'],
        default: 'text'
    },
    referenceId: {
        type: String,
        required: true
    },
    conversationId: {
        type: Schema.Types.ObjectId,
        ref: 'Conversation',
        required: true,
        index: true
    },
    sender: {
        type: String,
        required: true,
        enum: ['USER', 'AI', 'SYSTEM']
    },
    metadata: {
        type: Schema.Types.Mixed,
        default: {}
    },
    timestamp: {
        type: Date,
        default: Date.now
    }
}, { timestamps: true });

// 创建索引以提高查询性能
// 按问诊ID和创建时间联合索引，用于按时间顺序获取特定问诊的消息记录
MessageSchema.index({ consultationId: 1, createdAt: 1 });
// 按发送者ID和类型联合索引，用于快速查询特定类型用户的消息记录
MessageSchema.index({ senderId: 1, senderType: 1 });

export const Message = mongoose.model<IMessage>('Message', MessageSchema);