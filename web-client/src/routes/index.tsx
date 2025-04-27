import React, { useEffect } from 'react';
import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { RootState } from '@/store';
import ProfilePage from '@/pages/ProfilePage/ProfilePage';
import GuidePage from '@/pages/GuidePage/GuidePage';
import ReportsPage from '@/pages/ReportsPage/ReportsPage';
import ChatPage from '@/pages/ChatPage/ChatPage';
import { TokenManager } from '@/utils/tokenManager';
import { App } from 'antd';
import LoginPage from '@/pages/LoginPage';
import RegisterPage from '@/pages/RegisterPage';

interface PrivateRouteProps {
    children: React.ReactNode;
}

// 增强版的私有路由组件，包括验证token的有效性
const PrivateRoute: React.FC<PrivateRouteProps> = ({ children }) => {
    const { isAuthenticated } = useSelector((state: RootState) => state.auth);
    const { message } = App.useApp();
    const navigate = useNavigate();

    // 验证token是否有效
    useEffect(() => {
        const validateToken = async () => {
            try {
                if (isAuthenticated) {
                    // 验证token是否有效
                    if (TokenManager.getToken()) {
                        try {
                            TokenManager.validateToken();
                        } catch (error) {
                            console.error('Token验证失败:', error);
                            message.error('登录已过期，请重新登录');
                            // 清除无效token
                            TokenManager.removeTokens();
                            navigate('/login', { replace: true });
                        }
                    }
                }
            } catch (error) {
                console.error('验证token出错:', error);
            }
        };

        validateToken();
    }, [isAuthenticated, navigate, message]);

    if (!isAuthenticated) {
        // 未登录时重定向到登录页面
        message.error('请先登录后再访问该页面');
        return <Navigate to="/login" replace />;
    }

    return <>{children}</>;
};

// 路由守卫组件，拦截所有路由访问
const AuthGuard: React.FC = () => {
    const { isAuthenticated } = useSelector((state: RootState) => state.auth);
    const location = useLocation();
    
    // 如果访问/login或/register页面，直接显示对应页面
    if (location.pathname === '/login' || location.pathname === '/register') {
        return (
            <Routes>
                <Route path="/login" element={<LoginPage />} />
                <Route path="/register" element={<RegisterPage />} />
                <Route path="*" element={<Navigate to="/login" replace />} />
            </Routes>
        );
    }
    
    // 如果没有认证，重定向到登录页
    if (!isAuthenticated) {
        return <Navigate to="/login" replace />;
    }
    
    // 如果已认证，显示所有路由
    return (
        <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route
                path="/"
                element={
                    <PrivateRoute>
                        <ChatPage />
                    </PrivateRoute>
                }
            />
            <Route
                path="/chat"
                element={
                    <PrivateRoute>
                        <ChatPage />
                    </PrivateRoute>
                }
            />
            <Route
                path="/guide"
                element={
                    <PrivateRoute>
                        <GuidePage />
                    </PrivateRoute>
                }
            />
            <Route
                path="/reports"
                element={
                    <PrivateRoute>
                        <ReportsPage />
                    </PrivateRoute>
                }
            />
            <Route
                path="/profile"
                element={
                    <PrivateRoute>
                        <ProfilePage />
                    </PrivateRoute>
                }
            />
            <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
    );
};

const AppRoutes: React.FC = () => {
    return <AuthGuard />;
};

export default AppRoutes;
