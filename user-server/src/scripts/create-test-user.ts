import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import User from '../models/User';
import bcrypt from 'bcrypt';
import logger from '../config/logger';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const createTestUser = async () => {
    try {
        // Connect to MongoDB
        const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/ezento-test';
        await mongoose.connect(MONGO_URI);
        console.log('Connected to MongoDB');

        const testUserId = '000000000000000000000001';

        // Check if user already exists
        const existingUser = await User.findById(testUserId);
        if (existingUser) {
            console.log('Test user already exists:', existingUser);
            return;
        }

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash('password123', salt);

        // Create a test user with the specific ObjectID to match our token
        const testUser = new User({
            _id: new mongoose.Types.ObjectId(testUserId),
            username: 'testuser',
            password: hashedPassword,
            email: 'test@example.com',
            role: 'PATIENT',
            profile: {
                firstName: 'Test',
                lastName: 'User',
                phoneNumber: '1234567890',
                dateOfBirth: new Date('1990-01-01'),
                gender: 'MALE',
            },
        });

        await testUser.save();
        console.log('Test user created successfully:', testUser);
    } catch (error) {
        console.error('Error creating test user:', error);
    } finally {
        await mongoose.disconnect();
        console.log('Disconnected from MongoDB');
    }
};

createTestUser();
