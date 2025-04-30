import { v4 as uuidv4 } from 'uuid';
import AiRole from '../models/AiRole';
import { AiRoleBase, AiRoleCreateData, AiRoleUpdateData, AiRoleListResponse } from '../interfaces/ai.role.interface';
import logger from '../config/logger';
import { Type } from '../interfaces/conversation.interface';
import { generateAiRoleId } from '../utils/id.generator';

/**
 * AI角色服务
 * 处理AI角色相关的业务逻辑
 */
class AiRoleService {
    private static cache: {
        roles: AiRoleBase[];
        timestamp: number;
    } | null = null;

    private static CACHE_TTL = 5 * 60 * 1000; // 缓存有效期5分钟

    /**
     * 获取所有角色
     * @param useCache 是否使用缓存
     * @returns 角色列表和总数
     */
    public static async getAllRoles(useCache = true): Promise<AiRoleListResponse> {
        try {
            // 检查缓存是否有效
            if (
                useCache &&
                this.cache &&
                Date.now() - this.cache.timestamp < this.CACHE_TTL
            ) {
                return {
                    total: this.cache.roles.length,
                    roles: this.cache.roles,
                };
            }

            // 从数据库获取所有角色
            const roles = await AiRole.find({ status: 'active' }).sort({ order: 1 });

            // 更新缓存
            this.cache = {
                roles: roles,
                timestamp: Date.now(),
            };

            return {
                total: roles.length,
                roles: roles,
            };
        } catch (error) {
            logger.error(`获取角色列表失败: ${error}`);
            throw error;
        }
    }

    /**
     * 根据ID获取角色
     * @param id 角色ID
     * @param useCache 是否使用缓存
     * @returns 角色信息
     */
    public static async getRoleById(id: string, useCache = true): Promise<AiRoleBase | null> {
        try {
            // 尝试从缓存中获取
            if (
                useCache &&
                this.cache &&
                Date.now() - this.cache.timestamp < this.CACHE_TTL
            ) {
                const cachedRole = this.cache.roles.find((role) => role.id === id);
                if (cachedRole) return cachedRole;
            }

            // 从数据库获取
            const role = await AiRole.findOne({ id });
            return role;
        } catch (error) {
            logger.error(`获取角色详情失败: ${error}`);
            throw error;
        }
    }

    /**
     * 根据类型获取角色
     * @param type 角色类型
     * @param useCache 是否使用缓存
     * @returns 角色信息
     */
    public static async getRoleByType(type: Type, useCache = true): Promise<AiRoleBase | null> {
        try {
            // 尝试从缓存中获取
            if (
                useCache &&
                this.cache &&
                Date.now() - this.cache.timestamp < this.CACHE_TTL
            ) {
                const cachedRole = this.cache.roles.find((role) => role.type === type);
                if (cachedRole) return cachedRole;
            }

            // 从数据库获取
            const role = await AiRole.findOne({ type });
            return role;
        } catch (error) {
            logger.error(`获取角色详情失败: ${error}`);
            throw error;
        }
    }

    /**
     * 创建角色
     * @param roleData 角色数据
     * @returns 创建的角色
     */
    public static async createRole(roleData: AiRoleCreateData): Promise<AiRoleBase> {
        try {
            // 检查角色类型是否已存在
            const existingRole = await AiRole.findOne({ type: roleData.type });
            if (existingRole) {
                throw new Error(`角色类型 '${roleData.type}' 已存在`);
            }

            // 生成唯一ID
            const id = generateAiRoleId();
            const newRole = new AiRole({
                ...roleData,
                id,
            });

            await newRole.save();

            // 清除缓存
            this.cache = null;

            return newRole;
        } catch (error) {
            logger.error(`创建角色失败: ${error}`);
            throw error;
        }
    }

    /**
     * 更新角色
     * @param id 角色ID
     * @param updateData 更新数据
     * @returns 更新后的角色
     */
    public static async updateRole(id: string, updateData: AiRoleUpdateData): Promise<AiRoleBase | null> {
        try {
            const role = await AiRole.findOneAndUpdate(
                { id },
                { $set: updateData },
                { new: true }
            );

            // 清除缓存
            this.cache = null;

            return role;
        } catch (error) {
            logger.error(`更新角色失败: ${error}`);
            throw error;
        }
    }

    /**
     * 删除角色
     * @param id 角色ID
     * @returns 是否删除成功
     */
    public static async deleteRole(id: string): Promise<boolean> {
        try {
            const result = await AiRole.findOneAndDelete({ id });

            // 清除缓存
            this.cache = null;

            return !!result;
        } catch (error) {
            logger.error(`删除角色失败: ${error}`);
            throw error;
        }
    }
}

export default AiRoleService;