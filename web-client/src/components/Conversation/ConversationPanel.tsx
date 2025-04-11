import React, { useEffect, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Button, Input, message, Space } from 'antd';
import { SendOutlined, DownloadOutlined, CloseOutlined } from '@ant-design/icons';
import { websocketService } from '@/services/websocket';
import { ConversationAPI } from '@/services/conversation';
import { RootState } from '@/store';
import { closeConversation } from '@/store/slices/conversationSlice';
import { Message } from '@/store/slices/conversationSlice';
import './ConversationPanel.css';

interface ConversationPanelProps {
  conversationType: 'PRE_DIAGNOSIS' | 'GUIDE' | 'REPORT';
  referenceId: string;
  initialMessage?: string;
}

export const ConversationPanel: React.FC<ConversationPanelProps> = ({
  conversationType,
  referenceId,
  initialMessage
}) => {
  const dispatch = useDispatch();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [inputMessage, setInputMessage] = useState('');
  const currentConversation = useSelector((state: RootState) => state.conversation.currentConversation);

  useEffect(() => {
    const initConversation = async () => {
      try {
        const conversation = await ConversationAPI.createOrGetConversation({
          conversationType,
          referenceId,
          initialMessage
        });
        if (conversation._id) {
          websocketService.joinConversation(conversation._id);
        }
      } catch (error) {
        message.error('初始化会话失败');
      }
    };

    initConversation();

    return () => {
      if (currentConversation?._id) {
        websocketService.leaveConversation(currentConversation._id);
      }
    };
  }, [conversationType, referenceId, initialMessage]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [currentConversation?.messages]);

  const handleSendMessage = () => {
    if (!inputMessage.trim() || !currentConversation?._id) return;

    websocketService.sendMessage(currentConversation._id, inputMessage.trim());
    setInputMessage('');
  };

  const handleExport = async () => {
    if (!currentConversation?._id) return;

    try {
      const { downloadUrl } = await ConversationAPI.exportConversation(currentConversation._id);
      const blob = await ConversationAPI.downloadExportedFile(downloadUrl);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `会话记录_${new Date().toISOString()}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      message.error('导出会话失败');
    }
  };

  const handleClose = async () => {
    if (!currentConversation?._id) return;

    try {
      await ConversationAPI.closeConversation(currentConversation._id);
      dispatch(closeConversation(currentConversation._id));
      message.success('会话已关闭');
    } catch (error) {
      message.error('关闭会话失败');
    }
  };

  const renderMessage = (msg: Message) => {
    const isUser = msg.senderType === 'PATIENT';
    const className = `message ${isUser ? 'user-message' : 'other-message'}`;

    return (
      <div key={msg.timestamp} className={className}>
        <div className="message-content">
          {msg.content}
        </div>
        <div className="message-time">
          {new Date(msg.timestamp).toLocaleTimeString()}
        </div>
      </div>
    );
  };

  return (
    <div className="conversation-panel">
      <div className="conversation-header">
        <h3>{conversationType === 'PRE_DIAGNOSIS' ? '预问诊' : 
             conversationType === 'GUIDE' ? '导诊' : '报告解读'}</h3>
        <Space>
          <Button
            icon={<DownloadOutlined />}
            onClick={handleExport}
            disabled={!currentConversation?.messages.length}
          >
            导出
          </Button>
          <Button
            icon={<CloseOutlined />}
            onClick={handleClose}
            disabled={currentConversation?.status === 'CLOSED'}
            danger
          >
            结束会话
          </Button>
        </Space>
      </div>

      <div className="message-list">
        {currentConversation?.messages.map(renderMessage)}
        <div ref={messagesEndRef} />
      </div>

      <div className="message-input">
        <Input.TextArea
          value={inputMessage}
          onChange={(e) => setInputMessage(e.target.value)}
          placeholder="请输入消息..."
          autoSize={{ minRows: 2, maxRows: 4 }}
          onPressEnter={(e) => {
            if (!e.shiftKey) {
              e.preventDefault();
              handleSendMessage();
            }
          }}
          disabled={currentConversation?.status === 'CLOSED'}
        />
        <Button
          type="primary"
          icon={<SendOutlined />}
          onClick={handleSendMessage}
          disabled={!inputMessage.trim() || currentConversation?.status === 'CLOSED'}
        >
          发送
        </Button>
      </div>
    </div>
  );
};