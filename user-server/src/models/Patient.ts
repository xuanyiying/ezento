import mongoose, { Document, Schema } from 'mongoose';

export interface IPatient extends Document {
    userId: string;
    gender: string;
    age: number;
    height?: number;
    weight?: number;
    allergies?: string[];
    medicalHistory?: string[];
    userData?: any;
    createdAt: Date;
    updatedAt: Date;
}

const PatientSchema: Schema = new Schema(
    {
        id: {
            type: String,
            required: true,
        },
        userId: {
            type: String,
            required: true,
            unique: true,
        },
        gender: {
            type: String,
            required: true,
            enum: ['male', 'female', 'other'],
        },
        age: {
            type: Number,
            required: true,
            min: 0,
            max: 150,
        },
        height: {
            type: Number, // cm
        },
        weight: {
            type: Number, // kg
        },
        allergies: {
            type: [String],
            default: [],
        },
        medicalHistory: {
            type: [String],
            default: [],
        },
    },
    { timestamps: true }
);

export default mongoose.model<IPatient>('Patient', PatientSchema);
