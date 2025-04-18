import axios, { AxiosError, AxiosRequestConfig, AxiosResponse } from 'axios';
import { TokenManager } from './tokenManager';
import { AuthError, RefreshTokenError, TokenExpiredError } from '../types/auth';

const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // 1 second

// 定义标准API响应格式
export interface ApiResponse<T> {
    success: boolean;
    message: string;
    data: T;
}

// 创建axios实例
const http = axios.create({
    baseURL: import.meta.env.DEV ? '/api' : import.meta.env.VITE_API_BASE_URL,
    timeout: 10000,
    headers: {
        'Content-Type': 'application/json',
    },
});

// 请求拦截器
http.interceptors.request.use(
    config => {
        const token = TokenManager.getToken();
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }

        // Add CSRF token if available
        const csrfToken = TokenManager.getCsrfToken();
        if (csrfToken) {
            config.headers['X-CSRF-Token'] = csrfToken;
        }

        // Add request signature
        const timestamp = Date.now().toString();
        config.headers['X-Timestamp'] = timestamp;
        config.headers['X-Signature'] = generateRequestSignature(config, timestamp);

        return config;
    },
    error => {
        return Promise.reject(error);
    }
);

// 响应拦截器
http.interceptors.response.use(
    (response: AxiosResponse) => {
        // Store CSRF token if present in response
        const csrfToken = response.headers['x-csrf-token'];
        if (csrfToken) {
            TokenManager.setCsrfToken(csrfToken);
        }

        // 如果响应中包含新token，更新localStorage
        const newToken = response.headers['x-auth-token'];
        if (newToken) {
            localStorage.setItem('token', newToken);
        }

        // 根据后端约定，返回完整响应对象
        return response.data;
    },
    async (error: AxiosError) => {
        const originalRequest = error.config as AxiosRequestConfig & { _retry?: number };

        // Handle token expiration
        if (error.response?.status === 401) {
            try {
                const refreshToken = TokenManager.getRefreshToken();
                if (!refreshToken) {
                    throw new TokenExpiredError();
                }

                // Try to refresh the token
                const response = await axios.post(
                    `${import.meta.env.VITE_API_BASE_URL}/auth/refresh`,
                    {
                        refreshToken,
                    }
                );

                const { token, refreshToken: newRefreshToken } = response.data;
                TokenManager.setTokens(token, newRefreshToken);

                // Retry the original request
                if (originalRequest.headers) {
                    originalRequest.headers.Authorization = `Bearer ${token}`;
                }
                return http(originalRequest);
            } catch (refreshError) {
                throw new RefreshTokenError();
            }
        }

        // Implement retry mechanism for 5xx errors
        const status = error.response?.status || 0;
        const currentRetry = originalRequest._retry || 0;

        if (status >= 500 && currentRetry < MAX_RETRIES) {
            originalRequest._retry = currentRetry + 1;
            await new Promise(resolve =>
                setTimeout(resolve, RETRY_DELAY * (originalRequest._retry || 0))
            );
            return http(originalRequest);
        }

        // Convert error to custom AuthError
        const errorResponse = error.response?.data as Record<string, unknown>;
        throw new AuthError(
            (errorResponse?.message as string) || error.message || 'Unknown error',
            (errorResponse?.code as string) || 'UNKNOWN_ERROR',
            error.response?.status || 500
        );
    }
);

// Request signature generation
function generateRequestSignature(config: AxiosRequestConfig, timestamp: string): string {
    const token = TokenManager.getToken();
    const payload = `${config.method}${config.url}${timestamp}${token || ''}`;
    // In a real application, you would use a more secure hashing algorithm
    return btoa(payload);
}

// 封装GET请求
export async function get<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await http.get<T>(url, config);
    return response as T;
}

// 封装POST请求
export async function post<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    const response = await http.post<T>(url, data, config);
    return response as T;
}

// 封装PUT请求
export async function put<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    const response = await http.put<T>(url, data, config);
    return response as T;
}

// 封装DELETE请求
export async function del<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await http.delete<T>(url, config);
    return response as T;
}

export default http;
