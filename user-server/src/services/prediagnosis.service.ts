import logger from '../config/logger';
import { PreDiagnosis, User } from '../models';
import AiService, { PatientPreDiagnosisInfo } from './ai.service';
import mongoose from 'mongoose';
import { PreDiagnosisData } from '../interfaces/prediagnosis.interface';

class PrediagnosisService {
    /**
     * 创建新的预诊断
     */
    static async createPrediagnosis(data: PreDiagnosisData) {
        try {
            // 获取患者信息用于AI集成
            const user = await User.findById(data.patientId);
            let aiSuggestion = null;
            
            // 如果找到患者，获取AI预诊断
            if (user) {
                const patientInfo: PatientPreDiagnosisInfo = {
                    age: user.birthDate 
                        ? Math.floor((new Date().getTime() - new Date(user.birthDate).getTime()) / (365.25 * 24 * 60 * 60 * 1000))
                        : undefined,
                    gender: user.gender,
                    symptoms: data.symptoms,
                    bodyParts: data.bodyParts,
                    duration: data.duration,
                    existingConditions: data.existingConditions
                };
                
                try {
                    // 调用AI服务进行预诊断
                    aiSuggestion = await AiService.generatePreDiagnosis(patientInfo);
                } catch (error: any) {
                    logger.error(`生成AI预诊断时出错: ${error.message}`);
                    // 如果AI建议失败，继续执行但不包含AI建议
                }
            }

            // 创建预诊断，如果有AI建议则包含
            const prediagnosis = new PreDiagnosis({
                patientId: data.patientId,
                symptoms: data.symptoms,
                bodyParts: data.bodyParts,
                duration: data.duration,
                existingConditions: data.existingConditions,
                images: data.images,
                aiSuggestion: aiSuggestion ? {
                    possibleConditions: aiSuggestion.possibleConditions,
                    recommendations: aiSuggestion.recommendations,
                    urgencyLevel: aiSuggestion.urgencyLevel,
                    suggestedDepartments: aiSuggestion.suggestedDepartments,
                    createTime: new Date()
                } : undefined,
                status: 'SUBMITTED',
                createTime: new Date()
            });

            await prediagnosis.save();
            return prediagnosis;
        } catch (error) {
            logger.error(`创建预诊断时出错: ${error}`);
            throw error;
        }
    }

    /**
     * 获取患者的预诊断列表
     */
    static async getPrediagnosisList(patientId: string, page: number = 1, limit: number = 10) {
        try {
            const skip = (page - 1) * limit;
            const total = await PreDiagnosis.countDocuments({ patientId });
            const list = await PreDiagnosis.find({ patientId })
                .populate('doctorAdvice.doctorId', 'name')
                .sort({ createTime: -1 })
                .skip(skip)
                .limit(limit)
                .exec();

            return {
                total,
                list: list.map(item => ({
                    prediagnosisId: item._id,
                    symptoms: item.symptoms,
                    status: item.status,
                    createTime: item.createTime,
                    doctorName: item.doctorAdvice?.doctorId?.name || null
                }))
            };
        } catch (error) {
            logger.error(`获取预诊断列表时出错: ${error}`);
            throw error;
        }
    }

    /**
     * 获取预诊断详情
     */
    static async getPrediagnosisDetails(id: string) {
        try {
            // 使用 mongoose.Types.ObjectId 验证 ID
            if (!mongoose.Types.ObjectId.isValid(id)) {
                return null;
            }

            const details = await PreDiagnosis.findById(id)
                .populate('patientId', 'name gender birthDate')
                .populate('doctorAdvice.doctorId', 'name')
                .exec();

            if (!details) {
                return null;
            }

            // 从填充字段获取患者数据
            const patientData = details.patientId as unknown as { 
                name: string;
                gender?: string;
                birthDate?: Date;
            };

            // 计算出生日期到年龄的转换
            const age = patientData.birthDate 
                ? Math.floor((new Date().getTime() - new Date(patientData.birthDate).getTime()) / (365.25 * 24 * 60 * 60 * 1000))
                : null;

            // 获取 AI 建议数据
            const aiSuggestionData = details.toObject().aiSuggestion;

            return {
                prediagnosisId: details._id,
                patientInfo: {
                    name: patientData.name,
                    age,
                    gender: patientData.gender
                },
                symptoms: details.symptoms,
                duration: details.duration,
                bodyParts: details.bodyParts,
                images: details.images,
                existingConditions: details.existingConditions,
                aiSuggestion: aiSuggestionData,
                doctorAdvice: details.doctorAdvice?.advice,
                recommendedDepartment: details.doctorAdvice?.recommendDepartment,
                urgencyLevel: details.doctorAdvice?.urgencyLevel || aiSuggestionData?.urgencyLevel,
                status: details.status,
                createTime: details.createTime
            };
        } catch (error) {
            logger.error(`获取预诊断详情时出错: ${error}`);
            throw error;
        }
    }

