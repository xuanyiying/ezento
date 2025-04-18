import { getRedisClient, isRedisConnected } from '../../config/cache';
import logger from '../../config/logger';

/**
 * 缓存服务
 * 提供基于Redis的缓存功能，用于减少对数据库的频繁访问
 */
export class CacheService {
    private static instance: CacheService;

    /**
     * 构造函数私有化，确保单例模式
     */
    private constructor() {}

    /**
     * 获取缓存服务实例（单例模式）
     */
    public static getInstance(): CacheService {
        if (!CacheService.instance) {
            CacheService.instance = new CacheService();
        }
        return CacheService.instance;
    }

    /**
     * 检查缓存服务是否准备就绪
     */
    private checkReady(): boolean {
        if (!isRedisConnected()) {
            logger.warn('Redis缓存未准备就绪');
            return false;
        }
        return true;
    }

    /**
     * 获取缓存值
     * @param key 缓存键
     * @returns 缓存值或null
     */
    public async get(key: string): Promise<string | null> {
        try {
            if (!this.checkReady()) {
                return null;
            }
            const client = getRedisClient();
            if (!client) return null;

            return await client.get(key);
        } catch (error: any) {
            logger.error(`获取缓存值错误(${key}): ${error.message}`);
            return null;
        }
    }

    /**
     * 设置缓存值
     * @param key 缓存键
     * @param value 缓存值
     * @param ttl 过期时间（秒）
     * @returns 是否设置成功
     */
    public async set(key: string, value: string, ttl?: number): Promise<boolean> {
        try {
            if (!this.checkReady()) {
                return false;
            }

            const client = getRedisClient();
            if (!client) return false;

            if (ttl) {
                await client.set(key, value, 'EX', ttl);
            } else {
                await client.set(key, value);
            }

            return true;
        } catch (error: any) {
            logger.error(`设置缓存值错误(${key}): ${error.message}`);
            return false;
        }
    }

    /**
     * 删除缓存值
     * @param key 缓存键
     * @returns 是否删除成功
     */
    public async del(key: string): Promise<boolean> {
        try {
            if (!this.checkReady()) {
                return false;
            }

            const client = getRedisClient();
            if (!client) return false;

            await client.del(key);
            return true;
        } catch (error: any) {
            logger.error(`删除缓存值错误(${key}): ${error.message}`);
            return false;
        }
    }

    /**
     * 使用模式批量删除缓存
     * @param pattern 模式（如 'user:*'）
     * @returns 是否删除成功
     */
    public async delByPattern(pattern: string): Promise<boolean> {
        try {
            if (!this.checkReady()) {
                return false;
            }

            const client = getRedisClient();
            if (!client) return false;

            const keys = await client.keys(pattern);
            if (keys.length > 0) {
                await client.del(...keys);
            }

            return true;
        } catch (error: any) {
            logger.error(`批量删除缓存值错误(${pattern}): ${error.message}`);
            return false;
        }
    }

    /**
     * 检查缓存键是否存在
     * @param key 缓存键
     * @returns 是否存在
     */
    public async exists(key: string): Promise<boolean> {
        try {
            if (!this.checkReady()) {
                return false;
            }

            const client = getRedisClient();
            if (!client) return false;

            const result = await client.exists(key);
            return result === 1;
        } catch (error: any) {
            logger.error(`检查缓存键是否存在错误(${key}): ${error.message}`);
            return false;
        }
    }

    /**
     * 设置缓存过期时间
     * @param key 缓存键
     * @param ttl 过期时间（秒）
     * @returns 是否设置成功
     */
    public async expire(key: string, ttl: number): Promise<boolean> {
        try {
            if (!this.checkReady()) {
                return false;
            }

            const client = getRedisClient();
            if (!client) return false;

            await client.expire(key, ttl);
            return true;
        } catch (error: any) {
            logger.error(`设置缓存过期时间错误(${key}): ${error.message}`);
            return false;
        }
    }

    /**
     * 清除所有缓存
     * @returns 是否清除成功
     */
    public async flushAll(): Promise<boolean> {
        try {
            if (!this.checkReady()) {
                return false;
            }

            const client = getRedisClient();
            if (!client) return false;

            await client.flushall();
            return true;
        } catch (error: any) {
            logger.error(`清除所有缓存错误: ${error.message}`);
            return false;
        }
    }
}
