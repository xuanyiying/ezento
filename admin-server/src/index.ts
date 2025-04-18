import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import swaggerUi from 'swagger-ui-express';
import { DIContainer } from './di/container';
import tenantRoutes from './routes/tenant.routes';
import billingRoutes from './routes/billing.routes';
import modelRoutes from './routes/model.routes';
import templateRoutes from './routes/template.routes';
import authRoutes from './routes/auth.routes';
import { errorHandler } from './middlewares/errorHandler';
import { circuitBreakerRoutes } from './routes/circuit-breaker.routes';
import { apiGatewayRoutes } from './routes/api-gateway.routes';
import swaggerSpec from './swagger/config';

// 加载环境变量
dotenv.config();

// 初始化应用
const app = express();
const PORT = process.env.PORT || 3000;

// 初始化依赖注入容器
const container = DIContainer.getInstance();

// 中间件配置
app.use(
    helmet({
        // 允许在Swagger UI中使用内联脚本和样式
        contentSecurityPolicy: {
            directives: {
                defaultSrc: ["'self'"],
                scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
                styleSrc: ["'self'", "'unsafe-inline'"],
            },
        },
    })
);
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

// 添加Swagger文档
app.use(
    '/api-docs',
    swaggerUi.serve,
    swaggerUi.setup(swaggerSpec, {
        explorer: true,
        customCss: '.swagger-ui .topbar { display: none }',
        customSiteTitle: 'Ezento Admin API文档',
    })
);

// 提供Swagger规范的JSON端点
app.get('/api-docs.json', (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(swaggerSpec);
});

// 注册路由
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/tenants', tenantRoutes);
//app.use('/api/v1/users', userRoutes);
app.use('/api/v1/billing', billingRoutes);
app.use('/api/v1/models', modelRoutes);
app.use('/api/v1/templates', templateRoutes);
app.use('/api/v1/circuit-breakers', circuitBreakerRoutes);
app.use('/api/v1/gateways', apiGatewayRoutes);

// 健康检查
app.get('/health', (req: Request, res: Response) => {
    res.json({
        status: 'success',
        message: 'Service is running',
        timestamp: new Date().toISOString(),
    });
});

// API文档重定向
app.get('/', (req, res) => {
    res.redirect('/api-docs');
});

// 错误处理中间件
app.use(errorHandler);

// 启动服务器
const server = app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

// 处理进程退出
process.on('SIGTERM', async () => {
    console.log('SIGTERM received, shutting down gracefully');
    server.close(async () => {
        await container.disconnect();
        console.log('Process terminated');
        process.exit(0);
    });
});

process.on('SIGINT', async () => {
    console.log('SIGINT received, shutting down gracefully');
    server.close(async () => {
        await container.disconnect();
        console.log('Process terminated');
        process.exit(0);
    });
});

export default app;
