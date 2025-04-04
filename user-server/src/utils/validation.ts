import mongoose from 'mongoose';

/**
 * Validates if a string is a valid MongoDB ObjectId
 * @param id - The string to validate
 * @returns boolean indicating if the id is valid
 */
export const validateObjectId = (id: string): boolean => {
    if (!id || typeof id !== 'string') {
        return false;
    }
    return mongoose.Types.ObjectId.isValid(id);
};

/**
 * Validates email format
 * @param email - The email to validate
 * @returns boolean indicating if the email is valid
 */
export const validateEmail = (email: string): boolean => {
    if (!email || typeof email !== 'string') {
        return false;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
};

/**
 * Validates phone number format
 * @param phone - The phone number to validate
 * @returns boolean indicating if the phone is valid
 */
export const validatePhone = (phone: string): boolean => {
    if (!phone || typeof phone !== 'string') {
        return false;
    }
    // Simple validation for now - can be enhanced based on regional requirements
    const phoneRegex = /^\d{10,15}$/;
    return phoneRegex.test(phone);
};

/**
 * Validates password strength
 * @param password - The password to validate
 * @returns boolean indicating if the password is strong enough
 */
export const validatePassword = (password: string): boolean => {
    if (!password || typeof password !== 'string') {
        return false;
    }
    // At least 8 characters, at least one letter and one number
    const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8,}$/;
    return passwordRegex.test(password);
}; 