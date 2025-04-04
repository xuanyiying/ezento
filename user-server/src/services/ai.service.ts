import axios from 'axios';
import config from '../config/config';
import logger from '../config/logger';

// Add AI configuration to config
declare module '../config/config' {
    interface DefaultConfig {
        aliCloudApiKey: string;
        aliCloudApiEndpoint: string;
        aliCloudQwqModelName: string;
        deepSeekApiKey: string;
        deepSeekApiEndpoint: string;
        deepSeekModelName: string;
    }
}

// Extend the config object with AI-specific configuration
const aiConfig = {
    aliCloudApiKey: process.env.ALI_CLOUD_API_KEY || '',
    aliCloudApiEndpoint: process.env.ALI_CLOUD_API_ENDPOINT || 'https://dashscope.aliyuncs.com/api/v1',
    aliCloudQwqModelName: process.env.ALI_CLOUD_QWQ_MODEL_NAME || 'qwen-plus',
};

Object.assign(config, aiConfig);

export interface GenerateTextOptions {
    prompt: string;
    systemPrompt?: string;
    patientInfo?: {
        age?: number;
        gender?: string;
        symptoms?: string;
        medicalHistory?: string[];
    };
    maxTokens?: number;
    temperature?: number;
    stream?: boolean;
    reportInfo?: ReportInfo;
    conversationHistory?: Array<{role: 'user' | 'assistant' | 'system', content: string}>;
    useDeepSeek?: boolean;
}

export interface GenerateTextResponse {
    id: string;
    text: string;
    thinking?: string;
}

// Patient interface for pre-diagnosis
export interface PatientPreDiagnosisInfo {
    age?: number;
    gender?: string;
    symptoms: string;
    bodyParts?: string[];
    duration?: string;
    existingConditions?: string[];
    medicalHistory?: string[];
}

// Report interface for report interpretation
export interface ReportInfo {
    patientAge?: number;
    patientGender?: string;
    reportType: string;
    reportDate?: string;
    hospital?: string;
    description?: string;
    reportContent: string;
}

/**
 * Service to interact with Alibaba Cloud's LLM and DeepSeek API for various medical AI services
 */
export class AiService {
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
                reportInfo,
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
        messages: Array<{role: string, content: string}>,
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
        messages: Array<{role: string, content: string}>,
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
     * Generate pre-diagnosis recommendation based on patient symptoms
     * @param patientInfo - Patient information and symptoms
     * @param conversationHistory - Previous messages in the conversation
     * @returns AI-generated diagnostic suggestion and recommendations
     */
    static async generatePreDiagnosis(
        patientInfo: PatientPreDiagnosisInfo,
        conversationHistory: Array<{role: 'user' | 'assistant' | 'system', content: string}> = []
    ): Promise<{ 
        possibleConditions: string;
        recommendations: string; 
        urgencyLevel: string;
        suggestedDepartments: string[];
        conversationHistory: Array<{role: 'user' | 'assistant' | 'system', content: string}>;
    }> {
        const systemPrompt = `你是一位经验丰富的医学专家，具有丰富的初步诊断经验。你的任务是根据患者提供的症状和信息进行初步分析，提出可能的病因，并给出合理的就医建议。请保持专业、准确和谨慎。`;
        
        const prompt = `请根据以下患者信息进行预问诊分析：
症状描述：${patientInfo.symptoms}
${patientInfo.bodyParts ? `身体部位：${patientInfo.bodyParts.join('、')}` : ''}
${patientInfo.duration ? `持续时间：${patientInfo.duration}` : ''}
${patientInfo.existingConditions ? `已有疾病：${patientInfo.existingConditions.join('、')}` : ''}

请提供以下内容：
1. 可能的病因分析（列出2-3种可能性）
2. 就医建议（包括是否需要就医、建议科室）
3. 紧急程度评估（一般/较急/紧急）
4. 推荐就诊科室（列出1-2个最合适的科室）

请以JSON格式回复，包含以下字段：
{
  "possibleConditions": "详细的病因分析",
  "recommendations": "就医建议和注意事项",
  "urgencyLevel": "一般/较急/紧急",
  "suggestedDepartments": ["科室1", "科室2"]
}`;

        try {
            const result = await this.generateText({
                prompt,
                systemPrompt,
                temperature: 0.3, // Lower temperature for more consistent medical advice
                conversationHistory,
            });

            // Update conversation history with the assistant's response
            const updatedHistory = [...conversationHistory];
            updatedHistory.push({
                role: 'assistant',
                content: result.text
            });

            // Parse the JSON response
            try {
                const jsonResponse = JSON.parse(result.text);
                return {
                    possibleConditions: jsonResponse.possibleConditions || '',
                    recommendations: jsonResponse.recommendations || '',
                    urgencyLevel: jsonResponse.urgencyLevel || '一般',
                    suggestedDepartments: jsonResponse.suggestedDepartments || [],
                    conversationHistory: updatedHistory
                };
            } catch (parseError: unknown) {
                // If JSON parsing fails, try to extract structured information using regex
                logger.warn(`Failed to parse JSON response from AI: ${parseError instanceof Error ? parseError.message : 'Unknown error'}`);
                
                // Extract information using regex as fallback
                const possibleConditions = result.text.match(/可能的病因分析[：:]\s*([\s\S]*?)(?=就医建议|紧急程度|$)/i)?.[1]?.trim() || '';
                const recommendations = result.text.match(/就医建议[：:]\s*([\s\S]*?)(?=紧急程度|推荐就诊科室|$)/i)?.[1]?.trim() || '';
                const urgencyLevel = result.text.match(/紧急程度[：:]\s*(\S+)/i)?.[1]?.trim() || '一般';
                const departmentsText = result.text.match(/推荐就诊科室[：:]\s*([\s\S]*?)(?=$)/i)?.[1]?.trim() || '';
                const suggestedDepartments = departmentsText.split(/[,，、]/g).map(d => d.trim()).filter(Boolean);
                
                return {
                    possibleConditions,
                    recommendations,
                    urgencyLevel,
                    suggestedDepartments,
                    conversationHistory: updatedHistory
                };
            }
        } catch (error: any) {
            logger.error(`Pre-diagnosis generation error: ${error.message}`);
            throw new Error(`Failed to generate pre-diagnosis: ${error.message}`);
        }
    }

