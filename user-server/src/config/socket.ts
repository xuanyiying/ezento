import { Server } from 'socket.io';
import { createAdapter } from '@socket.io/redis-adapter';
import { createClient } from 'redis';
import logger from './logger';
import { Server as HttpServer } from 'http';

export class WebSocketServer {
    private static io: Server;

    static async initialize(httpServer: HttpServer): Promise<void> {
        try {
            // 创建Socket.io服务器
            this.io = new Server(httpServer, {
                cors: {
                    origin: process.env.CLIENT_URL || '*',
                    methods: ['GET', 'POST'],
                    credentials: true
                },
                pingTimeout: 60000,
                pingInterval: 25000,
                connectTimeout: 10000,
                transports: ['websocket', 'polling']
            });

            // 创建Redis客户端
            const pubClient = createClient({
                url: process.env.REDIS_URL || 'redis://localhost:6379'
            });
            const subClient = pubClient.duplicate();

            // 连接Redis
            await Promise.all([pubClient.connect(), subClient.connect()]);

            // 设置Redis适配器
            this.io.adapter(createAdapter(pubClient, subClient));

            // 设置连接事件处理
            this.io.on('connection', (socket) => {
                logger.info(`Client connected: ${socket.id}`);
                
                // 验证用户身份
                const userId = socket.handshake.auth.userId;
                if (!userId) {
                    logger.warn(`Connection attempt without userId: ${socket.id}`);
                    socket.disconnect();
                    return;
                }
                
                logger.info(`User ${userId} connected with socket ${socket.id}`);

                socket.on('disconnect', () => {
                    logger.info(`Client disconnected: ${socket.id}`);
                });

                socket.on('error', (error) => {
                    logger.error(`Socket error: ${error}`);
                });
            });

            logger.info('WebSocket server initialized successfully');
        } catch (error) {
            logger.error(`WebSocket server initialization failed: ${error}`);
            throw error;
        }
    }

    static getInstance(): Server {
        if (!this.io) {
            throw new Error('WebSocket server not initialized');
        }
        return this.io;
    }

    // 发送消息到指定房间
    static async emitToRoom(room: string, event: string, data: any): Promise<void> {
        try {
            this.io.to(room).emit(event, data);
        } catch (error) {
            logger.error(`Error emitting to room ${room}: ${error}`);
            throw error;
        }
    }

    // 加入房间
    static async joinRoom(socketId: string, room: string): Promise<void> {
        try {
            const socket = this.io.sockets.sockets.get(socketId);
            if (socket) {
                await socket.join(room);
                logger.info(`Socket ${socketId} joined room ${room}`);
            }
        } catch (error) {
            logger.error(`Error joining room ${room}: ${error}`);
            throw error;
        }
    }

    // 离开房间
    static async leaveRoom(socketId: string, room: string): Promise<void> {
        try {
            const socket = this.io.sockets.sockets.get(socketId);
            if (socket) {
                await socket.leave(room);
                logger.info(`Socket ${socketId} left room ${room}`);
            }
        } catch (error) {
            logger.error(`Error leaving room ${room}: ${error}`);
            throw error;
        }
    }
}