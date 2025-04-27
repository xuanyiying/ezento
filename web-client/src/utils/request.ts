import axios from 'axios';
import { message } from 'antd';
import { TokenManager } from './tokenManager';

// 创建axios实例
const instance = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 请求拦截器
instance.interceptors.request.use(
  (config) => {
    // 从TokenManager获取token
    const token = TokenManager.getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    console.error('请求错误:', error);
    return Promise.reject(error);
  }
);

// 响应拦截器
instance.interceptors.response.use(
  (response) => {
    const { data } = response;
    // 如果是文件下载等二进制数据，直接返回
    if (response.config.responseType === 'blob' || response.config.responseType === 'arraybuffer') {
      return response;
    }
    
    // 根据后端接口规范，处理统一的响应数据结构
    if (data.code === 0) {
      return data.data;
    }
    
    // 处理业务错误
    message.error(data.message || '操作失败');
    return Promise.reject(new Error(data.message || '操作失败'));
  },
  (error) => {
    if (error.response) {
      const { status, data } = error.response;
      
      // 处理特定状态码
      switch (status) {
        case 401:
          // 未授权，清除token并重定向到登录页
          message.error('登录已过期，请重新登录');
          TokenManager.removeTokens();
          setTimeout(() => {
            window.location.href = '/login';
          }, 1000);
          break;
        case 403:
          message.error('没有权限访问此资源');
          break;
        case 404:
          message.error('请求的资源不存在');
          break;
        case 500:
          message.error('服务器错误，请稍后再试');
          break;
        default:
          message.error(data.message || `请求失败: ${status}`);
      }
    } else if (error.request) {
      // 请求发送但没有收到响应
      message.error('网络错误，请检查您的网络连接');
    } else {
      // 请求设置时出错
      message.error(`请求错误: ${error.message}`);
    }
    
    return Promise.reject(error);
  }
);

// 封装常用请求方法
const request = {
  get: (url: string, params?: any) => instance.get(url, { params }),
  post: (url: string, data?: any) => instance.post(url, data),
  put: (url: string, data?: any) => instance.put(url, data),
  delete: (url: string) => instance.delete(url),
  upload: (url: string, file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return instance.post(url, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },
};

export default request; 