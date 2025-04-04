import { Department } from '../models';
import { DepartmentDocument, DepartmentCreateData, DepartmentUpdateData } from '../interfaces/department.interface';
import MedicalApiService from './third-party/medical-api.service';
import logger from '../config/logger';
import mongoose from 'mongoose';
import { DepartmentCacheService } from './cache/department-cache.service';

/**
 * 科室服务
 * 负责从第三方API获取科室数据，并同步到本地数据库
 */
class DepartmentService {
    /**
     * 第三方医疗API服务实例
     */
    private static readonly medicalApiService = MedicalApiService.getInstance();
    
    /**
     * 科室缓存服务实例
     */
    private static readonly cacheService = new DepartmentCacheService();
    
    /**
     * 获取所有科室
     * 优先从缓存获取，缓存不存在则从API获取，然后同步到本地数据库并更新缓存
     * @param useCache 是否使用缓存，默认为true
     * @returns 科室列表和总数
     */
    public static async getAllDepartments(useCache: boolean = true): Promise<{ total: number, departments: DepartmentDocument[] }> {
        try {
            // 1. 如果启用缓存且缓存有效，直接返回缓存数据
            if (useCache) {
                const cachedDepartments = await this.cacheService.getDepartments();
                if (cachedDepartments) {
                    return cachedDepartments;
                }
            }
            
            // 2. 从第三方API获取科室数据
            const apiResponse = await this.medicalApiService.getDepartments();
            
            if (!apiResponse || !apiResponse.departments || apiResponse.departments.length === 0) {
                // 如果API不可用或返回空数据，尝试从数据库获取
                const localDepartments = await Department.find().sort({ name: 1 });
                return {
                    total: localDepartments.length,
                    departments: localDepartments
                };
            }
            
            // 3. 同步到本地数据库
            await this.syncDepartmentsToDatabase(apiResponse.departments);
            
            // 4. 从数据库获取更新后的数据
            const departments = await Department.find().sort({ name: 1 });
            
            // 5. 更新缓存
            await this.cacheService.setDepartments({
                total: departments.length,
                departments
            });
            
            return {
                total: departments.length,
                departments
            };
        } catch (error: any) {
            logger.error(`获取所有科室失败: ${error.message}`);
            // 如果出错，尝试从数据库获取
            const departments = await Department.find().sort({ name: 1 });
            return {
                total: departments.length,
                departments
            };
        }
    }
    
    /**
     * 根据ID获取科室
     * 优先从缓存获取，缓存不存在则从API获取，然后同步到本地数据库并更新缓存
     * @param id 科室ID
     * @param useCache 是否使用缓存，默认为true
     * @returns 科室文档或null
     */
    public static async getDepartmentById(id: string, useCache: boolean = true): Promise<DepartmentDocument | null> {
        try {
            if (!mongoose.Types.ObjectId.isValid(id)) {
                return null;
            }
            
            // 1. 如果启用缓存且缓存有效，直接返回缓存数据
            if (useCache) {
                const cachedDepartment = await this.cacheService.getDepartmentById(id);
                if (cachedDepartment) {
                    return cachedDepartment;
                }
            }
            
            // 2. 先从数据库查询
            let department = await Department.findById(id);
            
            // 3. 如果数据库中存在，则返回并更新缓存
            if (department) {
                await this.cacheService.setDepartmentById(id, department);
                return department;
            }
            
            // 4. 从第三方API获取
            const apiDepartment = await this.medicalApiService.getDepartmentById(id);
            
            if (!apiDepartment) {
                return null;
            }
            
            // 5. 同步到数据库
            department = await this.syncDepartmentToDatabase(apiDepartment) as any;
            
            // 6. 更新缓存
            if (department) {
                await this.cacheService.setDepartmentById(id, department);
            }
            
            return department;
        } catch (error: any) {
            logger.error(`获取科室(ID: ${id})失败: ${error.message}`);
            // 如果出错，尝试从数据库获取
            return await Department.findById(id);
        }
    }
    
    /**
     * 创建科室
     * 注意：该方法仅用于创建本地科室，第三方API的科室数据无法通过此方法创建
     * @param data 科室创建数据
     * @returns 创建的科室文档
     * @throws 如果科室名称已存在
     */
    public static async createDepartment(data: DepartmentCreateData): Promise<DepartmentDocument> {
        try {
            // 检查科室名称是否已存在
            const existingDepartment = await Department.findOne({ name: data.name });
            
            if (existingDepartment) {
                throw new Error(`科室名称 "${data.name}" 已存在`);
            }
            
            // 创建新科室
            const department = await Department.create(data);
            
            // 更新缓存
            await this.cacheService.invalidateAllDepartments();
            await this.cacheService.setDepartmentById(department._id.toString(), department);
            
            return department;
        } catch (error: any) {
            logger.error(`创建科室失败: ${error.message}`);
            throw error;
        }
    }
    
