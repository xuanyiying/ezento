import React, { useState } from 'react';
import { XProvider, Welcome } from '@ant-design/x';
import { Form, Input, Button, Checkbox, Divider, App } from 'antd';
import { UserOutlined, LockOutlined, MobileOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { loginSuccess } from '@/store/slices/authSlice';
import { AuthAPI } from '@/services/auth';
import './index.less';

// 类型定义
interface LoginFormValues {
    username: string;
    password: string;
    remember: boolean;
}

interface RegisterFormValues extends LoginFormValues {
    confirmPassword: string;
    phone: string;
    verificationCode: string;
}

const LoginPage: React.FC = () => {
    const [loginForm] = Form.useForm();
    const [registerForm] = Form.useForm();
    const [loading, setLoading] = useState<boolean>(false);
    const [isRegister, setIsRegister] = useState<boolean>(false);
    const [countdown, setCountdown] = useState<number>(0);
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const { message } = App.useApp();

    const handleLogin = async (values: LoginFormValues) => {
        setLoading(true);
        try {
            const response = await AuthAPI.login({
                username: values.username,
                password: values.password,
            });

            // 更新 Redux store
            dispatch(
                loginSuccess({
                    userId: response.user.userId || '',
                    token: response.token,
                    role: response.user.role || '',
                    name: response.user.name,
                    avatar: response.user.avatar,
                    phone: response.user.phone,
                    gender: response.user.gender,
                    birthDate: response.user.birthDate,
                })
            );

            // 确保用户数据被正确存储到localStorage
            localStorage.setItem(
                'user',
                JSON.stringify({
                    userId: response.user.userId || '',
                    role: response.user.role || '',
                    name: response.user.name,
                    avatar: response.user.avatar,
                    phone: response.user.phone,
                    gender: response.user.gender,
                    birthDate: response.user.birthDate,
                })
            );

            message.success('登录成功');
            // 导航到首页
            navigate('/chat');
        } catch (error) {
            console.error('登录失败:', error);
            message.error('用户名或密码错误');
        } finally {
            setLoading(false);
        }
    };

    const handleRegister = (values: RegisterFormValues) => {
        if (values.password !== values.confirmPassword) {
            message.error('两次输入的密码不一致');
            return;
        }

        setLoading(true);

        // 模拟注册请求
        setTimeout(() => {
            console.log('注册信息:', values);
            message.success('注册成功，请登录');
            setLoading(false);
            setIsRegister(false);
            registerForm.resetFields();
        }, 1000);
    };

    const sendVerificationCode = () => {
        const phone = registerForm.getFieldValue('phone');
        if (!phone || !/^1\d{10}$/.test(phone)) {
            message.error('请输入有效的手机号');
            return;
        }

        // 开始倒计时
        setCountdown(60);
        const timer = setInterval(() => {
            setCountdown(prev => {
                if (prev <= 1) {
                    clearInterval(timer);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        // 模拟发送验证码
        message.success(`验证码已发送至${phone}`);
    };

    return (
        <XProvider>
            <div className="login-page">
                <Welcome
                    title="医疗健康助手"
                    icon={<UserOutlined />}
                    description="提供专业的健康咨询和医疗服务"
                />

                <div className="login-container">
                    {!isRegister ? (
                        <>
                            <Form
                                form={loginForm}
                                name="login"
                                initialValues={{ remember: true }}
                                onFinish={handleLogin}
                                layout="vertical"
                            >
                                <Form.Item
                                    name="username"
                                    rules={[{ required: true, message: '请输入用户名/手机号' }]}
                                >
                                    <Input
                                        prefix={<UserOutlined />}
                                        placeholder="用户名/手机号"
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
                                    <Form.Item name="remember" valuePropName="checked" noStyle>
                                        <Checkbox>记住我</Checkbox>
                                    </Form.Item>

                                    <a className="forgot-password" href="#">
                                        忘记密码
                                    </a>
                                </Form.Item>

                                <Form.Item>
                                    <Button
                                        type="primary"
                                        htmlType="submit"
                                        loading={loading}
                                        block
                                        size="large"
                                    >
                                        登录
                                    </Button>
                                </Form.Item>
                            </Form>

                            <Divider>或</Divider>

                            <Button block onClick={() => setIsRegister(true)}>
                                注册新账号
                            </Button>
                        </>
                    ) : (
                        <>
                            <Form
                                form={registerForm}
                                name="register"
                                onFinish={handleRegister}
                                layout="vertical"
                            >
                                <Form.Item
                                    name="phone"
                                    rules={[
                                        { required: true, message: '请输入手机号' },
                                        { pattern: /^1\d{10}$/, message: '请输入有效的手机号' },
                                    ]}
                                >
                                    <Input
                                        prefix={<MobileOutlined />}
                                        placeholder="手机号"
                                        size="large"
                                    />
                                </Form.Item>

                                <Form.Item
                                    name="verificationCode"
                                    rules={[{ required: true, message: '请输入验证码' }]}
                                >
                                    <div className="verification-code">
                                        <Input placeholder="验证码" size="large" />
                                        <Button
                                            onClick={sendVerificationCode}
                                            disabled={countdown > 0}
                                        >
                                            {countdown > 0 ? `${countdown}秒后重发` : '获取验证码'}
                                        </Button>
                                    </div>
                                </Form.Item>

                                <Form.Item
                                    name="password"
                                    rules={[
                                        { required: true, message: '请设置密码' },
                                        { min: 6, message: '密码长度不能少于6位' },
                                    ]}
                                >
                                    <Input.Password
                                        prefix={<LockOutlined />}
                                        placeholder="设置密码"
                                        size="large"
                                    />
                                </Form.Item>

                                <Form.Item
                                    name="confirmPassword"
                                    rules={[
                                        { required: true, message: '请确认密码' },
                                        ({ getFieldValue }) => ({
                                            validator(_, value) {
                                                if (!value || getFieldValue('password') === value) {
                                                    return Promise.resolve();
                                                }
                                                return Promise.reject(
                                                    new Error('两次输入的密码不一致')
                                                );
                                            },
                                        }),
                                    ]}
                                >
                                    <Input.Password
                                        prefix={<LockOutlined />}
                                        placeholder="确认密码"
                                        size="large"
                                    />
                                </Form.Item>

                                <Form.Item>
                                    <Button
                                        type="primary"
                                        htmlType="submit"
                                        loading={loading}
                                        block
                                        size="large"
                                    >
                                        注册
                                    </Button>
                                </Form.Item>
                            </Form>

                            <Divider>或</Divider>

                            <Button block onClick={() => setIsRegister(false)}>
                                返回登录
                            </Button>
                        </>
                    )}
                </div>
            </div>
        </XProvider>
    );
};

export default LoginPage;
