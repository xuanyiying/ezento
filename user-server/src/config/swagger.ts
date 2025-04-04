import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import { Express } from 'express';

const options: swaggerJsdoc.Options = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'E诊通 API',
            version: '1.0.0',
            description: 'E诊通应用程序API文档',
            contact: {
                name: 'API Support',
                email: 'support@ezento.com'
            }
        },
        servers: [
            {
                url: '/api',
                description: 'API Server'
            }
        ],
        components: {
            securitySchemes: {
                bearerAuth: {
                    type: 'http',
                    scheme: 'bearer',
                    bearerFormat: 'JWT'
                }
            }
        },
        security: [
            {
                bearerAuth: []
            }
        ]
    },
    // Path to the API docs
    apis: [
        './src/controllers/*.ts',
        './src/routes/*.ts',
        './src/models/*.ts'
    ]
};

const swaggerSpec = swaggerJsdoc(options);

const apiDocs = (app: Express) => {
    // Swagger API文档路由
    // 添加Swagger文档
    app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
        explorer: true,
        customCss: '.swagger-ui .topbar { display: none }',
        customSiteTitle: 'Ezento Admin API文档'
    }));

    // 提供Swagger规范的JSON端点
    app.get('/api-docs.json', (req, res) => {
        res.setHeader('Content-Type', 'application/json');
        res.send(swaggerSpec);
    });

};

export default apiDocs; 