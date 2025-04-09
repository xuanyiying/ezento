import logger from '../config/logger';
import mongoose from 'mongoose';
import { Consultation, User } from '../models';
import { AiService } from './ai.service';
import { 
    IConsultation, 
    CreateConsultationRequest, 
    UpdateConsultationRequest, 
    GetConsultationListRequest,
    ConsultationType,
    ConsultationStatus,
    IAiSuggestion
} from '../interfaces/consultation.interface';
import { PrediagnosisInfo, ReportInfo } from './ai.service';

// Define interfaces for populated fields
interface PopulatedUser {
    _id: mongoose.Types.ObjectId;
    name: string;
    gender?: string;
    birthDate?: Date;
}

interface PopulatedDoctor {
    _id: mongoose.Types.ObjectId;
    name: string;
}

interface PopulatedConsultation extends Omit<IConsultation, 'patientId' | 'doctorId'> {
    patientId: PopulatedUser;
    doctorId?: PopulatedDoctor;
}

class ConsultationService {
    /**
     * 创建新的会诊
     */
    static async createConsultation(data: CreateConsultationRequest): Promise<IConsultation> {
        try {
            // Convert patientId to ObjectId if it's a string
            const userId = typeof data.userId === 'string' 
                ? mongoose.Types.ObjectId.isValid(data.userId) 
                    ? new mongoose.Types.ObjectId(data.userId) 
                    : new mongoose.Types.ObjectId() 
                : data.userId;
            
            // 获取患者信息用于AI集成
            const user = await User.findById(userId);
            let aiSuggestion = null;
            
            // 如果找到患者，根据会诊类型获取AI建议
            if (user) {
                try {
                    if (data.consultationType === ConsultationType.PRE_DIAGNOSIS) {
                        // 预问诊AI建议
                        const patientInfo: PrediagnosisInfo = {
                            age: user.birthDate
                                ? Math.floor((new Date().getTime() - new Date(user.birthDate).getTime()) / (365.25 * 24 * 60 * 60 * 1000))
                                : undefined,
                            gender: user.gender,
                            symptoms: [data.symptoms], // 转换为字符串数组
                            bodyParts: data.bodyParts,
                            duration: data.duration,
                            existingConditions: data.existingConditions,
                        };
                        
                        aiSuggestion = await AiService.generatePrediagnosis(patientInfo);
                    } else if (data.consultationType === ConsultationType.REPORT_INTERPRETATION && data.reportType && data.description) {
                        // 报告解读AI建议
                        const reportInfo: ReportInfo = {
                            patientAge: user.birthDate 
                                ? Math.floor((new Date().getTime() - new Date(user.birthDate).getTime()) / (365.25 * 24 * 60 * 60 * 1000))
                                : undefined,
                            patientGender: user.gender,
                            reportType: data.reportType,
                            reportDate: data.reportDate?.toISOString().split('T')[0],
                            hospital: data.hospital,
                            description: data.description,
                            reportContent: data.description
                        };
                        
                        const aiInterpretation = await AiService.generateReportInterpretation(reportInfo);
                        
                        if (aiInterpretation) {
                            aiSuggestion = {
                                possibleConditions: aiInterpretation.interpretation,
                                recommendations: aiInterpretation.suggestions ? aiInterpretation.suggestions.join(', ') : '',
                                urgencyLevel: 'medium',
                                suggestedDepartments: [],
                                createTime: new Date()
                            };
                        }
                    } else if (data.consultationType === ConsultationType.GUIDE) {
                        // 导诊AI建议 - 可以添加特定的导诊AI逻辑
                        const patientInfo: PrediagnosisInfo = {
                            age: user.birthDate
                                ? Math.floor((new Date().getTime() - new Date(user.birthDate).getTime()) / (365.25 * 24 * 60 * 60 * 1000))
                                : undefined,
                            gender: user.gender,
                            symptoms: [data.symptoms], // 转换为字符串数组
                            bodyParts: data.bodyParts,
                            duration: data.duration,
                            existingConditions: data.existingConditions,
                        };
                        
                        // 使用预问诊逻辑作为基础，特别关注科室推荐
                        const guideAiSuggestion = await AiService.generatePrediagnosis(patientInfo);
                        if (guideAiSuggestion) {
                            aiSuggestion = {
                                ...guideAiSuggestion,
                                // 可以在这里添加导诊特定的逻辑
                            };
                        }
                    }
                } catch (error: any) {
                    logger.error(`生成AI建议时出错: ${error.message}`);
                    // 如果AI建议失败，继续执行但不包含AI建议
                }
            }

            // 创建会诊，如果有AI建议则包含
            const consultation = new Consultation({
                userId: userId,
                consultationType: data.consultationType,
                symptoms: data.symptoms,
                bodyParts: data.bodyParts,
                duration: data.duration,
                existingConditions: data.existingConditions,
                images: data.images,
                reportType: data.reportType,
                reportDate: data.reportDate,
                hospital: data.hospital,
                reportImages: data.reportImages,
                fee: data.fee,
                status: ConsultationStatus.PENDING,
                startTime: new Date(),
                aiSuggestion: aiSuggestion,
                conversationId: data.conversationId ? new mongoose.Types.ObjectId(data.conversationId) : undefined
            });

            await consultation.save();
            return consultation;
        } catch (error) {
            logger.error(`创建会诊时出错: ${error}`);
            throw error;
        }
    }

