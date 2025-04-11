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
  LogoutOutlined
} from '@ant-design/icons';
import styles from './MainLayout.module.css';

const { Header, Content, Sider } = Layout;

const MainLayout: React.FC = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const userId = useSelector((state: RootState) => state.auth.userId);

  const handleLogout = async () => {
    try {
      await AuthAPI.logout();
      AuthAPI.removeAuthToken();
      dispatch(logout());
      navigate('/login');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const userMenu = (
    <Menu>
      <Menu.Item key="profile" icon={<UserOutlined />} onClick={() => navigate('/profile')}>
        个人资料
      </Menu.Item>
      <Menu.Item key="logout" icon={<LogoutOutlined />} onClick={handleLogout}>
        退出登录
      </Menu.Item>
    </Menu>
  );

  const menuItems = [
    {
      key: '/chat',
      icon: <MessageOutlined />,
      label: '聊天'
    },
    {
      key: '/guide',
      icon: <BookOutlined />,
      label: '指南'
    },
    {
      key: '/reports',
      icon: <FileTextOutlined />,
      label: '报告'
    }
  ];

  return (
    <Layout className={styles.layout}>
      <Header className={styles.header}>
        <div className={styles.logo}>医疗助手</div>
        <div className={styles.userInfo}>
          <Dropdown overlay={userMenu} placement="bottomRight">
            <Button type="text" icon={<Avatar icon={<UserOutlined />} />}>
              {userId}
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