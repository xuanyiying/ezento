import { Response } from 'express';

/**
 * 响应工具类 - 用于标准化API响应格式
 */
export class ResponseUtil {
    /**
     * 成功响应
     * @param res Express响应对象
     * @param data 响应数据
     * @param message 成功消息，默认为"操作成功"
     * @param statusCode HTTP状态码，默认200
     */
    static success(
        res: Response,
        data: any = null,
        message: string = '操作成功',
        statusCode: number = 200
    ): Response {
        return res.status(statusCode).json({
            success: true,
            message,
            data,
        });
    }

    /**
     * 创建成功响应
     * @param res Express响应对象
     * @param data 创建的资源数据
     * @param message 成功消息，默认为"创建成功"
     */
    static created(res: Response, data: any = null, message: string = '创建成功'): Response {
        return ResponseUtil.success(res, data, message, 201);
    }

    /**
     * 错误请求响应
     */
    static badRequest(res: Response, message: string = '请求参数错误'): Response {
        return res.status(400).json({
            success: false,
            message,
        });
    }

    /**
     * 未授权响应
     * @param res Express响应对象
     * @param message 错误消息，默认为"未授权"
     */
    static unauthorized(res: Response, message: string = '未授权'): Response {
        return res.status(401).json({
            success: false,
            message,
            data: null,
        });
    }

    /**
     * 禁止访问响应
     * @param res Express响应对象
     * @param message 错误消息，默认为"禁止访问"
     */
    static forbidden(res: Response, message: string = '禁止访问'): Response {
        return res.status(403).json({
            success: false,
            message,
            data: null,
        });
    }

    /**
     * 未找到响应
     * @param res Express响应对象
     * @param message 错误消息，默认为"未找到资源"
     */
    static notFound(res: Response, message: string = '未找到资源'): Response {
        return res.status(404).json({
            success: false,
            message,
            data: null,
        });
    }

    /**
     * 服务器错误响应
     * @param res Express响应对象
     * @param message 错误消息，默认为"服务器内部错误"
     */
    static serverError(res: Response, message: string = '服务器内部错误'): Response {
        return res.status(500).json({
            success: false,
            message,
            data: null,
        });
    }

    /**
     * 自定义错误响应
     * @param res Express响应对象
     * @param statusCode HTTP状态码
     * @param message 错误消息
     * @param data 可选的额外数据
     */
    static error(res: Response, statusCode: number, message: string, data: any = null): Response {
        return res.status(statusCode).json({
            success: false,
            message,
            data,
        });
    }
}
