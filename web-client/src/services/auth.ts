import { User } from '@/types';
import { get, post } from '@/utils/http';

export interface LoginCredentials {
  username: string;
  password: string;
}


export interface LoginResponse {
  user: User;
  token: string;
  isNewUser: boolean;
}

export const AuthAPI = {
  login: async (credentials: LoginCredentials): Promise<LoginResponse> => {
    try {
      const response = await post<any>('/auth/login', credentials);
      return response.data;
    } catch (error) {
      throw error; // 错误已经被http工具处理
    }
  },

  logout: async (): Promise<void> => {
    try {
      await post<void>('/auth/logout');
    } catch (error) {
      throw error; // 错误已经被http工具处理
    }
  },


  getUserInfo: async (): Promise<any> => {
    try {
      return await get<any>('/auth/user-info');
    } catch (error) {
      throw error; // 错误已经被http工具处理
    }
  },

  setAuthToken: (token: string): void => {
    localStorage.setItem('token', token);
  },

  getAuthToken: (): string | null => {
    return localStorage.getItem('token');
  },
  removeAuthToken: (): void => {
    localStorage.removeItem('token');
  }
};