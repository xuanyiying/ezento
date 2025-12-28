import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import type { MenuProps, UploadProps } from 'antd';
import { 
  Avatar, 
  Button, 
  Dropdown, 
  Form, 
  Input, 
  Modal,
  Space,
  Radio,
  InputNumber,
  Upload,
  App
} from 'antd';
import { 
  DownOutlined, 
  ExportOutlined, 
  LockOutlined, 
  UserOutlined,
  UserSwitchOutlined, 
  SettingOutlined,
  LoadingOutlined,
  PlusOutlined
} from '@ant-design/icons';
import { logout } from '@/store/slices/authSlice';
import { RootState } from '@/store';
import './UserMenu.less';
import { changePassword, updateUserProfile } from '@/store/slices/userSlice';
import { ChangePasswordForm } from './types';
import { useAppDispatch } from '@/store/hooks';

interface UserMenuProps {
  user?: {
    name?: string;
    avatar?: string;
    userId?: string;
    email?: string;
    age?: number;
    gender?: string;
    idCardNumber?: string;
  };
}

const UserMenu: React.FC<UserMenuProps> = ({ user: propUser }) => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { user: reduxUser } = useSelector((state: RootState) => state.auth);
  const user = propUser || reduxUser;
  const [passwordModalVisible, setPasswordModalVisible] = useState(false);
  const [passwordForm] = Form.useForm();
  const [profileModalVisible, setProfileModalVisible] = useState(false);
  const [profileForm] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [imageUrl, setImageUrl] = useState<string | undefined>(user?.avatar);

  // 处理登出
  const { message } = App.useApp();

  const handleLogout = async () => {
    console.log('点击了登出按钮');
    try {
      await dispatch(logout());
      message.success('登出成功');
      navigate('/login');
    } catch (error) {
      message.error('登出失败');
      console.error(error);
    }
  };

  // 处理修改密码
  const handleChangePassword = async (values: ChangePasswordForm) => {
    console.log('提交修改密码表单');
    try {
      await dispatch(changePassword({
        oldPassword: values.oldPassword,
        newPassword: values.newPassword
      }));
      message.success('密码修改成功');
      setPasswordModalVisible(false);
      passwordForm.resetFields();
    } catch (error) {
      message.error('密码修改失败');
      console.error(error);
    }
  };

  // 处理修改个人信息
  const handleUpdateProfile = async (values: any) => {
    console.log('提交修改个人信息表单', values);
    try {
      await dispatch(updateUserProfile({
        name: values.name,
        age: values.age,
        gender: values.gender,
        idCardNumber: values.idCardNumber,
        avatar: imageUrl
      }));
      message.success('个人信息修改成功');
      setProfileModalVisible(false);
      profileForm.resetFields();
    } catch (error) {
      message.error('个人信息修改失败');
      console.error(error);
    }
  };

  // 处理菜单点击
  const onClick: MenuProps['onClick'] = ({ key }) => {
    console.log(`菜单项被点击: ${key}`);
    
    switch (key) {
      case 'profile':
        setProfileModalVisible(true);
        break;
      case 'password':
        setPasswordModalVisible(true);
        break;
      case 'settings':
        navigate('/settings');
        break;
      case 'changeRole':
        message.info('暂未实现角色切换功能');
        break;
      case 'logout':
        handleLogout();
        break;
    }
  };

  // 菜单项配置
  const items: MenuProps['items'] = [
    {
      key: 'profile',
      icon: <UserOutlined />,
      label: '个人资料',
    },
    {
      key: 'password',
      icon: <LockOutlined />,
      label: '修改密码',
    },
    {
      key: 'settings',
      icon: <SettingOutlined />,
      label: '偏好设置',
    },
    {
      key: 'changeRole',
      icon: <UserSwitchOutlined />,
      label: '切换角色',
    },
    {
      type: 'divider',
    },
    {
      key: 'logout',
      icon: <ExportOutlined />,
      label: '退出登录',
      danger: true,
    },
  ];

  // 头像上传前验证
  const beforeUpload = (file: File) => {
    const isJpgOrPng = file.type === 'image/jpeg' || file.type === 'image/png';
    if (!isJpgOrPng) {
      message.error('只能上传JPG/PNG格式的图片!');
    }
    const isLt2M = file.size / 1024 / 1024 < 2;
    if (!isLt2M) {
      message.error('图片必须小于2MB!');
    }
    return isJpgOrPng && isLt2M;
  };

  // 头像上传变化事件
  const handleAvatarChange: UploadProps['onChange'] = (info) => {
    if (info.file.status === 'uploading') {
      setLoading(true);
      return;
    }
    if (info.file.status === 'done') {
      // 获取服务器返回的图片URL
      setImageUrl(info.file.response.url);
      setLoading(false);
    }
  };

  // 上传按钮
  const uploadButton = (
    <div>
      {loading ? <LoadingOutlined /> : <PlusOutlined />}
      <div style={{ marginTop: 8 }}>上传</div>
    </div>
  );

  return (
    <div className="user-menu-container">
      <Dropdown
        menu={{ items, onClick }}
        trigger={['click']}
        placement="bottomRight"
        overlayClassName="user-dropdown"
      >
        <Button type="text" className="user-menu-button">
          <Space>
            <Avatar size="small" src={user?.avatar} icon={<UserOutlined />} />
            <span className="username">{user?.name || '用户'}</span>
            <DownOutlined />
          </Space>
        </Button>
      </Dropdown>

      {/* 修改密码对话框 */}
      <Modal
        title="修改密码"
        open={passwordModalVisible}
        onCancel={() => {
          setPasswordModalVisible(false);
          passwordForm.resetFields();
        }}
        footer={[
          <Button key="cancel" onClick={() => {
            setPasswordModalVisible(false);
            passwordForm.resetFields();
          }}>
            取消
          </Button>,
          <Button 
            key="submit" 
            type="primary" 
            onClick={() => passwordForm.submit()}
          >
            确定
          </Button>
        ]}
      >
        <Form
          form={passwordForm}
          layout="vertical"
          onFinish={handleChangePassword}
        >
          <Form.Item
            name="oldPassword"
            label="当前密码"
            rules={[{ required: true, message: '请输入当前密码' }]}
          >
            <Input.Password placeholder="请输入当前密码" />
          </Form.Item>
          <Form.Item
            name="newPassword"
            label="新密码"
            rules={[
              { required: true, message: '请输入新密码' },
              { min: 8, message: '密码长度不能小于8位' }
            ]}
          >
            <Input.Password placeholder="请输入新密码" />
          </Form.Item>
          <Form.Item
            name="confirmPassword"
            label="确认新密码"
            dependencies={['newPassword']}
            rules={[
              { required: true, message: '请确认新密码' },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue('newPassword') === value) {
                    return Promise.resolve();
                  }
                  return Promise.reject(new Error('两次输入的密码不一致'));
                },
              }),
            ]}
          >
            <Input.Password placeholder="请确认新密码" />
          </Form.Item>
        </Form>
      </Modal>

      {/* 编辑个人资料对话框 */}
      <Modal
        title="编辑个人资料"
        open={profileModalVisible}
        onCancel={() => {
          setProfileModalVisible(false);
          profileForm.resetFields();
        }}
        footer={[
          <Button key="cancel" onClick={() => {
            setProfileModalVisible(false);
            profileForm.resetFields();
          }}>
            取消
          </Button>,
          <Button 
            key="submit" 
            type="primary" 
            onClick={() => profileForm.submit()}
          >
            保存
          </Button>
        ]}
        width={600}
      >
        <Form
          form={profileForm}
          layout="vertical"
          onFinish={handleUpdateProfile}
          initialValues={{
            name: user?.name,
            email: reduxUser?.email || '',
            age: user?.age,
            gender: user?.gender || '男',
            idCardNumber: user?.idCardNumber || '',
          }}
        >
          <div className="avatar-upload-container">
            <Upload
              name="avatar"
              listType="picture-card"
              className="avatar-uploader"
              showUploadList={false}
              action="/api/user/upload-avatar"
              beforeUpload={beforeUpload}
              onChange={handleAvatarChange}
              headers={{
                authorization: `Bearer ${localStorage.getItem('token')}`,
              }}
            >
              {imageUrl ? (
                <img src={imageUrl} alt="avatar" style={{ width: '100%', borderRadius: '4px' }} />
              ) : (
                uploadButton
              )}
            </Upload>
            <p className="avatar-tip">点击上传头像</p>
          </div>

          <Form.Item
            name="name"
            label="姓名"
            rules={[{ required: true, message: '请输入姓名' }]}
          >
            <Input placeholder="请输入姓名" />
          </Form.Item>
          
          <Form.Item
            name="email"
            label="邮箱"
            rules={[
              { required: true, message: '请输入邮箱' },
              { type: 'email', message: '请输入有效的邮箱地址' }
            ]}
          >
            <Input placeholder="请输入邮箱" disabled />
          </Form.Item>

          <Form.Item
            name="age"
            label="年龄"
            rules={[
              { required: false },
              { type: 'number', min: 1, max: 120, message: '请输入有效年龄' }
            ]}
          >
            <InputNumber placeholder="请输入年龄" style={{ width: '100%' }} />
          </Form.Item>

          <Form.Item
            name="gender"
            label="性别"
          >
            <Radio.Group>
              <Radio value="男">男</Radio>
              <Radio value="女">女</Radio>
              <Radio value="其他">其他</Radio>
            </Radio.Group>
          </Form.Item>

          <Form.Item
            name="idCardNumber"
            label="身份证号"
            rules={[
              { pattern: /(^\d{15}$)|(^\d{18}$)|(^\d{17}(\d|X|x)$)/, message: '请输入有效的身份证号码' }
            ]}
          >
            <Input placeholder="请输入身份证号码" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default UserMenu;