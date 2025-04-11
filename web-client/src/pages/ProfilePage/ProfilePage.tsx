import React from 'react';
import { Layout, Typography, Avatar, Button, Card, Row, Col } from 'antd';
import { 
  UserOutlined, 
  SettingOutlined, 
  FileTextOutlined, 
  LockOutlined,
  InfoCircleOutlined,
  MedicineBoxOutlined,
  FileOutlined,
  ScanOutlined,
  CustomerServiceOutlined,
  LeftOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import Header from '@/components/Header';
import './ProfilePage.less';
import { clearUser } from '@/store';

const { Content } = Layout;
const { Text, Title } = Typography;

interface UserProfile {
  id: string;
  name: string;
  motto: string;
  avatar?: string;
}

const ProfilePage: React.FC = () => {
  const navigate = useNavigate();
  const [profile, setProfile] = React.useState<UserProfile>({
    id: '10013428823',
    name: '赵泽川',
    motto: '让健康生活安诊无忧'
  });
  
  const commonServices = [
    { 
      icon: <MedicineBoxOutlined />, 
      title: '挂号记录',
      path: '/appointments',
      color: '#5c7cfa'
    },
    { 
      icon: <FileOutlined />, 
      title: '就诊记录',
      path: '/medical-records',
      color: '#22b8cf'
    },
    { 
      icon: <ScanOutlined />, 
      title: '扫一扫',
      path: '/scan',
      color: '#20c997'
    },
    { 
      icon: <CustomerServiceOutlined />, 
      title: '客服咨询',
      path: '/customer-service',
      color: '#2196f3'
    }
  ];
  
  const tools = [
    { 
      icon: <SettingOutlined />, 
      title: '设置',
      path: '/settings',
      color: '#1890ff'
    },
    { 
      icon: <FileTextOutlined />, 
      title: '用户协议',
      path: '/user-agreement',
      color: '#52c41a'
    },
    { 
      icon: <LockOutlined />, 
      title: '隐私政策',
      path: '/privacy-policy',
      color: '#722ed1'
    },
    { 
      icon: <InfoCircleOutlined />, 
      title: '关于',
      path: '/about',
      color: '#fa8c16'
    }
  ];
  
  const handleLogout = () => {
    console.log('退出登录');
    clearUser();
    navigate('/login');
  };
  
  return (
    <Layout className="profile-page">
      <Header />
      
      <div className="page-header">
        <LeftOutlined className="back-icon" onClick={() => navigate(-1)} />
        <Text strong className="header-title">我的</Text>
      </div>
      
      <Content className="profile-content">
        <div className="profile-header">
          <Avatar 
            size={70}
            icon={<UserOutlined />}
            src={profile.avatar}
            className="profile-avatar"
          />
          <div className="profile-info">
            <Title level={4}>Hi, *{profile.name.slice(1)}</Title>
            <Text type="secondary">{profile.motto}</Text>
          </div>
        </div>
        
        <Card className="id-card">
          <div className="id-card-content">
            <div>
              <div className="id-card-name">
                <span className="id-icon">🆔</span>
                <Text className="name">{profile.name}</Text>
              </div>
              <Text className="id-number">ID {profile.id}</Text>
            </div>
            <Button className="change-patient-btn">更换就诊人</Button>
          </div>
        </Card>
        
        <Card title="常用服务" className="services-card">
          <Row gutter={[24, 24]}>
            {commonServices.map((service, index) => (
              <Col span={6} key={index}>
                <div 
                  className="service-item"
                  onClick={() => navigate(service.path)}
                >
                  <div 
                    className="service-icon"
                    style={{ backgroundColor: `${service.color}20`, color: service.color }}
                  >
                    {service.icon}
                  </div>
                  <Text>{service.title}</Text>
                </div>
              </Col>
            ))}
          </Row>
        </Card>
        
        <Card title="我的工具" className="tools-card">
          <Row gutter={[24, 24]}>
            {tools.map((tool, index) => (
              <Col span={6} key={index}>
                <div 
                  className="service-item"
                  onClick={() => navigate(tool.path)}
                >
                  <div 
                    className="service-icon"
                    style={{ backgroundColor: `${tool.color}20`, color: tool.color }}
                  >
                    {tool.icon}
                  </div>
                  <Text>{tool.title}</Text>
                </div>
              </Col>
            ))}
          </Row>
        </Card>
      </Content>
    </Layout>
  );
};

export default ProfilePage;