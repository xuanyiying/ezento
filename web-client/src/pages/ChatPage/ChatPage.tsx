import React from 'react';
import { useSelector } from 'react-redux';
import { App, Card } from 'antd';
import { RootState } from '@/store';
import { XProvider } from '@ant-design/x';
import './ChatPage.less';

// 导入拆分的组件和hooks
import ChatHeader from '@/components/Chat/ChatHeader';
import MessageList from '@/components/Chat/MessageList';
import MessageInput from '@/components/Chat/MessageInput';
import IdentityConfirmation from '@/components/Chat/IdentityConfirmation';
import ConversationSidebar from '@/components/ConversationSidebar';
import useConversationManagement from '@/hooks/useConversationManagement';
import useIdentityConfirmation from '@/hooks/useIdentityConfirmation';
import { Types } from '@/types/conversation';

// 角色定义
const ROLE_DEFINITIONS = [
    {
        type: Types.DIAGNOSIS,
        title: '问诊',
        description: '我是你专业的诊前AI医生，有什么问题和疑惑都可以问我，帮助您了解症状和可能的诊断。',
    },
    {
        type: Types.GUIDE,
        title: '导诊',
        description: '我是你专业的导诊AI医生，有什么问题和疑惑都可以问我，帮助您找到合适的科室和医生。',
    },
    {
        type: Types.REPORT,
        title: '报告解读',
        description: '我是你专业的报告解读AI医生，有什么问题和疑惑都可以问我，帮助您理解检查结果。',
    }
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
        createNewConversation,
        selectConversationById,
        deleteConversation,
        sendMessage
    } = useConversationManagement({
        userId: user?.userId,
        isAuthenticated
    });

    // 处理角色选择
    const handleRoleSelect = async (type: Types) => {
        if (!user) {
            message.error('请先登录');
            return;
        }

        try {
            message.loading({ content: '正在初始化会话...', key: 'createConversation' });
            const newConversation = await createNewConversation(type);
            if (newConversation) {
                const roleInfo = ROLE_DEFINITIONS.find(role => role.type === type);
                const welcomeMessage = `您好，我是${roleInfo?.title}助手。${roleInfo?.description}`;
                await sendMessage(welcomeMessage, newConversation.id);
                message.success({ content: '会话创建成功', key: 'createConversation' });
            }
        } catch (error) {
            message.error({ content: '创建会话失败，请重试', key: 'createConversation' });
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

    // 切换侧边栏
    const toggleSidebar = () => {
        setSidebarCollapsed(!sidebarCollapsed);
        localStorage.setItem('sidebarCollapsed', (!sidebarCollapsed).toString());
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
                        onCreateNewConversation={() => {}} // 禁用侧边栏的创建会话功能
                        currentConversationId={currentConversation?.id}
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
                                onConfirm={confirmIdentity}
                            />
                        ) : !currentConversation?.id ? (
                            <div className="role-selection-container">
                                <h2>请选择服务类型</h2>
                                <div className="role-cards">
                                    {ROLE_DEFINITIONS.map(role => (
                                        <Card
                                            key={role.type}
                                            className="role-card"
                                            hoverable
                                            onClick={() => handleRoleSelect(role.type)}
                                        >
                                            <h3>{role.title}</h3>
                                            <p>{role.description}</p>
                                            <button className="select-button">
                                                开始{role.title}
                                        </button>
                                        </Card>
                                    ))}
                                    </div>
            </div>
        ) : (
                            <div className="conversations-container fade-in">
                                <MessageList
                                    messages={currentConversation?.messages || []}
                                    username={user?.name}
                                />
                                
                                <MessageInput
                                    onSendMessage={handleSendMessage}
                                                disabled={loading || !currentConversation?.id}
                                            />
                            </div>
        )}
      </div>
    </div>

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
