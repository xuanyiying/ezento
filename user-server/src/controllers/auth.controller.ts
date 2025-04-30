import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import logger from '../config/logger';
import { UserService } from '../services';
import { ResponseHelper } from '../utils/response';

import PasswordUtil from '../utils/password';
import axios from 'axios';
import crypto from 'crypto';
import { generateUserId } from '../utils/id.generator';

/**
 * 认证控制器
 * 处理用户登录、注册、微信登录等功能
 */
export class AuthController {
    /**
     * 用户登录
     * 验证用户名和密码，生成JWT令牌
     */
    static async login(req: Request, res: Response): Promise<void> {
        try {
            const { username, password } = req.body;

            if (!username || !password) {
                ResponseHelper.badRequest(res, '用户名和密码不能为空');
                return;
            }

            const user = await UserService.findUserByUsername(username);
            if (!user) {
                ResponseHelper.unauthorized(res, '用户不存在');
                return;
            }
            // 检查用户是否有密码
            if (!user.password) {
                ResponseHelper.unauthorized(res, '密码为空');
                return;
            }

            try {
                // 使用标准化的密码工具进行比较
                const isPasswordValid = await PasswordUtil.comparePassword(password, user.password);
                if (!isPasswordValid) {
                    ResponseHelper.unauthorized(res, '密码错误');
                    return;
                }

                const token = jwt.sign(
                    {
                        userId: user._id,
                        role: user.role,
                    },
                    process.env.JWT_SECRET || 'your-secret-key',
                    { expiresIn: '24h' }
                );

                // 生成刷新令牌
                const refreshToken = jwt.sign(
                    {
                        userId: user._id,
                        role: user.role,
                    },
                    process.env.JWT_REFRESH_SECRET || 'your-refresh-secret-key',
                    { expiresIn: '7d' }
                );

                const responseData = {
                    token,
                    refreshToken,
                    user: {
                        userId: user._id,
                        role: user.role,
                        name: user.name,
                        avatar: user.avatar,
                        email: user.email,
                        phone: user.phone,
                        gender: user.gender,
                        birthDate: user.birthDate,
                    },
                    isNewUser: false,
                };
                ResponseHelper.success(res, responseData);
                logger.info(`--用户 ${user.username} 登录成功`, JSON.stringify(responseData));
            } catch (bcryptError: any) {
                logger.error(`密码验证错误: ${bcryptError.message}`);
                ResponseHelper.unauthorized(res, '用户名或密码错误');
            }
        } catch (error: any) {
            logger.error(`登录错误: ${error.message}`);
            ResponseHelper.serverError(res, '登录失败，请稍后重试');
        }
    }

    /**
     * 微信一键登录
     * 通过微信临时凭证获取用户信息并登录
     */
    static async wechatLogin(req: Request, res: Response): Promise<void> {
        try {
            const { code, encryptedData, iv } = req.body;

            if (!code) {
                ResponseHelper.badRequest(res, '微信临时凭证不能为空');
                return;
            }

            // 微信API配置
            const appId = process.env.WECHAT_APP_ID;
            const appSecret = process.env.WECHAT_APP_SECRET;

            if (!appId || !appSecret) {
                ResponseHelper.serverError(res, '微信配置缺失');
                return;
            }

            // 从微信获取会话密钥和openid
            const wechatResponse = await axios.get(
                `https://api.weixin.qq.com/sns/jscode2session?appid=${appId}&secret=${appSecret}&js_code=${code}&grant_type=authorization_code`
            );

            if (wechatResponse.data.errcode) {
                logger.error(`微信API错误: ${JSON.stringify(wechatResponse.data)}`);
                ResponseHelper.badRequest(res, `微信登录失败: ${wechatResponse.data.errmsg}`);
                return;
            }

            const { openid, session_key, unionid } = wechatResponse.data;

            // 从微信提取的用户信息
            let wechatUserInfo: { name?: string; avatar?: string } = {};

            // 如果提供了encryptedData和iv，解密用户信息
            if (encryptedData && iv && session_key) {
                try {
                    const decryptedData = this.decryptWechatData(encryptedData, session_key, iv);
                    wechatUserInfo = {
                        name: decryptedData.nickName,
                        avatar: decryptedData.avatarUrl,
                    };
                } catch (error) {
                    logger.error(`解密微信数据失败: ${error}`);
                    // 即使解密失败也继续登录
                }
            }

            // 创建或更新用户
            const { user, isNewUser } = await UserService.createOrUpdateWechatUser({
                openId: openid,
                unionId: unionid,
                ...wechatUserInfo,
            });

            // 生成JWT令牌
            const token = jwt.sign(
                {
                    userId: user?._id,
                    role: user?.role,
                },
                process.env.JWT_SECRET || 'your-secret-key',
                { expiresIn: '24h' }
            );

            // 生成刷新令牌
            const refreshToken = jwt.sign(
                {
                    userId: user?._id,
                    role: user?.role,
                },
                process.env.JWT_REFRESH_SECRET || 'your-refresh-secret-key',
                { expiresIn: '7d' }
            );

            ResponseHelper.success(res, {
                token,
                refreshToken,
                user: {
                    userId: user?._id,
                    role: user?.role,
                    userName: user?.name,
                    avatar: user?.avatar,
                },
                isNewUser,
            });
        } catch (error: any) {
            logger.error(`微信登录错误: ${error.message}`);
            ResponseHelper.serverError(res, '微信登录失败，请稍后重试');
        }
    }

