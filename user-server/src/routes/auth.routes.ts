import express from 'express';
import { AuthController } from '../controllers';
import { auth } from '../middlewares';

/**
 * @swagger
 * tags:
 *   name: Authentication
 *   description: 用户认证接口
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     User:
 *       type: object
 *       required:
 *         - username
 *         - password
 *         - name
 *         - phone
 *         - role
 *       properties:
 *         _id:
 *           type: string
 *           description: 用户ID
 *         username:
 *           type: string
 *           description: 登录用户名
 *         name:
 *           type: string
 *           description: 用户全名
 *         phone:
 *           type: string
 *           description: 用户手机号
 *         role:
 *           type: string
 *           enum: [PATIENT, DOCTOR, ADMIN]
 *           description: 用户角色
 */

const router = express.Router();

/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: 用户登录
 *     description: 通过用户名和密码进行登录
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - username
 *               - password
 *             properties:
 *               username:
 *                 type: string
 *                 description: 用户名
 *               password:
 *                 type: string
 *                 description: 密码
 *     responses:
 *       200:
 *         description: 登录成功
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 code:
 *                   type: integer
 *                   example: 200
 *                 msg:
 *                   type: string
 *                   example: success
 *                 data:
 *                   type: object
 *                   properties:
 *                     token:
 *                       type: string
 *                       description: JWT令牌
 *                     userId:
 *                       type: string
 *                       description: 用户ID
 *                     role:
 *                       type: string
 *                       enum: [PATIENT, DOCTOR, ADMIN]
 *                       description: 用户角色
 *                     userName:
 *                       type: string
 *                       description: 用户名称
 *                     avatar:
 *                       type: string
 *                       description: 用户头像
 *       400:
 *         description: 用户名和密码不能为空
 *       401:
 *         description: 用户名或密码错误
 *       500:
 *         description: 服务器错误，登录失败
 */
router.post('/login', AuthController.login);

/**
 * @swagger
 * /auth/wechat-login:
 *   post:
 *     summary: 微信一键登录
 *     description: 通过微信临时凭证进行一键登录
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - code
 *             properties:
 *               code:
 *                 type: string
 *                 description: 微信登录临时凭证
 *               encryptedData:
 *                 type: string
 *                 description: 加密数据
 *               iv:
 *                 type: string
 *                 description: 解密初始向量
 *     responses:
 *       200:
 *         description: 登录成功
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 code:
 *                   type: integer
 *                   example: 200
 *                 msg:
 *                   type: string
 *                   example: success
 *                 data:
 *                   type: object
 *                   properties:
 *                     token:
 *                       type: string
 *                       description: JWT令牌
 *                     userId:
 *                       type: string
 *                       description: 用户ID
 *                     role:
 *                       type: string
 *                       description: 用户角色
 *                     userName:
 *                       type: string
 *                       description: 用户名称
 *                     avatar:
 *                       type: string
 *                       description: 用户头像
 *                     isNewUser:
 *                       type: boolean
 *                       description: 是否为新用户
 *       400:
 *         description: 微信临时凭证不能为空
 *       500:
 *         description: 服务器错误，微信登录失败
 */
router.post('/wechat-login', AuthController.wechatLogin);

/**
 * @swagger
 * /auth/wechat-user-info:
 *   post:
 *     summary: 更新微信用户信息
 *     description: 首次登录时完善微信用户的基本信息
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - userId
 *               - name
 *               - phone
 *               - gender
 *               - birthDate
 *               - role
 *             properties:
 *               userId:
 *                 type: string
 *                 description: 用户ID
 *               name:
 *                 type: string
 *                 description: 用户姓名
 *               phone:
 *                 type: string
 *                 description: 手机号码
 *               gender:
 *                 type: string
 *                 description: 性别
 *               birthDate:
 *                 type: string
 *                 format: date
 *                 description: 出生日期
 *               role:
 *                 type: string
 *                 enum: [PATIENT]
 *                 description: 用户角色
 *     responses:
 *       200:
 *         description: 用户信息更新成功
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 code:
 *                   type: integer
 *                   example: 200
 *                 msg:
 *                   type: string
 *                   example: success
 *                 data:
 *                   type: object
 *                   properties:
 *                     userId:
 *                       type: string
 *                       description: 用户ID
 *                     profileComplete:
 *                       type: boolean
 *                       description: 资料是否完整
 *       400:
 *         description: 所有字段都是必填的
 *       404:
 *         description: 用户不存在
 *       500:
 *         description: 服务器错误，更新用户信息失败
 */
router.post('/wechat-user-info', AuthController.updateWechatUserInfo);

/**
 * @swagger
 * /auth/user-info:
 *   get:
 *     summary: 获取用户信息
 *     description: 获取当前登录用户的详细信息
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: 成功获取用户信息
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 code:
 *                   type: integer
 *                   example: 200
 *                 msg:
 *                   type: string
 *                   example: success
 *                 data:
 *                   type: object
 *                   properties:
 *                     userId:
 *                       type: string
 *                       description: 用户ID
 *                     username:
 *                       type: string
 *                       description: 用户名
 *                     name:
 *                       type: string
 *                       description: 用户姓名
 *                     phone:
 *                       type: string
 *                       description: 手机号码
 *                     role:
 *                       type: string
 *                       description: 用户角色
 *                     avatar:
 *                       type: string
 *                       description: 用户头像
 *                     gender:
 *                       type: string
 *                       description: 性别
 *                     birthDate:
 *                       type: string
 *                       description: 出生日期
 *                     joinDate:
 *                       type: string
 *                       description: 加入日期
 *                     age:
 *                       type: integer
 *                       description: 年龄
 *       401:
 *         description: 需要认证
 *       404:
 *         description: 用户不存在
 *       500:
 *         description: 服务器错误，获取用户信息失败
 */
router.get('/user-info', auth, AuthController.getUserInfo);

/**
 * @swagger
 * /auth/register:
 *   post:
 *     summary: 用户注册
 *     description: 创建新用户账户
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - username
 *               - password
 *               - name
 *               - phone
 *               - role
 *             properties:
 *               username:
 *                 type: string
 *                 description: 用户名
 *               password:
 *                 type: string
 *                 description: 密码
 *               name:
 *                 type: string
 *                 description: 用户姓名
 *               phone:
 *                 type: string
 *                 description: 手机号码
 *               role:
 *                 type: string
 *                 enum: [PATIENT, DOCTOR]
 *                 description: 用户角色
 *     responses:
 *       201:
 *         description: 用户注册成功
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 code:
 *                   type: integer
 *                   example: 200
 *                 msg:
 *                   type: string
 *                   example: success
 *                 data:
 *                   type: object
 *                   properties:
 *                     userId:
 *                       type: string
 *                       description: 用户ID
 *       400:
 *         description: 所有字段都是必填的
 *       409:
 *         description: 用户名已存在
 *       500:
 *         description: 服务器错误，注册失败
 */
router.post('/register', AuthController.register);

export default router; 