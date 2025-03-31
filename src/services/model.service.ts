import { IModelRepository } from '../repositories/model.repository';
import { Model, ModelParameters, TenantModelConfig } from '../domains/model/model.entity';
import { ApiKey, InferenceRequest, InferenceResponse } from '../domains/model/api-key.entity';
import { ApiError } from '../middlewares/errorHandler';
import crypto from 'crypto';
import fetch from 'node-fetch';

export class ModelService {
    constructor(private modelRepository: IModelRepository) { }

    // 模型管理
    async getAllModels(page = 1, limit = 10): Promise<{ models: Model[]; total: number }> {
        return this.modelRepository.findAllModels(page, limit);
    }

    async getModelById(id: string): Promise<Model> {
        const model = await this.modelRepository.findModelById(id);
        if (!model) {
            throw new ApiError(404, '模型不存在');
        }
        return model;
    }

    async createModel(model: Partial<Model>): Promise<Model> {
        this.validateModelData(model);
        return this.modelRepository.createModel(model);
    }

    async updateModel(id: string, model: Partial<Model>): Promise<Model> {
        await this.getModelById(id);
        return this.modelRepository.updateModel(id, model);
    }

    async deleteModel(id: string): Promise<void> {
        await this.getModelById(id);
        return this.modelRepository.deleteModel(id);
    }

    async toggleModelStatus(id: string, isActive: boolean): Promise<Model> {
        await this.getModelById(id);
        return this.modelRepository.toggleModelStatus(id, isActive);
    }

    // 模型参数
    async updateModelParameters(id: string, parameters: ModelParameters): Promise<Model> {
        await this.getModelById(id);
        return this.modelRepository.updateModelParameters(id, parameters);
    }

    // 租户模型配置
    async getTenantModels(tenantId: string, page = 1, limit = 10): Promise<{ configs: TenantModelConfig[]; total: number }> {
        return this.modelRepository.findTenantModels(tenantId, page, limit);
    }

    async getTenantModelConfig(tenantId: string, modelId: string): Promise<TenantModelConfig | null> {
        return this.modelRepository.findTenantModelConfig(tenantId, modelId);
    }

    async configureTenantModel(tenantId: string, modelId: string, config: Partial<TenantModelConfig>): Promise<TenantModelConfig> {
        // 先检查模型是否存在
        await this.getModelById(modelId);

        // 检查租户模型配置是否已存在
        const existingConfig = await this.getTenantModelConfig(tenantId, modelId);

        if (existingConfig) {
            return this.modelRepository.updateTenantModelConfig(tenantId, modelId, config);
        } else {
            return this.modelRepository.createTenantModelConfig({
                tenantId,
                modelId,
                ...config
            });
        }
    }

    // API密钥管理
    async getAllApiKeys(page = 1, limit = 10): Promise<{ keys: ApiKey[]; total: number }> {
        return this.modelRepository.findAllApiKeys(page, limit);
    }

    async getApiKeyById(id: string): Promise<ApiKey> {
        const apiKey = await this.modelRepository.findApiKeyById(id);
        if (!apiKey) {
            throw new ApiError(404, 'API密钥不存在');
        }
        return apiKey;
    }

    async getTenantApiKeys(tenantId: string, page = 1, limit = 10): Promise<{ keys: ApiKey[]; total: number }> {
        return this.modelRepository.findApiKeysByTenant(tenantId, page, limit);
    }

    async createApiKey(apiKey: Partial<ApiKey>): Promise<ApiKey> {
        if (!apiKey.gatewayId) {
            throw new ApiError(400, 'API Gateway ID不能为空');
        }

        if (!apiKey.name) {
            throw new ApiError(400, 'API密钥名称不能为空');
        }

        return this.modelRepository.createApiKey(apiKey);
    }

    async deleteApiKey(id: string): Promise<void> {
        await this.getApiKeyById(id);
        return this.modelRepository.deleteApiKey(id);
    }

    async rotateApiKey(id: string): Promise<ApiKey> {
        await this.getApiKeyById(id);
        return this.modelRepository.rotateApiKey(id);
    }

    // 推理调用
    async inference(request: InferenceRequest, tenantId: string, userId?: string): Promise<InferenceResponse> {
        // 获取模型信息
        const model = await this.getModelById(request.modelId);

        // 检查模型是否激活
        if (!model.isActive) {
            throw new ApiError(400, '模型当前不可用');
        }

        // 获取租户模型配置
        const tenantConfig = await this.getTenantModelConfig(tenantId, request.modelId);

        // 如果有租户配置，检查是否启用
        if (tenantConfig && !tenantConfig.isEnabled) {
            throw new ApiError(403, '该租户未开通此模型权限');
        }

        // 合并模型参数与请求参数
        const mergedParameters = {
            ...model.parameters,
            ...(tenantConfig?.customParameters || {}),
            ...(request.parameters || {})
        };

        // 调用外部API
        try {
            const result = await this.callExternalModelAPI(model, request.prompt, mergedParameters);

            // 记录使用量，但不保存推理历史
            // TODO: Create a separate usage tracking system

            return result;
        } catch (error: any) {
            throw new ApiError(500, `模型调用失败: ${error.message}`);
        }
    }

