import mongoose from 'mongoose';
import { DoctorDocument, DoctorModel } from '../interfaces/doctor.interface';

const doctorSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    departmentId: {
        type: mongoose.Schema.Types.ObjectId,
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
        default: 0,
        min: 0
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
    timestamps: true
});

// 创建索引
doctorSchema.index({ departmentId: 1 });
doctorSchema.index({ thirdPartyId: 1 }, { sparse: true });
doctorSchema.index({ isAvailable: 1 });
doctorSchema.index({ rating: -1 });
doctorSchema.index({ consultationCount: -1 });

const Doctor = mongoose.model<DoctorDocument, DoctorModel>('Doctor', doctorSchema);

export default Doctor; 