import { Request, Response } from 'express';
import { PatientService } from '../services';
import logger from '../config/logger';

/**
 * Controller for patient-related functionalities
 */
export class PatientController {
    /**
     * Get all patients
     * @route GET /api/patients
     */
    static async getAllPatients(req: Request, res: Response) {
        try {
            const patients = await PatientService.getAllPatients();
            res.status(200).json({ code: 200, msg: 'success', data: patients });
        } catch (error: any) {
            logger.error(`Error getting patients: ${error.message}`);
            res.status(500).json({
                code: 500,
                msg: 'Failed to retrieve patients'
            });
        }
    }

    /**
     * Get a patient by ID
     * @route GET /api/patients/:id
     */
    static async getPatientById(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const patient = await PatientService.getPatientById(id);

            if (!patient) {
                res.status(404).json({
                    code: 404,
                    msg: 'Patient not found'
                });
                return;
            }

            res.status(200).json({ code: 200, msg: 'success', data: patient });
        } catch (error: any) {
            logger.error(`Error getting patient: ${error.message}`);
            res.status(500).json({
                code: 500,
                msg: 'Failed to retrieve patient'
            });
        }
    }

    /**
     * Create a new patient
     * @route POST /api/patients
     */
    static async createPatient(req: Request, res: Response) {
        try {
            const patientData = req.body;
            const newPatient = await PatientService.createPatient(patientData);
            res.status(201).json({ code: 200, msg: 'success', data: newPatient });
        } catch (error: any) {
            logger.error(`Error creating patient: ${error.message}`);
            if (error.message.includes('validation failed')) {
                res.status(400).json({
                    code: 400,
                    msg: error.message
                });
            } else {
                res.status(500).json({
                    code: 500,
                    msg: 'Failed to create patient'
                });
            }
        }
    }

    /**
     * Update a patient
     * @route PUT /api/patients/:id
     */
    static async updatePatient(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const patientData = req.body;

            const patient = await PatientService.getPatientById(id);
            if (!patient) {
                res.status(404).json({
                    code: 404,
                    msg: 'Patient not found'
                });
                return;
            }
            const updatedPatient = await PatientService.updatePatient(id, patientData);
            res.status(200).json({ code: 200, msg: 'success', data: updatedPatient });
        } catch (error: any) {
            logger.error(`Error updating patient: ${error.message}`);
            if (error.message.includes('validation failed')) {
                res.status(400).json({
                    code: 400,
                    msg: error.message
                });
            } else {
                res.status(500).json({
                    code: 500,
                    msg: 'Failed to update patient'
                });
            }
        }
    }

    /**
     * Delete a patient
     * @route DELETE /api/patients/:id
     */
    static async deletePatient(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const deleted = await PatientService.deletePatient(id);

            if (!deleted) {
                res.status(404).json({
                    code: 404,
                    msg: 'Patient not found'
                });
                return;
            }

            res.status(200).json({
                code: 200,
                msg: 'Patient deleted successfully'
            });
        } catch (error: any) {
            logger.error(`Error deleting patient: ${error.message}`);
            res.status(500).json({
                code: 500,
                msg: 'Failed to delete patient'
            });
        }
    }

  

    /**
     * Get patient's consultations
     * @route GET /api/patients/:id/consultations
     */
    static async getPatientConsultations(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const patient = await PatientService.getPatientById(id);

            if (!patient) {
                res.status(404).json({
                    code: 404,
                    msg: 'Patient not found'
                });
                return;
            }
            const consultations = await PatientService.getPatientConsultations(id);
            res.status(200).json({ code: 200, msg: 'success', data: consultations });
        } catch (error: any) {
            logger.error(`Error getting patient consultations: ${error.message}`);
            res.status(500).json({
                code: 500,
                msg: 'Failed to retrieve consultations'
            });
        }
    }
}

export default PatientController; 