    /**
     * 解密微信数据的辅助方法
     */
    private static decryptWechatData(encryptedData: string, sessionKey: string, iv: string) {
        // Base64解码
        const decodedEncryptedData = Buffer.from(encryptedData, 'base64');
        const decodedSessionKey = Buffer.from(sessionKey, 'base64');
        const decodedIv = Buffer.from(iv, 'base64');

        try {
            // 创建解密器
            const decipher = crypto.createDecipheriv('aes-128-cbc', decodedSessionKey, decodedIv);

            // 禁用自动填充
            decipher.setAutoPadding(true);

            // 解密
            let decoded = decipher.update(decodedEncryptedData, undefined, 'utf8');
            decoded += decipher.final('utf8');

            // 解析解码后的数据
            const decodedObj = JSON.parse(decoded);

            // 检查水印appid是否匹配
            if (decodedObj.watermark.appid !== process.env.WECHAT_APP_ID) {
                throw new Error('无效的水印appid');
            }

            return decodedObj;
        } catch (error) {
            logger.error(`解密错误: ${error}`);
            throw error;
        }
    }

    /**
     * 更新微信用户信息（首次登录）
     * 完善用户的基本信息
     */
    static async updateWechatUserInfo(req: Request, res: Response): Promise<void> {
        try {
            const { userId, name, phone, gender, birthDate, role } = req.body;

            if (!userId || !name || !phone || !gender || !birthDate || !role) {
                ResponseHelper.badRequest(res, '所有字段都是必填的');
                return;
            }

            const user = await UserService.updateWechatUserInfo(userId, {
                name,
                phone,
                gender,
                birthDate,
                role,
            });

            if (!user) {
                ResponseHelper.notFound(res, '用户不存在');
                return;
            }

            ResponseHelper.success(res, {
                userId: user._id,
                profileComplete: true,
            });
        } catch (error: any) {
            logger.error(`更新微信用户信息错误: ${error.message}`);
            ResponseHelper.serverError(res, '更新用户信息失败，请稍后重试');
        }
    }

