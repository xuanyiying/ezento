import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { Tenant, User, Doctor, Department } from '../models';
import logger from '../config/logger';

// 加载环境变量
dotenv.config({ path: '.env' });

// 连接数据库
const connectDB = async () => {
    try {
        // 在连接字符串中添加authSource=admin
        const connectionUri = `${process.env.MONGODB_URI || 'mongodb://localhost:27017/ezento'}`;

        // 设置连接选项
        const mongooseOptions = {
            connectTimeoutMS: 30000,
            socketTimeoutMS: 45000,
            serverSelectionTimeoutMS: 30000,
            retryWrites: false,
            retryReads: false,
            directConnection: true,
        };

        // 禁用严格查询
        mongoose.set('strictQuery', false);

        // 连接到数据库
        await mongoose.connect(connectionUri, mongooseOptions);

        logger.info('MongoDB 连接成功');
    } catch (err: any) {
        logger.error(`MongoDB 连接失败: ${err.message}`);
        process.exit(1);
    }
};

// 创建默认租户
const createTenant = async () => {
    try {
        // 检查是否已存在默认租户
        const existingTenant = await Tenant.findOne({ code: 'default' });
        if (existingTenant) {
            logger.info('默认租户已存在，跳过创建');
            return existingTenant;
        }

        // 创建新租户
        const tenant = new Tenant({
            name: '默认医院',
            code: 'default',
            description: '默认医院租户',
            isActive: true,
            settings: {
                allowPatientRegistration: true,
                allowDoctorRegistration: true,
                maxUsers: 1000,
                features: ['consultation', 'prescription', 'report'],
            },
        });

        await tenant.save();
        logger.info('默认租户创建成功');
        return tenant;
    } catch (error: any) {
        logger.error(`创建默认租户失败: ${error.message}`);
        throw error;
    }
};

// 创建默认科室
const createDepartment = async () => {
    try {
        // 检查是否已存在内科科室
        const existingDept = await Department.findOne({ name: '内科' });
        if (existingDept) {
            logger.info('内科科室已存在，跳过创建');
            return existingDept;
        }

        // 创建新科室
        const department = new Department({
            name: '内科',
            description: '处理内部器官疾病',
            iconUrl: 'https://example.com/icons/internal-medicine.png',
            order: 1,
            parentId: null,
            isActive: true,
        });

        await department.save();
        logger.info('内科科室创建成功');
        return department;
    } catch (error: any) {
        logger.error(`创建科室失败: ${error.message}`);
        throw error;
    }
};

// 创建患者用户
const createUser = async (tenantId: mongoose.Types.ObjectId) => {
    try {
        // 检查是否已存在测试患者用户 (通过username或openId)
        const existingUser = await User.findOne({
            $or: [{ username: 'testuser' }, { openId: 'test_user_openid' }],
        });
        if (existingUser) {
            logger.info(`删除已存在的患者用户: ${existingUser.name}`);
            await User.deleteOne({ _id: existingUser._id });
            // 同时删除关联的患者记录
            await User.deleteOne({ userId: existingUser._id });
        }

        // 创建患者用户
        const user = new User({
            tenantId,
            openId: 'test_user_openid',
            userType: 'user',
            username: 'testuser',
            name: '测试患者',
            avatar: 'https://example.com/avatars/patient.png',
            phone: '13800138000',
            password: 'password',
            gender: 'male',
            birthDate: new Date('1990-01-01'),
            isWechatUser: false,
        });
        const savedUser = await user.save();
        return { user: savedUser };
    } catch (error: any) {
        logger.error(`创建患者失败: ${error.message}`);
        throw error;
    }
};

// 创建医生用户
const createDoctorUser = async (
    tenantId: mongoose.Types.ObjectId,
    departmentId: mongoose.Types.ObjectId
) => {
    try {
        // 检查是否已存在测试医生用户 (通过username或openId)
        const existingUser = await User.findOne({
            $or: [{ username: 'testdoctor' }, { openId: 'test_doctor_openid' }],
        });
        if (existingUser) {
            logger.info(`删除已存在的医生用户: ${existingUser.name}`);
            await User.deleteOne({ _id: existingUser._id });
            // 同时删除关联的医生记录
            await Doctor.deleteOne({ userId: existingUser._id });
        }

        // 创建医生用户
        const user = new User({
            tenantId,
            openId: 'test_doctor_openid',
            userType: 'doctor',
            username: 'testdoctor',
            name: '医生张',
            avatar: 'https://example.com/avatars/doctor.png',
            phone: '13900139000',
            password: 'password',
            gender: 'male',
            birthDate: new Date('1985-05-15'),
            isWechatUser: false,
        });

        const savedUser = await user.save();

        // 创建医生记录
        const doctor = new Doctor({
            userId: savedUser._id,
            departmentId,
            title: '主任医师',
            specialties: ['心脏病', '高血压'],
            introduction: '张医生拥有10年临床经验，擅长心血管疾病的诊断和治疗。',
            consultationFee: 100,
            isAvailable: true,
            rating: 4.8,
            consultationCount: 100,
            goodReviewRate: 95,
            availableTimes: [
                {
                    dayOfWeek: 1,
                    timeSlots: ['09:00-10:00', '10:00-11:00', '14:00-15:00', '15:00-16:00'],
                },
                {
                    dayOfWeek: 3,
                    timeSlots: ['09:00-10:00', '10:00-11:00', '14:00-15:00', '15:00-16:00'],
                },
                {
                    dayOfWeek: 5,
                    timeSlots: ['09:00-10:00', '10:00-11:00', '14:00-15:00', '15:00-16:00'],
                },
            ],
        });

        const savedDoctor = await doctor.save();
        logger.info('测试医生创建成功');
        return { user: savedUser, doctor: savedDoctor };
    } catch (error: any) {
        logger.error(`创建医生失败: ${error.message}`);
        throw error;
    }
};

// 主函数
const initializeUsers = async () => {
    try {
        await connectDB();

        // 创建租户、科室和用户
        const tenant = await createTenant();
        const department = await createDepartment();
        await createUser(tenant._id as mongoose.Types.ObjectId);
        await createDoctorUser(
            tenant._id as mongoose.Types.ObjectId,
            department._id as mongoose.Types.ObjectId
        );

        logger.info('初始化完成');
        process.exit(0);
    } catch (error: any) {
        logger.error(`初始化失败: ${error.message}`);
        process.exit(1);
    }
};

// 执行初始化
initializeUsers();
