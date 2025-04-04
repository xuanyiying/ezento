import logger from '../config/logger';
import mongoose from 'mongoose';
import { Report, User } from '../models';
import AiService, { ReportInfo } from './ai.service';

interface PopulatedPatient {
    _id: mongoose.Types.ObjectId;
    name: string;
    gender: string;
    birthDate: Date;
}

interface PopulatedDoctor {
    _id: mongoose.Types.ObjectId;
    name: string;
}

interface PopulatedReport {
    _id: mongoose.Types.ObjectId;
    patientId: PopulatedPatient;
    reportType: string;
    reportDate: Date;
    hospital: string;
    reportImages: string[];
    description?: string;
    interpretation: {
        doctorId: PopulatedDoctor;
        content: string;
        createTime: Date;
    };
    status: string;
    toObject: () => any;
}

class ReportService {
    /**
     * Upload a new report
     */
    static async uploadReport(reportData: any) {
        try {
            // Create new report
            const report = new Report({
                ...reportData,
                status: 'PENDING'
            });
            await report.save();
            
            // Get AI interpretation if possible
            try {
                // Fetch patient info for AI interpretation
                const patient = await User.findById(reportData.patientId);
                
                if (patient && reportData.description) {
                    const reportInfo: ReportInfo = {
                        patientAge: patient.birthDate 
                            ? Math.floor((new Date().getTime() - new Date(patient.birthDate).getTime()) / (365.25 * 24 * 60 * 60 * 1000))
                            : undefined,
                        patientGender: patient.gender,
                        reportType: reportData.reportType,
                        reportDate: reportData.reportDate,
                        hospital: reportData.hospital,
                        description: reportData.description,
                        reportContent: reportData.description // Use description as content for now
                    };
                    
                    // Generate AI interpretation
                    const aiInterpretation = await AiService.generateReportInterpretation(reportInfo);
                    
                    // Update report with AI interpretation
                    if (aiInterpretation) {
                        report.aiInterpretation = {
                            content: aiInterpretation.interpretation,
                            abnormalIndicators: aiInterpretation.abnormalIndicators,
                            suggestions: aiInterpretation.suggestions,
                            createTime: new Date()
                        };
                        await report.save();
                    }
                }
            } catch (error: any) {
                logger.error(`Error generating AI report interpretation: ${error.message}`);
                // Continue without AI interpretation if it fails
            }
            
            return report;
        } catch (error) {
            logger.error(`Error in uploadReport: ${error}`);
            throw error;
        }
    }

    /**
     * Get report list for a patient
     */
    static async getReportList(patientId: string, page: number = 1, limit: number = 10, reportType?: string) {
        try {
            const skip = (page - 1) * limit;
            const query: any = { patientId };
            
            if (reportType) {
                query.reportType = reportType;
            }

            const total = await Report.countDocuments(query);
            const list = await Report.find(query)
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .exec();

            return {
                total,
                list: list.map((item: any) => ({
                    reportId: item._id,
                    reportType: item.reportType,
                    reportDate: item.reportDate,
                    hospital: item.hospital,
                    status: item.status,
                    createTime: item.createdAt
                }))
            };
        } catch (error) {
            logger.error(`Error in getReportList: ${error}`);
            throw error;
        }
    }

    /**
     * Get report details
     */
    static async getReportDetails(id: string) {
        try {
            // Use mongoose.Types.ObjectId to validate the id
            if (!mongoose.Types.ObjectId.isValid(id)) {
                return null;
            }
            
            const report = await Report.findById(id)
                .populate('patientId', 'name gender birthDate')
                .populate('interpretation.doctorId', 'name')
                .exec() as unknown as PopulatedReport;

            if (!report) {
                return null;
            }

            // Calculate age from birthDate
            const age = report.patientId.birthDate 
                ? Math.floor((new Date().getTime() - new Date(report.patientId.birthDate).getTime()) / (365.25 * 24 * 60 * 60 * 1000))
                : null;

            // Get both doctor and AI interpretations
            const reportObj = report.toObject();
            
            return {
                reportId: report._id,
                patientInfo: {
                    name: report.patientId.name,
                    age,
                    gender: report.patientId.gender
                },
                reportType: report.reportType,
                reportDate: report.reportDate,
                hospital: report.hospital,
                reportImages: report.reportImages,
                description: report.description,
                // Include both human and AI interpretations if available
                interpretation: reportObj.interpretation,
                aiInterpretation: reportObj.aiInterpretation,
                status: report.status
            };
        } catch (error) {
            logger.error(`Error in getReportDetails: ${error}`);
            throw error;
        }
    }

    /**
     * Get AI interpretation for a report
     */
    static async getAIInterpretation(reportId: string) {
        try {
            // Use mongoose.Types.ObjectId to validate the id
            if (!mongoose.Types.ObjectId.isValid(reportId)) {
                return null;
            }
            
            const report = await Report.findById(reportId)
                .populate('patientId', 'gender birthDate')
                .exec();

            if (!report) {
                return null;
            }
            
            // Check if AI interpretation already exists
            if (report.aiInterpretation) {
                return report.aiInterpretation;
            }
            
            // Get patient info
            const patientData = report.patientId as unknown as { gender?: string; birthDate?: Date };
            
            // Generate new AI interpretation
            const reportInfo: ReportInfo = {
                patientAge: patientData.birthDate 
                    ? Math.floor((new Date().getTime() - new Date(patientData.birthDate).getTime()) / (365.25 * 24 * 60 * 60 * 1000))
                    : undefined,
                patientGender: patientData.gender,
                reportType: report.reportType,
                reportDate: report.reportDate?.toISOString() || undefined,
                hospital: report.hospital,
                description: report.description,
                reportContent: report.description || 'No report content available'
            };
            
            const aiInterpretation = await AiService.generateReportInterpretation(reportInfo);
            
            // Save AI interpretation to the report
            report.aiInterpretation = {
                content: aiInterpretation.interpretation,
                abnormalIndicators: aiInterpretation.abnormalIndicators,
                suggestions: aiInterpretation.suggestions,
                createTime: new Date()
            };
            await report.save();
            
            return report.aiInterpretation;
        } catch (error) {
            logger.error(`Error in getAIInterpretation: ${error}`);
            throw error;
        }
    }
}

export default ReportService;