import mongoose, { Document, Schema } from 'mongoose';

export interface IMedication {
    name: string;
    specification: string;
    dosage: string;
    frequency: string;
    route: string;
    duration: string;
    quantity: number;
    notes?: string;
}

export interface IPrescription extends Document {
    patientId: mongoose.Types.ObjectId;
    doctorId: mongoose.Types.ObjectId;
    recordId?: mongoose.Types.ObjectId;
    diagnosis: string;
    medications: IMedication[];
    notes?: string;
    instructions?: string;
    followUp?: string;
    status: 'DRAFT' | 'ISSUED' | 'FILLED';
    createdAt: Date;
    updatedAt: Date;
}

const MedicationSchema: Schema = new Schema({
    name: {
        type: String,
        required: true
    },
    specification: {
        type: String,
        required: true
    },
    dosage: {
        type: String,
        required: true
    },
    frequency: {
        type: String,
        required: true
    },
    route: {
        type: String,
        required: true
    },
    duration: {
        type: String,
        required: true
    },
    quantity: {
        type: Number,
        required: true
    },
    notes: {
        type: String
    }
});

const PrescriptionSchema: Schema = new Schema(
    {
        patientId: {
            type: Schema.Types.ObjectId,
            ref: 'Patient',
            required: true
        },
        doctorId: {
            type: Schema.Types.ObjectId,
            ref: 'Doctor',
            required: true
        },
        recordId: {
            type: Schema.Types.ObjectId,
            ref: 'MedicalRecord'
        },
        diagnosis: {
            type: String,
            required: true
        },
        medications: [MedicationSchema],
        notes: {
            type: String
        },
        instructions: {
            type: String
        },
        followUp: {
            type: String
        },
        status: {
            type: String,
            enum: ['DRAFT', 'ISSUED', 'FILLED'],
            default: 'DRAFT'
        }
    },
    { timestamps: true }
);

// Create indexes for faster queries
PrescriptionSchema.index({ patientId: 1 });
PrescriptionSchema.index({ doctorId: 1 });
PrescriptionSchema.index({ status: 1 });
PrescriptionSchema.index({ createdAt: -1 });

export default mongoose.model<IPrescription>('Prescription', PrescriptionSchema);