import { PrismaClient } from '@prisma/client';
import { IModelRepository } from '../model.repository';
import { Model, ModelParameters, TenantModelConfig } from '../../domains/model/model.entity';
import { ApiKey } from '../../domains/model/api-key.entity';
import crypto from 'crypto';

export class PrismaModelRepository implements IModelRepository {
    constructor(private prisma: PrismaClient) { }

    // 模型管理
    async findAllModels(page: number, limit: number): Promise<{ models: Model[]; total: number }> {
        const models = await this.prisma.model.findMany({
            orderBy: { name: 'asc' },
            skip: (page - 1) * limit,
            take: limit
        });
        const total = await this.prisma.model.count();
        return {
            models: models.map((model: any) => this.mapModelToEntity(model)),
            total
        };
    }

    async findModelById(id: string): Promise<Model | null> {
        const model = await this.prisma.model.findUnique({
            where: { id }
        });
        return model ? this.mapModelToEntity(model) : null;
    }

    async createModel(model: Partial<Model>): Promise<Model> {
        const newModel = await this.prisma.model.create({
            data: {
                name: model.name!,
                provider: model.provider!,
                type: model.type!,
                version: model.version!,
                description: model.description,
                contextWindow: model.contextWindow!,
                maxOutputTokens: model.maxOutputTokens!,
                isActive: model.isActive ?? true,
                baseEndpoint: model.baseEndpoint!,
                credentials: model.credentials,
                pricing: model.pricing!,
                parameters: model.parameters!
            }
        });
        return this.mapModelToEntity(newModel);
    }

    async updateModel(id: string, model: Partial<Model>): Promise<Model> {
        const updatedModel = await this.prisma.model.update({
            where: { id },
            data: {
                name: model.name,
                provider: model.provider,
                type: model.type,
                version: model.version,
                description: model.description,
                contextWindow: model.contextWindow,
                maxOutputTokens: model.maxOutputTokens,
                isActive: model.isActive,
                baseEndpoint: model.baseEndpoint,
                credentials: model.credentials,
                pricing: model.pricing,
                parameters: model.parameters
            }
        });
        return this.mapModelToEntity(updatedModel);
    }

    async deleteModel(id: string): Promise<void> {
        await this.prisma.model.delete({
            where: { id }
        });
    }

    async toggleModelStatus(id: string, isActive: boolean): Promise<Model> {
        const updatedModel = await this.prisma.model.update({
            where: { id },
            data: { isActive }
        });
        return this.mapModelToEntity(updatedModel);
    }

    // 模型参数
    async updateModelParameters(id: string, parameters: ModelParameters): Promise<Model> {
        const updatedModel = await this.prisma.model.update({
            where: { id },
            data: { parameters }
        });
        return this.mapModelToEntity(updatedModel);
    }

    // 租户模型配置
    async findTenantModels(tenantId: string, page: number, limit: number): Promise<{ configs: TenantModelConfig[]; total: number }> {
        const [configs, total] = await Promise.all([
            this.prisma.tenantModelConfig.findMany({
                where: { tenantId },
                skip: (page - 1) * limit,
                take: limit
            }),
            this.prisma.tenantModelConfig.count({ where: { tenantId } })
        ]);
        return {
            configs: configs.map((config: any) => this.mapTenantModelConfigToEntity(config)),
            total
        };
    }

    async findTenantModelConfig(tenantId: string, modelId: string): Promise<TenantModelConfig | null> {
        const config = await this.prisma.tenantModelConfig.findFirst({
            where: { tenantId, modelId }
        });
        return config ? this.mapTenantModelConfigToEntity(config) : null;
    }

    async createTenantModelConfig(config: Partial<TenantModelConfig>): Promise<TenantModelConfig> {
        const newConfig = await this.prisma.tenantModelConfig.create({
            data: {
                tenantId: config.tenantId!,
                modelId: config.modelId!,
                isEnabled: config.isEnabled ?? true,
                customParameters: config.customParameters,
                quotaLimit: config.quotaLimit
            }
        });
        return this.mapTenantModelConfigToEntity(newConfig);
    }

    async updateTenantModelConfig(tenantId: string, modelId: string, config: Partial<TenantModelConfig>): Promise<TenantModelConfig> {
        const existingConfig = await this.prisma.tenantModelConfig.findFirst({
            where: { tenantId, modelId }
        });

        if (!existingConfig) {
            throw new Error('租户模型配置不存在');
        }

        const updatedConfig = await this.prisma.tenantModelConfig.update({
            where: { id: existingConfig.id },
            data: {
                isEnabled: config.isEnabled,
                customParameters: config.customParameters,
                quotaLimit: config.quotaLimit
            }
        });
        return this.mapTenantModelConfigToEntity(updatedConfig);
    }