    /**
     * 提交新的预诊断
     */
    static async submitPreDiagnosis(data: PreDiagnosisData) {
        try {
            // 与 createPrediagnosis 相同的实现
            return await this.createPrediagnosis(data);
        } catch (error) {
            logger.error(`提交预诊断时出错: ${error}`);
            throw error;
        }
    }

    /**
     * 获取带分页的患者预诊断列表
     */
    static async getPatientPreDiagnosis(patientId: string, page: number = 1, limit: number = 10) {
        try {
            // 与 getPrediagnosisList 相同的实现
            const { total, list } = await this.getPrediagnosisList(patientId, page, limit);
            return { prediagnoses: list, total };
        } catch (error) {
            logger.error(`获取患者预诊断列表时出错: ${error}`);
            throw error;
        }
    }

    /**
     * 根据 ID 获取预诊断
     */
    static async getPreDiagnosisById(id: string) {
        try {
            // 与 getPrediagnosisDetails 相同的实现
            return await this.getPrediagnosisDetails(id);
        } catch (error) {
            logger.error(`通过 ID 获取预诊断时出错: ${error}`);
            throw error;
        }
    }

    /**
     * 获取带分页和可选状态过滤的医生预诊断列表
     */
    static async getDoctorPreDiagnosis(doctorId: string, status?: string, page: number = 1, limit: number = 10) {
        try {
            const skip = (page - 1) * limit;
            
            // 使用状态过滤器构建查询
            const query: any = {};
            if (status) {
                query.status = status;
            }
            
            // 如果提供了医生 ID，按 doctorAdvice.doctorId 过滤
            if (doctorId) {
                query['doctorAdvice.doctorId'] = doctorId;
            }
            
            const total = await PreDiagnosis.countDocuments(query);
            const list = await PreDiagnosis.find(query)
                .populate('patientId', 'name gender birthDate')
                .sort({ createTime: -1 })
                .skip(skip)
                .limit(limit)
                .exec();

            return { 
                prediagnoses: list,
                total 
            };
        } catch (error) {
            logger.error(`获取医生预诊断列表时出错: ${error}`);
            throw error;
        }
    }

    /**
     * 提交医生对预诊断的建议
     */
    static async submitDoctorAdvice(
        prediagnosisId: string, 
        doctorId: string, 
        advice: string, 
        recommendDepartment?: string, 
        urgencyLevel?: string
    ) {
        try {
            // 使用 mongoose.Types.ObjectId 验证 ID
            if (!mongoose.Types.ObjectId.isValid(prediagnosisId) || !mongoose.Types.ObjectId.isValid(doctorId)) {
                return null;
            }

            // 更新预诊断文档，添加医生建议并更改状态
            const updatedPreDiagnosis = await PreDiagnosis.findByIdAndUpdate(
                prediagnosisId,
                {
                    $set: {
                        'doctorAdvice.doctorId': doctorId,
                        'doctorAdvice.advice': advice,
                        'doctorAdvice.recommendDepartment': recommendDepartment,
                        'doctorAdvice.urgencyLevel': urgencyLevel,
                        'doctorAdvice.createTime': new Date(),
                        status: 'REVIEWED'
                    }
                },
                { new: true }
            );

            return updatedPreDiagnosis;
        } catch (error) {
            logger.error(`提交医生建议时出错: ${error}`);
            throw error;
        }
    }
}

export default PrediagnosisService;