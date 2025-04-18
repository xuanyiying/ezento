/**
 * 用户角色类型
 */
export type UserRole = 'admin' | 'doctor' | 'patient';

/**
 * 用户性别类型
 */
export type UserGender = '男' | '女' | '其他' | '未知';

export interface UserBase {
    id: string;
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

export type UserCreateData = {
    id: string;
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
    tenantId?: string;
};

export type UserUpdateData = Partial<UserCreateData>;
