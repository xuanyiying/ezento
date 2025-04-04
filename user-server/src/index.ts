import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import connectDB from './config/database';
import initializeAPIRoutes from './routes';
import { errorHandler } from './middlewares/error';
import logger from './config/logger';
import { initializeCache } from './config/cache';
import apiDocs from './config/swagger';

// 创建Express应用
const app = express();
const PORT = process.env.PORT || 3000;

// 中间件
// 配置跨域 http://localhost:5173
app.use(cors({
    origin: '*', 
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true
}));

app.use(helmet());
// 压缩
app.use(compression({
    level: 6,
    threshold: 10 * 1024 * 1024,
    filter: (req, res) => {
        if (req.headers['x-no-compression']) return false;
        return compression.filter(req, res);
    }
}));
// 解析JSON请求体
app.use(express.json({ limit: '50mb' }));
// 解析URL编码请求体
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// API文档
apiDocs(app);

// 路由
initializeAPIRoutes(app);

// 错误处理
app.use(errorHandler);

// 启动服务器函数
const startServer = async () => {
  try {
    // 先连接到数据库
    await connectDB();
    
    // 数据库连接成功后，再启动服务器
    app.listen(PORT, () => {
      logger.info(`服务器已启动，运行在端口 ${PORT}`, { service: 'ezento-api' });
      logger.info(`API文档可在 http://localhost:${PORT}/api-docs 访问`, { service: 'ezento-api' });
    });
    
    // 初始化缓存
    try {
      await initializeCache();
      logger.info('Redis缓存连接成功', { service: 'ezento-api' });
    } catch (cacheError) {
      logger.error(`Redis缓存连接失败: ${cacheError}`, { service: 'ezento-api' });
      // 缓存失败不影响主程序运行
    }
  } catch (error) {
    logger.error(`服务器启动失败: ${error}`, { service: 'ezento-api' });
    process.exit(1);
  }
};

// 启动服务器
startServer();

// 处理未捕获的异常
process.on('uncaughtException', (error) => {
  logger.error(`未捕获的异常: ${error.stack}`, { service: 'ezento-api' });
});

// 处理未处理的Promise拒绝
process.on('unhandledRejection', (reason, promise) => {
  logger.error(`未处理的Promise拒绝: ${reason}`, { service: 'ezento-api' });
}); 