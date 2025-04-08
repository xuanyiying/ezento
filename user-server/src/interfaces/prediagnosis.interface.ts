import { Document } from 'mongoose';

// 定义预诊断文档接口
export interface PreDiagnosisDocument extends Document {
    _id: any;
    patientId: any;
    symptoms: string;
    bodyParts?: string[];
    duration: string;
    existingConditions?: string[];
    images?: string[];
    status: string;
    createTime: Date;
    doctorAdvice?: {
        doctorId: any;
        advice: string;
        recommendDepartment?: string;
        urgencyLevel?: string;
        createTime: Date;
    };
    aiSuggestion?: {
        possibleConditions: string | string[];
        recommendations: string | string[];
        urgencyLevel: string;
        suggestedDepartments: string[];
        createTime: Date;
    };
    toObject: () => any;
}

// 定义预诊断列表项接口
export interface PreDiagnosisListItem {
    prediagnosisId: any;
    symptoms: string;
    status: string;
    createTime: Date;
    doctorName: any;
}

// 定义预诊断数据接口
export interface PreDiagnosisData {
    patientId: string;
    symptoms: string[];
    bodyParts?: string[];
    duration: string;
    existingConditions?: string[];
    images?: string[];
} 