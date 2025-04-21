import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { User } from '@/types';
import { UserAPI } from '@/services/user';

interface UserState {
  user: User | null;
  loading: boolean;
  error: string | null;
  success: boolean;
}

const initialState: UserState = {
  user: null,
  loading: false,
  error: null,
  success: false
};

// 修改密码的异步 action
export const changePassword = createAsyncThunk(
  'user/changePassword',
  async (params: { oldPassword: string; newPassword: string }, { getState, rejectWithValue }) => {
    try {
      const state: any = getState();
      const userId = state.auth.user?.userId;
      
      if (!userId) {
        return rejectWithValue('用户未登录');
      }
      
      await UserAPI.changePassword({
        userId,
        oldPassword: params.oldPassword,
        newPassword: params.newPassword
      });
      
      return true;
    } catch (error: any) {
      return rejectWithValue(error.message || '修改密码失败');
    }
  }
);

// 更新用户资料的异步 action
export const updateUserProfile = createAsyncThunk(
  'user/updateProfile',
  async (params: { 
    name?: string; 
    phone?: string; 
    gender?: string;
    age?: number;
    idCardNumber?: string;
    avatar?: string;
  }, { getState, rejectWithValue }) => {
    try {
      const state: any = getState();
      const userId = state.auth.user?.userId;
      
      if (!userId) {
        return rejectWithValue('用户未登录');
      }
      
      const response = await UserAPI.updateUserProfile({
        userId,
        ...params
      });
      
      return response;
    } catch (error: any) {
      return rejectWithValue(error.message || '更新个人资料失败');
    }
  }
);

const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {
    clearUserState: (state) => {
      state.loading = false;
      state.error = null;
      state.success = false;
    }
  },
  extraReducers: (builder) => {
    // 处理修改密码的状态
    builder
      .addCase(changePassword.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.success = false;
      })
      .addCase(changePassword.fulfilled, (state) => {
        state.loading = false;
        state.success = true;
      })
      .addCase(changePassword.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      
      // 处理更新用户资料的状态
      .addCase(updateUserProfile.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.success = false;
      })
      .addCase(updateUserProfile.fulfilled, (state, action) => {
        state.loading = false;
        state.success = true;
        // 更新用户信息可以在这里处理，或者在 authSlice 中处理
      })
      .addCase(updateUserProfile.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  }
});

export const { clearUserState } = userSlice.actions;
export default userSlice.reducer; 