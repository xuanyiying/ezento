import express from 'express';
import { PreDiagnosisController } from '../controllers/prediagnosis.controller';
import { auth } from '../middlewares';

/**
 * @swagger
 * tags:
 *   name: Prediagnosis
 *   description: 预诊断管理接口
 */

const router = express.Router();

/**
 * @swagger
 * /api/patient/prediagnosis:
 *   post:
 *     summary: 提交新的预诊断
 *     description: 患者提交新的预诊断信息，系统会自动生成AI建议
 *     tags: [Prediagnosis]
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
 *               - symptoms
 *               - duration
 *             properties:
 *               patientId:
 *                 type: string
 *                 description: 患者ID
 *               symptoms:
 *                 type: string
 *                 description: 症状描述
 *               duration:
 *                 type: string
 *                 description: 持续时间
 *               bodyParts:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: 身体部位
 *               images:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: 图片（Base64编码）
 *               existingConditions:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: 已有疾病
 *     responses:
 *       200:
 *         description: 预诊断提交成功
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
 *                     prediagnosisId:
 *                       type: string
 *                       description: 预诊断ID
 *                     status:
 *                       type: string
 *                       description: 预诊断状态
 *                     createTime:
 *                       type: string
 *                       format: date-time
 *                       description: 创建时间
 *       400:
 *         description: 请求参数错误，缺少必填字段
 *       401:
 *         description: 未授权，请先登录
 *       500:
 *         description: 服务器错误，提交失败
 * @route   POST /api/patient/prediagnosis
 * @desc    提交新的预诊断
 * @access  私有/患者
 */
router.post('/', auth, PreDiagnosisController.submitPrediagnosis);

/**
 * @swagger
 * /api/patient/prediagnosis/list:
 *   get:
 *     summary: 获取患者的预诊断列表
 *     description: 根据患者ID获取该患者的所有预诊断记录，支持分页
 *     tags: [Prediagnosis]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: patientId
 *         required: true
 *         schema:
 *           type: string
 *         description: 患者ID
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
 *           default: 10
 *         description: 每页数量
 *     responses:
 *       200:
 *         description: 成功返回预诊断记录列表
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
 *                       description: 总记录数
 *                     list:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           prediagnosisId:
 *                             type: string
 *                             description: 预诊断ID
 *                           symptoms:
 *                             type: string
 *                             description: 症状描述
 *                           status:
 *                             type: string
 *                             description: 状态
 *                           createTime:
 *                             type: string
 *                             format: date-time
 *                             description: 创建时间
 *                           doctorName:
 *                             type: string
 *                             description: 医生姓名
 *       400:
 *         description: 请求参数错误，患者ID为必填参数
 *       401:
 *         description: 未授权，请先登录
 *       500:
 *         description: 服务器错误，获取列表失败
 * @route   GET /api/patient/prediagnosis/list
 * @desc    获取患者的预诊断列表
 * @access  私有/患者
 */
router.get('/list', auth, PreDiagnosisController.getPrediagnosisList);

/**
 * @swagger
 * /api/patient/prediagnosis/doctor/list:
 *   get:
 *     summary: 获取医生的预诊断列表
 *     description: 根据医生ID获取分配给该医生的所有预诊断记录，支持按状态筛选和分页
 *     tags: [Prediagnosis]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: doctorId
 *         required: true
 *         schema:
 *           type: string
 *         description: 医生ID
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *         description: 状态筛选（例如：SUBMITTED, INPROGRESS, COMPLETED）
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
 *           default: 10
 *         description: 每页数量
 *     responses:
 *       200:
 *         description: 成功返回预诊断记录列表
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
 *                     list:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           prediagnosisId:
 *                             type: string
 *                             description: 预诊断ID
 *                           patientId:
 *                             type: string
 *                             description: 患者ID
 *                           symptoms:
 *                             type: string
 *                             description: 症状描述
 *                           status:
 *                             type: string
 *                             description: 状态
 *                           createTime:
 *                             type: string
 *                             format: date-time
 *                             description: 创建时间
 *                     total:
 *                       type: integer
 *                       description: 总记录数
 *                     page:
 *                       type: integer
 *                       description: 当前页码
 *                     limit:
 *                       type: integer
 *                       description: 每页记录数
 *       400:
 *         description: 请求参数错误，无法识别医生身份
 *       401:
 *         description: 未授权，请先登录
 *       500:
 *         description: 服务器错误，获取列表失败
 * @route   GET /api/patient/prediagnosis/doctor/list
 * @desc    获取医生的预诊断列表
 * @access  私有/医生
 */
