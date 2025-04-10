import { Request, Response } from 'express';
import { ResponseUtil } from '../utils/responseUtil';
import { logger } from '../utils/logger';
import multer from 'multer';
import OCRService from '../services/ocr.service';
import MinioService from '../services/minio.service';

// 使用内存存储而不是磁盘存储，以便上传到MinIO
const storage = multer.memoryStorage();

// 文件过滤器
const fileFilter = (_req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
    // 接受的文件类型
    const allowedTypes = [
        'image/jpeg', 
        'image/png', 
        'image/gif', 
        'image/webp', 
        'application/pdf'
    ];
    
    if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('不支持的文件类型，仅支持JPEG、PNG、GIF、WEBP和PDF文件'));
    }
};

// 创建上传中间件
const upload = multer({ 
    storage, 
    fileFilter,
    limits: {
        fileSize: 10 * 1024 * 1024, // 限制文件大小（10MB）
    }
});

/**
 * 文件上传控制器
 */
class UploadController {
    /**
     * 上传单个文件到MinIO
     */
    static uploadSingleFile = [
        upload.single('file'), 
        async (req: Request, res: Response) => {
            try {
                if (!req.file) {
                     ResponseUtil.badRequest(res, '未提供文件或上传失败');
                     return;
                }
                
                // 上传文件到MinIO
                const fileInfo = await MinioService.uploadFile(req.file);
                
                logger.info(`文件上传成功到MinIO: ${fileInfo.key}`);
                
                 ResponseUtil.success(res, fileInfo);
            } catch (error: any) {
                logger.error(`文件上传失败: ${error.message}`);
                 ResponseUtil.serverError(res, `文件上传失败: ${error.message}`);
            }
        }
    ];
    
    /**
     * 上传多个文件到MinIO
     */
    static uploadMultipleFiles = [
        upload.array('files', 5), // 最多上传5个文件
        async (req: Request, res: Response) => {
            try {
                if (!req.files || (Array.isArray(req.files) && req.files.length === 0)) {
                     ResponseUtil.badRequest(res, '未提供文件或上传失败');
                     return;
                }
                
                // 上传文件到MinIO
                const filesInfo = await MinioService.uploadMultipleFiles(req.files as Express.Multer.File[]);
                
                logger.info(`多文件上传成功到MinIO，共${filesInfo.length}个文件`);
                
                 ResponseUtil.success(res, filesInfo);
            } catch (error: any) {
                logger.error(`多文件上传失败: ${error.message}`);
                 ResponseUtil.serverError(res, `多文件上传失败: ${error.message}`);
            }
        }
    ];
    
    /**
     * 上传医疗报告文件到MinIO并进行OCR识别
     */
    static uploadAndProcessReport = [
        upload.single('report'), 
        async (req: Request, res: Response) => {
            try {
                if (!req.file) {
                     ResponseUtil.badRequest(res, '未提供报告文件或上传失败');
                     return;
                }
                
                // 上传文件到MinIO
                const fileInfo = await MinioService.uploadFile(req.file, 'reports');
                
                logger.info(`开始对医疗报告进行OCR处理: ${fileInfo.key}`);
                
                try {
                    // 从URL获取临时文件进行OCR处理
                    const extractedText = await OCRService.processReportBuffer(req.file.buffer);
                    
                    // OCR处理成功后，删除MinIO中的文件
                    await MinioService.deleteFile(fileInfo.key);
                    logger.info(`OCR处理完成，已删除MinIO报告文件: ${fileInfo.key}`);
                    
                    // 构造响应数据
                    const reportData = {
                        ocrResult: extractedText,
                        processed: true,
                        originalFilename: fileInfo.originalname,
                        size: fileInfo.size,
                        mimeType: fileInfo.mimetype
                    };
                    
                    logger.info(`医疗报告OCR处理成功，提取文本长度: ${extractedText.length}`);
                    
                     ResponseUtil.success(res, reportData);
                } catch (ocrError: any) {
                    // OCR处理失败，也删除MinIO中的文件
                    await MinioService.deleteFile(fileInfo.key).catch(deleteError => {
                        logger.error(`删除MinIO文件失败: ${deleteError.message}`);
                    });
                    
                    throw ocrError;
                }
            } catch (error: any) {
                logger.error(`医疗报告处理失败: ${error.message}`);
                 ResponseUtil.serverError(res, `医疗报告处理失败: ${error.message}`);
            }
        }
    ];
    
    /**
     * 从MinIO删除文件
     */
    static deleteFile = async (req: Request, res: Response) => {
        try {
            const { bucket, key } = req.body;
            
            if (!key) {
                 ResponseUtil.badRequest(res, '未提供文件路径');
                 return;
            }
            
            // 从MinIO删除文件
            await MinioService.deleteFile(key, bucket);
            
            logger.info(`文件从MinIO删除成功: ${bucket}/${key}`);
            
             ResponseUtil.success(res, { message: '文件删除成功' });
        } catch (error: any) {
            logger.error(`文件删除失败: ${error.message}`);
             ResponseUtil.serverError(res, `文件删除失败: ${error.message}`);
        }
    };
}

export default UploadController; 