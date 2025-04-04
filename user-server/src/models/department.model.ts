import mongoose from 'mongoose';
import { DepartmentDocument, DepartmentModel } from '../interfaces/department.interface';

const departmentSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        unique: true
    },
    description: {
        type: String,
        required: true
    },
    iconUrl: {
        type: String,
        required: true
    },
    status: {
        type: String,
        enum: ['active', 'inactive'],
        default: 'active'
    },
    thirdPartyId: {
        type: String,
        sparse: true,
        unique: true
    },
    parentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Department',
        default: null
    },
    order: {
        type: Number,
        default: 0
    }
}, {
    timestamps: true
});

// 创建索引
departmentSchema.index({ name: 1 });
departmentSchema.index({ thirdPartyId: 1 }, { sparse: true });
departmentSchema.index({ parentId: 1 });
departmentSchema.index({ order: 1 });
departmentSchema.index({ status: 1 });

const Department = mongoose.model<DepartmentDocument, DepartmentModel>('Department', departmentSchema);

export default Department; 