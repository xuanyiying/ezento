import React, { useState } from 'react';
import { Form, Input, Button, Checkbox, App } from 'antd';
import { useNavigate, Link } from 'react-router-dom';
import { AuthAPI } from '@/services/auth';

interface RegisterFormValues {
    phone: string;
    verificationCode: string;
    password: string;
    confirmPassword: string;
    agreement: boolean;
}

const RegisterForm: React.FC = () => {
    const [registerForm] = Form.useForm();
    const [loading, setLoading] = useState<boolean>(false);
    const [countdown, setCountdown] = useState<number>(0);
    const navigate = useNavigate();
    const { message } = App.useApp();

    const handleRegister = async (values: RegisterFormValues) => {
        if (values.password !== values.confirmPassword) {
            message.error('两次输入的密码不一致');
            return;
        }
        if (!values.agreement) {
            message.error('请阅读并同意用户协议和隐私政策');
            return;
        }
        setLoading(true);
        try {
            await AuthAPI.register({
                phone: values.phone,
                verificationCode: values.verificationCode,
                password: values.password,
            });
            message.success('注册成功，请登录');
            registerForm.resetFields();
            navigate('/login');
        } catch (error) {
            message.error('注册失败，请稍后再试');
        } finally {
            setLoading(false);
        }
    };

    const sendVerificationCode = () => {
        const phone = registerForm.getFieldValue('phone');
        if (!phone || !/^1\d{10}$/.test(phone)) {
            message.error('请输入有效的手机号');
            return;
        }
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
        AuthAPI.sendVerificationCode(phone)
            .then(() => {
                message.success(`验证码已发送至${phone}`);
            })
            .catch(() => {
                message.error('发送验证码失败，请稍后再试');
                clearInterval(timer);
                setCountdown(0);
            });
    };

    return (
        <>
            <h2 className="form-title">创建账号</h2>
            <Form
                form={registerForm}
                name="register"
                onFinish={handleRegister}
            >
                <div className="form-group">
                    <label className="form-label">手机号</label>
                    <Form.Item
                        name="phone"
                        rules={[
                            { required: true, message: '请输入手机号' },
                            { pattern: /^1\d{10}$/, message: '请输入有效的手机号' }
                        ]}
                        noStyle
                    >
                        <Input className="form-input" placeholder="请输入手机号" />
                    </Form.Item>
                </div>
                <div className="form-group">
                    <label className="form-label">验证码</label>
                    <div className="verification-code-container">
                        <Form.Item
                            name="verificationCode"
                            rules={[{ required: true, message: '请输入验证码' }]}
                            noStyle
                        >
                            <Input className="form-input" placeholder="请输入验证码" />
                        </Form.Item>
                        <Button
                            onClick={sendVerificationCode}
                            disabled={countdown > 0}
                            className="verification-code-btn"
                        >
                            {countdown > 0 ? `${countdown}秒后重试` : '获取验证码'}
                        </Button>
                    </div>
                </div>
                <div className="form-group">
                    <label className="form-label">设置密码</label>
                    <Form.Item
                        name="password"
                        rules={[
                            { required: true, message: '请设置密码' },
                            { min: 6, message: '密码至少6个字符' }
                        ]}
                        noStyle
                    >
                        <Input.Password className="form-input" placeholder="请设置密码" />
                    </Form.Item>
                </div>
                <div className="form-group">
                    <label className="form-label">确认密码</label>
                    <Form.Item
                        name="confirmPassword"
                        rules={[
                            { required: true, message: '请确认密码' },
                            ({ getFieldValue }) => ({
                                validator(_, value) {
                                    if (!value || getFieldValue('password') === value) {
                                        return Promise.resolve();
                                    }
                                    return Promise.reject(new Error('两次输入的密码不一致'));
                                },
                            }),
                        ]}
                        noStyle
                    >
                        <Input.Password className="form-input" placeholder="请确认密码" />
                    </Form.Item>
                </div>
                <div style={{ marginBottom: '20px' }}>
                    <Form.Item name="agreement" valuePropName="checked" noStyle>
                        <Checkbox>
                            我已阅读并同意 <a href="#" style={{ color: 'var(--primary-color, #1890ff)' }}>用户协议</a> 和 <a href="#" style={{ color: 'var(--primary-color, #1890ff)' }}>隐私政策</a>
                        </Checkbox>
                    </Form.Item>
                </div>
                <Form.Item>
                    <Button
                        type="primary"
                        htmlType="submit"
                        loading={loading}
                        className="submit-btn"
                        style={{ borderRadius: '8px' }}
                    >
                        注册
                    </Button>
                </Form.Item>
                <div className="login-link">
                    已有账号？<Link to="/login">去登录</Link>
                </div>
            </Form>
        </>
    );
};

export default RegisterForm; 