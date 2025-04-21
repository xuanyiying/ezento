import axios from 'axios';
import logger from '../../config/logger';
import {
    AIRequestOptions,
    AIResponse,
    AIStreamHandler,
    Message,
    getAIConfig,
} from './ai.interfaces';

// Get the safe configuration object
const aiConfig = getAIConfig();

enum AIProvider {
    ALIBABA = 'alibaba', // 阿里云百炼
    OLLAMA = 'ollama', // 本地Ollama
    DEEPSEEK = 'deepseek', // 阿里云DeepSeek
}

/**
 * AI提供商适配器接口
 */
export interface AIProviderAdapter {
    executeRequest(messages: Message[], options?: AIRequestOptions): Promise<AIResponse>;
    executeStreamRequest(
        messages: Message[],
        handler: AIStreamHandler,
        options?: AIRequestOptions
    ): Promise<string>;
}

function splitJsonObjects(input: string): string[] {
    const result: string[] = [];
    let depth = 0;
    let startIndex = 0;
    
    for (let i = 0; i < input.length; i++) {
      const char = input[i];
      
      if (char === '{') {
        if (depth === 0) {
          startIndex = i;
        }
        depth++;
      } else if (char === '}') {
        depth--;
        
        if (depth === 0) {
          result.push(input.substring(startIndex, i + 1));
        }
      }
    }
    
    return result.length > 0 ? result : [input];
  }

