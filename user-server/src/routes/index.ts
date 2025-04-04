import express, { Express } from 'express';
import prediagnosisRoutes from './prediagnosis.routes';
import reportRoutes from './report.routes';
import authRoutes from './auth.routes';
import guideRoutes from './guide.routes';
import consultationRoutes from './consultation.routes';

const router = express.Router();

// Auth routes
router.use('/auth', authRoutes);

// Prediagnosis routes
router.use('/api/patient/prediagnosis', prediagnosisRoutes);

// Guide routes
router.use('/api/guide', guideRoutes);

// Report routes
router.use('/api/patient/reports', reportRoutes);

// Consultation routes
router.use('/api/consultations', consultationRoutes);

// Patient specific consultation routes
router.use('/api/patients/:id/consultations', (req, res, next) => {
    req.body.patientId = req.params.id;
    next();
}, consultationRoutes);

// Doctor specific consultation routes
router.use('/api/doctors/:id/consultations', (req, res, next) => {
    req.body.doctorId = req.params.id;
    next();
}, consultationRoutes);

// 初始化API路由
const initializeAPIRoutes = (app: Express) => {
    app.use('/', router);
    return app;
};

export default initializeAPIRoutes;