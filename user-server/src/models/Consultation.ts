import mongoose, { Document, Schema } from 'mongoose';
import { UserDocument } from '../interfaces/user.interface';
import { ConsultationType, ConsultationStatus, IAiSuggestion } from '../interfaces/consultation.interface';

export interface IConsultation extends Document {
    userId: UserDocument['_id'] | UserDocument;
    consultationType: ConsultationType;
    symptoms: string;
    bodyParts?: string[];
    duration?: string;
    existingConditions?: string[];
    images?: string[];
    reportType?: string;
    reportDate?: Date;
    hospital?: string;
    reportImages?: string[];
    diagnosis?: string;
    prescription?: string;
    notes?: string;
    fee: number;
    status: ConsultationStatus;
    startTime: Date;
    endTime?: Date;
    aiSuggestion?: IAiSuggestion;
    conversationId?: Schema.Types.ObjectId;
    createdAt: Date;
    updatedAt: Date;
}

const ConsultationSchema: Schema = new Schema(
    {
        userId: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        consultationType: {
            type: String,
            enum: Object.values(ConsultationType),
            required: true,
        },
        symptoms: {
            type: String,
            required: true,
        },
        bodyParts: {
            type: [String],
            default: [],
        },
        duration: {
            type: String,
        },
        existingConditions: {
            type: [String],
            default: [],
        },
        images: {
            type: [String],
            default: [],
        },
        reportType: {
            type: String,
        },
        reportDate: {
            type: Date,
        },
        hospital: {
            type: String,
        },
        reportImages: {
            type: [String],
            default: [],
        },
        diagnosis: {
            type: String,
        },
        prescription: {
            type: String,
        },
        notes: {
            type: String,
        },
        fee: {
            type: Number,
            required: true,
        },
        status: {
            type: String,
            enum: Object.values(ConsultationStatus),
            default: ConsultationStatus.PENDING,
        },
        startTime: {
            type: Date,
            default: Date.now,
        },
        endTime: {
            type: Date,
        },
        conversationId: {
            type: Schema.Types.ObjectId,
            ref: 'Conversation',
        },
        aiSuggestion: {
            possibleConditions: { type: String },
            recommendations: { type: String },
            urgencyLevel: { type: String },
            suggestedDepartments: { type: [String], default: [] },
            createTime: { type: Date, default: Date.now },
        },
    },
    { timestamps: true }
);

// Create indexes for faster queries
ConsultationSchema.index({ userId: 1, createdAt: -1 });
ConsultationSchema.index({ status: 1 });
ConsultationSchema.index({ consultationType: 1 });
ConsultationSchema.index({ conversationId: 1 });

export const Consultation = mongoose.model<IConsultation>('Consultation', ConsultationSchema); 