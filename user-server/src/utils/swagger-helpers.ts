/**
 * @swagger
 * components:
 *   schemas:
 *     ApiResponse:
 *       type: object
 *       properties:
 *         code:
 *           type: integer
 *           description: HTTP status code
 *           example: 200
 *         msg:
 *           type: string
 *           description: Response message
 *           example: success
 *         data:
 *           type: object
 *           description: Response data
 *     PaginatedResponse:
 *       type: object
 *       properties:
 *         code:
 *           type: integer
 *           description: HTTP status code
 *           example: 200
 *         msg:
 *           type: string
 *           description: Response message
 *           example: success
 *         data:
 *           type: array
 *           items:
 *             type: object
 *         pagination:
 *           type: object
 *           properties:
 *             total:
 *               type: integer
 *               description: Total number of items
 *               example: 100
 *             page:
 *               type: integer
 *               description: Current page
 *               example: 1
 *             limit:
 *               type: integer
 *               description: Items per page
 *               example: 10
 *     ErrorResponse:
 *       type: object
 *       properties:
 *         code:
 *           type: integer
 *           description: HTTP status code
 *           example: 400
 *         msg:
 *           type: string
 *           description: Error message
 *           example: Invalid input
 *         data:
 *           type: null
 */

/**
 * Helper functions to create standard Swagger response documentation
 */
export class SwaggerResponses {
    /**
     * Creates standard success response documentation
     */
    static success(description = 'Successful operation', schema = {}) {
        return {
            '200': {
                description,
                content: {
                    'application/json': {
                        schema: {
                            allOf: [
                                { $ref: '#/components/schemas/ApiResponse' },
                                {
                                    properties: {
                                        data: {
                                            properties: schema
                                        }
                                    }
                                }
                            ]
                        }
                    }
                }
            }
        };
    }

    /**
     * Creates standard created response documentation
     */
    static created(description = 'Created successfully', schema = {}) {
        return {
            '201': {
                description,
                content: {
                    'application/json': {
                        schema: {
                            allOf: [
                                { $ref: '#/components/schemas/ApiResponse' },
                                {
                                    properties: {
                                        data: {
                                            properties: schema
                                        }
                                    }
                                }
                            ]
                        }
                    }
                }
            }
        };
    }

    /**
     * Creates standard error response documentation
     */
    static error(statusCode = 400, description = 'Bad request') {
        return {
            [statusCode]: {
                description,
                content: {
                    'application/json': {
                        schema: {
                            $ref: '#/components/schemas/ErrorResponse'
                        }
                    }
                }
            }
        };
    }

    /**
     * Creates standard paginated response documentation
     */
    static paginated(description = 'Successful operation', itemSchema = {}) {
        return {
            '200': {
                description,
                content: {
                    'application/json': {
                        schema: {
                            allOf: [
                                { $ref: '#/components/schemas/PaginatedResponse' },
                                {
                                    properties: {
                                        data: {
                                            type: 'array',
                                            items: itemSchema
                                        }
                                    }
                                }
                            ]
                        }
                    }
                }
            }
        };
    }
} 