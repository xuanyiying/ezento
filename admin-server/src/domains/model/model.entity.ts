/**
 * @swagger
 * components:
 *   schemas:
 *     Model:
 *       type: object
 *       required:
 *         - id
 *         - name
 *         - provider
 *         - type
 *         - version
 *         - contextWindow
 *         - maxOutputTokens
 *         - baseEndpoint
 *         - pricing
 *         - parameters
 *       properties:
 *         id:
 *           type: string
 *           description: 模型唯一标识符
 *         name:
 *           type: string
 *           description: 模型名称
 *         provider:
 *           type: string
 *           description: 模型提供商(如OpenAI, Anthropic等)
 *         type:
 *           type: string
 *           enum: [TEXT, IMAGE, AUDIO, MULTIMODAL]
 *           description: 模型类型
 *         version:
 *           type: string
 *           description: 模型版本
 *         description:
 *           type: string
 *           description: 模型描述
 *         contextWindow:
 *           type: integer
 *           description: 上下文窗口大小(token数)
 *         maxOutputTokens:
 *           type: integer
 *           description: 最大输出token数
 *         isActive:
 *           type: boolean
 *           description: 模型是否激活
 *         baseEndpoint:
 *           type: string
 *           description: 模型API基础端点
 *         credentials:
 *           type: object
 *           description: 模型访问凭证
 *         pricing:
 *           type: object
 *           required:
 *             - inputTokens
 *             - outputTokens
 *             - currency
 *           properties:
 *             inputTokens:
 *               type: number
 *               description: 输入token价格(每1000个token)
 *             outputTokens:
 *               type: number
 *               description: 输出token价格(每1000个token)
 *             currency:
 *               type: string
 *               description: 货币单位
 *         parameters:
 *           $ref: '#/components/schemas/ModelParameters'
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: 创建时间
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: 最后更新时间
 */
export interface Model {
    id: string;
    name: string;
    provider: string;
    type: 'TEXT' | 'IMAGE' | 'AUDIO' | 'MULTIMODAL';
    version: string;
    description?: string;
    contextWindow: number;
    maxOutputTokens: number;
    isActive: boolean;
    baseEndpoint: string;
    credentials?: {
        apiKey?: string;
        orgId?: string;
        [key: string]: any;
    };
    pricing: {
        inputTokens: number;
        outputTokens: number;
        currency: string;
    };
    parameters: ModelParameters;
    createdAt: Date;
    updatedAt: Date;
}

/**
 * @swagger
 * components:
 *   schemas:
 *     ModelParameters:
 *       type: object
 *       properties:
 *         temperature:
 *           type: number
 *           description: 生成文本的随机性参数(0-1)
 *         topP:
 *           type: number
 *           description: 核采样参数(0-1)
 *         topK:
 *           type: number
 *           description: 生成时考虑的top K个token数
 *         frequencyPenalty:
 *           type: number
 *           description: 频率惩罚参数
 *         presencePenalty:
 *           type: number
 *           description: 存在惩罚参数
 *         stopSequences:
 *           type: array
 *           items:
 *             type: string
 *           description: 生成停止的序列数组
 */
export interface ModelParameters {
    temperature?: number;
    topP?: number;
    topK?: number;
    frequencyPenalty?: number;
    presencePenalty?: number;
    stopSequences?: string[];
    [key: string]: any;
}

/**
 * @swagger
 * components:
 *   schemas:
 *     TenantModelConfig:
 *       type: object
 *       required:
 *         - id
 *         - tenantId
 *         - modelId
 *         - isEnabled
 *       properties:
 *         id:
 *           type: string
 *           description: 配置唯一标识符
 *         tenantId:
 *           type: string
 *           description: 租户ID
 *         modelId:
 *           type: string
 *           description: 模型ID
 *         isEnabled:
 *           type: boolean
 *           description: 是否对该租户启用此模型
 *         customParameters:
 *           $ref: '#/components/schemas/ModelParameters'
 *         quotaLimit:
 *           type: object
 *           properties:
 *             daily:
 *               type: number
 *               description: 每日配额限制
 *             monthly:
 *               type: number
 *               description: 每月配额限制
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: 创建时间
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: 最后更新时间
 */
export interface TenantModelConfig {
    id: string;
    tenantId: string;
    modelId: string;
    isEnabled: boolean;
    customParameters?: ModelParameters;
    quotaLimit?: {
        daily?: number;
        monthly?: number;
    };
    createdAt: Date;
    updatedAt: Date;
}
