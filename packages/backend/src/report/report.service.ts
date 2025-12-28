import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Report, ReportStatus } from './schemas/report.schema';
import { OCRService } from '../common/ocr.service';
import { AIEngineService } from '../ai-providers/ai-engine.service';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class ReportService {
    private readonly logger = new Logger(ReportService.name);

    constructor(
        @InjectModel(Report.name) private reportModel: Model<Report>,
        private ocrService: OCRService,
        private aiEngine: AIEngineService,
    ) { }

    async create(tenantId: string, userId: string, fileData: { fileName: string; fileUrl: string; fileType: string }): Promise<Report> {
        const report = new this.reportModel({
            id: uuidv4(),
            tenantId,
            userId,
            ...fileData,
            status: ReportStatus.PENDING,
        });
        return report.save();
    }

    async processAndInterpret(tenantId: string, id: string, imageBase64: string): Promise<Report> {
        const report = await this.reportModel.findOne({ tenantId, id });
        if (!report) throw new BadRequestException('Report not found');

        try {
            report.status = ReportStatus.INTERPRETING;
            await report.save();

            // 1. OCR Extraction
            const text = await this.ocrService.recognizeImage(imageBase64);
            report.ocrText = text;

            // 2. AI Interpretation
            const aiResponse = await this.aiEngine.call(
                {
                    prompt: `请作为专业医生解读以下检查报告文本：\n${text}`,
                    model: '', // Auto select
                    metadata: {
                        templateName: 'medical_report_interpretation',
                        templateVariables: { reportText: text },
                    },
                },
                report.userId,
                'MEDICAL_REPORT',
            );

            // Parse AI response (Assuming AI returns JSON or structured text)
            // For now, we'll store the whole content as summary or parse it if template is strict
            report.interpretation = {
                summary: aiResponse.content,
                abnormalIndicators: [], // TODO: Extract from AI response if possible
                healthAdvice: '请遵医嘱进行后续治疗。',
                followUpSuggestions: '建议定期复查。',
                interpretedAt: new Date(),
            };

            report.status = ReportStatus.COMPLETED;
        } catch (error) {
            report.status = ReportStatus.FAILED;
            report.errorCode = 'INTERPRETATION_ERROR';
            report.errorMessage = error.message;
            this.logger.error(`Failed to interpret report ${id}: ${error.message}`);
        }

        return report.save();
    }

    async findByUser(tenantId: string, userId: string): Promise<Report[]> {
        return this.reportModel.find({ tenantId, userId }).sort({ createdAt: -1 }).exec();
    }

    async findById(tenantId: string, id: string): Promise<Report | null> {
        return this.reportModel.findOne({ tenantId, id }).exec();
    }

    // Methods for Controller compatibility
    async getReportById(id: string): Promise<Report | null> {
        return this.reportModel.findOne({ id }).exec();
    }

    async createReport(data: any): Promise<Report> {
        const report = await this.create(data.tenantId, data.userId, {
            fileName: data.fileName || 'report',
            fileUrl: data.fileUrl,
            fileType: data.type || 'image',
        });

        // If originalContent is provided, process immediately
        if (data.originalContent) {
            return this.processAndInterpret(data.tenantId, report.id, data.originalContent);
        }

        return report;
    }

    async getReportsByPatient(patientId: string, tenantId: string): Promise<Report[]> {
        return this.reportModel.find({ userId: patientId, tenantId }).sort({ createdAt: -1 }).exec();
    }
}
