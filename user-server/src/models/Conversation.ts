import mongoose, { Schema } from 'mongoose';
import { IConversation, Types } from '../interfaces/conversation.interface';

/**
 * 会话Schema // 会话类型、关联ID、患者ID、消息列表、状态
 */
const ConversationSchema: Schema = new Schema(
    {
        id: {
            type: String,
            required: true,
        },
        userId: {
            type: String,
            required: true,
        },
        type: {
            type: String,
            enum: Object.values(Types),
            required: true,
        },
        consultationId: {
            type: String,
            required: true,
        },
        startTime: {
            type: Date,
            default: Date.now,
        },
        endTime: {
            type: Date,
        },
        isClosed: {
            type: Boolean,
            default: false,
        },
        status: {
            type: String,
            enum: ['ACTIVE', 'CLOSED'],
            default: 'ACTIVE',
        },
    },
    {
        timestamps: true,
    }
);

// 创建索引以优化查询性能
ConversationSchema.index({ userId: 1 });
ConversationSchema.index({ createdAt: -1 });
ConversationSchema.index({ status: 1 });
// 添加复合索引
ConversationSchema.index({ type: 1, consultationId: 1 });

/**
 * 会话模型
 */
export const Conversation = mongoose.model<IConversation>('Conversation', ConversationSchema);
