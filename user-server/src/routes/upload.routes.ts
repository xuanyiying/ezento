import express from 'express';
import UploadController from '../controllers/upload.controller';
import { auth } from '../middlewares/auth';

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Upload
 *   description: 文件上传相关接口
 */

/**
 * @swagger
 * /upload/file:
 *   post:
 *     tags: [Upload]
 *     summary: 上传单个文件到MinIO
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: 上传成功
 */
router.post('/file', auth, UploadController.uploadSingleFile);

/**
 * @swagger
 * /upload/files:
 *   post:
 *     tags: [Upload]
 *     summary: 上传多个文件到MinIO
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               files:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *     responses:
 *       200:
 *         description: 上传成功
 */
router.post('/files', auth, UploadController.uploadMultipleFiles);

/**
 * @swagger
 * /upload/report:
 *   post:
 *     tags: [Upload]
 *     summary: 上传医疗报告并OCR处理
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               report:
 *                 type: string
 *                 format: binary
 *               reportType:
 *                 type: string
 *               description:
 *                 type: string
 *     responses:
 *       200:
 *         description: 上传并处理成功
 */
router.post('/report', auth, UploadController.uploadAndProcessReport);

/**
 * @swagger
 * /upload/file:
 *   delete:
 *     tags: [Upload]
 *     summary: 删除文件
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: fileUrl
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: 删除成功
 */
router.delete('/file', auth, UploadController.deleteFile);

export default router; 