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
                transports: ['websocket'],
                allowEIO3: true,
                path: '/ws'
            });

            logger.info('WebSocket服务器配置完成');

            // 创建Redis客户端
            const pubClient = createClient({
                url: process.env.REDIS_URL || 'redis://localhost:6379'
            });
            const subClient = pubClient.duplicate();

            // 处理Redis连接错误
            pubClient.on('error', (err) => {
                logger.error(`Redis发布客户端错误: ${err}`);
            });
            
            subClient.on('error', (err) => {
                logger.error(`Redis订阅客户端错误: ${err}`);
            });

            // 连接Redis
            logger.info('正在连接到Redis...');
            try {
                await Promise.all([pubClient.connect(), subClient.connect()]);
                logger.info('Redis连接成功');
            } catch (redisError) {
                logger.error(`Redis连接失败: ${redisError}`);
                logger.warn('WebSocket服务器将在没有Redis的情况下运行，多实例部署可能出现问题');
            }

            // 如果Redis连接成功，设置适配器
            if (pubClient.isOpen && subClient.isOpen) {
                this.io.adapter(createAdapter(pubClient, subClient));
                logger.info('Redis适配器设置成功');
            }

            // 添加服务器错误监听
            this.io.on('connect_error', (err) => {
                logger.error(`WebSocket连接错误: ${err}`);
            });
            
            this.io.engine.on('connection_error', (err) => {
                logger.error(`WebSocket引擎连接错误: ${err}`);
            });

            // 设置连接事件处理
            this.io.on('connection', (socket) => {
                try {
                    const conversationId = socket.handshake.query.conversationId as string;
                    logger.info(`客户端连接: ${socket.id}, conversationId: ${conversationId}`);
                    
                    // 验证用户身份
                    const userId = socket.handshake.auth.userId;
                    if (!userId) {
                        logger.warn(`连接尝试但未提供userId: ${socket.id}`);
                        socket.emit('error', { message: '未提供用户ID，连接被拒绝' });
                        socket.disconnect();
                        return;
                    }
                    
                    logger.info(`用户 ${userId} 通过socket ${socket.id} 连接成功`);

                    // 先加入用户的私人房间
                    const userRoom = `user_${userId}`;
                    socket.join(userRoom);
                    logger.info(`Socket ${socket.id} 已加入用户房间: ${userRoom}`);
    
                    // 如果提供了会话ID，加入会话房间
                    if (conversationId) {
                        const conversationRoom = `conversation_${conversationId}`;
                        socket.join(conversationRoom);
                        logger.info(`Socket ${socket.id} 已加入会话房间: ${conversationRoom}`);
                        
                        // 发送连接成功消息
                        socket.emit('joined_conversation', { 
                            conversationId,
                            message: '已成功连接到会话'
                        });
                    }

                    socket.on('disconnect', (reason) => {
                        logger.info(`客户端断开连接: ${socket.id}, 原因: ${reason}, 用户ID: ${userId}`);
                    });

                    socket.on('error', (error) => {
                        logger.error(`Socket错误 [${socket.id}, 用户ID: ${userId}]: ${error}`);
                    });

                    // 发送连接确认
                    socket.emit('connection_established', { 
                        socketId: socket.id,
                        userId,
                        message: '连接成功'
                    });
                } catch (socketError) {
                    logger.error(`处理socket连接时出错: ${socketError}`);
                    socket.emit('error', { message: '连接处理失败' });
                }
            });

            // 启用连接监控
            this.setupConnectionMonitoring();
            
            // 定期运行健康检查
            setInterval(async () => {
                try {
                    await this.healthCheck();
                } catch (error) {
                    logger.error(`运行定期健康检查时出错: ${error}`);
                }
            }, 300000); // 每5分钟检查一次

            logger.info('WebSocket服务器初始化成功');
        } catch (error) {
            logger.error(`WebSocket服务器初始化失败: ${error}`);
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
            logger.info(`准备向房间 ${room} 发送事件: ${event}`);
            
            // 检查房间是否存在，获取房间里的socket数量
            const sockets = await this.io.in(room).fetchSockets();
            logger.info(`房间 ${room} 中共有 ${sockets.length} 个客户端连接`);
            
            if (sockets.length === 0) {
                logger.warn(`房间 ${room} 没有客户端连接，消息可能发送失败`);
            }
            
            // 发送消息到房间
            this.io.to(room).emit(event, data);
            logger.info(`已向房间 ${room} 发送事件: ${event}`);
            
            // 如果是重要事件，记录详细信息
            if (event === 'message_received' || event === 'ai_response_complete') {
                logger.info(`事件详情 ${event} - 数据大小: ${JSON.stringify(data).length}`);
            }
        } catch (error) {
            logger.error(`向房间 ${room} 发送事件 ${event} 失败: ${error}`);
            // 尝试恢复连接并重新发送
            try {
                logger.info(`尝试重新发送事件到房间 ${room}`);
                this.io.to(room).emit(event, data);
                logger.info(`重新发送事件 ${event} 成功`);
            } catch (retryError) {
                logger.error(`重新发送事件失败: ${retryError}`);
                throw retryError;
            }
        }
    }

    // 加入房间
    static async joinRoom(socketId: string, room: string): Promise<void> {
        try {
            const socket = this.io.sockets.sockets.get(socketId);
            if (socket) {
                logger.info(`正在将 Socket ${socketId} 加入房间 ${room}`);
                await socket.join(room);
                
                // 检查是否成功加入
                const rooms = socket.rooms;
                if (rooms && rooms.has(room)) {
                    logger.info(`Socket ${socketId} 已成功加入房间 ${room}`);
                } else {
                    logger.warn(`Socket ${socketId} 可能未成功加入房间 ${room}`);
                    // 再次尝试加入房间
                    await socket.join(room);
                    logger.info(`已再次尝试将 Socket ${socketId} 加入房间 ${room}`);
                }
            } else {
                logger.error(`无法找到 Socket ${socketId}`);
            }
        } catch (error) {
            logger.error(`将 Socket ${socketId} 加入房间 ${room} 失败: ${error}`);
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

    // 检查WebSocket健康状态
    static async healthCheck(): Promise<boolean> {
        try {
            if (!this.io) {
                logger.error('WebSocket服务未初始化');
                return false;
            }
            
            // 检查活跃连接数
            const sockets = await this.io.fetchSockets();
            logger.info(`当前WebSocket活跃连接数: ${sockets.length}`);
            
            return true;
        } catch (error) {
            logger.error(`WebSocket健康检查失败: ${error}`);
            return false;
        }
    }
    
    // 监控连接情况
    static setupConnectionMonitoring(): void {
        if (!this.io) {
            logger.error('无法设置连接监控：WebSocket服务未初始化');
            return;
        }
        
        // 定时记录连接情况
        setInterval(async () => {
            try {
                const sockets = await this.io.fetchSockets();
                logger.info(`WebSocket服务状态: ${sockets.length}个活跃连接`);
                
                // 检查各房间连接情况
                const rooms = this.io.sockets.adapter.rooms;
                logger.info(`当前活跃房间数: ${rooms.size}`);
                
                // 每分钟记录一次详细房间信息
                if (rooms.size > 0) {
                    let roomInfo = '';
                    rooms.forEach((sockets, room) => {
                        if (room.startsWith('conversation_')) {
                            roomInfo += `${room}: ${sockets.size}个连接; `;
                        }
                    });
                    if (roomInfo) {
                        logger.info(`会话房间详情: ${roomInfo}`);
                    }
                }
            } catch (error) {
                logger.error(`监控连接时出错: ${error}`);
            }
        }, 60000); // 每60秒记录一次
    }
}