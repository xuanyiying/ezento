// This file extends the Express Request type
import { User } from '../domains/user/user.entity';

declare global {
    namespace Express {
        interface Request {
            user?: User;
            tenantId?: string;
        }
    }
}

export { }; 