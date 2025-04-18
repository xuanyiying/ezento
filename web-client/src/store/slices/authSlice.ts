import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { User } from '@/types';
import { setUser, setToken } from '..';

interface AuthState {
    isAuthenticated: boolean;
    user: User | null;
    loading: boolean;
    error: string | null;
}

// 从localStorage检查是否有token来初始化认证状态
const getInitialAuthState = (): AuthState => {
    const token = localStorage.getItem('token');
    const userJson = localStorage.getItem('user');
    const user = userJson ? JSON.parse(userJson) : null;

    return {
        isAuthenticated: !!token, // 如果存在token，则认为已认证
        user,
        error: null,
        loading: false,
    };
};

const initialState: AuthState = getInitialAuthState();

const authSlice = createSlice({
    name: 'auth',
    initialState,
    reducers: {
        loginStart: state => {
            state.loading = true;
            state.error = null;
        },
        loginSuccess: (
            state,
            action: PayloadAction<{
                userId: string;
                token: string;
                role: string | '';
                name?: string;
                user?: string;
                avatar: string | undefined;
                phone: string | undefined;
                gender: string | undefined;
                birthDate: string | undefined;
            }>
        ) => {
            state.isAuthenticated = true;
            state.user = {
                userId: action.payload.userId,
                role: action.payload.role,
                name: action.payload.name,
                avatar: action.payload.avatar,
                phone: action.payload.phone,
                gender: action.payload.gender,
                birthDate: action.payload.birthDate,
            };
            state.loading = false;
            state.error = null;

            // 确保用户数据被正确存储到localStorage
            localStorage.setItem('user', JSON.stringify(state.user));
            setUser(state.user);
            setToken(action.payload.token);
        },
        loginFailure: (state, action: PayloadAction<string>) => {
            state.loading = false;
            state.error = action.payload;
        },
        logout: state => {
            state.isAuthenticated = false;
            state.user = null;
            state.error = null;
            // 清除localStorage中的token和user
            localStorage.removeItem('token');
            localStorage.removeItem('user');
        },
    },
});

export const { loginStart, loginSuccess, loginFailure, logout } = authSlice.actions;
export default authSlice.reducer;