    /**
     * 获取会诊列表
     */
    static async getConsultationList(params: GetConsultationListRequest) {
        try {
            const { patientId, doctorId, consultationType, status, page = 1, limit = 10 } = params;
            const skip = (page - 1) * limit;
            
            // 构建查询条件
            const query: any = {};
            if (patientId) query.patientId = patientId;
            if (doctorId) query.doctorId = doctorId;
            if (consultationType) query.consultationType = consultationType;
            if (status) query.status = status;
            
            // 查询总数
            const total = await Consultation.countDocuments(query);
            
            // 查询列表
            const consultations = await Consultation.find(query)
                .populate('patientId', 'name gender birthDate')
                .populate('doctorId', 'name')
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .exec() as unknown as PopulatedConsultation[];
            
            // 格式化返回结果
            const list = consultations.map(consultation => {
                // Ensure conversationId exists before converting to string
                const listItem = {
                    consultationId: consultation._id,
                    patientName: consultation.patientId.name,
                    doctorName: consultation.doctorId?.name,
                    consultationType: consultation.consultationType,
                    symptoms: consultation.symptoms,
                    status: consultation.status,
                    startTime: consultation.startTime,
                    endTime: consultation.endTime
                };

                // Add conversationId only if it exists
                if (consultation.conversationId) {
                    return {
                        ...listItem,
                        conversationId: consultation.conversationId
                    };
                }
                
                return listItem;
            });
            
            return {
                total,
                list,
                page,
                limit
            };
        } catch (error) {
            logger.error(`获取会诊列表时出错: ${error}`);
            throw error;
        }
    }

    /**
     * 获取会诊详情
     */
    static async getConsultationDetails(id: string) {
        try {
            const consultation = await Consultation.findById(id)
                .populate('patientId', 'name gender birthDate')
                .populate('doctorId', 'name')
                .exec() as unknown as PopulatedConsultation;
            
            if (!consultation) {
                return null;
            }
            
            // 计算患者年龄
            const age = consultation.patientId.birthDate
                ? Math.floor((new Date().getTime() - new Date(consultation.patientId.birthDate).getTime()) / (365.25 * 24 * 60 * 60 * 1000))
                : undefined;
            
            const consultationObj = consultation.toObject();
            
            return {
                consultationId: consultation._id,
                patient: {
                    id: consultation.patientId._id,
                    name: consultation.patientId.name,
                    age,
                    gender: consultation.patientId.gender
                },
                doctor: consultation.doctorId ? {
                    id: consultation.doctorId._id,
                    name: consultation.doctorId.name
                } : undefined,
                consultationType: consultation.consultationType,
                symptoms: consultation.symptoms,
                bodyParts: consultation.bodyParts,
                duration: consultation.duration,
                existingConditions: consultation.existingConditions,
                images: consultation.images,
                reportType: consultation.reportType,
                reportDate: consultation.reportDate,
                hospital: consultation.hospital,
                reportImages: consultation.reportImages,
                diagnosis: consultation.diagnosis,
                prescription: consultation.prescription,
                notes: consultation.notes,
                fee: consultation.fee,
                status: consultation.status,
                startTime: consultation.startTime,
                endTime: consultation.endTime,
                doctorAdvice: consultation.doctorAdvice,
                aiSuggestion: consultation.aiSuggestion,
                createdAt: consultation.createdAt,
                updatedAt: consultation.updatedAt
            };
        } catch (error) {
            logger.error(`获取会诊详情时出错: ${error}`);
            throw error;
        }
    }

