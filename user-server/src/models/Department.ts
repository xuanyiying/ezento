import mongoose, { Schema } from 'mongoose';
import { DepartmentBase } from '../interfaces/department.interface';

/**
 * 科室模型定义
 * 包含科室基本信息和分类
 */
const DepartmentSchema = new Schema<DepartmentBase>(
    {
        id: {
            type: String,
            required: true,
        },
        name: {
            type: String,
            required: true,
            unique: true,
        },
        description: {
            type: String,
            required: true,
        },
        iconUrl: {
            type: String,
            required: true,
        },
        status: {
            type: String,
            enum: ['active', 'inactive'],
            default: 'active',
        },
        thirdPartyId: {
            type: String,
            sparse: true,
            unique: true,
        },
        parentId: {
            type: String,
            default: null,
        },
        order: {
            type: Number,
            default: 0,
        },
    },
    {
        timestamps: true,
        versionKey: false,
        toJSON: { virtuals: true }, // Enable virtuals for JSON
        toObject: { virtuals: true }, // Enable virtuals for toObject
    }
);

// 索引优化查询性能
DepartmentSchema.index({ status: 1 });
DepartmentSchema.index({ parentId: 1 });
DepartmentSchema.index({ order: 1 });

export default mongoose.model<DepartmentBase>('Department', DepartmentSchema as any);
