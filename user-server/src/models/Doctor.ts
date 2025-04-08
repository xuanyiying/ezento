import mongoose, { Schema } from 'mongoose';
import { DoctorDocument, DoctorModel } from '../interfaces/doctor.interface';

/**
 * 医生模型定义
 * 包含医生基本信息、医疗专长、定价和可用性等
 */
const DoctorSchema = new Schema({
    userId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    departmentId: {
        type: Schema.Types.ObjectId,
        ref: 'Department',
        required: true
    },
    title: {
        type: String,
        required: true
    },
    specialties: [{
        type: String,
        required: true
    }],
    introduction: {
        type: String,
        required: true
    },
    consultationFee: {
        type: Number,
        required: true,
        min: 0
    },
    isAvailable: {
        type: Boolean,
        default: true
    },
    rating: {
        type: Number,
        default: 5.0,
        min: 0,
        max: 5
    },
    consultationCount: {
        type: Number,
        default: 0
    },
    goodReviewRate: {
        type: Number,
        default: 100,
        min: 0,
        max: 100
    },
    availableTimes: [{
        dayOfWeek: {
            type: Number,
            required: true,
            min: 0,
            max: 6
        },
        startTime: {
            type: String,
            required: true
        },
        endTime: {
            type: String,
            required: true
        }
    }],
    thirdPartyId: {
        type: String,
        sparse: true,
        unique: true
    }
}, { 
    timestamps: true, 
    versionKey: false 
});

// 索引优化查询性能
DoctorSchema.index({ userId: 1 });
DoctorSchema.index({ departmentId: 1 });
DoctorSchema.index({ isAvailable: 1 });
DoctorSchema.index({ rating: -1 });
DoctorSchema.index({ consultationFee: 1 });
// 复合索引
DoctorSchema.index({ departmentId: 1, isAvailable: 1 });

const Doctor = mongoose.model<DoctorDocument, DoctorModel>('Doctor', DoctorSchema);

export default Doctor;