import { Response } from 'express';

export class ResponseUtil {
    static success(res: Response, data: any = {}) {
        return res.status(200).json({
            success: true,
            code: 200,
            msg: 'success',
            data
        });
    }

    static created(res: Response, data: any = {}) {
        return res.status(201).json({
            success: true,
            code: 200,
            msg: 'success',
            data
        });
    }

    static badRequest(res: Response, message: string = 'Bad request') {
        return res.status(400).json({
            success: false,
            code: 400,
            msg: 'error',
            error: {
                message
            }
        });
    }

    static unauthorized(res: Response, message: string = 'Unauthorized') {
        return res.status(401).json({
            success: false,
            code: 401,
            msg: 'error',
            error: {
                message
            }
        });
    }

    static forbidden(res: Response, message: string = 'Forbidden') {
        return res.status(403).json({
            success: false,
            code: 403,
            msg: 'error',
            error: {
                message
            }
        });
    }

    static notFound(res: Response, message: string = 'Not found') {
        return res.status(404).json({
            success: false,
            code: 404,
            msg: 'error',
            error: {
                message
            }
        });
    }

    static conflict(res: Response, message: string = 'Conflict') {
        return res.status(409).json({
            success: false,
            code: 409,
            msg: 'error',
            error: {
                message
            }
        });
    }

    static serverError(res: Response, message: string = 'Internal server error') {
        return res.status(500).json({
            success: false,
            code: 500,
            msg: 'error',
            error: {
                message
            }
        });
    }
} 