import { Document, Schema, Types } from 'mongoose';
import { UserDocument } from './user.interface';

/**
 * 会诊类型枚举
 */
export enum ConsultationType {
    PRE_DIAGNOSIS = 'PRE_DIAGNOSIS', // 预问诊
    GUIDE = 'GUIDE',                 // 导诊
    REPORT_INTERPRETATION = 'REPORT_INTERPRETATION' // 报告解读
}

/**
 * 会诊状态枚举
 */
export enum ConsultationStatus {
    PENDING = 'PENDING',       // 待处理
    IN_PROGRESS = 'IN_PROGRESS', // 进行中
    COMPLETED = 'COMPLETED',   // 已完成
    CANCELLED = 'CANCELLED'    // 已取消
}

/**
 * AI建议接口
 */
export interface IAiSuggestion {
    possibleConditions?: string;     // 可能的病症
    recommendations?: string;        // 建议措施
    urgencyLevel?: string;           // 紧急程度
    suggestedDepartments?: string[]; // 建议科室
    createTime: Date;                // 创建时间
}

/**
 * 医生建议接口
 */
export interface IDoctorAdvice {
    doctorId: UserDocument['_id'];  // 医生ID
    advice: string;                 // 建议内容
    recommendDepartment?: string;   // 推荐科室
    urgencyLevel?: string;          // 紧急程度
    createTime: Date;               // 创建时间
}

/**
 * 创建会诊请求接口
 */
export interface CreateConsultationRequest {
    userId: string;                    // 患者ID
    consultationType: ConsultationType;   // 会诊类型
    symptoms: string;                     // 症状描述
    bodyParts?: string[];                 // 身体部位
    duration?: string;                    // 持续时间
    existingConditions?: string[];        // 已有疾病
    images?: string[];                    // 图片列表
    reportType?: string;                  // 报告类型
    reportDate?: Date;                    // 报告日期
    hospital?: string;                    // 医院名称
    reportImages?: string[];              // 报告图片
    description?: string;                 // 报告描述
    fee: number;                          // 费用
    conversationId?: string;               // 会话ID
    status?: ConsultationStatus;          // 状态
}

/**
 * 更新会诊请求接口
 */
export interface UpdateConsultationRequest {
    consultationId: string;               // 会诊ID
    diagnosis?: string;                   // 诊断结果
    prescription?: string;                // 处方
    notes?: string;                       // 备注
    status?: ConsultationStatus;          // 状态
    endTime?: Date;                       // 结束时间
    doctorAdvice?: IDoctorAdvice;          // 医生建议
    aiSuggestion?: IAiSuggestion;         // AI建议
}

/**
 * 获取会诊列表请求接口
 */
export interface GetConsultationListRequest {
    userId?: string;                   // 患者ID
    consultationType?: ConsultationType;  // 会诊类型
    status?: ConsultationStatus;          // 状态
    page?: number;                        // 页码
    limit?: number;                       // 每页数量
}

/**
 * 会诊列表项接口
 */
export interface ConsultationListItem {
    consultationId: Schema.Types.ObjectId;  // 会诊ID
    conversationId?: Schema.Types.ObjectId;  // 会话ID
    userName?: string;                 // 患者姓名
    consultationType: ConsultationType;   // 会诊类型
    symptoms: string;                     // 症状描述
    status: ConsultationStatus;           // 状态
    startTime: Date;                      // 开始时间
    endTime?: Date;                       // 结束时间
}

/**
 * 会诊接口（数据库模型）
 */
export interface IConsultation extends Document {
    userId: string | Types.ObjectId;  // 患者ID
    conversationId?: Schema.Types.ObjectId;  // 会话ID
    consultationType: ConsultationType;             // 会诊类型
    symptoms: string;                               // 症状描述
    bodyParts?: string[];                           // 身体部位
    duration?: string;                              // 持续时间
    existingConditions?: string[];                  // 已有疾病
    images?: string[];                              // 图片列表
    reportType?: string;                            // 报告类型
    reportDate?: Date;                              // 报告日期
    hospital?: string;                              // 医院名称
    reportImages?: string[];                        // 报告图片
    diagnosis?: string;                             // 诊断结果
    prescription?: string;                          // 处方
    notes?: string;                                 // 备注
    fee: number;                                    // 费用
    status: ConsultationStatus;                     // 状态
    startTime: Date;                                // 开始时间
    endTime?: Date;                                 // 结束时间
    doctorAdvice?: IDoctorAdvice;                   // 医生建议
    aiSuggestion?: IAiSuggestion;                   // AI建议
    createdAt: Date;                                // 创建时间
    updatedAt: Date;                                // 更新时间
} 