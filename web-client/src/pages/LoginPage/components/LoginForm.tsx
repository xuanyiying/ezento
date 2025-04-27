import React, { useState } from 'react';
import { Form, Input, Button, Checkbox, App } from 'antd';
import { useNavigate, Link } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { loginSuccess } from '@/store/slices/authSlice';
import { AuthAPI } from '@/services/auth';
import TokenManager from '@/utils/tokenManager';
import { AlipayCircleFilled, AppleFilled, WechatOutlined } from '@ant-design/icons';

interface LoginFormValues {
    username: string;
    password: string;
    remember: boolean;
}

const LoginForm: React.FC = () => {
    const [loginForm] = Form.useForm();
    const [loading, setLoading] = useState<boolean>(false);
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const { message } = App.useApp();

    const handleLogin = async (values: LoginFormValues) => {
        try {
            setLoading(true);
            const { token, refreshToken, user } = await AuthAPI.login(values);
            if (!token || !user) throw new Error('登录失败');
            TokenManager.saveTokens(token, refreshToken);
            dispatch(loginSuccess({
                userId: user.userId || '',
                token,
                refreshToken,
                role: user.role || '',
                name: user.name,
                avatar: user.avatar,
                phone: user.phone,
                gender: user.gender,
                birthDate: user.birthDate,
            }));
            navigate('/');
            message.success('登录成功');
        } catch (error) {
            message.error('登录失败，请稍后重试');
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <h2 className="form-title">欢迎回来</h2>
            <Form
                form={loginForm}
                name="login"
                initialValues={{ remember: true }}
                onFinish={handleLogin}
            >
                <div className="form-group">
                    <label className="form-label">手机号/用户名</label>
                    <Form.Item
                        name="username"
                        rules={[{ required: true, message: '请输入手机号或用户名' }]}
                        noStyle
                    >
                        <Input className="form-input" placeholder="请输入手机号或用户名" />
                    </Form.Item>
                </div>
                <div className="form-group">
                    <label className="form-label">密码</label>
                    <Form.Item
                        name="password"
                        rules={[{ required: true, message: '请输入密码' }]}
                        noStyle
                    >
                        <Input.Password className="form-input" placeholder="请输入密码" />
                    </Form.Item>
                </div>
                <div className="form-footer">
                    <div className="remember-me">
                        <Form.Item name="remember" valuePropName="checked" noStyle>
                            <Checkbox>记住我</Checkbox>
                        </Form.Item>
                    </div>
                    <a className="forgot-password" href="#">忘记密码？</a>
                </div>
                <Form.Item>
                    <Button
                        type="primary"
                        htmlType="submit"
                        loading={loading}
                        className="submit-btn"
                        style={{ borderRadius: '6px' }}
                    >
                        登录
                    </Button>
                </Form.Item>
            </Form>
            <div className="alt-login">
                <div className="alt-login-title">其他方式登录</div>
                <div className="alt-login-buttons">
                    <div className="alt-login-btn wechat"><WechatOutlined /></div>
                    <div className="alt-login-btn alipay"><AlipayCircleFilled /></div>
                    <div className="alt-login-btn phone"><AppleFilled /></div>
                </div>
            </div>
            <div style={{ textAlign: 'center', marginTop: 8 }}>
                没有账号？<Link to="/register">去注册</Link>
            </div>
        </>
    );
};

export default LoginForm; 