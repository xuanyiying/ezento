import { jwtDecode } from 'jwt-decode';
import { TokenPayload, TokenExpiredError, InvalidTokenError } from '../types/auth';

/**
 * Token 管理工具类
 * 负责存储、获取和清除用户认证相关的令牌
 */
export class TokenManager {
    private static readonly TOKEN_KEY = 'auth_token';
    private static readonly REFRESH_TOKEN_KEY = 'refresh_token';
    private static readonly TOKEN_EXPIRY_KEY = 'token_expiry';
    private static readonly CSRF_TOKEN_KEY = 'csrf_token';

    /**
     * 保存用户令牌到本地存储
     * @param token 访问令牌
     * @param refreshToken 刷新令牌
     * @param expiresIn 令牌过期时间（秒）
     */
    public static saveTokens(token: string, refreshToken: string, expiresIn?: number): void {
        localStorage.setItem(this.TOKEN_KEY, token);
        localStorage.setItem(this.REFRESH_TOKEN_KEY, refreshToken);
        
        // 如果提供了过期时间，则计算过期时间戳并保存
        if (expiresIn) {
            const expiryTime = Date.now() + expiresIn * 1000;
            localStorage.setItem(this.TOKEN_EXPIRY_KEY, expiryTime.toString());
        } else {
            // 否则尝试从token中获取过期时间
            try {
                const decoded = jwtDecode<TokenPayload>(token);
                if (decoded && decoded.exp) {
                    localStorage.setItem(this.TOKEN_EXPIRY_KEY, (decoded.exp * 1000).toString());
                }
            } catch (error) {
                console.error('解析token以获取过期时间失败:', error);
            }
        }
    }

    /**
     * 获取访问令牌
     * @returns 存储的访问令牌，如未找到则返回null
     */
    public static getToken(): string | null {
        return localStorage.getItem(this.TOKEN_KEY);
    }

    /**
     * 获取刷新令牌
     * @returns 存储的刷新令牌，如未找到则返回null
     */
    public static getRefreshToken(): string | null {
        return localStorage.getItem(this.REFRESH_TOKEN_KEY);
    }

    /**
     * 检查令牌是否已过期
     * @returns 如果令牌已过期或不存在则返回true，否则返回false
     */
    public static isTokenExpired(): boolean {
        const expiryTimeStr = localStorage.getItem(this.TOKEN_EXPIRY_KEY);
        if (!expiryTimeStr) return true;
        
        const expiryTime = parseInt(expiryTimeStr, 10);
        return Date.now() >= expiryTime;
    }

    /**
     * 移除所有存储的令牌
     */
    public static removeTokens(): void {
        localStorage.removeItem(this.TOKEN_KEY);
        localStorage.removeItem(this.REFRESH_TOKEN_KEY);
        localStorage.removeItem(this.TOKEN_EXPIRY_KEY);
        localStorage.removeItem(this.CSRF_TOKEN_KEY);
    }

    static getTokenPayload(token: string): TokenPayload {
        try {
            return jwtDecode<TokenPayload>(token);
        } catch (error) {
            console.error('获取token payload失败:', error);
            throw new InvalidTokenError();
        }
    }

    static validateToken(): void {
        const token = this.getToken();
        if (!token) {
            console.error('Token不存在');
            throw new InvalidTokenError();
        }
        
        try {
            const decoded = jwtDecode<TokenPayload>(token);
            const currentTime = Date.now() / 1000;
            
            if (decoded.exp < currentTime) {
                console.error('Token已过期');
                throw new TokenExpiredError();
            }
            
            if (!decoded.userId) {
                console.error('Token缺少必要的信息');
                throw new InvalidTokenError();
            }
        } catch (error) {
            if (error instanceof TokenExpiredError) {
                throw error;
            }
            console.error('验证token时发生错误:', error);
            throw new InvalidTokenError();
        }
    }

    static isLoggedIn(): boolean {
        const token = this.getToken();
        if (!token) return false;
        
        try {
            return !this.isTokenExpired();
        } catch (error) {
            return false;
        }
    }

    // CSRF Token management
    static setCsrfToken(token: string): void {
        localStorage.setItem(this.CSRF_TOKEN_KEY, token);
    }

    static getCsrfToken(): string | null {
        return localStorage.getItem(this.CSRF_TOKEN_KEY);
    }

    static removeCsrfToken(): void {
        localStorage.removeItem(this.CSRF_TOKEN_KEY);
    }
}

export default TokenManager;