// 定义流响应块的类型
export interface AIStreamChunk {
    type: 'content';
    content: string;
  }
  
  /**
   * 阿里云百炼适配器
   */
  export class AlibabaProviderAdapter implements AIProviderAdapter {
    /**
     * 执行标准AI请求
     */
    async executeRequest(messages: Message[], options: AIRequestOptions = {}): Promise<AIResponse> {
      try {
        const {
          stream = false,
                temperature = aiConfig.aiApiTemperature,
                maxTokens = aiConfig.aiApiMaxTokens,
                systemPrompt,
        } = options;
        
        // 准备消息
        const formattedMessages = this.formatMessages(messages, systemPrompt);
        
        // 确定API端点和模型
            const endpoint = aiConfig.aiApiEndpoint;
            const model = aiConfig.aiModelName;
            const apiKey = aiConfig.aiApiKey;
        
        logger.debug(`使用API: ${endpoint}, 模型: ${model}`);
        
        // 调用API
        const response = await axios.post(
          endpoint,
          {
            model: model,
            messages: formattedMessages,
            temperature: temperature,
            max_tokens: maxTokens,
                    stream: stream,
          },
          {
            headers: {
              'Content-Type': 'application/json',
                        Authorization: `Bearer ${apiKey}`,
            },
                    timeout: 30000,
          }
        );
        
        // 提取响应内容
        let responseContent = '';
        if (response.data?.choices && response.data.choices.length > 0) {
          responseContent = response.data.choices[0].message.content;
        } else {
          throw new Error('无效的API响应格式');
        }

            // 确保返回内容不为空，避免数据库验证错误
            if (!responseContent || responseContent.trim() === '') {
                responseContent = '抱歉，AI响应内容为空。请稍后再试或重新提问。';
        }
        
        logger.info(`阿里云百炼请求成功，响应长度: ${responseContent.length}字节`);
        
        return {
          content: responseContent,
          id: response.data.id,
                model: response.data.model,
        };
      } catch (error: any) {
        logger.error(`阿里云百炼请求失败: ${error.message}`, {
          stack: error.stack,
                response: error.response?.data,
        });
        throw new Error(`AI请求失败: ${error.message}`);
      }
    }
    
    /**
     * 执行流式AI请求
     */
    async executeStreamRequest(
        messages: Message[],
        handler: AIStreamHandler,
        options: AIRequestOptions = {}
    ): Promise<string> {
      let fullResponse = '';
      
      try {
        const {
                temperature = aiConfig.aiApiTemperature,
                maxTokens = aiConfig.aiApiMaxTokens,
                systemPrompt,
        } = options;
        
        // 准备消息
        const formattedMessages = this.formatMessages(messages, systemPrompt);
        
        // 确定API端点和模型
            const endpoint = aiConfig.aiApiEndpoint;
            const model = aiConfig.aiModelName;
            const apiKey = aiConfig.aiApiKey;
        
        logger.debug(`使用百炼流式API: ${endpoint}, 模型: ${model}`);
        
        // 调用API
        const response = await axios.post(
          endpoint,
          {
            model: model,
            messages: formattedMessages,
            temperature: temperature,
            max_tokens: maxTokens,
                    stream: true,
          },
          {
            headers: {
              'Content-Type': 'application/json',
                        Authorization: `Bearer ${apiKey}`,
                        Accept: 'text/event-stream',
            },
            responseType: 'stream',
                    timeout: 60000,
          }
        );
        
        // 处理流式响应
        for await (const chunk of response.data) {
          try {
            const chunkString = chunk.toString().trim();
            if (!chunkString) continue;
            
            // 处理数据块
            if (chunkString.startsWith('data:')) {
              const jsonPart = chunkString.slice(5).trim();
              
              if (jsonPart === '[DONE]') {
                logger.debug('收到流式响应结束标记');
                continue;
              }
              
              try {
                const parsed = JSON.parse(jsonPart);
                if (parsed.choices && parsed.choices[0]?.delta?.content) {
                  const content = parsed.choices[0].delta.content;
                  fullResponse += content;
                  handler(content);
                }
              } catch (parseError) {
                // 尝试分离可能连接在一起的多个JSON对象
                const jsonObjects = splitJsonObjects(jsonPart);
                for (const jsonObj of jsonObjects) {
                  try {
                    const parsed = JSON.parse(jsonObj);
                    if (parsed.choices && parsed.choices[0]?.delta?.content) {
                      const content = parsed.choices[0].delta.content;
                      fullResponse += content;
                      handler(content);
                    }
                  } catch (e) {
                    logger.debug(`JSON解析失败: ${e}`);
                  }
                }
              }
            } else if (chunkString.includes('data:')) {
              // 处理可能在一行中包含多个data:前缀的情况
              const parts = chunkString.split('data:');
              for (const part of parts) {
                if (!part.trim()) continue;
                
                try {
                  const parsed = JSON.parse(part.trim());
                  if (parsed.choices && parsed.choices[0]?.delta?.content) {
                    const content = parsed.choices[0].delta.content;
                    fullResponse += content;
                    handler(content);
                  }
                } catch (e) {
                  logger.debug(`跳过无效JSON部分`);
                }
              }
            }
          } catch (chunkError: any) {
            logger.warn(`处理数据块错误: ${chunkError.message}`);
          }
        }
        
        logger.info(`阿里云百炼流式请求完成，总长度: ${fullResponse.length}字节`);

            // 确保返回内容不为空，避免数据库验证错误
            if (!fullResponse || fullResponse.trim() === '') {
                fullResponse = '抱歉，AI响应内容为空。请稍后再试或重新提问。';
                handler(fullResponse);
            }

        return fullResponse;
      } catch (error: any) {
        logger.error(`阿里云百炼流式请求失败: ${error.message}`, {
                stack: error.stack,
        });
        
        const errorMessage = '抱歉，在处理您的请求时发生了错误，请稍后再试。';
        handler(errorMessage);
        return errorMessage;
      }
    }
    
    /**
     * 格式化消息
     */
    private formatMessages(messages: Message[], systemPrompt?: string): Message[] {
      // 添加系统提示
      const formattedMessages: Message[] = [];
      
      // 添加系统消息（如果提供）
      if (systemPrompt) {
        formattedMessages.push({ role: 'system', content: systemPrompt });
      } else if (!messages.some(msg => msg.role === 'system')) {
        // 如果没有提供系统提示且消息中没有系统消息，添加默认系统提示
        formattedMessages.push({ 
          role: 'system', 
                content: '你是一位专业的医疗助手，能够提供准确、有帮助的医疗咨询建议。',
        });
      }
      
      // 添加其他消息
      formattedMessages.push(...messages);
      
      return formattedMessages;
    }
  }
  
  /**
   * 本地Ollama适配器
   */
