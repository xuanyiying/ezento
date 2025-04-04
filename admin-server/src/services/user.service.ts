import { IUserRepository } from '../repositories/user.repository';
import { User } from '../domains/user/user.entity';
import { ApiError } from '../middlewares/errorHandler';
import bcrypt from 'bcrypt';

export class UserService {
    constructor(private userRepository: IUserRepository) { }

    async findById(id: string): Promise<User | null> {
        return this.userRepository.findById(id);
    }

    async findByEmail(email: string): Promise<User | null> {
        return this.userRepository.findByEmail(email);
    }

    async findByTenant(tenantId: string): Promise<User[]> {
        return this.userRepository.findByTenant(tenantId);
    }

    async create(data: Partial<User>): Promise<User> {
        const existingUser = await this.findByEmail(data.email!);
        if (existingUser) {
            throw new ApiError(400, '邮箱已被使用');
        }

        const hashedPassword = await bcrypt.hash(data.password!, 10);
        return this.userRepository.create({
            ...data,
            password: hashedPassword
        });
    }

    async update(id: string, data: Partial<User>): Promise<User> {
        const user = await this.findById(id);
        if (!user) {
            throw new ApiError(404, '用户不存在');
        }

        if (data.email && data.email !== user.email) {
            const existingUser = await this.findByEmail(data.email);
            if (existingUser) {
                throw new ApiError(400, '邮箱已被使用');
            }
        }

        return this.userRepository.update(id, data);
    }

    async delete(id: string): Promise<void> {
        const user = await this.findById(id);
        if (!user) {
            throw new ApiError(404, '用户不存在');
        }
        await this.userRepository.delete(id);
    }

    async resetPassword(id: string, newPassword: string): Promise<void> {
        const user = await this.findById(id);
        if (!user) {
            throw new ApiError(404, '用户不存在');
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10);
        await this.userRepository.updatePassword(id, hashedPassword);
    }

    async validatePassword(email: string, password: string): Promise<User | null> {
        const user = await this.findByEmail(email);
        if (!user) {
            return null;
        }

        const isValid = await bcrypt.compare(password, user.password!);
        return isValid ? user : null;
    }
} 