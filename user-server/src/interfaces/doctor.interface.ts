import { Document, Model, Types } from 'mongoose';
import { UserDocument } from './user.interface';

/**
 * 医生文档接口
 * 描述MongoDB中的医生文档结构
 */
export interface DoctorBase {
    userId: Types.ObjectId | UserDocument;
    departmentId: Types.ObjectId;
    title: string;
    specialties: string[];
    introduction: string;
    consultationFee: number;
    isAvailable: boolean;
    rating: number;
    consultationCount: number;
    goodReviewRate: number;
    availableTimes: Array<{
        dayOfWeek: number;
        startTime: string;
        endTime: string;
    }>;
    thirdPartyId?: string;
    createdAt: Date;
    updatedAt: Date;
}

export interface DoctorDocument extends Document<Types.ObjectId, {}, DoctorBase>, DoctorBase {
    _id: Types.ObjectId;
}

export interface DoctorModel extends Model<DoctorDocument> {
    // Custom methods can be added here if needed
}

/**
 * 医生创建数据接口
 * 创建医生记录时需要提供的数据
 */
export interface DoctorCreateData {
    userId?: Types.ObjectId;
    userData?: {
        name: string;
        avatar?: string;
        role?: string;
        phone: string;
        isActive: boolean;
    };
    departmentId: Types.ObjectId;
    title: string;
    specialties: string[];
    introduction: string;
    consultationFee: number;
    isAvailable?: boolean;
    availableTimes?: Array<{
        dayOfWeek: number;
        startTime: string;
        endTime: string;
    }>;
}

/**
 * 医生更新数据接口
 * 更新医生记录时需要提供的数据，所有字段均为可选
 */
export interface DoctorUpdateData {
    departmentId?: Types.ObjectId;
    userData?: {
        name?: string;
        avatar?: string;
    };
    title?: string;
    specialties?: string[];
    introduction?: string;
    consultationFee?: number;
    isAvailable?: boolean;
    availableTimes?: Array<{
        dayOfWeek: number;
        startTime: string;
        endTime: string;
    }>;
} 