import logger from '../config/logger';
import mongoose from 'mongoose';
import { Consultation, Message, User } from '../models';
import AiService from './ai.service';

interface PopulatedPatient {
    _id: mongoose.Types.ObjectId;
    name: string;
    gender: string;
    birthDate: Date;
}

interface PopulatedDoctor {
    _id: mongoose.Types.ObjectId;
    name: string;
    avatar: string;
}

interface PopulatedConsultation {
    _id: mongoose.Types.ObjectId;
    patientId: PopulatedPatient;
    doctorId: PopulatedDoctor;
    status: string;
    createdAt: Date;
    toObject: () => any;
}

class ConsultationService {
    /**
     * Create a new consultation
     */
    static async createConsultation(data: { patientId: string; doctorId: string; initialMessage?: string }) {
        try {
            // Create new consultation
            const consultation = new Consultation({
                patientId: data.patientId,
                doctorId: data.doctorId,
                status: 'waiting'
            });
            
            await consultation.save();
            
            // Create initial message if provided
            if (data.initialMessage) {
                const message = new Message({
                    consultationId: consultation._id,
                    senderId: data.patientId,
                    senderType: 'patient',
                    content: data.initialMessage,
                    messageType: 'text'
                });
                
                await message.save();
            }
            
            return consultation;
        } catch (error) {
            logger.error(`Error in createConsultation: ${error}`);
            throw error;
        }
    }

    /**
     * Get consultation list for a patient
     */
    static async getPatientConsultations(patientId: string, page: number = 1, limit: number = 10) {
        try {
            const skip = (page - 1) * limit;
            const query = { patientId };

            const total = await Consultation.countDocuments(query);
            const consultations = await Consultation.find(query)
                .populate('doctorId', 'name avatar')
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .exec();

            return {
                total,
                list: consultations.map((item: any) => ({
                    consultationId: item._id,
                    doctor: {
                        doctorId: item.doctorId._id,
                        name: item.doctorId.name,
                        avatar: item.doctorId.avatar
                    },
                    status: item.status,
                    createTime: item.createdAt
                }))
            };
        } catch (error) {
            logger.error(`Error in getPatientConsultations: ${error}`);
            throw error;
        }
    }

    /**
     * Get consultation list for a doctor
     */
    static async getDoctorConsultations(doctorId: string, page: number = 1, limit: number = 10) {
        try {
            const skip = (page - 1) * limit;
            const query = { doctorId };

            const total = await Consultation.countDocuments(query);
            const consultations = await Consultation.find(query)
                .populate('patientId', 'name')
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .exec();

            return {
                total,
                list: consultations.map((item: any) => ({
                    consultationId: item._id,
                    patient: {
                        patientId: item.patientId._id,
                        name: item.patientId.name
                    },
                    status: item.status,
                    createTime: item.createdAt
                }))
            };
        } catch (error) {
            logger.error(`Error in getDoctorConsultations: ${error}`);
            throw error;
        }
    }

    /**
     * Get consultation details
     */
    static async getConsultationDetails(id: string) {
        try {
            // Use mongoose.Types.ObjectId to validate the id
            if (!mongoose.Types.ObjectId.isValid(id)) {
                return null;
            }
            
            const consultation = await Consultation.findById(id)
                .populate('patientId', 'name gender birthDate')
                .populate('doctorId', 'name avatar')
                .exec() as unknown as PopulatedConsultation;

            if (!consultation) {
                return null;
            }

            // Calculate age from birthDate
            const age = consultation.patientId.birthDate 
                ? Math.floor((new Date().getTime() - new Date(consultation.patientId.birthDate).getTime()) / (365.25 * 24 * 60 * 60 * 1000))
                : null;

            const consultationObj = consultation.toObject();
            
            return {
                consultationId: consultation._id,
                patient: {
                    patientId: consultation.patientId._id,
                    name: consultation.patientId.name,
                    age,
                    gender: consultation.patientId.gender
                },
                doctor: {
                    doctorId: consultation.doctorId._id,
                    name: consultation.doctorId.name,
                    avatar: consultation.doctorId.avatar
                },
                status: consultation.status,
                createTime: consultation.createdAt
            };
        } catch (error) {
            logger.error(`Error in getConsultationDetails: ${error}`);
            throw error;
        }
    }

