import config from "../../config/config";
import { ConversationType } from "../../interfaces/conversation.interface";
import logger from "../../utils/logger";
import OCRService from "../ocr.service";
import { AIRequestOptions, AIResponse, AIStreamHandler, GenerateTextOptions, GenerateTextResponse,  Message } from "./ai.interfaces";
import { AIProviderFactory } from "./ai.provider";

/**
 * 咨询类型枚举
 */
export enum ConsultationType {
  PRE_DIAGNOSIS = 'PRE_DIAGNOSIS',           // 问诊
  GUIDE = 'GUIDE',                           // 导诊
  REPORT_INTERPRETATION = 'REPORT_INTERPRETATION', // 报告解读
  GENERAL = 'GENERAL'                        // 一般咨询
}

/**
 * 核心AI服务， 根据不同的会话类型构建不同场景的请求body 
 */
export class AiService {
  /**
   * 格式化病历内容
   */
  private static formatMedicalRecord(content: string): string {
    // 预定义的病历章节
    const sections = [
      '主诉', '现病史', '既往史', '个人史', '家族史',
      '体格检查', '辅助检查', '初步诊断', '处理意见'
    ];

    // 检查内容是否已经包含【病历记录】标题
    if (content.includes('【病历记录】')) {
      return content; // 已经是格式化的病历，直接返回
    }

    let formattedContent = '【病历记录】\n\n';
    let currentSection = '';
    let sectionContent = '';
    let hasSections = false;

    // 按行处理内容
    const lines = content.split('\n');
    for (const line of lines) {
      // 检查是否是新的章节标题（考虑多种可能的格式）
      const sectionMatch = sections.find(section => {
        // 匹配 "主诉："、"主诉:"、"【主诉】"、"* 主诉"、"1. 主诉" 等多种格式
        const patterns = [
          `^${section}[:：]`,
          `^【${section}】`,
          `^\\*\\s*${section}`,
          `^\\d+\\.\\s*${section}`
        ];
        const regex = new RegExp(patterns.join('|'));
        return regex.test(line.trim());
      });

      if (sectionMatch || sections.includes(line.trim())) {
        // 如果找到新章节标题
        hasSections = true;

        // 保存之前的章节内容（如果有）
        if (currentSection && sectionContent) {
          formattedContent += `${currentSection}：\n${sectionContent.trim()}\n\n`;
        }

        // 提取章节标题，统一格式
        currentSection = sectionMatch || line.trim();
        // 移除可能的前缀符号（如数字、标点等）
        currentSection = currentSection.replace(/^[\d\.\*\【\】\s\:：]+/, '').replace(/[\:：\s]+$/, '');
        sectionContent = '';
      } else if (currentSection) {
        // 继续添加到当前章节
        sectionContent += line + '\n';
      } else {
        // 如果没有章节标题但有内容，可能是前言或概述
        formattedContent += line + '\n';
      }
    }

    // 处理最后一个章节
    if (currentSection && sectionContent) {
      formattedContent += `${currentSection}：\n${sectionContent.trim()}\n\n`;
    }

    // 如果没有找到任何标准章节，检查是否需要进行结构化处理
    if (!hasSections) {
      // 尝试智能分段：查找可能的主诉、现病史等内容
      const structuredContent = this.attemptToStructureContent(content);
      if (structuredContent !== content) {
        return '【病历记录】\n\n' + structuredContent;
      }

      // 如果无法结构化，保持原始内容
      return '【病历记录】\n\n' + content;
    }

    return formattedContent;
  }

  /**
   * 尝试将非结构化内容智能分段为医疗病历格式
   * 当内容没有明确的章节标题时使用
   */
  private static attemptToStructureContent(content: string): string {
    // 简单的启发式方法，寻找关键词来分段
    let structured = content;

    // 可能的主诉关键词
    const chiefComplaintKeywords = ['感到', '不适', '疼痛', 'uncomfortable', '症状'];

    // 可能的现病史关键词
    const presentIllnessKeywords = ['开始', '近日', '最近', '发现', '出现'];

    // 可能的既往史关键词
    const pastHistoryKeywords = ['曾经', '既往', '过去', '史', 'history'];

    // 可能的处理建议关键词
    const recommendationKeywords = ['建议', '应该', '需要', '推荐', '治疗'];

    // 这里仅做简单示例，实际实现可能需要更复杂的NLP方法
    // 简单起见，我们只检查几个关键部分

    // 仅当确定内容确实包含这些元素时才进行结构化
    // 这个函数可以根据实际需要扩展完善

    return structured; // 如果无法结构化，返回原内容
  }

