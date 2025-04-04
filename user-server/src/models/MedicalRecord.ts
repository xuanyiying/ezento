import mongoose, { Document, Schema } from 'mongoose';

export interface IMedicalRecord extends Document {
    consultationId: mongoose.Types.ObjectId;
    patientId: mongoose.Types.ObjectId;
    doctorId: mongoose.Types.ObjectId;
    diagnosis: string;
    prescription?: string;
    advice: string;
    followUpDate?: Date;
    createdAt: Date;
    updatedAt: Date;
}

const MedicalRecordSchema: Schema = new Schema(
    {
        consultationId: {
            type: Schema.Types.ObjectId,
            ref: 'Consultation',
            required: true,
            unique: true,
        },
        patientId: {
            type: Schema.Types.ObjectId,
            ref: 'Patient',
            required: true,
        },
        doctorId: {
            type: Schema.Types.ObjectId,
            ref: 'Doctor',
            required: true,
        },
        diagnosis: {
            type: String,
            required: true,
        },
        prescription: {
            type: String,
        },
        advice: {
            type: String,
            required: true,
        },
        followUpDate: {
            type: Date,
        },
    },
    { timestamps: true }
);

// Ensure indexes for faster queries
// Remove redundant index as it's already created by unique: true
// MedicalRecordSchema.index({ consultationId: 1 });
MedicalRecordSchema.index({ patientId: 1 });
MedicalRecordSchema.index({ doctorId: 1 });

export default mongoose.model<IMedicalRecord>('MedicalRecord', MedicalRecordSchema); 