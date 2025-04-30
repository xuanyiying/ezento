/**
 * 角色接口定义
 */

export interface AiRoleBase {
    id: string;
    type: string;
    title: string;
    description: string;
    systemPrompt: string;
    status?: 'active' | 'inactive';
    order?: number;
    createdAt?: Date;
    updatedAt?: Date;
}

export interface AiRoleCreateData {
    type: string;
    title: string;
    description: string;
    systemPrompt: string;
    status?: 'active' | 'inactive';
    order?: number;
    id: string;
}

export interface AiRoleUpdateData {
    title?: string;
    description?: string;
    systemPrompt?: string;
    status?: 'active' | 'inactive';
    order?: number;
}

export interface AiRoleListResponse {
    total: number;
    roles: AiRoleBase[];
}