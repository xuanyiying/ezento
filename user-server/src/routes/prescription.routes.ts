import express from 'express';
import { PrescriptionController } from '../controllers';
import { auth, patientAuth, doctorAuth, adminAuth } from '../middlewares/auth';

/**
 * @swagger
 * tags:
 *   name: Prescriptions
 *   description: Prescription management APIs
 */

const router = express.Router();

/**
 * @swagger
 * /prescriptions:
 *   post:
 *     summary: Create a new prescription
 *     tags: [Prescriptions]
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
 *               - medications
 *               - instructions
 *             properties:
 *               patientId:
 *                 type: string
 *                 description: ID of the patient
 *               diagnosis:
 *                 type: string
 *                 description: Diagnosis for the prescription
 *               medications:
 *                 type: array
 *                 items:
 *                   type: object
 *                   required:
 *                     - name
 *                     - dosage
 *                     - frequency
 *                   properties:
 *                     name:
 *                       type: string
 *                       description: Name of the medication
 *                     dosage:
 *                       type: string
 *                       description: Dosage of the medication
 *                     frequency:
 *                       type: string
 *                       description: How often to take the medication
 *                     duration:
 *                       type: string
 *                       description: Duration of the medication
 *               instructions:
 *                 type: string
 *                 description: Additional instructions for the patient
 *     responses:
 *       201:
 *         description: Prescription created successfully
 *       400:
 *         description: Invalid input
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Doctor only
 * @route   POST /prescriptions
 * @desc    Create a new prescription
 * @access  Private/Doctor
 */
router.post('/', auth, doctorAuth, PrescriptionController.createPrescription());

/**
 * @swagger
 * /prescriptions:
 *   get:
 *     summary: Get all prescriptions (admin only)
 *     tags: [Prescriptions]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of all prescriptions
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin only
 * @route   GET /prescriptions
 * @desc    Get all prescriptions (admin only)
 * @access  Private/Admin
 */
router.get('/', auth, adminAuth, PrescriptionController.getAllPrescriptions());

/**
 * @swagger
 * /patient/prescriptions/list:
 *   get:
 *     summary: Get all prescriptions for a patient
 *     tags: [Prescriptions]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of patient's prescriptions
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Patient only
 * @route   GET /patient/prescriptions/list
 * @desc    Get all prescriptions for a patient
 * @access  Private/Patient
 */
router.get('/patient/list', auth, patientAuth, PrescriptionController.getPatientPrescriptions());

/**
 * @swagger
 * /doctor/prescriptions/list:
 *   get:
 *     summary: Get all prescriptions for a doctor
 *     tags: [Prescriptions]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of prescriptions created by the doctor
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Doctor only
 * @route   GET /doctor/prescriptions/list
 * @desc    Get all prescriptions for a doctor
 * @access  Private/Doctor
 */
router.get('/doctor/list', auth, doctorAuth, PrescriptionController.getDoctorPrescriptions());

/**
 * @swagger
 * /patients/{patientId}/prescriptions:
 *   get:
 *     summary: Get all prescriptions for a specific patient
 *     tags: [Prescriptions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: patientId
 *         required: true
 *         schema:
 *           type: string
 *         description: Patient ID
 *     responses:
 *       200:
 *         description: List of prescriptions for the patient
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Only the patient themselves, their doctors, or admins can access
 *       404:
 *         description: Patient not found
 * @route   GET /patients/:patientId/prescriptions
 * @desc    Get all prescriptions for a specific patient
 * @access  Private
 */
// This route is added outside this router in app.ts or a separate patient router
// We're adding it here for documentation purposes

/**
 * @swagger
 * /prescriptions/{id}:
 *   get:
 *     summary: Get a prescription by ID
 *     tags: [Prescriptions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Prescription ID
 *     responses:
 *       200:
 *         description: Prescription details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Prescription not found
 * @route   GET /prescriptions/:id
 * @desc    Get a prescription by ID
 * @access  Private
 */
router.get('/:id', auth, PrescriptionController.getPrescriptionById());

/**
 * @swagger
 * /prescriptions/{id}:
 *   put:
 *     summary: Update a prescription
 *     tags: [Prescriptions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Prescription ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               diagnosis:
 *                 type: string
 *               medications:
 *                 type: array
 *                 items:
 *                   type: object
 *               instructions:
 *                 type: string
 *     responses:
 *       200:
 *         description: Prescription updated successfully
 *       400:
 *         description: Invalid input
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Doctor only
 *       404:
 *         description: Prescription not found
 * @route   PUT /prescriptions/:id
 * @desc    Update a prescription
 * @access  Private/Doctor
 */
router.put('/:id', auth, doctorAuth, PrescriptionController.updatePrescription());

/**
 * @swagger
 * /prescriptions/{id}:
 *   delete:
 *     summary: Delete a prescription
 *     tags: [Prescriptions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Prescription ID
 *     responses:
 *       200:
 *         description: Prescription deleted successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Doctor only
 *       404:
 *         description: Prescription not found
 * @route   DELETE /prescriptions/:id
 * @desc    Delete a prescription
 * @access  Private/Doctor
 */
router.delete('/:id', auth, doctorAuth, PrescriptionController.deletePrescription());

/**
 * @swagger
 * /api/prescriptions/{id}/status:
 *   patch:
 *     summary: Update prescription status
 *     tags: [Prescriptions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Prescription ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - status
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [PENDING, FILLED, COMPLETED, CANCELLED]
 *                 description: New status of the prescription
 *     responses:
 *       200:
 *         description: Prescription status updated successfully
 *       400:
 *         description: Invalid input
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Prescription not found
 * @route   PATCH /api/prescriptions/:id/status
 * @desc    Update prescription status
 * @access  Private
 */
router.patch('/:id/status', auth, doctorAuth, PrescriptionController.updatePrescriptionStatus());

export default router;