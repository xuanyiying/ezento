import { jwtDecode } from 'jwt-decode';
import { TokenPayload, TokenExpiredError, InvalidTokenError } from '../types/auth';

const TOKEN_KEY = 'token';
const REFRESH_TOKEN_KEY = 'refreshToken';
const CSRF_TOKEN_KEY = 'csrfToken';

export class TokenManager {
    static setTokens(token: string, refreshToken: string): void {
        localStorage.setItem(TOKEN_KEY, token);
        localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
    }

    static getToken(): string | null {
        return localStorage.getItem(TOKEN_KEY);
    }

    static getRefreshToken(): string | null {
        return localStorage.getItem(REFRESH_TOKEN_KEY);
    }

    static removeTokens(): void {
        localStorage.clear();
        window.dispatchEvent(new Event('storage'));
    }

    static isTokenExpired(token: string): boolean {
        try {
            const decoded = jwtDecode<TokenPayload>(token);
            const currentTime = Date.now() / 1000;
            
            const earlyExpirationTime = 5 * 60; // 5 minutes in seconds
            return decoded.exp < (currentTime + earlyExpirationTime);
        } catch (error) {
            console.error('解析token失败:', error);
            throw new InvalidTokenError();
        }
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
            return !this.isTokenExpired(token);
        } catch (error) {
            return false;
        }
    }

    // CSRF Token management
    static setCsrfToken(token: string): void {
        localStorage.setItem(CSRF_TOKEN_KEY, token);
    }

    static getCsrfToken(): string | null {
        return localStorage.getItem(CSRF_TOKEN_KEY);
    }

    static removeCsrfToken(): void {
        localStorage.removeItem(CSRF_TOKEN_KEY);
    }
}
