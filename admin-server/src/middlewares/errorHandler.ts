import { Request, Response, NextFunction } from 'express';

export class ApiError extends Error {
    constructor(
        public statusCode: number,
        message: string
    ) {
        super(message);
        this.name = 'ApiError';
    }
}

export const errorHandler = (
    err: Error | ApiError,
    req: Request,
    res: Response,
    next: NextFunction
) => {
    if (err instanceof ApiError) {
        return res.status(err.statusCode).json({
            status: 'error',
            message: err.message,
        });
    }

    // 处理其他类型的错误
    console.error('Error:', err);
    return res.status(500).json({
        status: 'error',
        message: '服务器内部错误',
    });
};
