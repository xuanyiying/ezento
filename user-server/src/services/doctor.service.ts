import { Doctor, User } from '../models';
import { DoctorDocument, DoctorCreateData, DoctorUpdateData } from '../interfaces/doctor.interface';
import UserService from './user.service';
import MedicalApiService from './third-party/medical-api.service';
import mongoose from 'mongoose';
import logger from '../config/logger';
import { DoctorCacheService } from './cache/doctor-cache.service';

/**
 * 医生服务
 * 负责从第三方API获取医生数据，并同步到本地数据库
 */
class DoctorService {
    /**
     * 第三方医疗API服务实例
     */
    private static readonly medicalApiService = MedicalApiService.getInstance();
    
    /**
     * 医生缓存服务实例
     */
    private static readonly cacheService = new DoctorCacheService();
    
    /**
     * 获取所有医生
     * 优先从缓存获取，缓存不存在则从API获取，然后同步到本地数据库并更新缓存
     * @param useCache 是否使用缓存，默认为true
     * @returns 医生列表和总数
     */
    public static async getAllDoctors(useCache: boolean = true): Promise<{ total: number, doctors: DoctorDocument[] }> {
        try {
            // 1. 如果启用缓存且缓存有效，直接返回缓存数据
            if (useCache) {
                const cachedDoctors = await this.cacheService.getDoctors();
                if (cachedDoctors) {
                    return cachedDoctors;
                }
            }
            
            // 2. 从第三方API获取医生数据
            const apiResponse = await this.medicalApiService.getDoctors();
            
            if (!apiResponse || !apiResponse.doctors || apiResponse.doctors.length === 0) {
                // 如果API不可用或返回空数据，尝试从数据库获取
                const localDoctors = await Doctor.find().populate('userId', 'name avatar');
                return {
                    total: localDoctors.length,
                    doctors: localDoctors
                };
            }
            
            // 3. 同步到本地数据库
            await this.syncDoctorsToDatabase(apiResponse.doctors);
            
            // 4. 从数据库获取更新后的数据
            const doctors = await Doctor.find().populate('userId', 'name avatar');
            
            // 5. 更新缓存
            await this.cacheService.setDoctors({
                total: doctors.length,
                doctors
            });
            
            return {
                total: doctors.length,
                doctors
            };
        } catch (error: any) {
            logger.error(`获取所有医生失败: ${error.message}`);
            // 如果出错，尝试从数据库获取
            const doctors = await Doctor.find().populate('userId', 'name avatar');
            return {
                total: doctors.length,
                doctors
            };
        }
    }

    /**
     * 根据ID获取医生
     * 优先从缓存获取，缓存不存在则从API获取，然后同步到本地数据库并更新缓存
     * @param id 医生ID
     * @param useCache 是否使用缓存，默认为true
     * @returns 医生文档或null
     */
    public static async getDoctorById(id: string, useCache: boolean = true): Promise<DoctorDocument | null> {
        try {
            if (!mongoose.Types.ObjectId.isValid(id)) {
                return null;
            }

            // 1. 如果启用缓存且缓存有效，直接返回缓存数据
            if (useCache) {
                const cachedDoctor = await this.cacheService.getDoctorById(id);
                if (cachedDoctor) {
                    return cachedDoctor;
                }
            }
            
            // 2. 先从数据库查询
            let doctor = await Doctor.findById(id).populate('userId', 'name avatar');
            
            // 3. 如果数据库中存在，则返回并更新缓存
            if (doctor) {
                await this.cacheService.setDoctorById(id, doctor);
                return doctor;
            }
            
            // 4. 从第三方API获取
            const apiDoctor = await this.medicalApiService.getDoctorById(id);
            
            if (!apiDoctor) {
                return null;
            }
            
            // 5. 同步到数据库
            doctor = await this.syncDoctorToDatabase(apiDoctor) as any;
            
            // 6. 更新缓存
            if (doctor) {
                await this.cacheService.setDoctorById(id, doctor);
            }
            
            return doctor;
        } catch (error: any) {
            logger.error(`获取医生(ID: ${id})失败: ${error.message}`);
            // 如果出错，尝试从数据库获取
            return await Doctor.findById(id).populate('userId', 'name avatar');
        }
    }

