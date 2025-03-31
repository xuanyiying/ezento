# 多租户SaaS后端管理系统设计文档

## 1. 系统架构

### 1.1 整体架构

```
┌────────────────┐  ┌────────────────┐  ┌────────────────┐
│    Web Admin   │  │  Mobile Admin  │  │  API Clients   │
└───────┬────────┘  └───────┬────────┘  └───────┬────────┘
        │                   │                   │
        └───────────────────┼───────────────────┘
                            │
                  ┌─────────▼─────────┐
                  │  API Gateway      │◄───┐
                  │  (流量控制/鉴权)   │    │
                  └─────────┬─────────┘    │ 监控与告警
                            │              │
        ┌───────────────────┼──────────────┼────────────────┐
        │                   │              │                │
┌───────▼───────┐  ┌────────▼────────┐ ┌───▼───────────┐ ┌─▼───────────┐
│ 认证授权服务   │  │  业务微服务群   │ │ 熔断降级服务 │ │ 监控服务    │
└───────┬───────┘  └────────┬────────┘ └───────────────┘ └─────────────┘
        │                   │
┌───────▼───────┐  ┌────────▼────────┐  ┌────────────────┐
│  用户数据库    │  │  业务数据库     │  │  消息队列      │
└───────────────┘  └─────────────────┘  └────────────────┘
```

### 1.2 服务划分

- **API网关**：统一入口，负责路由、认证、限流、日志记录
- **租户管理服务**：管理租户信息、域名配置等
- **用户认证服务**：用户管理、认证、授权
- **计费服务**：API调用计费、用量统计
- **大模型接口管理**：配置和管理AI模型接口
- **模版管理服务**：问诊病例模版管理
- **支付与充值服务**：充值卡管理、支付管理
- **监控与熔断服务**：系统监控、熔断降级控制
- **网关与域名管理服务**：域名配置、路由管理

## 2. 数据模型设计

### 2.1 租户管理

```typescript
interface Tenant {
  id: string;
  name: string;
  contactPerson: string;
  contactEmail: string;
  contactPhone: string;
  status: 'active' | 'inactive' | 'suspended';
  creationDate: Date;
  expiryDate: Date;
  maxUsers: number;
  maxStorage: number;
  domains: Domain[];
  configurations: TenantConfiguration;
}

interface Domain {
  id: string;
  tenantId: string;
  domainName: string;
  isVerified: boolean;
  isPrimary: boolean;
  sslEnabled: boolean;
  creationDate: Date;
}

interface TenantConfiguration {
  id: string;
  tenantId: string;
  aiModelAccess: string[];
  featureFlags: Record<string, boolean>;
  uiTheme: Record<string, string>;
  apiCallLimits: Record<string, number>;
}
```

### 2.2 用户与认证

```typescript
interface User {
  id: string;
  tenantId: string;
  username: string;
  email: string;
  passwordHash: string;
  role: 'admin' | 'operator' | 'viewer';
  lastLogin: Date;
  status: 'active' | 'inactive' | 'locked';
  permissions: Permission[];
}

interface Permission {
  id: string;
  name: string;
  description: string;
  resourceType: string;
  actions: string[];
}

interface Role {
  id: string;
  tenantId: string;
  name: string;
  description: string;
  permissions: string[]; // Permission IDs
}
```

### 2.3 计费与支付

```typescript
interface ApiUsage {
  id: string;
  tenantId: string;
  apiEndpoint: string;
  timestamp: Date;
  responseTime: number;
  statusCode: number;
  requestSize: number;
  responseSize: number;
  cost: number;
  userId: string;
}

interface BillingPlan {
  id: string;
  name: string;
  description: string;
  basePrice: number;
  billingCycle: 'monthly' | 'yearly';
  includedApiCalls: number;
  includedStorage: number;
  overageRate: number;
}

interface TenantBilling {
  id: string;
  tenantId: string;
  planId: string;
  startDate: Date;
  endDate: Date;
  totalCost: number;
  invoiceStatus: 'draft' | 'sent' | 'paid' | 'overdue';
  paymentMethod: string;
}

interface RechargeCard {
  id: string;
  code: string;
  amount: number;
  isUsed: boolean;
  usedBy: string; // Tenant ID
  usedAt: Date;
  expiryDate: Date;
  batchId: string;
}
```

### 2.4 模型与模板

```typescript
interface AIModel {
  id: string;
  name: string;
  provider: string;
  endpoint: string;
  apiKey: string;
  parameters: Record<string, any>;
  costPerCall: number;
  isActive: boolean;
}

interface TenantModelConfig {
  id: string;
  tenantId: string;
  modelId: string;
  maxCallsPerDay: number;
  customParameters: Record<string, any>;
  costMultiplier: number;
}

interface ConsultationTemplate {
  id: string;
  tenantId: string;
  name: string;
  description: string;
  sections: TemplateSection[];
  isDefault: boolean;
}

interface TemplateSection {
  id: string;
  title: string;
  type: 'text' | 'multiple-choice' | 'checkbox' | 'numeric' | 'date';
  required: boolean;
  options?: string[];
  defaultValue?: any;
}
```

### 2.5 监控与熔断

```typescript
interface ServiceHealth {
  id: string;
  serviceName: string;
  status: 'healthy' | 'degraded' | 'down';
  lastChecked: Date;
  metrics: Record<string, number>;
}

interface CircuitBreaker {
  id: string;
  serviceName: string;
  endpoint: string;
  status: 'closed' | 'open' | 'half-open';
  failureThreshold: number;
  resetTimeout: number;
  lastStateChange: Date;
}

interface DegradationRule {
  id: string;
  serviceName: string;
  condition: string;
  action: 'timeout-increase' | 'feature-disable' | 'fallback';
  parameters: Record<string, any>;
}
```

