import { Types } from "./conversation";

// API response type
export interface ApiResponse<T> {
    code: number;
    message: string;
    data: T;
}

export interface User {
    userId: string;
    gender: string | undefined;
    birthDate: string | undefined;
    phone: string | undefined;
    name?: string;
    role?: string;
    avatar?: string;
    tenantId?: string;
    email?: string;
    isIdentityConfirmed?: boolean;
    age?: number;
    idCardNumber?: string;
}

// Pagination type
export interface Pagination {
    page: number;
    pageSize: number;
    total: number;
}

export interface PaginatedResponse<T>
    extends ApiResponse<{
        items: T[];
        pagination: Pagination;
    }> {
    }
// 角色定义
export const ROLE_DEFINITIONS = [
    {

        type: Types.DIAGNOSIS,
        title: '问诊',
        description: '我是你专业的诊前AI医生，有什么问题和疑惑都可以问我，帮助您了解症状和可能的诊断。',
        systemPrompt: ''
    },
    {
        type: Types.GUIDE,
        title: '导诊',
        description: '我是你专业的导诊AI医生，有什么问题和疑惑都可以问我，帮助您找到合适的科室和医生。',
        systemPrompt: ''
    },
    {
        type: Types.REPORT,
        title: '报告解读',
        description: '我是你专业的报告解读AI医生，有什么问题和疑惑都可以问我，帮助您理解检查结果。',
        systemPrompt: '',
    }
];
