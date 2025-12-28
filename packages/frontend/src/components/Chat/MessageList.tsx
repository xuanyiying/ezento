import React, { useMemo, useRef, useEffect } from 'react';
import { Typography, Avatar } from 'antd';
import { Welcome, Bubble } from '@ant-design/x';
import MarkdownIt from 'markdown-it/index.js';
import { Message } from '@/types/conversation';
import './ChatComponents.less';
import './MessageList.less';
import { UserOutlined, RobotOutlined } from '@ant-design/icons';

// 配置 Markdown 渲染器
const md = new MarkdownIt({
  html: true,       // 启用 HTML 标签
  breaks: true,     // 将换行符转换为 <br>
  linkify: true,    // 自动将 URL 转换为链接
  typographer: true // 启用一些语言中立的替换和引号
});

interface MessageListProps {
  messages: Message[];
  suggestedQuestions?: string[];
  onQuestionClick?: (question: string) => void;
  username?: string;
}

const MessageList: React.FC<MessageListProps> = ({
  messages,
  suggestedQuestions = [],
  onQuestionClick,
  username = '用户'
}) => {
  const messagesEndRef = useRef<null | HTMLDivElement>(null);

  // 滚动到底部
  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // 监听消息变化，自动滚动
  useEffect(() => {
    if (messages.length > 0) {
      requestAnimationFrame(scrollToBottom);
    }
  }, [messages.length]);

  // 渲染markdown内容
  const renderMarkdown = (content: string) => (
    <Typography>
      <div className="markdown-content" dangerouslySetInnerHTML={{ __html: md.render(content) }} />
    </Typography>
  );

  // 缓存消息列表渲染结果
  const renderedMessages = useMemo(() => {
    return messages.map(msg =>
      msg.role === 'system' ? (
        <Welcome
          key={msg.id}
          variant="filled"
          title="医疗助手"
          description={msg.content}
          icon={
            <img
              src="/assets/assistant-avatar.svg"
              alt="AI助手"
              style={{
                width: 40,
                height: 40,
                borderRadius: '50%',
              }}
            />
          }
        />
      ) : (
        <div className={`message-container ${msg.role}-message`} key={msg.id}>
          <Bubble
            content={msg.content}
            messageRender={renderMarkdown}
            variant={msg.role === 'user' ? 'filled' : 'outlined'}
            avatar={msg.role !== 'user' ? {
              src: "/assets/assistant-avatar.svg"
            } : undefined}
          />
        </div>
      )
    );
  }, [messages]);

  return (
    <div className="messages-wrapper">
      {messages.length === 0 && (
        <div className="welcome-section">
          <h2>Hi, {username}</h2>
          <p className="subtitle">你可以询问我</p>
          <div className="suggested-questions">
            {suggestedQuestions.map((question, index) => (
              <div
                key={index}
                className="question-item"
                onClick={() => onQuestionClick && onQuestionClick(question)}
              >
                {question}
              </div>
            ))}
          </div>
        </div>
      )}
      {renderedMessages}
      <div ref={messagesEndRef} />
    </div>
  );
};

export default MessageList; 