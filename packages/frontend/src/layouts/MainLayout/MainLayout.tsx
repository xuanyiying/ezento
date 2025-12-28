import React from 'react';
import { Layout, Menu, Button, Avatar, Dropdown } from 'antd';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '@/store';
import { logout } from '@/store/slices/authSlice';
import { AuthAPI } from '@/services/auth';
import {
    MessageOutlined,
    BookOutlined,
    FileTextOutlined,
    UserOutlined,
    LogoutOutlined,
} from '@ant-design/icons';
import styles from './MainLayout.module.css';

const { Header, Content, Sider } = Layout;

const MainLayout: React.FC = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const location = useLocation();
    const user = useSelector((state: RootState) => state.auth.user);

    const handleLogout = async () => {
        try {
            await AuthAPI.logout();
            dispatch(logout());
            navigate('/login');
        } catch (error) {
            console.error('Logout failed:', error);
        }
    };

    const userMenu = {
        items: [
            {
                key: 'profile',
                icon: <UserOutlined />,
                label: '个人资料',
                onClick: () => navigate('/profile'),
            },
            {
                key: 'logout',
                icon: <LogoutOutlined />,
                label: '退出登录',
                onClick: handleLogout,
            },
        ],
    };

    const menuItems = [
        {
            key: '/chat',
            icon: <MessageOutlined />,
            label: '聊天',
        },
        {
            key: '/guide',
            icon: <BookOutlined />,
            label: '指南',
        },
        {
            key: '/reports',
            icon: <FileTextOutlined />,
            label: '报告',
        },
    ];

    return (
        <Layout className={styles.layout}>
            <Header className={styles.header}>
                <div className={styles.logo}>医疗助手</div>
                <div className={styles.userInfo}>
                    <Dropdown menu={userMenu} placement="bottomRight">
                        <Button type="text">
                            <Avatar icon={<UserOutlined />} src={user?.avatar} />
                            <span style={{ marginLeft: 8 }}>{user?.name || '用户'}</span>
                        </Button>
                    </Dropdown>
                </div>
            </Header>
            <Layout>
                <Sider width={200} className={styles.sider}>
                    <Menu
                        mode="inline"
                        selectedKeys={[location.pathname]}
                        items={menuItems}
                        onClick={({ key }) => navigate(key)}
                    />
                </Sider>
                <Layout className={styles.contentLayout}>
                    <Content className={styles.content}>
                        <Outlet />
                    </Content>
                </Layout>
            </Layout>
        </Layout>
    );
};

export default MainLayout;
