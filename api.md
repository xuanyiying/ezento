# 多租户SaaS医疗管理系统 API 接口文档

## 1. 租户管理 API

### 1.1 租户基础操作

```
GET    /api/tenants                 - 获取租户列表
POST   /api/tenants                 - 创建新租户
GET    /api/tenants/{id}            - 获取租户详情
PUT    /api/tenants/{id}            - 更新租户信息
DELETE /api/tenants/{id}            - 删除租户
```

### 1.2 租户状态管理

```
POST   /api/tenants/{id}/activate   - 激活租户
POST   /api/tenants/{id}/suspend    - 暂停租户
POST   /api/tenants/{id}/terminate  - 终止租户
```

### 1.3 租户配置与套餐

```
GET    /api/tenant-plans            - 获取所有租户套餐
POST   /api/tenant-plans            - 创建套餐
PUT    /api/tenant-plans/{id}       - 更新套餐
DELETE /api/tenant-plans/{id}       - 删除套餐
POST   /api/tenants/{id}/change-plan - 变更租户套餐
GET    /api/tenants/{id}/config     - 获取租户配置
PUT    /api/tenants/{id}/config     - 更新租户配置
```

### 1.4 租户隔离策略

```
GET    /api/isolation-policies      - 获取隔离策略列表
POST   /api/isolation-policies      - 创建隔离策略
PUT    /api/isolation-policies/{id} - 更新隔离策略
GET    /api/tenants/{id}/isolation  - 获取租户隔离策略
PUT    /api/tenants/{id}/isolation  - 设置租户隔离策略
```

## 2. 接口计费 API

### 2.1 使用量统计

```
GET    /api/billing/usage                  - 获取所有租户使用量
GET    /api/billing/usage/{tenantId}       - 获取指定租户使用量
GET    /api/billing/usage/{tenantId}/daily - 获取租户每日使用量
GET    /api/billing/usage/{tenantId}/models - 获取租户各模型使用量
```

### 2.2 套餐与计费

```
GET    /api/billing/plans                  - 获取计费套餐列表
POST   /api/billing/plans                  - 创建计费套餐
PUT    /api/billing/plans/{id}             - 更新计费套餐
DELETE /api/billing/plans/{id}             - 删除计费套餐
GET    /api/billing/rates                  - 获取资源单价
PUT    /api/billing/rates                  - 更新资源单价
```

### 2.3 账单管理

```
GET    /api/billing/invoices               - 获取账单列表
GET    /api/billing/invoices/{id}          - 获取账单详情
POST   /api/billing/invoices/generate      - 生成账单
PUT    /api/billing/invoices/{id}/status   - 更新账单状态
GET    /api/billing/tenants/{tenantId}/invoices - 获取租户账单
```

### 2.4 超额计费

```
GET    /api/billing/overages               - 获取超额使用记录
POST   /api/billing/overages/settings      - 配置超额计费规则
GET    /api/billing/overages/settings      - 获取超额计费规则
POST   /api/billing/overages/notify        - 发送超额使用通知
```

## 3. 大模型接口 API

### 3.1 模型管理

```
GET    /api/models                         - 获取模型列表
POST   /api/models                         - 创建新模型
GET    /api/models/{id}                    - 获取模型详情
PUT    /api/models/{id}                    - 更新模型
DELETE /api/models/{id}                    - 删除模型
POST   /api/models/{id}/toggle             - 启用/禁用模型
```

### 3.2 API密钥管理

```
GET    /api/api-keys                       - 获取API密钥列表
POST   /api/api-keys                       - 创建API密钥
DELETE /api/api-keys/{id}                  - 删除API密钥
PUT    /api/api-keys/{id}/rotate           - 轮换API密钥
GET    /api/tenants/{tenantId}/api-keys    - 获取租户API密钥
```

### 3.3 模型参数配置

```
GET    /api/models/{id}/parameters         - 获取模型参数
PUT    /api/models/{id}/parameters         - 更新模型参数
GET    /api/tenants/{tenantId}/models      - 获取租户可用模型
POST   /api/tenants/{tenantId}/models/{modelId} - 为租户配置模型
GET    /api/tenants/{tenantId}/models/{modelId} - 获取租户模型配置
```

### 3.4 模型调用

```
POST   /api/inference                       - 通用模型推理接口
POST   /api/inference/{modelId}             - 特定模型推理接口
GET    /api/inference/history               - 获取推理历史
GET    /api/inference/history/{tenantId}    - 获取租户推理历史
```

## 4. 病例模板 API

### 4.1 模板管理

```
GET    /api/templates                      - 获取模板列表
POST   /api/templates                      - 创建模板
GET    /api/templates/{id}                 - 获取模板详情
PUT    /api/templates/{id}                 - 更新模板
DELETE /api/templates/{id}                 - 删除模板
GET    /api/tenants/{tenantId}/templates   - 获取租户模板
```

### 4.2 模板版本管理

```
GET    /api/templates/{id}/versions        - 获取模板版本历史
POST   /api/templates/{id}/versions        - 创建新版本
GET    /api/templates/{id}/versions/{version} - 获取特定版本
POST   /api/templates/{id}/publish         - 发布模板版本
```

### 4.3 动态表单配置

