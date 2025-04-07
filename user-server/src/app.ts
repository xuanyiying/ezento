import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import apiDocs from './config/swagger';
import initializeAPIRoutes from './routes';
import { notFound, errorHandler, tenantContext } from './middlewares';

// 初始化express
const app = express();

// 应用中间件
app.use(helmet());
app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true
}));
app.use(compression({
    level: 6,
    threshold: 10 * 1024 * 1024,
    filter: (req, res) => {
        if (req.headers['x-no-compression']) return false;
        return compression.filter(req, res);
    }
}));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// 初始化API文档
apiDocs(app);

// 应用租户上下文中间件到所有API路由
app.use('/api', tenantContext);

// 初始化所有API路由
initializeAPIRoutes(app);

// 404未找到中间件
app.use(notFound);

// 错误处理中间件
app.use(errorHandler);

export default app;