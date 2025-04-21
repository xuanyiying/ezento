import React, { useEffect } from 'react';
import { useSelector } from 'react-redux';
import { Alert, Button, App } from 'antd';
import { RootState } from '@/store';
import { XProvider } from '@ant-design/x';
import './ChatPage.less';

// 导入拆分的组件和hooks
import ChatHeader from '@/components/Chat/ChatHeader';
import MessageList from '@/components/Chat/MessageList';
import MessageInput from '@/components/Chat/MessageInput';
import IdentityConfirmation from '@/components/Chat/IdentityConfirmation';
import ConversationSidebar from '@/components/ConversationSidebar';
import useWebSocketConnection from '@/hooks/useWebSocketConnection';
import useConversationManagement from '@/hooks/useConversationManagement';
import useIdentityConfirmation from '@/hooks/useIdentityConfirmation';

// 示例推荐问题
const SUGGESTED_QUESTIONS = [
    "为什么有人长期使用药物会自己停药?",
    "金霉素不能吃，为何物过敏症状是?",
    "高烧不退，怎么办?"
];

export const ChatPage: React.FC = () => {
    const { loading, currentConversation } = useSelector((state: RootState) => state.conversation);
    const { isAuthenticated, user } = useSelector((state: RootState) => state.auth);
    const { message } = App.useApp();
    
    // 使用自定义hooks
    const { isIdentityConfirmed, confirmIdentity } = useIdentityConfirmation(user);
    
    // 侧边栏显示/隐藏
    const [sidebarCollapsed, setSidebarCollapsed] = React.useState(() => {
        return localStorage.getItem('sidebarCollapsed') === 'true';
    });
    
    // 会话管理
    const {
        initializeConversation,
        createNewConversation,
        selectConversationById,
        deleteConversation,
        sendMessage
    } = useConversationManagement({
        userId: user?.userId,
        isAuthenticated
    });
    
    // WebSocket连接
    const wsService = useWebSocketConnection(
        currentConversation?.id,
        isAuthenticated,
        user?.userId
    );

    // 初始化会话
    useEffect(() => {
        if (isAuthenticated && user?.userId) {
            console.log('初始化会话，用户ID:', user.userId);
            initializeConversation();
        }
    }, [isAuthenticated, user?.userId, initializeConversation]);

    // 确认用户身份
    const handleConfirmIdentity = () => {
        confirmIdentity();

        // 构建用户确认信息消息
        if (user && currentConversation?.id) {
            const gender =
                user.gender === 'MALE'
                    ? '男'
                    : user.gender === 'FEMALE'
                        ? '女'
                        : '未设置';

            const userInfoMessage = `我已确认以下信息：
姓名: ${user.name || '未设置'}
手机号: ${user.phone || '未设置'}
性别: ${gender}`;

            // 发送用户确认信息作为消息
            sendMessage(userInfoMessage, currentConversation.id);
        }
    };

    // 处理发送消息
    const handleSendMessage = (content: string) => {
        if (currentConversation?.id) {
            sendMessage(content, currentConversation.id);
        } else {
            message.error('会话未初始化，请刷新页面重试');
        }
    };

    // 处理推荐问题点击
    const handleQuestionClick = (question: string) => {
        handleSendMessage(question);
    };

    // 切换侧边栏
    const toggleSidebar = () => {
        setSidebarCollapsed(!sidebarCollapsed);
        
        // 保存偏好到localStorage
        localStorage.setItem('sidebarCollapsed', (!sidebarCollapsed).toString());
        
        // 强制重新计算布局
        document.body.classList.add('sidebar-toggling');
        setTimeout(() => {
            document.body.classList.remove('sidebar-toggling');
        }, 300);
    };

    // 加载状态
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

    // 错误状态
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

    console.log('ChatPage渲染，当前会话ID:', currentConversation.id);
    
    return (
        <XProvider>
            <div className={`chat-page ${sidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
                <ChatHeader 
                    sidebarCollapsed={sidebarCollapsed} 
                    toggleSidebar={toggleSidebar}
                    user={{
                        name: user?.name,
                        avatar: user?.avatar,
                        userId: user?.userId
                    }}
                />
                
                <div className="page-content">
                    <ConversationSidebar
                        onSelectConversation={selectConversationById}
                        onCreateNewConversation={createNewConversation}
                        currentConversationId={currentConversation?.id}
                        conversations={[]}
                        onDeleteConversation={(id) => {
                            console.log('删除会话:', id, '当前会话ID:', currentConversation?.id);
                            deleteConversation(id, currentConversation?.id);
                        }}
                        onRenameConversation={(id, newTitle) => {
                            console.log('重命名会话:', id, newTitle);
                        }}
                        className={sidebarCollapsed ? "collapsed" : ""}
                    />
                    
                    <div className="main-content">
                        {/* 身份确认 */}
                        {!isIdentityConfirmed && user ? (
                            <IdentityConfirmation
                                user={user}
                                onConfirm={handleConfirmIdentity}
                            />
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
                                {/* 消息列表 */}
                                <MessageList
                                    messages={currentConversation.messages}
                                    suggestedQuestions={SUGGESTED_QUESTIONS}
                                    onQuestionClick={handleQuestionClick}
                                    username={user?.name}
                                />
                                
                                {/* 消息输入框 */}
                                {(isIdentityConfirmed || currentConversation?.id) && (
                                    <MessageInput
                                        onSendMessage={handleSendMessage}
                                        disabled={loading || !currentConversation?.id}
                                    />
                                )}
                            </div>
                        )}
                    </div>
                </div>

                {/* 加载指示器 */}
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
