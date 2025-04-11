import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { UserOutlined } from '@ant-design/icons';
import './index.less';

const TabBar: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  
  const isActive = (path: string) => location.pathname === path;
  
  return (
    <div className="tab-container">
      <div 
        className={`tab ${isActive('/chat') ? 'active' : ''}`}
        onClick={() => navigate('/chat')}
      >
        预问诊
      </div>
      <div 
        className={`tab ${isActive('/guide') ? 'active' : ''}`}
        onClick={() => navigate('/guide')}
      >
        导诊
      </div>
      <div 
        className={`tab ${isActive('/reports') ? 'active' : ''}`}
        onClick={() => navigate('/reports')}
      >
        报告解读
      </div>
      <div 
        className="profile-icon"
        onClick={() => navigate('/profile')}
      >
        <UserOutlined />
      </div>
    </div>
  );
};

export default TabBar;
