import { Request, Response } from 'express';
import ConsultationService from '../services/consultation.service';
import { validateObjectId } from '../utils/validation';
import logger from '../config/logger';
class ConsultationController {
    /**
     * Create a new consultation
     * @route POST /api/consultations
     * @access Private (Patient, Doctor)
     */
    public static async createConsultation(req: Request, res: Response): Promise<void> {
        try {
            const { patientId, doctorId, initialMessage } = req.body;

            if (!validateObjectId(patientId) || !validateObjectId(doctorId)) {
                res.status(400).json({
                    success: false,
                    message: 'Invalid patient or doctor ID'
                });
                return;
            }

            const consultation = await ConsultationService.createConsultation({
                patientId,
                doctorId,
                initialMessage
            });

            res.status(201).json({
                success: true,
                data: {
                    consultationId: consultation._id
                }
            });
        } catch (error: any) {
            logger.error(`Error creating consultation: ${error.message}`);
            res.status(500).json({
                success: false,
                message: 'Failed to create consultation'
            });
        }
    };

    /**
     * Get consultations for a patient
     * @route GET /api/patients/:id/consultations
     * @access Private (Patient, Admin)
     */
    public static async getPatientConsultations(req: Request, res: Response): Promise<void> {
        try {
            const { id } = req.params;
            const page = parseInt(req.query.page as string) || 1;
            const limit = parseInt(req.query.limit as string) || 10;

            if (!validateObjectId(id)) {
                res.status(400).json({
                    success: false,
                    message: 'Invalid patient ID'
                });
                return;
            }

            const result = await ConsultationService.getPatientConsultations(id, page, limit);

            res.status(200).json({
                success: true,
                data: result
            });
        } catch (error: any) {
            logger.error(`Error getting patient consultations: ${error.message}`);
            res.status(500).json({
                success: false,
                message: 'Failed to retrieve consultations'
            });
        }
    };

    /**
     * Get consultations for a doctor
     * @route GET /api/doctors/:id/consultations
     * @access Private (Doctor, Admin)
     */
    public async getDoctorConsultations(req: Request, res: Response): Promise<void> {
        try {
            const { id } = req.params;
            const page = parseInt(req.query.page as string) || 1;
            const limit = parseInt(req.query.limit as string) || 10;

            if (!validateObjectId(id)) {
                res.status(400).json({
                    success: false,
                    message: 'Invalid doctor ID'
                });
                return;
            }

            const result = await ConsultationService.getDoctorConsultations(id, page, limit);

            res.status(200).json({
                success: true,
                data: result
            });
        } catch (error: any) {
            logger.error(`Error getting doctor consultations: ${error.message}`);
            res.status(500).json({
                success: false,
                message: 'Failed to retrieve consultations'
            });
        }
    };

    /**
     * Get consultation details
     * @route GET /api/consultations/:id
     * @access Private (Patient, Doctor, Admin)
     */
    public static async getConsultationDetails(req: Request, res: Response): Promise<void> {
        try {
            const { id } = req.params;

            if (!validateObjectId(id)) {
                res.status(400).json({
                    success: false,
                    message: 'Invalid consultation ID'
                });
                return;
            }

            const consultation = await ConsultationService.getConsultationDetails(id);

            if (!consultation) {
                res.status(404).json({
                    success: false,
                    message: 'Consultation not found'
                });
                return;
            }

            res.status(200).json({
                success: true,
                data: consultation
            });
        } catch (error: any) {
            logger.error(`Error getting consultation details: ${error.message}`);
            res.status(500).json({
                success: false,
                message: 'Failed to retrieve consultation details'
            });
        }
    };

    /**
     * Send a message in a consultation
     * @route POST /api/consultations/:id/messages
     * @access Private (Patient, Doctor)
     */
    public static async sendMessage(req: Request, res: Response): Promise<void> {
        try {
            const { id } = req.params;
            const { senderId, senderType, content, messageType = 'text' } = req.body;

            if (!validateObjectId(id) || !validateObjectId(senderId)) {
                res.status(400).json({
                    success: false,
                    message: 'Invalid consultation or sender ID'
                });
                return;
            }

            if (!['patient', 'doctor', 'ai'].includes(senderType)) {
                res.status(400).json({
                    success: false,
                    message: 'Invalid sender type'
                });
                return;
            }

            const message = await ConsultationService.sendMessage({
                consultationId: id,
                senderId,
                senderType: senderType as 'patient' | 'doctor' | 'ai',
                content,
                messageType: messageType as 'text' | 'image' | 'audio' | 'video'
            });

            res.status(201).json({
                success: true,
                data: {
                    messageId: message._id,
                    timestamp: message.createdAt
                }
            });
        } catch (error: any) {
            logger.error(`Error sending message: ${error.message}`);
            res.status(500).json({
                success: false,
                message: 'Failed to send message'
            });
        }
    };

    /**
     * Get messages for a consultation
     * @route GET /api/consultations/:id/messages
     * @access Private (Patient, Doctor)
     */
    public static async getMessages(req: Request, res: Response): Promise<void> {
        try {
            const { id } = req.params;
            const page = parseInt(req.query.page as string) || 1;
            const limit = parseInt(req.query.limit as string) || 20;

            if (!validateObjectId(id)) {
                res.status(400).json({
                    success: false,
                    message: 'Invalid consultation ID'
                });
                return;
            }

            const result = await ConsultationService.getMessages(id, page, limit);

            res.status(200).json({
                success: true,
                data: result
            });
        } catch (error: any) {
            logger.error(`Error getting messages: ${error.message}`);
            res.status(500).json({
                success: false,
                message: 'Failed to retrieve messages'
            });
        }
    };

    /**
     * End a consultation
     * @route PUT /api/consultations/:id/end
     * @access Private (Doctor)
     */
    public static async endConsultation(req: Request, res: Response): Promise<void> {
        try {
            const { id } = req.params;

            if (!validateObjectId(id)) {
                res.status(400).json({
                    success: false,
                    message: 'Invalid consultation ID'
                });
                return;
            }

            const consultation = await ConsultationService.endConsultation(id);

            res.status(200).json({
                success: true,
                data: {
                    consultationId: consultation._id,
                    status: consultation.status
                }
            });
        } catch (error: any) {
            logger.error(`Error ending consultation: ${error.message}`);
            res.status(500).json({
                success: false,
                message: 'Failed to end consultation'
            });
        }
    };

    /**
     * Get AI response for a consultation
     * @route POST /api/consultations/:id/ai-response
     * @access Private (Patient)
     */
    public static async getAIResponse(req: Request, res: Response): Promise<void> {
        try {
            const { id } = req.params;
            const { question } = req.body;

            if (!validateObjectId(id)) {
                res.status(400).json({
                    success: false,
                    message: 'Invalid consultation ID'
                });
                return;
            }

            if (!question || typeof question !== 'string') {
                res.status(400).json({
                    success: false,
                    message: 'Question is required'
                });
                return;
            }

            const aiResponse = await ConsultationService.getAIResponse(id, question);

            res.status(200).json({
                success: true,
                data: aiResponse
            });
        } catch (error: any) {
            logger.error(`Error getting AI response: ${error.message}`);
            res.status(500).json({
                success: false,
                message: 'Failed to get AI response'
            });
        }
    }
}

export default ConsultationController;