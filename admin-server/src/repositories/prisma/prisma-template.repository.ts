import { PrismaClient } from '@prisma/client';
import { ITemplateRepository } from '../template.repository';
import {
    Template,
    TemplateSection,
    FormElement,
    ValidationRule,
} from '../../domains/template/template.entity';

export class PrismaTemplateRepository implements ITemplateRepository {
    constructor(private prisma: PrismaClient) {}

    // 模板管理
    async findAllTemplates(
        page: number,
        limit: number
    ): Promise<{ templates: Template[]; total: number }> {
        const [templates, total] = await Promise.all([
            this.prisma.template.findMany({
                skip: (page - 1) * limit,
                take: limit,
                orderBy: { createdAt: 'desc' },
            }),
            this.prisma.template.count(),
        ]);

        return {
            templates: templates.map((template: any) => this.mapTemplateToEntity(template)),
            total,
        };
    }

    async findTemplateById(id: string): Promise<Template | null> {
        const template = await this.prisma.template.findUnique({
            where: { id },
            include: {
                sections: true,
            },
        });

        if (!template) return null;

        // 手动获取sections的elements和validationRules
        const sections = await Promise.all(
            template.sections.map(async section => {
                const elements = await this.prisma.formElement.findMany({
                    where: { sectionId: section.id },
                    include: { validationRules: true },
                });

                const sectionValidationRules = await this.prisma.validationRule.findMany({
                    where: { sectionId: section.id },
                });

                return {
                    ...section,
                    elements,
                    validationRules: sectionValidationRules,
                };
            })
        );

        return this.mapTemplateToEntity({
            ...template,
            sections,
        });
    }

    async createTemplate(template: Partial<Template>): Promise<Template> {
        const newTemplate = await this.prisma.template.create({
            data: {
                name: template.name!,
                code: template.code!,
                description: template.description!,
                category: template.category!,
                version: template.version!,
                status: template.status || 'DRAFT',
                metadata: template.metadata || {},
                tenantId: template.tenantId!,
            },
        });

        return this.mapTemplateToEntity(newTemplate);
    }

    async updateTemplate(id: string, template: Partial<Template>): Promise<Template> {
        const updatedTemplate = await this.prisma.template.update({
            where: { id },
            data: {
                name: template.name,
                description: template.description,
                category: template.category,
                version: template.version,
                metadata: template.metadata,
            } as any,
        });

        return this.mapTemplateToEntity(updatedTemplate);
    }

    async deleteTemplate(id: string): Promise<void> {
        await this.prisma.template.delete({
            where: { id },
        });
    }

    async findTenantTemplates(
        tenantId: string,
        page: number,
        limit: number
    ): Promise<{ templates: Template[]; total: number }> {
        // Since there's no tenantId field in the Template model,
        // we need to find templates that may be associated with the tenant in another way
        // For now, let's just return all templates with pagination
        const [templates, total] = await Promise.all([
            this.prisma.template.findMany({
                where: {
                    tenantId: tenantId,
                },
                skip: (page - 1) * limit,
                take: limit,
                orderBy: { createdAt: 'desc' },
            }),
            this.prisma.template.count(),
        ]);

        return {
            templates: templates.map((template: any) => this.mapTemplateToEntity(template)),
            total,
        };
    }

    // 模板版本管理
    async findTemplateVersions(templateId: string): Promise<Template[]> {
        const versions = await this.prisma.template.findMany({
            where: { id: templateId },
            orderBy: { version: 'desc' },
        });

        return versions.map((version: any) => this.mapTemplateToEntity(version));
    }

    async createTemplateVersion(templateId: string, version: Partial<Template>): Promise<Template> {
        const newVersion = await this.prisma.template.create({
            data: {
                id: templateId,
                status: 'DRAFT',
                name: version.name || 'New Version',
                code: version.code || `version-${Date.now()}`,
                description: version.description || '',
                category: version.category || 'default',
                version: version.version || '1.0',
                tenantId: version.tenantId!,
            },
        });

        return this.mapTemplateToEntity(newVersion);
    }

    async findTemplateVersion(templateId: string, version: string): Promise<Template | null> {
        const templateVersion = await this.prisma.template.findFirst({
            where: {
                id: templateId,
                version,
            } as any,
        });

        return templateVersion ? this.mapTemplateToEntity(templateVersion) : null;
    }

    async publishTemplateVersion(templateId: string, version: string): Promise<void> {
        await this.prisma.template.update({
            where: { id: templateId },
            data: { status: 'PUBLISHED' },
        });
    }

    // 动态表单配置
    async findAllFormElements(): Promise<FormElement[]> {
        const elements = await this.prisma.formElement.findMany({
            orderBy: { createdAt: 'desc' },
        });

        return elements.map((element: any) => this.mapFormElementToEntity(element));
    }

    async addTemplateSection(
        templateId: string,
        section: Partial<TemplateSection>
    ): Promise<TemplateSection> {
        const newSection = await this.prisma.templateSection.create({
            data: {
                templateId,
                name: section.name!,
                code: section.code!,
                description: section.description!,
                order: section.order || 0,
                metadata: section.metadata || {},
            },
        });

        return this.mapTemplateSectionToEntity(newSection);
    }

