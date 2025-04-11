import React from 'react';
import { Layout } from 'antd';
import { useNavigate } from 'react-router-dom';
import './index.less';
const { Header: AntHeader } = Layout;

interface HeaderProps {
  title?: string;
}

const Header: React.FC<HeaderProps> = ({ title }) => {
  const navigate = useNavigate();
  
  return (
    <AntHeader className="app-header">
      <div className="header-content">
        <div className="time">9:41</div>
        <div className="status-icons">
          <span className="signal-icon">📶</span>
          <span className="wifi-icon">📶</span>
          <span className="battery-icon">🔋</span>
        </div>
      </div>
    </AntHeader>
  );
};

export default Header;
