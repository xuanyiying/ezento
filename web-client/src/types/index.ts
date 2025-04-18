// API response type
export interface ApiResponse<T> {
    code: number;
    message: string;
    data: T;
}

export interface User {
    gender: string | undefined;
    birthDate: string | undefined;
    phone: string | undefined;
    userId: string;
    name?: string;
    role?: string;
    avatar?: string;
    tenantId?: string;
    email?: string;
}

// Pagination type
export interface Pagination {
    page: number;
    pageSize: number;
    total: number;
}

export interface PaginatedResponse<T>
    extends ApiResponse<{
        items: T[];
        pagination: Pagination;
    }> {}
