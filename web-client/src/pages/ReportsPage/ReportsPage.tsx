import React, { useState } from 'react';
import { Layout, Typography, Button, Avatar, Upload, message } from 'antd';
import { UserOutlined, UploadOutlined, RobotOutlined, MessageOutlined } from '@ant-design/icons';
import type { UploadProps } from 'antd';
import Header from '@/components/Header';
import TabBar from '@/components/TabBar';
import MessageInput from '@/components/MessageInput';
import './ReportsPage.less';
import { Message } from '@/types/conversation';

const { Content } = Layout;
const { Text, Title } = Typography;

const ReportsPage: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      _id: 'initial-0',
      content: '您可以上传检验单报告，我将为您解读相关检验指标',
      role: 'system',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      metadata: {},
      conversationId: 'guide-placeholder'
    }
  ]);
  
  const [isUploading, setIsUploading] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  
  const uploadProps: UploadProps = {
    name: 'report',
    action: '/api/upload/report',
    accept: 'image/*,.pdf',
    showUploadList: false,
    beforeUpload: file => {
      const isImage = file.type.startsWith('image/');
      const isPdf = file.type === 'application/pdf';
      if (!isImage && !isPdf) {
        message.error('只支持上传图片或PDF文件!');
        return Upload.LIST_IGNORE;
      }
      return true;
    },
    onChange: info => {
      if (info.file.status === 'uploading') {
        setIsUploading(true);
      }
      if (info.file.status === 'done') {
        setIsUploading(false);
        setIsAnalyzing(true);
        
        // 模拟解析过程
        setTimeout(() => {
          setMessages([
            ...messages,
            {
              _id: 'analyzing-0',
              content: '正解读中，请耐心等待...',
              role: 'system',
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
              metadata: {},
              conversationId : 'guide-placeholder'
            }
          ]);
          
          // 模拟解析完成
          setTimeout(() => {
            setIsAnalyzing(false);
          }, 2000);
        }, 1000);
      }
    }
  };
  
  const handleSendMessage = (content: string) => {
    const newMessage: Message = {
      _id: Date.now().toString(),
      content,
      role: 'user',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      metadata: {},
      conversationId: 'guide-placeholder'
    };
    
    setMessages([...messages, newMessage]);
  };
  
  return (
    <Layout className="reports-page">
      <Header />
      <TabBar />
      
      <Content className="reports-content">
        <div className="robot-section">
          <Avatar 
            size={100} 
            icon={<RobotOutlined />} 
            className="robot-avatar"
          />
          <div className="robot-message">
            <Title level={5}>Hi~我是您的智能小助手</Title>
            <Text>您可以上传检验单报告，我将为您解读相关检验指标啦!</Text>
            <br /><br />
            <Text type="warning">温馨提示：信息仅供参考，疾病诊断请到院就诊!</Text>
          </div>
        </div>
        
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
              </div>
              
              {message.role === 'user' && (
                <Avatar icon={<UserOutlined />} className="avatar" />
              )}
            </div>
          ))}
        </div>
        
        {!isUploading && !isAnalyzing && (
          <div className="upload-section">
            <Upload {...uploadProps}>
              <Button 
                type="primary" 
                icon={<UploadOutlined />} 
                size="large"
                className="upload-btn"
              >
                上传检验单
              </Button>
            </Upload>
          </div>
        )}
      </Content>
      
      <MessageInput onSend={handleSendMessage} />
    </Layout>
  );
};

export default ReportsPage; 