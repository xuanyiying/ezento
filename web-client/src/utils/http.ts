import axios, { AxiosError, AxiosRequestConfig, AxiosResponse } from 'axios';
import { TokenManager } from './tokenManager';
import { AuthError, RefreshTokenError, TokenExpiredError } from '../types/auth';

const MAX_RETRIES = 1;
const RETRY_DELAY = 1000; // 1 second

// 添加请求计数器和限制
interface ApiRequestLimit {
    maxRequests: number;
    resetInterval: number;
    requests: number;
    lastResetTime: number;
}

interface ApiRequestLimits {
    [key: string]: ApiRequestLimit;
}

const API_REQUEST_LIMITS: ApiRequestLimits = {
    '/api/conversations/user/all': {
        maxRequests: 3, // 最大请求次数限制
        resetInterval: 60000, // 重置间隔（毫秒）- 1分钟
        requests: 0,
        lastResetTime: Date.now(),
    },
};

// 检查和限制API请求频率
function checkApiRequestLimit(url: string): boolean {
    // 提取 API 路径
    const apiPath = url.replace(/^(https?:\/\/[^\/]+)?\/api/, '/api');
    
    // 检查是否需要限制
    const limitInfo = API_REQUEST_LIMITS[apiPath];
    if (!limitInfo) return true; // 如果没有限制信息，允许请求
    
    const now = Date.now();
    
    // 检查是否需要重置计数器
    if (now - limitInfo.lastResetTime > limitInfo.resetInterval) {
        limitInfo.requests = 0;
        limitInfo.lastResetTime = now;
    }
    
    // 检查是否超过限制
    if (limitInfo.requests >= limitInfo.maxRequests) {
        console.warn(`API请求 ${apiPath} 已达到限制，在${Math.ceil((limitInfo.resetInterval - (now - limitInfo.lastResetTime)) / 1000)}秒内不再发送请求`);
        return false;
    }
    
    // 增加请求计数
    limitInfo.requests++;
    return true;
}

// 创建axios实例
const http = axios.create({
    baseURL: import.meta.env.DEV ? '/api' : import.meta.env.VITE_API_BASE_URL,
    timeout: 10000,
    headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
    },
});

// 修改请求拦截器
http.interceptors.request.use(
    config => {
        // 检查API请求限制
        if (config.url && !checkApiRequestLimit(config.url)) {
            // 创建一个取消令牌
            const cancelToken = axios.CancelToken.source();
            config.cancelToken = cancelToken.token;
            // 立即取消请求
            cancelToken.cancel(`API请求被限制: ${config.url}`);
            console.warn(`请求已被限制: ${config.url}`);
            return config;
        }
        
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
        
        // 确保配置不为空
        if (!originalRequest) {
            return Promise.reject(error);
        }

        // Handle token expiration
        if (error.response?.status === 401) {
            console.log('收到401错误，请求URL:', originalRequest.url);
            console.log('当前token是否存在:', !!TokenManager.getToken());
            
            // 如果已经尝试过刷新令牌，不要再次尝试（防止循环）
            if (originalRequest._retry) {
                // 清除令牌并触发重新登录
                console.log('已尝试刷新令牌但仍然失败，将重定向到登录页面');
                TokenManager.removeTokens();
                window.location.href = '/login';
                return Promise.reject(new TokenExpiredError());
            }

            try {
                // 标记请求已经尝试过刷新
                originalRequest._retry = 1;
                
                const refreshToken = TokenManager.getRefreshToken();
                if (!refreshToken) {
                    console.log('没有找到刷新令牌，将重定向到登录页面');
                    TokenManager.removeTokens();
                    window.location.href = '/login';
                    throw new TokenExpiredError();
                }

                console.log('尝试使用刷新令牌获取新的访问令牌');
                // Try to refresh the token
                const response = await axios.post(
                    `${import.meta.env.DEV ? '/api' : import.meta.env.VITE_API_BASE_URL}/auth/refresh`,
                    {
                        refreshToken,
                    }
                );

                if (!response.data || !response.data.data) {
                    console.log('刷新令牌响应无效');
                    throw new RefreshTokenError();
                }

                const { token, refreshToken: newRefreshToken } = response.data.data;
                if (!token || !newRefreshToken) {
                    console.log('从响应中获取新令牌失败');
                    throw new RefreshTokenError();
                }

                console.log('成功获取新令牌，将重试原始请求');
                TokenManager.saveTokens(token, newRefreshToken);

                // Retry the original request
                if (originalRequest.headers) {
                    originalRequest.headers.Authorization = `Bearer ${token}`;
                }
                return http(originalRequest);
            } catch (refreshError) {
                console.error('Token refresh failed:', refreshError);
                TokenManager.removeTokens();
                window.location.href = '/login';
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
    try {
        // 在发送请求前检查并添加授权信息
        if (!config) config = {};
        if (!config.headers) config.headers = {};
        
        const token = TokenManager.getToken();
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        
        console.log(`发送DELETE请求到 ${url}，验证令牌存在: ${!!token}`);
        const response = await http.delete<T>(url, config);
        return response as T;
    } catch (error) {
        console.error(`DELETE请求失败 (${url}):`, error);
        throw error;
    }
}

export default http;
