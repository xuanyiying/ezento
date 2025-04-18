// 导入所需的mongoose模块和类型
import mongoose, { Document, Schema } from 'mongoose';

// 租户接口定义
export interface ITenant extends Document {
    name: string; // 租户名称
    code: string; // 租户唯一代码
    description?: string; // 租户描述（可选）
    isActive: boolean; // 租户状态（启用/禁用）
    settings?: {
        // 租户配置选项（可选）
        allowPatientRegistration: boolean; // 是否允许患者注册
        allowDoctorRegistration: boolean; // 是否允许医生注册
        maxUsers: number; // 最大用户数量限制
        features: string[]; // 启用的功能特性列表
    };
    createdAt: Date; // 创建时间
    updatedAt: Date; // 更新时间
}

// 租户Schema定义
const TenantSchema: Schema = new Schema(
    {
        id: {
            type: String,
            required: true,
        },
        name: {
            type: String,
            required: true,
        },
        code: {
            type: String,
            required: true,
            unique: true,
            trim: true,
            lowercase: true,
        },
        description: {
            type: String,
        },
        isActive: {
            type: Boolean,
            default: true,
        },
        settings: {
            allowPatientRegistration: {
                type: Boolean,
                default: true,
            },
            allowDoctorRegistration: {
                type: Boolean,
                default: true,
            },
            maxUsers: {
                type: Number,
                default: 100,
            },
            features: [
                {
                    type: String,
                },
            ],
        },
    },
    { timestamps: true }
);

// 创建索引以提高查询性能
// code字段已在Schema中定义为唯一索引
// 按租户状态创建索引，用于快速筛选活跃/非活跃租户
TenantSchema.index({ isActive: 1 });

export default mongoose.model<ITenant>('Tenant', TenantSchema);