    /**
     * 更新科室
     * 注意：该方法仅用于更新本地科室，第三方API的科室数据无法通过此方法更新
     * @param id 科室ID
     * @param data 科室更新数据
     * @returns 更新后的科室文档或null
     * @throws 如果更新后的科室名称与其他科室冲突
     */
    public static async updateDepartment(id: string, data: DepartmentUpdateData): Promise<DepartmentDocument | null> {
        try {
            if (!mongoose.Types.ObjectId.isValid(id)) {
                return null;
            }
            
            // 如果要更新科室名称，检查是否与其他科室冲突
            if (data.name) {
                const existingDepartment = await Department.findOne({ 
                    name: data.name,
                    _id: { $ne: id }
                });
                
                if (existingDepartment) {
                    throw new Error(`科室名称 "${data.name}" 已存在`);
                }
            }
            
            // 更新科室
            const department = await Department.findByIdAndUpdate(
                id,
                { $set: data },
                { new: true }
            );
            
            // 更新缓存
            await this.cacheService.invalidateAllDepartments();
            if (department) {
                await this.cacheService.setDepartmentById(id, department);
            }
            
            return department;
        } catch (error: any) {
            logger.error(`更新科室(ID: ${id})失败: ${error.message}`);
            throw error;
        }
    }
    
    /**
     * 删除科室
     * 注意：该方法仅用于删除本地科室，第三方API的科室数据无法通过此方法删除
     * @param id 科室ID
     * @returns 是否成功删除
     */
    public static async deleteDepartment(id: string): Promise<boolean> {
        try {
            if (!mongoose.Types.ObjectId.isValid(id)) {
                return false;
            }
            
            const result = await Department.deleteOne({ _id: id });
            
            // 更新缓存
            await this.cacheService.invalidateAllDepartments();
            await this.cacheService.invalidateDepartmentById(id);
            
            return result.deletedCount > 0;
        } catch (error: any) {
            logger.error(`删除科室(ID: ${id})失败: ${error.message}`);
            return false;
        }
    }
    
    /**
     * 同步所有科室到数据库
     * @param apiDepartments 第三方API返回的科室列表
     */
    private static async syncDepartmentsToDatabase(apiDepartments: any[]): Promise<void> {
        try {
            for (const apiDepartment of apiDepartments) {
                await this.syncDepartmentToDatabase(apiDepartment);
            }
        } catch (error: any) {
            logger.error(`同步科室到数据库失败: ${error.message}`);
            throw error;
        }
    }
    
    /**
     * 同步单个科室到数据库
     * @param apiDepartment 第三方API返回的科室
     * @returns 同步后的科室文档
     */
    private static async syncDepartmentToDatabase(apiDepartment: any): Promise<DepartmentDocument> {
        try {
            // 如果API返回的科室没有ID，则无法同步
            if (!apiDepartment.departmentId) {
                throw new Error('科室ID不能为空');
            }
            
            const session = await mongoose.startSession();
            session.startTransaction();
            
            try {
                // 查找本地是否已存在该科室（根据第三方ID）
                const existingDepartment = await Department.findOne({ 
                    thirdPartyId: apiDepartment.departmentId 
                }).session(session);
                
                const departmentData = {
                    name: apiDepartment.name,
                    description: apiDepartment.description,
                    iconUrl: apiDepartment.iconUrl,
                    thirdPartyId: apiDepartment.departmentId,
                    status: apiDepartment.status === 'active' ? 'active' : 'inactive',
                    updatedAt: new Date()
                } as const;
                
                let savedDepartment: DepartmentDocument;
                
                // 如果本地已存在，则更新
                if (existingDepartment) {
                    const updated = await Department.findByIdAndUpdate(
                        existingDepartment._id,
                        { $set: departmentData },
                        { new: true, session }
                    );
                    
                    if (!updated) {
                        throw new Error('Failed to update department');
                    }
                    
                    savedDepartment = updated;
                } 
                // 否则创建新的科室
                else {
                    const newDepartmentData = {
                        ...departmentData,
                        createdAt: new Date()
                    };
                    
                    const created = await Department.create([newDepartmentData], { session });
                    
                    if (!created || created.length === 0) {
                        throw new Error('Failed to create department');
                    }
                    
                    savedDepartment = created[0];
                }
                
                await session.commitTransaction();
                session.endSession();
                
                // 重新获取完整的文档
                const finalDepartment = await Department.findById(savedDepartment._id);
                if (!finalDepartment) {
                    throw new Error('Failed to retrieve department after save');
                }
                
                return finalDepartment;
            } catch (error) {
                await session.abortTransaction();
                session.endSession();
                throw error;
            }
        } catch (error: any) {
            logger.error(`同步科室(ID: ${apiDepartment.departmentId})到数据库失败: ${error.message}`);
            throw error;
        }
    }
}

export default DepartmentService;