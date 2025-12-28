import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';

export enum ReportStatus {
    PENDING = 'PENDING',
    INTERPRETING = 'INTERPRETING',
    COMPLETED = 'COMPLETED',
    FAILED = 'FAILED',
}

@Schema({ _id: false })
export class InterpretationResult {
    @Prop()
    summary: string;

    @Prop([String])
    abnormalIndicators: string[];

    @Prop()
    healthAdvice: string;

    @Prop()
    followUpSuggestions: string;

    @Prop({ default: Date.now })
    interpretedAt: Date;
}

@Schema({ timestamps: true })
export class Report extends Document {
    @Prop({ required: true, index: true })
    id: string;

    @Prop({ required: true, index: true })
    tenantId: string;

    @Prop({ required: true, index: true })
    userId: string; // Patient User ID from PostgreSQL

    @Prop({ required: true })
    fileName: string;

    @Prop({ required: true })
    fileUrl: string;

    @Prop()
    fileType: string; // pdf, jpg, png, etc.

    @Prop()
    ocrText?: string;

    @Prop({
        type: String,
        enum: ReportStatus,
        default: ReportStatus.PENDING,
    })
    status: ReportStatus;

    @Prop({ type: InterpretationResult })
    interpretation?: InterpretationResult;

    @Prop()
    errorCode?: string;

    @Prop()
    errorMessage?: string;
}

export const ReportSchema = SchemaFactory.createForClass(Report);

// Multi-tenant indexes
ReportSchema.index({ tenantId: 1, userId: 1 });
ReportSchema.index({ tenantId: 1, id: 1 }, { unique: true });
