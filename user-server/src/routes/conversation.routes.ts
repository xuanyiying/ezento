import express from 'express';
import ConversationController from '../controllers/conversation.controller';
import { auth } from '../middlewares';

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Conversation
 *   description: 多轮对话管理接口
 */

/**
 * @swagger
 * /api/conversation:
 *   post:
 *     summary: 创建或获取会话
 *     description: 创建新的会话或获取已存在的会话
 *     tags: [Conversation]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - conversationType
 *               - referenceId
 *             properties:
 *               conversationType:
 *                 type: string
 *                 enum: [PRE_DIAGNOSIS, GUIDE, REPORT]
 *                 description: 会话类型
 *               referenceId:
 *                 type: string
 *                 description: 关联ID（预问诊ID、导诊ID或报告ID）
 *               initialMessage:
 *                 type: string
 *                 description: 初始系统消息
 *     responses:
 *       200:
 *         description: 会话创建或获取成功
 *       400:
 *         description: 请求参数错误
 *       500:
 *         description: 服务器错误
 */
router.post('/', auth, ConversationController.createOrGetConversation);

/**
 * @swagger
 * /api/conversation/{conversationId}/messages:
 *   post:
 *     summary: 发送消息
 *     description: 向会话添加新消息
 *     tags: [Conversation]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: conversationId
 *         required: true
 *         schema:
 *           type: string
 *         description: 会话ID
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
 *               metadata:
 *                 type: object
 *                 description: 元数据信息
 *     responses:
 *       200:
 *         description: 消息发送成功
 *       400:
 *         description: 请求参数错误
 *       500:
 *         description: 服务器错误
 */
router.post('/:conversationId/messages', auth, ConversationController.addMessage);

/**
 * @swagger
 * /api/conversation/{conversationType}/{referenceId}/history:
 *   get:
 *     summary: 获取会话历史
 *     description: 获取指定类型和关联ID的会话历史记录
 *     tags: [Conversation]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: conversationType
 *         required: true
 *         schema:
 *           type: string
 *           enum: [PRE_DIAGNOSIS, GUIDE, REPORT]
 *         description: 会话类型
 *       - in: path
 *         name: referenceId
 *         required: true
 *         schema:
 *           type: string
 *         description: 关联ID
 *     responses:
 *       200:
 *         description: 成功获取会话历史
 *       400:
 *         description: 请求参数错误
 *       404:
 *         description: 会话不存在
 *       500:
 *         description: 服务器错误
 */
router.get('/:conversationType/:referenceId/history', auth, ConversationController.getConversationHistory);

/**
 * @swagger
 * /api/conversation/{conversationId}/close:
 *   put:
 *     summary: 关闭会话
 *     description: 关闭指定的会话
 *     tags: [Conversation]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: conversationId
 *         required: true
 *         schema:
 *           type: string
 *         description: 会话ID
 *     responses:
 *       200:
 *         description: 会话成功关闭
 *       400:
 *         description: 请求参数错误
 *       404:
 *         description: 会话不存在
 *       500:
 *         description: 服务器错误
 */
router.put('/:conversationId/close', auth, ConversationController.closeConversation);

/**
 * @swagger
 * /api/conversation/{conversationId}/export:
 *   get:
 *     summary: 导出会话历史
 *     description: 导出会话历史记录为PDF或文本文件
 *     tags: [Conversation]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: conversationId
 *         required: true
 *         schema:
 *           type: string
 *         description: 会话ID
 *       - in: query
 *         name: format
 *         schema:
 *           type: string
 *           enum: [PDF, TEXT]
 *           default: PDF
 *         description: 导出格式
 *     responses:
 *       200:
 *         description: 成功导出会话历史
 *       400:
 *         description: 请求参数错误
 *       404:
 *         description: 会话不存在
 *       500:
 *         description: 服务器错误
 */
router.get('/:conversationId/export', auth, ConversationController.exportConversation);

/**
 * @swagger
 * /api/conversation/download:
 *   get:
 *     summary: 下载导出文件
 *     description: 下载已导出的会话历史文件
 *     tags: [Conversation]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: path
 *         required: true
 *         schema:
 *           type: string
 *         description: 文件路径
 *     responses:
 *       200:
 *         description: 文件下载成功
 *       400:
 *         description: 请求参数错误
 *       404:
 *         description: 文件不存在
 *       500:
 *         description: 服务器错误
 */
router.get('/download', auth, ConversationController.downloadExportedFile);

export default router; 