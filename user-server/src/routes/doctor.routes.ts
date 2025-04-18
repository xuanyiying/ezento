import express from 'express';
import { DoctorController } from '../controllers';
import { auth, adminAuth } from '../middlewares/auth';

/**
 * @swagger
 * tags:
 *   name: Doctors
 *   description: Doctor management APIs
 */

const router = express.Router();

/**
 * @swagger
 * /api/doctors:
 *   get:
 *     summary: Get all doctors
 *     tags: [Doctors]
 *     responses:
 *       200:
 *         description: A list of all doctors
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 * @route   GET /api/doctors
 * @desc    Get all doctors
 * @access  Public
 */
router.get('/', DoctorController.getAllDoctors);

/**
 * @swagger
 * /api/doctors/{id}:
 *   get:
 *     summary: Get doctor by ID
 *     tags: [Doctors]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Doctor ID
 *     responses:
 *       200:
 *         description: Doctor details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *       404:
 *         description: Doctor not found
 * @route   GET /api/doctors/:id
 * @desc    Get doctor by ID
 * @access  Public
 */
router.get('/:id', DoctorController.getDoctorById);

/**
 * @swagger
 * /api/doctors:
 *   post:
 *     summary: Create a new doctor
 *     tags: [Doctors]
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
 *               - department
 *               - qualification
 *               - experience
 *             properties:
 *               name:
 *                 type: string
 *                 description: Doctor's full name
 *               department:
 *                 type: string
 *                 description: Department ID
 *               qualification:
 *                 type: string
 *                 description: Doctor's qualifications
 *               experience:
 *                 type: integer
 *                 description: Years of experience
 *               specialization:
 *                 type: string
 *                 description: Doctor's specialization
 *               bio:
 *                 type: string
 *                 description: Doctor's biography
 *               avatar:
 *                 type: string
 *                 description: URL to doctor's profile image
 *     responses:
 *       201:
 *         description: Doctor created successfully
 *       400:
 *         description: Invalid input
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin only
 * @route   POST /api/doctors
 * @desc    Create a new doctor
 * @access  Private/Admin
 */
router.post('/', auth, adminAuth, DoctorController.createDoctor);

/**
 * @swagger
 * /api/doctors/{id}:
 *   put:
 *     summary: Update a doctor
 *     tags: [Doctors]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Doctor ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               department:
 *                 type: string
 *               qualification:
 *                 type: string
 *               experience:
 *                 type: integer
 *               specialization:
 *                 type: string
 *               bio:
 *                 type: string
 *               avatar:
 *                 type: string
 *     responses:
 *       200:
 *         description: Doctor updated successfully
 *       400:
 *         description: Invalid input
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Doctor not found
 * @route   PUT /api/doctors/:id
 * @desc    Update a doctor
 * @access  Private
 */
router.put('/:id', auth, DoctorController.updateDoctor);

/**
 * @swagger
 * /api/doctors/{id}:
 *   delete:
 *     summary: Delete a doctor
 *     tags: [Doctors]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Doctor ID
 *     responses:
 *       200:
 *         description: Doctor deleted successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin only
 *       404:
 *         description: Doctor not found
 * @route   DELETE /api/doctors/:id
 * @desc    Delete a doctor
 * @access  Private/Admin
 */
router.delete('/:id', auth, adminAuth, DoctorController.deleteDoctor);

/**
 * @swagger
 * /api/doctors/department/{department}:
 *   get:
 *     summary: Get doctors by department
 *     tags: [Doctors]
 *     parameters:
 *       - in: path
 *         name: department
 *         required: true
 *         schema:
 *           type: string
 *         description: Department ID
 *     responses:
 *       200:
 *         description: List of doctors in the department
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *       404:
 *         description: Department not found
 * @route   GET /api/doctors/department/:department
 * @desc    Get doctors by department
 * @access  Public
 */
router.get('/department/:department', DoctorController.getDoctorsByDepartment);

/**
 * @swagger
 * /api/doctors/{id}/toggle-availability:
 *   put:
 *     summary: Toggle a doctor's availability
 *     tags: [Doctors]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Doctor ID
 *     responses:
 *       200:
 *         description: Availability toggled successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Doctor not found
 * @route   PUT /api/doctors/:id/toggle-availability
 * @desc    Toggle a doctor's availability
 * @access  Private
 */
router.put('/:id/toggle-availability', auth, DoctorController.toggleAvailability);

export default router;
