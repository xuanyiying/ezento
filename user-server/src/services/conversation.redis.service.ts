import { createClient } from 'redis';
import logger from '../config/logger';

export class ConversationRedisService {
    private static client: ReturnType<typeof createClient>;

    static async initialize(): Promise<void> {
        try {
            this.client = createClient({
                url: process.env.REDIS_URL || 'redis://localhost:6379'
            });

            await this.client.connect();
            logger.info('Redis client connected successfully');
        } catch (error) {
            logger.error(`Redis client connection failed: ${error}`);
            throw error;
        }
    }

    static async saveMessage(conversationId: string, message: any): Promise<void> {
        try {
            const key = `conversation:${conversationId}:messages`;
            await this.client.rPush(key, JSON.stringify(message));
            // 设置消息过期时间（例如7天）
            await this.client.expire(key, 7 * 24 * 60 * 60);
        } catch (error) {
            logger.error(`Error saving message to Redis: ${error}`);
            throw error;
        }
    }

    static async getMessages(conversationId: string): Promise<any[]> {
        try {
            const key = `conversation:${conversationId}:messages`;
            const messages = await this.client.lRange(key, 0, -1);
            return messages.map(msg => JSON.parse(msg));
        } catch (error) {
            logger.error(`Error getting messages from Redis: ${error}`);
            throw error;
        }
    }

    static async deleteMessages(conversationId: string): Promise<void> {
        try {
            const key = `conversation:${conversationId}:messages`;
            await this.client.del(key);
        } catch (error) {
            logger.error(`Error deleting messages from Redis: ${error}`);
            throw error;
        }
    }

    static async saveConversationState(conversationId: string, state: any): Promise<void> {
        try {
            const key = `conversation:${conversationId}:state`;
            await this.client.set(key, JSON.stringify(state));
            // 设置状态过期时间（例如7天）
            await this.client.expire(key, 7 * 24 * 60 * 60);
        } catch (error) {
            logger.error(`Error saving conversation state to Redis: ${error}`);
            throw error;
        }
    }

    static async getConversationState(conversationId: string): Promise<any | null> {
        try {
            const key = `conversation:${conversationId}:state`;
            const state = await this.client.get(key);
            return state ? JSON.parse(state) : null;
        } catch (error) {
            logger.error(`Error getting conversation state from Redis: ${error}`);
            throw error;
        }
    }

    static async deleteConversationState(conversationId: string): Promise<void> {
        try {
            const key = `conversation:${conversationId}:state`;
            await this.client.del(key);
        } catch (error) {
            logger.error(`Error deleting conversation state from Redis: ${error}`);
            throw error;
        }
    }
}