import { Template, TemplateSection, FormElement, ValidationRule } from '../domains/template/template.entity';

export interface ITemplateRepository {
    // 模板管理
    findAllTemplates(page: number, limit: number): Promise<{ templates: Template[]; total: number }>;
    findTemplateById(id: string): Promise<Template | null>;
    createTemplate(template: Partial<Template>): Promise<Template>;
    updateTemplate(id: string, template: Partial<Template>): Promise<Template>;
    deleteTemplate(id: string): Promise<void>;
    findTenantTemplates(tenantId: string, page: number, limit: number): Promise<{ templates: Template[]; total: number }>;

    // 模板版本管理
    findTemplateVersions(templateId: string): Promise<Template[]>;
    createTemplateVersion(templateId: string, version: Partial<Template>): Promise<Template>;
    findTemplateVersion(templateId: string, version: string): Promise<Template | null>;
    publishTemplateVersion(templateId: string, version: string): Promise<void>;

    // 动态表单配置
    findAllFormElements(): Promise<FormElement[]>;
    addTemplateSection(templateId: string, section: Partial<TemplateSection>): Promise<TemplateSection>;
    updateTemplateSection(sectionId: string, section: Partial<TemplateSection>): Promise<TemplateSection>;
    deleteTemplateSection(sectionId: string): Promise<void>;
    updateSectionOrder(templateId: string, sectionIds: string[]): Promise<void>;

    // 验证规则
    findAllValidationRules(): Promise<ValidationRule[]>;
    createValidationRule(rule: Partial<ValidationRule>): Promise<ValidationRule>;
    updateValidationRule(id: string, rule: Partial<ValidationRule>): Promise<ValidationRule>;
    validateTemplateData(template: Template, data: any): Promise<{ isValid: boolean; errors: string[] }>;
} 