    /**
     * 更新会诊
     */
    static async updateConsultation(data: UpdateConsultationRequest): Promise<IConsultation> {
        try {
            const { consultationId, diagnosis, prescription, notes, status, endTime, doctorAdvice } = data;
            
            // 查找会诊
            const consultation = await Consultation.findById(consultationId);
            if (!consultation) {
                throw new Error('会诊不存在');
            }
            
            // 更新字段
            if (diagnosis !== undefined) consultation.diagnosis = diagnosis;
            if (prescription !== undefined) consultation.prescription = prescription;
            if (notes !== undefined) consultation.notes = notes;
            if (status !== undefined) consultation.status = status;
            if (endTime !== undefined) consultation.endTime = endTime;
            
            // 更新医生建议
            if (doctorAdvice) {
                consultation.doctorAdvice = {
                    doctorId: new mongoose.Types.ObjectId(doctorAdvice.doctorId),
                    advice: doctorAdvice.advice,
                    recommendDepartment: doctorAdvice.recommendDepartment,
                    urgencyLevel: doctorAdvice.urgencyLevel,
                    createTime: new Date()
                };
            }
            
            await consultation.save();
            return consultation;
        } catch (error) {
            logger.error(`更新会诊时出错: ${error}`);
            throw error;
        }
    }

    /**
     * 获取患者的会诊列表
     */
    static async getPatientConsultations(patientId: string, page: number = 1, limit: number = 10) {
        return this.getConsultationList({ patientId, page, limit });
    }

    /**
     * 获取医生的会诊列表
     */
    static async getDoctorConsultations(doctorId: string, status?: ConsultationStatus, page: number = 1, limit: number = 10) {
        return this.getConsultationList({ doctorId, status, page, limit });
    }

    /**
     * 提交医生建议
     */
    static async submitDoctorAdvice(
        consultationId: string, 
        doctorId: string,
        advice: string, 
        recommendDepartment?: string, 
        urgencyLevel?: string
    ): Promise<IConsultation | null> {
        try {
            const consultation = await Consultation.findById(consultationId);
            if (!consultation) {
                return null;
            }
            
            // 更新医生建议
            consultation.doctorAdvice = {
                doctorId: new mongoose.Types.ObjectId(doctorId),
                advice,
                recommendDepartment,
                urgencyLevel,
                createTime: new Date()
            };
            
            // 更新状态为进行中
            consultation.status = ConsultationStatus.IN_PROGRESS;
            
            await consultation.save();
            return consultation;
        } catch (error) {
            logger.error(`提交医生建议时出错: ${error}`);
            throw error;
        }
    }

    /**
     * 提交ai建议
     */
    static async submitAiSuggestion(
        consultationId: string,
        aiSuggestion: IAiSuggestion
    ): Promise<IConsultation | null> {
        try {
            const consultation = await Consultation.findById(consultationId);
            if (!consultation) {
                return null;
            }
            consultation.aiSuggestion = aiSuggestion;
            await consultation.save();
            return consultation;
        } catch (error) {
            logger.error(`提交ai建议时出错: ${error}`);
            throw error;
        }
    }
}

export default ConsultationService; 