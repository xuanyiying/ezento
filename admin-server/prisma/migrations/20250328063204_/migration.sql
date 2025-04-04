-- CreateTable
CREATE TABLE `CircuitBreaker` (
    `id` VARCHAR(191) NOT NULL,
    `tenantId` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `description` VARCHAR(191) NULL,
    `target` VARCHAR(191) NOT NULL,
    `threshold` INTEGER NOT NULL,
    `timeout` INTEGER NOT NULL,
    `halfOpenTimeout` INTEGER NOT NULL,
    `status` ENUM('CLOSED', 'OPEN', 'HALF_OPEN') NOT NULL,
    `failureCount` INTEGER NOT NULL DEFAULT 0,
    `lastFailureTime` DATETIME(3) NULL,
    `lastSuccessTime` DATETIME(3) NULL,
    `metadata` JSON NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `CircuitBreaker_tenantId_idx`(`tenantId`),
    INDEX `CircuitBreaker_status_idx`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `CircuitBreakerRule` (
    `id` VARCHAR(191) NOT NULL,
    `circuitBreakerId` VARCHAR(191) NOT NULL,
    `type` ENUM('ERROR_RATE', 'LATENCY', 'CUSTOM') NOT NULL,
    `condition` VARCHAR(191) NOT NULL,
    `threshold` DOUBLE NOT NULL,
    `action` VARCHAR(191) NOT NULL,
    `priority` INTEGER NOT NULL,
    `metadata` JSON NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `CircuitBreakerRule_circuitBreakerId_idx`(`circuitBreakerId`),
    INDEX `CircuitBreakerRule_type_idx`(`type`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `CircuitBreakerEvent` (
    `id` VARCHAR(191) NOT NULL,
    `circuitBreakerId` VARCHAR(191) NOT NULL,
    `type` ENUM('TRIGGER', 'RECOVER', 'RESET') NOT NULL,
    `reason` VARCHAR(191) NOT NULL,
    `metadata` JSON NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `CircuitBreakerEvent_circuitBreakerId_idx`(`circuitBreakerId`),
    INDEX `CircuitBreakerEvent_type_idx`(`type`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ApiGateway` (
    `id` VARCHAR(191) NOT NULL,
    `tenantId` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `description` VARCHAR(191) NULL,
    `baseUrl` VARCHAR(191) NOT NULL,
    `status` ENUM('ACTIVE', 'INACTIVE', 'MAINTENANCE') NOT NULL,
    `rateLimit` JSON NOT NULL,
    `cors` JSON NOT NULL,
    `authentication` JSON NOT NULL,
    `metadata` JSON NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `ApiGateway_tenantId_idx`(`tenantId`),
    INDEX `ApiGateway_status_idx`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ApiRoute` (
    `id` VARCHAR(191) NOT NULL,
    `gatewayId` VARCHAR(191) NOT NULL,
    `path` VARCHAR(191) NOT NULL,
    `method` ENUM('GET', 'POST', 'PUT', 'DELETE', 'PATCH') NOT NULL,
    `target` JSON NOT NULL,
    `rateLimit` JSON NULL,
    `authentication` JSON NULL,
    `validation` JSON NULL,
    `transformation` JSON NULL,
    `metadata` JSON NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `ApiRoute_gatewayId_idx`(`gatewayId`),
    INDEX `ApiRoute_path_method_idx`(`path`, `method`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ApiKey` (
    `id` VARCHAR(191) NOT NULL,
    `gatewayId` VARCHAR(191) NOT NULL,
    `key` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `description` VARCHAR(191) NULL,
    `status` ENUM('ACTIVE', 'INACTIVE', 'EXPIRED') NOT NULL,
    `expiresAt` DATETIME(3) NULL,
    `lastUsedAt` DATETIME(3) NULL,
    `metadata` JSON NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `ApiKey_key_key`(`key`),
    INDEX `ApiKey_gatewayId_idx`(`gatewayId`),
    INDEX `ApiKey_status_idx`(`status`),
    INDEX `ApiKey_expiresAt_idx`(`expiresAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ApiLog` (
    `id` VARCHAR(191) NOT NULL,
    `gatewayId` VARCHAR(191) NOT NULL,
    `routeId` VARCHAR(191) NOT NULL,
    `requestId` VARCHAR(191) NOT NULL,
    `method` ENUM('GET', 'POST', 'PUT', 'DELETE', 'PATCH') NOT NULL,
    `path` VARCHAR(191) NOT NULL,
    `statusCode` INTEGER NOT NULL,
    `duration` INTEGER NOT NULL,
    `clientIp` VARCHAR(191) NOT NULL,
    `userAgent` VARCHAR(191) NULL,
    `requestHeaders` JSON NULL,
    `requestBody` JSON NULL,
    `responseHeaders` JSON NULL,
    `responseBody` JSON NULL,
    `error` VARCHAR(191) NULL,
    `metadata` JSON NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `ApiLog_gatewayId_idx`(`gatewayId`),
    INDEX `ApiLog_routeId_idx`(`routeId`),
    INDEX `ApiLog_requestId_idx`(`requestId`),
    INDEX `ApiLog_createdAt_idx`(`createdAt`),
    INDEX `ApiLog_statusCode_idx`(`statusCode`),
    INDEX `ApiLog_clientIp_idx`(`clientIp`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `RechargeCard` (
    `id` VARCHAR(191) NOT NULL,
    `tenantId` VARCHAR(191) NOT NULL,
    `code` VARCHAR(191) NOT NULL,
    `amount` DOUBLE NOT NULL,
    `status` ENUM('UNUSED', 'USED', 'EXPIRED') NOT NULL,
    `usedBy` VARCHAR(191) NULL,
    `usedAt` DATETIME(3) NULL,
    `expiredAt` DATETIME(3) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `RechargeCard_code_key`(`code`),
    INDEX `RechargeCard_tenantId_idx`(`tenantId`),
    INDEX `RechargeCard_status_idx`(`status`),
    INDEX `RechargeCard_expiredAt_idx`(`expiredAt`),
    INDEX `RechargeCard_code_idx`(`code`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `RechargeRecord` (
    `id` VARCHAR(191) NOT NULL,
    `tenantId` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `cardId` VARCHAR(191) NOT NULL,
    `amount` DOUBLE NOT NULL,
    `balanceBefore` DOUBLE NOT NULL,
    `balanceAfter` DOUBLE NOT NULL,
    `type` ENUM('RECHARGE', 'CONSUME') NOT NULL,
    `description` VARCHAR(191) NOT NULL,
    `metadata` JSON NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `RechargeRecord_tenantId_idx`(`tenantId`),
    INDEX `RechargeRecord_userId_idx`(`userId`),
    INDEX `RechargeRecord_cardId_idx`(`cardId`),
    INDEX `RechargeRecord_type_idx`(`type`),
    INDEX `RechargeRecord_createdAt_idx`(`createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `RechargeCardBatch` (
    `id` VARCHAR(191) NOT NULL,
    `tenantId` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `amount` DOUBLE NOT NULL,
    `count` INTEGER NOT NULL,
    `usedCount` INTEGER NOT NULL DEFAULT 0,
    `expiredAt` DATETIME(3) NOT NULL,
    `status` ENUM('ACTIVE', 'COMPLETED', 'EXPIRED') NOT NULL,
    `metadata` JSON NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `RechargeCardBatch_tenantId_idx`(`tenantId`),
    INDEX `RechargeCardBatch_status_idx`(`status`),
    INDEX `RechargeCardBatch_expiredAt_idx`(`expiredAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Model` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `provider` VARCHAR(191) NOT NULL,
    `type` ENUM('TEXT', 'IMAGE', 'AUDIO', 'MULTIMODAL') NOT NULL,
    `version` VARCHAR(191) NOT NULL,
    `description` VARCHAR(191) NULL,
    `contextWindow` INTEGER NOT NULL,
    `maxOutputTokens` INTEGER NOT NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `baseEndpoint` VARCHAR(191) NOT NULL,
    `credentials` JSON NULL,
    `pricing` JSON NOT NULL,
    `parameters` JSON NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `Model_provider_idx`(`provider`),
    INDEX `Model_type_idx`(`type`),
    INDEX `Model_isActive_idx`(`isActive`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `TenantModelConfig` (
    `id` VARCHAR(191) NOT NULL,
    `tenantId` VARCHAR(191) NOT NULL,
    `modelId` VARCHAR(191) NOT NULL,
    `isEnabled` BOOLEAN NOT NULL DEFAULT true,
    `customParameters` JSON NULL,
    `quotaLimit` JSON NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `TenantModelConfig_tenantId_idx`(`tenantId`),
    INDEX `TenantModelConfig_modelId_idx`(`modelId`),
    INDEX `TenantModelConfig_isEnabled_idx`(`isEnabled`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `TenantPlan` (
    `id` VARCHAR(191) NOT NULL,
    `code` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `price` DOUBLE NOT NULL,
    `features` JSON NOT NULL,
    `limits` JSON NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `TenantPlan_code_key`(`code`),
    INDEX `TenantPlan_code_idx`(`code`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Tenant` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `code` VARCHAR(191) NOT NULL,
    `status` ENUM('ACTIVE', 'SUSPENDED', 'TERMINATED') NOT NULL,
    `plan` VARCHAR(191) NOT NULL,
    `domains` JSON NULL,
    `settings` JSON NULL,
    `theme` JSON NULL,
    `apiCallLimits` JSON NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `Tenant_code_key`(`code`),
    INDEX `Tenant_status_idx`(`status`),
    INDEX `Tenant_plan_idx`(`plan`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Usage` (
    `id` VARCHAR(191) NOT NULL,
    `tenantId` VARCHAR(191) NOT NULL,
    `date` DATETIME(3) NOT NULL,
    `modelId` VARCHAR(191) NULL,
    `endpoint` VARCHAR(191) NULL,
    `requestCount` INTEGER NOT NULL,
    `tokenCount` INTEGER NOT NULL,
    `costAmount` DOUBLE NOT NULL,
    `isOverage` BOOLEAN NOT NULL DEFAULT false,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `Usage_tenantId_idx`(`tenantId`),
    INDEX `Usage_date_idx`(`date`),
    INDEX `Usage_modelId_idx`(`modelId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Rate` (
    `id` VARCHAR(191) NOT NULL,
    `resourceType` VARCHAR(191) NOT NULL,
    `modelId` VARCHAR(191) NULL,
    `unitPrice` DOUBLE NOT NULL,
    `currency` VARCHAR(191) NOT NULL,
    `effectiveDate` DATETIME(3) NOT NULL,
    `expirationDate` DATETIME(3) NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `Rate_resourceType_idx`(`resourceType`),
    INDEX `Rate_modelId_idx`(`modelId`),
    INDEX `Rate_isActive_idx`(`isActive`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `OverageSettings` (
    `id` VARCHAR(191) NOT NULL,
    `tenantId` VARCHAR(191) NOT NULL,
    `allowOverage` BOOLEAN NOT NULL DEFAULT false,
    `notificationThreshold` DOUBLE NOT NULL,
    `notificationEmail` VARCHAR(191) NULL,
    `autoDisable` BOOLEAN NOT NULL DEFAULT false,
    `disableThreshold` DOUBLE NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `OverageSettings_tenantId_key`(`tenantId`),
    INDEX `OverageSettings_tenantId_idx`(`tenantId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `BillingPlan` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `code` VARCHAR(191) NOT NULL,
    `description` VARCHAR(191) NULL,
    `basePrice` DOUBLE NOT NULL,
    `currency` VARCHAR(191) NOT NULL,
    `billingCycle` ENUM('MONTHLY', 'QUARTERLY', 'YEARLY') NOT NULL,
    `includedResources` JSON NOT NULL,
    `overagePricing` JSON NOT NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `BillingPlan_code_key`(`code`),
    INDEX `BillingPlan_code_idx`(`code`),
    INDEX `BillingPlan_isActive_idx`(`isActive`),
    INDEX `BillingPlan_billingCycle_idx`(`billingCycle`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Invoice` (
    `id` VARCHAR(191) NOT NULL,
    `tenantId` VARCHAR(191) NOT NULL,
    `invoiceNumber` VARCHAR(191) NOT NULL,
    `status` ENUM('DRAFT', 'PENDING', 'PAID', 'OVERDUE', 'CANCELLED') NOT NULL,
    `amount` DOUBLE NOT NULL,
    `currency` VARCHAR(191) NOT NULL,
    `dueDate` DATETIME(3) NOT NULL,
    `paidDate` DATETIME(3) NULL,
    `billingPeriodStart` DATETIME(3) NOT NULL,
    `billingPeriodEnd` DATETIME(3) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `Invoice_invoiceNumber_key`(`invoiceNumber`),
    INDEX `Invoice_tenantId_idx`(`tenantId`),
    INDEX `Invoice_status_idx`(`status`),
    INDEX `Invoice_dueDate_idx`(`dueDate`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `InvoiceItem` (
    `id` VARCHAR(191) NOT NULL,
    `invoiceId` VARCHAR(191) NOT NULL,
    `description` VARCHAR(191) NOT NULL,
    `quantity` DOUBLE NOT NULL,
    `unitPrice` DOUBLE NOT NULL,
    `amount` DOUBLE NOT NULL,
    `type` ENUM('SUBSCRIPTION', 'USAGE', 'CREDIT', 'TAX', 'OTHER') NOT NULL,

    INDEX `InvoiceItem_invoiceId_idx`(`invoiceId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Template` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `code` VARCHAR(191) NOT NULL,
    `description` VARCHAR(191) NOT NULL,
    `category` VARCHAR(191) NOT NULL,
    `version` VARCHAR(191) NOT NULL,
    `status` ENUM('DRAFT', 'PUBLISHED', 'ARCHIVED') NOT NULL,
    `metadata` JSON NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `tenantId` VARCHAR(191) NOT NULL,

    UNIQUE INDEX `Template_code_key`(`code`),
    INDEX `Template_tenantId_idx`(`tenantId`),
    INDEX `Template_status_idx`(`status`),
    INDEX `Template_category_idx`(`category`),
    INDEX `Template_code_idx`(`code`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `TemplateSection` (
    `id` VARCHAR(191) NOT NULL,
    `templateId` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `code` VARCHAR(191) NOT NULL,
    `description` VARCHAR(191) NOT NULL,
    `order` INTEGER NOT NULL,
    `metadata` JSON NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `TemplateSection_templateId_idx`(`templateId`),
    UNIQUE INDEX `TemplateSection_templateId_code_key`(`templateId`, `code`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `FormElement` (
    `id` VARCHAR(191) NOT NULL,
    `sectionId` VARCHAR(191) NOT NULL,
    `type` ENUM('TEXT', 'NUMBER', 'DATE', 'SELECT', 'MULTI_SELECT', 'CHECKBOX', 'RADIO', 'TEXTAREA', 'FILE') NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `code` VARCHAR(191) NOT NULL,
    `label` VARCHAR(191) NOT NULL,
    `placeholder` VARCHAR(191) NULL,
    `required` BOOLEAN NOT NULL DEFAULT false,
    `defaultValue` JSON NULL,
    `options` JSON NULL,
    `metadata` JSON NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `FormElement_sectionId_idx`(`sectionId`),
    UNIQUE INDEX `FormElement_sectionId_code_key`(`sectionId`, `code`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ValidationRule` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `code` VARCHAR(191) NOT NULL,
    `value` VARCHAR(191) NOT NULL,
    `type` ENUM('REQUIRED', 'MIN', 'MAX', 'PATTERN', 'CUSTOM') NOT NULL,
    `message` VARCHAR(191) NOT NULL,
    `parameters` JSON NULL,
    `metadata` JSON NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `sectionId` VARCHAR(191) NULL,
    `elementId` VARCHAR(191) NULL,
    `customValidator` VARCHAR(191) NULL,

    INDEX `ValidationRule_type_idx`(`type`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `TemplateVersion` (
    `id` VARCHAR(191) NOT NULL,
    `templateId` VARCHAR(191) NOT NULL,
    `version` INTEGER NOT NULL,
    `changes` VARCHAR(191) NOT NULL,
    `templateData` JSON NOT NULL,
    `createdBy` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `publishedAt` DATETIME(3) NULL,

    INDEX `TemplateVersion_templateId_idx`(`templateId`),
    UNIQUE INDEX `TemplateVersion_templateId_version_key`(`templateId`, `version`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `User` (
    `id` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `password` VARCHAR(191) NOT NULL,
    `role` VARCHAR(191) NOT NULL,
    `tenantId` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `User_email_key`(`email`),
    INDEX `User_tenantId_idx`(`tenantId`),
    INDEX `User_role_idx`(`role`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `CircuitBreakerRule` ADD CONSTRAINT `CircuitBreakerRule_circuitBreakerId_fkey` FOREIGN KEY (`circuitBreakerId`) REFERENCES `CircuitBreaker`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `CircuitBreakerEvent` ADD CONSTRAINT `CircuitBreakerEvent_circuitBreakerId_fkey` FOREIGN KEY (`circuitBreakerId`) REFERENCES `CircuitBreaker`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ApiRoute` ADD CONSTRAINT `ApiRoute_gatewayId_fkey` FOREIGN KEY (`gatewayId`) REFERENCES `ApiGateway`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ApiKey` ADD CONSTRAINT `ApiKey_gatewayId_fkey` FOREIGN KEY (`gatewayId`) REFERENCES `ApiGateway`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ApiLog` ADD CONSTRAINT `ApiLog_gatewayId_fkey` FOREIGN KEY (`gatewayId`) REFERENCES `ApiGateway`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ApiLog` ADD CONSTRAINT `ApiLog_routeId_fkey` FOREIGN KEY (`routeId`) REFERENCES `ApiRoute`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `TenantModelConfig` ADD CONSTRAINT `TenantModelConfig_modelId_fkey` FOREIGN KEY (`modelId`) REFERENCES `Model`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `InvoiceItem` ADD CONSTRAINT `InvoiceItem_invoiceId_fkey` FOREIGN KEY (`invoiceId`) REFERENCES `Invoice`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `TemplateSection` ADD CONSTRAINT `TemplateSection_templateId_fkey` FOREIGN KEY (`templateId`) REFERENCES `Template`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `FormElement` ADD CONSTRAINT `FormElement_sectionId_fkey` FOREIGN KEY (`sectionId`) REFERENCES `TemplateSection`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ValidationRule` ADD CONSTRAINT `ValidationRule_sectionId_fkey` FOREIGN KEY (`sectionId`) REFERENCES `TemplateSection`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ValidationRule` ADD CONSTRAINT `ValidationRule_elementId_fkey` FOREIGN KEY (`elementId`) REFERENCES `FormElement`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `TemplateVersion` ADD CONSTRAINT `TemplateVersion_templateId_fkey` FOREIGN KEY (`templateId`) REFERENCES `Template`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