    /**
     * Send a message in a consultation
     */
    static async sendMessage(data: { 
        consultationId: string; 
        senderId: string; 
        senderType: 'patient' | 'doctor' | 'ai'; 
        content: string; 
        messageType?: 'text' | 'image' | 'audio' | 'video';
    }) {
        try {
            // Validate that consultation exists
            if (!mongoose.Types.ObjectId.isValid(data.consultationId)) {
                throw new Error('Invalid consultation ID');
            }
            
            const consultation = await Consultation.findById(data.consultationId);
            if (!consultation) {
                throw new Error('Consultation not found');
            }
            
            // Create the message
            const message = new Message({
                consultationId: data.consultationId,
                senderId: data.senderId,
                senderType: data.senderType,
                content: data.content,
                messageType: data.messageType || 'text'
            });
            
            await message.save();
            
            // Update consultation status if needed
            if (consultation.status === 'waiting' && data.senderType === 'doctor') {
                consultation.status = 'in-progress';
                await consultation.save();
            }
            
            return message;
        } catch (error) {
            logger.error(`Error in sendMessage: ${error}`);
            throw error;
        }
    }

    /**
     * Get messages for a consultation
     */
    static async getMessages(consultationId: string, page: number = 1, limit: number = 20) {
        try {
            // Validate consultation ID
            if (!mongoose.Types.ObjectId.isValid(consultationId)) {
                throw new Error('Invalid consultation ID');
            }
            
            const skip = (page - 1) * limit;
            const query = { consultationId };

            const total = await Message.countDocuments(query);
            const messages = await Message.find(query)
                .sort({ createdAt: 1 }) // Sort by creation time, oldest first
                .skip(skip)
                .limit(limit)
                .exec();

            return {
                total,
                list: messages.map((msg: any) => ({
                    messageId: msg._id,
                    senderId: msg.senderId,
                    senderType: msg.senderType,
                    content: msg.content,
                    messageType: msg.messageType,
                    timestamp: msg.createdAt
                }))
            };
        } catch (error) {
            logger.error(`Error in getMessages: ${error}`);
            throw error;
        }
    }

    /**
     * End a consultation
     */
    static async endConsultation(consultationId: string) {
        try {
            // Validate consultation ID
            if (!mongoose.Types.ObjectId.isValid(consultationId)) {
                throw new Error('Invalid consultation ID');
            }
            
            const consultation = await Consultation.findById(consultationId);
            if (!consultation) {
                throw new Error('Consultation not found');
            }
            
            consultation.status = 'completed';
            await consultation.save();
            
            return consultation;
        } catch (error) {
            logger.error(`Error in endConsultation: ${error}`);
            throw error;
        }
    }

    /**
     * Send a message through AI assistant
     */
    static async getAIResponse(consultationId: string, question: string) {
        try {
            // Validate consultation ID
            if (!mongoose.Types.ObjectId.isValid(consultationId)) {
                throw new Error('Invalid consultation ID');
            }
            
            const consultation = await Consultation.findById(consultationId).populate('patientId');
            if (!consultation) {
                throw new Error('Consultation not found');
            }
            
            // Get patient info
            const patient = consultation.patientId as any;
            
            // Get conversation history
            const previousMessages = await Message.find({ consultationId })
                .sort({ createdAt: -1 })
                .limit(10)
                .exec();
                
            const conversationHistory = previousMessages.reverse().map((msg: any) => ({
                role: msg.senderType === 'patient' ? 'user' as const : 'assistant' as const,
                content: msg.content
            }));
            
            // Calculate age from birthDate
            const age = patient.birthDate 
                ? Math.floor((new Date().getTime() - new Date(patient.birthDate).getTime()) / (365.25 * 24 * 60 * 60 * 1000))
                : undefined;
            
            // Get AI response
            const aiResponse = await AiService.generateConsultationResponse(
                question,
                {
                    age,
                    gender: patient.gender,
                    medicalHistory: patient.medicalHistory
                },
                conversationHistory
            );
            
            // Create message for the AI response
            const aiMessage = new Message({
                consultationId,
                senderId: 'AI_ASSISTANT',
                senderType: 'ai',
                content: aiResponse,
                messageType: 'text'
            });
            
            await aiMessage.save();
            
            return {
                messageId: aiMessage._id,
                content: aiResponse,
                timestamp: aiMessage.createdAt
            };
        } catch (error) {
            logger.error(`Error in getAIResponse: ${error}`);
            throw error;
        }
    }
}

export default ConsultationService; 