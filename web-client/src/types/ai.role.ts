/**
 * AI角色类型定义
 */

// AI角色类型
export type AiRoleType = string;

// AI角色状态
export type AiRoleStatus = 'active' | 'inactive';

// AI角色基础接口
export interface AiRole {
    id: string;
    type: AiRoleType;
    title: string;
    description: string;
    systemPrompt: string;
    status?: AiRoleStatus;
    order?: number;
    createdAt?: string;
    updatedAt?: string;
}

// AI角色创建数据
export interface AiRoleCreateData {
    type: AiRoleType;
    title: string;
    description: string;
    systemPrompt: string;
    status?: AiRoleStatus;
    order?: number;
    id: string;
}

// AI角色更新数据
export interface AiRoleUpdateData {
    title?: string;
    description?: string;
    systemPrompt?: string;
    status?: AiRoleStatus;
    order?: number;
}

// AI角色列表响应
export interface AiRoleListResponse {
    total: number;
    roles: AiRole[];
}