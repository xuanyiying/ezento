import mongoose, { Document, Schema } from 'mongoose';

export interface ITenant extends Document {
    name: string;
    code: string;
    description?: string;
    isActive: boolean;
    settings?: {
        allowPatientRegistration: boolean;
        allowDoctorRegistration: boolean;
        maxUsers: number;
        features: string[];
    };
    createdAt: Date;
    updatedAt: Date;
}

const TenantSchema: Schema = new Schema(
    {
        name: {
            type: String,
            required: true,
        },
        code: {
            type: String,
            required: true,
            unique: true,
            trim: true,
            lowercase: true,
        },
        description: {
            type: String,
        },
        isActive: {
            type: Boolean,
            default: true,
        },
        settings: {
            allowPatientRegistration: {
                type: Boolean,
                default: true,
            },
            allowDoctorRegistration: {
                type: Boolean,
                default: true,
            },
            maxUsers: {
                type: Number,
                default: 100,
            },
            features: [{
                type: String,
            }],
        },
    },
    { timestamps: true }
);

// Create indexes for faster queries
// TenantSchema.index({ code: 1 }); // Already defined as unique in schema
TenantSchema.index({ isActive: 1 });

export default mongoose.model<ITenant>('Tenant', TenantSchema); 