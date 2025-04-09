import { User } from '../models';
import { UserDocument, UserCreateData, UserUpdateData } from '../interfaces/user.interface';
import mongoose from 'mongoose';
import logger from '../config/logger';

interface SessionOptions {
    session?: mongoose.ClientSession;
}

class UserService {
   
    /**
     * Find a user by username
     */
    static async findUserByUsername(username: string) {
        try {
            const user = await User.findOne({ username }).select('+password').exec();
            return user;
        } catch (error) {
            logger.error(`Error in UserService.findUserByUsername: ${error}`);
            throw error;
        }
    }

    /**
     * Find a user by openId (used for WeChat login)
     */
    static async findUserByOpenId(openId: string) {
        try {
            const user = await User.findOne({ openId }).exec();
            return user;
        } catch (error) {
            logger.error(`Error in UserService.findUserByOpenId: ${error}`);
            throw error;
        }
    }

    /**
     * Find a user by ID
     */
    static async findUserById(id: string) {
        try {
            if (!mongoose.Types.ObjectId.isValid(id)) {
                return null;
            }
            const user = await User.findById(id).exec();
            return user;
        } catch (error) {
            logger.error(`Error in UserService.findUserById: ${error}`);
            throw error;
        }
    }

    /**
     * 创建用户
     * @param data 用户创建数据
     * @param options 会话选项
     * @returns 创建的用户文档
     */
    public static async createUser(data: UserCreateData, options: SessionOptions = {}): Promise<UserDocument> {
        try {
            const { session } = options;
            const [user] = await User.create([data], { session });
            return user;
        } catch (error: any) {
            logger.error(`创建用户失败: ${error.message}`);
            throw error;
        }
    }

    /**
     * Create or update a WeChat user
     */
    static async createOrUpdateWechatUser(wechatData: { openId: string, unionId?: string, name?: string, avatar?: string }) {
        try {
            let user = await this.findUserByOpenId(wechatData.openId);
            
            if (user) {
                // Update existing user
                user = await User.findOneAndUpdate(
                    { openId: wechatData.openId },
                    { 
                        $set: { 
                            unionId: wechatData.unionId,
                            avatar: wechatData.avatar || user.avatar,
                            name: wechatData.name || user.name
                        } 
                    },
                    { new: true }
                ).exec();
                return { user, isNewUser: false };
            } else {
                // Create new user with minimal data
                const newUser = await this.createUser({
                    openId: wechatData.openId,
                    unionId: wechatData.unionId,
                    name: wechatData.name || '微信用户',
                    avatar: wechatData.avatar || '',
                    phone: '',  // Will be filled later
                    role: 'user',  // Default role
                    isWechatUser: true,
                    isActive: true
                });
                return { user: newUser, isNewUser: true };
            }
        } catch (error) {
            logger.error(`Error in UserService.createOrUpdateWechatUser: ${error}`);
            throw error;
        }
    }

    /**
     * Update a user's info from WeChat first login
     */
    static async updateWechatUserInfo(userId: string, userData: any) {
        try {
            if (!mongoose.Types.ObjectId.isValid(userId)) {
                return null;
            }
            
            const updatedUser = await User.findByIdAndUpdate(
                userId,
                { 
                    $set: { 
                        name: userData.name,
                        phone: userData.phone,
                        gender: userData.gender,
                        birthDate: userData.birthDate,
                        userType: userData.role.toLowerCase()
                    } 
                },
                { new: true }
            ).exec();
            
            return updatedUser;
        } catch (error) {
            logger.error(`Error in UserService.updateWechatUserInfo: ${error}`);
            throw error;
        }
    }

    /**
     * Update a user
     */
    static async updateUser(id: string, userData: any, p0: { session: mongoose.mongo.ClientSession; }) {
        try {
            if (!mongoose.Types.ObjectId.isValid(id)) {
                return null;
            }
            const updatedUser = await User.findByIdAndUpdate(
                id,
                userData,
                { new: true }
            ).exec();
            return updatedUser;
        } catch (error) {
            logger.error(`Error in UserService.updateUser: ${error}`);
            throw error;
        }
    }

    /**
     * Delete a user
     */
    static async deleteUser(id: string) {
        try {
            if (!mongoose.Types.ObjectId.isValid(id)) {
                return false;
            }
            await User.findByIdAndDelete(id).exec();
            return true;
        } catch (error) {
            logger.error(`Error in UserService.deleteUser: ${error}`);
            throw error;
        }
    }
}

export default UserService; 