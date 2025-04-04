import mongoose, { Document, Schema } from 'mongoose';
import { IUser } from './User';

export interface IConsultation extends Document {
    patientId: IUser['_id'] | IUser;
    doctorId: IUser['_id'] | IUser;
    symptoms: string;
    diagnosis?: string;
    prescription?: string;
    notes?: string;
    fee: number;
    status: 'waiting' | 'in-progress' | 'completed' | 'cancelled';
    startTime: Date;
    endTime?: Date;
    aiSuggestion?: string;
    createdAt: Date;
    updatedAt: Date;
}

const ConsultationSchema: Schema = new Schema(
    {
        patientId: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        doctorId: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        symptoms: {
            type: String,
            required: true,
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
            enum: ['waiting', 'in-progress', 'completed', 'cancelled'],
            default: 'waiting',
        },
        startTime: {
            type: Date,
            default: Date.now,
        },
        endTime: {
            type: Date,
        },
        aiSuggestion: {
            type: String,
        },
    },
    { timestamps: true }
);

// Create indexes for faster queries
ConsultationSchema.index({ patientId: 1, createdAt: -1 });
ConsultationSchema.index({ doctorId: 1, createdAt: -1 });
ConsultationSchema.index({ status: 1 });

export const Consultation = mongoose.model<IConsultation>('Consultation', ConsultationSchema); 