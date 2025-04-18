import { Document, Types } from 'mongoose';

/**
 * 可用时间段接口
 */
export interface AvailableTime {
    dayOfWeek: number;
    startTime: string;
    endTime: string;
}

/**
 * 医生文档接口
 * 描述MongoDB中的医生文档结构
 */
export interface DoctorBase {
    id: string;
    userId: string;
    departmentId: string;
    title: string;
    specialties: string[];
    introduction: string;
    consultationFee: number;
    isAvailable: boolean;
    rating: number;
    consultationCount: number;
    goodReviewRate: number;
    availableTimes: Types.Array<AvailableTime>;
    thirdPartyId?: string | null;
    createdAt: Date;
    updatedAt: Date;
}

export interface DoctorDocument extends Document, Omit<DoctorBase, 'id' | 'availableTimes'> {
    id: string;
    availableTimes: Types.Array<AvailableTime>;
}

/**
 * 医生创建数据接口
 * 创建医生记录时需要提供的数据
 */
export interface DoctorCreateData {
    userId?: string;
    userData?: {
        name: string;
        avatar?: string;
        role?: string;
        phone: string;
        isActive: boolean;
    };
    departmentId: string;
    title: string;
    specialties: string[];
    introduction: string;
    consultationFee: number;
    isAvailable?: boolean;
    availableTimes?: AvailableTime[];
}

/**
 * 医生更新数据接口
 * 更新医生记录时需要提供的数据，所有字段均为可选
 */
export interface DoctorUpdateData {
    departmentId?: string;
    userData?: {
        name?: string;
        avatar?: string;
    };
    title?: string;
    specialties?: string[];
    introduction?: string;
    consultationFee?: number;
    isAvailable?: boolean;
    availableTimes?: AvailableTime[];
}
