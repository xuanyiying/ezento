// 导入所需的mongoose模块和相关接口
import mongoose, { Document, Schema } from 'mongoose';
import { IConsultation } from './Consultation';
import { UserDocument } from '../interfaces/user.interface';

// 消息接口定义
export interface IMessage extends Document {
    consultationId: IConsultation['_id'] | IConsultation;  // 关联的问诊ID
    senderId: UserDocument['_id'] | string;               // 发送者ID
    senderType: 'patient' | 'doctor' | 'ai';             // 发送者类型：患者/医生/AI
    content: string;                                     // 消息内容
    messageType: 'text' | 'image' | 'audio' | 'video';   // 消息类型：文本/图片/音频/视频
    createdAt: Date;                                     // 创建时间
    updatedAt: Date;                                     // 更新时间
}

// 消息Schema定义
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
        enum: ['patient', 'ai'],
        required: true
    },
    content: {
        type: String,
        required: true
    },
    messageType: {
        type: String,
        enum: ['text', 'image', 'pdf'],
        default: 'text'
    }
}, { timestamps: true });

// 创建索引以提高查询性能
// 按问诊ID和创建时间联合索引，用于按时间顺序获取特定问诊的消息记录
MessageSchema.index({ consultationId: 1, createdAt: 1 });
// 按发送者ID和类型联合索引，用于快速查询特定类型用户的消息记录
MessageSchema.index({ senderId: 1, senderType: 1 });

export const Message = mongoose.model<IMessage>('Message', MessageSchema);