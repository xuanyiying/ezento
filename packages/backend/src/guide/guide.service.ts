import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Guide, GuideDocument } from './schemas/guide.schema';
import { AIEngineService } from '../ai-providers/ai-engine.service';

@Injectable()
export class GuideService {
    private readonly logger = new Logger(GuideService.name);

    constructor(
        @InjectModel(Guide.name) private guideModel: Model<GuideDocument>,
        private readonly aiEngineService: AIEngineService,
    ) { }

    async createGuide(data: {
        tenantId: string;
        userId: string;
        patientId: string;
        symptoms: string[];
        description?: string;
    }): Promise<Guide> {
        const { tenantId, userId, patientId, symptoms, description } = data;

        // Call AI to get recommendation
        const recommendation = await this.getAIRecommendation(symptoms, description);

        const guide = new this.guideModel({
            tenantId,
            userId,
            patientId,
            symptoms,
            description,
            aiRecommendation: recommendation,
        });

        return guide.save();
    }

    private async getAIRecommendation(symptoms: string[], description?: string) {
        const prompt = `患者主诉症状: ${symptoms.join(', ')}\n详细描述: ${description || '无'}\n请分析这些症状，并推荐至少两个最相关的医院科室，同时提供就医建议、可能需要的检查项以及紧急程度。返回 JSON 格式。`;

        // In a real implementation, this would call aiEngineService with a structured prompt
        // For now, returning mock data that mimics the AI response
        return {
            departments: [
                { name: '内科', reason: '患者有持续性头痛和发热', probability: 0.8 },
                { name: '神经内科', reason: '头痛可能涉及神经系统问题', probability: 0.4 }
            ],
            preparation: ['携带近期检查报告', '空腹'],
            tests: ['血常规', '头颅CT'],
            urgency: 'routine',
            advice: '建议尽快就医，注意休息。'
        };
    }

    async getGuideHistory(userId: string, tenantId: string): Promise<Guide[]> {
        return this.guideModel.find({ userId, tenantId }).sort({ createdAt: -1 }).exec();
    }
}