  /**
   * 统一的AI请求方法
   */
   static async callAI(messages: Message[], options?: AIRequestOptions): Promise<AIResponse> {
    try {
      // 获取当前配置的提供商适配器
      const provider = AIProviderFactory.getProvider();

      // 执行请求
      return await provider.executeRequest(messages, options);
    } catch (error: any) {
      logger.error(`AI请求失败: ${error.message}`);
      throw new Error(`AI请求失败: ${error.message}`);
    }
  }

  /**
   * 统一的流式AI请求方法
   */
  static async callAIStream(messages: Message[], handler: AIStreamHandler, options?: AIRequestOptions): Promise<string> {
    try {
      // 获取当前配置的提供商适配器
      const provider = AIProviderFactory.getProvider();

      // 执行流式请求
      return await provider.executeStreamRequest(messages, handler, options);
    } catch (error: any) {
      logger.error(`流式AI请求失败: ${error.message}`);
      const errorMessage = '抱歉，在处理您的请求时发生了错误，请稍后再试。';
      handler(errorMessage);
      return errorMessage;
    }
  }

  /**
   * 生成流式响应
   */
  static async* generateStreamingResponse(
    userMessage: string,
    messages: Array<{ role: string; content: string }>,
    conversationType: ConversationType,
    referenceId: string
  ): AsyncGenerator<string> {
    try {
      // 1. 准备上下文和系统提示
      const { systemPrompt, additionalContext } = await this.prepareContextByType(
        conversationType,
        referenceId
      );

      // 2. 构建完整的提示
      const fullPrompt = `${additionalContext || ''}${userMessage}`;

      // 3. 格式化会话历史
      const formattedMessages = this.formatHistoryMessages(messages)
        .filter(msg => msg.role !== 'system'); // 移除系统消息，我们将使用新的系统提示

      // 4. 添加当前用户消息
      formattedMessages.push({ role: 'user', content: fullPrompt });

      // 5. 创建流式处理器
      let fullResponse = '';
      const streamHandler = (chunk: string) => {
        fullResponse += chunk;
        return chunk;
      };

      // 6. 调用流式AI服务
      for await (const chunk of this.generateStreamChunks(formattedMessages, streamHandler, { systemPrompt })) {
        yield chunk;
      }

      return fullResponse;
    } catch (error: any) {
      logger.error(`生成流式响应失败: ${error.message}`);
      yield '抱歉，在处理您的请求时发生了错误，请稍后再试。';
    }
  }

  /**
   * 生成流式响应块
   */
  private static async* generateStreamChunks(
    messages: Message[],
    handler: AIStreamHandler,
    options: AIRequestOptions = {}
  ): AsyncGenerator<string> {
    try {
      // 获取AI提供商
      const provider = AIProviderFactory.getProvider();

      // 使用流式处理器
      let buffer = '';
      const customHandler = (chunk: string) => {
        buffer += chunk;
        handler(chunk);
        return chunk;
      };

      // 执行流式请求
      await provider.executeStreamRequest(messages, customHandler, options);

      // 返回所有块
      for (const chunk of buffer) {
        yield chunk;
      }
    } catch (error: any) {
      logger.error(`生成流式块失败: ${error.message}`);
      const errorMessage = '抱歉，在处理您的请求时发生了错误，请稍后再试。';
      handler(errorMessage);
      yield errorMessage;
    }
  }

  /**
   * 根据会话类型准备上下文和系统提示
   */
  private static async prepareContextByType(
    conversationType: ConversationType,
    referenceId: string
  ): Promise<{ systemPrompt: string; additionalContext?: string }> {
    let systemPrompt = '';
    let additionalContext = '';

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
        try {
          // 判断pdf 还是多张图片
          const referenceIdArray = referenceId.split('_');
          if (referenceIdArray.length > 1) {
            const reportText = await OCRService.recognizePDF(referenceId);
            additionalContext = `报告内容：${reportText}\n`;
          } else {
            const reportText = await OCRService.recognizeImage(referenceId);
            additionalContext = `报告内容：${reportText}\n`;
          }
          logger.info(`成功获取报告内容，长度: ${additionalContext.length}字节`);
        } catch (ocrError: any) {
          logger.error(`获取报告内容失败: ${ocrError.message}`);
          additionalContext = '无法获取报告内容，请重新上传报告。\n';
        }
        break;

      default:
        systemPrompt = '你是一位医疗咨询助手。';
    }

