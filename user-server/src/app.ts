import express from 'express';
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

class App {
    public app: express.Application;
    private server: any;

    constructor() {
        this.app = express();
        this.server = createServer(this.app);
        this.initializeMiddlewares();
        this.initializeRoutes();
        this.initializeErrorHandling();
        this.initializeWebSocket();
        this.initializeRedis();
    }
    initializeMiddlewares() {
        this.app.use(express.json());
        this.app.use(express.urlencoded({ extended: true }));
        this.app.use(cors(
            {
                origin: '*',
                methods: ['GET', 'POST', 'PUT', 'DELETE'],
                allowedHeaders: ['Content-Type', 'Authorization'],
                credentials: true,
            }
        ));
        this.app.use(helmet());
        this.app.use(compression(
            {
                threshold: 10240,
                level: 6,
                memLevel: 9,
            }
        ));
        this.app.use('/api-docs', apiDocs);
        this.app.use(notFound);
        this.app.use(errorHandler);
    }
    initializeRoutes() {
        this.app.use('/api', router);
    }
    initializeErrorHandling() {
        this.app.use(errorHandler);
    }

    private async initializeWebSocket() {
        try {
            await WebSocketServer.initialize(this.server);
            const io = WebSocketServer.getInstance();
            io.on('connection', WebSocketController.handleConnection);
            logger.info('WebSocket server initialized successfully');
        } catch (error) {
            logger.error(`WebSocket initialization failed: ${error}`);
        }
    }

    private async initializeRedis() {
        try {
            await ConversationRedisService.initialize();
            logger.info('Redis service initialized successfully');
        } catch (error) {
            logger.error(`Redis initialization failed: ${error}`);
        }
    }

    public listen() {
        const port = process.env.PORT || 3000;
        this.server.listen(port, () => {
            logger.info(`Server is running on port ${port}`);
        });
    }
}

export default new App();