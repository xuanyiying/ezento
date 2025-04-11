import axios from 'axios';
import logger from '../config/logger';
import { ConversationType } from '../interfaces/conversation.interface';
import config from '../config/config';
import { Department, Doctor } from '../models';
import OCRService from './ocr.service';

// Extend the config object with AI-specific configuration
const aiConfig = {
    // 主要使用新的环境变量
    aliCloudApiKey: process.env.DASHSCOPE_API_KEY || '',
    aliCloudApiEndpoint: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
    aliCloudQwqModelName: process.env.DASHSCOPE_MODEL_NAME || 'qwen-plus',
};

// 记录配置信息，便于调试
logger.info(`AI配置信息: API密钥=${aiConfig.aliCloudApiKey ? '已设置' : '未设置'}, 端点=${aiConfig.aliCloudApiEndpoint}, 模型=${aiConfig.aliCloudQwqModelName}`);

Object.assign(config, aiConfig);

export interface GenerateTextOptions {
    prompt: string; // 用户输入的问题
    systemPrompt?: string; // 系统提示词
    patientInfo?: {
        age?: number; // 患者年龄
        gender?: string; // 患者性别
        symptoms?: string[]; // 症状描述
        medicalHistory?: string[]; // 病史
    };
    maxTokens?: number; // 最大token数  
    temperature?: number; // 温度
    stream?: boolean; // 是否流式
    reportInfo?: ReportInfo; // 报告信息
    conversationHistory?: Array<{ role: 'patient' | 'admin' | 'system', content: string }>; // 会话历史
    useDeepSeek?: boolean; // 是否使用深度求索
}

export interface GenerateTextResponse {
    id: string; // 请求id
    text: string; // 响应文本
    thinking?: string; // 思考过程
}

/**
 * 患者预问诊信息接口
 */
export interface PrediagnosisInfo {
    age?: number; // 患者年龄
    gender?: string; // 患者性别
    symptoms: string[]; // 症状描述
    bodyParts?: string[]; // 身体部位
    duration?: string; // 持续时间
    existingConditions?: string[]; // 现有条件
}

/**
 * 报告信息接口
 */
export interface ReportInfo {
    patientAge?: number; // 患者年龄
    patientGender?: string; // 患者性别
    reportType: string; // 报告类型
    reportDate?: string; // 报告日期
    hospital?: string; // 医院名称
    description: string; // 报告描述
    reportContent: string; // 报告内容
}

/**
 * 导诊信息接口
 */
export interface GuideInfo {
    age?: number; // 患者年龄
    gender?: string; // 患者性别
    symptoms: string[]; // 症状描述
    bodyParts?: string[]; // 身体部位
    duration?: string; // 持续时间
    existingConditions?: string[]; // 现有条件
    preferredTime?: string; // 偏好时间
    preferredGender?: string; // 偏好性别
}

/**
 * AI建议响应接口
 */
export interface AiSuggestionResponse {
    possibleConditions?: string; // 可能条件
    recommendations?: string; // 建议
    urgencyLevel?: string; // 紧急程度
    suggestedDepartments?: string[]; // 推荐科室
    createTime: Date; // 创建时间
}

/**
 * 报告解读响应接口
 */
export interface ReportInterpretationResponse {
    interpretation: string; // 解读
    suggestions: string[]; // 建议
    findings: {
        normalFindings: string[]; // 正常发现
        abnormalFindings: string[]; // 异常发现
    };
    urgencyLevel: string; // 紧急程度
}

/**
 * 导诊响应接口
 */
export interface GuideResponse {
    recommendedDepartments: string[];
    recommendedDoctors: {
        doctorId: string; // 医生ID
        name: string; // 医生名称
        specialty: string; // 医生特长
        availableSlots: string[]; // 可预约时间
    }[];
    reasonForRecommendation: string; // 推荐理由
    urgencyLevel: string; // 紧急程度
}

// 添加OpenAI流式响应处理
interface StreamingResponseChunk {
    id: string;
    object: string;
    created: number;
    model: string;
    choices: {
        delta: {
            content?: string;
            role?: string;
        };
        index: number;
        finish_reason: string | null;
    }[];
}

