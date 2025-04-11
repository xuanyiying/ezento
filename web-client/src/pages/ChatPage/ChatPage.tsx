import React, { useEffect, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  Alert, Avatar, Button, Card, Spin, Typography, message
} from 'antd';
import {
  CheckOutlined, LockOutlined, UserOutlined
} from '@ant-design/icons';
import { RootState } from '../../store';
import {
  addMessage, setLoading, setCurrentConversation
} from '../../store/slices/conversationSlice';
import { ConversationAPI } from '../../services/conversation';
import { Message, SenderType, ConversationType } from '../../types/conversation';
import WebSocketService from '../../services/websocket';
import MessageInput from '../../components/MessageInput';
import './ChatPage.less';

const { Title, Text } = Typography;

export const ChatPage: React.FC = () => {
  const dispatch = useDispatch();
  const messagesEndRef = useRef<null | HTMLDivElement>(null);
  const currentUser = useSelector((state: RootState) => state.authUser.user);
  const { loading, currentConversation } = useSelector((state: RootState) => state.conversation);
  const [userInput, setUserInput] = useState<string>('');
  const [isIdentityConfirmed, setIsIdentityConfirmed] = useState<boolean>(false);
  const [wsService] = useState(() => WebSocketService.getInstance());
  const messages = currentConversation?.messages || [];
  const [isWsConnected, setIsWsConnected] = useState(false);

// 2. 修改WebSocket连接逻辑，添加条件判断并防止过早断开
useEffect(() => {
  let isComponentMounted = true; // 跟踪组件是否仍然挂载
  
  // 仅当会话ID存在且组件挂载时才连接
  if (currentConversation?._id && isComponentMounted) {
    console.log('开始连接WebSocket...');
    wsService.connect(currentConversation._id);
    
    // 创建轮询检查连接状态
    const checkConnection = setInterval(() => {
      if (wsService.isConnected() && isComponentMounted) {
        setIsWsConnected(true);
        clearInterval(checkConnection);
      }
    }, 5000);
    
    // 清理函数
    return () => {
      isComponentMounted = false; // 标记组件已卸载
      clearInterval(checkConnection);
      
      // 仅在之前已连接时才断开
      if (isWsConnected) {
        console.log('组件卸载，断开WebSocket连接');
        wsService.disconnect();
      }
    };
  }
}, [currentConversation?._id]);

    // 修改初始化会话的代码
    useEffect(() => {
      // 如果用户已登录但没有当前会话，自动创建一个会话
      if (currentUser && !currentConversation) {
        console.log('Attempting to create/get conversation...');
        // Log the currentUser object to see its structure
        console.log('Current User:', JSON.stringify(currentUser, null, 2)); 

        dispatch(setLoading(true));
        
        // 确保currentUser不为null并且有有效的ID
        if (!currentUser) {
          console.error('无法创建会话：currentUser为null');
          message.error('无法启动对话，请先登录');
          dispatch(setLoading(false));
          return;
        }
        const userId = currentUser.userId 
        console.log('Using User ID:', userId);
        
        // 只有当userId有值时才创建会话
        if (userId) {
          ConversationAPI.createOrGetConversation({
            conversationType: ConversationType.PRE_DIAGNOSIS, 
            referenceId: userId,
            userId: userId, // Assuming patientId is the same as userId for this context
            initialMessage: '您好，有什么可以帮您的吗？', // Simplified initial message
            messages: [] // Ensure messages array is passed if required by backend
           })
            .then((conversation) => {
              console.log('Conversation created/retrieved successfully:', conversation);
              if (conversation && conversation._id) {
                dispatch(setCurrentConversation(conversation));
              } else {
                // Handle case where backend returns unexpected data
                console.error('Received invalid conversation object:', conversation);
                message.error('无法处理会话数据，请稍后再试');
              }
            })
            .catch((error) => {
              console.error('Conversation initialization failed:', error);
              // Log the full error object if available
              if (error.response) {
                console.error('Error Response Data:', error.response.data);
                console.error('Error Response Status:', error.response.status);
              }
              message.error('无法启动对话，请检查网络或联系管理员');
            })
            .finally(() => {
              dispatch(setLoading(false));
              console.log('Finished conversation initialization attempt.');
            });
        } else {
          console.error('无法创建会话：用户ID不存在');
          message.error('无法启动对话，用户信息不完整');
          dispatch(setLoading(false));
        }
      } else {
         // Log why the effect didn't run
         if (!currentUser) console.log('Conversation init skipped: currentUser is null.');
         if (currentConversation) console.log('Conversation init skipped: currentConversation already exists.');
      }
    }, [currentUser, currentConversation, dispatch]); // Keep dependencies as is for now

  // Auto scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleConfirmIdentity = () => {
    setIsIdentityConfirmed(true);
  };

  const handleSendMessage = () => {
    if (!userInput.trim()) return;

    const newMessage: Message = {
      _id: Date.now().toString(),
      content: userInput.trim(),
      senderType: SenderType.PATIENT,
      conversationId: currentConversation?._id || '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      metadata: {}
    };

    dispatch(addMessage(newMessage));
    
    // Send message via WebSocket
    wsService.sendMessage(userInput.trim());
    
    setUserInput('');
    scrollToBottom();
  };

  // Group messages by date
  const getMessageGroups = () => {
    const groups: Record<string, Message[]> = {};
    
    messages.forEach(msg => {
      const date = new Date(msg.createdAt).toLocaleDateString();
      if (!groups[date]) {
        groups[date] = [];
      }
      groups[date].push(msg);
    });
    
    return groups;
  };

  const renderMessageGroups = () => {
    const groups = getMessageGroups();
    
    return Object.entries(groups).map(([date, msgs]) => (
      <div key={date}>
        <div className="timestamp">{date}</div>
        {msgs.map((msg, index) => (
          <div 
            className={`message ${msg.senderType === SenderType.PATIENT ? 'right' : 'left'}`} 
            key={msg._id || index}
          >
            <Avatar 
              className="avatar" 
              icon={msg.senderType === SenderType.PATIENT ? <UserOutlined /> : <CheckOutlined />}
            />
            <div className="message-content">
              {msg.content}
            </div>
          </div>
        ))}
      </div>
    ));
  };



  if (loading) {
    return (
      <div className="chat-page">
        <div className="loading-container">
          <Spin size="large" tip="正在加载..." />
        </div>
      </div>
    );
  }

  return (
    <div className="chat-page">
      <div className="chat-content">
        {!isIdentityConfirmed && currentUser ? (
          <Card className="identity-card">
            <div className="card-title">
              <UserOutlined className="icon" />
              <Title level={4}>确认您的身份信息</Title>
            </div>
            <div className="card-content">
              <div className="info-row">
                <Text className="label">姓名：</Text>
                <Text>{currentUser.name || '未设置'}</Text>
              </div>
              <div className="info-row">
                <Text className="label">手机号：</Text>
                <Text>{currentUser.phone || '未设置'}</Text>
              </div>
              <div className="info-row">
                <Text className="label">性别：</Text>
                <Text>{currentUser.gender === 'MALE' ? '男' : 
                      currentUser.gender === 'FEMALE' ? '女' : '未设置'}</Text>
              </div>
              <div className="action-buttons">
                <Button className="btn-outline" onClick={() => message.info('即将支持身份编辑功能')}>
                  修改信息
                </Button>
                <Button type="primary" className="btn-primary" onClick={handleConfirmIdentity}>
                  确认身份
                </Button>
              </div>
            </div>
            <div className="privacy-notice">
              <LockOutlined className="icon" />
              <Text type="warning">您的个人信息受到保护，仅用于提供个性化医疗建议</Text>
            </div>
          </Card>
        ) : !currentConversation?._id ? (
          <Alert
            className="error-alert"
            message="对话初始化失败"
            description="无法启动与健康助手的对话，请刷新页面重试。"
            type="error"
            showIcon
          />
        ) : (
          <>
            <div className="message-container">
              {messages.length === 0 ? (
                <div className="empty-messages">
                  <Text type="secondary">对话刚刚开始，发送消息开始咨询吧！</Text>
                </div>
              ) : (
                renderMessageGroups()
              )}
              <div ref={messagesEndRef} />
            </div>
            
            <Card>
              <MessageInput 
                onSend={(message) => {
                  setUserInput(message);
                  handleSendMessage();
                }}
                disabled={!currentConversation?._id}
                placeholder="输入您的问题..."
              />
            </Card>
          </>
        )}
      </div>
    </div>
  );
};

export default ChatPage;