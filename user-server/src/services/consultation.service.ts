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

interface PopulatedConsultation extends Omit<IConsultation, 'userId'> {
    userId: PopulatedUser;
}

class ConsultationService {
    /**
     * 创建新的会诊
     */
    static async createConsultation(data: CreateConsultationRequest): Promise<IConsultation> {
        try {
            // Convert patientId to ObjectId if it's a string
            const userId = data.userId
            
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
            });

            await consultation.save();
            return {
                ...consultation.toObject(),
                userId: consultation.userId.toString()
            } as unknown as  IConsultation;
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
            const { userId, consultationType, status, page = 1, limit = 10 } = params;
            const skip = (page - 1) * limit;
            
            // 构建查询条件
            const query: any = {};
            if (userId) query.userId = userId;
            if (consultationType) query.consultationType = consultationType;
            if (status) query.status = status;
            
            // 查询总数
            const total = await Consultation.countDocuments(query);
            
            // 查询列表
            const consultations = await Consultation.find(query)
                .populate('userId', 'name gender')
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .exec() as unknown as PopulatedConsultation[];
            
            // 格式化返回结果
            const list = consultations.map(consultation => {
                // Ensure conversationId exists before converting to string
                const listItem = {
                    consultationId: consultation._id,
                    consultationType: consultation.consultationType,
                    symptoms: consultation.symptoms,
                    status: consultation.status,
                    startTime: consultation.startTime,
                    endTime: consultation.endTime,

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
                .populate('userId', 'name gender birthDate')
                .exec() as unknown as PopulatedConsultation;
            
            if (!consultation) {
                return null;
            }            
            return {
                consultationId: consultation._id,
                userId: consultation.userId,
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
            const { consultationId, diagnosis, prescription, notes, status, endTime, aiSuggestion } = data;
            
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
            if (aiSuggestion) {
                consultation.aiSuggestion = aiSuggestion
            }
            await consultation.save();
            return {
                ...consultation.toObject(),
                userId: consultation.userId.toString()
            } as unknown as IConsultation;
        } catch (error) {
            logger.error(`更新会诊时出错: ${error}`);
            throw error;
        }
    }

    /**
     * 获取患者的会诊列表
     */
    static async getPatientConsultations(userId: string, page: number = 1, limit: number = 10) {
        return this.getConsultationList({ userId, page, limit });
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
            return {
                ...consultation.toObject(),
                userId: consultation.userId.toString()
            } as unknown as IConsultation;
        } catch (error) {
            logger.error(`提交ai建议时出错: ${error}`);
            throw error;
        }
    }
}

export default ConsultationService; 