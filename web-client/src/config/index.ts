// API基础URL配置
export const API_BASE_URL = '/api';

// 其他全局配置
export const APP_CONFIG = {
  // 应用名称
  appName: '医疗助手',
  
  // API请求超时时间（毫秒）
  apiTimeout: 30000,
  
  // 默认分页大小
  defaultPageSize: 10,
  
  // 上传文件限制（MB）
  maxUploadSize: 5,
  
  // 允许的图片类型
  allowedImageTypes: ['image/jpeg', 'image/png', 'image/gif'],
  
  // 允许的文档类型
  allowedDocTypes: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
}; 