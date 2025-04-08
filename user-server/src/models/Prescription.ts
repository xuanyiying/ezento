// 导入所需的mongoose模块和类型
import mongoose, { Document, Schema } from 'mongoose';

// 药品信息接口定义
export interface IMedication {
    name: string;            // 药品名称
    specification: string;   // 药品规格
    dosage: string;         // 用药剂量
    frequency: string;      // 用药频率
    route: string;          // 给药途径
    duration: string;       // 用药时长
    quantity: number;       // 药品数量
    notes?: string;         // 用药备注（可选）
}

// 处方单接口定义
export interface IPrescription extends Document {
    patientId: mongoose.Types.ObjectId;    // 患者ID
    doctorId: mongoose.Types.ObjectId;     // 医生ID
    recordId?: mongoose.Types.ObjectId;    // 关联的病历记录ID（可选）
    diagnosis: string;                     // 诊断结果
    medications: IMedication[];            // 开具的药品列表
    notes?: string;                        // 处方备注（可选）
    instructions?: string;                 // 用药说明（可选）
    followUp?: string;                     // 随访建议（可选）
    status: 'DRAFT' | 'ISSUED' | 'FILLED'; // 处方状态：草稿/已开具/已配药
    createdAt: Date;                       // 创建时间
    updatedAt: Date;                       // 更新时间
}

// 药品信息Schema定义
const MedicationSchema: Schema = new Schema({
    name: {
        type: String,
        required: true
    },
    specification: {
        type: String,
        required: true,
        trim: true
    },
    dosage: {
        type: String,
        required: true
    },
    frequency: {
        type: String,
        required: true
    },
    route: {
        type: String,
        required: true,
        trim: true
    },
    duration: {
        type: String,
        required: true
    },
    quantity: {
        type: Number,
        required: true,
        min: 1
    },
    notes: {
        type: String
    }
});

// 处方单Schema定义
const PrescriptionSchema: Schema = new Schema(
    {
        patientId: {
            type: Schema.Types.ObjectId,
            ref: 'Patient',
            required: true
        },
        doctorId: {
            type: Schema.Types.ObjectId,
            ref: 'Doctor',
            required: true
        },
        recordId: {
            type: Schema.Types.ObjectId,
            ref: 'MedicalRecord'
        },
        diagnosis: {
            type: String,
            required: true
        },
        medications: [MedicationSchema],
        notes: {
            type: String
        },
        instructions: {
            type: String
        },
        followUp: {
            type: String
        },
        status: {
            type: String,
            enum: ['DRAFT', 'ISSUED', 'FILLED'],
            default: 'DRAFT'
        }
    },
    { timestamps: true }
);

// 创建索引以提高查询性能
// 按患者ID索引，用于快速查询患者的处方记录
PrescriptionSchema.index({ patientId: 1 });
// 按医生ID索引，用于快速查询医生开具的处方
PrescriptionSchema.index({ doctorId: 1 });
// 按处方状态索引，用于快速筛选不同状态的处方
PrescriptionSchema.index({ status: 1 });
// 按创建时间降序索引，用于按时间顺序查询处方
PrescriptionSchema.index({ createdAt: -1 });

export default mongoose.model<IPrescription>('Prescription', PrescriptionSchema);