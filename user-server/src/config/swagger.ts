import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import express from 'express';

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

const specs = swaggerJsdoc(options);

export default function apiDocs() {
  const router = express.Router();
  router.use('/', swaggerUi.serve);
  router.get('/', swaggerUi.setup(specs));
  return router;
}