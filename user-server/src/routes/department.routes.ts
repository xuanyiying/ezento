import express from 'express';
import DepartmentController from '../controllers/department.controller';
import { auth } from '../middlewares';

/**
 * @swagger
 * tags:
 *   name: Departments
 *   description: 科室管理接口
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     Department:
 *       type: object
 *       required:
 *         - name
 *       properties:
 *         id:
 *           type: string
 *           description: 科室ID
 *         name:
 *           type: string
 *           description: 科室名称
 *         description:
 *           type: string
 *           description: 科室描述
 *         iconUrl:
 *           type: string
 *           description: 科室图标URL
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
 * /departments:
 *   get:
 *     summary: 获取所有科室列表
 *     description: 获取系统中所有可用的科室信息列表
 *     tags: [Departments]
 *     responses:
 *       200:
 *         description: 成功获取科室列表
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 data:
 *                   type: object
 *                   properties:
 *                     total:
 *                       type: integer
 *                       example: 10
 *                     list:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Department'
 *       500:
 *         description: 服务器错误，获取科室列表失败
 * @route   GET /departments
 * @desc    获取所有科室列表
 * @access  公开
 */
router.get('/', DepartmentController.getAllDepartments);

/**
 * @swagger
 * /departments/{id}:
 *   get:
 *     summary: 通过ID获取科室详情
 *     description: 根据科室ID获取单个科室的详细信息
 *     tags: [Departments]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: 科室ID
 *     responses:
 *       200:
 *         description: 成功获取科室详情
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 data:
 *                   $ref: '#/components/schemas/Department'
 *       404:
 *         description: 未找到科室信息
 *       500:
 *         description: 服务器错误，获取科室详情失败
 * @route   GET /departments/:id
 * @desc    通过ID获取科室详情
 * @access  公开
 */
router.get('/:id', DepartmentController.getDepartmentById);

/**
 * @swagger
 * /departments:
 *   post:
 *     summary: 创建新科室
 *     description: 创建一个新的科室信息记录
 *     tags: [Departments]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - description
 *               - iconUrl
 *             properties:
 *               name:
 *                 type: string
 *                 description: 科室名称
 *               description:
 *                 type: string
 *                 description: 科室描述
 *               iconUrl:
 *                 type: string
 *                 description: 科室图标URL
 *     responses:
 *       201:
 *         description: 科室创建成功
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 data:
 *                   $ref: '#/components/schemas/Department'
 *       400:
 *         description: 请求参数错误，缺少必填字段
 *       401:
 *         description: 未授权，请先登录
 *       409:
 *         description: 科室名称已存在
 *       500:
 *         description: 服务器错误，创建科室失败
 * @route   POST /departments
 * @desc    创建新科室
 * @access  私有/管理员
 */
router.post('/', auth, DepartmentController.createDepartment);

/**
 * @swagger
 * /departments/{id}:
 *   put:
 *     summary: 更新科室信息
 *     description: 根据科室ID更新科室的详细信息
 *     tags: [Departments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: 科室ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 description: 科室名称
 *               description:
 *                 type: string
 *                 description: 科室描述
 *               iconUrl:
 *                 type: string
 *                 description: 科室图标URL
 *     responses:
 *       200:
 *         description: 科室更新成功
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 data:
 *                   $ref: '#/components/schemas/Department'
 *       400:
 *         description: 请求参数错误
 *       401:
 *         description: 未授权，请先登录
 *       404:
 *         description: 未找到科室信息
 *       409:
 *         description: 科室名称已存在
 *       500:
 *         description: 服务器错误，更新科室失败
 * @route   PUT /api/departments/:id
 * @desc    更新科室信息
 * @access  私有/管理员
 */
router.put('/:id', auth, DepartmentController.updateDepartment);

/**
 * @swagger
 * /departments/{id}:
 *   delete:
 *     summary: 删除科室
 *     description: 根据科室ID删除科室信息
 *     tags: [Departments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: 科室ID
 *     responses:
 *       200:
 *         description: 科室删除成功
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 data:
 *                   type: object
 *                   properties:
 *                     message:
 *                       type: string
 *                       example: 科室删除成功
 *       401:
 *         description: 未授权，请先登录
 *       404:
 *         description: 未找到科室信息
 *       500:
 *         description: 服务器错误，删除科室失败
 * @route   DELETE /departments/:id
 * @desc    删除科室
 * @access  私有/管理员
 */
router.delete('/:id', auth, DepartmentController.deleteDepartment);

export default router;