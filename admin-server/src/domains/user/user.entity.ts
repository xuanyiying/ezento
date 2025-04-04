export interface User {
    id: string;
    email: string;
    name: string;
    password?: string;
    role: 'ADMIN' | 'TENANT_ADMIN' | 'USER';
    tenantId: string;
    createdAt: Date;
    updatedAt: Date;
} 