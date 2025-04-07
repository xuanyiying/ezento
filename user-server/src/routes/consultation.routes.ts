import express from 'express';
import ConsultationController from '../controllers/consultation.controller';
import { auth, tenantAuth } from '../middlewares/auth';

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Consultation
 *   description: 咨询管理接口
 */

/**
 * @swagger
 * /consultations:
 *   post:
 *     summary: 创建新的咨询
 *     description: 创建患者与医生之间的新咨询会话
 *     tags: [Consultation]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - patientId
 *               - doctorId
 *             properties:
 *               patientId:
 *                 type: string
 *                 description: 患者ID
 *               doctorId:
 *                 type: string
 *                 description: 医生ID
 *               initialMessage:
 *                 type: string
 *                 description: 初始消息内容
 *     responses:
 *       201:
 *         description: 咨询创建成功
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     consultationId:
 *                       type: string
 *       400:
 *         description: 请求参数错误
 *       500:
 *         description: 服务器错误
 */
router.post('/', [auth, tenantAuth], ConsultationController.createConsultation);

/**
 * @swagger
 * /consultations/{id}:
 *   get:
 *     summary: 获取咨询详情
 *     description: 根据咨询ID获取咨询的详细信息
 *     tags: [Consultation]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: 咨询ID
 *     responses:
 *       200:
 *         description: 成功获取咨询详情
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     _id:
 *                       type: string
 *                     patientId:
 *                       type: string
 *                     doctorId:
 *                       type: string
 *                     symptoms:
 *                       type: string
 *                     diagnosis:
 *                       type: string
 *                     prescription:
 *                       type: string
 *                     notes:
 *                       type: string
 *                     fee:
 *                       type: number
 *                     status:
 *                       type: string
 *                       enum: [waiting, in-progress, completed, cancelled]
 *                     startTime:
 *                       type: string
 *                       format: date-time
 *                     endTime:
 *                       type: string
 *                       format: date-time
 *                     aiSuggestion:
 *                       type: string
 *       400:
 *         description: 无效的咨询ID
 *       404:
 *         description: 咨询不存在
 *       500:
 *         description: 服务器错误
 */
router.get('/:id', [auth, tenantAuth], ConsultationController.getConsultationDetails);

/**
 * @swagger
 * /consultations/{id}/messages:
 *   post:
 *     summary: 在咨询中发送消息
 *     description: 在指定咨询中发送新消息
 *     tags: [Consultation]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: 咨询ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - content
 *             properties:
 *               content:
 *                 type: string
 *                 description: 消息内容
 *               messageType:
 *                 type: string
 *                 enum: [text, image, audio, video]
 *                 default: text
 *                 description: 消息类型
 *     responses:
 *       201:
 *         description: 消息发送成功
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     messageId:
 *                       type: string
 *       400:
 *         description: 请求参数错误
 *       404:
 *         description: 咨询不存在
 *       500:
 *         description: 服务器错误
 */
router.post('/:id/messages', [auth, tenantAuth], ConsultationController.sendMessage);

/**
 * @swagger
 * /consultations/{id}/messages:
 *   get:
 *     summary: 获取咨询消息列表
 *     description: 获取指定咨询的所有消息
 *     tags: [Consultation]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: 咨询ID
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: 页码
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *         description: 每页消息数量
 *     responses:
 *       200:
 *         description: 成功获取消息列表
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     messages:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           _id:
 *                             type: string
 *                           consultationId:
 *                             type: string
 *                           senderId:
 *                             type: string
 *                           senderType:
 *                             type: string
 *                             enum: [patient, doctor, ai]
 *                           content:
 *                             type: string
 *                           messageType:
 *                             type: string
 *                             enum: [text, image, audio, video]
 *                           createdAt:
 *                             type: string
 *                             format: date-time
 *                     totalPages:
 *                       type: integer
 *                     currentPage:
 *                       type: integer
 *                     totalMessages:
 *                       type: integer
 *       400:
 *         description: 无效的咨询ID
 *       404:
 *         description: 咨询不存在
 *       500:
 *         description: 服务器错误
 */
router.get('/:id/messages', [auth, tenantAuth], ConsultationController.getMessages);

/**
 * @swagger
 * /consultations/{id}/end:
 *   put:
 *     summary: 结束咨询
 *     description: 将咨询状态标记为已完成
 *     tags: [Consultation]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: 咨询ID
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               diagnosis:
 *                 type: string
 *                 description: 诊断结果
 *               prescription:
 *                 type: string
 *                 description: 处方信息
 *               notes:
 *                 type: string
 *                 description: 医生备注
 *     responses:
 *       200:
 *         description: 咨询成功结束
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     consultationId:
 *                       type: string
 *                     status:
 *                       type: string
 *                       enum: [completed]
 *                     endTime:
 *                       type: string
 *                       format: date-time
 *       400:
 *         description: 无效的咨询ID
 *       404:
 *         description: 咨询不存在
 *       500:
 *         description: 服务器错误
 */
router.put('/:id/end', [auth, tenantAuth], ConsultationController.endConsultation);

/**
 * @swagger
 * /consultations/{id}/ai-response:
 *   post:
 *     summary: 获取AI响应
 *     description: 根据咨询内容获取AI生成的建议或回复
 *     tags: [Consultation]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: 咨询ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - prompt
 *             properties:
 *               prompt:
 *                 type: string
 *                 description: 提示信息或问题
 *     responses:
 *       200:
 *         description: 成功获取AI响应
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     response:
 *                       type: string
 *                       description: AI生成的响应内容
 *       400:
 *         description: 无效的咨询ID或请求参数
 *       404:
 *         description: 咨询不存在
 *       500:
 *         description: 服务器错误
 */
router.post('/:id/ai-response', [auth, tenantAuth], ConsultationController.getAIResponse);

export default router;