```
GET    /api/form-elements                  - 获取表单元素库
POST   /api/templates/{id}/sections        - 添加模板区块
PUT    /api/templates/{id}/sections/{sectionId} - 更新区块
DELETE /api/templates/{id}/sections/{sectionId} - 删除区块
PUT    /api/templates/{id}/order           - 更新区块顺序
```

### 4.4 验证规则

```
GET    /api/validation-rules               - 获取验证规则
POST   /api/validation-rules               - 创建验证规则
PUT    /api/validation-rules/{id}          - 更新验证规则
POST   /api/templates/{id}/validate        - 验证模板数据
```

## 5. 充值卡 API

### 5.1 充值卡管理

```
GET    /api/recharge-cards                 - 获取充值卡列表
POST   /api/recharge-cards                 - 创建充值卡
GET    /api/recharge-cards/{id}            - 获取充值卡详情
PUT    /api/recharge-cards/{id}            - 更新充值卡
DELETE /api/recharge-cards/{id}            - 删除充值卡
```

### 5.2 批量生成

```
POST   /api/recharge-cards/batch           - 批量生成充值卡
GET    /api/recharge-cards/batches         - 获取批次列表
GET    /api/recharge-cards/batches/{id}    - 获取批次详情
POST   /api/recharge-cards/export          - 导出充值卡
```

### 5.3 充值与核销

```
POST   /api/recharge                       - 充值卡兑换
GET    /api/tenants/{tenantId}/balance     - 获取租户余额
GET    /api/recharge/history               - 获取充值历史
GET    /api/recharge/history/{tenantId}    - 获取租户充值历史
```

### 5.4 余额管理

```
POST   /api/balance/adjust                 - 调整账户余额
GET    /api/balance/transactions           - 获取余额变动记录
POST   /api/balance/threshold              - 设置余额预警阈值
GET    /api/balance/threshold              - 获取余额预警阈值
```

## 6. 熔断降级 API

### 6.1 服务保护策略

```
GET    /api/circuit-breakers               - 获取熔断器列表
POST   /api/circuit-breakers               - 创建熔断器
GET    /api/circuit-breakers/{id}          - 获取熔断器详情
PUT    /api/circuit-breakers/{id}          - 更新熔断器
DELETE /api/circuit-breakers/{id}          - 删除熔断器
```

### 6.2 降级规则

```
GET    /api/degradation-rules              - 获取降级规则
POST   /api/degradation-rules              - 创建降级规则
GET    /api/degradation-rules/{id}         - 获取规则详情
PUT    /api/degradation-rules/{id}         - 更新降级规则
DELETE /api/degradation-rules/{id}         - 删除降级规则
```

### 6.3 服务健康检查

```
GET    /api/health                         - 获取系统健康状态
GET    /api/health/services                - 获取服务健康状态
GET    /api/health/services/{service}      - 获取特定服务健康状态
POST   /api/health/recovery                - 触发服务恢复
```

### 6.4 告警配置

```
GET    /api/alerts                         - 获取告警列表
POST   /api/alerts                         - 创建告警规则
GET    /api/alerts/{id}                    - 获取告警详情
PUT    /api/alerts/{id}                    - 更新告警规则
DELETE /api/alerts/{id}                    - 删除告警规则
```

## 7. API网关 API

### 7.1 路由管理

```
GET    /api/routes                         - 获取路由列表
POST   /api/routes                         - 创建路由
GET    /api/routes/{id}                    - 获取路由详情
PUT    /api/routes/{id}                    - 更新路由
DELETE /api/routes/{id}                    - 删除路由
```

### 7.2 鉴权与限流

```
GET    /api/rate-limits                    - 获取限流规则
POST   /api/rate-limits                    - 创建限流规则
PUT    /api/rate-limits/{id}               - 更新限流规则
DELETE /api/rate-limits/{id}               - 删除限流规则
GET    /api/tenants/{tenantId}/rate-limits - 获取租户限流规则
```

### 7.3 日志与审计

```
GET    /api/audit-logs                     - 获取审计日志
GET    /api/audit-logs/{tenantId}          - 获取租户审计日志
GET    /api/access-logs                    - 获取访问日志
GET    /api/access-logs/{tenantId}         - 获取租户访问日志
POST   /api/audit-logs/export              - 导出审计日志
```

### 7.4 网关配置

```
GET    /api/gateway/config                 - 获取网关配置
PUT    /api/gateway/config                 - 更新网关配置
POST   /api/gateway/reload                 - 重载网关配置
GET    /api/gateway/status                 - 获取网关状态
```

## 8. 域名管理 API

```
GET    /api/domains                        - 获取域名列表
POST   /api/domains                        - 创建域名
GET    /api/domains/{id}                   - 获取域名详情
PUT    /api/domains/{id}                   - 更新域名
DELETE /api/domains/{id}                   - 删除域名
POST   /api/domains/{id}/verify            - 验证域名
GET    /api/tenants/{tenantId}/domains     - 获取租户域名
```

## 9. 系统设置 API

```
GET    /api/settings                       - 获取系统设置
PUT    /api/settings                       - 更新系统设置
GET    /api/settings/smtp                  - 获取邮件设置
PUT    /api/settings/smtp                  - 更新邮件设置
GET    /api/settings/backup                - 获取备份设置
PUT    /api/settings/backup                - 更新备份设置
```