router.get('/doctor/list', auth, PreDiagnosisController.getDoctorPreDiagnoses);

/**
 * @swagger
 * /api/patient/prediagnosis/doctor/advice:
 *   post:
 *     summary: 提交医生对预诊断的建议
 *     description: 医生对预诊断提交专业建议、推荐科室和紧急程度等信息
 *     tags: [Prediagnosis]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - prediagnosisId
 *               - advice
 *             properties:
 *               prediagnosisId:
 *                 type: string
 *                 description: 预诊断ID
 *               advice:
 *                 type: string
 *                 description: 医生建议
 *               recommendDepartment:
 *                 type: string
 *                 description: 推荐科室
 *               urgencyLevel:
 *                 type: string
 *                 description: 紧急程度
 *                 enum: [NORMAL, URGENT, EMERGENCY]
 *     responses:
 *       200:
 *         description: 医生建议提交成功
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
 *                     prediagnosisId:
 *                       type: string
 *                       description: 预诊断ID
 *                     status:
 *                       type: string
 *                       description: 更新后的状态
 *                     message:
 *                       type: string
 *                       description: 成功提示信息
 *       400:
 *         description: 请求参数错误，缺少必填字段
 *       401:
 *         description: 未授权，请先登录
 *       404:
 *         description: 未找到预诊断信息
 *       500:
 *         description: 服务器错误，提交建议失败
 * @route   POST /api/patient/prediagnosis/doctor/advice
 * @desc    提交医生对预诊断的建议
 * @access  私有/医生
 */
router.post('/doctor/advice', auth, PreDiagnosisController.submitDoctorAdvice);

/**
 * @swagger
 * /api/patient/prediagnosis/{id}:
 *   get:
 *     summary: 获取预诊断详情
 *     description: 根据预诊断ID获取详细信息，包括患者信息、症状、AI建议和医生建议等
 *     tags: [Prediagnosis]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: 预诊断ID
 *     responses:
 *       200:
 *         description: 成功返回预诊断详情
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
 *                     prediagnosisId:
 *                       type: string
 *                       description: 预诊断ID
 *                     patientInfo:
 *                       type: object
 *                       properties:
 *                         name:
 *                           type: string
 *                           description: 患者姓名
 *                         age:
 *                           type: integer
 *                           description: 患者年龄
 *                         gender:
 *                           type: string
 *                           description: 患者性别
 *                     symptoms:
 *                       type: string
 *                       description: 症状描述
 *                     duration:
 *                       type: string
 *                       description: 持续时间
 *                     bodyParts:
 *                       type: array
 *                       items:
 *                         type: string
 *                       description: 身体部位
 *                     aiSuggestion:
 *                       type: object
 *                       description: AI建议
 *                     doctorAdvice:
 *                       type: string
 *                       description: 医生建议
 *                     recommendedDepartment:
 *                       type: string
 *                       description: 推荐科室
 *                     urgencyLevel:
 *                       type: string
 *                       description: 紧急程度
 *                     status:
 *                       type: string
 *                       description: 状态
 *                     createTime:
 *                       type: string
 *                       format: date-time
 *                       description: 创建时间
 *       400:
 *         description: 请求参数错误
 *       401:
 *         description: 未授权，请先登录
 *       404:
 *         description: 未找到预诊断信息
 *       500:
 *         description: 服务器错误，获取详情失败
 * @route   GET /api/patient/prediagnosis/:id
 * @desc    获取预诊断详情
 * @access  私有/患者
 */
router.get('/:id', auth, PreDiagnosisController.getPrediagnosisDetails);

export default router;