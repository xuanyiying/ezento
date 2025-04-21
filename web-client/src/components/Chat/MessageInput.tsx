import React, { useState } from 'react';
import { Button, Tooltip, Upload, UploadFile } from 'antd';
import { AudioOutlined, FileImageOutlined, FilePdfOutlined } from '@ant-design/icons';
import { Sender } from '@ant-design/x';
import VoiceInput from '@/components/VoiceInput';
import './ChatComponents.less';

interface MessageInputProps {
  onSendMessage: (content: string) => void;
  onVoiceInput?: (text: string) => void;
  disabled?: boolean;
}

const MessageInput: React.FC<MessageInputProps> = ({ 
  onSendMessage, 
  onVoiceInput,
  disabled = false 
}) => {
  const [userInput, setUserInput] = useState<string>('');
  const [attachments, setAttachments] = useState<UploadFile[]>([]);

  // 处理发送消息
  const handleSubmit = () => {
    if (userInput.trim()) {
      onSendMessage(userInput);
      setUserInput('');
    }
  };

  // 处理语音输入
  const handleVoiceInput = (text: string) => {
    setUserInput(prev => prev + text);
    if (onVoiceInput) onVoiceInput(text);
  };

  // 触发语音按钮点击
  const handleVoiceButton = () => {
    const voiceInputBtn = document.querySelector(
      '.voice-input-button button'
    ) as HTMLButtonElement;
    if (voiceInputBtn) {
      voiceInputBtn.click();
    }
  };

  // 处理图片上传
  const handleImageUpload = (file: File) => {
    // 检查文件类型
    const isImage = file.type.startsWith('image/');
    if (!isImage) {
      return false;
    }
    
    // 检查文件大小
    const isLt5M = file.size / 1024 / 1024 < 5;
    if (!isLt5M) {
      return false;
    }
    
    // 将图片添加到附件列表
    const newFile = {
      uid: Date.now().toString(),
      name: file.name,
      status: 'done',
      url: URL.createObjectURL(file),
      originFileObj: file,
    } as UploadFile;
    
    setAttachments(prev => [...prev, newFile]);
    return false; // 阻止自动上传
  };

  // 处理报告上传
  const handleReportUpload = (file: File) => {
    // 检查文件类型
    const isPdf = file.type === 'application/pdf';
    const isDoc = file.type === 'application/msword' || 
                  file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
    
    if (!isPdf && !isDoc) {
      return false;
    }
    
    // 检查文件大小
    const isLt10M = file.size / 1024 / 1024 < 10;
    if (!isLt10M) {
      return false;
    }
    
    // 将报告添加到附件列表
    const newFile = {
      uid: Date.now().toString(),
      name: file.name,
      status: 'done',
      url: URL.createObjectURL(file),
      originFileObj: file,
    } as UploadFile;
    
    setAttachments(prev => [...prev, newFile]);
    return false; // 阻止自动上传
  };

  return (
    <div className="sender-container slide-in-up">
      <Sender
        disabled={disabled}
        placeholder="有问题，随时问我"
        value={userInput}
        onChange={value => setUserInput(value)}
        onSubmit={handleSubmit}
        actions={(oriNode) => (
          <div className="action-buttons">
            <Tooltip title="语音输入">
              <Button 
                icon={<AudioOutlined />} 
                onClick={handleVoiceButton}
              />
            </Tooltip>
            <Tooltip title="上传图片">
              <Upload
                showUploadList={false}
                beforeUpload={handleImageUpload}
                accept=".jpg,.jpeg,.png,.gif"
              >
                <Button 
                  icon={<FileImageOutlined />}
                />
              </Upload>
            </Tooltip>
            <Tooltip title="上传报告">
              <Upload
                showUploadList={false}
                beforeUpload={handleReportUpload}
                accept=".pdf,.doc,.docx"
              >
                <Button 
                  icon={<FilePdfOutlined />}
                />
              </Upload>
            </Tooltip>
            {oriNode}
          </div>
        )}
      />

      {/* 隐藏的语音输入组件 */}
      <div style={{ display: 'none' }}>
        <VoiceInput
          onTranscript={handleVoiceInput}
          disabled={disabled}
          buttonOnly={true}
        />
      </div>
    </div>
  );
};

export default MessageInput; 