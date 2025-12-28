import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';

export enum MedicalRecordStatus {
    DRAFT = 'DRAFT',        // AI generated, waiting for review
    OFFICIAL = 'OFFICIAL',  // Doctor reviewed and approved
    ARCHIVED = 'ARCHIVED',
}

@Schema({ _id: false })
export class Medication {
    @Prop({ required: true })
    name: string;

    @Prop()
    specification?: string;

    @Prop()
    dosage: string;

    @Prop()
    frequency: string;

    @Prop()
    route: string;

    @Prop()
    duration: string;

    @Prop()
    quantity: number;

    @Prop()
    notes?: string;
}

@Schema({ timestamps: true })
export class MedicalRecord extends Document {
    @Prop({ required: true, index: true })
    id: string;

    @Prop({ required: true, index: true })
    tenantId: string;

    @Prop({ required: true, index: true })
    patientId: string; // Related User ID (PATIENT role)

    @Prop({ required: true, index: true })
    doctorId: string; // Related User ID (DOCTOR role)

    @Prop({ index: true })
    consultationId?: string; // Optional link to pre-diagnosis

    @Prop({ default: Date.now })
    visitDate: Date;

    @Prop()
    department: string;

    @Prop()
    chiefComplaint: string; // 主诉

    @Prop()
    presentIllness: string; // 现病史

    @Prop()
    pastHistory: string;    // 既往史

    @Prop()
    personalHistory: string; // 个人史

    @Prop()
    familyHistory: string;   // 家族史

    @Prop()
    allergicHistory: string; // 过敏史

    @Prop()
    physicalExamination: string; // 体格检查

    @Prop()
    auxiliaryExamination: string; // 辅助检查

    @Prop()
    diagnosis: string;      // 诊断

    @Prop()
    treatmentPlan: string;  // 治疗计划

    @Prop({ type: [Medication], default: [] })
    medications: Medication[];

    @Prop({
        type: String,
        enum: MedicalRecordStatus,
        default: MedicalRecordStatus.DRAFT,
    })
    status: MedicalRecordStatus;

    @Prop()
    reviewTime?: Date;

    @Prop()
    notes?: string;
}

export const MedicalRecordSchema = SchemaFactory.createForClass(MedicalRecord);

// Multi-tenant indexes
MedicalRecordSchema.index({ tenantId: 1, patientId: 1 });
MedicalRecordSchema.index({ tenantId: 1, doctorId: 1 });
MedicalRecordSchema.index({ tenantId: 1, id: 1 }, { unique: true });
