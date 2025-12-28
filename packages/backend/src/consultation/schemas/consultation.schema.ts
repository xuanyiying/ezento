import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';

export enum ConsultationStatus {
    PENDING = 'PENDING',
    SUBMITTED = 'SUBMITTED',
    PROCESSING = 'PROCESSING',
    COMPLETED = 'COMPLETED',
    CANCELLED = 'CANCELLED',
}

@Schema({ _id: false })
export class AiSuggestion {
    @Prop()
    possibleConditions: string;

    @Prop()
    recommendations: string;

    @Prop()
    urgencyLevel: string;

    @Prop()
    suggestedDepartments: string[];

    @Prop({ default: Date.now })
    createTime: Date;
}

@Schema({ timestamps: true })
export class Consultation extends Document {
    @Prop({ required: true, index: true })
    id: string;

    @Prop({ required: true, index: true })
    tenantId: string;

    @Prop({ required: true, index: true })
    userId: string; // User ID from PostgreSQL

    @Prop({ required: true })
    type: string;

    @Prop()
    symptoms?: string;

    @Prop([String])
    bodyParts?: string[];

    @Prop()
    duration?: string;

    @Prop([String])
    existingConditions?: string[];

    @Prop([String])
    images?: string[];

    @Prop()
    reportType?: string;

    @Prop()
    reportDate?: Date;

    @Prop()
    hospital?: string;

    @Prop([String])
    reportImages?: string[];

    @Prop()
    diagnosis?: string;

    @Prop()
    prescription?: string;

    @Prop()
    notes?: string;

    @Prop({ default: 0 })
    fee: number;

    @Prop({
        type: String,
        enum: ConsultationStatus,
        default: ConsultationStatus.PENDING,
    })
    status: ConsultationStatus;

    @Prop({ default: Date.now })
    startTime: Date;

    @Prop()
    endTime?: Date;

    @Prop({ type: AiSuggestion })
    aiSuggestion?: AiSuggestion;

    @Prop()
    conversationId?: string;
}

export const ConsultationSchema = SchemaFactory.createForClass(Consultation);

// Multi-tenant index
ConsultationSchema.index({ tenantId: 1, userId: 1 });
ConsultationSchema.index({ tenantId: 1, id: 1 }, { unique: true });
