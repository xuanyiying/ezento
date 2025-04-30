import mongoose, { Schema } from 'mongoose';
import { IConversation, Type } from '../interfaces/conversation.interface';
import AiRole from './AiRole';

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
            required: true,
            validate: {
                validator: async function(value: string) {
                    // 验证type是否存在于AiRole中
                    const role = await AiRole.findOne({ type: value });
                    return !!role;
                },
                message: (props: { value: any; }) => `${props.value}不是有效的AI角色类型`
            }
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
