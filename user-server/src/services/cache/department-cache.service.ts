import { CacheService } from './cache.service';
import { DepartmentDocument } from '../../interfaces/department.interface';
import logger from '../../config/logger';

/**
 * 科室缓存服务
 * 提供科室数据的缓存功能，减少对数据库的频繁访问
 */
export class DepartmentCacheService {
    private cacheService: CacheService;
    private readonly DEPARTMENTS_CACHE_KEY = 'departments:all';
    private readonly DEPARTMENT_CACHE_PREFIX = 'department:';
    private readonly CACHE_TTL = 3600; // 1小时缓存过期时间

    constructor() {
        this.cacheService = CacheService.getInstance();
    }

    /**
     * 获取所有科室缓存
     * @returns 科室列表和总数，如果缓存不存在则返回null
     */
    public async getDepartments(): Promise<{ total: number, departments: DepartmentDocument[] } | null> {
        try {
            const cachedData = await this.cacheService.get(this.DEPARTMENTS_CACHE_KEY);
            if (!cachedData) {
                return null;
            }
            return JSON.parse(cachedData);
        } catch (error: any) {
            logger.error(`获取科室缓存失败: ${error.message}`);
            return null;
        }
    }

    /**
     * 设置所有科室缓存
     * @param data 科室列表和总数
     */
    public async setDepartments(data: { total: number, departments: DepartmentDocument[] }): Promise<void> {
        try {
            await this.cacheService.set(
                this.DEPARTMENTS_CACHE_KEY,
                JSON.stringify(data),
                this.CACHE_TTL
            );
        } catch (error: any) {
            logger.error(`设置科室缓存失败: ${error.message}`);
        }
    }

    /**
     * 获取单个科室缓存
     * @param id 科室ID
     * @returns 科室文档，如果缓存不存在则返回null
     */
    public async getDepartmentById(id: string): Promise<DepartmentDocument | null> {
        try {
            const cacheKey = `${this.DEPARTMENT_CACHE_PREFIX}${id}`;
            const cachedData = await this.cacheService.get(cacheKey);
            if (!cachedData) {
                return null;
            }
            return JSON.parse(cachedData);
        } catch (error: any) {
            logger.error(`获取科室(ID: ${id})缓存失败: ${error.message}`);
            return null;
        }
    }

    /**
     * 设置单个科室缓存
     * @param id 科室ID
     * @param department 科室文档
     */
    public async setDepartmentById(id: string, department: DepartmentDocument): Promise<void> {
        try {
            const cacheKey = `${this.DEPARTMENT_CACHE_PREFIX}${id}`;
            await this.cacheService.set(
                cacheKey,
                JSON.stringify(department),
                this.CACHE_TTL
            );
        } catch (error: any) {
            logger.error(`设置科室(ID: ${id})缓存失败: ${error.message}`);
        }
    }

    /**
     * 使所有科室缓存失效
     */
    public async invalidateAllDepartments(): Promise<void> {
        try {
            await this.cacheService.del(this.DEPARTMENTS_CACHE_KEY);
        } catch (error: any) {
            logger.error(`使所有科室缓存失效失败: ${error.message}`);
        }
    }

    /**
     * 使单个科室缓存失效
     * @param id 科室ID
     */
    public async invalidateDepartmentById(id: string): Promise<void> {
        try {
            const cacheKey = `${this.DEPARTMENT_CACHE_PREFIX}${id}`;
            await this.cacheService.del(cacheKey);
        } catch (error: any) {
            logger.error(`使科室(ID: ${id})缓存失效失败: ${error.message}`);
        }
    }
} 