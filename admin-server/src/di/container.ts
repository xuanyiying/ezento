import { TenantService } from '../services/tenant.service';
import { UserService } from '../services/user.service';
import { BillingService } from '../services/billing.service';
import { ModelService } from '../services/model.service';
import { TemplateService } from '../services/template.service';
import { RechargeService } from '../services/recharge.service';
import { CircuitBreakerService } from '../services/circuit-breaker.service';
import { ApiGatewayService } from '../services/api-gateway.service';

import { ITenantRepository } from '../repositories/tenant.repository';
import { IUserRepository } from '../repositories/user.repository';
import { IBillingRepository } from '../repositories/billing.repository';
import { IModelRepository } from '../repositories/model.repository';
import { ITemplateRepository } from '../repositories/template.repository';
import { IRechargeRepository } from '../repositories/recharge.repository';
import { ICircuitBreakerRepository } from '../repositories/circuit-breaker.repository';
import { IApiGatewayRepository } from '../repositories/api-gateway.repository';

import { PrismaTenantRepository } from '../repositories/prisma/prisma-tenant.repository';
import { PrismaUserRepository } from '../repositories/prisma/prisma-user.repository';
import { PrismaBillingRepository } from '../repositories/prisma/prisma-billing.repository';
import { PrismaModelRepository } from '../repositories/prisma/prisma-model.repository';
import { PrismaTemplateRepository } from '../repositories/prisma/prisma-template.repository';
import { PrismaRechargeRepository } from '../repositories/prisma/prisma-recharge.repository';
import { PrismaCircuitBreakerRepository } from '../repositories/prisma/prisma-circuit-breaker.repository';
import { PrismaApiGatewayRepository } from '../repositories/prisma/prisma-api-gateway.repository';
import { PrismaClient } from '@prisma/client';

// Controllers
import { AuthController } from '../controllers/auth.controller';

export class DIContainer {

    private static _tenantRepository: ITenantRepository;
    private static _userRepository: IUserRepository;
    private static _billingRepository: IBillingRepository;
    private static _modelRepository: IModelRepository;
    private static _templateRepository: ITemplateRepository;
    private static _rechargeRepository: IRechargeRepository;
    private static _circuitBreakerRepository: ICircuitBreakerRepository;
    private static _apiGatewayRepository: IApiGatewayRepository;

    private static _tenantService: TenantService;
    private static _userService: UserService;
    private static _billingService: BillingService;
    private static _modelService: ModelService;
    private static _templateService: TemplateService;
    private static _rechargeService: RechargeService;
    private static _circuitBreakerService: CircuitBreakerService;
    private static _apiGatewayService: ApiGatewayService;

    // Controllers
    private static _authController: AuthController;

    private static instance: DIContainer;
    private static prisma: PrismaClient = new PrismaClient();

    // Singleton pattern implementation
    static getInstance(): DIContainer {
        if (!DIContainer.instance) {
            DIContainer.instance = new DIContainer();
        }
        return DIContainer.instance;
    }

    // Method to disconnect resources
    async disconnect(): Promise<void> {
        // Close any open database connections or resources
        const prismaRepositories = [
            DIContainer._tenantRepository,
            DIContainer._userRepository,
            DIContainer._billingRepository,
            DIContainer._modelRepository,
            DIContainer._templateRepository,
            DIContainer._rechargeRepository,
            DIContainer._circuitBreakerRepository,
            DIContainer._apiGatewayRepository
        ];

        // Attempt to close Prisma connections if possible
        for (const repo of prismaRepositories) {
            if (repo && (repo as any).prisma && typeof (repo as any).prisma.$disconnect === 'function') {
                await (repo as any).prisma.$disconnect();
            }
        }
    }

    static get tenantService(): TenantService {
        if (!DIContainer._tenantService) {
            DIContainer._tenantService = new TenantService(DIContainer.tenantRepository);
        }
        return DIContainer._tenantService;
    }

    static get userService(): UserService {
        if (!DIContainer._userService) {
            DIContainer._userService = new UserService(DIContainer.userRepository);
        }
        return DIContainer._userService;
    }

    static get billingService(): BillingService {
        if (!DIContainer._billingService) {
            DIContainer._billingService = new BillingService(DIContainer.billingRepository);
        }
        return DIContainer._billingService;
    }

    static get modelService(): ModelService {
        if (!DIContainer._modelService) {
            DIContainer._modelService = new ModelService(DIContainer.modelRepository);
        }
        return DIContainer._modelService;
    }

    static get templateService(): TemplateService {
        if (!DIContainer._templateService) {
            DIContainer._templateService = new TemplateService(DIContainer.templateRepository);
        }
        return DIContainer._templateService;
    }

    static get rechargeService(): RechargeService {
        if (!DIContainer._rechargeService) {
            DIContainer._rechargeService = new RechargeService(DIContainer.rechargeRepository);
        }
        return DIContainer._rechargeService;
    }

    static get circuitBreakerService(): CircuitBreakerService {
        if (!DIContainer._circuitBreakerService) {
            DIContainer._circuitBreakerService = new CircuitBreakerService(DIContainer.circuitBreakerRepository);
        }
        return DIContainer._circuitBreakerService;
    }

    static get apiGatewayService(): ApiGatewayService {
        if (!DIContainer._apiGatewayService) {
            DIContainer._apiGatewayService = new ApiGatewayService(DIContainer.apiGatewayRepository);
        }
        return DIContainer._apiGatewayService;
    }

    static get tenantRepository(): ITenantRepository {
        if (!DIContainer._tenantRepository) {
            DIContainer._tenantRepository = new PrismaTenantRepository(DIContainer.prisma);
        }
        return DIContainer._tenantRepository;
    }

    static get userRepository(): IUserRepository {
        if (!DIContainer._userRepository) {
            DIContainer._userRepository = new PrismaUserRepository(DIContainer.prisma);
        }
        return DIContainer._userRepository;
    }

    static get billingRepository(): IBillingRepository {
        if (!DIContainer._billingRepository) {
            DIContainer._billingRepository = new PrismaBillingRepository(DIContainer.prisma);
        }
        return DIContainer._billingRepository;
    }

    static get modelRepository(): IModelRepository {
        if (!DIContainer._modelRepository) {
            DIContainer._modelRepository = new PrismaModelRepository(DIContainer.prisma);
        }
        return DIContainer._modelRepository;
    }

    static get templateRepository(): ITemplateRepository {
        if (!DIContainer._templateRepository) {
            DIContainer._templateRepository = new PrismaTemplateRepository(DIContainer.prisma);
        }
        return DIContainer._templateRepository;
    }

    static get rechargeRepository(): IRechargeRepository {
        if (!DIContainer._rechargeRepository) {
            DIContainer._rechargeRepository = new PrismaRechargeRepository(DIContainer.prisma);
        }
        return DIContainer._rechargeRepository;
    }

    static get circuitBreakerRepository(): ICircuitBreakerRepository {
        if (!DIContainer._circuitBreakerRepository) {
            DIContainer._circuitBreakerRepository = new PrismaCircuitBreakerRepository(DIContainer.prisma);
        }
        return DIContainer._circuitBreakerRepository;
    }

    static get apiGatewayRepository(): IApiGatewayRepository {
        if (!DIContainer._apiGatewayRepository) {
            DIContainer._apiGatewayRepository = new PrismaApiGatewayRepository(DIContainer.prisma);
        }
        return DIContainer._apiGatewayRepository;
    }

    // Controllers
    static get authController(): AuthController {
        if (!DIContainer._authController) {
            DIContainer._authController = new AuthController(DIContainer.userService);
        }
        return DIContainer._authController;
    }
}