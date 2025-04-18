import config from '../../config/config';
import logger from '../../utils/logger';
import dotenv from 'dotenv';
// 确保环境变量已加载
dotenv.config();

// 定义AI配置接口
export interface AIConfig {
    aiModel: 'alibaba' | 'ollama' | 'deepseek';
    aiModelName: string;
    aiApiEndpoint: string;
    aiApiKey: string;
    aiApiStream: boolean;
    aiApiTemperature: number;
    aiApiMaxTokens: number;
    aiApiTopP: number;
    aiApiTopK: number;
    aiApiRepeatPenalty: number;
    aiApiRepeatPenaltyFrequency: number;
}

// 创建安全的配置对象访问
function getConfig(): AIConfig {
    if (!config) {
        logger.error('Configuration object is undefined!');
        return {
            aiModel: (process.env.AI_MODEL as 'alibaba' | 'ollama' | 'deepseek') || 'ollama',
            aiModelName: process.env.AI_MODEL_NAME || 'llama3',
            aiApiEndpoint: process.env.AI_API_ENDPOINT || 'http://localhost:11434/api/chat',
            aiApiKey: process.env.AI_API_KEY || '',
            aiApiStream: process.env.AI_API_STREAM === 'true',
            aiApiTemperature: parseFloat(process.env.AI_API_TEMPERATURE || '0.7'),
            aiApiMaxTokens: parseInt(process.env.AI_API_MAX_TOKENS || '2048'),
            aiApiTopP: parseFloat(process.env.AI_API_TOP_P || '1'),
            aiApiTopK: parseInt(process.env.AI_API_TOP_K || '50'),
            aiApiRepeatPenalty: parseFloat(process.env.AI_API_REPEAT_PENALTY || '1.0'),
            aiApiRepeatPenaltyFrequency: parseInt(
                process.env.AI_API_REPEAT_PENALTY_FREQUENCY || '0'
            ),
        };
    }
    return config as AIConfig;
}

const conf: AIConfig = getConfig();

// 记录配置信息
logger.info(`AI服务配置: 
模型: ${conf.aiModel}
模型名称: ${conf.aiModelName}
API端点: ${conf.aiApiEndpoint}
API密钥: ${conf.aiApiKey}
流式响应: ${conf.aiApiStream}
温度: ${conf.aiApiTemperature}
最大Token数: ${conf.aiApiMaxTokens}
Top-p: ${conf.aiApiTopP}
Top-k: ${conf.aiApiTopK}
重复惩罚: ${conf.aiApiRepeatPenalty}
重复惩罚频率: ${conf.aiApiRepeatPenaltyFrequency}`);

// 消息接口，兼容OpenAI格式
export interface Message {
    role: 'system' | 'user' | 'assistant';
    content: string;
}

// AI请求选项接口
export interface AIRequestOptions {
    stream?: boolean;
    temperature?: number;
    maxTokens?: number;
    systemPrompt?: string;
    messages?: any[];
}

// AI响应接口
export interface AIResponse {
    content: string;
    id?: string;
    model?: string;
    metadata?: any;
}

// AI流式响应处理器接口
export type AIStreamHandler = (chunk: string) => void;

// 以下保留原有的业务接口定义
export interface GenerateTextOptions {
    prompt: string;
    systemPrompt?: string;
    patientInfo?: {
        age?: number;
        gender?: string;
        symptoms?: string[];
        medicalHistory?: string[];
    };
    maxTokens?: number;
    temperature?: number;
    stream?: boolean;
    reportInfo?: ReportInfo;
    messages?: Array<{ role: 'user' | 'system'; content: string }>;
    consultationType?: string;
}

export interface GenerateTextResponse {
    id: string;
    text: string;
    thinking?: string;
}

export interface PrediagnosisInfo {
    age?: number;
    gender?: string;
    symptoms: string[];
    bodyParts?: string[];
    duration?: string;
    existingConditions?: string[];
}

export interface ReportInfo {
    patientAge?: number;
    patientGender?: string;
    reportType: string;
    reportDate?: string;
    hospital?: string;
    description: string;
    reportContent: string;
}

export interface GuideInfo {
    age?: number;
    gender?: string;
    symptoms: string[];
    bodyParts?: string[];
    duration?: string;
    existingConditions?: string[];
    preferredTime?: string;
    preferredGender?: string;
}

export interface AiSuggestionResponse {
    possibleConditions?: string;
    recommendations?: string;
    urgencyLevel?: string;
    suggestedDepartments?: string[];
    createTime: Date;
}

export interface ReportInterpretationResponse {
    interpretation: string;
    suggestions: string[];
    findings: {
        normalFindings: string[];
        abnormalFindings: string[];
    };
    urgencyLevel: string;
}

export interface GuideResponse {
    recommendedDepartments: string[];
    recommendedDoctors: {
        doctorId: string;
        name: string;
        specialty: string;
        availableSlots: string[];
    }[];
    reasonForRecommendation: string;
    urgencyLevel: string;
}

// Export the safeConfig for use in other modules
export function getAIConfig(): AIConfig {
    return config;
}
