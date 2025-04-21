import express from 'express';
import ConsultationController from '../controllers/consultation.controller';
import { auth } from '../middlewares/auth';
const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Consultation
 *   description: 会诊管理相关接口
 */

/**
 * @swagger
 * /consultationss:
 *   post:
 *     tags: [Consultation]
 *     summary: 创建新的会诊
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - type
 *               - symptoms
 *               - fee
 *             properties:
 *               type:
 *                 type: string
 *                 enum: [DIAGNOSIS, GUIDE, REPORT]
 *               symptoms:
 *                 type: string
 *               bodyParts:
 *                 type: array
 *                 items:
 *                   type: string
 *               duration:
 *                 type: string
 *               existingConditions:
 *                 type: array
 *                 items:
 *                   type: string
 *               fee:
 *                 type: number
 *     responses:
 *       200:
 *         description: 创建成功
 */
router.post('/', auth, ConsultationController.createConsultation);

/**
 * @swagger
 * /consultations:
 *   get:
 *     tags: [Consultation]
 *     summary: 获取会诊列表
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: userId
 *         schema:
 *           type: string
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [DIAGNOSIS, GUIDE, REPORT_INTERPRETATION]
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [PENDING, IN_PROGRESS, COMPLETED, CANCELLED]
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: 获取成功
 */
router.get('/', auth, ConsultationController.getConsultationList);

/**
 * @swagger
 * /consultations/{id}:
 *   get:
 *     tags: [Consultation]
 *     summary: 获取会诊详情
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: 获取成功
 */
router.get('/:id', auth, ConsultationController.getConsultationDetails);

/**
 * @swagger
 * /consultations/{id}:
 *   put:
 *     tags: [Consultation]
 *     summary: 更新会诊
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               diagnosis:
 *                 type: string
 *               prescription:
 *                 type: string
 *               notes:
 *                 type: string
 *               status:
 *                 type: string
 *                 enum: [PENDING, IN_PROGRESS, COMPLETED, CANCELLED]
 *               endTime:
 *                 type: string
 *                 format: date-time
 *     responses:
 *       200:
 *         description: 更新成功
 */
router.put('/:id', auth, ConsultationController.updateConsultation);

export default router;
