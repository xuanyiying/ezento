import swaggerJsdoc from 'swagger-jsdoc';

// Swagger基本配置
const options: swaggerJsdoc.Options = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'Ezento Admin API',
            version: '1.0.0',
            description: 'API documentation for Ezento Admin system',
            contact: {
                name: 'API Support',
                email: 'support@ezento.com'
            }
        },
        servers: [
            {
                url: '/api/v1',
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
    // 指定API路由所在的文件路径
    apis: [
        './src/routes/*.ts',
        './src/controllers/*.ts',
        './src/domains/**/*.entity.ts'
    ]
};

// 生成Swagger规格
const swaggerSpec = swaggerJsdoc(options);

export default swaggerSpec; 