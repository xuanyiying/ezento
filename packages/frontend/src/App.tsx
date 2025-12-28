import React, { useEffect } from 'react';
import { Provider, useDispatch, useSelector } from 'react-redux';
import { store } from './store';
import AppRoutes from './routes';
import { BrowserRouter } from 'react-router-dom';
import { ThemeProvider } from './utils/themeContext';
import { ConfigProvider, App as AntApp } from 'antd';
import zhCN from 'antd/lib/locale/zh_CN';
import { TokenManager } from './utils/tokenManager';
import { logout } from './store/slices/authSlice';
import { RootState } from './store';

// Import global styles
import './styles/global.less';

// 验证登录状态的组件
const AuthChecker: React.FC = () => {
  const dispatch = useDispatch();
  const { isAuthenticated } = useSelector((state: RootState) => state.auth);

  useEffect(() => {
    // 应用启动时检查登录状态
    if (isAuthenticated) {
      try {
        // 验证token是否有效
        if (!TokenManager.getToken() || TokenManager.isTokenExpired(TokenManager.getToken() || '')) {
          console.log('Token无效或已过期，注销用户');
          dispatch(logout());
        }
      } catch (error) {
        console.error('验证token失败:', error);
        dispatch(logout());
      }
    }
  }, [isAuthenticated, dispatch]);

  return <AppRoutes />;
};

// 应用主组件
const AppWithProvider: React.FC = () => {
  return (
    <ConfigProvider locale={zhCN}>
      <ThemeProvider>
        <AntApp>
          <BrowserRouter>
            <AuthChecker />
          </BrowserRouter>
        </AntApp>
      </ThemeProvider>
    </ConfigProvider>
  );
};

const App: React.FC = () => {
  return (
    <Provider store={store}>
      <AppWithProvider />
    </Provider>
  );
};

export default App;
