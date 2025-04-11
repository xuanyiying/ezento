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
      {title && (
        <div className="header-title">{title}</div>
      )}
    </AntHeader>
  );
};

export default Header;
