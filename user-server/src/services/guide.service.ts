import logger from '../config/logger';
import { Department, Doctor } from '../models';
import mongoose from 'mongoose';

// Define interfaces for populated fields
interface PopulatedUser {
    _id: mongoose.Types.ObjectId;
    name: string;
    avatar: string;
    gender?: string;
}

interface PopulatedDepartment {
    _id: mongoose.Types.ObjectId;
    name: string;
}

// Extended Doctor interface with populated fields
interface PopulatedDoctor {
    _id: mongoose.Types.ObjectId;
    userId: PopulatedUser;
    departmentId: PopulatedDepartment;
    title: string;
    specialties: string[];
    introduction?: string;
    rating: number;
    consultationCount: number;
    goodReviewRate?: number;
    availableTimes?: any[];
}

class GuideService {
    /**
     * Get all departments
     */
    static async getDepartments() {
        try {
            const departments = await Department.find().exec();
            return departments.map(dept => ({
                id: dept._id,
                name: dept.name,
                description: dept.description
            }));
        } catch (error) {
            logger.error(`Error in getDepartments: ${error}`);
            throw error;
        }
    }

    /**
     * Get recommended departments and doctors based on symptoms
     */
    static async getRecommendationsBySymptoms(symptoms: string) {
        try {
            // This is a simplified implementation
            // In a real application, you would use NLP or a medical knowledge base
            // to match symptoms with departments and doctors
            
            // For now, we'll return all departments and top-rated doctors
            const departments = await Department.find().exec();
            const doctors = await Doctor.find()
                .populate('userId', 'name avatar')
                .populate('departmentId', 'name')
                .sort({ rating: -1, consultationCount: -1 })
                .limit(5)
                .exec() as unknown as PopulatedDoctor[];
            
            return {
                departments: departments.map(dept => ({
                    id: dept._id,
                    name: dept.name,
                    description: dept.description,
                    relevanceScore: Math.random() // Placeholder for relevance score
                })),
                doctors: doctors.map(doc => ({
                    doctorId: doc._id,
                    name: doc.userId.name,
                    department: doc.departmentId.name,
                    title: doc.title,
                    specialties: doc.specialties,
                    avatar: doc.userId.avatar,
                    rating: doc.rating,
                    relevanceScore: Math.random() // Placeholder for relevance score
                }))
            };
        } catch (error) {
            logger.error(`Error in getRecommendationsBySymptoms: ${error}`);
            throw error;
        }
    }

    /**
     * Get recommended doctors based on symptoms and department
     */
    static async getRecommendedDoctors(symptoms: string, departmentId?: string) {
        try {
            let query: any = {};
            
            if (departmentId) {
                query.departmentId = departmentId;
            }

            const doctors = await Doctor.find(query)
                .populate('userId', 'name avatar')
                .populate('departmentId', 'name')
                .sort({ rating: -1, consultationCount: -1 })
                .limit(10)
                .exec() as unknown as PopulatedDoctor[];

            return doctors.map(doc => ({
                doctorId: doc._id,
                name: doc.userId.name,
                department: doc.departmentId.name,
                title: doc.title,
                specialties: doc.specialties,
                avatar: doc.userId.avatar,
                rating: doc.rating
            }));
        } catch (error) {
            logger.error(`Error in getRecommendedDoctors: ${error}`);
            throw error;
        }
    }

    /**
     * Get doctor details
     */
    static async getDoctorDetails(id: string) {
        try {
            const doctor = await Doctor.findById(id)
                .populate('userId', 'name avatar gender')
                .populate('departmentId', 'name')
                .exec() as unknown as PopulatedDoctor | null;

            if (!doctor) {
                return null;
            }

            return {
                doctorId: doctor._id,
                name: doctor.userId.name,
                avatar: doctor.userId.avatar,
                gender: doctor.userId.gender,
                department: doctor.departmentId.name,
                title: doctor.title,
                specialties: doctor.specialties,
                introduction: doctor.introduction,
                rating: doctor.rating,
                consultationCount: doctor.consultationCount,
                goodReviewRate: doctor.goodReviewRate,
                availableTimes: doctor.availableTimes
            };
        } catch (error) {
            logger.error(`Error in getDoctorDetails: ${error}`);
            throw error;
        }
    }
}

export default GuideService; 