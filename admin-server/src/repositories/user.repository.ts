import { User } from '../domains/user/user.entity';

export interface IUserRepository {
    findById(id: string): Promise<User | null>;
    findByEmail(email: string): Promise<User | null>;
    findByTenant(tenantId: string): Promise<User[]>;
    create(data: Partial<User>): Promise<User>;
    update(id: string, data: Partial<User>): Promise<User>;
    delete(id: string): Promise<void>;
    updatePassword(id: string, hashedPassword: string): Promise<void>;
}
