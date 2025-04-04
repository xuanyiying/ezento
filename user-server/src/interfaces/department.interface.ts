import mongoose from 'mongoose';
import { Document, Model, Types } from 'mongoose';

/**
 * 科室状态类型
 */
export type DepartmentStatus = 'active' | 'inactive';

export interface DepartmentBase {
    name: string;
    description: string;
    iconUrl?: string;
    thirdPartyId?: string;
    status: 'active' | 'inactive';
    parentId?: Types.ObjectId;
    order?: number;
    createdAt: Date;
    updatedAt: Date;
}

/**
 * 科室文档接口
 * 描述MongoDB中的科室文档结构
 */
export interface DepartmentDocument extends Document<Types.ObjectId, {}, DepartmentBase> {
    _id: Types.ObjectId;
}

export interface DepartmentModel extends Model<DepartmentDocument> {
    // Custom methods can be added here if needed
}

/**
 * 科室创建数据接口
 * 创建科室记录时需要提供的数据
 */
export type DepartmentCreateData = Omit<DepartmentBase, 'createdAt' | 'updatedAt'>;

/**
 * 科室更新数据接口
 * 更新科室记录时需要提供的数据，所有字段均为可选
 */
export type DepartmentUpdateData = Partial<DepartmentCreateData>; 