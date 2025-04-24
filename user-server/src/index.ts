import dotenv from 'dotenv';
import app from './app';
import connectDB from './config/database';
import logger from './config/logger';
import { initializeCache } from './config/cache';

// 加载环境变量
dotenv.config();

const PORT = process.env.PORT || 3001;

// 启动服务器函数
const startServer = async () => {
    try {
        // 先连接到数据库
        await connectDB();
        logger.info('Mongo数据库连接成功', { service: 'ezento-api' });

        // 启动服务器
        const server = app.listen(PORT, () => {
            logger.info(`服务器已启动，运行在端口 ${PORT}`, { service: 'ezento-api' });
            logger.info(`API文档可在 http://localhost:${PORT}/api-docs 访问`, {
                service: 'ezento-api',
            });
            logger.info(`WebSocket服务可在 ws://localhost:${PORT}/ws 访问`, {
                service: 'ezento-api',
            });
        });

        // 确保服务器正确监听后再初始化其他服务
        server.on('error', (error: Error) => {
            logger.error(`HTTP服务器错误: ${error.message}`, {
                service: 'ezento-api',
                stack: error.stack,
            });
            process.exit(1);
        });

        // 初始化缓存
        try {
            await initializeCache();
            logger.info('Redis缓存连接成功', { service: 'ezento-api' });
        } catch (cacheError: any) {
            const stack = cacheError instanceof Error ? cacheError.stack : '';
            logger.error(`Redis缓存连接失败: ${cacheError}`, { service: 'ezento-api', stack });
            // 缓存失败不影响主程序运行
            logger.warn('系统将在没有缓存的情况下继续运行', { service: 'ezento-api' });
        }
    } catch (error: any) {
        const stack = error instanceof Error ? error.stack : '';
        logger.error(`服务器启动失败: ${error}`, { service: 'ezento-api', stack });
        process.exit(1);
    }
};

// 启动服务器
startServer();

// 处理未捕获的异常
process.on('uncaughtException', error => {
    logger.error(`未捕获的异常: ${error.stack}`, { service: 'ezento-api' });
});

// 处理未处理的Promise拒绝
process.on('unhandledRejection', (reason, promise) => {
    logger.error(`未处理的Promise拒绝: ${reason}`, { service: 'ezento-api' });
});
