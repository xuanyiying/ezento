import { Request, Response } from 'express';
import ReportService from '../services/report.service';
import { ResponseUtil } from '../utils/responseUtil';

class ReportController {
    /**
     * Upload a new report
     */
    public static async uploadReport(req: Request, res: Response) {
        try {
            const { patientId, reportType, reportDate, hospital, reportImages, description } = req.body;

            if (!patientId || !reportType || !reportDate || !hospital || !reportImages) {
                ResponseUtil.badRequest(res, 'Missing required fields');
                return;
            }

            const report = await ReportService.uploadReport({
                patientId,
                reportType,
                reportDate,
                hospital,
                reportImages,
                description
            });

            ResponseUtil.success(res, {
                reportId: report._id
            });
        } catch (error) {
            ResponseUtil.serverError(res, 'Failed to upload report');
        }
    }

    /**
     * Get report list for a patient    
     */
    public static async getReportList(req: Request, res: Response) {
        try {
            const { patientId, reportType } = req.query;
            const page = parseInt(req.query.page as string) || 1;
            const limit = parseInt(req.query.limit as string) || 10;

            if (!patientId) {
                ResponseUtil.badRequest(res, 'Patient ID is required');
                return;
            }

            const result = await ReportService.getReportList(
                patientId as string,
                page,
                limit,
                reportType as string
            );
            ResponseUtil.success(res, result);
        } catch (error) {
            ResponseUtil.serverError(res, 'Failed to get report list');
        }
    }

    /**
     * Get report details
     */
    public static async getReportDetails(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const details = await ReportService.getReportDetails(id);

            if (!details) {
                ResponseUtil.notFound(res, 'Report not found');
                return;
            }

            ResponseUtil.success(res, details);
        } catch (error) {
            ResponseUtil.serverError(res, 'Failed to get report details');
        }
    }

    /**
     * Get AI interpretation for a report
     */
    public static async getAIInterpretation(req: Request, res: Response) {
        try {
            const { reportId } = req.body;

            if (!reportId) {
                ResponseUtil.badRequest(res, 'Report ID is required');
                return;
            }

            const interpretation = await ReportService.getAIInterpretation(reportId);

            if (!interpretation) {
                ResponseUtil.notFound(res, 'Report not found');
                return;
            }

            ResponseUtil.success(res, interpretation);
        } catch (error) {
            ResponseUtil.serverError(res, 'Failed to get AI interpretation');
        }
    }
}

export default ReportController;