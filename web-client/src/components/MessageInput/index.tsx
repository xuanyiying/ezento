import React, { useState, KeyboardEvent } from 'react';
import { Input } from 'antd';
import { CameraOutlined } from '@ant-design/icons';
import './styles.less';

interface MessageInputProps {
  onSend: (message: string) => void;
  disabled?: boolean;
  placeholder?: string;
}

const { TextArea } = Input;

const MessageInput: React.FC<MessageInputProps> = ({ 
  onSend, 
  disabled = false, 
  placeholder = '请输入症状/药品名称/疾病...' 
}) => {
  const [value, setValue] = useState('');

  const handleSend = () => {
    if (value.trim() && !disabled) {
      onSend(value.trim());
      setValue('');
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleUpload = () => {
    console.log('Upload functionality to be implemented');
  };

  return (
    <div className="message-input-container">
      <TextArea
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        disabled={disabled}
        autoSize={false}
        className="input-field"
        style={{ height: '40px', overflow: 'hidden' }}
      />
      <div className="upload-btn" onClick={handleUpload}>
        <CameraOutlined />
      </div>
    </div>
  );
};

export default MessageInput;