export class OllamaProviderAdapter implements AIProviderAdapter {
    /**
     * 执行标准AI请求
     */
    async executeRequest(messages: Message[], options: AIRequestOptions = {}): Promise<AIResponse> {
      try {
        const {
                temperature = aiConfig.aiApiTemperature,
                maxTokens = aiConfig.aiApiMaxTokens,
                systemPrompt,
        } = options;
        
        // 提取系统提示
        let systemMessage = '';
        if (systemPrompt) {
          systemMessage = systemPrompt;
        } else {
          const systemMsg = messages.find(msg => msg.role === 'system');
          if (systemMsg) {
            systemMessage = systemMsg.content;
          }
        }
        
        // 确定API端点和模型
            const endpoint = aiConfig.aiApiEndpoint;
            const model = aiConfig.aiModelName;
        
        logger.debug(`使用Ollama API: ${endpoint}, 模型: ${model}`);
        
            messages.push({
                role: 'system',
                content: systemMessage,
            });
            const body = {
            model: model,
            messages: messages.map(msg => ({
              role: msg.role,
                    content: msg.content,
            })),
            temperature: temperature,
                max_tokens: maxTokens,
            };

            // 调用Ollama API
            const response = await axios.post(`${endpoint}`, body, {
                headers: {
                    'Content-Type': 'application/json',
                },
            });
            logger.info('ollama response:', response);
            if (response.status !== 200) {
          throw new Error(`Ollama API请求失败: ${response.status} ${response.statusText}`);
        }
        
            const data = response.data;

            // 从Ollama响应中正确提取内容
            // Ollama返回格式: { message: { content: "内容" } }
            let responseContent = '';
            if (data.message && data.message.content !== undefined) {
                // 优先使用message.content (Ollama 3.x格式)
                responseContent = data.message.content;
            } else if (data.response !== undefined) {
                // 兼容旧版本的response字段 (Ollama 2.x格式)
                responseContent = data.response;
            }

            logger.info(`Ollama请求成功，响应长度: ${responseContent.length}字节`);

            // 确保返回内容不为空，避免数据库验证错误
            if (!responseContent || responseContent.trim() === '') {
                responseContent = '抱歉，AI响应内容为空。请稍后再试或重新提问。';
            }
        
        return {
                content: responseContent,
                id: data.id || '',
                model: data.model || model,
        };
      } catch (error: any) {
        logger.error(`Ollama请求失败: ${error.message}`, {
                stack: error.stack,
        });
        throw new Error(`AI请求失败: ${error.message}`);
      }
    }
    
    /**
     * 执行流式AI请求
     */
    async executeStreamRequest(
        messages: Message[],
        handler: AIStreamHandler,
        options: AIRequestOptions = {}
    ): Promise<string> {
      let fullResponse = '';
      
      try {
        const {
                temperature = aiConfig.aiApiTemperature,
                maxTokens = aiConfig.aiApiMaxTokens,
                systemPrompt,
        } = options;
        
        // 提取系统提示
        let systemMessage = '';
        if (systemPrompt) {
          systemMessage = systemPrompt;
        } else {
          const systemMsg = messages.find(msg => msg.role === 'system');
          if (systemMsg) {
            systemMessage = systemMsg.content;
          }
        }
        
        // 确定API端点和模型
            const endpoint = aiConfig.aiApiEndpoint;
            const model = aiConfig.aiModelName;
        
        logger.debug(`使用Ollama流式API: ${endpoint}, 模型: ${model}`);
        
        // 调用Ollama API
            const response = await fetch(`${endpoint}`, {
          method: 'POST',
          headers: {
                    'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: model,
            messages: messages.map(msg => ({
              role: msg.role,
                        content: msg.content,
            })),
            temperature: temperature,
            max_tokens: maxTokens,
                    stream: true,
                }),
        });
        
        if (!response.ok) {
          throw new Error(`Ollama API请求失败: ${response.status} ${response.statusText}`);
        }
        
        if (!response.body) {
          throw new Error('无法获取响应流');
        }
        
        // 处理流式响应
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          
          const chunk = decoder.decode(value, { stream: true });
          const lines = chunk.split('\n').filter(line => line.trim());
          
          for (const line of lines) {
            try {
              const data = JSON.parse(line);
                        // 兼容Ollama 3.x和2.x两种响应格式
                        let content = '';
                        if (data.message && data.message.content !== undefined) {
                            // Ollama 3.x格式
                            content = data.message.content;
                        } else if (data.response) {
                            // Ollama 2.x格式
                            content = data.response;
                        }

                        if (content) {
                            fullResponse += content;
                            handler(content);
              }
            } catch (e) {
              logger.debug(`解析Ollama流响应失败: ${line}`);
            }
          }
        }
        
