import React, { useMemo } from 'react';
import { Avatar } from 'antd';
import { UserOutlined, RobotOutlined } from '@ant-design/icons';
import './MessageBubble.css';

interface MessageProps {
  message: {
    content: string;
    senderType: 'PATIENT' | 'SYSTEM';
    timestamp: string;
  };
}

const MessageBubble: React.FC<MessageProps> = ({ message }) => {
  const isPatient = useMemo(() => message.senderType === 'PATIENT', [message.senderType]);
  
  const formattedTime = useMemo(() => {
    return new Date(message.timestamp).toLocaleTimeString('zh-CN', {
      hour: '2-digit',
      minute: '2-digit'
    });
  }, [message.timestamp]);
  
  return (
    <div className={`message-row ${isPatient ? 'sent' : 'received'}`}>
      {!isPatient && (
        <Avatar 
          icon={<RobotOutlined />} 
          style={{ marginRight: '8px' }}
          className="message-avatar"
        />
      )}
      <div className={`message-content ${isPatient ? 'sent' : 'received'}`}>
        <div className={`message-bubble ${isPatient ? 'sent' : 'received'}`}>
          {message.content}
        </div>
        <div className="message-time">
          {formattedTime}
        </div>
      </div>
      {isPatient && (
        <Avatar
          icon={<UserOutlined />}
          style={{ marginLeft: '8px' }}
          className="message-avatar"
        />
      )}
    </div>
  );
};

export default React.memo(MessageBubble);