    /**
     * Generate medical report interpretation
     * @param reportInfo - Report information and content
     * @param conversationHistory - Previous messages in the conversation
     * @returns AI-generated report interpretation with findings and recommendations
     */
    static async generateReportInterpretation(
        reportInfo: ReportInfo,
        conversationHistory: Array<{role: 'user' | 'assistant' | 'system', content: string}> = []
    ): Promise<{
        interpretation: string;
        abnormalIndicators: Array<{name: string, value: string, referenceRange?: string, explanation: string}>;
        suggestions: string;
        conversationHistory: Array<{role: 'user' | 'assistant' | 'system', content: string}>;
    }> {
        const systemPrompt = `你是一位专业的医学影像/检验报告解读专家。你的任务是解读患者的医疗报告，找出异常指标，解释其医学意义，并提供适当的建议。请保持专业、准确和谨慎。`;
        
        const prompt = `请解读以下${reportInfo.reportType}报告：

报告日期：${reportInfo.reportDate || '未知'}
医院：${reportInfo.hospital || '未知'}
报告描述：${reportInfo.description || '未提供'}

报告内容：
${reportInfo.reportContent}

请提供以下内容：
1. 报告解读（包括总体评估和关键发现）
2. 异常指标分析（列出所有异常指标，包括指标名称、测量值、参考范围及其医学意义）
3. 建议（后续检查或治疗建议）

请以JSON格式回复，包含以下字段：
{
  "interpretation": "详细的报告解读",
  "abnormalIndicators": [
    {
      "name": "指标名称",
      "value": "测量值",
      "referenceRange": "参考范围",
      "explanation": "医学意义解释"
    }
  ],
  "suggestions": "后续建议"
}`;

        try {
            const result = await this.generateText({
                prompt,
                systemPrompt,
                patientInfo: {
                    age: reportInfo.patientAge,
                    gender: reportInfo.patientGender
                },
                temperature: 0.2, // Very low temperature for consistent medical interpretations
                conversationHistory,
            });

            // Update conversation history with the assistant's response
            const updatedHistory = [...conversationHistory];
            updatedHistory.push({
                role: 'assistant',
                content: result.text
            });

            // Parse the JSON response
            try {
                const jsonResponse = JSON.parse(result.text);
                return {
                    interpretation: jsonResponse.interpretation || '',
                    abnormalIndicators: jsonResponse.abnormalIndicators || [],
                    suggestions: jsonResponse.suggestions || '',
                    conversationHistory: updatedHistory
                };
            } catch (parseError: unknown) {
                // If JSON parsing fails, try to extract structured information using regex
                logger.warn(`Failed to parse JSON response from AI: ${parseError instanceof Error ? parseError.message : 'Unknown error'}`);
                
                // Extract information using regex as fallback
                const interpretation = result.text.match(/报告解读[：:]\s*([\s\S]*?)(?=异常指标分析|建议|$)/i)?.[1]?.trim() || '';
                const suggestions = result.text.match(/建议[：:]\s*([\s\S]*?)(?=$)/i)?.[1]?.trim() || '';
                
                // Simple extraction of abnormal indicators (limited functionality in regex fallback)
                const abnormalIndicators = [];
                const indicatorsMatch = result.text.match(/异常指标分析[：:]\s*([\s\S]*?)(?=建议|$)/i)?.[1];
                
                if (indicatorsMatch) {
                    const indicatorLines = indicatorsMatch.split('\n')
                        .map(line => line.trim())
                        .filter(line => line && line.includes(':'));
                        
                    for (const line of indicatorLines) {
                        const parts = line.split(':');
                        if (parts.length >= 2) {
                            abnormalIndicators.push({
                                name: parts[0].trim(),
                                value: parts[1].trim(),
                                explanation: parts[2]?.trim() || '无解释'
                            });
                        }
                    }
                }
                
                return {
                    interpretation,
                    abnormalIndicators,
                    suggestions,
                    conversationHistory: updatedHistory
                };
            }
        } catch (error: any) {
            logger.error(`Report interpretation error: ${error.message}`);
            throw new Error(`Failed to generate report interpretation: ${error.message}`);
        }
    }

