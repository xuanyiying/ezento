import express from 'express';
import { PreDiagnosisController } from '../controllers';
import { auth, doctorAuth } from '../middlewares/auth';

/**
 * @swagger
 * tags:
 *   name: Doctor Pre-Diagnosis
 *   description: Doctor pre-diagnosis management APIs
 */

const router = express.Router();

/**
 * @swagger
 * /doctor/prediagnosis/list:
 *   get:
 *     summary: Get all pre-diagnoses for a doctor
 *     tags: [Doctor Pre-Diagnosis]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of pre-diagnoses assigned to the doctor
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *       401:
 *         description: Unauthorized
 * @route   GET /doctor/prediagnosis/list
 * @desc    Get all pre-diagnoses for a doctor
 * @access  Private/Doctor
 */
router.get('/list', auth, doctorAuth, PreDiagnosisController.getDoctorPreDiagnoses);

/**
 * @swagger
 * /doctor/prediagnosis/advice:
 *   post:
 *     summary: Submit doctor advice for a pre-diagnosis
 *     tags: [Doctor Pre-Diagnosis]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - prediagnosisId
 *               - advice
 *             properties:
 *               prediagnosisId:
 *                 type: string
 *                 description: ID of the pre-diagnosis
 *               advice:
 *                 type: string
 *                 description: Doctor's advice
 *               recommendDepartment:
 *                 type: string
 *                 description: Doctor's recommended department for follow-up
 *               urgencyLevel:
 *                 type: string
 *                 enum: [NORMAL, URGENT, EMERGENCY]
 *                 description: Urgency level of the condition
 *     responses:
 *       200:
 *         description: Advice submitted successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Pre-diagnosis not found
 * @route   POST /doctor/prediagnosis/advice
 * @desc    Submit doctor advice for a pre-diagnosis
 * @access  Private/Doctor
 */
router.post('/advice', auth, doctorAuth, PreDiagnosisController.submitDoctorAdvice);

export default router;