        logger.info(`Ollama流式请求完成，总长度: ${fullResponse.length}字节`);

            // 确保返回内容不为空，避免数据库验证错误
            if (!fullResponse || fullResponse.trim() === '') {
                fullResponse = '抱歉，AI响应内容为空。请稍后再试或重新提问。';
                handler(fullResponse);
            }

        return fullResponse;
      } catch (error: any) {
        logger.error(`Ollama流式请求失败: ${error.message}`, {
                stack: error.stack,
        });
        
        const errorMessage = '抱歉，在处理您的请求时发生了错误，请稍后再试。';
        handler(errorMessage);
        return errorMessage;
      }
    }
  
    async streamRequest(options: AIRequestOptions): Promise<ReadableStream<AIStreamChunk>> {
        const { temperature = 0.7, maxTokens = 2048 } = options;
        const messages = options.messages || [];
        const endpoint = aiConfig.aiApiEndpoint + '/api/chat';
        const model = aiConfig.aiModelName;

        try {
            const response = await fetch(endpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    model: model,
                    messages: messages.map((msg: any) => ({
                        role: msg.role,
                        content: msg.content,
                    })),
                    temperature: temperature,
                    max_tokens: maxTokens,
                    stream: true,
                }),
            });

            if (!response.ok) {
                throw new Error(`Ollama API请求失败: ${response.status} ${response.statusText}`);
            }

            const reader = response.body?.getReader();
            const decoder = new TextDecoder();

            return new ReadableStream<AIStreamChunk>({
                async start(controller) {
                    if (!reader) {
                        controller.close();
                        return;
                    }

                    while (true) {
                        const { done, value } = await reader.read();
                        if (done) {
                            controller.close();
                            break;
                        }

                        const chunk = decoder.decode(value, { stream: true });
                        const lines = chunk.split('\n').filter(line => line.trim() !== '');

                        for (const line of lines) {
                            try {
                                if (line.startsWith('data: ')) {
                                    const jsonStr = line.slice(6).trim();
                                    if (jsonStr === '[DONE]') {
                                        continue;
                                    }

                                    const data = JSON.parse(jsonStr);
                                    // 兼容Ollama 3.x和2.x两种响应格式
                                    let content = '';
                                    if (data.message && data.message.content !== undefined) {
                                        // Ollama 3.x格式
                                        content = data.message.content;
                                    } else if (data.response) {
                                        // Ollama 2.x格式
                                        content = data.response;
                                    }

                                    if (content) {
                                        controller.enqueue({
                                            type: 'content',
                                            content,
                                        });
                                    }
                                }
                            } catch (err) {
                                console.error('解析流响应失败:', err, 'Line:', line);
                            }
                        }
                    }
                },

                async cancel() {
                    reader?.cancel();
                },
            });
        } catch (err) {
            console.error('Ollama流请求失败:', err);
            throw err;
        }
    }
  }
  
  /**
   * AI服务工厂
   */
  export class AIProviderFactory {
    /**
     * 获取当前配置的AI提供商适配器
     */
    static getProvider(): AIProviderAdapter {
      let provider: AIProvider;
        logger.debug(
            `使用AI提供商: ${aiConfig.aiModel} (端点: ${aiConfig.aiApiEndpoint}, 模型: ${aiConfig.aiModelName})`
        );
      
      // 将配置文件中的模型类型映射到AIProvider枚举
        switch (aiConfig.aiModel) {
        case 'ollama':
          provider = AIProvider.OLLAMA;
          break;
            case 'alibaba':
          provider = AIProvider.ALIBABA;
          break;
        case 'deepseek':
          // 暂时使用阿里云适配器处理deepseek，后续可扩展专用适配器
          provider = AIProvider.ALIBABA; 
          break;
        default:
                provider = AIProvider.OLLAMA;
          logger.debug(`使用默认提供商: ${provider}`);
      }
      
      // 创建并返回对应的适配器
      switch (provider) {
        case AIProvider.OLLAMA:
          return new OllamaProviderAdapter();
        case AIProvider.ALIBABA:
        default:
          return new AlibabaProviderAdapter();
      }
    }
  }
  