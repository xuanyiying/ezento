import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Consultation, ConsultationStatus, AiSuggestion } from './schemas/consultation.schema';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class ConsultationService {
    private readonly logger = new Logger(ConsultationService.name);

    constructor(
        @InjectModel(Consultation.name) private consultationModel: Model<Consultation>,
    ) { }

    async create(tenantId: string, userId: string, data: any): Promise<Consultation> {
        const consultation = new this.consultationModel({
            ...data,
            id: uuidv4(),
            tenantId,
            userId,
            status: ConsultationStatus.PENDING,
            startTime: new Date(),
        });
        return consultation.save();
    }

    async findOne(tenantId: string, id: string): Promise<Consultation | null> {
        return this.consultationModel.findOne({ tenantId, id }).exec();
    }

    async findAll(tenantId: string, query: any = {}): Promise<Consultation[]> {
        return this.consultationModel.find({ ...query, tenantId }).sort({ createdAt: -1 }).exec();
    }

    async updateStatus(tenantId: string, id: string, status: ConsultationStatus): Promise<Consultation | null> {
        return this.consultationModel.findOneAndUpdate(
            { tenantId, id },
            { status },
            { new: true },
        ).exec();
    }

    async addAiSuggestion(tenantId: string, id: string, suggestion: AiSuggestion): Promise<Consultation | null> {
        return this.consultationModel.findOneAndUpdate(
            { tenantId, id },
            {
                aiSuggestion: suggestion,
                status: ConsultationStatus.COMPLETED
            },
            { new: true },
        ).exec();
    }

    // Methods for Controller compatibility
    async createConsultation(data: any): Promise<Consultation> {
        return this.create(data.tenantId, data.userId, data);
    }

    async getConsultationById(id: string): Promise<Consultation | null> {
        // Note: tenantId should be extracted from request context
        return this.consultationModel.findOne({ id }).exec();
    }

    async getConsultationsByPatient(patientId: string, tenantId: string): Promise<Consultation[]> {
        return this.consultationModel.find({ patientId, tenantId }).sort({ createdAt: -1 }).exec();
    }
}
