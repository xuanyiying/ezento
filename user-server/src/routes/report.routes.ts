import express from 'express';
import  ReportController  from '../controllers/report.controller';
import { auth } from '../middlewares';

/**
 * @swagger
 * tags:
 *   name: Reports
 *   description: Medical report management APIs
 */

const router = express.Router();

/**
 * @swagger
 * /api/patient/reports/upload:
 *   post:
 *     summary: Upload a new report
 *     tags: [Report]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - patientId
 *               - reportType
 *               - reportDate
 *               - hospital
 *               - reportImages
 *             properties:
 *               patientId:
 *                 type: string
 *               reportType:
 *                 type: string
 *                 enum: [LABORATORY, IMAGING, PATHOLOGY]
 *               reportDate:
 *                 type: string
 *                 format: date
 *               hospital:
 *                 type: string
 *               reportImages:
 *                 type: array
 *                 items:
 *                   type: string
 *               description:
 *                 type: string
 *     responses:
 *       200:
 *         description: Report uploaded successfully
 */
router.post('/upload', auth, ReportController.uploadReport);

/**
 * @swagger
 * /api/patient/reports/list:
 *   get:
 *     summary: Get report list for a patient
 *     tags: [Report]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: patientId
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: reportType
 *         schema:
 *           type: string
 *           enum: [LABORATORY, IMAGING, PATHOLOGY]
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *     responses:
 *       200:
 *         description: List of reports
 */
router.get('/list', auth, ReportController.getReportList);

/**
 * @swagger
 * /api/patient/reports/{id}:
 *   get:
 *     summary: Get report details
 *     tags: [Report]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Report details
 */
router.get('/:id', auth, ReportController.getReportDetails);

/**
 * @swagger
 * /api/patient/reports/ai-interpret:
 *   post:
 *     summary: Get AI interpretation for a report
 *     tags: [Report]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - reportId
 *             properties:
 *               reportId:
 *                 type: string
 *     responses:
 *       200:
 *         description: AI interpretation of the report
 */
router.post('/ai-interpret', auth, ReportController.getAIInterpretation);

export default router;