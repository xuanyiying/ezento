import mongoose, { Document, Schema } from 'mongoose';
import { IConsultation } from './Consultation';
import { IUser } from './User';

export interface IMessage extends Document {
    consultationId: IConsultation['_id'] | IConsultation;
    senderId: IUser['_id'] | string;
    senderType: 'patient' | 'doctor' | 'ai';
    content: string;
    messageType: 'text' | 'image' | 'audio' | 'video';
    createdAt: Date;
    updatedAt: Date;
}

const MessageSchema: Schema = new Schema({
    consultationId: {
        type: Schema.Types.ObjectId,
        ref: 'Consultation',
        required: true
    },
    senderId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    senderType: {
        type: String,
        enum: ['patient', 'doctor', 'ai'],
        required: true
    },
    content: {
        type: String,
        required: true
    },
    messageType: {
        type: String,
        enum: ['text', 'image', 'audio', 'video'],
        default: 'text'
    }
}, { timestamps: true });

// Create indexes for faster queries
MessageSchema.index({ consultationId: 1, createdAt: 1 });
MessageSchema.index({ senderId: 1, senderType: 1 });

export const Message = mongoose.model<IMessage>('Message', MessageSchema); 