/**
 * 辅助函数：分离可能连接在一起的多个JSON对象
 * @param input 输入的字符串，可能包含多个JSON对象
 * @returns 分离后的JSON对象数组
 */
function splitJsonObjects(input: string): string[] {
    const result: string[] = [];
    let depth = 0;
    let startIndex = 0;
    
    // 查找JSON对象边界
    for (let i = 0; i < input.length; i++) {
        const char = input[i];
        
        if (char === '{') {
            if (depth === 0) {
                startIndex = i;
            }
            depth++;
        } else if (char === '}') {
            depth--;
            
            // 当深度回到0时，表示找到了一个完整的JSON对象
            if (depth === 0) {
                result.push(input.substring(startIndex, i + 1));
            }
        }
    }
    
    return result.length > 0 ? result : [input]; // 如果无法分离，则返回原输入作为单个元素
}

/**
 * Service to interact with Alibaba Cloud's LLM and DeepSeek API for various medical AI services
 */


export class AiService {

    private static async getBaiduAccessToken(): Promise<string> {
        try {
            const apiKey = process.env.BAIDU_API_KEY;
            const secretKey = process.env.BAIDU_SECRET_KEY;

            if (!apiKey || !secretKey) {
                throw new Error('百度API配置缺失');
            }

            const response = await axios.post(
                `https://aip.baidubce.com/oauth/2.0/token?grant_type=client_credentials&client_id=${apiKey}&client_secret=${secretKey}`
            );

            return response.data.access_token;
        } catch (error: any) {
            logger.error(`获取百度访问令牌失败: ${error}`);
            throw error;
        }
    }

    public static async extractTextFromImage(imagePath: string): Promise<string> {
        try {
            const accessToken = await this.getBaiduAccessToken();
            const image = Buffer.from(imagePath).toString('base64');

            const response = await axios.post(
                `https://aip.baidubce.com/rest/2.0/ocr/v1/accurate_basic?access_token=${accessToken}`,
                { image },
                {
                    headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
                }
            );

            return response.data.words_result
                .map((result: any) => result.words)
                .join('\n');
        } catch (error: any) {
            logger.error(`OCR文字提取失败: ${error}`);
            throw error;
        }
    }

