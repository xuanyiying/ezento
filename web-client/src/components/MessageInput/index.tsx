import React, { useState, KeyboardEvent } from 'react';
import { Button, Input, Form } from 'antd';
import { SendOutlined } from '@ant-design/icons';
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
  placeholder = '请输入消息...' 
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

  return (
    <div className="message-input-container">
      <Form.Item style={{ marginBottom: 0 }}>
        <TextArea
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled}
          autoSize={{ minRows: 1, maxRows: 4 }}
        />
        <div className="send-button-container">
          <Button
            type="primary"
            icon={<SendOutlined />}
            onClick={handleSend}
            disabled={!value.trim() || disabled}
          />
        </div>
      </Form.Item>
    </div>
  );
};

export default MessageInput;
