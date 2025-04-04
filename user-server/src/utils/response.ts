import { Response } from 'express';

export interface R<T = any> {
    code: number;
    msg: string;
    data: T;
    pagination?: {
        total: number;
        page: number;
        limit: number;
    };
}

export class Resp {
    // 成功响应
    static ok<T>(data: T, msg: string = 'success'): R<T> {
        return {
            code: 200,
            msg,
            data
        };
    }

    // 分页响应
    static pagination<T>(data: T, pagination: { total: number; page: number; limit: number }): R<T> {
        return {
            code: 200,
            msg: 'success',
            data,
            pagination
        };
    }

    // 失败响应
    static fail(msg: string = 'failed', code: number = 500): R<null> {
        return {
            code,
            msg,
            data: null
        };
    }

    // 错误响应
    static error<T>(msg: string = 'error', data?: T | null): R<T | null> {
        return {
            code: 500,
            msg,
            data: data ?? null
        };
    }

    // 未授权响应
    static unauthorized(msg: string = 'unauthorized'): R<null> {
        return {
            code: 401,
            msg,
            data: null
        };
    }

    // 参数错误响应
    static badRequest(msg: string = 'bad request'): R<null> {
        return {
            code: 400,
            msg,
            data: null
        };
    }

    // 资源不存在响应
    static notFound(msg: string = 'not found'): R<null> {
        return {
            code: 404,
            msg,
            data: null
        };
    }
}

/**
 * 成功响应
 * @param res Express响应对象
 * @param data 响应数据
 * @param statusCode HTTP状态码，默认200
 */
export const successResponse = (res: Response, data: any, statusCode: number = 200): void => {
    res.status(statusCode).json({
        success: true,
        data,
        error: null
    });
};

/**
 * 错误响应
 * @param res Express响应对象
 * @param message 错误消息
 * @param statusCode HTTP状态码，默认400
 * @param details 错误详情（可选）
 */
export const errorResponse = (res: Response, message: string, statusCode: number = 400, details?: any): void => {
    res.status(statusCode).json({
        success: false,
        data: null,
        error: {
            message,
            details: details || null
        }
    });
};

/**
 * 未找到资源响应
 * @param res Express响应对象
 * @param message 错误消息，默认"资源不存在"
 */
export const notFoundResponse = (res: Response, message: string = '资源不存在'): void => {
    errorResponse(res, message, 404);
};

/**
 * 未授权响应
 * @param res Express响应对象
 * @param message 错误消息，默认"未授权访问"
 */
export const unauthorizedResponse = (res: Response, message: string = '未授权访问'): void => {
    errorResponse(res, message, 401);
};

/**
 * 禁止访问响应
 * @param res Express响应对象
 * @param message 错误消息，默认"禁止访问"
 */
export const forbiddenResponse = (res: Response, message: string = '禁止访问'): void => {
    errorResponse(res, message, 403);
};

/**
 * 服务器内部错误响应
 * @param res Express响应对象
 * @param message 错误消息，默认"服务器内部错误"
 */
export const serverErrorResponse = (res: Response, message: string = '服务器内部错误'): void => {
    errorResponse(res, message, 500);
};

/**
 * 资源冲突响应
 * @param res Express响应对象
 * @param message 错误消息，默认"资源冲突"
 */
export const conflictResponse = (res: Response, message: string = '资源冲突'): void => {
    errorResponse(res, message, 409);
};

/**
 * 请求超时响应
 * @param res Express响应对象
 * @param message 错误消息，默认"请求超时"
 */
export const timeoutResponse = (res: Response, message: string = '请求超时'): void => {
    errorResponse(res, message, 408);
};

/**
 * 请求格式无效响应
 * @param res Express响应对象
 * @param message 错误消息，默认"请求格式无效"
 */
export const badRequestResponse = (res: Response, message: string = '请求格式无效'): void => {
    errorResponse(res, message, 400);
}; 