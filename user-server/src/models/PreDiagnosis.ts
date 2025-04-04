import mongoose, { Document, Schema } from 'mongoose';

export interface IPreDiagnosis extends Document {
    _id: any;
    patientId: any;
    symptoms: string;
    bodyParts?: string[];
    duration: string;
    existingConditions?: string[];
    images?: string[];
    status: string;
    createTime: Date;
    aiSuggestion?: {
        possibleConditions: string;
        recommendations: string;
        urgencyLevel: string;
        suggestedDepartments: string[];
        createTime: Date;
    };
    doctorAdvice?: {
        doctorId: any;
        advice: string;
        recommendDepartment?: string;
        urgencyLevel?: string;
        createTime: Date;
    };
    toObject: () => any;
}

const PreDiagnosisSchema = new Schema<IPreDiagnosis>({
    patientId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    symptoms: { type: String, required: true },
    bodyParts: { type: [String], default: [] },
    duration: { type: String, required: true },
    existingConditions: { type: [String], default: [] },    
    images: { type: [String], default: [] },
    status: { type: String, required: true },
    createTime: { type: Date, default: Date.now },
    aiSuggestion: {
        possibleConditions: { type: String },
        recommendations: { type: String },
        urgencyLevel: { type: String },
        suggestedDepartments: { type: [String], default: [] },
        createTime: { type: Date }
    },
    doctorAdvice: {
        doctorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        advice: { type: String },
        recommendDepartment: { type: String },
        urgencyLevel: { type: String },
        createTime: { type: Date }
    }
}, { timestamps: true });

// Create indexes for faster queries
PreDiagnosisSchema.index({ patientId: 1 });
PreDiagnosisSchema.index({ 'doctorAdvice.doctorId': 1 });
PreDiagnosisSchema.index({ status: 1 });
PreDiagnosisSchema.index({ createdAt: -1 });

export default mongoose.model<IPreDiagnosis>('PreDiagnosis', PreDiagnosisSchema);