import { createSlice, PayloadAction, createAsyncThunk } from '@reduxjs/toolkit';
import { User } from '@/types';
import { setUser, setToken } from '..';
import { TokenManager } from '@/utils/tokenManager';
import { AuthAPI } from '@/services/auth';

interface AuthState {
    isAuthenticated: boolean;
    user: User | null;
    loading: boolean;
    error: string | null;
    tokenChecked: boolean; // 添加标记表示已检查过token状态
}

// 从localStorage检查是否有token来初始化认证状态
const getInitialAuthState = (): AuthState => {
    const token = localStorage.getItem('token');
    const userJson = localStorage.getItem('user');
    const user = userJson ? JSON.parse(userJson) : null;

    // 默认根据token存在判断认证状态，但后续会进行进一步验证
    return {
        isAuthenticated: !!token,
        user,
        error: null,
        loading: false,
        tokenChecked: false,
    };
};

const initialState: AuthState = getInitialAuthState();

// 验证当前token状态的异步action
export const validateToken = createAsyncThunk(
    'auth/validateToken',
    async (_, { dispatch, rejectWithValue }) => {
        try {
            // 检查是否有token
            const token = TokenManager.getToken();
            if (!token) {
                return rejectWithValue('没有找到令牌');
            }

            // 验证token是否有效
            try {
                TokenManager.validateToken();
                return true;
            } catch (error: any) {
                // 如果token已过期，尝试刷新
                if (error.message === 'Token expired') {
                    const refreshToken = TokenManager.getRefreshToken();
                    if (refreshToken) {
                        try {
                            // 调用刷新token的API
                            const result = await AuthAPI.refreshToken(refreshToken);
                            if (result.token && result.refreshToken) {
                                // 更新token
                                TokenManager.setTokens(result.token, result.refreshToken);
                                return true;
                            }
                        } catch (refreshError) {
                            console.error('刷新令牌失败:', refreshError);
                            // 刷新失败，清除所有token并登出
                            TokenManager.removeTokens();
                            dispatch(logout());
                            return rejectWithValue('令牌已过期且无法刷新');
                        }
                    }
                }
                
                // 其他token验证错误，清除token并登出
                TokenManager.removeTokens();
                dispatch(logout());
                return rejectWithValue('令牌验证失败');
            }
        } catch (error: any) {
            console.error('验证令牌时发生错误:', error);
            // 发生错误时，为安全起见，清除token并登出
            TokenManager.removeTokens();
            dispatch(logout());
            return rejectWithValue(error.message || '验证令牌失败');
        }
    }
);

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
                refreshToken: string; // 添加刷新令牌
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
            state.tokenChecked = true;

            // 存储token和用户信息
            localStorage.setItem('user', JSON.stringify(state.user));
            setUser(state.user);
            TokenManager.setTokens(action.payload.token, action.payload.refreshToken);
            setToken(action.payload.token);
        },
        loginFailure: (state, action: PayloadAction<string>) => {
            state.loading = false;
            state.error = action.payload;
            state.isAuthenticated = false;
            state.tokenChecked = true;
        },
        logout: state => {
            state.isAuthenticated = false;
            state.user = null;
            state.error = null;
            state.tokenChecked = true;
            // 清除localStorage中的token和user
            TokenManager.removeTokens();
        },
        // 设置token检查状态
        setTokenChecked: (state, action: PayloadAction<boolean>) => {
            state.tokenChecked = action.payload;
        }
    },
    extraReducers: (builder) => {
        builder
            .addCase(validateToken.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(validateToken.fulfilled, (state) => {
                state.loading = false;
                state.isAuthenticated = true;
                state.tokenChecked = true;
            })
            .addCase(validateToken.rejected, (state, action) => {
                state.loading = false;
                state.isAuthenticated = false;
                state.error = action.payload as string;
                state.tokenChecked = true;
            });
    }
});

export const { loginStart, loginSuccess, loginFailure, logout, setTokenChecked } = authSlice.actions;
export default authSlice.reducer;
