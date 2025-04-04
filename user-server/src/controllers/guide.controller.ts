import { Request, Response } from 'express';
import GuideService from '../services/guide.service';
import { ResponseUtil } from '../utils/responseUtil';

class GuideController {
    /**
     * Get all departments
     */
    static async getDepartments(req: Request, res: Response): Promise<void> {
        try {
            const departments = await GuideService.getDepartments();
            ResponseUtil.success(res, departments);
        } catch (error) {
            ResponseUtil.serverError(res, 'Failed to get departments');
        }
    }

    /**
     * Get recommendations based on symptoms
     */
    static async getRecommendationsBySymptoms(req: Request, res: Response): Promise<void> {
        try {
            const { symptoms } = req.body;

            if (!symptoms) {
                ResponseUtil.badRequest(res, 'Symptoms are required');
                return;
            }

            const recommendations = await GuideService.getRecommendationsBySymptoms(symptoms);
            ResponseUtil.success(res, recommendations);
        } catch (error) {
            ResponseUtil.serverError(res, 'Failed to get recommendations');
        }
    }

    /**
     * Get recommended doctors
     */
    static async getRecommendedDoctors(req: Request, res: Response): Promise<void> {
        try {
            const { symptoms, departmentId } = req.body;

            if (!symptoms) {
                ResponseUtil.badRequest(res, 'Symptoms are required');
                return;
            }

            const doctors = await GuideService.getRecommendedDoctors(symptoms, departmentId);
            ResponseUtil.success(res, doctors);
        } catch (error) {
            ResponseUtil.serverError(res, 'Failed to get recommended doctors');
        }
    }

    /**
     * Get doctor details
     */
    static async getDoctorDetails(req: Request, res: Response): Promise<void> {
        try {
            const { id } = req.params;
            const doctor = await GuideService.getDoctorDetails(id);

            if (!doctor) {
                ResponseUtil.notFound(res, 'Doctor not found');
                return;
            }

            ResponseUtil.success(res, doctor);
        } catch (error) {
            ResponseUtil.serverError(res, 'Failed to get doctor details');
        }
    }
}

export default GuideController; 