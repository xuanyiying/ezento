import { ApiResponse, User } from '@/types';
import { get, post } from '@/utils/http';
import { TokenManager } from '@/utils/tokenManager';
import {
    LoginCredentials,
    LoginResponse,
    RefreshTokenResponse,
} from '@/types/auth';

interface LoginParams extends LoginCredentials {
    username: string;
    password: string;
}

export const AuthAPI = {
    login: async (params: LoginParams): Promise<LoginResponse> => {
        try {
            const response = await post<ApiResponse<LoginResponse>>('/auth/login', params);
            return response.data;
        } catch (error) {
            console.error('Login error:', error);
            throw error;
        }
    },

    logout: async (): Promise<void> => {
        try {
            await post<ApiResponse<void>>('/auth/logout', {});
        } catch (error) {
            console.error('Logout error:', error);
            throw error;
        }
    },

    refreshToken: async (refreshToken: string): Promise<RefreshTokenResponse> => {
        try {
            const response = await post<ApiResponse<RefreshTokenResponse>>('/auth/refresh', { refreshToken });
            return response.data;
        } catch (error) {
            console.error('Refresh token error:', error);
            throw error;
        }
    },

    getUserInfo: async (): Promise<User> => {
        try {
            const response = await get<ApiResponse<User>>('/auth/user-info');
            return response.data;
        } catch (error) {
            console.error('Get user info error:', error);
            throw error;
        }
    },

    isAuthenticated: (): boolean => {
        try {
            TokenManager.validateToken();
            return true;
        } catch {
            return false;
        }
    },

    register: async (params: any): Promise<any> => {
        try {
            const response = await post<ApiResponse<any>>('/auth/register', params);
            return response.data;
        } catch (error) {
            console.error('Register error:', error);
            throw error;
        }
    },

    sendVerificationCode: async (phone: string): Promise<void> => {
        try {
            await post<ApiResponse<void>>('/auth/verification-code', { phone });
        } catch (error) {
            console.error('Send verification code error:', error);
            throw error;
        }
    },

    resetPassword: async (params: { email: string }): Promise<void> => {
        try {
            await post<ApiResponse<void>>('/auth/reset-password', params);
        } catch (error) {
            console.error('Reset password error:', error);
            throw error;
        }
    },

    verifyResetToken: async (token: string): Promise<boolean> => {
        try {
            const response = await get<ApiResponse<boolean>>(`/auth/verify-reset-token/${token}`);
            return response.data;
        } catch (error) {
            console.error('Verify reset token error:', error);
            throw error;
        }
    },

    setNewPassword: async (params: { token: string; password: string }): Promise<void> => {
        try {
            await post<ApiResponse<void>>('/auth/set-new-password', params);
        } catch (error) {
            console.error('Set new password error:', error);
            throw error;
        }
    }
};
