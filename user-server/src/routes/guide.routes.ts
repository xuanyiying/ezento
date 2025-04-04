import express from 'express';
import  GuideController  from '../controllers/guide.controller';
import { auth } from '../middlewares';

const router = express.Router();

/**
 * @swagger
 * /api/guide/departments:
 *   get:
 *     summary: Get all departments
 *     tags: [Guide]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of departments
 */
router.get('/departments', auth, GuideController.getDepartments);

/**
 * @swagger
 * /api/guide/recommendations:
 *   post:
 *     summary: Get recommended departments and doctors based on symptoms
 *     tags: [Guide]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - symptoms
 *             properties:
 *               symptoms:
 *                 type: string
 *                 description: Patient symptoms
 *     responses:
 *       200:
 *         description: Recommended departments and doctors
 */
router.post('/recommendations', auth, GuideController.getRecommendationsBySymptoms);

/**
 * @swagger
 * /api/guide/recommend-doctors:
 *   post:
 *     summary: Get recommended doctors based on symptoms and department
 *     tags: [Guide]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - symptoms
 *             properties:
 *               symptoms:
 *                 type: string
 *                 description: Patient symptoms
 *               departmentId:
 *                 type: string
 *                 description: Optional department ID to filter doctors
 *     responses:
 *       200:
 *         description: List of recommended doctors
 */
router.post('/recommend-doctors', auth, GuideController.getRecommendedDoctors);

/**
 * @swagger
 * /api/guide/doctor/{id}:
 *   get:
 *     summary: Get doctor details by ID
 *     tags: [Guide]
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
 *         description: Doctor details
 *       404:
 *         description: Doctor not found
 */
router.get('/doctor/:id', auth, GuideController.getDoctorDetails);

export default router; 