    static async* generateStreamingResponse(
        userMessage: string,
        conversationHistory: Array<{ role: string; content: string }>,
        conversationType: ConversationType,
        referenceId: string
    ): AsyncGenerator<string> {
        try {
            let systemPrompt = '';
            let additionalContext = '';

            // 根据会话类型设置不同的系统提示和上下文
            switch (conversationType) {
                case ConversationType.PRE_DIAGNOSIS:
                    systemPrompt = '你是一位经验丰富的医生助手，正在进行预问诊。请根据患者描述的症状提供专业的建议。';
                    break;

                case ConversationType.GUIDE:
                    systemPrompt = '你是一位导诊助手，帮助患者了解就医流程和科室选择。';
                    break;

                case ConversationType.REPORT:
                    systemPrompt = '你是一位医学报告解读专家，帮助患者理解检查报告的内容和含义。';
                    // 如果是报告解读，获取报告文本
                     // 判断pdf 还是多张图片
                     const referenceIdArray = referenceId.split('_');
                     if (referenceIdArray.length > 1) {
                        const reportText = await OCRService.recognizePDF(referenceId);
                        additionalContext = `报告内容：${reportText}\n`;
                     } else {
                        const reportText = await OCRService.recognizeImage(referenceId);
                        additionalContext = `报告内容：${reportText}\n`;
                    }
                    break;

                default:
                    systemPrompt = '你是一位医疗咨询助手。';
            }

            // 构建完整的提示
            const fullPrompt = `${additionalContext}${userMessage}`;
            
            logger.info('准备流式调用AI服务');

            try {
                // 处理历史消息
                const formattedHistory = conversationHistory.map(msg => {
                    if (msg.role === 'system') return { role: 'system', content: msg.content };
                    if (msg.role === 'patient') return { role: 'user', content: msg.content };
                    return { role: 'assistant', content: msg.content };
                });
                
                // 使用阿里云百炼API兼容OpenAI的endpoint
                const url = 'https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions';
                
                // 准备请求数据
                const requestData = {
                    model: config.aliCloudQwqModelName,
                    messages: [
                        { role: 'system', content: systemPrompt },
                        ...formattedHistory,
                        { role: 'user', content: fullPrompt }
                    ],
                    stream: true,
                };
                
                logger.info(`流式请求参数: ${JSON.stringify(requestData)}`);
                
                // 发送流式请求
                const response = await axios.post(url, requestData, {
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${config.aliCloudApiKey}`,
                        'Accept': 'text/event-stream'
                    },
                    responseType: 'stream'
            });

            // 处理流式响应
                for await (const chunk of response.data) {
                    const chunkString = chunk.toString().trim();
                    logger.debug(`收到原始数据块: ${chunkString.substring(0, 50)}...`);
                    
                    try {
                        // 如果数据以data:开头，提取JSON部分
                        if (chunkString.startsWith('data:')) {
                            const jsonPart = chunkString.slice(5).trim();
                            
                            // 处理结束标记
                            if (jsonPart === '[DONE]') {
                                logger.info('收到流式响应结束标记');
                                break;
                            }
                            
                            // 尝试解析JSON
                            try {
                                const parsed = JSON.parse(jsonPart);
                                
                                // 提取内容
                                if (parsed.choices && parsed.choices[0]?.delta?.content) {
                                    const content = parsed.choices[0].delta.content;
                                    yield content;
                                }
                            } catch (parseError) {
                                logger.warn(`JSON解析失败: ${parseError}, 尝试修复格式...`);
                                // 尝试分离可能连接在一起的多个JSON对象
                                const jsonObjects = splitJsonObjects(jsonPart);
                                for (const jsonObj of jsonObjects) {
                                    try {
                                        const parsed = JSON.parse(jsonObj);
                                        if (parsed.choices && parsed.choices[0]?.delta?.content) {
                                            const content = parsed.choices[0].delta.content;
                                            yield content;
                                        }
                                    } catch (e) {
                                        logger.error(`修复后仍解析失败: ${e}`);
                                    }
                                }
                            }
                        } else if (chunkString.includes('data:')) {
                            // 处理可能在一行中包含多个data:前缀的情况
                            const parts = chunkString.split('data:');
                            for (const part of parts) {
                                if (!part.trim()) continue;
                                
                                const jsonPart = part.trim();
                                if (jsonPart === '[DONE]') {
                                    logger.info('收到流式响应结束标记');
                                    break;
                                }
                                
                                try {
                                    const parsed = JSON.parse(jsonPart);
                                    if (parsed.choices && parsed.choices[0]?.delta?.content) {
                                        const content = parsed.choices[0].delta.content;
                                        yield content;
                                    }
                                } catch (e) {
                                    logger.debug(`跳过无效JSON部分: ${jsonPart.substring(0, 30)}...`);
                                }
                            }
                        } else {
                            // 尝试直接作为JSON解析
                            try {
                                const parsed = JSON.parse(chunkString);
                                if (parsed.choices && parsed.choices[0]?.delta?.content) {
                                    const content = parsed.choices[0].delta.content;
                                    yield content;
                                }
                            } catch (e) {
                                // 忽略非JSON格式数据
                                logger.debug(`跳过非JSON数据: ${chunkString.substring(0, 30)}...`);
                            }
                        }
                    } catch (error: any) {
                        logger.warn(`处理数据块错误: ${error.message}`);
                    }
                }
                
            } catch (error: any) {
                logger.error(`流式AI响应生成失败: ${error.message}`);
                yield `生成回答时出错: ${error.message}`;
            }
        } catch (error: any) {
            logger.error(`生成AI响应失败: ${error.message}`);
            yield '抱歉，在处理您的请求时发生了错误，请稍后再试。';
        }
    }

    /**
     * Core method to generate text using AI LLM models
     * @param options - Text generation options
     * @returns Generated text with optional reasoning process
     */
    static async generateText(options: GenerateTextOptions): Promise<GenerateTextResponse> {
        try {
            const {
                prompt,
                systemPrompt,
                patientInfo,
                maxTokens = 2048,
                temperature = 0.7,
                stream = false,
                conversationHistory = [],
                useDeepSeek = true // Default to DeepSeek API
            } = options;

            // Construct a better medical prompt if patient info is available
            let enhancedPrompt = prompt;
            if (patientInfo) {
                const { age, gender, symptoms, medicalHistory } = patientInfo;
                enhancedPrompt = `医疗问诊背景:
- 患者年龄: ${age || '未知'}
- 患者性别: ${gender || '未知'}
- 症状描述: ${symptoms || '未知'}
- 病史: ${medicalHistory?.join(', ') || '无'}

${prompt}`;
            }

            // Prepare messages array for the conversation
            const messages = [];

            // Add system prompt if provided
            if (systemPrompt) {
                messages.push({
                    role: "system",
                    content: systemPrompt
                });
            }

            // Add conversation history if available
            if (conversationHistory && conversationHistory.length > 0) {
                messages.push(...conversationHistory);
            }

            // Add current user prompt
            messages.push({
                role: "user",
                content: enhancedPrompt
            });

            // Choose which API to use based on the useDeepSeek flag
            if (useDeepSeek) {
                return await this.generateTextWithDeepSeek(messages, maxTokens, temperature, stream);
            } else {
                return await this.generateTextWithAliCloud(messages, maxTokens, temperature, stream);
            }
        } catch (error: any) {
            logger.error(`AI text generation error: ${error.message}`);
            if (error.response) {
                logger.error(`API response: ${JSON.stringify(error.response.data)}`);
            }
            throw new Error(`Failed to generate AI text: ${error.message}`);
        }
    }

    /**
     * Generate text using DeepSeek API
     * @param messages - The conversation messages
     * @param maxTokens - Maximum tokens to generate
     * @param temperature - Temperature for generation
     * @param stream - Whether to stream the response
     * @returns Generated text response
     */
    private static async generateTextWithDeepSeek(
        messages: Array<{ role: string, content: string }>,
        maxTokens: number,
        temperature: number,
        stream: boolean
    ): Promise<GenerateTextResponse> {
        try {
            const response = await axios.post(
                `${config.aliCloudApiKey}/chat/completions`,
                {
                    model: config.aliCloudQwqModelName,
                    messages: messages,
                    max_tokens: maxTokens,
                    temperature: temperature,
                    stream: stream,
                },
                {
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${config.aliCloudApiKey}`,
                    },
                }
            );

            const result = response.data;
            let text = '';
            let thinking = '';

            // Handle DeepSeek-R1 specific response format
            if (result.choices && result.choices.length > 0) {
                // For DeepSeek-R1 models, we get both content and reasoning_content
                if (result.choices[0].message.reasoning_content) {
                    thinking = result.choices[0].message.reasoning_content;
                }
                text = result.choices[0].message.content;
            }

            logger.info(`DeepSeek AI text generated successfully. Length: ${text.length} characters`);

            return {
                id: result.id || '',
                text,
                thinking
            };
        } catch (error: any) {
            logger.error(`DeepSeek API error: ${error.message}`);
            if (error.response) {
                logger.error(`API response: ${JSON.stringify(error.response.data)}`);
            }
            throw error;
        }
    }

