import React, { useEffect, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Alert, Button, App, UploadFile, Tooltip, Upload, Typography } from 'antd';
import {
    LockOutlined,
    UserOutlined,
    SettingOutlined,
    AudioOutlined,
    FileImageOutlined,
    FilePdfOutlined,
    MenuUnfoldOutlined,
    MenuFoldOutlined,
} from '@ant-design/icons';
import { RootState } from '@/store';
import { addMessage, setCurrentConversation } from '@/store/slices/conversationSlice';
import { ConversationAPI } from '@/services/conversation';
import { ConversationType, Conversation } from '@/types/conversation';
import WebSocketService from '@/services/websocket';
import { XProvider, Welcome, Sender, Bubble } from '@ant-design/x';
import type { BubbleProps } from '@ant-design/x';
import markdownit from 'markdown-it';
import './ChatPage.less';
import VoiceInput from '@/components/VoiceInput';
import SettingsPanel from '@/components/SettingsPanel';
import { UploadChangeParam } from 'antd/es/upload';

const md = markdownit({ html: true, breaks: true });

const renderMarkdown: BubbleProps['messageRender'] = (content) => (
    <Typography>
        <div dangerouslySetInnerHTML={{ __html: md.render(content) }} />
    </Typography>
);

export const ChatPage: React.FC = () => {
  const dispatch = useDispatch();
  const messagesEndRef = useRef<null | HTMLDivElement>(null);
    const currentUser = useSelector((state: RootState) => state.auth.user);
  const { loading, currentConversation } = useSelector((state: RootState) => state.conversation);
  const [userInput, setUserInput] = useState<string>('');
    const { message } = App.useApp();
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
    // 从localStorage读取身份确认状态，如果有则使用，否则默认为false
    const [isIdentityConfirmed, setIsIdentityConfirmed] = useState<boolean>(() => {
        // 检查localStorage中是否有保存的确认状态
        const savedState = localStorage.getItem('identityConfirmed');
        // 如果存在且为当前用户，则返回true
        if (savedState) {
            try {
                const { userId, confirmed } = JSON.parse(savedState);
                // 确保确认状态是针对当前用户的
                return currentUser && userId === currentUser.userId && confirmed;
            } catch (e) {
                console.error('解析保存的确认状态失败:', e);
                return false;
            }
        }
        return false;
    });
  const [wsService] = useState(() => WebSocketService.getInstance());
  const messages = currentConversation?.messages || [];
    const [settingsVisible, setSettingsVisible] = useState(false);
    const { isAuthenticated, user } = useSelector((state: RootState) => state.auth);
    const [attachments, setAttachments] = useState<any[]>([]);

    // 示例推荐问题
    const suggestedQuestions = [
        "为什么有人长期使用药物会自己停药?",
        "金霉素不能吃，为何物过敏症状是?",
        "大麻过量摄入为何比酒更安全?"
    ];

    // 改进WebSocket连接逻辑，在页面刷新时自动重连
useEffect(() => {
  let isComponentMounted = true; // 跟踪组件是否仍然挂载
  
        // 仅当会话ID存在且用户已认证且组件挂载时才连接
        if (currentConversation?.id && isAuthenticated && user && isComponentMounted) {
    console.log('开始连接WebSocket...');
            wsService.connect(currentConversation.id);
    
    // 创建轮询检查连接状态
    const checkConnection = setInterval(() => {
      if (wsService.isConnected() && isComponentMounted) {
        clearInterval(checkConnection);
      }
            }, 2000); // 减少检查间隔

            // 监听socket事件
            const handleReconnect = () => {
                console.log('WebSocket 重新连接成功');
            };

            const handleDisconnect = () => {
                console.log('WebSocket 连接断开');
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
            };
        } else if (!isAuthenticated || !user) {
            console.log('用户未认证，无法建立WebSocket连接');
        }
    }, [currentConversation?.id, isAuthenticated, user, wsService]);

    // 初始化会话
    useEffect(() => {
        const initializeConversation = async () => {
            try {
                const savedConversationJson = localStorage.getItem('currentConversation');
                let savedConversation: Conversation | null = null;

                if (
                    savedConversationJson &&
                    savedConversationJson !== 'undefined' &&
                    savedConversationJson !== 'null'
                ) {
                    try {
                        const parsed = JSON.parse(savedConversationJson);
                        if (parsed && typeof parsed === 'object' && parsed.id) {
                            savedConversation = parsed;
                        }
                    } catch (e) {
                        console.error('Error parsing saved conversation:', e);
                        localStorage.removeItem('currentConversation');
                    }
                }

                if (!savedConversation) {
                    if (!currentUser?.userId) {
                        throw new Error('User ID is required to create a conversation');
                    }

                    const apiResponse = await ConversationAPI.createOrGetConversation({
            conversationType: ConversationType.PRE_DIAGNOSIS, 
                        userId: currentUser.userId,
                        referenceId: '',
                        messages: [],
                    });

                    console.log('API Response:', apiResponse);

                    // 直接使用API返回的数据
                    if (apiResponse && apiResponse.id) {
                        // 确保对象符合Conversation类型定义
                        const conversation: Conversation = {
                            id: apiResponse.id,
                            type: ConversationType.PRE_DIAGNOSIS,
                            referenceId: apiResponse.referenceId || '',
                            patientId: currentUser.userId,
                            messages: apiResponse.messages || [],
                            status: apiResponse.status || 'ACTIVE',
                            startTime: apiResponse.startTime,
                            conversationId: apiResponse.id,
                            consultationId: apiResponse.consultationId,
                        };

                dispatch(setCurrentConversation(conversation));
                        localStorage.setItem('currentConversation', JSON.stringify(conversation));
                    } else {
                        throw new Error('Failed to create conversation: Missing required fields in response');
                    }
              } else {
                    dispatch(setCurrentConversation(savedConversation));
                }
            } catch (error) {
                console.error('Error initializing conversation:', error);
                message.error('Failed to initialize chat. Please try again.');
            }
        };

        initializeConversation();

        // 清理函数
        return () => {
            wsService.disconnect();
        };
    }, [currentUser?.userId]);

    // 滚动到底部的函数
    const scrollToBottom = () => {
        if (messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    };

    // 当消息列表改变时滚动到底部
  useEffect(() => {
    scrollToBottom();
    }, [messages.length]);

    // 组件挂载后和对话初始化后滚动到底部
    useEffect(() => {
        if (currentConversation?.id) {
            setTimeout(scrollToBottom, 100); // 稍微延迟确保DOM已更新
        }
    }, [currentConversation?.id]);

  const handleConfirmIdentity = () => {
    setIsIdentityConfirmed(true);

        // 保存确认状态到localStorage，包含用户ID以确保是当前用户的确认状态
        if (currentUser && currentUser.userId) {
            localStorage.setItem(
                'identityConfirmed',
                JSON.stringify({
                    userId: currentUser.userId,
                    confirmed: true,
                    timestamp: new Date().toISOString(),
                })
            );
        }

        // 构建用户确认信息消息
        if (currentUser) {
            const gender =
                currentUser.gender === 'MALE'
                    ? '男'
                    : currentUser.gender === 'FEMALE'
                        ? '女'
                        : '未设置';

            const userInfoMessage = `我已确认以下信息：
姓名: ${currentUser.name || '未设置'}
手机号: ${currentUser.phone || '未设置'}
性别: ${gender}`;

            // 发送用户确认信息作为消息
            handleSendMessage(userInfoMessage);
        }
    };

    const handleSendMessage = async (content: string) => {
        if (!currentConversation?.id) {
            message.error('会话未初始化，请刷新页面重试');
      return;
    }

        try {
            // 添加用户消息到界面
            dispatch(
                addMessage({
                    content,
                    role: 'user',
                    timestamp: new Date().toISOString(),
                    conversationId: currentConversation.id,
                })
            );

            // 通过WebSocket发送消息
            wsService.sendMessage(content, currentConversation.id);

            // 清空附件列表
            setAttachments([]);
        } catch (error) {
            console.error('发送消息失败:', error);
            message.error('发送消息失败，请重试');
        }
    };

    // 处理附件上传
    const handleAttachmentChange = (info: UploadChangeParam<UploadFile<any>>) => {
        const files = info.fileList || [];
        setAttachments(files);
        console.log('附件已更新:', files);
    };

    // 处理图片上传
    const handleImageUpload = (file: File) => {
        // 检查文件类型
        const isImage = file.type.startsWith('image/');
        if (!isImage) {
            message.error('只能上传图片文件!');
            return false;
        }
        
        // 检查文件大小
        const isLt5M = file.size / 1024 / 1024 < 5;
        if (!isLt5M) {
            message.error('图片必须小于5MB!');
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
            message.error('只能上传PDF或Word文档!');
            return false;
        }
        
        // 检查文件大小
        const isLt10M = file.size / 1024 / 1024 < 10;
        if (!isLt10M) {
            message.error('文件必须小于10MB!');
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

    // 添加一个useEffect，在用户信息变化时处理身份确认状态
    useEffect(() => {
        // 如果当前没有用户（如退出登录状态），清除身份确认
        if (!currentUser) {
            localStorage.removeItem('identityConfirmed');
            setIsIdentityConfirmed(false);
        }
    }, [currentUser]);

    // Handle voice input
    const handleVoiceInput = (text: string) => {
        setUserInput(prev => prev + text);
    };

    // 点击推荐问题
    const handleQuestionClick = (question: string) => {
        handleSendMessage(question);
    };

    // 切换侧边栏
    const toggleSidebar = () => {
        setSidebarCollapsed(!sidebarCollapsed);
    };

  if (loading) {
    return (
      <div className="chat-page">
        <div className="loading-container">
                    <div className="loading-spinner"></div>
                    <p>正在加载对话...</p>
        </div>
      </div>
    );
  }

    if (!currentConversation) {
  return (
    <div className="chat-page">
                <div className="error-container">
                    <p>无法加载对话，请刷新页面重试</p>
                    <button onClick={() => window.location.reload()}>刷新页面</button>
                </div>
            </div>
        );
    }

    // 触发语音输入
    const handleVoiceButton = () => {
        const voiceInputBtn = document.querySelector(
            '.voice-input-button button'
        ) as HTMLButtonElement;
        if (voiceInputBtn) {
            voiceInputBtn.click();
        }
    };

    return (
        <XProvider>
            <div className={`chat-page ${sidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
                <div className="chat-app-header">
                    <div className="header-left">
                        <Button
                            type="text"
                            icon={sidebarCollapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
                            onClick={toggleSidebar}
                            className="sidebar-toggle"
                        />
                        <span className="app-title">AI问诊</span>
                    </div>
                    <div className="header-right">
                        <Button
                            icon={<SettingOutlined />}
                            type="text"
                            onClick={() => setSettingsVisible(true)}
                            aria-label="设置与辅助功能"
                        />
                    </div>
                </div>

                {!isIdentityConfirmed && currentUser ? (
                    <div className="welcome-card fade-in">
                        <h3 className="flex items-center">
                            <UserOutlined className="mr-sm" /> 确认您的身份信息
                        </h3>
                        <div className="info-container">
              <div className="info-row">
                                <span className="label">姓名：</span>
                                <span>{currentUser.name || '未设置'}</span>
              </div>
              <div className="info-row">
                                <span className="label">手机号：</span>
                                <span>{currentUser.phone || '未设置'}</span>
              </div>
              <div className="info-row">
                                <span className="label">性别：</span>
                                <span>
                                    {currentUser.gender === 'MALE'
                                        ? '男'
                                        : currentUser.gender === 'FEMALE'
                                            ? '女'
                                            : '未设置'}
                                </span>
              </div>
            </div>
            <div className="privacy-notice">
              <LockOutlined className="icon" />
                            <span>您的个人信息受到保护，仅用于提供个性化医疗建议</span>
                        </div>
                        <div className="welcome-actions">
                            <button
                                onClick={() => message.info('即将支持身份编辑功能')}
                                className="btn btn-secondary btn-ripple"
                            >
                                修改信息
                            </button>
                            <button
                                className="btn btn-primary btn-ripple"
                                onClick={handleConfirmIdentity}
                            >
                                确认身份
                            </button>
                        </div>
            </div>
                ) : !currentConversation?.id ? (
          <Alert
                        className="error-alert fade-in"
            message="对话初始化失败"
            description="无法启动与健康助手的对话，请刷新页面重试。"
            type="error"
            showIcon
                        action={
                            <Button type="primary" onClick={() => window.location.reload()}>
                                刷新页面
                            </Button>
                        }
          />
        ) : (
                    <div className="conversations-container fade-in">
                        {messages.length === 0 && (
                            <div className="welcome-section">
                                <h2>Hi, {currentUser?.name || '用户'}</h2>
                                <p className="subtitle">你可以询问我</p>
                                <div className="suggested-questions">
                                    {suggestedQuestions.map((question, index) => (
                                        <div
                                            key={index}
                                            className="question-item"
                                            onClick={() => handleQuestionClick(question)}
                                        >
                                            {question}
                                        </div>
                                    ))}
                                </div>
                </div>
                        )}

                        <div className="messages-wrapper">
                            {messages.map(msg =>
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
              )}
              <div ref={messagesEndRef} />
            </div>
                    </div>
                )}

                {(isIdentityConfirmed || currentConversation?.id) && (
                    <div className="sender-container slide-in-up">
                        <Sender
                            disabled={loading || !currentConversation?.id}
                            placeholder="有问题，随时问我"
                            value={userInput}
                            onChange={value => setUserInput(value)}
                            onSubmit={() => {
                                if (userInput.trim()) {
                                    handleSendMessage(userInput);
                                    setUserInput('');
                                }
                            }}
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
                                disabled={loading || !currentConversation?.id}
                                buttonOnly={true}
                            />
      </div>
    </div>
                )}

                {/* Settings panel for accessibility and personalization */}
                <SettingsPanel
                    visible={settingsVisible}
                    onClose={() => setSettingsVisible(false)}
                />

                {/* Loading indicator */}
                {loading && (
                    <div className="loading-indicator">
                        <div className="loading-spinner" />
                        <span className="loading-text">正在处理...</span>
                    </div>
                )}
            </div>
        </XProvider>
  );
};

export default ChatPage;