    // 注释掉推理历史相关方法，因为不再支持
    // async getAllInferenceHistory(page = 1, limit = 10): Promise<{ history: InferenceHistory[]; total: number }> {
    //     return this.modelRepository.findAllInferenceHistory(page, limit);
    // }

    // async getTenantInferenceHistory(tenantId: string, page = 1, limit = 10): Promise<{ history: InferenceHistory[]; total: number }> {
    //     return this.modelRepository.findInferenceHistoryByTenant(tenantId, page, limit);
    // }

    // 私有辅助方法
    private validateModelData(model: Partial<Model>): void {
        if (!model.name) {
            throw new ApiError(400, '模型名称不能为空');
        }
        if (!model.provider) {
            throw new ApiError(400, '模型提供商不能为空');
        }
        if (!model.type) {
            throw new ApiError(400, '模型类型不能为空');
        }
        if (!model.contextWindow) {
            throw new ApiError(400, '上下文窗口大小不能为空');
        }
        if (!model.maxOutputTokens) {
            throw new ApiError(400, '最大输出token数不能为空');
        }
        if (!model.baseEndpoint) {
            throw new ApiError(400, '基础端点不能为空');
        }
        if (!model.parameters) {
            throw new ApiError(400, '模型参数不能为空');
        }
        if (!model.pricing) {
            throw new ApiError(400, '模型定价不能为空');
        }
    }

    private async callExternalModelAPI(model: Model, prompt: string, parameters: any): Promise<InferenceResponse> {
        const startTime = Date.now();

        // 构建请求体，根据不同的模型提供商有不同的格式
        let requestBody: any;
        let headers: any = { 'Content-Type': 'application/json' };

        switch (model.provider.toLowerCase()) {
            case 'openai':
                requestBody = {
                    model: model.name,
                    messages: [{ role: 'user', content: prompt }],
                    max_tokens: parameters.maxTokens || model.maxOutputTokens,
                    temperature: parameters.temperature ?? 0.7,
                    top_p: parameters.topP ?? 1,
                    frequency_penalty: parameters.frequencyPenalty ?? 0,
                    presence_penalty: parameters.presencePenalty ?? 0
                };
                headers['Authorization'] = `Bearer ${model.credentials?.apiKey}`;
                break;

            case 'anthropic':
                requestBody = {
                    model: model.name,
                    prompt: `Human: ${prompt}\nAssistant:`,
                    max_tokens_to_sample: parameters.maxTokens || model.maxOutputTokens,
                    temperature: parameters.temperature ?? 0.7,
                    top_p: parameters.topP ?? 1
                };
                headers['x-api-key'] = model.credentials?.apiKey;
                headers['anthropic-version'] = '2023-06-01';
                break;

            default:
                // 通用格式
                requestBody = {
                    prompt: prompt,
                    parameters: parameters
                };
                if (model.credentials?.apiKey) {
                    headers['Authorization'] = `Bearer ${model.credentials.apiKey}`;
                }
        }

        // 发送请求
        const response = await fetch(model.baseEndpoint, {
            method: 'POST',
            headers,
            body: JSON.stringify(requestBody)
        });

        const endTime = Date.now();

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`API调用失败: ${response.status} ${errorText}`);
        }

        const data = await response.json();

        // 处理不同模型的响应格式
        let output: string;
        let promptTokens: number;
        let completionTokens: number;
        let finishReason: string;

        switch (model.provider.toLowerCase()) {
            case 'openai':
                output = data.choices[0].message.content;
                promptTokens = data.usage.prompt_tokens;
                completionTokens = data.usage.completion_tokens;
                finishReason = data.choices[0].finish_reason;
                break;

            case 'anthropic':
                output = data.completion;
                // Anthropic 目前不提供 token 使用量，这里简单估算
                promptTokens = Math.floor(prompt.length / 4);
                completionTokens = Math.floor(output.length / 4);
                finishReason = data.stop_reason;
                break;

            default:
                // 通用格式
                output = data.output || data.response || data.text || JSON.stringify(data);
                promptTokens = data.usage?.promptTokens || Math.floor(prompt.length / 4);
                completionTokens = data.usage?.completionTokens || Math.floor(output.length / 4);
                finishReason = data.finishReason || 'unknown';
        }

        return {
            id: crypto.randomUUID(),
            modelId: model.id,
            output,
            usage: {
                promptTokens,
                completionTokens,
                totalTokens: promptTokens + completionTokens
            },
            metadata: {
                finishReason,
                latencyMs: endTime - startTime,
                model: model.name,
                provider: model.provider
            },
            createdAt: new Date()
        };
    }

}
