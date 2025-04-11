import React, { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../../store';
import { Message, addMessage } from '../../store/slices/conversationSlice';
import MessageBubble from '../MessageBubble/MessageBubble';
import UserCard from '../UserCard/UserCard';
import './ConversationPanel.css';

interface ConversationPanelProps {
  conversationType: 'PRE_DIAGNOSIS' | 'GUIDE' | 'REPORT';
}

const ConversationPanel: React.FC<ConversationPanelProps> = ({ conversationType }) => {
  const [inputMessage, setInputMessage] = useState('');
  const dispatch = useDispatch();
  const currentConversation = useSelector((state: RootState) => state.conversation.currentConversation);

  const handleSendMessage = () => {
    if (!inputMessage.trim() || !currentConversation) return;

    const newMessage: Message = {
      content: inputMessage,
      senderType: 'PATIENT',
      timestamp: new Date().toISOString(),
    };

    dispatch(addMessage(newMessage));
    setInputMessage('');
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const getTitle = () => {
    switch (conversationType) {
      case 'PRE_DIAGNOSIS':
        return '预问诊';
      case 'GUIDE':
        return '导诊';
      case 'REPORT':
        return '报告解读';
      default:
        return '';
    }
  };

  if (!currentConversation) return null;

  return (
    <div className="conversation-panel">
      <div className="conversation-header">
        <h2>{getTitle()}</h2>
      </div>

      <div className="conversation-content">
        <UserCard
          name="张三"
          age={24}
          gender="女"
          phone="18744440001"
          id="1001"
        />

        <div className="messages-container">
          {currentConversation.messages.map((message, index) => (
            <MessageBubble key={index} message={message} />
          ))}
        </div>
      </div>

      <div className="conversation-input">
        <textarea
          value={inputMessage}
          onChange={(e) => setInputMessage(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="输入消息..."
        />
        <button
          className="send-button"
          onClick={handleSendMessage}
          disabled={!inputMessage.trim()}
        >
          发送
        </button>
      </div>
    </div>
  );
};

export default ConversationPanel;