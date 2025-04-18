import React from 'react';
import { Provider } from 'react-redux';
import { store } from './store';
import AppRoutes from './routes';
import { BrowserRouter } from 'react-router-dom';
import { ThemeProvider } from './utils/themeContext';
import { ConfigProvider, App as AntApp } from 'antd';
import zhCN from 'antd/lib/locale/zh_CN';

// Import global styles
import './styles/global.less';

const App: React.FC = () => {
    return (
        <Provider store={store}>
            <ConfigProvider locale={zhCN}>
                <ThemeProvider>
                    <AntApp>
                        <BrowserRouter>
                            <AppRoutes />
                        </BrowserRouter>
                    </AntApp>
                </ThemeProvider>
            </ConfigProvider>
        </Provider>
    );
};

export default App;
