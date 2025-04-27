import React from 'react';
import { Button } from 'antd';
import { MenuFoldOutlined, MenuUnfoldOutlined } from '@ant-design/icons';
import UserMenu from '../UserMenu/UserMenu';
import { ChatHeaderProps } from './types';
import './ChatHeader.less';

const ChatHeader: React.FC<ChatHeaderProps> = ({
  sidebarCollapsed,
  toggleSidebar,
  user
}) => {
  const userMenuProps = user ? {
    name: user.name,
    avatar: user.avatar,
    userId: user.userId,
    email: user.email,
    age: user.age,
    gender: user.gender,
    idCardNumber: user.idCardNumber
  } : undefined;

  return (
    <div className="chat-header">
      <div className="left-section">
        <Button
          type="text"
          icon={sidebarCollapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
          onClick={toggleSidebar}
          className="toggle-button"
        />
      </div>
      <div className="right-section">
        <UserMenu user={userMenuProps} />
      </div>
    </div>
  );
};

export default ChatHeader; 