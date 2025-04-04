import bcrypt from 'bcrypt';

/**
 * 密码工具类
 * 提供统一的密码加密和比较方法
 */
export class PasswordUtil {
    /**
     * 标准盐值轮数
     */
    private static readonly SALT_ROUNDS = 10;

    /**
     * 使用bcrypt对密码进行哈希处理
     * @param plainPassword 明文密码
     * @returns 加密后的密码哈希
     */
    static async hashPassword(plainPassword: string): Promise<string> {
        return bcrypt.hash(plainPassword, this.SALT_ROUNDS);
    }

    /**
     * 比较明文密码与存储的哈希值是否匹配
     * @param plainPassword 明文密码
     * @param hashedPassword 存储的密码哈希
     * @returns 是否匹配
     */
    static async comparePassword(plainPassword: string, hashedPassword: string): Promise<boolean> {
        try {
            const result = await bcrypt.compare(plainPassword, hashedPassword);
            return result;
        } catch (error) {
            console.error('密码比较出错:', error);
            return false;
        }
    }
}

export default PasswordUtil; 