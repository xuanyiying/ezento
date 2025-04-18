import { User } from '@/types';
import { get, post } from '@/utils/http';
import { TokenManager } from '@/utils/tokenManager';
import {
    LoginCredentials,
    LoginResponse,
    UserInfoResponse,
    RefreshTokenResponse,
    AuthError,
} from '@/types/auth';
import { ApiResponse } from './conversation';

export const AuthAPI = {
    login: async (credentials: LoginCredentials): Promise<LoginResponse> => {
        try {
            const response = await post<ApiResponse<LoginResponse>>('/auth/login', credentials);

            if (response.success && response.data) {
                const { token, refreshToken } = response.data;
                TokenManager.setTokens(token, refreshToken);
                return response.data;
            } else {
                throw new AuthError(response.message || 'Login failed', 'LOGIN_FAILED', 401);
            }
        } catch (error) {
            if (error instanceof AuthError) {
                throw error;
            }
            throw new AuthError('Login failed', 'LOGIN_FAILED', 401);
        }
    },

    logout: async (): Promise<void> => {
        try {
            await post<ApiResponse<void>>('/auth/logout');
        } finally {
            TokenManager.removeTokens();
            TokenManager.removeCsrfToken();
        }
    },

    refreshToken: async (refreshToken: string): Promise<RefreshTokenResponse> => {
        try {
            const response = await post<ApiResponse<RefreshTokenResponse>>('/auth/refresh', {
                refreshToken,
            });

            if (response.success && response.data) {
                const { token, refreshToken: newRefreshToken } = response.data;
                TokenManager.setTokens(token, newRefreshToken);
                return response.data;
            } else {
                throw new AuthError(
                    response.message || 'Token refresh failed',
                    'REFRESH_FAILED',
                    401
                );
            }
        } catch (error) {
            if (error instanceof AuthError) {
                throw error;
            }
            throw new AuthError('Token refresh failed', 'REFRESH_FAILED', 401);
        }
    },

    getUserInfo: async (): Promise<User> => {
        try {
            const response = await get<ApiResponse<UserInfoResponse>>('/auth/user-info');

            if (response.success && response.data) {
                return response.data.user;
            } else {
                throw new AuthError(
                    response.message || 'Failed to get user info',
                    'USER_INFO_FAILED',
                    500
                );
            }
        } catch (error) {
            if (error instanceof AuthError) {
                throw error;
            }
            throw new AuthError('Failed to get user info', 'USER_INFO_FAILED', 500);
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
};
