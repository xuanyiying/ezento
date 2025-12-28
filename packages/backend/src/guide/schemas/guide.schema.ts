import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';

export type GuideDocument = Guide & Document;

@Schema({ timestamps: true })
export class Guide {
    @Prop({ required: true })
    tenantId: string;

    @Prop({ required: true })
    userId: string;

    @Prop({ required: true })
    patientId: string;

    @Prop({ required: true })
    symptoms: string[];

    @Prop()
    description: string;

    @Prop({ type: Object })
    aiRecommendation: {
        departments: Array<{
            name: string;
            reason: string;
            probability: number;
        }>;
        preparation: string[];
        tests: string[];
        urgency: 'routine' | 'urgent' | 'emergency';
        advice: string;
    };

    @Prop({ type: Object })
    metadata: Record<string, any>;
}

export const GuideSchema = SchemaFactory.createForClass(Guide);
