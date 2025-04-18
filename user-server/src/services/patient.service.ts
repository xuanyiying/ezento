import { Patient, Consultation, User } from '../models';
import mongoose from 'mongoose';
import logger from '../config/logger';
import { IPatient } from '../models/Patient';

class PatientService {
    /**
     * Get all patients with their user information
     */
    static async getAllPatients() {
        try {
            const patients = await Patient.find().populate('userId', 'name avatar phone').exec();
            return patients;
        } catch (error) {
            logger.error(`Error in PatientService.getAllPatients: ${error}`);
            throw error;
        }
    }

    /**
     * Get a patient by ID with their user information
     */
    static async getPatientById(id: string) {
        try {
            if (!mongoose.Types.ObjectId.isValid(id)) {
                return null;
            }

            const patient = await Patient.findById(id)
                .populate('userId', 'name avatar phone')
                .exec();
            return patient;
        } catch (error) {
            logger.error(`Error in PatientService.getPatientById: ${error}`);
            throw error;
        }
    }

    /**
     * Create a new patient
     */
    static async createPatient(patientData: any) {
        try {
            // Create a user first if userId is not provided
            if (!patientData.userId) {
                if (!patientData.userData) {
                    throw new Error('User data is required to create a patient');
                }

                const userData = {
                    ...patientData.userData,
                    userType: 'patient',
                };

                const user = new User(userData);
                const savedUser = await user.save();
                patientData.userId = savedUser._id;
            }

            const patient = new Patient(patientData);
            const savedPatient = await patient.save();

            // Populate user information before returning
            return await Patient.findById(savedPatient._id)
                .populate('userId', 'name avatar phone')
                .exec();
        } catch (error) {
            logger.error(`Error in PatientService.createPatient: ${error}`);
            throw error;
        }
    }

    /**
     * Update a patient by ID
     */
    static async updatePatient(id: string, patientData: Partial<IPatient>) {
        try {
            if (!mongoose.Types.ObjectId.isValid(id)) {
                return null;
            }

            // Update user data if provided
            if (patientData.userData) {
                const patient = await Patient.findById(id);
                if (patient) {
                    await User.findByIdAndUpdate(patient.userId, patientData.userData, {
                        new: true,
                    });
                }
                delete patientData.userData;
            }

            const updatedPatient = await Patient.findByIdAndUpdate(id, patientData, {
                new: true,
            }).populate('userId', 'name avatar phone');

            return updatedPatient;
        } catch (error) {
            logger.error(`Error in PatientService.updatePatient: ${error}`);
            throw error;
        }
    }

    /**
     * Delete a patient by ID
     */
    static async deletePatient(id: string) {
        try {
            if (!mongoose.Types.ObjectId.isValid(id)) {
                return false;
            }

            // Find the patient first to get the userId
            const patient = await Patient.findById(id);
            if (!patient) {
                return false;
            }

            // Delete the patient
            await Patient.findByIdAndDelete(id);

            // Delete associated user
            await User.findByIdAndDelete(patient.userId);

            return true;
        } catch (error) {
            logger.error(`Error in PatientService.deletePatient: ${error}`);
            throw error;
        }
    }

    /**
     * Get all consultations for a patient
     */
    static async getPatientConsultations(patientId: string) {
        try {
            if (!mongoose.Types.ObjectId.isValid(patientId)) {
                return [];
            }

            const consultations = await Consultation.find({ patientId })
                .populate('doctorId', 'title department hospital userId')
                .populate({
                    path: 'doctorId',
                    populate: {
                        path: 'userId',
                        select: 'name avatar phone',
                    },
                })
                .sort({ startTime: -1 })
                .exec();

            return consultations;
        } catch (error) {
            logger.error(`Error in PatientService.getPatientConsultations: ${error}`);
            throw error;
        }
    }
}

export default PatientService;
