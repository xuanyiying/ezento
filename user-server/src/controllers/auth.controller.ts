import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import logger from '../config/logger';
import { UserService } from '../services';
import { ResponseUtil } from '../utils/responseUtil';
import axios from 'axios';
import crypto from 'crypto';

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
                ResponseUtil.badRequest(res, '用户名和密码不能为空');
                    return;
                }

                const user = await UserService.findUserByUsername(username);

                if (!user) {
                ResponseUtil.unauthorized(res, '用户名或密码错误');
                    return;
                }

            // 检查用户是否有密码
                if (!user.password) {
                ResponseUtil.unauthorized(res, '用户名或密码错误');
                    return;
                }

                const isPasswordValid = await bcrypt.compare(password, user.password);

                if (!isPasswordValid) {
                ResponseUtil.unauthorized(res, '用户名或密码错误');
                    return;
                }

                const token = jwt.sign(
                    {
                        userId: user._id,
                    role: user.role
                    },
                    process.env.JWT_SECRET || 'your-secret-key',
                    { expiresIn: '24h' }
                );

                ResponseUtil.success(res, {
                    token,
                    userId: user._id,
                role: user.role,
                userName: user.name,
                avatar: user.avatar
                });
            } catch (error: any) {
            logger.error(`登录错误: ${error.message}`);
            ResponseUtil.serverError(res, '登录失败，请稍后重试');
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
                ResponseUtil.badRequest(res, '微信临时凭证不能为空');
                return;
            }

            // 微信API配置
            const appId = process.env.WECHAT_APP_ID;
            const appSecret = process.env.WECHAT_APP_SECRET;

            if (!appId || !appSecret) {
                ResponseUtil.serverError(res, '微信配置缺失');
                return;
            }

            // 从微信获取会话密钥和openid
            const wechatResponse = await axios.get(
                `https://api.weixin.qq.com/sns/jscode2session?appid=${appId}&secret=${appSecret}&js_code=${code}&grant_type=authorization_code`
            );

            if (wechatResponse.data.errcode) {
                logger.error(`微信API错误: ${JSON.stringify(wechatResponse.data)}`);
                ResponseUtil.badRequest(res, `微信登录失败: ${wechatResponse.data.errmsg}`);
                return;
            }

            const { openid, session_key, unionid } = wechatResponse.data;

            // 从微信提取的用户信息
            let wechatUserInfo: { name?: string, avatar?: string } = {};

            // 如果提供了encryptedData和iv，解密用户信息
            if (encryptedData && iv && session_key) {
                try {
                    const decryptedData = this.decryptWechatData(encryptedData, session_key, iv);
                    wechatUserInfo = {
                        name: decryptedData.nickName,
                        avatar: decryptedData.avatarUrl
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
                ...wechatUserInfo
            });

            // 生成JWT令牌
            const token = jwt.sign(
                {
                    userId: user?._id,
                    role: user?.role
                },
                process.env.JWT_SECRET || 'your-secret-key',
                { expiresIn: '24h' }
            );

            ResponseUtil.success(res, {
                token,
                userId: user?._id,
                role: user?.role,
                userName: user?.name,
                avatar: user?.avatar,
                isNewUser
            });
        } catch (error: any) {
            logger.error(`微信登录错误: ${error.message}`);
            ResponseUtil.serverError(res, '微信登录失败，请稍后重试');
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
            const decipher = crypto.createDecipheriv(
                'aes-128-cbc',
                decodedSessionKey,
                decodedIv
            );

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
                ResponseUtil.badRequest(res, '所有字段都是必填的');
                return;
            }

            const user = await UserService.updateWechatUserInfo(userId, {
                name,
                phone,
                gender,
                birthDate,
                role
            });

            if (!user) {
                ResponseUtil.notFound(res, '用户不存在');
                return;
            }

            ResponseUtil.success(res, {
                userId: user._id,
                profileComplete: true
            });
        } catch (error: any) {
            logger.error(`更新微信用户信息错误: ${error.message}`);
            ResponseUtil.serverError(res, '更新用户信息失败，请稍后重试');
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
                ResponseUtil.unauthorized(res, '需要认证');
                return;
            }

            const user = await UserService.findUserById(userId);

            if (!user) {
                ResponseUtil.notFound(res, '用户不存在');
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

            ResponseUtil.success(res, {
                userId: user._id,
                name: user.name,
                phone: user.phone,
                role: user.role,
                avatar: user.avatar,
                gender: user.gender,
                birthDate: user.birthDate,
                joinDate: user.createdAt,
                age
            });
        } catch (error: any) {
            logger.error(`获取用户信息错误: ${error.message}`);
            ResponseUtil.serverError(res, '获取用户信息失败，请稍后重试');
        }
    }

    /**
     * 用户注册
     * 创建新用户账户
     */
    static async register(req: Request, res: Response): Promise<void> {
            try {
                const { username, password, name, phone, role } = req.body;

                if (!username || !password || !name || !phone || !role) {
                ResponseUtil.badRequest(res, '所有字段都是必填的');
                    return;
                }

            // 检查用户名是否已存在
                const existingUser = await UserService.findUserByUsername(username);
                if (existingUser) {
                ResponseUtil.conflict(res, '用户名已存在');
                    return;
                }

            // 创建新用户
            const user = await UserService.createUser({
                password,
                    name,
                    phone,
                role,
                isActive: true,
                });

                ResponseUtil.created(res, {
                userId: user._id
                });
            } catch (error: any) {
            logger.error(`注册错误: ${error.message}`);
            ResponseUtil.serverError(res, '注册失败，请稍后重试');
            }
    }
}

export default AuthController; 