import { Request, Response, NextFunction } from 'express';
import { User } from '../domains/user/user.entity';
import { UserService } from '../services/user.service';
import { ApiError } from '../middlewares/errorHandler';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';

export class AuthController {
    constructor(private userService: UserService) {}

    /**
     * @swagger
     * /auth/login:
     *   post:
     *     summary: 用户登录
     *     description: 通过邮箱和密码进行用户登录
     *     tags: [Authentication]
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             required:
     *               - email
     *               - password
     *             properties:
     *               email:
     *                 type: string
     *                 format: email
     *                 description: 用户邮箱
     *               password:
     *                 type: string
     *                 format: password
     *                 description: 用户密码
     *     responses:
     *       200:
     *         description: 登录成功
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 token:
     *                   type: string
     *                   description: JWT认证令牌
     *                 user:
     *                   type: object
     *                   properties:
     *                     id:
     *                       type: string
     *                     name:
     *                       type: string
     *                     email:
     *                       type: string
     *                     role:
     *                       type: string
     *                     tenantId:
     *                       type: string
     *       400:
     *         description: 请求参数错误
     *       401:
     *         description: 邮箱或密码错误
     *       500:
     *         description: 服务器错误
     */
    login = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { email, password } = req.body;

            if (!email || !password) {
                throw new ApiError(400, '邮箱和密码不能为空');
            }

            // 查找用户
            const user = await this.userService.findByEmail(email);
            if (!user) {
                throw new ApiError(401, '邮箱或密码错误');
            }

            // 验证密码是否存在
            if (!user.password) {
                throw new ApiError(500, '用户账户配置错误');
            }

            // 验证密码
            const isPasswordValid = await bcrypt.compare(password, user.password);
            if (!isPasswordValid) {
                throw new ApiError(401, '邮箱或密码错误');
            }

            // 生成JWT令牌
            const token = this.generateToken(user);

            // 返回用户信息（不包含敏感信息）
            const userResponse = {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
                tenantId: user.tenantId,
            };

            res.json({
                token,
                user: userResponse,
            });
        } catch (error) {
            next(error);
        }
    };

    /**
     * @swagger
     * /auth/verify:
     *   get:
     *     summary: 验证令牌
     *     description: 验证用户令牌并返回用户信息
     *     tags: [Authentication]
     *     security:
     *       - bearerAuth: []
     *     responses:
     *       200:
     *         description: 令牌有效
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 user:
     *                   type: object
     *                   properties:
     *                     id:
     *                       type: string
     *                     name:
     *                       type: string
     *                     email:
     *                       type: string
     *                     role:
     *                       type: string
     *                     tenantId:
     *                       type: string
     *       401:
     *         description: 令牌无效或已过期
     *       500:
     *         description: 服务器错误
     */
    verifyToken = async (req: Request, res: Response, next: NextFunction) => {
        try {
            // req.user 已在 authMiddleware 中设置
            if (!req.user) {
                throw new ApiError(401, '未授权');
            }

            // 返回用户信息（不包含敏感信息）
            const user = req.user as User;
            const userResponse = {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
                tenantId: user.tenantId,
            };

            res.json({
                user: userResponse,
            });
        } catch (error) {
            next(error);
        }
    };

    /**
     * 生成JWT令牌
     * @param user 用户对象
     * @returns JWT令牌
     */
    private generateToken(user: User): string {
        const payload = {
            userId: user.id,
            tenantId: user.tenantId,
            role: user.role,
        };

        // 从环境变量获取密钥
        const secret = process.env.JWT_SECRET;
        if (!secret) {
            throw new Error('JWT_SECRET 环境变量未定义');
        }

        // 生成令牌，设置过期时间为24小时
        return jwt.sign(payload, secret, { expiresIn: '24h' });
    }
}
