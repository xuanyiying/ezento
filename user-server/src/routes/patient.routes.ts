import express from 'express';
import { PatientController } from '../controllers';
import { auth, adminAuth, doctorAuth } from '../middlewares/auth';

/**
 * @swagger
 * tags:
 *   name: Patients
 *   description: Patient management APIs
 */

const router = express.Router();

/**
 * @swagger
 * /patients:
 *   get:
 *     summary: Get all patients
 *     tags: [Patients]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: A list of all patients
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
 * @route   GET /patients
 * @desc    Get all patients
 * @access  Private/Doctor
 */
router.get('/', auth, doctorAuth, PatientController.getAllPatients);

/**
 * @swagger
 * /patients/{id}:
 *   get:
 *     summary: Get patient by ID
 *     tags: [Patients]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Patient ID
 *     responses:
 *       200:
 *         description: Patient details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Patient not found
 * @route   GET /patients/:id
 * @desc    Get patient by ID
 * @access  Private
 */
router.get('/:id', auth, PatientController.getPatientById);

/**
 * @swagger
 * /patients:
 *   post:
 *     summary: Create a new patient
 *     tags: [Patients]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - gender
 *               - dateOfBirth
 *               - phone
 *             properties:
 *               name:
 *                 type: string
 *                 description: Patient's full name
 *               gender:
 *                 type: string
 *                 enum: [MALE, FEMALE, OTHER]
 *                 description: Patient's gender
 *               dateOfBirth:
 *                 type: string
 *                 format: date
 *                 description: Patient's date of birth
 *               phone:
 *                 type: string
 *                 description: Patient's phone number
 *               address:
 *                 type: string
 *                 description: Patient's address
 *               medicalHistory:
 *                 type: string
 *                 description: Patient's medical history
 *     responses:
 *       201:
 *         description: Patient created successfully
 *       400:
 *         description: Invalid input
 *       401:
 *         description: Unauthorized
 * @route   POST /patients
 * @desc    Create a new patient
 * @access  Private
 */
router.post('/', auth, PatientController.createPatient);

/**
 * @swagger
 * /patients/{id}:
 *   put:
 *     summary: Update a patient
 *     tags: [Patients]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Patient ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               gender:
 *                 type: string
 *                 enum: [MALE, FEMALE, OTHER]
 *               dateOfBirth:
 *                 type: string
 *                 format: date
 *               phone:
 *                 type: string
 *               address:
 *                 type: string
 *               medicalHistory:
 *                 type: string
 *     responses:
 *       200:
 *         description: Patient updated successfully
 *       400:
 *         description: Invalid input
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Patient not found
 * @route   PUT /patients/:id
 * @desc    Update a patient
 * @access  Private
 */
router.put('/:id', auth, PatientController.updatePatient);

/**
 * @swagger
 * /patients/{id}:
 *   delete:
 *     summary: Delete a patient
 *     tags: [Patients]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Patient ID
 *     responses:
 *       200:
 *         description: Patient deleted successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin only
 *       404:
 *         description: Patient not found
 * @route   DELETE /patients/:id
 * @desc    Delete a patient
 * @access  Private/Admin
 */
router.delete('/:id', auth, adminAuth, PatientController.deletePatient);

/**
 * @swagger
 * /patients/{id}/medical-records:
 *   get:
 *     summary: Get patient's medical records
 *     tags: [Patients]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Patient ID
 *     responses:
 *       200:
 *         description: Patient's medical records
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Patient not found
 * @route   GET /patients/:id/medical-records
 * @desc    Get patient's medical records
 * @access  Private
 */
router.get('/:id/medical-records', auth, PatientController.getPatientMedicalRecords);

/**
 * @swagger
 * /patients/{id}/consultations:
 *   get:
 *     summary: Get patient's consultations
 *     tags: [Patients]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Patient ID
 *     responses:
 *       200:
 *         description: Patient's consultations
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Patient not found
 * @route   GET /patients/:id/consultations
 * @desc    Get patient's consultations
 * @access  Private
 */
router.get('/:id/consultations', auth, PatientController.getPatientConsultations);

export default router;