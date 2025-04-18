import express from 'express';
import authRoutes from './auth.routes';
import departmentRoutes from './department.routes';
import consultationRoutes from './consultation.routes';
import conversationRoutes from './conversation.routes';
import uploadRoutes from './upload.routes';
import doctorRoutes from './doctor.routes';

const router = express.Router();

// 认证相关路由
router.use('/auth', authRoutes);

// 科室相关路由
router.use('/departments', departmentRoutes);

// 医生相关路由
router.use('/doctors', doctorRoutes);

// 会诊相关路由（包括预问诊、导诊、报告解读）
router.use('/consultations', consultationRoutes);

// 会话相关路由（AI对话）
router.use('/conversations', conversationRoutes);

// 文件上传相关路由
router.use('/uploads', uploadRoutes);

export default router;
