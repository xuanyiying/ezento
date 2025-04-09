import express from 'express';
import ConsultationController from '../controllers/consultation.controller';
import { auth } from '../middlewares/auth';
const router = express.Router();

/**
 * 会诊路由
 * 处理会诊相关的API请求
 */

// 创建新的会诊（患者）
router.post('/', auth, ConsultationController.createConsultation);

// 获取会诊列表（管理员）
router.get('/', auth, ConsultationController.getConsultationList);

// 获取患者的会诊列表（患者）
router.get('/patient/list', auth, ConsultationController.getPatientConsultations);

// 获取医生的会诊列表（医生）
router.get('/doctor/list', auth, ConsultationController.getDoctorConsultations);

// 提交医生建议（医生）
router.post('/doctor/advice', auth, ConsultationController.submitDoctorAdvice);

// 获取会诊详情（患者、医生、管理员）
router.get('/:id', auth, ConsultationController.getConsultationDetails);

// 更新会诊（医生）
router.put('/:id', auth, ConsultationController.updateConsultation);

export default router; 