    async updateTemplateSection(
        sectionId: string,
        section: Partial<TemplateSection>
    ): Promise<TemplateSection> {
        const updatedSection = await this.prisma.templateSection.update({
            where: { id: sectionId },
            data: {
                name: section.name,
                code: section.code,
                description: section.description,
                order: section.order,
                metadata: section.metadata,
            },
        });

        return this.mapTemplateSectionToEntity(updatedSection);
    }

    async deleteTemplateSection(sectionId: string): Promise<void> {
        await this.prisma.templateSection.delete({
            where: { id: sectionId },
        });
    }

    async updateSectionOrder(templateId: string, sectionIds: string[]): Promise<void> {
        await Promise.all(
            sectionIds.map((id, index) =>
                this.prisma.templateSection.update({
                    where: { id },
                    data: { order: index },
                })
            )
        );
    }

    // 验证规则
    async findAllValidationRules(): Promise<ValidationRule[]> {
        const rules = await this.prisma.validationRule.findMany({
            orderBy: { createdAt: 'desc' },
        });

        return rules.map((rule: any) => this.mapValidationRuleToEntity(rule));
    }

    async createValidationRule(rule: Partial<ValidationRule>): Promise<ValidationRule> {
        const newRule = await this.prisma.validationRule.create({
            data: {
                name: rule.name!,
                code: rule.code!,
                type: rule.type!,
                message: rule.message!,
                value: rule.value || '',
                parameters: rule.parameters || {},
                metadata: rule.metadata || {},
            },
        });

        return this.mapValidationRuleToEntity(newRule);
    }

    async updateValidationRule(id: string, rule: Partial<ValidationRule>): Promise<ValidationRule> {
        const updatedRule = await this.prisma.validationRule.update({
            where: { id },
            data: {
                name: rule.name,
                code: rule.code,
                type: rule.type,
                message: rule.message,
                parameters: rule.parameters,
                metadata: rule.metadata,
            },
        });

        return this.mapValidationRuleToEntity(updatedRule);
    }

    async validateTemplateData(
        template: Template,
        data: any
    ): Promise<{ isValid: boolean; errors: string[] }> {
        const errors: string[] = [];

        // 验证模板数据
        for (const section of template.sections) {
            // 验证区块数据
            const sectionData = data[section.code];
            if (!sectionData) {
                errors.push(`区块 ${section.name} 数据缺失`);
                continue;
            }

            // 验证区块内的元素
            for (const element of section.elements) {
                const elementData = sectionData[element.code];
                if (element.required && !elementData) {
                    errors.push(`${section.name} - ${element.label} 不能为空`);
                    continue;
                }

                // 验证元素规则
                for (const rule of element.validationRules) {
                    if (!this.validateRule(rule, elementData)) {
                        errors.push(`${section.name} - ${element.label}: ${rule.message}`);
                    }
                }
            }
        }

        return {
            isValid: errors.length === 0,
            errors,
        };
    }

    // 私有辅助方法
    private mapTemplateToEntity(template: any): Template {
        return {
            id: template.id,
            name: template.name,
            code: template.code,
            description: template.description,
            category: template.category,
            version: template.version,
            status: template.status,
            sections:
                template.sections?.map((section: any) =>
                    this.mapTemplateSectionToEntity(section)
                ) || [],
            metadata: template.metadata,
            createdAt: template.createdAt,
            updatedAt: template.updatedAt,
            tenantId: template.tenantId,
        };
    }

    private mapTemplateSectionToEntity(section: any): TemplateSection {
        return {
            id: section.id,
            templateId: section.templateId,
            name: section.name,
            code: section.code,
            description: section.description,
            order: section.order,
            elements:
                section.elements?.map((element: any) => this.mapFormElementToEntity(element)) || [],
            validationRules:
                section.validationRules?.map((rule: any) => this.mapValidationRuleToEntity(rule)) ||
                [],
            metadata: section.metadata,
            createdAt: section.createdAt,
            updatedAt: section.updatedAt,
        };
    }

    private mapFormElementToEntity(element: any): FormElement {
        return {
            id: element.id,
            sectionId: element.sectionId,
            type: element.type,
            name: element.name,
            code: element.code,
            label: element.label,
            placeholder: element.placeholder,
            required: element.required,
            defaultValue: element.defaultValue,
            options: element.options,
            validationRules:
                element.validationRules?.map((rule: any) => this.mapValidationRuleToEntity(rule)) ||
                [],
            metadata: element.metadata,
            createdAt: element.createdAt,
            updatedAt: element.updatedAt,
        };
    }

    private mapValidationRuleToEntity(rule: any): ValidationRule {
        return {
            id: rule.id,
            name: rule.name,
            code: rule.code,
            type: rule.type,
            message: rule.message,
            parameters: rule.parameters,
            metadata: rule.metadata,
            createdAt: rule.createdAt,
            updatedAt: rule.updatedAt,
            value: rule.value,
            customValidator: rule.customValidator,
        };
    }

    private validateRule(rule: ValidationRule, value: any): boolean {
        switch (rule.type) {
            case 'REQUIRED':
                return value !== undefined && value !== null && value !== '';
            case 'MIN':
                return value >= rule.parameters?.min;
            case 'MAX':
                return value <= rule.parameters?.max;
            case 'PATTERN':
                return new RegExp(rule.parameters?.pattern).test(value);
            case 'CUSTOM':
                // 这里可以添加自定义验证逻辑
                return true;
            default:
                return true;
        }
    }
}