    /**
     * Generate text using Alibaba Cloud's LLM (fallback method)
     * @param messages - The conversation messages
     * @param maxTokens - Maximum tokens to generate
     * @param temperature - Temperature for generation
     * @param stream - Whether to stream the response
     * @returns Generated text response
     */
    private static async generateTextWithAliCloud(
        messages: Array<{ role: string, content: string }>,
        maxTokens: number,
        temperature: number,
        stream: boolean
    ): Promise<GenerateTextResponse> {
        try {
            const response = await axios.post(
                `${config.aliCloudApiEndpoint}/chat/completions`,
                {
                    model: config.aliCloudQwqModelName,
                    messages: messages,
                    max_tokens: maxTokens,
                    temperature: temperature,
                    stream: stream,
                },
                {
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${config.aliCloudApiKey}`,
                    },
                }
            );

            // Parse response based on model behavior
            const result = response.data;

            // Extract content from the response
            let thinking = '';
            let text = '';

            if (result.choices && result.choices.length > 0) {
                const content = result.choices[0].message.content;

                // Check if the response has the thinking tag format
                if (content.includes('<thinking>') && content.includes('</thinking>')) {
                    thinking = content.match(/<thinking>(.*?)<\/thinking>/s)?.[1].trim() || '';
                    text = content.replace(/<thinking>.*?<\/thinking>/s, '').trim();
                } else {
                    text = content;
                }
            }

            logger.info(`AliCloud AI text generated successfully. Length: ${text.length} characters`);

            return {
                id: result.id || '',
                text,
                thinking
            };
        } catch (error: any) {
            logger.error(`AliCloud API error: ${error.message}`);
            if (error.response) {
                logger.error(`API response: ${JSON.stringify(error.response.data)}`);
            }
            throw error;
        }
    }

    /**
     * 通用方法：调用AI服务
     * @param data - 请求数据
     * @param options - 请求选项
     * @returns AI服务响应
     */
    private static async callAiService<T>(
        data: any,
        options: { 
            headers?: Record<string, string>,
            timeout?: number,
            retryCount?: number
        } = {}
    ): Promise<T> {
        try {
            const { headers = {}, timeout = 30000, retryCount = 2 } = options;
            const defaultHeaders = {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${config.aliCloudApiKey}`
            };
            
            // 合并默认headers和自定义headers
            const mergedHeaders = { ...defaultHeaders, ...headers };
            
            // 使用阿里云百炼API兼容OpenAI的endpoint
            const url = 'https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions';
            
            logger.info(`调用AI服务: ${url}`, { 
                dataKeys: Object.keys(data),
                hasAuth: !!mergedHeaders.Authorization
            });
            
            // 转换为阿里云百炼API所需的请求格式
            const requestData = {
                model: config.aliCloudQwqModelName || 'qwen-plus',
                messages: [
                    {role: "system", content: data.systemPrompt || "You are a helpful assistant."},
                    {role: "user", content: data.message}
                ],
                stream: data.streaming || false
            };
            
            logger.info(`AI请求数据: ${JSON.stringify(requestData, null, 2)}`);
            
            // 实现重试逻辑
            let lastError: any = null;
            for (let attempt = 0; attempt <= retryCount; attempt++) {
                try {
                    const response = await axios.post(url, requestData, {
                        headers: mergedHeaders,
                        timeout
                    });
                    
                    logger.info(`AI服务调用成功: ${url}`, { 
                            attempt, 
                            statusCode: response.status 
                        });
                    
                    // 处理响应
                    if (response.data) {
                        // 针对百炼API的响应格式进行处理
                        if (response.data.choices && response.data.choices.length > 0) {
                            const content = response.data.choices[0].message.content;
                            logger.info(`AI响应内容长度: ${content.length}`);
                            
                            return {
                                response: content
                            } as unknown as T;
                    } else {
                            logger.warn(`AI服务返回格式异常: ${JSON.stringify(response.data)}`);
                            throw new Error('AI服务返回格式异常');
                        }
                    } else {
                        logger.warn(`AI服务返回空响应`);
                        throw new Error('AI服务返回空响应');
                    }
                } catch (error: any) {
                    lastError = error;
                    logger.warn(`AI服务调用失败 (尝试 ${attempt + 1}/${retryCount + 1}): ${url}`, { 
                        error: error.message,
                        statusCode: error.response?.status,
                        data: error.response?.data
                    });
                    
                    // 如果是最后一次尝试，则抛出错误
                    if (attempt === retryCount) {
                        throw error;
                    }
                    
                    // 等待一段时间后重试
                    await new Promise(resolve => setTimeout(resolve, 1000 * (attempt + 1)));
                }
            }
            
            // 如果所有重试都失败，抛出最后一个错误
            throw lastError;
        } catch (error: any) {
            logger.error('AI服务调用失败:', { 
                error: error.message,
                statusCode: error.response?.status,
                response: error.response?.data
            });
            throw error;
        }
    }

    /**
     * 生成预问诊AI建议
     * @param patientInfo 患者信息
     * @returns AI建议响应
     */
    static async generatePrediagnosis(patientInfo: PrediagnosisInfo): Promise<AiSuggestionResponse | null> {
        try {
            logger.info(`请求AI预问诊服务: ${JSON.stringify(patientInfo)}`);

            // 使用通用方法调用AI服务
            const aiSuggestion = await this.callAiService<AiSuggestionResponse>(
                patientInfo
            );
            
                return {
                ...aiSuggestion,
                createTime: new Date()
            };
        } catch (error: any) {
            logger.error(`生成AI预问诊建议时出错: ${error.message}`);
            return null;
        }
    }

    /**
     * 生成报告解读AI建议
     * @param reportInfo 报告信息
     * @returns 报告解读响应
     */
    static async generateReportInterpretation(reportInfo: ReportInfo): Promise<ReportInterpretationResponse | null> {
        try {
            logger.info(`请求AI报告解读服务: ${JSON.stringify({
                reportType: reportInfo.reportType,
                patientAge: reportInfo.patientAge,
                patientGender: reportInfo.patientGender
            })}`);

            // 使用通用方法调用AI服务
            return await this.callAiService<ReportInterpretationResponse>(
                reportInfo
            );
        } catch (error: any) {
            logger.error(`生成AI报告解读建议时出错: ${error.message}`);
            return null;
        }
    }

    /**
     * 生成导诊AI建议
     * @param guideInfo 导诊信息
     * @returns 导诊响应
     */
    static async generateGuideRecommendation(guideInfo: GuideInfo): Promise<GuideResponse | null> {
        try {
            logger.info(`请求AI导诊服务: ${JSON.stringify({
                symptoms: guideInfo.symptoms,
                patientAge: guideInfo.age,
                patientGender: guideInfo.gender
            })}`);

            // 获取所有科室和医生信息
            const departments = await Department.find().lean() as any[];
            const doctors = await Doctor.find()
                .populate('departmentId')
                .populate('schedules')
                .lean() as any[];

            // 准备AI请求数据
            const aiRequestData = {
                ...guideInfo,
                availableDepartments: departments.map((dept: any) => ({
                    id: dept._id.toString(),
                    name: dept.name,
                    description: dept.description
                })),
                availableDoctors: doctors.map((doc: any) => ({
                    id: doc._id.toString(),
                    name: doc.name,
                    departmentId: doc.departmentId._id.toString(),
                    departmentName: doc.departmentId.name,
                    specialty: doc.specialty,
                    gender: doc.gender,
                    schedules: doc.schedules
                }))
            };

            // 使用通用方法调用AI服务
            return await this.callAiService<GuideResponse>(
                aiRequestData
            );
        } catch (error: any) {
            logger.error(`生成AI导诊建议时出错: ${error.message}`);
            return null;
        }
    }

    /**
     * 处理与AI的对话
     * @param userId 用户ID
     * @param conversationId 对话ID
     * @param message 用户消息
     * @param consultationType 会诊类型 (可选)
     * @param chunkCallback 流式响应回调 (可选)
     * @param additionalData 额外数据 (可选)
     * @returns AI响应
     */
    static async processConversationMessage(
        userId: string, 
        conversationId: string, 
        message: string,
        consultationType?: string,
        chunkCallback?: (chunk: string) => void,
        additionalData?: any
    ): Promise<string> {
        try {
            logger.info(`处理用户对话: userId=${userId}, conversationId=${conversationId}, type=${consultationType || 'general'}`);

            // 构建不同类型会话的提示词
            let systemPrompt = '';
            let promptContent = '';
            
            try {
            if (consultationType === 'PRE_DIAGNOSIS') {
                // 预问诊系统提示词
                systemPrompt = `你是一位经验丰富的医学专家，具有丰富的初步诊断经验。你的任务是根据患者提供的症状和信息进行初步分析，提出可能的病因，并给出合理的就医建议。请保持专业、准确和谨慎。`;
                promptContent = `患者描述: ${message}\n\n请提供以下内容：\n1. 可能的病因分析\n2. 就医建议\n3. 紧急程度评估\n4. 推荐就诊科室`;
            } 
            else if (consultationType === 'GUIDE' && additionalData) {
                // 导诊系统提示词
                const { departments, doctors } = additionalData;
                
                systemPrompt = `你是一位医院导诊专家，熟悉各科室职能和医生专长。你的任务是根据患者描述的症状，推荐合适的科室和医生。`;
                
                // 格式化科室信息
                let deptInfo = "可用科室:\n";
                if (departments && departments.length > 0) {
                    departments.forEach((dept: any, index: number) => {
                        deptInfo += `${index+1}. ${dept.name}: ${dept.description || '无描述'}\n`;
                    });
                    } else {
                        deptInfo += "暂无科室信息\n";
                }
                
                // 格式化医生信息
                let doctorInfo = "可用医生:\n";
                if (doctors && doctors.length > 0) {
                    doctors.forEach((doc: any, index: number) => {
                        const deptName = doc.departmentId?.name || '未知科室';
                        doctorInfo += `${index+1}. ${doc.name}: ${deptName}, 专长: ${doc.specialty || '一般'}\n`;
                    });
                    } else {
                        doctorInfo += "暂无医生信息\n";
                }
                
                promptContent = `患者描述: ${message}\n\n${deptInfo}\n${doctorInfo}\n\n请根据患者症状推荐1-2个最合适的科室和相应的医生，并给出推荐理由。`;
            }
            else if (consultationType === 'REPORT_INTERPRETATION' && additionalData) {
                // 报告解读系统提示词
                const { reportData } = additionalData;
                
                systemPrompt = `你是一位专业的医学影像/检验报告解读专家。你的任务是解读患者的医疗报告，找出异常指标，解释其医学意义，并提供适当的建议。请保持专业、准确和谨慎。`;
                
                let reportDetails = '';
                if (reportData) {
                    reportDetails = `
报告类型: ${reportData.reportType || '未知'}
报告日期: ${reportData.reportDate ? new Date(reportData.reportDate).toLocaleDateString() : '未知'}
医院: ${reportData.hospital || '未知'}
报告内容:
${reportData.description || '未提供报告内容'}`;
                    } else {
                        reportDetails = "未提供报告详情";
                }
                
                promptContent = `患者问题: ${message}\n\n${reportDetails}\n\n请解读以上报告，包括:\n1. 整体分析\n2. 异常指标说明\n3. 医学建议`;
            }
            else {
                // 默认对话系统提示词
                systemPrompt = `你是E诊通的AI医疗顾问，名为"医小通"。你的任务是回答患者的医疗咨询问题，提供专业且易于理解的医疗信息。`;
                promptContent = message;
            }

                logger.info(`已构建提示词，长度: ${promptContent.length}`);
            } catch (promptError: any) {
                logger.error(`构建提示词时出错: ${promptError.message}`);
                systemPrompt = `你是E诊通的AI医疗顾问。`;
                promptContent = `患者问题: ${message}`;
            }

            // 判断是否使用流式响应
            if (chunkCallback) {
                logger.info(`使用流式响应模式`);
                let fullResponse = '';
                
                // 使用阿里云百炼API兼容OpenAI的endpoint
                const url = 'https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions';
                
                try {
                    // 准备请求数据
                    const requestData = {
                        model: config.aliCloudQwqModelName,
                        messages: [
                            { role: 'system', content: systemPrompt },
                            { role: 'user', content: promptContent }
                        ],
                        stream: true
                    };
                    
                    // 发送流式请求
                    const response = await axios.post(url, requestData, {
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${config.aliCloudApiKey}`,
                            'Accept': 'text/event-stream'
                        },
                        responseType: 'stream'
                    });
                    logger.info(`流式响应: ${response}`);
                    
                    // 处理流式响应
                    for await (const chunk of response.data) {
                        const chunkString = chunk.toString().trim();
                        logger.debug(`收到原始数据块: ${chunkString.substring(0, 50)}...`);
                        
                        try {
                            // 如果数据以data:开头，提取JSON部分
                            if (chunkString.startsWith('data:')) {
                                const jsonPart = chunkString.slice(5).trim();
                                
                                // 处理结束标记
                                if (jsonPart === '[DONE]') {
                                    logger.info('收到流式响应结束标记');
                                    break;
                                }
                                
                                // 尝试解析JSON
                                try {
                                    const parsed = JSON.parse(jsonPart);
                                    
                                    // 提取内容
                                    if (parsed.choices && parsed.choices[0]?.delta?.content) {
                                        const content = parsed.choices[0].delta.content;
                                        fullResponse += content;
                                        chunkCallback(content);
                                    }
                                } catch (parseError) {
                                    logger.warn(`JSON解析失败: ${parseError}, 尝试修复格式...`);
                                    // 尝试分离可能连接在一起的多个JSON对象
                                    const jsonObjects = splitJsonObjects(jsonPart);
                                    for (const jsonObj of jsonObjects) {
                                        try {
                                            const parsed = JSON.parse(jsonObj);
                                            if (parsed.choices && parsed.choices[0]?.delta?.content) {
                                                const content = parsed.choices[0].delta.content;
                                                fullResponse += content;
                                                chunkCallback(content);
                                            }
                                        } catch (e) {
                                            logger.error(`修复后仍解析失败: ${e}`);
                                        }
                                    }
                                }
                            } else if (chunkString.includes('data:')) {
                                // 处理可能在一行中包含多个data:前缀的情况
                                const parts = chunkString.split('data:');
                                for (const part of parts) {
                                    if (!part.trim()) continue;
                                    
                                    const jsonPart = part.trim();
                                    if (jsonPart === '[DONE]') {
                                        logger.info('收到流式响应结束标记');
                                        break;
                                    }
                                    
                                    try {
                                        const parsed = JSON.parse(jsonPart);
                                        if (parsed.choices && parsed.choices[0]?.delta?.content) {
                                            const content = parsed.choices[0].delta.content;
                                            fullResponse += content;
                                            chunkCallback(content);
                                        }
                                    } catch (e) {
                                        logger.debug(`跳过无效JSON部分: ${jsonPart.substring(0, 30)}...`);
                                    }
                                }
                            } else {
                                // 尝试直接作为JSON解析
                                try {
                                    const parsed = JSON.parse(chunkString);
                                    if (parsed.choices && parsed.choices[0]?.delta?.content) {
                                        const content = parsed.choices[0].delta.content;
                                        fullResponse += content;
                                        chunkCallback(content);
                                    }
                                } catch (e) {
                                    // 忽略非JSON格式数据
                                    logger.debug(`跳过非JSON数据: ${chunkString.substring(0, 30)}...`);
                                }
                            }
        } catch (error: any) {
                            logger.warn(`处理数据块错误: ${error.message}`);
                        }
                    }
                    
                    logger.info(`流式响应完成，总长度: ${fullResponse.length}`);
                    return fullResponse;
                    
                } catch (streamError: any) {
                    logger.error(`流式响应失败: ${streamError.message}`);
                    const errorMessage = '抱歉，在处理您的请求时发生了错误，请稍后再试。';
                    chunkCallback(errorMessage);
                    return errorMessage;
                }
                
            } else {
                // 非流式响应模式
                logger.info(`使用非流式响应模式`);
                
                try {
                    // 使用阿里云百炼API兼容OpenAI的endpoint
                    const url = 'https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions';
                    
                    // 准备请求数据
                    const requestData = {
                        model: config.aliCloudQwqModelName,
                        messages: [
                            { role: 'system', content: systemPrompt },
                            { role: 'user', content: promptContent }
                        ],
                        stream: false
                    };
                    
                    const response = await axios.post(url, requestData, {
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${config.aliCloudApiKey}`
                        }
                    });
                    
                    if (response.data && response.data.choices && response.data.choices.length > 0) {
                        const content = response.data.choices[0].message.content;
                        logger.info(`非流式响应完成，长度: ${content.length}`);
                        return content;
                    } else {
                        logger.warn(`AI服务返回格式异常: ${JSON.stringify(response.data)}`);
                        return '抱歉，AI服务返回格式异常，请稍后再试。';
                    }
                } catch (error: any) {
                    logger.error(`非流式响应失败: ${error.message}`);
                    return '抱歉，在处理您的请求时发生了错误，请稍后再试。';
                }
            }
        } catch (error: any) {
            logger.error(`处理AI对话时出错: ${error.message}, 堆栈: ${error.stack}`);
            // 返回一个友好的错误消息
            return '非常抱歉，我现在遇到了一些技术问题，无法正常回答您的问题。请稍后再试或联系客服获取帮助。';
        }
    }
}

export default AiService;