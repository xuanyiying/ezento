// API response type
export interface ApiResponse<T = any> {
    success: boolean;
    message?: string;
    data?: T;
    error?: string;
}

export interface User {
    userId: string;
    gender: string | undefined;
    birthDate: string | undefined;
    phone: string | undefined;
    name?: string;
    role?: string;
    avatar?: string;
    tenantId?: string;
    email?: string;
    isIdentityConfirmed?: boolean;
    age?: number;
    idCardNumber?: string;
}

// Pagination type
export interface Pagination {
    page: number;
    pageSize: number;
    total: number;
}

export interface PaginatedResponse<T> extends ApiResponse {
    data: {
        items: T[];
        total: number;
        page: number;
        pageSize: number;
    };
}
