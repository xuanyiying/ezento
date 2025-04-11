import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { RootState } from '@/store';
import LoginPage from '@/pages/LoginPage/LoginPage';
import MainLayout from '@/layouts/MainLayout/MainLayout';
import ProfilePage from '@/pages/ProfilePage/ProfilePage';
import GuidePage from '@/pages/GuidePage/GuidePage';
import ReportsPage from '@/pages/ReportsPage/ReportsPage';
import ChatPage from '@/pages/ChatPage/ChatPage';
interface PrivateRouteProps {
  children: React.ReactNode;
}

const PrivateRoute: React.FC<PrivateRouteProps> = ({ children }) => {
  const isAuthenticated = useSelector((state: RootState) => state.auth.isAuthenticated);

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

const AppRoutes: React.FC = () => {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route
        path="/"
        element={
          <PrivateRoute>
            <MainLayout />
          </PrivateRoute>
        }
      >
        <Route index element={<ChatPage />} />
        <Route path="/chat" element={<ChatPage />} />
        <Route path="/guide" element={<GuidePage />} />
        <Route path="/reports" element={<ReportsPage />} />
        <Route path="/profile" element={<ProfilePage />} />
      </Route>
    </Routes>
  );
};

export default AppRoutes;