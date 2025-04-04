import Redis from 'ioredis';
import logger from './logger';

// Redis客户端实例
let redisClient: Redis | null = null;
let isConnected = false;

/**
 * 初始化缓存连接
 * 连接到Redis服务器
 */
export const initializeCache = async (): Promise<void> => {
  logger.info('初始化Redis缓存连接...');
  
  try {
    const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
    redisClient = new Redis(redisUrl);
    
    redisClient.on('connect', () => {
      logger.info('Redis缓存连接成功');
      isConnected = true;
    });
    
    redisClient.on('error', (err) => {
      logger.error(`Redis缓存错误: ${err.message}`);
      isConnected = false;
    });
    
    redisClient.on('close', () => {
      logger.info('Redis缓存连接关闭');
      isConnected = false;
    });
    
    // 测试连接
    await redisClient.ping();
    
  } catch (error: any) {
    logger.error(`初始化Redis缓存失败: ${error.message}`);
    throw error;
  }
};

/**
 * 关闭缓存连接
 */
export const closeCache = async (): Promise<void> => {
  logger.info('关闭Redis缓存连接...');
  if (redisClient) {
    await redisClient.quit();
    redisClient = null;
    isConnected = false;
  }
};

/**
 * 获取Redis客户端实例
 */
export const getRedisClient = (): Redis | null => {
  return redisClient;
};

/**
 * 检查Redis连接状态
 */
export const isRedisConnected = (): boolean => {
  return isConnected;
}; 