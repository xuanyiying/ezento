import express, { Express } from 'express';
import { createServer } from 'http';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import apiDocs from './config/swagger';
import { notFound, errorHandler } from './middlewares';
import { WebSocketServer } from './config/socket';
import { WebSocketController } from './controllers/websocket.controller';
import { ConversationRedisService } from './services/conversation.redis.service';
import logger from './config/logger';
import router from './routes';

/**
 * 应用程序类
 * 负责初始化Express应用程序，配置中间件，路由，错误处理，WebSocket和Redis服务
 */
class App {
    public app: express.Application;
    private server: any;

    /**
     * 构造函数
     * 初始化Express应用和HTTP服务器
     */
    constructor() {
        this.app = express();
        this.server = createServer(this.app);
        this.initializeMiddlewares();
        this.initializeRoutes();
        this.initializeErrorHandling();
        this.initializeWebSocket();
        this.initializeRedis();
    }

    /**
     * 初始化中间件
     * 配置请求解析，CORS，安全头，压缩等中间件
     */
    initializeMiddlewares() {
        // 解析JSON请求体
        this.app.use(express.json());
        // 解析URL编码的请求体
        this.app.use(express.urlencoded({ extended: true }));
        // 跨域资源共享设置
        this.app.use(cors(
            {
                origin: '*',
                methods: ['GET', 'POST', 'PUT', 'DELETE'],
                allowedHeaders: ['Content-Type', 'Authorization'],
                credentials: true,
            }
        ));
        // 安全HTTP头
        this.app.use(helmet());
        // 压缩响应
        this.app.use(compression(
            {
                threshold: 10240, // 只压缩大于10KB的响应
                level: 6,         // 压缩级别6（0-9，9为最高压缩率）
                memLevel: 9,      // 内存使用级别9（1-9，9为最高内存使用）
            }
        ));
        // API文档路由
        this.app.use('/api-docs', apiDocs());
    }

    /**
     * 初始化API路由
     * 所有API路由都在/api前缀下
     */
    initializeRoutes() {
        this.app.use('/api', router);
    }

    /**
     * 初始化错误处理中间件
     * 这些中间件应当在路由之后添加，以捕获未匹配的路由
     */
    initializeErrorHandling() {
        this.app.use(notFound);     // 处理404错误
        this.app.use(errorHandler); // 处理其他错误
    }

    /**
     * 初始化WebSocket服务
     * 用于实时通信，如AI流式响应
     */
    private async initializeWebSocket() {
        try {
            await WebSocketServer.initialize(this.server);
            const io = WebSocketServer.getInstance();
            io.on('connection', WebSocketController.handleConnection);
            logger.info('WebSocket服务器初始化成功');
        } catch (error) {
            logger.error(`WebSocket初始化失败: ${error}`);
        }
    }

    /**
     * 初始化Redis服务
     * 用于会话缓存和消息队列
     */
    private async initializeRedis() {
        try {
            await ConversationRedisService.initialize();
            logger.info('Redis服务初始化成功');
        } catch (error) {
            logger.error(`Redis初始化失败: ${error}`);
        }
    }

    /**
     * 启动HTTP服务器
     * @param PORT 服务器端口
     * @param p0 服务器启动回调函数
     */
    public listen(PORT: string | number, p0: () => void) {
        this.server.listen(PORT, () => {
            logger.info(`服务器运行在端口 ${PORT}`);
        });
    }
}

export default new App();