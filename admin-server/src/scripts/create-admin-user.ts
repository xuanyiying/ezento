import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import dotenv from 'dotenv';

// 加载环境变量
dotenv.config();

const prisma = new PrismaClient();

async function createAdminUser() {
    try {
        // 检查用户是否已存在
        const existingUser = await prisma.user.findUnique({
            where: {
                email: 'admin@ezento.com'
            }
        });

        if (existingUser) {
            console.log('管理员用户已存在，跳过创建');
            return;
        }

        // 创建超级管理员租户
        const adminTenant = await prisma.tenant.create({
            data: {
                name: '系统管理员',
                code: 'admin',
                status: 'ACTIVE',
                plan: 'ENTERPRISE',
                settings: {}
            }
        });

        console.log('创建系统管理员租户成功:', adminTenant.id);

        // 创建管理员用户
        const hashedPassword = await bcrypt.hash('admin123', 10);
        
        const adminUser = await prisma.user.create({
            data: {
                email: 'admin@ezento.com',
                name: '系统管理员',
                password: hashedPassword,
                role: 'ADMIN',
                tenantId: adminTenant.id
            }
        });

        console.log('创建管理员用户成功:', adminUser.id);
        console.log('用户登录信息:');
        console.log('邮箱: admin@ezento.com');
        console.log('密码: admin123');
    } catch (error) {
        console.error('创建管理员用户失败:', error);
    } finally {
        await prisma.$disconnect();
    }
}

// 执行脚本
createAdminUser(); 