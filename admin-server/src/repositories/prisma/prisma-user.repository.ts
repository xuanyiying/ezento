import { PrismaClient } from '@prisma/client';
import { IUserRepository } from '../user.repository';
import { User } from '../../domains/user/user.entity';

export class PrismaUserRepository implements IUserRepository {
    constructor(private prisma: PrismaClient) {}

    async findById(id: string): Promise<User | null> {
        const user = await this.prisma.user.findUnique({
            where: { id },
        });
        return user ? this.mapToEntity(user) : null;
    }

    async findByEmail(email: string): Promise<User | null> {
        const user = await this.prisma.user.findUnique({
            where: { email },
        });
        return user ? this.mapToEntity(user) : null;
    }

    async findByTenant(tenantId: string): Promise<User[]> {
        const users = await this.prisma.user.findMany({
            where: { tenantId },
        });
        return users.map((user: any) => this.mapToEntity(user));
    }

    async create(data: Partial<User>): Promise<User> {
        const user = await this.prisma.user.create({
            data: this.mapToPrisma(data),
        });
        return this.mapToEntity(user);
    }

    async update(id: string, data: Partial<User>): Promise<User> {
        const user = await this.prisma.user.update({
            where: { id },
            data: this.mapToPrisma(data),
        });
        return this.mapToEntity(user);
    }

    async delete(id: string): Promise<void> {
        await this.prisma.user.delete({
            where: { id },
        });
    }

    async updatePassword(id: string, hashedPassword: string): Promise<void> {
        await this.prisma.user.update({
            where: { id },
            data: { password: hashedPassword },
        });
    }

    private mapToEntity(prismaUser: any): User {
        return {
            id: prismaUser.id,
            email: prismaUser.email,
            name: prismaUser.name,
            password: prismaUser.password,
            role: prismaUser.role as 'ADMIN' | 'TENANT_ADMIN' | 'USER',
            tenantId: prismaUser.tenantId,
            createdAt: prismaUser.createdAt,
            updatedAt: prismaUser.updatedAt,
        };
    }

    private mapToPrisma(user: Partial<User>): any {
        const data: any = {
            email: user.email,
            name: user.name,
            role: user.role,
            tenantId: user.tenantId,
        };

        // 只有当密码不为undefined时才添加，避免在更新时覆盖密码
        if (user.password !== undefined) {
            data.password = user.password;
        }

        return data;
    }
}
