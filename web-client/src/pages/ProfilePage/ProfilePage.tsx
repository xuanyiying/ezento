import React, { useState } from 'react';
import { XProvider, ThoughtChain } from '@ant-design/x';
import { Form, Input, Select, Button, Avatar, Typography, DatePicker, App } from 'antd';
import { UserOutlined } from '@ant-design/icons';
import type { Moment } from 'moment';

// 类型定义
interface UserProfile {
  name: string;
    gender: 'MALE' | 'FEMALE' | '';
    birthDate?: Moment;
    phone: string;
    email?: string;
    address?: string;
}

const ProfilePage: React.FC = () => {
    const [form] = Form.useForm();
    const [loading, setLoading] = useState<boolean>(false);
    const { message } = App.useApp();

    // 模拟初始数据
    const initialValues: UserProfile = {
        name: '张三',
        gender: 'MALE',
        phone: '13800138000',
        email: 'zhangsan@example.com',
    };

    const handleSubmit = (values: UserProfile) => {
        setLoading(true);

        // 模拟API请求
        setTimeout(() => {
            console.log('提交的数据:', values);
            message.success('个人信息更新成功');
            setLoading(false);
        }, 1000);
  };
  
  return (
        <XProvider>
            <div className="profile-container">
                <Typography.Title level={3}>个人资料</Typography.Title>

        <div className="profile-header">
                    <Avatar size={80} icon={<UserOutlined />} />
                    <Button>更换头像</Button>
        </div>
        
                <Form
                    form={form}
                    layout="vertical"
                    initialValues={initialValues}
                    onFinish={handleSubmit}
                >
                    <ThoughtChain
                        items={[
                            {
                                key: 'basic',
                                title: '基本信息',
                                content: (
                                    <>
                                        <Form.Item
                                            name="name"
                                            label="姓名"
                                            rules={[{ required: true, message: '请输入姓名' }]}
                                        >
                                            <Input placeholder="请输入姓名" />
                                        </Form.Item>

                                        <Form.Item
                                            name="gender"
                                            label="性别"
                                            rules={[{ required: true, message: '请选择性别' }]}
                                        >
                                            <Select placeholder="请选择性别">
                                                <Select.Option value="MALE">男</Select.Option>
                                                <Select.Option value="FEMALE">女</Select.Option>
                                            </Select>
                                        </Form.Item>

                                        <Form.Item name="birthDate" label="出生日期">
                                            <DatePicker
                                                placeholder="请选择出生日期"
                                                style={{ width: '100%' }}
                                            />
                                        </Form.Item>
                                    </>
                                ),
                            },
                            {
                                key: 'contact',
                                title: '联系方式',
                                content: (
                                    <>
                                        <Form.Item
                                            name="phone"
                                            label="手机号码"
                                            rules={[
                                                { required: true, message: '请输入手机号码' },
                                                {
                                                    pattern: /^1\d{10}$/,
                                                    message: '请输入有效的手机号码',
                                                },
                                            ]}
                                        >
                                            <Input placeholder="请输入手机号码" />
                                        </Form.Item>

                                        <Form.Item
                                            name="email"
                                            label="电子邮箱"
                                            rules={[
                                                { type: 'email', message: '请输入有效的邮箱地址' },
                                            ]}
                                        >
                                            <Input placeholder="请输入电子邮箱" />
                                        </Form.Item>

                                        <Form.Item name="address" label="居住地址">
                                            <Input.TextArea rows={3} placeholder="请输入居住地址" />
                                        </Form.Item>
                                    </>
                                ),
                            },
                        ]}
                    />

                    <Form.Item>
                        <Button type="primary" htmlType="submit" loading={loading}>
                            保存修改
                        </Button>
                    </Form.Item>
                </Form>
                  </div>
        </XProvider>
  );
};

export default ProfilePage;
