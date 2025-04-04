/**
 * @swagger
 * components:
 *   schemas:
 *     ApiKey:
 *       type: object
 *       required:
 *         - id
 *         - gatewayId
 *         - name
 *         - key
 *         - status
 *       properties:
 *         id:
 *           type: string
 *           description: API密钥唯一标识符
 *         gatewayId:
 *           type: string
 *           description: API网关ID
 *         name:
 *           type: string
 *           description: API密钥名称
 *         key:
 *           type: string
 *           description: API密钥值
 *         status:
 *           type: string
 *           description: API密钥状态
 *           enum: [ACTIVE, INACTIVE, EXPIRED]
 *         description:
 *           type: string
 *           description: API密钥描述
 *         lastUsedAt:
 *           type: string
 *           format: date-time
 *           description: 最后使用时间
 *         expiresAt:
 *           type: string
 *           format: date-time
 *           description: 过期时间
 *         metadata:
 *           type: object
 *           description: 元数据
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: 创建时间
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: 最后更新时间
 */
export interface ApiKey {
    id: string;
    gatewayId: string;
    name: string;
    key: string;
    status: string; // 'ACTIVE' | 'INACTIVE' | 'EXPIRED'
    description?: string;
    lastUsedAt?: Date;
    expiresAt?: Date;
    metadata?: any;
    createdAt: Date;
    updatedAt: Date;
}

/**
 * @swagger
 * components:
 *   schemas:
 *     InferenceRequest:
 *       type: object
 *       required:
 *         - modelId
 *         - prompt
 *       properties:
 *         modelId:
 *           type: string
 *           description: 模型ID
 *         prompt:
 *           type: string
 *           description: 输入提示文本
 *         parameters:
 *           type: object
 *           description: 推理参数
 *           properties:
 *             temperature:
 *               type: number
 *             maxTokens:
 *               type: number
 *         metadata:
 *           type: object
 *           description: 元数据
 *           properties:
 *             userId:
 *               type: string
 *             sessionId:
 *               type: string
 */
export interface InferenceRequest {
    modelId: string;
    prompt: string;
    parameters?: {
        temperature?: number;
        maxTokens?: number;
        [key: string]: any;
    };
    metadata?: {
        userId?: string;
        sessionId?: string;
        [key: string]: any;
    };
}

/**
 * @swagger
 * components:
 *   schemas:
 *     InferenceResponse:
 *       type: object
 *       required:
 *         - id
 *         - modelId
 *         - output
 *         - usage
 *       properties:
 *         id:
 *           type: string
 *           description: 响应唯一标识符
 *         modelId:
 *           type: string
 *           description: 模型ID
 *         output:
 *           type: string
 *           description: 生成的输出文本
 *         usage:
 *           type: object
 *           required:
 *             - promptTokens
 *             - completionTokens
 *             - totalTokens
 *           properties:
 *             promptTokens:
 *               type: integer
 *               description: 提示使用的token数
 *             completionTokens:
 *               type: integer
 *               description: 完成使用的token数
 *             totalTokens:
 *               type: integer
 *               description: 总token数
 *         metadata:
 *           type: object
 *           properties:
 *             finishReason:
 *               type: string
 *             latencyMs:
 *               type: integer
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: 创建时间
 */
export interface InferenceResponse {
    id: string;
    modelId: string;
    output: string;
    usage: {
        promptTokens: number;
        completionTokens: number;
        totalTokens: number;
    };
    metadata?: {
        finishReason?: string;
        latencyMs?: number;
        [key: string]: any;
    };
    createdAt: Date;
}

export interface InferenceHistory {
    id: string;
    tenantId: string;
    userId?: string;
    modelId: string;
    prompt: string;
    response: string;
    tokensUsed: number;
    cost: number;
    metadata?: any;
    createdAt: Date;
} 