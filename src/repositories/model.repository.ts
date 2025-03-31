import { Model, ModelParameters, TenantModelConfig } from '../domains/model/model.entity';
import { ApiKey } from '../domains/model/api-key.entity';
import { PrismaClient } from '@prisma/client';

export interface IModelRepository {
    // 模型管理
    findAllModels(page: number, limit: number): Promise<{ models: Model[]; total: number }>;
    findModelById(id: string): Promise<Model | null>;
    createModel(model: Partial<Model>): Promise<Model>;
    updateModel(id: string, model: Partial<Model>): Promise<Model>;
    deleteModel(id: string): Promise<void>;
    toggleModelStatus(id: string, isActive: boolean): Promise<Model>;

    // 模型参数
    updateModelParameters(id: string, parameters: ModelParameters): Promise<Model>;

    // 租户模型配置
    findTenantModels(tenantId: string, page: number, limit: number): Promise<{ configs: TenantModelConfig[]; total: number }>;
    findTenantModelConfig(tenantId: string, modelId: string): Promise<TenantModelConfig | null>;
    createTenantModelConfig(config: Partial<TenantModelConfig>): Promise<TenantModelConfig>;
    updateTenantModelConfig(tenantId: string, modelId: string, config: Partial<TenantModelConfig>): Promise<TenantModelConfig>;

    // API密钥管理
    findAllApiKeys(page: number, limit: number): Promise<{ keys: ApiKey[]; total: number }>;
    findApiKeyById(id: string): Promise<ApiKey | null>;
    findApiKeysByTenant(tenantId: string, page: number, limit: number): Promise<{ keys: ApiKey[]; total: number }>;
    createApiKey(apiKey: Partial<ApiKey>): Promise<ApiKey>;
    deleteApiKey(id: string): Promise<void>;
    rotateApiKey(id: string): Promise<ApiKey>;
} 