    return { systemPrompt, additionalContext };
  }

  /**
   * 格式化会话历史
   */
  private static formatHistoryMessages(
    messages: Array<{ role: string; content: string }>
  ): Message[] {
    return messages.map(msg => {
      if (msg.role === 'system') return { role: 'system', content: msg.content };
      if (msg.role === 'user') return { role: 'user', content: msg.content };
      return { role: 'assistant', content: msg.content };
    });
  }

  /**
   * 生成文本（适用于各种咨询类型）
   * @param {GenerateTextOptions} options 生成选项
   * @returns {Promise<GenerateTextResponse>} 生成结果
   */
  static async generateText(options: GenerateTextOptions): Promise<GenerateTextResponse> {
    try {
      const {
        prompt,
        systemPrompt,
        patientInfo,
        maxTokens = 2048,
        temperature = 0.7,
        messages = [],
        consultationType
      } = options;

      // 构建增强提示
      const enhancedPrompt = this.buildEnhancedPrompt(prompt, patientInfo);

      // 准备消息
      const formattedMessages: Message[] = [];

      // 添加系统提示 (使用传入的systemPrompt或根据咨询类型获取)
      const finalSystemPrompt = systemPrompt || (consultationType ? this.getSystemPrompt(consultationType) : '');
      if (finalSystemPrompt) {
        formattedMessages.push({ role: 'system', content: finalSystemPrompt });
      }

      // 添加会话历史
      for (const msg of messages) {
        // 处理字符串类型的role
        const role = msg.role as string; // 先转换为string类型
        let msgRole: 'system' | 'user' | 'assistant';

        if (role === 'patient' || role === 'user') {
          msgRole = 'user';
        } else if (role === 'doctor' || role === 'assistant') {
          msgRole = 'assistant';
        } else if (role === 'system') {
          msgRole = 'system';
        } else {
          // 默认为用户
          msgRole = 'user';
        }

        formattedMessages.push({
          role: msgRole,
          content: msg.content
        });
      }

      // 添加当前问题
      formattedMessages.push({ role: 'user', content: enhancedPrompt });

      // 调用AI服务
      const response = await this.callAI(formattedMessages, {
        temperature,
        maxTokens
      });

      // 处理响应内容 - 根据咨询类型格式化
      const responseContent = this.formatResponseByConsultationType(
        response.content || '',
        consultationType
      );

      // 构建结果
      const result: GenerateTextResponse = {
        id: response.id || '',
        text: responseContent,
        thinking: response.metadata?.thinking
      };

      logger.info(`AI文本生成成功，长度: ${result.text.length}字节，类型: ${consultationType || ConsultationType.GENERAL}`);
      return result;
    } catch (error: any) {
      logger.error(`AI文本生成失败: ${error.message}`);
      throw new Error(`无法生成AI文本: ${error.message}`);
    }
  }

  /**
   * 构建增强提示，添加患者信息
   */
  private static buildEnhancedPrompt(prompt: string, patientInfo?: any): string {
    if (!patientInfo) return prompt;

    const { age, gender, symptoms, medicalHistory } = patientInfo;

    return `医疗问诊背景:
- 患者年龄: ${age || '未知'}
- 患者性别: ${gender || '未知'}
- 症状描述: ${symptoms?.join(', ') || '未知'}
- 病史: ${medicalHistory?.join(', ') || '无'}

${prompt}`;
  }

  /**
   * 获取针对特定咨询类型的系统提示
   * @param consultationType 咨询类型
   * @returns 系统提示内容
   */
  private static getSystemPrompt(consultationType?: string): string {
    const basePrompt = '你是一位专业的医疗AI助手，名为"医小通"。';

    switch (consultationType) {
      case ConsultationType.PRE_DIAGNOSIS:
        return `${basePrompt}
你是一位经验丰富的医学专家，具有丰富的初步诊断经验。
请根据患者提供的症状和信息进行初步分析，提出可能的病因，并给出合理的就医建议。
请以标准病历格式回复，包含以下部分：
1. 主诉：简要概括患者的主要症状和持续时间
2. 现病史：详细描述患者当前疾病的发展过程
3. 既往史：相关的过去病史
4. 个人史：生活习惯、职业等可能相关的因素
5. 家族史：相关疾病家族史
6. 体格检查：根据描述推测可能的体征
7. 辅助检查：建议进行的检查
8. 初步诊断：基于现有信息的诊断意见
9. 处理意见：包括建议用药、生活调整和就诊建议等

请保持专业、准确和谨慎。`;

      case ConsultationType.GUIDE:
        return `${basePrompt}
你是一位医院导诊专家，熟悉各科室职能和医生专长。
请根据患者描述的症状和需求，提供以下信息：
1. 最适合就诊的科室及原因
2. 就诊前的准备工作
3. 可能需要的检查
4. 挂号建议（普通门诊/专家门诊）
5. 就诊流程指导

请提供客观、清晰的指导，并注明这仅是一般性建议，具体诊疗应遵医嘱。`;

      case ConsultationType.REPORT_INTERPRETATION:
        return `${basePrompt}
你是一位专业的医学影像/检验报告解读专家。
请解读患者提供的医疗报告，并提供以下信息：
1. 报告结果摘要（简明扼要）
2. 异常指标解释及其可能的临床意义
3. 正常指标的健康意义
4. 生活建议和注意事项
5. 是否需要进一步检查或就医的建议

请使用患者易于理解的语言，避免过于专业的术语，同时保持医学准确性。`;

      default:
        return `${basePrompt}
请回答患者的医疗咨询问题，提供专业且易于理解的医疗信息。
请注意：
1. 提供循证医学支持的信息
2. 不做确诊，而是提供合理的医学解释和建议
3. 对于严重症状，建议及时就医
4. 使用患者友好的语言解释专业概念
5. 在信息不足时，指出限制并建议咨询医生`;
    }
  }

  /**
   * 处理会话消息
   * @param message 用户消息
   * @param conversationHistory 会话历史
   * @param options 选项配置
   * @returns 处理后的响应内容
   */
  static async processConversationMessage(
    message: string,
    messages: Array<{ role: 'user'| 'system'; content: string }>,
    options: {
      stream?: boolean;
      chunkCallback?: (chunk: string) => void;
      consultationType?: string | ConsultationType;
    } = {}
  ): Promise<string> {
    const { chunkCallback, consultationType } = options;

    try {
      // 1. 准备系统提示
      const systemPrompt = this.getSystemPrompt(consultationType);  

      // 添加当前用户消息
      messages.push({ role: 'user', content: message });

      // 3. 根据是否流式响应选择不同处理方式
      let responseContent = '';

      if (config.aiApiStream && chunkCallback) {
        // 流式响应
        responseContent = await this.callAIStream(messages, chunkCallback, {
          systemPrompt,
          stream: true
        });
      } else {
        // 非流式响应
        const response = await this.callAI(messages, {
          systemPrompt,
          stream: false
        });
        responseContent = response.content;
      }

      // 4. 根据咨询类型处理响应内容
      responseContent = this.formatResponseByConsultationType(responseContent, consultationType);

      return responseContent;
    } catch (error: any) {
      logger.error(`处理会话消息失败: ${error.message}`);
      return '抱歉，在处理您的请求时发生了错误，请稍后再试。';
    }
  }

  /**
   * 根据咨询类型格式化响应内容
   * @param content 原始响应内容
   * @param consultationType 咨询类型
   * @returns 格式化后的响应内容
   */
  private static formatResponseByConsultationType(content: string, consultationType?: string): string {
    // 确保content不为空，避免数据库验证错误
    if (!content || content.trim() === '') {
      return '抱歉，AI响应内容为空。请稍后再试或重新提问。';
    }

    switch (consultationType) {
      case ConsultationType.PRE_DIAGNOSIS:
        // 问诊类型：格式化为标准病历格式
        return this.formatMedicalRecord(content);

      case ConsultationType.REPORT_INTERPRETATION:
        // 报告解读类型：可以添加特定格式化处理
        return content;

      case ConsultationType.GUIDE:
        // 导诊类型：可以添加特定格式化处理
        return content;

      default:
        // 一般咨询：保持原样
        return content;
    }
  }
}

export default AiService;