    /**
     * 创建医生
     * 注意：该方法仅用于创建本地医生，第三方API的医生数据无法通过此方法创建
     * @param data 医生创建数据
     * @returns 创建的医生文档
     */
    public static async createDoctor(data: DoctorCreateData): Promise<DoctorDocument> {
        try {
            const session = await mongoose.startSession();
            session.startTransaction();
            
            try {
                let userId = data.userId;
                
                // 如果没有用户ID但有用户数据，则创建新用户
                if (!userId && data.userData) {
                    const user = await UserService.createUser({
                        ...data.userData,
                        phone: data.userData.phone || '',
                        isActive: data.userData.isActive !== undefined ? data.userData.isActive : true,
                        tenantId: new mongoose.Types.ObjectId(),
                        role: data.userData.role || 'doctor'
                    }, { session });
                    userId = user._id;
                }
                
                // 创建医生记录
                const doctor = await Doctor.create([{
                    ...data,
                    userId
                }], { session });
                
                await session.commitTransaction();
                await this.cacheService.invalidateAllDoctors();
                
                // 返回创建的医生，并填充用户信息
                const createdDoctor = await Doctor.findById(doctor[0]._id)
                    .populate('userId', 'name avatar');
                
                return createdDoctor as DoctorDocument;
            } catch (error) {
                await session.abortTransaction();
                throw error;
            } finally {
                session.endSession();
            }
        } catch (error: any) {
            logger.error(`创建医生失败: ${error.message}`);
            throw error;
        }
    }

    /**
     * 更新医生
     * 注意：该方法仅用于更新本地医生，第三方API的医生数据无法通过此方法更新
     * @param id 医生ID
     * @param data 医生更新数据
     * @returns 更新后的医生文档或null
     */
    public static async updateDoctor(id: string, data: DoctorUpdateData): Promise<DoctorDocument | null> {
        try {
            if (!mongoose.Types.ObjectId.isValid(id)) {
                return null;
            }

            const session = await mongoose.startSession();
            session.startTransaction();
            
            try {
                // 查找医生
                const doctor = await Doctor.findById(id).session(session);
                if (!doctor) {
                    await session.abortTransaction();
                    session.endSession();
                    return null;
                }
                
                // 如果提供了用户数据且医生有关联用户，则更新用户
                if (data.userData && doctor.userId) {
                    await UserService.updateUser(doctor.userId.toString(), data.userData, { session });
                }
                
                // 更新医生
                const doctorData = { ...data };
                delete doctorData.userData; // 移除用户数据，不保存到医生记录

            const updatedDoctor = await Doctor.findByIdAndUpdate(
                id,
                    { $set: doctorData },
                    { new: true, session }
                ).populate('userId', 'name avatar');
                
                await session.commitTransaction();
                
                // 更新缓存
                await this.cacheService.invalidateAllDoctors();
                if (updatedDoctor) {
                    await this.cacheService.setDoctorById(id, updatedDoctor);
                }

            return updatedDoctor;
        } catch (error) {
                await session.abortTransaction();
                throw error;
            } finally {
                session.endSession();
            }
        } catch (error: any) {
            logger.error(`更新医生(ID: ${id})失败: ${error.message}`);
            throw error;
        }
    }

    /**
     * 删除医生
     * 注意：该方法仅用于删除本地医生，第三方API的医生数据无法通过此方法删除
     * @param id 医生ID
     * @returns 是否成功删除
     */
    public static async deleteDoctor(id: string): Promise<boolean> {
        try {
            if (!mongoose.Types.ObjectId.isValid(id)) {
                return false;
            }

            const session = await mongoose.startSession();
            session.startTransaction();
            
            try {
                // 查找医生
                const doctor = await Doctor.findById(id).session(session);
            if (!doctor) {
                    await session.abortTransaction();
                    session.endSession();
                return false;
            }

                // 删除医生
                await Doctor.deleteOne({ _id: id }).session(session);
                
                // 如果医生有关联用户，也删除用户
                if (doctor.userId) {
                    await UserService.deleteUser(doctor.userId.toString());
                }
                
                await session.commitTransaction();
                
                // 更新缓存
                await this.cacheService.invalidateAllDoctors();
                await this.cacheService.invalidateDoctorById(id);

            return true;
        } catch (error) {
                await session.abortTransaction();
            throw error;
            } finally {
                session.endSession();
            }
        } catch (error: any) {
            logger.error(`删除医生(ID: ${id})失败: ${error.message}`);
            return false;
        }
    }

