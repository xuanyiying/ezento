import winston from 'winston';
import path from 'path';

// Create logs directory if it doesn't exist
import fs from 'fs';
const logsDir = path.join(__dirname, '../../logs');
if (!fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir);
}

// 自定义时间格式
const timezoneFormat = () => {
    return new Date().toLocaleString('zh-CN', {
        timeZone: 'Asia/Shanghai',
    });
};

const logger = winston.createLogger({
    level: 'info',
    format: winston.format.combine(
        winston.format.timestamp({
            format: timezoneFormat,
        }),
        winston.format.printf(({ level, message, timestamp }) => {
            return `${timestamp} ${level}: ${message}`;
        })
    ),
    defaultMeta: { service: 'ezento-api' },
    transports: [
        new winston.transports.File({
            filename: path.join(logsDir, 'error.log'),
            level: 'error',
        }),
        new winston.transports.File({
            filename: path.join(logsDir, 'combined.log'),
        }),
    ],
});

if (process.env.NODE_ENV !== 'production') {
    logger.add(
        new winston.transports.Console({
            format: winston.format.combine(
                winston.format.colorize(),
                winston.format.timestamp({
                    format: timezoneFormat,
                }),
                winston.format.printf(({ level, message, timestamp }) => {
                    return `${timestamp} ${level}: ${message}`;
                })
            ),
        })
    );
}

export default logger;