    // API密钥管理
    async findAllApiKeys(page: number, limit: number): Promise<{ keys: ApiKey[]; total: number }> {
        const apiKeys = await this.prisma.apiKey.findMany({
            orderBy: { createdAt: 'desc' },
            skip: (page - 1) * limit,
            take: limit
        });
        const total = await this.prisma.apiKey.count();
        return {
            keys: apiKeys.map((key: any) => this.mapApiKeyToEntity(key)),
            total
        };
    }

    async findApiKeyById(id: string): Promise<ApiKey | null> {
        const apiKey = await this.prisma.apiKey.findUnique({
            where: { id }
        });
        return apiKey ? this.mapApiKeyToEntity(apiKey) : null;
    }

    async findApiKeysByTenant(tenantId: string, page: number, limit: number): Promise<{ keys: ApiKey[]; total: number }> {
        // We need to find the gateway IDs for the tenant first
        const apiGateways = await this.prisma.apiGateway.findMany({
            where: { tenantId },
            select: { id: true }
        });

        const gatewayIds = apiGateways.map(gateway => gateway.id);

        const apiKeys = await this.prisma.apiKey.findMany({
            where: { gatewayId: { in: gatewayIds } },
            orderBy: { createdAt: 'desc' },
            skip: (page - 1) * limit,
            take: limit
        });

        const total = await this.prisma.apiKey.count({
            where: { gatewayId: { in: gatewayIds } }
        });

        return {
            keys: apiKeys.map((key: any) => this.mapApiKeyToEntity(key)),
            total
        };
    }

    async createApiKey(apiKey: Partial<ApiKey>): Promise<ApiKey> {
        // Generate random API key
        const key = `sk-${crypto.randomBytes(24).toString('hex')}`;

        const newApiKey = await this.prisma.apiKey.create({
            data: {
                gatewayId: apiKey.gatewayId!,
                name: apiKey.name!,
                key,
                status: (apiKey.status as any) || 'ACTIVE',
                expiresAt: apiKey.expiresAt,
                description: apiKey.description,
                metadata: apiKey.metadata
            }
        });
        return this.mapApiKeyToEntity(newApiKey);
    }

    async deleteApiKey(id: string): Promise<void> {
        await this.prisma.apiKey.delete({
            where: { id }
        });
    }

    async rotateApiKey(id: string): Promise<ApiKey> {
        // 生成新的API密钥
        const key = `sk-${crypto.randomBytes(24).toString('hex')}`;

        const updatedApiKey = await this.prisma.apiKey.update({
            where: { id },
            data: { key }
        });
        return this.mapApiKeyToEntity(updatedApiKey);
    }

    // 映射方法
    private mapModelToEntity(model: any): Model {
        return {
            id: model.id,
            name: model.name,
            provider: model.provider,
            type: model.type,
            version: model.version,
            description: model.description,
            contextWindow: model.contextWindow,
            maxOutputTokens: model.maxOutputTokens,
            isActive: model.isActive,
            baseEndpoint: model.baseEndpoint,
            credentials: model.credentials,
            pricing: model.pricing,
            parameters: model.parameters,
            createdAt: model.createdAt,
            updatedAt: model.updatedAt
        };
    }

    private mapTenantModelConfigToEntity(config: any): TenantModelConfig {
        return {
            id: config.id,
            tenantId: config.tenantId,
            modelId: config.modelId,
            isEnabled: config.isEnabled,
            customParameters: config.customParameters,
            quotaLimit: config.quotaLimit,
            createdAt: config.createdAt,
            updatedAt: config.updatedAt
        };
    }

    private mapApiKeyToEntity(apiKey: any): ApiKey {
        return {
            id: apiKey.id,
            gatewayId: apiKey.gatewayId,
            name: apiKey.name,
            key: apiKey.key,
            status: apiKey.status,
            description: apiKey.description,
            lastUsedAt: apiKey.lastUsedAt,
            expiresAt: apiKey.expiresAt,
            metadata: apiKey.metadata,
            createdAt: apiKey.createdAt,
            updatedAt: apiKey.updatedAt
        };
    }
} 