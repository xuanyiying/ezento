import mongoose from 'mongoose';
import config from './config';
import winston from 'winston';
import dotenv from 'dotenv';

// 确保环境变量已加载
dotenv.config();

/**
 * 数据库日志记录器
 * 用于记录数据库连接状态和错误信息
 */
const logger = winston.createLogger({
    level: 'info',
    format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.printf(({ timestamp, level, message }) => {
            return `${timestamp} ${level}: ${message}`;
        })
    ),
    transports: [
        new winston.transports.Console(),
        new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
        new winston.transports.File({ filename: 'logs/combined.log' }),
    ],
});

// 获取安全的配置对象
function getConfig() {
    if (!config) {
        logger.error('Configuration object is undefined, using environment variables directly');
        return {
            mongoURI: process.env.MONGODB_URI || 'mongodb://localhost:27017/ezento',
        };
    }
    return config;
}

/**
 * 数据库连接重试配置
 */
const MAX_RETRIES = 5; // 最大重试次数
const RETRY_INTERVAL = 5000; // 重试间隔（毫秒）

/**
 * 数据库连接状态标志
 * 用于跟踪数据库是否已连接
 */
let isConnected = false;

/**
 * 连接到MongoDB数据库
 * 本函数负责建立和维护与MongoDB的连接，包括错误处理和自动重连
 *
 * @param retryCount 当前重试次数，默认为0
 * @returns Promise<void>
 * @throws 如果达到最大重试次数后仍无法连接
 */
const connectDB = async (retryCount = 0) => {
    // 获取安全的配置
    const config = getConfig();

    // 如果已连接，直接返回
    if (isConnected) {
        logger.info('MongoDB已连接');
        return;
    }

    // 关闭现有连接（如果有）
    if (mongoose.connection.readyState !== 0) {
        logger.info('关闭现有的MongoDB连接');
        await mongoose.connection.close();
    }

    try {
        // 设置MongoDB连接选项
        const mongooseOptions = {
            connectTimeoutMS: 30000, // 连接超时设为30秒
            socketTimeoutMS: 45000, // Socket超时设为45秒
            serverSelectionTimeoutMS: 30000, // 服务器选择超时设为30秒
            maxPoolSize: 10, // 连接池大小
            minPoolSize: 2, // 最小连接数
            retryWrites: false, // 禁用重试写入
            retryReads: false, // 禁用重试读取
            directConnection: true, // 使用直接连接
            autoIndex: true, // 自动创建索引
        };

        // 获取连接URI
        const connectionUri = config.mongoURI;
        logger.info(`正在连接到 MongoDB: ${connectionUri}`);

        // 连接前设置Mongoose选项
        mongoose.set('strictQuery', false); // 禁用严格查询模式

        // 连接到数据库
        await mongoose.connect(connectionUri, mongooseOptions);

        // 更新连接状态并记录日志
        isConnected = true;
        logger.info('MongoDB连接成功');

        // 设置连接事件监听器

        // 错误事件监听
        mongoose.connection.on('error', err => {
            isConnected = false;
            logger.error(`MongoDB连接错误: ${err}`);
        });

        // 断开连接事件监听
        mongoose.connection.on('disconnected', () => {
            isConnected = false;
            logger.warn('MongoDB连接断开，尝试重新连接...');
            // 自动重新连接
            setTimeout(() => connectDB(), 5000);
        });

        // 重连成功事件监听
        mongoose.connection.on('reconnected', () => {
            isConnected = true;
            logger.info('MongoDB重新连接成功');
        });
    } catch (error) {
        // 连接失败处理
        isConnected = false;
        logger.error(`MongoDB连接失败: ${error}`);

        // 重试逻辑
        if (retryCount < MAX_RETRIES) {
            logger.info(
                `尝试重新连接 (${retryCount + 1}/${MAX_RETRIES})，将在 ${RETRY_INTERVAL / 1000} 秒后重试...`
            );
            // 延迟重试
            return new Promise(resolve => {
                setTimeout(async () => {
                    resolve(await connectDB(retryCount + 1));
                }, RETRY_INTERVAL);
            });
        } else {
            // 达到最大重试次数，抛出错误
            logger.error(`MongoDB连接失败，已达到最大重试次数 ${MAX_RETRIES}`);
            throw new Error(`MongoDB连接失败，已达到最大重试次数 ${MAX_RETRIES}`);
        }
    }
};

/**
 * 导出数据库连接状态检查函数
 * @returns 当前MongoDB连接状态（布尔值）
 */
export const isMongoConnected = () => isConnected;

export default connectDB;
