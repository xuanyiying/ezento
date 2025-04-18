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
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(REFRESH_TOKEN_KEY);
    }

    static isTokenExpired(token: string): boolean {
        try {
            const decoded = jwtDecode<TokenPayload>(token);
            const currentTime = Date.now() / 1000;
            return decoded.exp < currentTime;
        } catch {
            throw new InvalidTokenError();
        }
    }

    static getTokenPayload(token: string): TokenPayload {
        try {
            return jwtDecode<TokenPayload>(token);
        } catch {
            throw new InvalidTokenError();
        }
    }

    static validateToken(): void {
        const token = this.getToken();
        if (!token) {
            throw new InvalidTokenError();
        }
        if (this.isTokenExpired(token)) {
            throw new TokenExpiredError();
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
