import { Router } from 'express';
import { TemplateController } from '../controllers/template.controller';
import { DIContainer } from '../di/container';
import { authMiddleware } from '../middlewares/auth.middleware';

const router = Router();
const templateController = new TemplateController(DIContainer.templateService);

// 应用授权中间件到所有路由
router.use(authMiddleware);

// 模板管理
router.get('/', templateController.getAllTemplates);
router.post('/', templateController.createTemplate);
router.get('/:id', templateController.getTemplateById);
router.put('/:id', templateController.updateTemplate);
router.delete('/:id', templateController.deleteTemplate);
router.get('/tenant/:tenantId', templateController.getTemplatesByTenant);

// 模板区块管理
router.post('/:templateId/sections', templateController.addSection);
router.put('/sections/:sectionId', templateController.updateSection);
router.delete('/sections/:sectionId', templateController.deleteSection);
router.put('/:templateId/sections/order', templateController.updateSectionsOrder);

// 表单元素
router.get('/form-elements', templateController.getAllFormElements);

// 验证规则
router.get('/validation-rules', templateController.getAllValidationRules);
router.post('/validation-rules', templateController.createValidationRule);
router.put('/validation-rules/:id', templateController.updateValidationRule);

// 模板版本管理
router.get('/:templateId/versions', templateController.getTemplateVersions);
router.post('/:templateId/versions', templateController.createTemplateVersion);
router.get('/versions/:versionId', templateController.getTemplateVersion);
router.post('/versions/:versionId/publish', templateController.publishTemplateVersion);

// 模板验证
router.post('/:templateId/validate', templateController.validateTemplateWithData);

export default router;
