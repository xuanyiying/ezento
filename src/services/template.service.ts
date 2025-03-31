import { ITemplateRepository } from '../repositories/template.repository';
import {
    Template,
    TemplateSection,
    FormElement,
    ValidationRule,
    TemplateVersion
} from '../domains/template/template.entity';
import { ApiError } from '../middlewares/errorHandler';

export class TemplateService {
    constructor(private templateRepository: ITemplateRepository) { }

    // 模板管理
    async getAllTemplates(page = 1, limit = 10): Promise<{ templates: Template[]; total: number }> {
        return this.templateRepository.findAllTemplates(page, limit);
    }

    async getTemplateById(id: string): Promise<Template> {
        const template = await this.templateRepository.findTemplateById(id);
        if (!template) {
            throw new ApiError(404, '模板不存在');
        }
        return template;
    }

    async getTenantTemplates(tenantId: string, page = 1, limit = 10): Promise<{ templates: Template[]; total: number }> {
        return this.templateRepository.findTenantTemplates(tenantId, page, limit);
    }

    async createTemplate(template: Partial<Template>): Promise<Template> {
        this.validateTemplateData(template.id || '', template);
        return this.templateRepository.createTemplate(template);
    }

    async updateTemplate(id: string, template: Partial<Template>): Promise<Template> {
        await this.getTemplateById(id);
        return this.templateRepository.updateTemplate(id, template);
    }

    async deleteTemplate(id: string): Promise<void> {
        await this.getTemplateById(id);
        return this.templateRepository.deleteTemplate(id);
    }

    async updateTemplateSectionOrder(templateId: string, sectionIds: string[]): Promise<void> {
        await this.getTemplateById(templateId);
        return this.templateRepository.updateSectionOrder(templateId, sectionIds);
    }

    // 表单元素
    async getAllFormElements(): Promise<FormElement[]> {
        return this.templateRepository.findAllFormElements();
    }

    // 验证规则
    async getAllValidationRules(): Promise<ValidationRule[]> {
        return this.templateRepository.findAllValidationRules();
    }

    async createValidationRule(rule: Partial<ValidationRule>): Promise<ValidationRule> {
        this.validateRuleData(rule);
        return this.templateRepository.createValidationRule(rule);
    }

    async updateValidationRule(id: string, rule: Partial<ValidationRule>): Promise<ValidationRule> {
        return this.templateRepository.updateValidationRule(id, rule);
    }

    // 模板版本管理
    async getTemplateVersions(templateId: string): Promise<Template[]> {
        return this.templateRepository.findTemplateVersions(templateId);
    }

    async createTemplateVersion(templateId: string, version: Partial<Template>): Promise<Template> {
        await this.getTemplateById(templateId);
        return this.templateRepository.createTemplateVersion(templateId, version);
    }

    async getTemplateVersion(templateId: string, version: string): Promise<Template> {
        const templateVersion = await this.templateRepository.findTemplateVersion(templateId, version);
        if (!templateVersion) {
            throw new ApiError(404, '模板版本不存在');
        }
        return templateVersion;
    }

    async publishTemplateVersion(templateId: string, version: string): Promise<void> {
        await this.getTemplateVersion(templateId, version);
        return this.templateRepository.publishTemplateVersion(templateId, version);
    }

    // 动态表单配置
    async getFormElements(): Promise<FormElement[]> {
        return this.templateRepository.findAllFormElements();
    }

    async addTemplateSection(templateId: string, section: Partial<TemplateSection>): Promise<TemplateSection> {
        await this.getTemplateById(templateId);
        return this.templateRepository.addTemplateSection(templateId, section);
    }

    async updateTemplateSection(templateId: string, sectionId: string, section: Partial<TemplateSection>): Promise<TemplateSection> {
        await this.getTemplateById(templateId);
        return this.templateRepository.updateTemplateSection(sectionId, section);
    }

    async deleteTemplateSection(templateId: string, sectionId: string): Promise<void> {
        await this.getTemplateById(templateId);
        return this.templateRepository.deleteTemplateSection(sectionId);
    }

    async updateSectionOrder(templateId: string, sectionIds: string[]): Promise<void> {
        await this.getTemplateById(templateId);
        return this.templateRepository.updateSectionOrder(templateId, sectionIds);
    }

    // 验证规则
    async getValidationRules(): Promise<ValidationRule[]> {
        return this.templateRepository.findAllValidationRules();
    }

    async validateTemplateData(templateId: string, data: any): Promise<{ isValid: boolean; errors: string[] }> {
        const template = await this.getTemplateById(templateId);
        return this.templateRepository.validateTemplateData(template, data);
    }


    private validateRuleData(rule: Partial<ValidationRule>): void {
        if (!rule.type) {
            throw new ApiError(400, '验证规则类型不能为空');
        }
        if (rule.type !== 'CUSTOM' && !rule.value) {
            throw new ApiError(400, '验证规则值不能为空');
        }
        if (rule.type === 'CUSTOM' && !rule.customValidator) {
            throw new ApiError(400, '自定义验证器不能为空');
        }
        if (!rule.message) {
            throw new ApiError(400, '错误消息不能为空');
        }
    }
} 