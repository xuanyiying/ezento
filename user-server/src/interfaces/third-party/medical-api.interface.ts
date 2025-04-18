/**
 * 第三方医疗API接口定义
 */

/**
 * 科室接口
 */
export interface ThirdPartyDepartment {
    departmentId: string; // 科室ID
    name: string; // 科室名称
    description: string; // 科室描述
    iconUrl: string; // 科室图标URL
    parentId?: string; // 父科室ID，可选，用于表示科室层级
    order?: number; // 科室排序，可选
    status: 'active' | 'inactive'; // 科室状态
    createdAt: string; // 创建时间
    updatedAt: string; // 更新时间
}

/**
 * 医生接口
 */
export interface ThirdPartyDoctor {
    doctorId: string; // 医生ID
    name: string; // 医生姓名
    departmentId: string; // 所属科室ID
    title: string; // 职称
    specialties: string; // 专长
    introduction: string; // 简介
    avatar: string; // 头像URL
    consultationFee: number; // 咨询费用
    rating: number; // 评分
    consultationCount: number; // 咨询次数
    goodReviewRate: number; // 好评率
    status: 'active' | 'inactive'; // 医生状态
    availableTimes?: Array<{
        // 可预约时间段
        date: string; // 日期
        timeSlots: string[]; // 时间段列表
    }>;
    createdAt: string; // 创建时间
    updatedAt: string; // 更新时间
}

/**
 * 科室列表查询参数
 */
export interface DepartmentQueryParams {
    status?: 'active' | 'inactive'; // 科室状态
    parentId?: string; // 父科室ID
    keyword?: string; // 关键词搜索
    page?: number; // 页码
    limit?: number; // 每页数量
}

/**
 * 医生列表查询参数
 */
export interface DoctorQueryParams {
    departmentId?: string; // 科室ID
    status?: 'active' | 'inactive'; // 医生状态
    keyword?: string; // 关键词搜索
    minRating?: number; // 最低评分
    sortBy?: string; // 排序字段
    sortOrder?: 'asc' | 'desc'; // 排序方式
    page?: number; // 页码
    limit?: number; // 每页数量
}

/**
 * 科室列表响应
 */
export interface DepartmentListResponse {
    total: number; // 总数
    page: number; // 当前页码
    limit: number; // 每页数量
    departments: ThirdPartyDepartment[]; // 科室列表
}

/**
 * 医生列表响应
 */
export interface DoctorListResponse {
    total: number; // 总数
    page: number; // 当前页码
    limit: number; // 每页数量
    doctors: ThirdPartyDoctor[]; // 医生列表
}

/**
 * API错误响应
 */
export interface ApiErrorResponse {
    code: string; // 错误代码
    message: string; // 错误信息
    details?: string; // 详细信息
}

/**
 * API返回格式
 */
export interface ApiResponse<T> {
    success: boolean; // 是否成功
    data?: T; // 数据
    error?: ApiErrorResponse; // 错误信息
}
