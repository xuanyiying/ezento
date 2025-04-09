import express from 'express';
import UploadController from '../controllers/upload.controller';
import { auth } from '../middlewares/auth';

const router = express.Router();

/**
 * 文件上传路由
 */

// 上传单个文件到MinIO
router.post('/file', auth, UploadController.uploadSingleFile);

// 上传多个文件到MinIO
router.post('/files', auth, UploadController.uploadMultipleFiles);

// 上传医疗报告并OCR处理
router.post('/report', auth, UploadController.uploadAndProcessReport);

// 删除文件
router.delete('/file', auth, UploadController.deleteFile);

export default router; 