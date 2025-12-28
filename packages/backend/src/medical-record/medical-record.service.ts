import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { MedicalRecord, MedicalRecordStatus } from './schemas/medical-record.schema';
import { ConsultationService } from '../consultation/consultation.service';
import { ConsultationStatus } from '../consultation/schemas/consultation.schema';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class MedicalRecordService {
    private readonly logger = new Logger(MedicalRecordService.name);

    constructor(
        @InjectModel(MedicalRecord.name) private medicalRecordModel: Model<MedicalRecord>,
        private consultationService: ConsultationService,
    ) { }

    /**
     * From consultation to Medical Record Draft (AI Generated)
     */
    async generateFromConsultation(tenantId: string, consultationId: string, doctorId: string): Promise<MedicalRecord> {
        const consultation = await this.consultationService.findOne(tenantId, consultationId);
        if (!consultation) {
            throw new BadRequestException('Consultation not found');
        }

        if (!consultation.aiSuggestion) {
            throw new BadRequestException('Consultation has no AI suggestion yet');
        }

        const draft = new this.medicalRecordModel({
            id: uuidv4(),
            tenantId,
            patientId: consultation.userId,
            doctorId,
            consultationId,
            visitDate: new Date(),
            chiefComplaint: consultation.symptoms,
            presentIllness: `Duration: ${consultation.duration || 'N/A'}. Symptoms: ${consultation.symptoms}`,
            diagnosis: consultation.aiSuggestion.possibleConditions,
            treatmentPlan: consultation.aiSuggestion.recommendations,
            status: MedicalRecordStatus.DRAFT,
        });

        return draft.save();
    }

    async approve(tenantId: string, id: string, doctorId: string, updates: any): Promise<MedicalRecord | null> {
        return this.medicalRecordModel.findOneAndUpdate(
            { tenantId, id, doctorId },
            {
                ...updates,
                status: MedicalRecordStatus.OFFICIAL,
                reviewTime: new Date()
            },
            { new: true },
        ).exec();
    }

    async findByPatient(tenantId: string, patientId: string): Promise<MedicalRecord[]> {
        return this.medicalRecordModel.find({ tenantId, patientId }).sort({ visitDate: -1 }).exec();
    }

    async findById(tenantId: string, id: string): Promise<MedicalRecord | null> {
        return this.medicalRecordModel.findOne({ tenantId, id }).exec();
    }

    // Methods for Controller compatibility
    async getRecordById(id: string): Promise<MedicalRecord | null> {
        return this.medicalRecordModel.findOne({ id }).exec();
    }

    async getRecordsByPatient(patientId: string, tenantId: string): Promise<MedicalRecord[]> {
        return this.findByPatient(tenantId, patientId);
    }
}
