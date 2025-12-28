import { User } from './index';

export interface LoginCredentials {
    username: string;
    password: string;
}

export interface LoginResponse {
    user: User;
    token: string;
    isNewUser: boolean;
    refreshToken: string;
}

export interface TokenPayload {
    userId: string;
    exp: number;
    iat: number;
}

export interface RefreshTokenResponse {
    token: string;
    refreshToken: string;
}

export interface UserInfoResponse {
    user: User;
}

export class AuthError extends Error {
    constructor(
        message: string,
        public code: string,
        public status: number
    ) {
        super(message);
        this.name = 'AuthError';
    }
}

export class TokenExpiredError extends AuthError {
    constructor() {
        super('Token has expired', 'TOKEN_EXPIRED', 401);
    }
}

export class InvalidTokenError extends AuthError {
    constructor() {
        super('Invalid token', 'INVALID_TOKEN', 401);
    }
}

export class RefreshTokenError extends AuthError {
    constructor() {
        super('Failed to refresh token', 'REFRESH_TOKEN_FAILED', 401);
    }
}