    /**
     * 根据科室获取医生
     * @param departmentId 科室ID
     * @param useCache 是否使用缓存，默认为true
     * @returns 医生列表和总数
     */
    public static async getDoctorsByDepartment(departmentId: string, useCache: boolean = true): Promise<{ total: number, doctors: DoctorDocument[] }> {
        try {
            if (!mongoose.Types.ObjectId.isValid(departmentId)) {
                return { total: 0, doctors: [] };
            }
            
            // 1. 如果启用缓存且缓存有效，直接返回缓存数据
            if (useCache) {
                const cachedDoctors = await this.cacheService.getDoctorsByDepartment(departmentId);
                if (cachedDoctors) {
                    return cachedDoctors;
                }
            }
            
            // 2. 从第三方API获取科室医生数据
            const apiResponse = await this.medicalApiService.getDoctorsByDepartment(departmentId);
            
            if (!apiResponse || !apiResponse.doctors || apiResponse.doctors.length === 0) {
                // 如果API不可用或返回空数据，尝试从数据库获取
                const localDoctors = await Doctor.find({ departmentId })
                    .populate('userId', 'name avatar');
                
                return {
                    total: localDoctors.length,
                    doctors: localDoctors
                };
            }
            
            // 3. 同步到本地数据库
            await this.syncDoctorsToDatabase(apiResponse.doctors);
            
            // 4. 从数据库获取更新后的数据
            const doctors = await Doctor.find({ departmentId })
                .populate('userId', 'name avatar');
            
            // 5. 更新缓存
            const result = {
                total: doctors.length,
                doctors
            };
            
            await this.cacheService.setDoctorsByDepartment(departmentId, result);
            
            return result;
        } catch (error: any) {
            logger.error(`获取科室(ID: ${departmentId})的医生失败: ${error.message}`);
            // 如果出错，尝试从数据库获取
            const doctors = await Doctor.find({ departmentId })
                .populate('userId', 'name avatar');
            
            return {
                total: doctors.length,
                doctors
            };
        }
    }

    /**
     * 获取医生的咨询信息
     * @param doctorId 医生ID
     * @returns 咨询列表
     */
    public static async getDoctorConsultations(doctorId: string): Promise<Array<any>> {
        try {
            if (!mongoose.Types.ObjectId.isValid(doctorId)) {
                return [];
            }

            // 检查医生是否存在
            const doctor = await Doctor.findById(doctorId);
            if (!doctor) {
                return [];
            }
            
            // 目前假设咨询数据存在本地，无需从第三方API获取
            // 如需从第三方API获取，可以在此添加相应逻辑
            const consultations: Array<any> = [];
            
            // 返回咨询列表
            return consultations;
        } catch (error: any) {
            logger.error(`获取医生(ID: ${doctorId})的咨询失败: ${error.message}`);
            return [];
        }
    }

    /**
     * 切换医生可用状态
     * @param doctorId 医生ID
     * @returns 更新后的医生或null
     */
    public static async toggleAvailability(doctorId: string): Promise<DoctorDocument | null> {
        try {
            if (!mongoose.Types.ObjectId.isValid(doctorId)) {
                return null;
            }

            // 查找医生
            const doctor = await Doctor.findById(doctorId);
            if (!doctor) {
                return null;
            }

            // 切换状态
            doctor.isAvailable = !doctor.isAvailable;
            await doctor.save();

            // 更新缓存
            await this.cacheService.invalidateAllDoctors();
            await this.cacheService.invalidateDoctorById(doctorId);
            
            return doctor;
        } catch (error: any) {
            logger.error(`切换医生(ID: ${doctorId})可用状态失败: ${error.message}`);
            return null;
        }
    }
    
