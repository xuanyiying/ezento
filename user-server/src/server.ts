import app from './app';
import dotenv from 'dotenv';
import logger from './config/logger';

// 加载环境变量
dotenv.config();

const PORT = process.env.PORT || 3000;

// 启动服务器
app.listen(PORT, () => {
  logger.info(`服务器已启动，运行在端口 ${PORT}`);
  logger.info(`API文档可在 http://localhost:${PORT}/api-docs 访问`);
}); 