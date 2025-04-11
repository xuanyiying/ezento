import axios, { AxiosError, AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import { message } from 'antd';
import { store } from '@/store';
import { logout } from '@/store/slices/authSlice';

// 创建axios实例
const http: AxiosInstance = axios.create({
  baseURL: import.meta.env.DEV ? '/api' : import.meta.env.VITE_API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
});

// 请求拦截器
http.interceptors.request.use(
  (config) => {
    // 从localStorage获取token
    const token = localStorage.getItem('token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 响应拦截器
http.interceptors.response.use(
  (response: AxiosResponse) => {
    // 如果响应中包含新token，更新localStorage
    const newToken = response.headers['x-auth-token'];
    if (newToken) {
      localStorage.setItem('token', newToken);
    }
    
    // 根据后端约定，直接返回data部分
    return response.data;
  },
  (error: AxiosError) => {
    if (error.response) {
      switch (error.response.status) {
        case 401: // 未授权
          message.error('登录已过期，请重新登录');
          // 清除token并跳转到登录页
          store.dispatch(logout());
          localStorage.removeItem('token');
          window.location.href = '/login';
          break;
        case 403: // 禁止访问
          message.error('没有权限访问该资源');
          break;
        case 404: // 资源不存在
          message.error('请求的资源不存在');
          break;
        case 500: // 服务器错误
          message.error('服务器错误，请稍后再试');
          break;
        default:
          // 获取后端返回的错误信息
          const resData = error.response.data as any;
          const errorMsg = resData?.message || '请求失败';
          message.error(errorMsg);
      }
    } else if (error.request) {
      // 请求已发送但没有收到响应
      message.error('网络错误，请检查网络连接');
    } else {
      // 请求配置错误
      message.error('请求配置错误');
    }
    return Promise.reject(error);
  }
);

// 封装GET请求
export const get = <T>(url: string, params?: any, config?: AxiosRequestConfig): Promise<T> => {
  return http.get(url, { params, ...config });
};

// 封装POST请求
export const post = <T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> => {
  return http.post(url, data, config);
};

// 封装PUT请求
export const put = <T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> => {
  return http.put(url, data, config);
};

// 封装DELETE请求
export const del = <T>(url: string, config?: AxiosRequestConfig): Promise<T> => {
  return http.delete(url, config);
};

export default http; 