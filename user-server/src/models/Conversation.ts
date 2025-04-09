import mongoose, { Schema, Document } from 'mongoose';
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
    },
    referenceId: {
        type: String,
        required: true
    },
    conversationId: {
        type: Schema.Types.ObjectId,
        ref: 'Conversation',
        required: true
    }
}, { _id: false });

/**
 * 会话Schema // 会话类型、关联ID、患者ID、消息列表、状态
 */
const ConversationSchema: Schema = new Schema({
    userId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    conversationType: {
        type: String,
        enum: Object.values(ConversationType),
        required: true,
        index: true
    },
    referenceId: {
        type: String,
        default: null,
        index: true
    },
    startTime: {
        type: Date,
        default: Date.now
    },
    endTime: {
        type: Date
    },
    isClosed: {
        type: Boolean,
        default: false,
        index: true
    },
    messages: [ConversationMessageSchema]
}, { 
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});



// 创建索引以优化查询性能
ConversationSchema.index({ userId: 1 });
ConversationSchema.index({ createdAt: -1 });
ConversationSchema.index({ status: 1 });
// 添加复合索引，但不设为唯一
ConversationSchema.index({ conversationType: 1, referenceId: 1 });

/**
 * 会话模型
 */
export const Conversation = mongoose.model<IConversation>('Conversation', ConversationSchema); 