    /**
     * 获取用户信息
     * 获取当前登录用户的详细信息
     */
    static async getUserInfo(req: Request, res: Response): Promise<void> {
        try {
            const userId = req.user?.userId;

            if (!userId) {
                ResponseHelper.unauthorized(res, '需要认证');
                return;
            }

            const user = await UserService.findUserById(userId);

            if (!user) {
                ResponseHelper.notFound(res, '用户不存在');
                return;
            }

            // 计算年龄
            let age: number | undefined;
            if (user.birthDate) {
                const birthDate = new Date(user.birthDate);
                const today = new Date();
                age = today.getFullYear() - birthDate.getFullYear();
                const monthDiff = today.getMonth() - birthDate.getMonth();
                if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
                    age--;
                }
            }

            ResponseHelper.success(res, {
                userId: user._id,
                username: user.username,
                name: user.name,
                phone: user.phone,
                role: user.role,
                avatar: user.avatar,
                gender: user.gender,
                birthDate: user.birthDate,
                joinDate: user.createdAt,
                age,
            });
        } catch (error: any) {
            logger.error(`获取用户信息错误: ${error.message}`);
            ResponseHelper.serverError(res, '获取用户信息失败，请稍后重试');
        }
    }

    /**
     * 用户注册
     * 创建新用户账户
     */
    static async register(req: Request, res: Response): Promise<void> {
        try {
            let { username, password, name, phone, role } = req.body;

            if (!username || !password || !phone) {
                ResponseHelper.badRequest(res, '所有字段都是必填的');
                return;
            }
            if (!role) {
                role = 'patient';
            }

            // 检查用户名是否已存在
            const existingUser = await UserService.findUserByUsername(username);
            if (existingUser) {
                ResponseHelper.badRequest(res, '用户名已存在');
                return;
            }
            // 创建新用户
            const user = await UserService.createUser({
                id: generateUserId(),
                username,
                password,
                name,
                phone,
                role,
                isActive: true,
            });

            ResponseHelper.created(res, {
                userId: user._id,
            });
        } catch (error: any) {
            logger.error(`注册错误: ${error.message}`);
            ResponseHelper.serverError(res, '注册失败，请稍后重试');
        }
    }

    /**
     * 用户登出
     * 清除用户的会话信息
     */
    static async logout(req: Request, res: Response): Promise<void> {
        try {
            // 获取用户ID
            const userId = req.user?.userId;

            if (!userId) {
                ResponseHelper.unauthorized(res, '未授权');
                return;
            }

            // 这里可以添加任何需要的清理操作
            // 例如：清除Redis中的会话数据，更新用户的最后登出时间等

            ResponseHelper.success(res, { message: '登出成功' });
            logger.info(`用户 ${userId} 登出成功`);
        } catch (error: any) {
            logger.error(`登出错误: ${error.message}`);
            ResponseHelper.serverError(res, '登出失败，请稍后重试');
        }
    }

    /**
     * 刷新访问令牌
     * 使用刷新令牌获取新的访问令牌
     */
    static async refreshToken(req: Request, res: Response): Promise<void> {
        try {
            const { refreshToken } = req.body;

            if (!refreshToken) {
                ResponseHelper.badRequest(res, '刷新令牌不能为空');
                return;
            }

            try {
                // 验证刷新令牌
                const decoded = jwt.verify(
                    refreshToken,
                    process.env.JWT_REFRESH_SECRET || 'your-refresh-secret-key'
                ) as { userId: string; role: string };

                // 获取用户信息
                const user = await UserService.findUserById(decoded.userId);
                if (!user) {
                    ResponseHelper.unauthorized(res, '用户不存在');
                    return;
                }

                // 生成新的访问令牌
                const newToken = jwt.sign(
                    {
                        userId: user._id,
                        role: user.role,
                    },
                    process.env.JWT_SECRET || 'your-secret-key',
                    { expiresIn: '24h' }
                );

                // 生成新的刷新令牌
                const newRefreshToken = jwt.sign(
                    {
                        userId: user._id,
                        role: user.role,
                    },
                    process.env.JWT_REFRESH_SECRET || 'your-refresh-secret-key',
                    { expiresIn: '7d' }
                );

                // 确保响应格式与前端期望的格式一致
                ResponseHelper.success(res, {
                    token: newToken,
                    refreshToken: newRefreshToken,
                    user: {
                        userId: user._id,
                        role: user.role,
                        name: user.name,
                        avatar: user.avatar,
                        email: user.email,
                        phone: user.phone,
                        gender: user.gender,
                        birthDate: user.birthDate,
                    }
                });
                
                logger.info(`--用户 ${user.username || user._id} 刷新令牌成功`);
            } catch (jwtError) {
                logger.error(`刷新令牌验证失败: ${jwtError}`);
                ResponseHelper.unauthorized(res, '刷新令牌无效或已过期');
            }
        } catch (error: any) {
            logger.error(`刷新令牌错误: ${error.message}`);
            ResponseHelper.serverError(res, '刷新令牌失败，请稍后重试');
        }
    }
}

export default AuthController;
