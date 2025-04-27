import React from 'react';
import { LockOutlined, UserOutlined } from '@ant-design/icons';
import { message } from 'antd';
import './ChatComponents.less';
import './IdentityConfirmation.less';

interface IdentityConfirmationProps {
  user: {
    name?: string;
    gender?: string;
    userId?: string;
    age?: number
  };
  onConfirm: () => void;
}

const IdentityConfirmation: React.FC<IdentityConfirmationProps> = ({ user, onConfirm }) => {
  return (
    <div className="welcome-card fade-in">
      <h3 className="flex items-center">
        <UserOutlined className="mr-sm" /> 确认您的身份信息
      </h3>
      <div className="info-container">
        <div className="info-row">
          <span className="label">姓名：</span>
          <span>{user.name || '未设置'}</span>
        </div>
        <div className="info-row">
          <span className="label">年龄：</span>
          <span>{user.age || '未设置'}</span>
        </div>
        <div className="info-row">
          <span className="label">性别：</span>
          <span>
            {user.gender === '男'
              ? '男'
              : user.gender === '女'
                ? '女'
                : '未设置'}
          </span>
        </div>
      </div>
      <div className="privacy-notice">
        <LockOutlined className="icon" />
        <span>您的个人信息受到保护，仅用于提供个性化医疗建议</span>
      </div>
      <div className="welcome-actions">
        <button
          onClick={() => message.info('即将支持身份编辑功能')}
          className="btn btn-secondary btn-ripple"
        >
          修改信息
        </button>
        <button
          className="btn btn-primary btn-ripple"
          onClick={onConfirm}
        >
          确认身份
        </button>
      </div>
    </div>
  );
};

export default IdentityConfirmation; 