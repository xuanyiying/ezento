import React, { useEffect, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  Alert, Avatar, Button, Card, Spin, Typography, message as antdMessage
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

  // 改进WebSocket连接逻辑，在页面刷新时自动重连
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
      }, 2000); // 减少检查间隔
      
      // 监听socket事件
      const handleReconnect = () => {
        console.log('WebSocket 重新连接成功');
        setIsWsConnected(true);
      };
      
      const handleDisconnect = () => {
        console.log('WebSocket 连接断开');
        setIsWsConnected(false);
      };
      
      wsService.onReconnect(handleReconnect);
      wsService.onDisconnect(handleDisconnect);
      
      // 清理函数
      return () => {
        isComponentMounted = false; // 标记组件已卸载
        clearInterval(checkConnection);
        
        // 移除事件监听
        wsService.offReconnect(handleReconnect);
        wsService.offDisconnect(handleDisconnect);
        
        // 仅在之前已连接时才断开
        if (isWsConnected) {
          console.log('组件卸载，断开WebSocket连接');
          wsService.disconnect();
        }
      };
    }
  }, [currentConversation?._id, wsService, isWsConnected]);

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
        antdMessage.error('无法启动对话，请先登录');
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
              antdMessage.error('无法处理会话数据，请稍后再试');
            }
          })
          .catch((error) => {
            console.error('Conversation initialization failed:', error);
            // Log the full error object if available
            if (error.response) {
              console.error('Error Response Data:', error.response.data);
              console.error('Error Response Status:', error.response.status);
            }
            antdMessage.error('无法启动对话，请检查网络或联系管理员');
          })
          .finally(() => {
            dispatch(setLoading(false));
            console.log('Finished conversation initialization attempt.');
          });
      } else {
         // Log why the effect didn't run
         if (!currentUser) console.log('Conversation init skipped: currentUser is null.');
         if (currentConversation) console.log('Conversation init skipped: currentConversation already exists.');
      }
    } else {
       // Log why the effect didn't run
       if (!currentUser) console.log('Conversation init skipped: currentUser is null.');
       if (currentConversation) console.log('Conversation init skipped: currentConversation already exists.');
    }
  }, [currentUser, currentConversation, dispatch]); // Keep dependencies as is for now

  // 改进滚动到底部功能
  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' });
    }
  };

  // 在消息变化和组件挂载时自动滚动到底部
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // 在组件挂载和会话切换时也滚动到底部
  useEffect(() => {
    if (currentConversation) {
      setTimeout(scrollToBottom, 100); // 短暂延迟以确保DOM更新
    }
  }, [currentConversation?._id]);

  const handleConfirmIdentity = () => {
    setIsIdentityConfirmed(true);
    
    // 构建用户确认信息消息
    if (currentUser) {
      const gender = currentUser.gender === 'MALE' ? '男' : 
                    currentUser.gender === 'FEMALE' ? '女' : '未设置';
      
      const userInfoMessage = `我已确认以下信息：
姓名: ${currentUser.name || '未设置'}
手机号: ${currentUser.phone || '未设置'}
性别: ${gender}`;
      
      // 发送用户确认信息作为消息
      handleSendMessage(userInfoMessage);
    }
  };

  const handleSendMessage = (message?: string) => {
    const messageToSend = message || userInput.trim();
    if (!messageToSend) return;

    console.log('用户发送消息:', messageToSend, '当前会话ID:', currentConversation?._id);
    
    // 检查WebSocket连接状态
    const connected = wsService.isConnected();
    console.log('WebSocket连接状态:', connected ? '已连接' : '未连接');
    
    if (!connected) {
      console.log('尝试重新连接WebSocket...');
      wsService.connect(currentConversation?._id || '');
      antdMessage.warning('正在重新连接服务器，请稍后再试');
      return;
    }

    const newMessage: Message = {
      _id: Date.now().toString(),
      content: messageToSend,
      senderType: SenderType.PATIENT,
      conversationId: currentConversation?._id || '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      metadata: {}
    };

    console.log('添加本地消息:', newMessage);
    dispatch(addMessage(newMessage));
    
    // Send message via WebSocket
    console.log('发送WebSocket消息...');
    wsService.sendMessage(messageToSend);
    console.log('WebSocket消息已发送');
    
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
          <Spin size="large">
            <div className="spin-content">正在加载...</div>
          </Spin>
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
                <Button className="btn-outline" onClick={() => antdMessage.info('即将支持身份编辑功能')}>
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
              <div ref={messagesEndRef} style={{ height: 1, clear: 'both' }} />
            </div>
          </>
        )}
      </div>

      {/* 统一显示消息输入框，避免重复 */}
      {(isIdentityConfirmed || currentConversation?._id) && (
        <MessageInput
          onSend={handleSendMessage}
          disabled={loading || !currentConversation?._id}
          placeholder="请输入症状/药品名称/疾病..."
        />
      )}
    </div>
  );
};

export default ChatPage;