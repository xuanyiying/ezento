import { Request, Response, NextFunction } from 'express';
import { TemplateService } from '../services/template.service';
import { ApiError } from '../middlewares/errorHandler';

export class TemplateController {
    constructor(private templateService: TemplateService) {}

    // 模板管理
    /**
     * @swagger
     * /templates:
     *   get:
     *     summary: 获取所有模板
     *     description: 分页获取系统中的所有模板
     *     tags: [Templates]
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
     *         description: 成功返回模板列表
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 templates:
     *                   type: array
     *                   items:
     *                     $ref: '#/components/schemas/Template'
     *                 total:
     *                   type: integer
     *       500:
     *         description: 服务器错误
     */
    getAllTemplates = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const page = parseInt(req.query.page as string) || 1;
            const limit = parseInt(req.query.limit as string) || 10;
            const result = await this.templateService.getAllTemplates(page, limit);
            res.json(result);
        } catch (error) {
            next(error);
        }
    };

    /**
     * @swagger
     * /templates/{id}:
     *   get:
     *     summary: 获取模板详情
     *     description: 通过ID获取特定模板的详细信息
     *     tags: [Templates]
     *     security:
     *       - bearerAuth: []
     *     parameters:
     *       - in: path
     *         name: id
     *         required: true
     *         schema:
     *           type: string
     *         description: 模板ID
     *     responses:
     *       200:
     *         description: 成功返回模板信息
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/Template'
     *       404:
     *         description: 模板不存在
     *       500:
     *         description: 服务器错误
     */
    getTemplateById = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { id } = req.params;
            const template = await this.templateService.getTemplateById(id);
            res.json(template);
        } catch (error) {
            next(error);
        }
    };

    /**
     * @swagger
     * /tenant/{tenantId}/templates:
     *   get:
     *     summary: 获取租户的模板
     *     description: 获取特定租户可用的模板列表
     *     tags: [Templates]
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
     *         description: 成功返回模板列表
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 templates:
     *                   type: array
     *                   items:
     *                     $ref: '#/components/schemas/Template'
     *                 total:
     *                   type: integer
     *       404:
     *         description: 租户不存在
     *       500:
     *         description: 服务器错误
     */
    getTemplatesByTenant = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { tenantId } = req.params;
            const page = parseInt(req.query.page as string) || 1;
            const limit = parseInt(req.query.limit as string) || 10;
            const result = await this.templateService.getTenantTemplates(tenantId, page, limit);
            res.json(result);
        } catch (error) {
            next(error);
        }
    };

    /**
     * @swagger
     * /templates:
     *   post:
     *     summary: 创建模板
     *     description: 创建新的模板
     *     tags: [Templates]
     *     security:
     *       - bearerAuth: []
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             $ref: '#/components/schemas/Template'
     *     responses:
     *       201:
     *         description: 成功创建模板
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/Template'
     *       400:
     *         description: 无效的请求数据
     *       500:
     *         description: 服务器错误
     */
    createTemplate = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const template = await this.templateService.createTemplate(req.body);
            res.status(201).json(template);
        } catch (error) {
            next(error);
        }
    };

    /**
     * @swagger
     * /templates/{id}:
     *   put:
     *     summary: 更新模板
     *     description: 更新现有模板的信息
     *     tags: [Templates]
     *     security:
     *       - bearerAuth: []
     *     parameters:
     *       - in: path
     *         name: id
     *         required: true
     *         schema:
     *           type: string
     *         description: 模板ID
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             $ref: '#/components/schemas/Template'
     *     responses:
     *       200:
     *         description: 成功更新模板
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/Template'
     *       400:
     *         description: 无效的请求数据
     *       404:
     *         description: 模板不存在
     *       500:
     *         description: 服务器错误
     */
    updateTemplate = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { id } = req.params;
            const template = await this.templateService.updateTemplate(id, req.body);
            res.json(template);
        } catch (error) {
            next(error);
        }
    };

    deleteTemplate = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { id } = req.params;
            await this.templateService.deleteTemplate(id);
            res.status(204).send();
        } catch (error) {
            next(error);
        }
    };

    // 模板区块管理
    addSection = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { templateId } = req.params;
            const section = await this.templateService.addTemplateSection(templateId, req.body);
            res.status(201).json(section);
        } catch (error) {
            next(error);
        }
    };

    updateSection = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { templateId, sectionId } = req.params;
            const section = await this.templateService.updateTemplateSection(
                templateId,
                sectionId,
                req.body
            );
            res.json(section);
        } catch (error) {
            next(error);
        }
    };

    deleteSection = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { templateId, sectionId } = req.params;
            await this.templateService.deleteTemplateSection(templateId, sectionId);
            res.status(204).send();
        } catch (error) {
            next(error);
        }
    };

    updateSectionsOrder = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { templateId } = req.params;
            const { sectionIds } = req.body;

            if (!Array.isArray(sectionIds)) {
                throw new ApiError(400, '区块ID必须是数组');
            }

            await this.templateService.updateSectionOrder(templateId, sectionIds);
            res.status(204).send();
        } catch (error) {
            next(error);
        }
    };

    // 表单元素
    /**
     * @swagger
     * /templates/form-elements:
     *   get:
     *     summary: 获取所有表单元素
     *     description: 获取系统支持的所有表单元素类型
     *     tags: [Templates]
     *     security:
     *       - bearerAuth: []
     *     responses:
     *       200:
     *         description: 成功返回表单元素列表
     *         content:
     *           application/json:
     *             schema:
     *               type: array
     *               items:
     *                 $ref: '#/components/schemas/FormElement'
     *       500:
     *         description: 服务器错误
     */
    getAllFormElements = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const elements = await this.templateService.getAllFormElements();
            res.json(elements);
        } catch (error) {
            next(error);
        }
    };

    // 验证规则
    /**
     * @swagger
     * /templates/validation-rules:
     *   get:
     *     summary: 获取所有验证规则
     *     description: 获取系统支持的所有表单验证规则
     *     tags: [Templates]
     *     security:
     *       - bearerAuth: []
     *     responses:
     *       200:
     *         description: 成功返回验证规则列表
     *         content:
     *           application/json:
     *             schema:
     *               type: array
     *               items:
     *                 $ref: '#/components/schemas/ValidationRule'
     *       500:
     *         description: 服务器错误
     */
    getAllValidationRules = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const rules = await this.templateService.getAllValidationRules();
            res.json(rules);
        } catch (error) {
            next(error);
        }
    };

    /**
     * @swagger
     * /templates/validation-rules:
     *   post:
     *     summary: 创建验证规则
     *     description: 创建新的表单验证规则
     *     tags: [Templates]
     *     security:
     *       - bearerAuth: []
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             $ref: '#/components/schemas/ValidationRule'
     *     responses:
     *       201:
     *         description: 成功创建验证规则
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/ValidationRule'
     *       400:
     *         description: 无效的请求数据
     *       500:
     *         description: 服务器错误
     */
    createValidationRule = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const rule = await this.templateService.createValidationRule(req.body);
            res.status(201).json(rule);
        } catch (error) {
            next(error);
        }
    };

    /**
     * @swagger
     * /templates/validation-rules/{id}:
     *   put:
     *     summary: 更新验证规则
     *     description: 更新现有的表单验证规则
     *     tags: [Templates]
     *     security:
     *       - bearerAuth: []
     *     parameters:
     *       - in: path
     *         name: id
     *         required: true
     *         schema:
     *           type: string
     *         description: 验证规则ID
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             $ref: '#/components/schemas/ValidationRule'
     *     responses:
     *       200:
     *         description: 成功更新验证规则
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/ValidationRule'
     *       400:
     *         description: 无效的请求数据
     *       404:
     *         description: 验证规则不存在
     *       500:
     *         description: 服务器错误
     */
    updateValidationRule = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { id } = req.params;
            const rule = await this.templateService.updateValidationRule(id, req.body);
            res.json(rule);
        } catch (error) {
            next(error);
        }
    };

    // 模板版本管理
    /**
     * @swagger
     * /templates/{templateId}/versions:
     *   get:
     *     summary: 获取模板版本
     *     description: 获取特定模板的所有版本历史
     *     tags: [Templates]
     *     security:
     *       - bearerAuth: []
     *     parameters:
     *       - in: path
     *         name: templateId
     *         required: true
     *         schema:
     *           type: string
     *         description: 模板ID
     *     responses:
     *       200:
     *         description: 成功返回模板版本列表
     *         content:
     *           application/json:
     *             schema:
     *               type: array
     *               items:
     *                 type: object
     *                 properties:
     *                   id:
     *                     type: string
     *                   version:
     *                     type: string
     *                   content:
     *                     $ref: '#/components/schemas/Template'
     *                   createdAt:
     *                     type: string
     *                     format: date-time
     *       404:
     *         description: 模板不存在
     *       500:
     *         description: 服务器错误
     */
    getTemplateVersions = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { templateId } = req.params;
            const versions = await this.templateService.getTemplateVersions(templateId);
            res.json(versions);
        } catch (error) {
            next(error);
        }
    };

    /**
     * @swagger
     * /templates/{templateId}/versions:
     *   post:
     *     summary: 创建模板版本
     *     description: 为特定模板创建新版本
     *     tags: [Templates]
     *     security:
     *       - bearerAuth: []
     *     parameters:
     *       - in: path
     *         name: templateId
     *         required: true
     *         schema:
     *           type: string
     *         description: 模板ID
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             properties:
     *               version:
     *                 type: string
     *               content:
     *                 $ref: '#/components/schemas/Template'
     *     responses:
     *       201:
     *         description: 成功创建模板版本
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 id:
     *                   type: string
     *                 version:
     *                   type: string
     *                 content:
     *                   $ref: '#/components/schemas/Template'
     *                 createdAt:
     *                   type: string
     *                   format: date-time
     *       400:
     *         description: 无效的请求数据
     *       404:
     *         description: 模板不存在
     *       500:
     *         description: 服务器错误
     */
    createTemplateVersion = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { templateId } = req.params;
            const version = await this.templateService.createTemplateVersion(templateId, req.body);
            res.status(201).json(version);
        } catch (error) {
            next(error);
        }
    };

    getTemplateVersion = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { templateId, version } = req.params;
            const templateVersion = await this.templateService.getTemplateVersion(
                templateId,
                version
            );
            res.json(templateVersion);
        } catch (error) {
            next(error);
        }
    };

    publishTemplateVersion = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { templateId, version } = req.params;
            await this.templateService.publishTemplateVersion(templateId, version);
            res.status(204).send();
        } catch (error) {
            next(error);
        }
    };

    // 模板验证
    validateTemplateWithData = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { templateId } = req.params;
            const { data } = req.body;

            if (!data) {
                throw new ApiError(400, '数据不能为空');
            }

            const result = await this.templateService.validateTemplateData(templateId, data);
            res.json(result);
        } catch (error) {
            next(error);
        }
    };
}
