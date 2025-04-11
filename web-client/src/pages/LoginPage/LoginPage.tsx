import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { RootState } from '@/store';
import { loginStart, loginSuccess, loginFailure } from '@/store/slices/authSlice';
import { AuthAPI } from '@/services/auth';
import { Form, Input, Button, Card, message } from 'antd';
import { UserOutlined, LockOutlined } from '@ant-design/icons';
import styles from './LoginPage.module.css';

const LoginPage: React.FC = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const loading = useSelector((state: RootState) => state.auth.loading);

  const onFinish = async (values: { username: string; password: string }) => {
    try {
      dispatch(loginStart());
      const response = await AuthAPI.login(values);
      console.log('登录响应:', response);
      AuthAPI.setAuthToken(response.token);
      localStorage.setItem('user', JSON.stringify(response.user));
      // 存储用户信息到 Redux
      const user = response.user;
      dispatch(loginSuccess({ 
        userId: user.userId,
        token: response.token,
        role: user.role || '',
        name: user.name,
        avatar: user.avatar,
        phone: user.phone,
        gender: user.gender,
        birthDate: user.birthDate
      }));
      message.success('登录成功');
      navigate('/');
    } catch (error : any) {
      dispatch(loginFailure('登录失败，请检查用户名和密码'));
      message.error('登录失败，请检查用户名和密码', error);
    }
  };

  return (
    <div className={styles.loginContainer}>
      <Card className={styles.loginCard} title="用户登录">
        <Form
          form={form}
          name="login"
          onFinish={onFinish}
          autoComplete="off"
        >
          <Form.Item
            name="username"
            rules={[{ required: true, message: '请输入用户名' }]}
          >
            <Input
              prefix={<UserOutlined />}
              placeholder="用户名"
              size="large"
            />
          </Form.Item>

          <Form.Item
            name="password"
            rules={[{ required: true, message: '请输入密码' }]}
          >
            <Input.Password
              prefix={<LockOutlined />}
              placeholder="密码"
              size="large"
            />
          </Form.Item>

          <Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              loading={loading}
              size="large"
              block
            >
              登录
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
};

export default LoginPage;