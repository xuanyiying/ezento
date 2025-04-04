import { CacheService } from './cache.service';
import { DoctorDocument } from '../../interfaces/doctor.interface';
import logger from '../../config/logger';

/**
 * 医生缓存服务
 * 提供医生数据的缓存功能，减少对数据库的频繁访问
 */
export class DoctorCacheService {
    private cacheService: CacheService;
    private readonly DOCTORS_CACHE_KEY = 'doctors:all';
    private readonly DOCTOR_CACHE_PREFIX = 'doctor:';
    private readonly DOCTOR_DEPARTMENT_CACHE_PREFIX = 'doctors:department:';
    private readonly CACHE_TTL = 3600; // 1小时缓存过期时间

    constructor() {
        this.cacheService = CacheService.getInstance();
    }

    /**
     * 获取所有医生缓存
     * @returns 医生列表和总数，如果缓存不存在则返回null
     */
    public async getDoctors(): Promise<{ total: number, doctors: DoctorDocument[] } | null> {
        try {
            const cachedData = await this.cacheService.get(this.DOCTORS_CACHE_KEY);
            if (!cachedData) {
                return null;
            }
            return JSON.parse(cachedData);
        } catch (error: any) {
            logger.error(`获取医生缓存失败: ${error.message}`);
            return null;
        }
    }

    /**
     * 设置所有医生缓存
     * @param data 医生列表和总数
     */
    public async setDoctors(data: { total: number, doctors: DoctorDocument[] }): Promise<void> {
        try {
            await this.cacheService.set(
                this.DOCTORS_CACHE_KEY,
                JSON.stringify(data),
                this.CACHE_TTL
            );
        } catch (error: any) {
            logger.error(`设置医生缓存失败: ${error.message}`);
        }
    }

    /**
     * 获取单个医生缓存
     * @param id 医生ID
     * @returns 医生文档，如果缓存不存在则返回null
     */
    public async getDoctorById(id: string): Promise<DoctorDocument | null> {
        try {
            const cacheKey = `${this.DOCTOR_CACHE_PREFIX}${id}`;
            const cachedData = await this.cacheService.get(cacheKey);
            if (!cachedData) {
                return null;
            }
            return JSON.parse(cachedData);
        } catch (error: any) {
            logger.error(`获取医生(ID: ${id})缓存失败: ${error.message}`);
            return null;
        }
    }

    /**
     * 设置单个医生缓存
     * @param id 医生ID
     * @param doctor 医生文档
     */
    public async setDoctorById(id: string, doctor: DoctorDocument): Promise<void> {
        try {
            const cacheKey = `${this.DOCTOR_CACHE_PREFIX}${id}`;
            await this.cacheService.set(
                cacheKey,
                JSON.stringify(doctor),
                this.CACHE_TTL
            );
        } catch (error: any) {
            logger.error(`设置医生(ID: ${id})缓存失败: ${error.message}`);
        }
    }

    /**
     * 获取特定科室的医生缓存
     * @param departmentId 科室ID
     * @returns 特定科室的医生列表和总数，如果缓存不存在则返回null
     */
    public async getDoctorsByDepartment(departmentId: string): Promise<{ total: number, doctors: DoctorDocument[] } | null> {
        try {
            const cacheKey = `${this.DOCTOR_DEPARTMENT_CACHE_PREFIX}${departmentId}`;
            const cachedData = await this.cacheService.get(cacheKey);
            if (!cachedData) {
                return null;
            }
            return JSON.parse(cachedData);
        } catch (error: any) {
            logger.error(`获取科室(ID: ${departmentId})医生缓存失败: ${error.message}`);
            return null;
        }
    }

    /**
     * 设置特定科室的医生缓存
     * @param departmentId 科室ID
     * @param data 特定科室的医生列表和总数
     */
    public async setDoctorsByDepartment(departmentId: string, data: { total: number, doctors: DoctorDocument[] }): Promise<void> {
        try {
            const cacheKey = `${this.DOCTOR_DEPARTMENT_CACHE_PREFIX}${departmentId}`;
            await this.cacheService.set(
                cacheKey,
                JSON.stringify(data),
                this.CACHE_TTL
            );
        } catch (error: any) {
            logger.error(`设置科室(ID: ${departmentId})医生缓存失败: ${error.message}`);
        }
    }

    /**
     * 使所有医生缓存失效
     */
    public async invalidateAllDoctors(): Promise<void> {
        try {
            await this.cacheService.del(this.DOCTORS_CACHE_KEY);
            // 使所有科室的医生缓存失效
            await this.cacheService.delByPattern(`${this.DOCTOR_DEPARTMENT_CACHE_PREFIX}*`);
        } catch (error: any) {
            logger.error(`使所有医生缓存失效失败: ${error.message}`);
        }
    }

    /**
     * 使单个医生缓存失效
     * @param id 医生ID
     */
    public async invalidateDoctorById(id: string): Promise<void> {
        try {
            const cacheKey = `${this.DOCTOR_CACHE_PREFIX}${id}`;
            await this.cacheService.del(cacheKey);
        } catch (error: any) {
            logger.error(`使医生(ID: ${id})缓存失效失败: ${error.message}`);
        }
    }

    /**
     * 使特定科室的医生缓存失效
     * @param departmentId 科室ID
     */
    public async invalidateDoctorsByDepartment(departmentId: string): Promise<void> {
        try {
            const cacheKey = `${this.DOCTOR_DEPARTMENT_CACHE_PREFIX}${departmentId}`;
            await this.cacheService.del(cacheKey);
        } catch (error: any) {
            logger.error(`使科室(ID: ${departmentId})医生缓存失效失败: ${error.message}`);
        }
    }
} 