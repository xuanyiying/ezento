import winston from 'winston';

const { format, transports } = winston;
const { combine, timestamp, printf, colorize } = format;

// 自定义日志格式
const logFormat = printf(({ level, message, timestamp, ...meta }) => {
    return `${timestamp} ${level}: ${message} ${
        Object.keys(meta).length ? JSON.stringify(meta) : ''
    }`;
});

// 创建日志记录器
export const logger = winston.createLogger({
    level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
    format: combine(timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }), logFormat),
    transports: [
        // 控制台输出
        new transports.Console({
            format: combine(colorize(), timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }), logFormat),
        }),
        // 文件输出 - 错误日志
        new transports.File({
            filename: 'logs/error.log',
            level: 'error',
            maxsize: 5242880, // 5MB
            maxFiles: 5,
        }),
        // 文件输出 - 所有日志
        new transports.File({
            filename: 'logs/combined.log',
            maxsize: 5242880, // 5MB
            maxFiles: 5,
        }),
    ],
    exceptionHandlers: [new transports.File({ filename: 'logs/exceptions.log' })],
});

// 添加请求记录方法
export const logRequest = (req: any, message: string, meta?: any) => {
    const logData = {
        requestId: req.id,
        path: req.path,
        method: req.method,
        tenantId: req.tenantId,
        userId: req.user?.id,
        ...meta,
    };

    logger.info(message, logData);
};

// 添加错误记录方法
export const logError = (req: any, error: any, message?: string) => {
    const logData = {
        requestId: req.id,
        path: req.path,
        method: req.method,
        tenantId: req.tenantId,
        userId: req.user?.id,
        errorMessage: error.message,
        stack: error.stack,
    };

    logger.error(message || 'Request error', logData);
};