    /**
     * 同步所有医生到数据库
     * @param apiDoctors 第三方API返回的医生列表
     */
    private static async syncDoctorsToDatabase(apiDoctors: any[]): Promise<void> {
        try {
            for (const apiDoctor of apiDoctors) {
                await this.syncDoctorToDatabase(apiDoctor);
            }
        } catch (error: any) {
            logger.error(`同步医生到数据库失败: ${error.message}`);
            throw error;
        }
    }
    
    /**
     * 同步单个医生到数据库
     * @param apiDoctor 第三方API返回的医生
     * @returns 同步后的医生文档
     */
    private static async syncDoctorToDatabase(apiDoctor: any): Promise<DoctorDocument> {
        try {
            // 如果API返回的医生没有ID，则无法同步
            if (!apiDoctor.doctorId) {
                throw new Error('医生ID不能为空');
            }
            
            const session = await mongoose.startSession();
            session.startTransaction();
            
            try {
                // 查找本地是否已存在该医生（根据第三方ID）
                const existingDoctor = await Doctor.findOne({ 
                    thirdPartyId: apiDoctor.doctorId 
                }).session(session);
                
                // 准备医生数据
                const doctorData = {
                    departmentId: new mongoose.Types.ObjectId(apiDoctor.departmentId),
                    title: apiDoctor.title,
                    specialties: apiDoctor.specialties,
                    introduction: apiDoctor.introduction,
                    consultationFee: apiDoctor.consultationFee,
                    isAvailable: apiDoctor.status === 'active',
                    rating: apiDoctor.rating,
                    consultationCount: apiDoctor.consultationCount,
                    goodReviewRate: apiDoctor.goodReviewRate,
                    availableTimes: apiDoctor.availableTimes || [],
                    thirdPartyId: apiDoctor.doctorId,
                    updatedAt: new Date()
                } as const;
                
                let savedDoctor: DoctorDocument;
                
                // 如果本地已存在该医生
                if (existingDoctor) {
                    // 更新医生记录
                    const updated = await Doctor.findByIdAndUpdate(
                        existingDoctor._id,
                        { $set: doctorData },
                        { new: true, session }
                    ).populate('userId', 'name avatar');
                    
                    if (!updated) {
                        throw new Error('Failed to update doctor');
                    }
                    
                    // 如果医生有关联用户，更新用户信息
                    if (updated.userId) {
                        await UserService.updateUser(
                            updated.userId.toString(),
                            {
                                name: apiDoctor.name,
                                avatar: apiDoctor.avatar
                            },
                            { session }
                        );
                    }
                    
                    savedDoctor = updated;
                } 
                // 如果本地不存在该医生，则创建
                else {
                    // 先创建用户
                    const user = await UserService.createUser({
                        name: apiDoctor.name,
                        avatar: apiDoctor.avatar,
                        role: 'doctor',
                        phone: '',
                        isActive: true,
                        tenantId: new mongoose.Types.ObjectId()
                    });
                    
                    // 创建医生
                    const newDoctorData = {
                        ...doctorData,
                        userId: user._id,
                        createdAt: new Date()
                    };
                    
                    const [created] = await Doctor.create([newDoctorData], { session });
                    
                    if (!created) {
                        throw new Error('Failed to create doctor');
                    }
                    
                    savedDoctor = created;
                }
                
                await session.commitTransaction();
                session.endSession();
                
                // 重新获取完整的文档
                const finalDoctor = await Doctor.findById(savedDoctor._id)
                    .populate('userId', 'name avatar')
                    .exec();
                    
                if (!finalDoctor) {
                    throw new Error('Failed to retrieve doctor after save');
                }
                
                return finalDoctor;
        } catch (error) {
                await session.abortTransaction();
                session.endSession();
                throw error;
            }
        } catch (error: any) {
            logger.error(`同步医生(ID: ${apiDoctor.doctorId})到数据库失败: ${error.message}`);
            throw error;
        }
    }
}

export default DoctorService; 