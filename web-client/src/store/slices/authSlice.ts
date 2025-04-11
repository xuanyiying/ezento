import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { User } from '@/types';
import { setUser, setToken } from '..';

interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  loading: boolean;
  error: string | null;
}

const initialState: AuthState = {
  isAuthenticated: false,
  user: null,
  error: null,
  loading: false,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    loginStart: (state) => {
      state.loading = true;
      state.error = null;
    },
    loginSuccess: (state, action: PayloadAction<{
      userId: string ;
      token: string ;
      role: string |'';
      name?: string;
      user?: string;
      avatar: string | undefined;
      phone: string | undefined;
      gender: string | undefined;
      birthDate: string | undefined;
    }>) => {
      state.isAuthenticated = true;
      state.user = {
        userId: action.payload.userId ,
        role: action.payload.role,
        name: action.payload.name,
        avatar: action.payload.avatar,
        phone: action.payload.phone,
        gender: action.payload.gender,
        birthDate: action.payload.birthDate,
      },
      state.loading = false;
      state.error = null;
      setUser(state.user);
      setToken(action.payload.token);
    },
    loginFailure: (state, action: PayloadAction<string>) => {
      state.loading = false;
      state.error = action.payload;
    },
    logout: (state) => {
      state.isAuthenticated = false;
      state.user = null;
      state.error = null;
    }
  }
});

export const { loginStart, loginSuccess, loginFailure, logout } = authSlice.actions;
export default authSlice.reducer;