    /**
     * Generate AI consultation response for patient questions
     * @param question - Patient's question
     * @param patientInfo - Additional patient information
     * @param conversationHistory - Previous messages in the conversation
     * @returns AI-generated consultation response and updated conversation history
     */
    static async generateConsultationResponse(
        question: string,
        patientInfo?: {
            age?: number;
            gender?: string;
            symptoms?: string;
            medicalHistory?: string[];
        },
        conversationHistory: Array<{role: 'user' | 'assistant' | 'system', content: string}> = []
    ): Promise<{
        response: string;
        conversationHistory: Array<{role: 'user' | 'assistant' | 'system', content: string}>;
    }> {
        const systemPrompt = `你是E诊通的AI医疗顾问，名为"医小通"。你的任务是回答患者的医疗咨询问题，提供专业且易于理解的医疗信息。
请遵循以下原则：
1. 保持医学准确性和专业性，同时使用患者能理解的语言
2. 对不确定的内容保持谨慎，不做确诊
3. 严重症状应建议患者及时就医，不要线上诊断危急情况
4. 回答要简洁明了，重点突出
5. 不要提供具体药物推荐和剂量，可以提供一般用药原则
6. 对超出医疗范围的问题，礼貌说明你只能提供医疗相关咨询

请根据患者提供的信息，给出专业、负责任的回答。`;

        // Format patient info for context
        let patientContext = '';
        if (patientInfo) {
            patientContext = `患者信息：
${patientInfo.age ? `- 年龄：${patientInfo.age}岁` : ''}
${patientInfo.gender ? `- 性别：${patientInfo.gender}` : ''}
${patientInfo.symptoms ? `- 主诉症状：${patientInfo.symptoms}` : ''}
${patientInfo.medicalHistory && patientInfo.medicalHistory.length ? 
  `- 病史：${patientInfo.medicalHistory.join('、')}` : ''}

`;
        }

        // Create a copy of conversation history to avoid modifying the original
        let updatedHistory = [...conversationHistory];
        
        // If conversation history is empty, add the system prompt
        if (updatedHistory.length === 0 && systemPrompt) {
            updatedHistory.push({
                role: 'system',
                content: systemPrompt
            });
        }

        // Add current question
        const currentQuestion = `${patientContext}患者问题：${question}`;
        updatedHistory.push({
            role: 'user',
            content: currentQuestion
        });

        try {
            // Use the DeepSeek API by default
            const response = await axios.post(
                `${config.aliCloudApiEndpoint}/chat/completions`,
                {
                    model: config.aliCloudQwqModelName,
                    messages: updatedHistory,
                    max_tokens: 1024,
                    temperature: 0.4,
                },
                {
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${config.aliCloudApiKey}`,
                    },
                }
            );

            let content = '';
            
            // Handle DeepSeek-R1 specific response format
            if (response.data.choices && response.data.choices.length > 0) {
                // Use content field, not reasoning_content
                content = response.data.choices[0].message.content;
            }
            
            logger.info(`AI consultation response generated successfully. Length: ${content.length} characters`);
            
            // Add assistant response to conversation history
            updatedHistory.push({
                role: 'assistant',
                content: content
            });
            
            return {
                response: content,
                conversationHistory: updatedHistory
            };
        } catch (error: any) {
            logger.error(`AI consultation response error: ${error.message}`);
            if (error.response) {
                logger.error(`API response: ${JSON.stringify(error.response.data)}`);
            }
            
            // Try fallback to AliCloud API if DeepSeek fails
            try {
                const result = await this.generateTextWithAliCloud(
                    updatedHistory,
                    1024,
                    0.4,
                    false
                );
                
                // Add assistant response to conversation history
                updatedHistory.push({
                    role: 'assistant',
                    content: result.text
                });
                
                return {
                    response: result.text,
                    conversationHistory: updatedHistory
                };
            } catch (fallbackError: any) {
                throw new Error(`Failed to generate consultation response: ${error.message}`);
            }
        }
    }
}

export default AiService; 