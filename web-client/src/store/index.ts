import { configureStore } from '@reduxjs/toolkit';
import conversationReducer from './slices/conversationSlice';
import authReducer from './slices/authSlice';
import userReducer from './slices/userSlice';
import { createSlice } from '@reduxjs/toolkit';
import { User } from '@/types';
import TokenManager from '@/utils/tokenManager';
import { TOKEN_KEY, USER_KEY } from '@/utils/consts';

// 从localStorage获取用户信息
const getUser = (): User | null => {
    try {
        const storedUser = localStorage.getItem(USER_KEY);
        if (storedUser) {
            return JSON.parse(storedUser);
        }
    } catch (error) {
        console.error('Failed to parse user from localStorage:', error);
    }
    return null;
};

// 从localStorage获取token
const getToken = (): string | null => {
    try {
        return localStorage.getItem(TOKEN_KEY);
    } catch (error) {
        console.error('Failed to get token from localStorage:', error);
    }
    return null;
};

interface UserState {
    user: User | null;
}

interface AuthState {
    token: string | null;
}

const userSlice = createSlice({
    name: 'user',
    initialState: {
        user: getUser(),
    } as UserState,
    reducers: {
        setUser: (state, action) => {
            const userData = action.payload;
            state.user = userData;
            // 保存到localStorage
            console.log('Saving user to localStorage:', JSON.stringify(userData));
            localStorage.setItem(USER_KEY, JSON.stringify(userData));
        },
        clearUser: () => {
            localStorage.removeItem(USER_KEY);
        },
    },
});

const tokenSlice = createSlice({
    name: TOKEN_KEY,
    initialState: {
        token: getToken(),
    } as AuthState,
    reducers: {
        setToken: (state, action) => {
            const token = action.payload;
            state.token = token;
            // 保存到localStorage
            console.log('Saving token to localStorage:', token);
            localStorage.setItem(TOKEN_KEY, token);
        },
        clearToken: () => {
            localStorage.removeItem(TOKEN_KEY);
        },
    },
});

export const { setUser, clearUser } = userSlice.actions;
export const { setToken, clearToken } = tokenSlice.actions;

export const store = configureStore({
    reducer: {
        conversation: conversationReducer,
        auth: authReducer,
        authToken: tokenSlice.reducer,
        user: userReducer,
    },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
