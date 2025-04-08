import express from 'express';
import prediagnosisRoutes from './prediagnosis.routes';
import reportRoutes from './report.routes';
import authRoutes from './auth.routes';
import guideRoutes from './guide.routes';
import doctorRoutes from './doctor.routes';
import patientRoutes from './patient.routes';
import departmentRoutes from './department.routes';
import conversationRoutes from './conversation.routes';

const router = express.Router();

// Auth routes
router.use('/auth', authRoutes);

// Prediagnosis routes
router.use('/patient/prediagnosis', prediagnosisRoutes);

// Guide routes
router.use('/guide', guideRoutes);

// Report routes
router.use('/patient/reports', reportRoutes);


// Doctor routes
router.use('/doctors', doctorRoutes);

// Patient routes
router.use('/patients', patientRoutes);

// Department routes
router.use('/departments', departmentRoutes);

// Conversation routes
router.use('/conversation', conversationRoutes);

// 初始化API路

export default router;