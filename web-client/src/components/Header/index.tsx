import React from 'react';
import { Layout } from 'antd';
import './index.less';
const { Header: AntHeader } = Layout;

interface HeaderProps {
    title?: string;
}

const Header: React.FC<HeaderProps> = ({ title }) => {

    return (
        <AntHeader className="app-header">
            {title && <div className="header-title">{title}</div>}
        </AntHeader>
    );
};

export default Header;
