import express, { Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import apiDocs from './config/swagger';
import patientRoutes from './routes/patient.routes';
import doctorRoutes from './routes/doctor.routes';
import prediagnosisRoutes from './routes/prediagnosis.routes';
import reportRoutes from './routes/report.routes';
import prescriptionRoutes from './routes/prescription.routes';
import departmentRoutes from './routes/department.routes';
import authRoutes from './routes/auth.routes';
import doctorPrediagnosisRoutes from './routes/doctor.prediagnosis.routes';
import conversationRoutes from './routes/conversation.routes';
import { notFound, errorHandler } from './middlewares';
import { PrescriptionController } from './controllers';
import { auth, tenantContext, tenantAuth } from './middlewares';
import guideRoutes from './routes/guide.routes';

// Initialize express
const app = express();

// Apply middlewares
app.use(helmet());
app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true
}));
app.use(compression({
    level: 6,
    threshold: 10 * 1024 * 1024,
    filter: (req, res) => {
        if (req.headers['x-no-compression']) return false;
        return compression.filter(req, res);
    }
}));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Health check route
app.get('/api/health', (_req: Request, res: Response) => {
    res.status(200).json({ status: 'OK', message: 'Server is running' });
});

// Root route - redirect to API docs
app.get('/', (_req: Request, res: Response) => {
    res.redirect('/api-docs');
});

// Initialize API Documentation
apiDocs(app);

// Public routes (no tenant context required)
app.use('/api/auth', authRoutes);

// Apply tenant context middleware to all API routes
app.use('/api', tenantContext);
app.use('/api/guide', guideRoutes);
// Protected routes (require tenant context)
app.use('/api/patients', [auth, tenantAuth], patientRoutes);
app.use('/api/doctors', [auth, tenantAuth], doctorRoutes);
// app.use('/api/messages', messageRoutes);
app.use('/api/patient/prediagnosis', [auth, tenantAuth], prediagnosisRoutes);
app.use('/api/doctor/prediagnosis', [auth, tenantAuth], doctorPrediagnosisRoutes);
app.use('/api/patient/reports', [auth, tenantAuth], reportRoutes);
app.use('/api/prescriptions', [auth, tenantAuth], prescriptionRoutes);
app.use('/api/departments', [auth, tenantAuth], departmentRoutes);
app.use('/api/conversation', [auth, tenantAuth], conversationRoutes);

// Special route for getting patient prescriptions by patient ID
app.get('/api/patients/:patientId/prescriptions', [auth, tenantAuth], PrescriptionController.getPatientPrescriptionsByPatientId());

// 404 Not Found Middleware
app.use(notFound);

// Error Handling Middleware
app.use(errorHandler);

export default app;