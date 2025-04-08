import { Document, Types } from 'mongoose';
import mongoose from 'mongoose';

/**
 * 用户角色类型
 */
export type UserRole = 'admin' | 'doctor' | 'patient';

/**
 * 用户性别类型
 */
export type UserGender = 'male' | 'female' | 'other' | 'unknown';

export interface UserBase {
    name: string;
    username?: string;
    avatar?: string;
    phone?: string;
    email?: string;
    password?: string;
    gender?: UserGender;
    birthDate?: Date;
    role: UserRole;
    openId?: string;
    sessionKey?: string;
    lastLoginAt?: Date;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}

export interface UserDocument extends Document, UserBase {
    _id: Types.ObjectId;
}

export type UserCreateData = {
    name: string;
    username?: string;
    avatar?: string;
    phone: string;
    email?: string;
    password?: string;
    gender?: string;
    birthDate?: Date;
    role: string;
    openId?: string;
    unionId?: string;
    isWechatUser?: boolean;
    isActive: boolean;
    tenantId?: mongoose.Types.ObjectId;
};

export type UserUpdateData = Partial<UserCreateData>;