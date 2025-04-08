import dotenv from 'dotenv';
import mongoose from 'mongoose';

// 加载环境变量
dotenv.config();

// 设置测试环境变量
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-secret-key';
process.env.MONGODB_URI = 'mongodb://localhost:27017/test';
process.env.BASE_URL = 'http://localhost:3000';

// 增加超时时间
jest.setTimeout(60000);

// 处理未捕获的Promise异常
process.on('unhandledRejection', (reason, promise) => {
  console.error('测试中有未处理的Promise拒绝:', reason);
});

// 减少Mongoose缓存，避免污染测试环境
mongoose.set('autoIndex', false);

// 全局清理工作
afterAll(async () => {
  // 关闭所有打开的连接和处理器
  await mongoose.connection.close();
  await new Promise(resolve => setTimeout(resolve, 1000));
}); 