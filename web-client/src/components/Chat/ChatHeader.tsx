import React from 'react';
import { Button } from 'antd';
import { MenuUnfoldOutlined, MenuFoldOutlined } from '@ant-design/icons';
import UserMenu from '../UserMenu/UserMenu';
import './ChatComponents.less';

interface ChatHeaderProps {
  sidebarCollapsed: boolean;
  toggleSidebar: () => void;
  user: {
    name?: string;
    avatar?: string;
    userId?: string;
  };
}

const ChatHeader: React.FC<ChatHeaderProps> = ({ 
  sidebarCollapsed, 
  toggleSidebar, 
  user 
}) => {
  console.log('渲染ChatHeader组件，用户信息:', user);
  
  return (
    <div className="chat-app-header">
      <div className="header-left">
        <Button
          type="text"
          icon={sidebarCollapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
          onClick={toggleSidebar}
          className="sidebar-toggle"
        />
        <span className="app-title">AI问诊</span>
      </div>
      <div className="header-right">
        <UserMenu user={user} />
      </div>
    </div>
  );
};

export default ChatHeader; 