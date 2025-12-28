declare namespace Express {
    export interface Request {
        tenantId?: string;
        user?: {
            id: string;
            email?: string;
            role?: string;
            tenantId?: string;
        };
    }
}
