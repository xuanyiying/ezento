import { createClient } from 'redis';
import logger from '../config/logger';

export class ConversationRedisService {
    private static client: ReturnType<typeof createClient>;
    private static isConnected: boolean = false;
    private static inMemoryStore: Map<string, any> = new Map();

    static async initialize(): Promise<void> {
        try {
            this.client = createClient({
                url: process.env.REDIS_URL || 'redis://localhost:6379'
            });

            await this.client.connect();
            this.isConnected = true;
            logger.info('Redis client connected successfully');
        } catch (error) {
            logger.warn(`Redis client connection failed, using in-memory storage: ${error}`);
            this.isConnected = false;
        }
    }

    static async saveMessage(conversationId: string, message: any): Promise<void> {
        try {
            if (!this.isConnected) {
                const key = `conversation:${conversationId}:messages`;
                const messages = this.inMemoryStore.get(key) || [];
                messages.push(message);
                this.inMemoryStore.set(key, messages);
                return;
            }

            const key = `conversation:${conversationId}:messages`;
            await this.client.rPush(key, JSON.stringify(message));
            await this.client.expire(key, 7 * 24 * 60 * 60);
        } catch (error) {
            logger.error(`Error saving message: ${error}`);
            // Fallback to in-memory storage
            const key = `conversation:${conversationId}:messages`;
            const messages = this.inMemoryStore.get(key) || [];
            messages.push(message);
            this.inMemoryStore.set(key, messages);
        }
    }

    static async getMessages(conversationId: string): Promise<any[]> {
        try {
            if (!this.isConnected) {
                const key = `conversation:${conversationId}:messages`;
                return this.inMemoryStore.get(key) || [];
            }

            const key = `conversation:${conversationId}:messages`;
            const messages = await this.client.lRange(key, 0, -1);
            return messages.map(msg => JSON.parse(msg));
        } catch (error) {
            logger.error(`Error getting messages: ${error}`);
            // Fallback to in-memory storage
            const key = `conversation:${conversationId}:messages`;
            return this.inMemoryStore.get(key) || [];
        }
    }

    static async deleteMessages(conversationId: string): Promise<void> {
        try {
            if (!this.isConnected) {
                const key = `conversation:${conversationId}:messages`;
                this.inMemoryStore.delete(key);
                return;
            }

            const key = `conversation:${conversationId}:messages`;
            await this.client.del(key);
        } catch (error) {
            logger.error(`Error deleting messages: ${error}`);
            // Fallback to in-memory storage
            const key = `conversation:${conversationId}:messages`;
            this.inMemoryStore.delete(key);
        }
    }

    static async saveConversationState(conversationId: string, state: any): Promise<void> {
        try {
            if (!this.isConnected) {
                const key = `conversation:${conversationId}:state`;
                this.inMemoryStore.set(key, state);
                return;
            }

            const key = `conversation:${conversationId}:state`;
            await this.client.set(key, JSON.stringify(state));
            await this.client.expire(key, 7 * 24 * 60 * 60);
        } catch (error) {
            logger.error(`Error saving conversation state: ${error}`);
            // Fallback to in-memory storage
            const key = `conversation:${conversationId}:state`;
            this.inMemoryStore.set(key, state);
        }
    }

    static async getConversationState(conversationId: string): Promise<any | null> {
        try {
            if (!this.isConnected) {
                const key = `conversation:${conversationId}:state`;
                return this.inMemoryStore.get(key) || null;
            }

            const key = `conversation:${conversationId}:state`;
            const state = await this.client.get(key);
            return state ? JSON.parse(state) : null;
        } catch (error) {
            logger.error(`Error getting conversation state: ${error}`);
            // Fallback to in-memory storage
            const key = `conversation:${conversationId}:state`;
            return this.inMemoryStore.get(key) || null;
        }
    }

    static async deleteConversationState(conversationId: string): Promise<void> {
        try {
            if (!this.isConnected) {
                const key = `conversation:${conversationId}:state`;
                this.inMemoryStore.delete(key);
                return;
            }

            const key = `conversation:${conversationId}:state`;
            await this.client.del(key);
        } catch (error) {
            logger.error(`Error deleting conversation state: ${error}`);
            // Fallback to in-memory storage
            const key = `conversation:${conversationId}:state`;
            this.inMemoryStore.delete(key);
        }
    }
}