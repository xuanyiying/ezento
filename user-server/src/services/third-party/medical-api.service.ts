import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';
import logger from '../../config/logger';
import {
    ThirdPartyDepartment,
    ThirdPartyDoctor,
    DepartmentQueryParams,
    DoctorQueryParams,
    DepartmentListResponse,
    DoctorListResponse,
    ApiResponse,
} from '../../interfaces/third-party/medical-api.interface';

/**
 * 第三方医疗API服务
 * 负责与第三方医疗API进行通信，获取科室和医生信息
 */
class MedicalApiService {
    private static instance: MedicalApiService;
    private apiClient: AxiosInstance;
    private apiBaseUrl: string;
    private apiKey: string;

    /**
     * 构造函数私有化，确保单例模式
     */
    private constructor() {
        // 从环境变量中获取API配置
        this.apiBaseUrl = process.env.MEDICAL_API_BASE_URL || 'https://api.medical-platform.com/v1';
        this.apiKey = process.env.MEDICAL_API_KEY || '';

        // 创建Axios实例
        this.apiClient = axios.create({
            baseURL: this.apiBaseUrl,
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${this.apiKey}`,
            },
            timeout: 10000, // 10秒超时
        });

        // 请求拦截器：日志和错误处理
        this.apiClient.interceptors.request.use(
            config => {
                logger.info(`医疗API请求: ${config.method?.toUpperCase()} ${config.url}`);
                return config;
            },
            error => {
                logger.error(`医疗API请求错误: ${error.message}`);
                return Promise.reject(error);
            }
        );

        // 响应拦截器：日志和错误处理
        this.apiClient.interceptors.response.use(
            response => {
                logger.info(`医疗API响应: ${response.status} ${response.config.url}`);
                return response;
            },
            error => {
                logger.error(`医疗API响应错误: ${error.message}`);
                if (error.response) {
                    logger.error(
                        `状态码: ${error.response.status}, 数据: ${JSON.stringify(error.response.data)}`
                    );
                }
                return Promise.reject(error);
            }
        );
    }

    /**
     * 获取服务实例（单例模式）
     */
    public static getInstance(): MedicalApiService {
        if (!MedicalApiService.instance) {
            MedicalApiService.instance = new MedicalApiService();
        }
        return MedicalApiService.instance;
    }

    /**
     * 获取所有科室
     * @param params 查询参数
     * @returns 科室列表
     */
    public async getDepartments(params?: DepartmentQueryParams): Promise<DepartmentListResponse> {
        try {
            const response = await this.apiClient.get<ApiResponse<DepartmentListResponse>>(
                '/departments',
                {
                    params: {
                        status: params?.status || 'active',
                        parentId: params?.parentId,
                        keyword: params?.keyword,
                        page: params?.page || 1,
                        limit: params?.limit || 100,
                    },
                }
            );

            if (!response.data.success || !response.data.data) {
                throw new Error(`获取科室列表失败: ${response.data.error?.message || '未知错误'}`);
            }

            return response.data.data;
        } catch (error: any) {
            logger.error(`获取科室列表错误: ${error.message}`);
            // 返回空数据以防止应用崩溃
            return {
                total: 0,
                page: 1,
                limit: 100,
                departments: [],
            };
        }
    }

    /**
     * 根据ID获取科室详情
     * @param id 科室ID
     * @returns 科室详情
     */
    public async getDepartmentById(id: string): Promise<ThirdPartyDepartment | null> {
        try {
            const response = await this.apiClient.get<ApiResponse<ThirdPartyDepartment>>(
                `/departments/${id}`
            );

            if (!response.data.success || !response.data.data) {
                throw new Error(`获取科室详情失败: ${response.data.error?.message || '未知错误'}`);
            }

            return response.data.data;
        } catch (error: any) {
            logger.error(`获取科室详情错误: ${error.message}`);
            return null;
        }
    }

    /**
     * 获取医生列表
     * @param params 查询参数
     * @returns 医生列表
     */
    public async getDoctors(params?: DoctorQueryParams): Promise<DoctorListResponse> {
        try {
            const response = await this.apiClient.get<ApiResponse<DoctorListResponse>>('/doctors', {
                params: {
                    departmentId: params?.departmentId,
                    status: params?.status || 'active',
                    keyword: params?.keyword,
                    minRating: params?.minRating,
                    sortBy: params?.sortBy,
                    sortOrder: params?.sortOrder,
                    page: params?.page || 1,
                    limit: params?.limit || 100,
                },
            });

            if (!response.data.success || !response.data.data) {
                throw new Error(`获取医生列表失败: ${response.data.error?.message || '未知错误'}`);
            }

            return response.data.data;
        } catch (error: any) {
            logger.error(`获取医生列表错误: ${error.message}`);
            // 返回空数据以防止应用崩溃
            return {
                total: 0,
                page: 1,
                limit: 100,
                doctors: [],
            };
        }
    }

    /**
     * 根据ID获取医生详情
     * @param id 医生ID
     * @returns 医生详情
     */
    public async getDoctorById(id: string): Promise<ThirdPartyDoctor | null> {
        try {
            const response = await this.apiClient.get<ApiResponse<ThirdPartyDoctor>>(
                `/doctors/${id}`
            );

            if (!response.data.success || !response.data.data) {
                throw new Error(`获取医生详情失败: ${response.data.error?.message || '未知错误'}`);
            }

            return response.data.data;
        } catch (error: any) {
            logger.error(`获取医生详情错误: ${error.message}`);
            return null;
        }
    }

    /**
     * 根据科室ID获取医生列表
     * @param departmentId 科室ID
     * @param params 查询参数
     * @returns 医生列表
     */
    public async getDoctorsByDepartment(
        departmentId: string,
        params?: Omit<DoctorQueryParams, 'departmentId'>
    ): Promise<DoctorListResponse> {
        try {
            const response = await this.apiClient.get<ApiResponse<DoctorListResponse>>(
                `/departments/${departmentId}/doctors`,
                {
                    params: {
                        status: params?.status || 'active',
                        keyword: params?.keyword,
                        minRating: params?.minRating,
                        sortBy: params?.sortBy,
                        sortOrder: params?.sortOrder,
                        page: params?.page || 1,
                        limit: params?.limit || 100,
                    },
                }
            );

            if (!response.data.success || !response.data.data) {
                throw new Error(
                    `获取科室医生列表失败: ${response.data.error?.message || '未知错误'}`
                );
            }

            return response.data.data;
        } catch (error: any) {
            logger.error(`获取科室医生列表错误: ${error.message}`);
            // 返回空数据以防止应用崩溃
            return {
                total: 0,
                page: 1,
                limit: 100,
                doctors: [],
            };
        }
    }

    /**
     * 获取医生可预约时间
     * @param doctorId 医生ID
     * @param startDate 开始日期
     * @param endDate 结束日期
     * @returns 可预约时间
     */
    public async getDoctorAvailability(
        doctorId: string,
        startDate: string,
        endDate: string
    ): Promise<Array<{ date: string; timeSlots: string[] }>> {
        try {
            const response = await this.apiClient.get<
                ApiResponse<Array<{ date: string; timeSlots: string[] }>>
            >(`/doctors/${doctorId}/availability`, {
                params: {
                    startDate,
                    endDate,
                },
            });

            if (!response.data.success || !response.data.data) {
                throw new Error(
                    `获取医生可预约时间失败: ${response.data.error?.message || '未知错误'}`
                );
            }

            return response.data.data;
        } catch (error: any) {
            logger.error(`获取医生可预约时间错误: ${error.message}`);
            return [];
        }
    }
}

export default MedicalApiService;
