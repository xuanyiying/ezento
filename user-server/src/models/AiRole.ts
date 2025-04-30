import mongoose, { Schema } from 'mongoose';
import { AiRoleBase } from '../interfaces/ai.role.interface';

/**
 * 角色模型定义
 * 包含角色基本信息和系统提示词
 */
const AiRoleSchema = new Schema<AiRoleBase>(
    {
        id: {
            type: String,
            required: true,
        },
        type: {
            type: String,
            required: true,
            unique: true,
        },
        title: {
            type: String,
            required: true,
        },
        description: {
            type: String,
            required: true,
        },
        systemPrompt: {
            type: String,
            required: true,
        },
        status: {
            type: String,
            enum: ['active', 'inactive'],
            default: 'active',
        },
        order: {
            type: Number,
            default: 0,
        },
    },
    {
        timestamps: true,
        versionKey: false,
        toJSON: { virtuals: true },
        toObject: { virtuals: true },
    }
);

// 创建索引
AiRoleSchema.index({ type: 1 });

const AiRole = mongoose.model<AiRoleBase>('AiRole', AiRoleSchema);

export default AiRole;