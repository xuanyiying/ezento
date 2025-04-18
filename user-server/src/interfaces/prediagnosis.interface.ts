import { Document } from 'mongoose';

// 定义预诊断文档接口
export interface PreDiagnosisDocument extends Document {
    id: string; // 预诊断ID
    patientId: string; // 患者ID
    symptoms?: string; // 症状
    bodyParts?: string[]; // 身体部位
    duration?: string; // 持续时间
    existingConditions?: string[]; // 现有条件
    images?: string[]; // 图片
    status: string; // 状态
    createTime: Date; // 创建时间
    doctorAdvice?: {
        doctorId: string; // 医生ID
        advice: string; // 建议
        recommendDepartment?: string; // 推荐科室
        urgencyLevel?: string; // 紧急程度
        createTime: Date; // 创建时间
    };
    aiSuggestion?: {
        possibleConditions: string | string[]; // 可能条件
        recommendations: string | string[]; // 推荐
        urgencyLevel: string; // 紧急程度
        suggestedDepartments: string[]; // 推荐科室
        createTime: Date; // 创建时间
    };
    toObject: () => any;
}

// 定义预诊断列表项接口
export interface PreDiagnosisListItem {
    prediagnosisId: string; // 预诊断ID
    symptoms: string; // 症状
    status: string; // 状态
    createTime: Date; // 创建时间
    doctorName: string; // 医生名称
}

// 定义预诊断数据接口
export interface PrediagnosisData {
    consultationId: string; // 会诊ID
    patientId: string; // 患者ID
    conversationId: string; // 会话ID
    symptoms: string[]; // 症状
    bodyParts?: string[]; // 身体部位
    duration: string; // 持续时间
    existingConditions?: string[]; // 现有条件
    images?: string[]; // 图片
    status: string; // 状态
    createTime: Date; // 创建时间
    aiSuggestion?: {
        possibleConditions: string | string[]; // 可能条件
        recommendations: string | string[]; // 推荐
        urgencyLevel: string; // 紧急程度
        suggestedDepartments: string[]; // 推荐科室
        createTime: Date; // 创建时间
    };
}
