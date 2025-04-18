import winston from 'winston';
import path from 'path';
import fs from 'fs';

// Create logs directory if it doesn't exist
const logDir = path.join(process.cwd(), 'logs');
if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir);
}

// Define log format
const logFormat = winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.printf(({ timestamp, level, message }) => {
        return `[${timestamp}] ${level.toUpperCase()}: ${message}`;
    })
);

// Create logger instance
export const logger = winston.createLogger({
    level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
    format: logFormat,
    transports: [
        // Console logger
        new winston.transports.Console({
            format: winston.format.combine(winston.format.colorize(), logFormat),
        }),
        // Error log file
        new winston.transports.File({
            filename: path.join(logDir, 'error.log'),
            level: 'error',
        }),
        // Combined log file
        new winston.transports.File({
            filename: path.join(logDir, 'combined.log'),
        }),
    ],
});

// Log uncaught exceptions
winston.exceptions.handle(
    new winston.transports.File({
        filename: path.join(logDir, 'exceptions.log'),
    })
);

// Log unhandled promise rejections
process.on('unhandledRejection', ex => {
    throw ex;
});

export default logger;
