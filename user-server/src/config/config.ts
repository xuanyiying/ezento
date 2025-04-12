import dotenv from 'dotenv';
import winston from 'winston';
dotenv.config();

// 创建配置日志记录器
const configLogger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
      winston.format.timestamp(),
      winston.format.printf(({ timestamp, level, message }) => {
          return `[${timestamp}] ${level.toUpperCase()}: ${message}`;
      })
  ),
  transports: [
      new winston.transports.Console(),
      new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
  ],
});

export interface Config {
    port: string | number;
    mongoURI: string;
    jwtSecret: string;
    nodeEnv: string;

    // Logging configuration
    logLevel: string;
    logToFile: boolean;
    logToConsole: boolean;
    logMaxSize: string;
    logMaxFiles: string;
    logDir: string;

    // AI 服务配置
    aiModel: 'alibaba' | 'ollama' | 'deepseek';  // 使用的AI模型类型
    aiModelName: string;                          // 模型名称
    aiApiEndpoint: string;                        // AI API接口地址
    aiApiKey: string;                             // AI API密钥
    aiApiStream: boolean;                         // 是否使用流式响应
    aiApiSystemPrompt: string;                    // 系统提示词
    aiApiMaxTokens: number;                       // 最大生成token数
    aiApiTemperature: number;                     // 温度参数
    aiApiTopP: number;                            // Top-p采样参数
    aiApiTopK: number;                            // Top-k采样参数
    aiApiRepeatPenalty: number;                   // 重复惩罚参数
    aiApiRepeatPenaltyFrequency: number;          // 重复惩罚频率

    // 文件上传配置
    uploadDir: string;
    maxFileSize: number;
    allowedFileTypes: string;

    // 微信配置
    wechatAppId: string;
    wechatAppSecret: string;
    wechatToken: string;
    wechatEncodingAESKey: string;

    // redis 配置
    redisHost: string;
    redisPort: number;
    redisPassword: string;
    redisDb: number;

    // minio 配置
    minioEndpoint: string;
    minioAccessKey: string;
    minioSecretKey: string;
    minioBucket: string;
}

// 创建配置对象并显式应用类型
const config: Config = {
    // 服务配置
    port: process.env.PORT || 3000,
    mongoURI: process.env.MONGODB_URI || 'mongodb://localhost:27017/ezento',
    jwtSecret: process.env.JWT_SECRET || 'your_jwt_secret_key',
    nodeEnv: process.env.NODE_ENV || 'development',

    // 日志配置
    logLevel: process.env.LOG_LEVEL || 'info',
    logToFile: process.env.LOG_TO_FILE === 'true',
    logToConsole: process.env.LOG_TO_CONSOLE !== 'false',
    logMaxSize: process.env.LOG_MAX_SIZE || '10m',
    logMaxFiles: process.env.LOG_MAX_FILES || '10',
    logDir: process.env.LOG_DIR || 'logs',

    // AI 服务配置
    aiModel: (process.env.AI_MODEL as 'alibaba' | 'ollama' | 'deepseek') || 'ollama',
    aiModelName: process.env.AI_MODEL_NAME || 'llama3',
    aiApiEndpoint: process.env.AI_API_ENDPOINT || 'http://localhost:11434/api/chat',
    aiApiKey: process.env.AI_API_KEY || '',
    aiApiStream: process.env.AI_API_STREAM === 'true',
    aiApiSystemPrompt: process.env.AI_API_SYSTEM_PROMPT || '',
    aiApiMaxTokens: parseInt(process.env.AI_API_MAX_TOKENS || '2048'),
    aiApiTemperature: parseFloat(process.env.AI_API_TEMPERATURE || '0.7'),
    aiApiTopP: parseFloat(process.env.AI_API_TOP_P || '0.95'),
    aiApiTopK: parseInt(process.env.AI_API_TOP_K || '50'),
    aiApiRepeatPenalty: parseFloat(process.env.AI_API_REPEAT_PENALTY || '1.0'),
    aiApiRepeatPenaltyFrequency: parseInt(process.env.AI_API_REPEAT_PENALTY_FREQUENCY || '100'),

    // minio 配置
    minioEndpoint: process.env.MINIO_ENDPOINT || 'localhost:9000',
    minioAccessKey: process.env.MINIO_ACCESS_KEY || 'minioadmin',
    minioSecretKey: process.env.MINIO_SECRET_KEY || 'minioadmin',
    minioBucket: process.env.MINIO_BUCKET || 'ezento',

    // 文件上传配置
    uploadDir: process.env.UPLOAD_DIR || 'uploads',
    maxFileSize: parseInt(process.env.MAX_FILE_SIZE || '1024000'), // 1MB
    allowedFileTypes: process.env.ALLOWED_FILE_TYPES || 'image/*,application/pdf',

    // 微信配置
    wechatAppId: process.env.WECHAT_APP_ID || '',
    wechatAppSecret: process.env.WECHAT_APP_SECRET || '',
    wechatToken: process.env.WECHAT_TOKEN || '',
    wechatEncodingAESKey: process.env.WECHAT_ENCODING_AES_KEY || '',
    
    // redis 配置
    redisHost: process.env.REDIS_HOST || 'localhost',
    redisPort: parseInt(process.env.REDIS_PORT || '6379'),
    redisPassword: process.env.REDIS_PASSWORD || '',
    redisDb: parseInt(process.env.REDIS_DB || '0'),
};

// 记录配置信息
configLogger.info('配置已加载，核心配置：' + 
  `\nMongoDB: ${config.mongoURI}` +
  `\nAI模型: ${config.aiModel}` +
  `\nMinIO: ${config.minioEndpoint}` +
  `\nRedis: ${config.redisHost}:${config.redisPort}`
);

export default config; 