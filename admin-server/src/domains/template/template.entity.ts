export interface Template {
    id: string;
    name: string;
    code: string;
    description: string;
    category: string;
    version: string;
    status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
    sections: TemplateSection[];
    metadata: Record<string, any>;
    createdAt: Date;
    updatedAt: Date;
    tenantId: string;
}

export interface TemplateSection {
    id: string;
    templateId: string;
    name: string;
    code: string;
    description: string;
    order: number;
    elements: FormElement[];
    validationRules: ValidationRule[];
    metadata: Record<string, any>;
    createdAt: Date;
    updatedAt: Date;
}

export interface FormElement {
    id: string;
    sectionId: string;
    type:
        | 'TEXT'
        | 'NUMBER'
        | 'DATE'
        | 'SELECT'
        | 'MULTI_SELECT'
        | 'CHECKBOX'
        | 'RADIO'
        | 'TEXTAREA'
        | 'FILE';
    name: string;
    code: string;
    label: string;
    placeholder?: string;
    required: boolean;
    defaultValue?: any;
    options?: { label: string; value: any }[];
    validationRules: ValidationRule[];
    metadata: Record<string, any>;
    createdAt: Date;
    updatedAt: Date;
}

export interface ValidationRule {
    id: string;
    name: string;
    code: string;
    value: string;
    type: 'REQUIRED' | 'MIN' | 'MAX' | 'PATTERN' | 'CUSTOM';
    message: string;
    parameters?: Record<string, any>;
    metadata: Record<string, any>;
    createdAt: Date;
    updatedAt: Date;
    customValidator?: string;
}

export interface TemplateVersion {
    id: string;
    templateId: string;
    version: number;
    changes: string;
    templateData: Template;
    createdBy: string;
    createdAt: Date;
    publishedAt?: Date;
}
