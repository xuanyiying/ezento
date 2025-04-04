import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import { UserDocument } from '../interfaces/user.interface';

const userSchema = new mongoose.Schema({
    tenantId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Tenant',
        required: false
    },
    name: {
        type: String,
        required: true
    },
    avatar: {
        type: String,
        default: ''
    },
    phone: {
        type: String,
        required: true,
        sparse: true
    },
    email: {
        type: String,
        sparse: true
    },
    password: {
        type: String,
        select: false
    },
    gender: {
        type: String,
        enum: ['male', 'female', 'other', 'unknown'],
        default: 'unknown'
    },
    birthDate: {
        type: Date
    },
    role: {
        type: String,
        enum: ['admin', 'doctor', 'user'],
        default: 'user'
    },
    openId: {
        type: String,
        sparse: true
    },
    unionId: {
        type: String,
        unique: true,
        sparse: true
    },
    sessionKey: {
        type: String,
        select: false
    },
    lastLoginAt: {
        type: Date
    },
    isActive: {
        type: Boolean,
        default: true
    },
    isWechatUser: {
        type: Boolean,
        default: false
    },
    healthInfo: {
        height: Number,
        weight: Number,
        bloodType: String
    },
    medicalCardId: {
        type: String
    }
}, {
    timestamps: true
});

// Create compound indexes
userSchema.index({ tenantId: 1, openId: 1 }, { unique: true });
userSchema.index({ tenantId: 1, phone: 1 }, { unique: true });
userSchema.index({ tenantId: 1, username: 1 }, { unique: true, sparse: true });

// Create single field indexes
userSchema.index({ name: 1 });
userSchema.index({ phone: 1 }, { sparse: true, unique: true });
userSchema.index({ email: 1 }, { sparse: true, unique: true });
userSchema.index({ openId: 1 }, { sparse: true, unique: true });
userSchema.index({ role: 1 });
userSchema.index({ isActive: 1 });

// Hash password before saving
userSchema.pre<UserDocument>('save', async function(next) {
    if (this.isModified('password') && this.password) {
        try {
            const salt = await bcrypt.genSalt(10);
            this.password = await bcrypt.hash(this.password, salt);
            next();
        } catch (error: any) {
            next(error);
        }
    } else {
        next();
    }
});

// Method to compare password
userSchema.methods.comparePassword = async function(password: string): Promise<boolean> {
    if (!this.password) return false;
    return bcrypt.compare(password, this.password);
};

const User = mongoose.model<UserDocument>('User', userSchema);

export default User; 