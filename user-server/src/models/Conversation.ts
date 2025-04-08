import mongoose, { Schema } from 'mongoose';
import { IConversation, IConversationMessage, ConversationType, SenderType } from '../interfaces/conversation.interface';

/**
 * 会话消息Schema // 消息内容、发送者类型、发送时间、元数据信息
 */
const ConversationMessageSchema = new Schema<IConversationMessage>({
    content: { 
        type: String, 
        required: true 
    },
    senderType: { 
        type: String, 
        enum: Object.values(SenderType),
        required: true 
    },
    timestamp: { 
        type: Date, 
        default: Date.now 
    },
    metadata: { 
        type: Map, 
        of: Schema.Types.Mixed 
    }
}, { _id: false });

/**
 * 会话Schema // 会话类型、关联ID、患者ID、消息列表、状态
 */
const ConversationSchema = new Schema<IConversation>({
    conversationType: { 
        type: String, 
        enum: Object.values(ConversationType),
        required: true 
    },
    referenceId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true
    },
    patientId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    messages: [ConversationMessageSchema],
    status: { 
        type: String, 
        enum: ['ACTIVE', 'CLOSED'],
        default: 'ACTIVE' 
    }
}, { timestamps: true });

// 创建索引以优化查询性能
ConversationSchema.index({ conversationType: 1, referenceId: 1 }, { unique: true });
ConversationSchema.index({ patientId: 1 });
ConversationSchema.index({ createdAt: -1 });
ConversationSchema.index({ status: 1 });

/**
 * 会话模型
 */
export const Conversation = mongoose.model<IConversation>('Conversation', ConversationSchema); 