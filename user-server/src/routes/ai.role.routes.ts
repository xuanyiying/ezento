import express from 'express';
import RoleController from '../controllers/ai.role.controller';
import { auth } from '../middlewares';

/**
 * @swagger
 * tags:
 *   name: Roles
 *   description: 角色管理接口
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     Role:
 *       type: object
 *       required:
 *         - type
 *         - title
 *         - description
 *         - systemPrompt
 *       properties:
 *         id:
 *           type: string
 *           description: 角色ID
 *         type:
 *           type: string
 *           description: 角色类型
 *         title:
 *           type: string
 *           description: 角色标题
 *         description:
 *           type: string
 *           description: 角色描述
 *         systemPrompt:
 *           type: string
 *           description: 系统提示词
 *         status:
 *           type: string
 *           enum: [active, inactive]
 *           description: 角色状态
 *         order:
 *           type: number
 *           description: 排序顺序
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: 创建时间
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: 最后更新时间
 */

const router = express.Router();

/**
 * @swagger
 * /roles:
 *   get:
 *     summary: 获取所有角色列表
 *     description: 获取系统中所有可用的角色信息列表
 *     tags: [Roles]
 *     parameters:
 *       - in: query
 *         name: refresh
 *         schema:
 *           type: boolean
 *         description: 是否强制刷新缓存
 *     responses:
 *       200:
 *         description: 成功获取角色列表
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     total:
 *                       type: number
 *                       description: 角色总数
 *                     roles:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Role'
 *       500:
 *         description: 服务器错误
 */
router.get('/', RoleController.getAllRoles);

/**
 * @swagger
 * /roles/{id}:
 *   get:
 *     summary: 根据ID获取角色详情
 *     description: 获取指定ID的角色详细信息
 *     tags: [Roles]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: 角色ID
 *       - in: query
 *         name: refresh
 *         schema:
 *           type: boolean
 *         description: 是否强制刷新缓存
 *     responses:
 *       200:
 *         description: 成功获取角色详情
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Role'
 *       404:
 *         description: 角色不存在
 *       500:
 *         description: 服务器错误
 */
router.get('/:id', RoleController.getRoleById);

/**
 * @swagger
 * /roles/type/{type}:
 *   get:
 *     summary: 根据类型获取角色详情
 *     description: 获取指定类型的角色详细信息
 *     tags: [Roles]
 *     parameters:
 *       - in: path
 *         name: type
 *         required: true
 *         schema:
 *           type: string
 *         description: 角色类型
 *       - in: query
 *         name: refresh
 *         schema:
 *           type: boolean
 *         description: 是否强制刷新缓存
 *     responses:
 *       200:
 *         description: 成功获取角色详情
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Role'
 *       404:
 *         description: 角色不存在
 *       500:
 *         description: 服务器错误
 */
router.get('/type/:type', RoleController.getRoleByType);

/**
 * @swagger
 * /roles:
 *   post:
 *     summary: 创建新角色
 *     description: 创建一个新的角色
 *     tags: [Roles]
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
 *               - title
 *               - description
 *               - systemPrompt
 *             properties:
 *               type:
 *                 type: string
 *                 description: 角色类型
 *               title:
 *                 type: string
 *                 description: 角色标题
 *               description:
 *                 type: string
 *                 description: 角色描述
 *               systemPrompt:
 *                 type: string
 *                 description: 系统提示词
 *               status:
 *                 type: string
 *                 enum: [active, inactive]
 *                 description: 角色状态
 *               order:
 *                 type: number
 *                 description: 排序顺序
 *     responses:
 *       201:
 *         description: 角色创建成功
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Role'
 *       400:
 *         description: 请求参数错误
 *       401:
 *         description: 未授权
 *       500:
 *         description: 服务器错误
 */
router.post('/', auth, RoleController.createRole);

/**
 * @swagger
 * /roles/{id}:
 *   put:
 *     summary: 更新角色
 *     description: 更新指定ID的角色信息
 *     tags: [Roles]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: 角色ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *                 description: 角色标题
 *               description:
 *                 type: string
 *                 description: 角色描述
 *               systemPrompt:
 *                 type: string
 *                 description: 系统提示词
 *               status:
 *                 type: string
 *                 enum: [active, inactive]
 *                 description: 角色状态
 *               order:
 *                 type: number
 *                 description: 排序顺序
 *     responses:
 *       200:
 *         description: 角色更新成功
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Role'
 *       400:
 *         description: 请求参数错误
 *       401:
 *         description: 未授权
 *       404:
 *         description: 角色不存在
 *       500:
 *         description: 服务器错误
 */
router.put('/:id', auth, RoleController.updateRole);

/**
 * @swagger
 * /roles/{id}:
 *   delete:
 *     summary: 删除角色
 *     description: 删除指定ID的角色
 *     tags: [Roles]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: 角色ID
 *     responses:
 *       200:
 *         description: 角色删除成功
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     message:
 *                       type: string
 *                       example: 角色已成功删除
 *       401:
 *         description: 未授权
 *       404:
 *         description: 角色不存在
 *       500:
 *         description: 服务器错误
 */
router.delete('/:id', auth, RoleController.deleteRole);

export default router;