import { Response } from 'express';

/**
 * 统一响应工具类
 * 提供标准化的API响应格式和便捷的响应方法
 */
export class ResponseHelper {
    /**
     * 标准响应对象
     */
    private static formatResponse(success: boolean, message: string, data: any = null, statusCode: number = 200, pagination?: { total: number; page: number; limit: number }) {
        const response: any = {
            success,
            message,
            data,
        };

        if (pagination) {
            response.pagination = pagination;
        }

        return response;
    }

    /**
     * 成功响应
     * @param res Express响应对象
     * @param data 响应数据
     * @param message 成功消息，默认为"操作成功"
     * @param statusCode HTTP状态码，默认200
     */
    static success(res: Response, data: any = null, message: string = '操作成功', statusCode: number = 200): Response {
        return res.status(statusCode).json(this.formatResponse(true, message, data));
    }

    /**
     * 分页响应
     * @param res Express响应对象
     * @param data 响应数据
     * @param pagination 分页信息
     * @param message 成功消息，默认为"操作成功"
     */
    static pagination(res: Response, data: any, pagination: { total: number; page: number; limit: number }, message: string = '操作成功'): Response {
        return res.status(200).json(this.formatResponse(true, message, data, 200, pagination));
    }

    /**
     * 创建成功响应
     * @param res Express响应对象
     * @param data 创建的资源数据
     * @param message 成功消息，默认为"创建成功"
     */
    static created(res: Response, data: any = null, message: string = '创建成功'): Response {
        return res.status(201).json(this.formatResponse(true, message, data, 201));
    }

    /**
     * 错误请求响应
     * @param res Express响应对象
     * @param message 错误消息，默认为"请求参数错误"
     * @param details 错误详情（可选）
     */
    static badRequest(res: Response, message: string = '请求参数错误', details?: any): Response {
        return res.status(400).json(this.formatResponse(false, message, details));
    }

    /**
     * 未授权响应
     * @param res Express响应对象
     * @param message 错误消息，默认为"未授权访问"
     */
    static unauthorized(res: Response, message: string = '未授权访问'): Response {
        return res.status(401).json(this.formatResponse(false, message));
    }

    /**
     * 禁止访问响应
     * @param res Express响应对象
     * @param message 错误消息，默认为"禁止访问"
     */
    static forbidden(res: Response, message: string = '禁止访问'): Response {
        return res.status(403).json(this.formatResponse(false, message));
    }

    /**
     * 未找到响应
     * @param res Express响应对象
     * @param message 错误消息，默认为"未找到资源"
     */
    static notFound(res: Response, message: string = '未找到资源'): Response {
        return res.status(404).json(this.formatResponse(false, message));
    }

    /**
     * 资源冲突响应
     * @param res Express响应对象
     * @param message 错误消息，默认为"资源冲突"
     */
    static conflict(res: Response, message: string = '资源冲突'): Response {
        return res.status(409).json(this.formatResponse(false, message));
    }

    /**
     * 请求超时响应
     * @param res Express响应对象
     * @param message 错误消息，默认为"请求超时"
     */
    static timeout(res: Response, message: string = '请求超时'): Response {
        return res.status(408).json(this.formatResponse(false, message));
    }

    /**
     * 服务器错误响应
     * @param res Express响应对象
     * @param message 错误消息，默认为"服务器内部错误"
     * @param details 错误详情（可选）
     */
    static serverError(res: Response, message: string = '服务器内部错误', details?: any): Response {
        return res.status(500).json(this.formatResponse(false, message, details));
    }

    /**
     * 自定义错误响应
     * @param res Express响应对象
     * @param statusCode HTTP状态码
     * @param message 错误消息
     * @param data 可选的额外数据
     */
    static error(res: Response, statusCode: number, message: string, data: any = null): Response {
        return res.status(statusCode).json(this.formatResponse(false, message, data));
    }
}