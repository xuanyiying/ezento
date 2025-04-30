import { API_BASE_URL } from '@/config';

/**
 * AI角色服务
 * 提供AI角色相关的API调用
 */
export const AiRoleAPI = {
    /**
     * 获取所有AI角色
     * @returns AI角色列表
     */
    async getAllRoles() {
        try {
            const response = await fetch(`${API_BASE_URL}/roles`);
            if (!response.ok) {
                throw new Error(`获取角色列表失败: ${response.status}`);
            }
            return await response.json();
        } catch (error) {
            console.error('获取角色列表出错:', error);
            throw error;
        }
    },

    /**
     * 根据ID获取AI角色
     * @param id 角色ID
     * @returns 角色信息
     */
    async getRoleById(id: string) {
        try {
            const response = await fetch(`${API_BASE_URL}/roles/${id}`);
            if (!response.ok) {
                throw new Error(`获取角色详情失败: ${response.status}`);
            }
            return await response.json();
        } catch (error) {
            console.error('获取角色详情出错:', error);
            throw error;
        }
    },

    /**
     * 根据类型获取AI角色
     * @param type 角色类型
     * @returns 角色信息
     */
    async getRoleByType(type: string) {
        try {
            const response = await fetch(`${API_BASE_URL}/roles/type/${type}`);
            if (!response.ok) {
                throw new Error(`获取角色详情失败: ${response.status}`);
            }
            return await response.json();
        } catch (error) {
            console.error('获取角色详情出错:', error);
            throw error;
        }
    }
};