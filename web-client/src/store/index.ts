import { configureStore } from '@reduxjs/toolkit';
import conversationReducer from './slices/conversationSlice';
import authReducer from './slices/authSlice';
import { createSlice } from '@reduxjs/toolkit';
import { User } from '@/types';

// 从localStorage获取用户信息
const getUser = (): User | null => {
  try {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      return JSON.parse(storedUser);
    }
  } catch (error) {
    console.error('Failed to parse user from localStorage:', error);
  }
  return null;
};

interface UserState {
  user: User | null;
}

const userSlice = createSlice({
  name: 'user',
  initialState: {
    user: getUser()
  } as UserState,
  reducers: {
    setUser: (state, action) => {
      const userData = action.payload;
      state.user = userData;
      // 保存到localStorage
      console.log('Saving user to localStorage:', JSON.stringify(userData));
      localStorage.setItem('user', JSON.stringify(userData));
    },
    clearUser: () => {
      localStorage.removeItem('user');
    }
  }
});

export const { setUser, clearUser } = userSlice.actions;

export const store = configureStore({
  reducer: {
    conversation: conversationReducer,
    authUser: userSlice.reducer,
    auth: authReducer
  }
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;