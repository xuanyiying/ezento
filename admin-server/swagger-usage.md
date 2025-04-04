# Swagger API文档使用指南

## 访问API文档

应用启动后，您可以通过以下URL访问API文档：

- **<http://localhost:3000/api-docs>**

这个页面提供了一个交互式的API文档，允许您浏览API端点、查看请求/响应模型，并直接测试API。

## 特性

- 完整的API端点列表
- 按标签分组的API（例如：Tenants, Users, Billing等）
- 请求和响应模型的详细说明
- 授权支持（JWT Bearer令牌）
- 交互式测试功能
- 模型架构展示

## 如何扩展文档

### 添加新的API端点

1. 在控制器文件中，使用JSDoc注释格式添加Swagger注解：

```typescript
/**
 * @swagger
 * /path/to/endpoint:
 *   method:
 *     summary: 简短描述
 *     description: 详细描述
 *     tags: [分类标签]
 *     parameters:
 *       - 参数定义...
 *     requestBody:
 *       - 请求体定义...
 *     responses:
 *       200:
 *         description: 成功响应
 *         content:
 *           application/json:
 *             schema:
 *               - 响应模型...
 */
async methodName(req: Request, res: Response) {
  // 实现代码
}
```

### 添加新的数据模型

在实体文件中，使用JSDoc注释定义数据模型：

```typescript
/**
 * @swagger
 * components:
 *   schemas:
 *     ModelName:
 *       type: object
 *       properties:
 *         property1:
 *           type: string
 *           description: 属性描述
 *         property2:
 *           type: number
 *           description: 属性描述
 */
export interface ModelName {
  property1: string;
  property2: number;
}
```

### 添加授权信息

默认情况下，所有API都需要Bearer令牌授权。测试时，您可以在Swagger UI界面顶部的"Authorize"按钮中输入JWT令牌。

## 最佳实践

1. **保持文档与代码同步**：修改API时，同时更新Swagger注释
2. **提供详细的参数描述**：帮助API消费者理解每个参数的作用
3. **添加示例值**：对于复杂字段，提供示例值有助于理解
4. **正确设置参数是否必需**：明确标记必需参数
5. **使用合适的标签组织API**：良好的分类使文档更易于浏览

## 技术细节

- Swagger版本: OpenAPI 3.0.0
- 使用的库: swagger-ui-express, swagger-jsdoc
- 配置文件: `/src/swagger/config.ts`

## 故障排除

如果您的API没有显示在文档中，检查：

1. JSDoc注释格式是否正确
2. 确保控制器文件路径包含在swagger配置的`apis`数组中
3. 检查API路由是否正确注册在Express应用中

更多信息请参考[Swagger官方文档](https://swagger.io/docs/)。
