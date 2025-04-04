import express from 'express';
import ConsultationController from '../controllers/consultation.controller';
import { auth, tenantAuth } from '../middlewares/auth';

const router = express.Router();

// Create a new consultation
router.post('/', [auth, tenantAuth], ConsultationController.createConsultation);

// Get consultation details 
router.get('/:id', [auth, tenantAuth], ConsultationController.getConsultationDetails);

// Send a message in a consultation
router.post('/:id/messages', [auth, tenantAuth], ConsultationController.sendMessage);

// Get messages for a consultation
router.get('/:id/messages', [auth, tenantAuth], ConsultationController.getMessages);

// End a consultation
router.put('/:id/end', [auth, tenantAuth], ConsultationController.endConsultation);

// Get AI response
router.post('/:id/ai-response', [auth, tenantAuth], ConsultationController.getAIResponse);

export default router; 