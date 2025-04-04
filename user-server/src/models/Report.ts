import mongoose, { Document, Schema } from 'mongoose';

export interface IReport extends Document {
    _id: mongoose.Types.ObjectId;
    patientId: mongoose.Types.ObjectId;
    reportType: string;
    reportDate: Date;
    hospital: string;
    reportImages: string[];
    description?: string;
    interpretation?: {
        doctorId: mongoose.Types.ObjectId;
        content: string;
        createTime: Date;
    };
    aiInterpretation?: {
        content: string;
        abnormalIndicators: Array<{
            name: string;
            value: string;
            referenceRange?: string;
            explanation: string;
        }>;
        suggestions: string;
        createTime: Date;
    };
    status: string;
}

const ReportSchema = new Schema<IReport>({
    patientId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    reportType: { type: String, required: true },
    reportDate: { type: Date, required: true },
    hospital: { type: String, required: true },
    reportImages: { type: [String], required: true },
    description: { type: String },
    interpretation: {
        doctorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        content: { type: String },
        createTime: { type: Date }
    },
    aiInterpretation: {
        content: { type: String },
        abnormalIndicators: [{
            name: { type: String },
            value: { type: String },
            referenceRange: { type: String },
            explanation: { type: String }
        }],
        suggestions: { type: String },
        createTime: { type: Date }
    },
    status: { type: String, required: true, default: 'PENDING' }
}, { timestamps: true });

// Create indexes for faster queries
ReportSchema.index({ patientId: 1 });
ReportSchema.index({ reportType: 1 });
ReportSchema.index({ status: 1 });
ReportSchema.index({ createdAt: -1 });

export default mongoose.model<IReport>('Report', ReportSchema);