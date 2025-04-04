import mongoose from 'mongoose';
import config from './config';
import winston from 'winston';

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

const MAX_RETRIES = 5;
const RETRY_INTERVAL = 5000; // 5 seconds

// 在应用启动前确保数据库已连接
let isConnected = false;

const connectDB = async (retryCount = 0) => {
    if (isConnected) {
        logger.info('MongoDB is already connected');
        return;
    }

    // 关闭现有连接（如果有）
    if (mongoose.connection.readyState !== 0) {
        logger.info('Closing existing MongoDB connection');
        await mongoose.connection.close();
    }

    try {
        // 设置更长的超时时间和更多的连接选项
        const mongooseOptions = {
            connectTimeoutMS: 30000, // 连接超时设为30秒
            socketTimeoutMS: 45000,  // Socket超时设为45秒
            serverSelectionTimeoutMS: 30000, // 服务器选择超时设为30秒
            maxPoolSize: 10, // 连接池大小
            minPoolSize: 2, // 最小连接数
            retryWrites: false, // 禁用重试写入
            retryReads: false, // 禁用重试读取
            directConnection: true, // 使用直接连接
            autoIndex: true, // 自动创建索引
        };
        
        // 构建带有authSource=admin的连接URI
        const connectionUri = `${config.mongoURI}`;
        
        // 连接到数据库前先禁用严格查询
        mongoose.set('strictQuery', false);
        
        // 连接到数据库
        await mongoose.connect(connectionUri, mongooseOptions);
        
        isConnected = true;
        logger.info('MongoDB connected successfully');
        
        // 添加连接错误的监听器
        mongoose.connection.on('error', (err) => {
            isConnected = false;
            logger.error(`MongoDB connection error: ${err}`);
        });
        
        // 添加断开连接的监听器
        mongoose.connection.on('disconnected', () => {
            isConnected = false;
            logger.warn('MongoDB disconnected, attempting to reconnect...');
            // 自动重新连接
            setTimeout(() => connectDB(), 5000);
        });

        // 添加重连成功的监听器
        mongoose.connection.on('reconnected', () => {
            isConnected = true;
            logger.info('MongoDB reconnected successfully');
        });
        
    } catch (error) {
        isConnected = false;
        logger.error(`Error connecting to MongoDB: ${error}`);
        
        if (retryCount < MAX_RETRIES) {
            logger.info(`Retrying connection (${retryCount + 1}/${MAX_RETRIES}) in ${RETRY_INTERVAL/1000} seconds...`);
            // 延迟重试
            return new Promise((resolve) => {
                setTimeout(async () => {
                    resolve(await connectDB(retryCount + 1));
                }, RETRY_INTERVAL);
            });
        } else {
            logger.error(`Failed to connect to MongoDB after ${MAX_RETRIES} attempts`);
            throw new Error(`Failed to connect to MongoDB after ${MAX_RETRIES} attempts`);
        }
    }
};

// 导出连接状态检查函数
export const isMongoConnected = () => isConnected;

export default connectDB; 