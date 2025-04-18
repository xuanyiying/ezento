import { Request, Response, NextFunction } from 'express';
import logger from '../config/logger';

// Define ErrorResponse interface
interface ErrorResponse extends Error {
    statusCode?: number;
}

// Not found middleware
export const notFound = (req: Request, res: Response, next: NextFunction) => {
    const error = new Error(`Not Found - ${req.originalUrl}`);
    res.status(404);
    next(error);
};

// Error handling middleware
export const errorHandler = (
    err: ErrorResponse,
    req: Request,
    res: Response,
    next: NextFunction
) => {
    const statusCode = err.statusCode || res.statusCode === 200 ? 500 : res.statusCode;

    logger.error(`Error: ${err.message}, Stack: ${err.stack}, URL: ${req.originalUrl}`);

    res.status(statusCode).json({
        error: {
            message: err.message,
            stack: process.env.NODE_ENV === 'production' ? '🥞' : err.stack,
        },
    });
};
