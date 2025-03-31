import { Request, Response, NextFunction } from 'express';
import { ModelService } from '../services/model.service';
import { ApiError } from '../middlewares/errorHandler';

export class ModelController {
    constructor(private modelService: ModelService) { }

    // 模型管理
    /**
     * @swagger
     * /models:
     *   get:
     *     summary: 获取所有模型
     *     description: 分页获取系统中所有可用的AI模型
     *     tags: [Models]
     *     security:
     *       - bearerAuth: []
     *     parameters:
     *       - in: query
     *         name: page
     *         schema:
     *           type: integer
     *           default: 1
     *         description: 页码
     *       - in: query
     *         name: limit
     *         schema:
     *           type: integer
     *           default: 10
     *         description: 每页数量
     *     responses:
     *       200:
     *         description: 成功返回模型列表
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 models:
     *                   type: array
     *                   items:
     *                     $ref: '#/components/schemas/Model'
     *                 total:
     *                   type: integer
     *       500:
     *         description: 服务器错误
     */
    getAllModels = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const page = parseInt(req.query.page as string) || 1;
            const limit = parseInt(req.query.limit as string) || 10;
            const result = await this.modelService.getAllModels(page, limit);
            res.json(result);
        } catch (error) {
            next(error);
        }
    };

    /**
     * @swagger
     * /models/{id}:
     *   get:
     *     summary: 获取模型详情
     *     description: 通过ID获取特定模型的详细信息
     *     tags: [Models]
     *     security:
     *       - bearerAuth: []
     *     parameters:
     *       - in: path
     *         name: id
     *         required: true
     *         schema:
     *           type: string
     *         description: 模型ID
     *     responses:
     *       200:
     *         description: 成功返回模型信息
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/Model'
     *       404:
     *         description: 模型不存在
     *       500:
     *         description: 服务器错误
     */
    getModelById = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { id } = req.params;
            const model = await this.modelService.getModelById(id);
            res.json(model);
        } catch (error) {
            next(error);
        }
    };

    /**
     * @swagger
     * /models:
     *   post:
     *     summary: 创建新模型
     *     description: 添加新的AI模型到系统中
     *     tags: [Models]
     *     security:
     *       - bearerAuth: []
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             required:
     *               - name
     *               - provider
     *               - type
     *               - version
     *               - contextWindow
     *               - maxOutputTokens
     *               - baseEndpoint
     *               - pricing
     *               - parameters
     *             properties:
     *               name:
     *                 type: string
     *               provider:
     *                 type: string
     *               type:
     *                 type: string
     *                 enum: [TEXT, IMAGE, AUDIO, MULTIMODAL]
     *               version:
     *                 type: string
     *               description:
     *                 type: string
     *               contextWindow:
     *                 type: integer
     *               maxOutputTokens:
     *                 type: integer
     *               baseEndpoint:
     *                 type: string
     *               credentials:
     *                 type: object
     *               pricing:
     *                 type: object
     *                 required:
     *                   - inputTokens
     *                   - outputTokens
     *                   - currency
     *                 properties:
     *                   inputTokens:
     *                     type: number
     *                   outputTokens:
     *                     type: number
     *                   currency:
     *                     type: string
     *               parameters:
     *                 $ref: '#/components/schemas/ModelParameters'
     *     responses:
     *       201:
     *         description: 成功创建模型
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/Model'
     *       400:
     *         description: 参数错误
     *       500:
     *         description: 服务器错误
     */
    createModel = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const model = await this.modelService.createModel(req.body);
            res.status(201).json(model);
        } catch (error) {
            next(error);
        }
    };

    /**
     * @swagger
     * /models/{id}:
     *   put:
     *     summary: 更新模型
     *     description: 更新特定模型的信息
     *     tags: [Models]
     *     security:
     *       - bearerAuth: []
     *     parameters:
     *       - in: path
     *         name: id
     *         required: true
     *         schema:
     *           type: string
     *         description: 模型ID
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             properties:
     *               name:
     *                 type: string
     *               provider:
     *                 type: string
     *               type:
     *                 type: string
     *                 enum: [TEXT, IMAGE, AUDIO, MULTIMODAL]
     *               version:
     *                 type: string
     *               description:
     *                 type: string
     *               contextWindow:
     *                 type: integer
     *               maxOutputTokens:
     *                 type: integer
     *               baseEndpoint:
     *                 type: string
     *               credentials:
     *                 type: object
     *               pricing:
     *                 type: object
     *               parameters:
     *                 $ref: '#/components/schemas/ModelParameters'
     *     responses:
     *       200:
     *         description: 成功更新模型
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/Model'
     *       400:
     *         description: 参数错误
     *       404:
     *         description: 模型不存在
     *       500:
     *         description: 服务器错误
     */
    updateModel = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { id } = req.params;
            const model = await this.modelService.updateModel(id, req.body);
            res.json(model);
        } catch (error) {
            next(error);
        }
    };

    /**
     * @swagger
     * /models/{id}:
     *   delete:
     *     summary: 删除模型
     *     description: 从系统中删除特定模型
     *     tags: [Models]
     *     security:
     *       - bearerAuth: []
     *     parameters:
     *       - in: path
     *         name: id
     *         required: true
     *         schema:
     *           type: string
     *         description: 模型ID
     *     responses:
     *       204:
     *         description: 成功删除模型
     *       404:
     *         description: 模型不存在
     *       500:
     *         description: 服务器错误
     */
    deleteModel = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { id } = req.params;
            await this.modelService.deleteModel(id);
            res.status(204).send();
        } catch (error) {
            next(error);
        }
    };

    /**
     * @swagger
     * /models/{id}/status:
     *   patch:
     *     summary: 切换模型状态
     *     description: 启用或禁用特定模型
     *     tags: [Models]
     *     security:
     *       - bearerAuth: []
     *     parameters:
     *       - in: path
     *         name: id
     *         required: true
     *         schema:
     *           type: string
     *         description: 模型ID
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             required:
     *               - isActive
     *             properties:
     *               isActive:
     *                 type: boolean
     *                 description: 是否启用模型
     *     responses:
     *       200:
     *         description: 成功更新模型状态
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/Model'
     *       400:
     *         description: 参数错误
     *       404:
     *         description: 模型不存在
     *       500:
     *         description: 服务器错误
     */
    toggleModelStatus = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { id } = req.params;
            const { isActive } = req.body;

            if (typeof isActive !== 'boolean') {
                throw new ApiError(400, '状态必须是布尔值');
            }

            const model = await this.modelService.toggleModelStatus(id, isActive);
            res.json(model);
        } catch (error) {
            next(error);
        }
    };

    // 模型参数
    /**
     * @swagger
     * /models/{id}/parameters:
     *   put:
     *     summary: 更新模型参数
     *     description: 更新特定模型的默认参数配置
     *     tags: [Models]
     *     security:
     *       - bearerAuth: []
     *     parameters:
     *       - in: path
     *         name: id
     *         required: true
     *         schema:
     *           type: string
     *         description: 模型ID
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             $ref: '#/components/schemas/ModelParameters'
     *     responses:
     *       200:
     *         description: 成功更新模型参数
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/Model'
     *       400:
     *         description: 参数错误
     *       404:
     *         description: 模型不存在
     *       500:
     *         description: 服务器错误
     */
    updateModelParameters = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { id } = req.params;
            const model = await this.modelService.updateModelParameters(id, req.body);
            res.json(model);
        } catch (error) {
            next(error);
        }
    };

    // 租户模型配置
    /**
     * @swagger
     * /tenant/{tenantId}/models:
     *   get:
     *     summary: 获取租户可用模型
     *     description: 分页获取特定租户可用的模型配置
     *     tags: [Models]
     *     security:
     *       - bearerAuth: []
     *     parameters:
     *       - in: path
     *         name: tenantId
     *         required: true
     *         schema:
     *           type: string
     *         description: 租户ID
     *       - in: query
     *         name: page
     *         schema:
     *           type: integer
     *           default: 1
     *         description: 页码
     *       - in: query
     *         name: limit
     *         schema:
     *           type: integer
     *           default: 10
     *         description: 每页数量
     *     responses:
     *       200:
     *         description: 成功返回租户模型配置
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 configs:
     *                   type: array
     *                   items:
     *                     $ref: '#/components/schemas/TenantModelConfig'
     *                 total:
     *                   type: integer
     *       404:
     *         description: 租户不存在
     *       500:
     *         description: 服务器错误
     */
    getTenantModels = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { tenantId } = req.params;
            const page = parseInt(req.query.page as string) || 1;
            const limit = parseInt(req.query.limit as string) || 10;
            const configs = await this.modelService.getTenantModels(tenantId, page, limit);
            res.json(configs);
        } catch (error) {
            next(error);
        }
    };

    /**
     * @swagger
     * /tenant/{tenantId}/model/{modelId}:
     *   get:
     *     summary: 获取租户特定模型配置
     *     description: 获取特定租户对特定模型的配置详情
     *     tags: [Models]
     *     security:
     *       - bearerAuth: []
     *     parameters:
     *       - in: path
     *         name: tenantId
     *         required: true
     *         schema:
     *           type: string
     *         description: 租户ID
     *       - in: path
     *         name: modelId
     *         required: true
     *         schema:
     *           type: string
     *         description: 模型ID
     *     responses:
     *       200:
     *         description: 成功返回租户模型配置
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/TenantModelConfig'
     *       404:
     *         description: 配置不存在
     *       500:
     *         description: 服务器错误
     */
    getTenantModelConfig = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { tenantId, modelId } = req.params;
            const config = await this.modelService.getTenantModelConfig(tenantId, modelId);

            if (!config) {
                res.status(404).json({ message: '未找到租户模型配置' });
                return;
            }

            res.json(config);
        } catch (error) {
            next(error);
        }
    };

    /**
     * @swagger
     * /tenant/{tenantId}/model/{modelId}:
     *   put:
     *     summary: 配置租户模型
     *     description: 为特定租户配置特定模型的使用参数
     *     tags: [Models]
     *     security:
     *       - bearerAuth: []
     *     parameters:
     *       - in: path
     *         name: tenantId
     *         required: true
     *         schema:
     *           type: string
     *         description: 租户ID
     *       - in: path
     *         name: modelId
     *         required: true
     *         schema:
     *           type: string
     *         description: 模型ID
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             properties:
     *               isEnabled:
     *                 type: boolean
     *                 description: 是否启用此模型
     *               customParameters:
     *                 $ref: '#/components/schemas/ModelParameters'
     *               quotaLimit:
     *                 type: object
     *                 properties:
     *                   daily:
     *                     type: integer
     *                     description: 每日使用限额
     *                   monthly:
     *                     type: integer
     *                     description: 每月使用限额
     *     responses:
     *       200:
     *         description: 成功更新配置
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/TenantModelConfig'
     *       400:
     *         description: 参数错误
     *       404:
     *         description: 租户或模型不存在
     *       500:
     *         description: 服务器错误
     */
    configureTenantModel = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { tenantId, modelId } = req.params;
            const config = await this.modelService.configureTenantModel(tenantId, modelId, req.body);
            res.json(config);
        } catch (error) {
            next(error);
        }
    };

    // API密钥管理
    /**
     * @swagger
     * /models/api-keys:
     *   get:
     *     summary: 获取所有API密钥
     *     description: 分页获取系统中所有API密钥
     *     tags: [API Keys]
     *     security:
     *       - bearerAuth: []
     *     parameters:
     *       - in: query
     *         name: page
     *         schema:
     *           type: integer
     *           default: 1
     *         description: 页码
     *       - in: query
     *         name: limit
     *         schema:
     *           type: integer
     *           default: 10
     *         description: 每页数量
     *     responses:
     *       200:
     *         description: 成功返回API密钥列表
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 keys:
     *                   type: array
     *                   items:
     *                     $ref: '#/components/schemas/ApiKey'
     *                 total:
     *                   type: integer
     *       500:
     *         description: 服务器错误
     */
    getAllApiKeys = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const page = parseInt(req.query.page as string) || 1;
            const limit = parseInt(req.query.limit as string) || 10;
            const result = await this.modelService.getAllApiKeys(page, limit);
            res.json(result);
        } catch (error) {
            next(error);
        }
    };

    /**
     * @swagger
     * /models/api-keys/{id}:
     *   get:
     *     summary: 获取API密钥详情
     *     description: 通过ID获取特定API密钥详情
     *     tags: [API Keys]
     *     security:
     *       - bearerAuth: []
     *     parameters:
     *       - in: path
     *         name: id
     *         required: true
     *         schema:
     *           type: string
     *         description: API密钥ID
     *     responses:
     *       200:
     *         description: 成功返回API密钥详情
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/ApiKey'
     *       404:
     *         description: API密钥不存在
     *       500:
     *         description: 服务器错误
     */
    getApiKeyById = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { id } = req.params;
            const apiKey = await this.modelService.getApiKeyById(id);
            res.json(apiKey);
        } catch (error) {
            next(error);
        }
    };

    /**
     * @swagger
     * /tenant/{tenantId}/api-keys:
     *   get:
     *     summary: 获取租户API密钥
     *     description: 获取特定租户的所有API密钥
     *     tags: [API Keys]
     *     security:
     *       - bearerAuth: []
     *     parameters:
     *       - in: path
     *         name: tenantId
     *         required: true
     *         schema:
     *           type: string
     *         description: 租户ID
     *       - in: query
     *         name: page
     *         schema:
     *           type: integer
     *           default: 1
     *         description: 页码
     *       - in: query
     *         name: limit
     *         schema:
     *           type: integer
     *           default: 10
     *         description: 每页数量
     *     responses:
     *       200:
     *         description: 成功返回API密钥列表
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 keys:
     *                   type: array
     *                   items:
     *                     $ref: '#/components/schemas/ApiKey'
     *                 total:
     *                   type: integer
     *       404:
     *         description: 租户不存在
     *       500:
     *         description: 服务器错误
     */
    getTenantApiKeys = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { tenantId } = req.params;
            const page = parseInt(req.query.page as string) || 1;
            const limit = parseInt(req.query.limit as string) || 10;
            const result = await this.modelService.getTenantApiKeys(tenantId, page, limit);
            res.json(result);
        } catch (error) {
            next(error);
        }
    };

    /**
     * @swagger
     * /models/api-keys:
     *   post:
     *     summary: 创建API密钥
     *     description: 创建新的API密钥
     *     tags: [API Keys]
     *     security:
     *       - bearerAuth: []
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             required:
     *               - gatewayId
     *               - name
     *             properties:
     *               gatewayId:
     *                 type: string
     *                 description: API网关ID
     *               name:
     *                 type: string
     *                 description: API密钥名称
     *               description:
     *                 type: string
     *                 description: API密钥描述
     *               expiresAt:
     *                 type: string
     *                 format: date-time
     *                 description: 过期时间
     *               status:
     *                 type: string
     *                 enum: [ACTIVE, INACTIVE]
     *                 description: 初始状态
     *     responses:
     *       201:
     *         description: 成功创建API密钥
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/ApiKey'
     *       400:
     *         description: 参数错误
     *       500:
     *         description: 服务器错误
     */
    createApiKey = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const apiKey = await this.modelService.createApiKey(req.body);
            res.status(201).json(apiKey);
        } catch (error) {
            next(error);
        }
    };

    /**
     * @swagger
     * /models/api-keys/{id}:
     *   delete:
     *     summary: 删除API密钥
     *     description: 删除特定API密钥
     *     tags: [API Keys]
     *     security:
     *       - bearerAuth: []
     *     parameters:
     *       - in: path
     *         name: id
     *         required: true
     *         schema:
     *           type: string
     *         description: API密钥ID
     *     responses:
     *       204:
     *         description: 成功删除API密钥
     *       404:
     *         description: API密钥不存在
     *       500:
     *         description: 服务器错误
     */
    deleteApiKey = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { id } = req.params;
            await this.modelService.deleteApiKey(id);
            res.status(204).send();
        } catch (error) {
            next(error);
        }
    };

    /**
     * @swagger
     * /models/api-keys/{id}/rotate:
     *   post:
     *     summary: 轮换API密钥
     *     description: 为特定API密钥生成新的密钥值
     *     tags: [API Keys]
     *     security:
     *       - bearerAuth: []
     *     parameters:
     *       - in: path
     *         name: id
     *         required: true
     *         schema:
     *           type: string
     *         description: API密钥ID
     *     responses:
     *       200:
     *         description: 成功轮换API密钥
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/ApiKey'
     *       404:
     *         description: API密钥不存在
     *       500:
     *         description: 服务器错误
     */
    rotateApiKey = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { id } = req.params;
            const apiKey = await this.modelService.rotateApiKey(id);
            res.json(apiKey);
        } catch (error) {
            next(error);
        }
    };

    // 推理调用
    /**
     * @swagger
     * /tenant/{tenantId}/inference:
     *   post:
     *     summary: 模型推理
     *     description: 进行模型推理调用
     *     tags: [Models]
     *     security:
     *       - bearerAuth: []
     *     parameters:
     *       - in: path
     *         name: tenantId
     *         required: true
     *         schema:
     *           type: string
     *         description: 租户ID
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             $ref: '#/components/schemas/InferenceRequest'
     *     responses:
     *       200:
     *         description: 成功返回推理结果
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/InferenceResponse'
     *       400:
     *         description: 参数错误
     *       403:
     *         description: 授权错误或配额超限
     *       404:
     *         description: 模型不存在
     *       500:
     *         description: 服务器错误
     */
    inference = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { tenantId } = req.params;
            const userId = req.body.userId || (req as any).user?.id;
            const inferenceRequest = req.body;
            const result = await this.modelService.inference(inferenceRequest, tenantId, userId);
            res.json(result);
        } catch (error) {
            next(error);
        }
    };

    // 推理历史方法已移除，因为不再支持相关功能
} 