## 3. API设计

### 3.1 租户管理API

```
POST   /api/tenants                 - 创建新租户
GET    /api/tenants                 - 获取所有租户列表
GET    /api/tenants/{id}            - 获取租户详情
PUT    /api/tenants/{id}            - 更新租户信息
DELETE /api/tenants/{id}            - 删除租户
POST   /api/tenants/{id}/activate   - 激活租户
POST   /api/tenants/{id}/suspend    - 暂停租户
GET    /api/tenants/{id}/usage      - 获取租户用量统计
POST   /api/tenants/{id}/domains    - 添加域名
GET    /api/tenants/{id}/domains    - 获取租户域名列表
```

### 3.2 用户管理API

```
POST   /api/users                   - 创建用户
GET    /api/users                   - 获取用户列表
GET    /api/users/{id}              - 获取用户详情
PUT    /api/users/{id}              - 更新用户信息
DELETE /api/users/{id}              - 删除用户
POST   /api/users/{id}/lock         - 锁定用户
POST   /api/users/{id}/unlock       - 解锁用户
POST   /api/auth/login              - 用户登录
POST   /api/auth/logout             - 用户登出
POST   /api/auth/refresh-token      - 刷新访问令牌
```

### 3.3 计费和充值API

```
GET    /api/billing/plans           - 获取所有计费方案
GET    /api/billing/usage/{tenantId} - 获取租户API使用情况
GET    /api/billing/invoices        - 获取账单列表
GET    /api/billing/invoices/{id}   - 获取账单详情
POST   /api/recharge/cards          - 创建充值卡
GET    /api/recharge/cards          - 获取充值卡列表
POST   /api/recharge/redeem         - 兑换充值卡
```

### 3.4 AI模型和模板API

```
POST   /api/models                  - 添加AI模型
GET    /api/models                  - 获取AI模型列表
PUT    /api/models/{id}             - 更新AI模型
DELETE /api/models/{id}             - 删除AI模型
POST   /api/tenants/{id}/models     - 配置租户AI模型
GET    /api/tenants/{id}/models     - 获取租户AI模型配置

POST   /api/templates               - 创建问诊模板
GET    /api/templates               - 获取模板列表
GET    /api/templates/{id}          - 获取模板详情
PUT    /api/templates/{id}          - 更新模板
DELETE /api/templates/{id}          - 删除模板
```

### 3.5 熔断与监控API

```
GET    /api/monitor/services        - 获取服务健康状态
GET    /api/monitor/alerts          - 获取告警信息
POST   /api/circuit-breakers        - 创建熔断规则
GET    /api/circuit-breakers        - 获取熔断规则列表
PUT    /api/circuit-breakers/{id}   - 更新熔断规则
GET    /api/degradation-rules       - 获取降级规则
POST   /api/degradation-rules       - 创建降级规则
```

## 4. 安全设计

### 4.1 认证与授权

- **JWT认证**：使用JWT进行API认证
- **RBAC权限控制**：基于角色的访问控制
- **API密钥管理**：外部API调用认证
- **OAuth2集成**：支持第三方认证

### 4.2 数据安全

- **数据加密**：敏感数据存储加密
- **字段级权限**：控制特定字段访问权限
- **数据隔离**：租户间数据严格隔离
- **审计日志**：所有敏感操作记录

## 5. 多租户隔离策略

### 5.1 数据隔离

- **独立Schema**：每个租户单独数据库Schema
- **行级隔离**：共享表中添加租户标识符
- **查询过滤**：所有查询自动添加租户过滤条件

### 5.2 计算资源隔离

- **资源配额**：每个租户有API调用限制
- **响应时间保障**：防止单一租户占用过多资源
- **按租户扩展**：重要租户可独立部署服务

## 6. 计费机制

### 6.1 计费模型

- **基础订阅+超额计费**：基本功能包含在订阅中，额外使用按量计费
- **阶梯定价**：用量增加单价降低
- **预付费模式**：充值卡与余额系统

### 6.2 计量点

- **API调用次数**：按接口统计调用次数
- **数据存储**：按存储空间计费
- **AI模型使用**：按不同模型单独计费

## 7. 技术栈选择

### 7.1 后端架构

- **微服务框架**：Node.js + Express/NestJS
- **API网关**：Kong/Nginx
- **服务发现**：Consul/Etcd
- **消息队列**：RabbitMQ/Kafka

### 7.2 数据存储

- **关系型数据库**：PostgreSQL
- **文档数据库**：MongoDB（模板存储）
- **缓存**：Redis
- **时序数据库**：InfluxDB（监控数据）

### 7.3 DevOps

- **容器化**：Docker
- **编排**：Kubernetes
- **CI/CD**：Jenkins/GitHub Actions
- **监控**：Prometheus + Grafana

## 8. 扩展性设计

### 8.1 横向扩展

- 服务无状态化设计
- 按微服务独立扩展
- 数据库读写分离

### 8.2 功能扩展

- 插件系统支持功能扩展
- 配置驱动的功能开关
- API版本控制支持平滑升级

## 9. 系统监控与维护

### 9.1 监控指标

- API响应时间
- 错误率统计
- 资源使用率
- 租户活跃度

### 9.2 告警机制

- 阈值告警
- 异常行为检测
- 多级告警策略
- 自动化修复流程

## 10. 部署方案

### 10.1 多环境部署

- 开发环境
- 测试环境
- 预发布环境
- 生产环境

### 10.2 灾备方案

- 数据定期备份
- 多区域部署
- 故障自动切换
- 数据恢复流程
