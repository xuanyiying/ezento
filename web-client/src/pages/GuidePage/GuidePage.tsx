import React, { useState } from 'react';
import { Layout, Card, Typography, Button, Avatar } from 'antd';
import { UserOutlined, LockOutlined, MessageOutlined } from '@ant-design/icons';
import Header from '@/components/Header';
import TabBar from '@/components/TabBar';
import MessageInput from '@/components/MessageInput';
import './GuidePage.less';
import { Message } from '@/types/conversation';

const { Content } = Layout;
const { Text } = Typography;

interface Doctor {
  id: string;
  name: string;
  title: string;
  department: string;
  hospital: string;
  availableDates: string[];
}

const GuidePage: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      _id: 'guide-initial-0',
      content: '你好，我是XX医院的XXX医生，请问您哪里不舒服?',
      role: 'system',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      conversationId: 'guide-placeholder',
      metadata: {}
    },
  ]);
  
  const [doctors, setDoctors] = useState<Doctor[]>([
    {
      id: '1',
      name: '姚建利',
      title: '副主任医师',
      department: '呼吸内科',
      hospital: 'XX医院南院区',
      availableDates: ['04-10', '04-13']
    },
    {
      id: '2',
      name: '姚建利',
      title: '副主任医师',
      department: '呼吸内科',
      hospital: 'XX医院南院区',
      availableDates: ['04-10', '04-13']
    }
  ]);
  
  const handleSendMessage = (content: string) => {
    const newMessage: Message = {
      _id: Date.now().toString(),
      content,
      role: 'user',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      conversationId: 'guide-placeholder',
      metadata: {}
    };
    
    setMessages([...messages, newMessage]);
  };
  
  return (
    <Layout className="guide-page">
      <Header />
      <TabBar />
      
      <Content className="guide-content">
        <div className="timestamp">2024-04-02 20:28</div>
        
        <Card className="identity-card">
          <div className="card-title">
            <UserOutlined className="icon" />
            <Text strong>确认身份信息</Text>
          </div>
          
          <div className="card-content">
            <div className="info-row">
              <Text type="secondary" className="label">患者：</Text>
              <Text>张*华(女 24岁)</Text>
            </div>
            <div className="info-row">
              <Text type="secondary" className="label">电话：</Text>
              <Text>187****0291</Text>
            </div>
            
            <div className="action-buttons">
              <Button className="btn-outline">更换就诊人</Button>
              <Button type="primary" className="btn-primary">确认无误</Button>
            </div>
          </div>
          
          <div className="privacy-notice">
            <LockOutlined className="icon" />
            <Text type="warning">隐私保护·平台保障您的隐私安全</Text>
          </div>
        </Card>
        
        <div className="message-container">
          {messages.map(message => (
            <div 
              key={message._id}
              className={`message ${message.role === 'user' ? 'right' : 'left'}`}
            >
              {message.role !== 'user' && (
                <Avatar icon={<MessageOutlined />} className="avatar" />
              )}
              
              <div className="message-content">
                {message.content}
                {message.content === '为您推荐以下医生和排班' && (
                  <Text className="blue-link"> 更多医生</Text>
                )}
              </div>
              
              {message.role === 'user' && (
                <Avatar icon={<UserOutlined />} className="avatar" />
              )}
            </div>
          ))}
        </div>
        
        <div className="doctors-container">
          {doctors.map(doctor => (
            <Card key={doctor.id} className="doctor-card">
              <div className="doctor-info">
                <Avatar size={60} icon={<UserOutlined />} />
                <div className="doctor-details">
                  <Text strong className="doctor-name">{doctor.name}</Text>
                  <Text className="doctor-title">{doctor.title} | {doctor.department}</Text>
                  <Text type="secondary" className="doctor-hospital">{doctor.hospital}</Text>
                  <div className="schedule">
                    <Text type="secondary" className="label">预约日期</Text>
                    {doctor.availableDates.map(date => (
                      <Text key={date} className="date">{date}</Text>
                    ))}
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </Content>
      
      <MessageInput onSend={handleSendMessage} />
    </Layout>
  );
};

export default GuidePage; 