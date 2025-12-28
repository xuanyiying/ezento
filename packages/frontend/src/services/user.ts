import { get, put } from '@/utils/http';
import { API_BASE_URL } from '@/config';

interface UpdateUserProfileParams {
  userId?: string;
  name?: string;
  phone?: string;
  gender?: string;
}

interface ChangePasswordParams {
  userId?: string;
  oldPassword: string;
  newPassword: string;
}

export const UserAPI = {
  updateUserProfile: async (params: UpdateUserProfileParams) => {
    return put(`/users/${params.userId}/profile`, {
      name: params.name,
      phone: params.phone,
      gender: params.gender
    });
  },

  changePassword: async (params: ChangePasswordParams) => {
    return put(`/users/${params.userId}/password`, {
      oldPassword: params.oldPassword,
      newPassword: params.newPassword
    });
  },

  getUserProfile: async (userId: string) => {
    return get(`/users/${userId}/profile`);
  }
}; 