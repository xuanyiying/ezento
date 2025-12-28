import React from 'react';
import { useSelector } from 'react-redux';
import { App, Card, message } from 'antd';
import { RootState } from '@/store';
import { XProvider } from '@ant-design/x';
import './ChatPage.less';

// 导入拆分的组件和hooks
import ChatHeader from '@/components/Chat/ChatHeader';
import MessageList from '@/components/Chat/MessageList';
import MessageInput from '@/components/Chat/MessageInput';
import IdentityConfirmation from '@/components/Chat/IdentityConfirmation';
import ConversationSidebar from '@/components/ConversationSidebar';
import {useConversationManagement} from '@/hooks/useConversationManagement';
import useIdentityConfirmation from '@/hooks/useIdentityConfirmation';

// AI角色定义 - 从API获取
import { AiRoleAPI } from '@/services/ai.role';
import { AiRole } from '@/types/ai.role';
// const [roleDefinitions, setRoleDefinitions] = React.useState<AiRole[]>([]); // Moved inside component

// // 获取AI角色定义 // Moved inside component
// React.useEffect(() => {
//     const fetchRoles = async () => {
//         try {
//             const response = await AiRoleAPI.getAllRoles();
//             if (response.success && response.data.roles) {
//                 setRoleDefinitions(response.data.roles);
//             }
//         } catch (error) {
//             console.error('获取角色定义出错:', error);
//         }
//     };
// 
//     fetchRoles();
// }, [message]);

export const ChatPage: React.FC = () => {
    const { loading, currentConversation } = useSelector((state: RootState) => state.conversation);
    const { isAuthenticated, user } = useSelector((state: RootState) => state.auth);
    const { message } = App.useApp();

    // State for AI role definitions
    const [roleDefinitions, setRoleDefinitions] = React.useState<AiRole[]>([]);
    // State for the currently selected AI role by the user
    const [selectedAiRole, setSelectedAiRole] = React.useState<AiRole | undefined>(undefined);

    // Fetch AI role definitions on component mount
    React.useEffect(() => {
        const fetchRoles = async () => {
            try {
                const response = await AiRoleAPI.getAllRoles();
                if (response.success && response.data.roles) {
                    setRoleDefinitions(response.data.roles);
                    // Optionally, set initial selectedAiRole based on currentConversation if it exists
                    if (currentConversation?.type) {
                        const initialRole = response.data.roles.find(role => role.type === currentConversation.type);
                        setSelectedAiRole(initialRole);
                    }
                } else {
                    message.error('获取服务类型列表失败');
                }
            } catch (error) {
                console.error('获取角色定义出错:', error);
                message.error('获取服务类型列表失败，请稍后重试');
            }
        };

        fetchRoles();
    }, [message]); // Consider if message is a stable dependency

    // 使用自定义hooks
    const { isIdentityConfirmed, confirmIdentity } = useIdentityConfirmation(user);

    // // 角色定义 - No longer needed here, use selectedAiRole state
    // const aiRole = roleDefinitions.find(role => role.type === currentConversation?.type);
    
    // 侧边栏显示/隐藏
    const [sidebarCollapsed, setSidebarCollapsed] = React.useState(() => {
        return localStorage.getItem('sidebarCollapsed') === 'true';
    });

    // 会话管理 - Pass selectedAiRole state to the hook
    const {
        createNewConversation,
        selectConversationById,
        deleteConversation,
        handleSendMessage, // Use the renamed function from the hook
        initializeConversation // Add initializeConversation if needed
    } = useConversationManagement({
        userId: user?.userId,
        isAuthenticated,
        aiRole: selectedAiRole // Pass the state variable here
    });

    // Initialize conversation when role is selected or component mounts with a role
    React.useEffect(() => {
        if (isAuthenticated && user?.userId && selectedAiRole && !currentConversation) {
            initializeConversation();
        }
        // Add dependency on selectedAiRole to re-initialize if role changes and no conversation exists
    }, [isAuthenticated, user?.userId, selectedAiRole, currentConversation, initializeConversation]);

    // 处理角色选择
    const handleRoleSelect = async (id: string) => {
        if (!user) {
            message.error('请先登录');
            return;
        }

        try {
            const roleToSelect = roleDefinitions.find(role => role.id === id);
            if (!roleToSelect) {
                message.error('角色不存在');
                return;
            }
            setSelectedAiRole(roleToSelect); // Update the selected role state
            
            message.loading({ content: '正在创建新会话...', key: 'createConversation' });
            const newConversation = await createNewConversation(roleToSelect); // Pass the selected role
            if (newConversation) {
                // Welcome message might be handled within the hook or backend now
                // Consider removing this if redundant
                // const welcomeMessage = `您好，我是${roleToSelect?.title}助手。${roleToSelect?.description}`;
                // await handleSendMessage(welcomeMessage, newConversation.id);
                message.success({ content: '新会话已创建', key: 'createConversation' });
            } else {
                 // If createNewConversation returns null, the error is handled within the hook
                 // message.error({ content: '创建会话失败，请重试', key: 'createConversation' });
            }
        } catch (error) {
            // Error handling might be centralized in the hook now
            console.error('处理角色选择时出错:', error);
            message.error({ content: '选择服务类型时出错，请重试', key: 'createConversation' });
        }
    };

    // // 处理发送消息 - Renamed in the hook to handleSendMessage
    // const handleSendMessage = (content: string) => {
    //     if (currentConversation?.id) {
    //         sendMessage(content, currentConversation.id);
    //     } else {
    //         message.error('会话未初始化，请刷新页面重试');
    //     }
    // };

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
    if (loading && !currentConversation) { // Show loading only if truly initializing
        return (
            <div className="chat-page">
                <div className="loading-container">
                    <div className="loading-spinner"></div>
                    <p>正在加载...</p> {/* Simplified message */}
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
                        onSelectConversation={async (id) => {
                            const conv = await selectConversationById(id);
                            if (conv?.type) {
                                const role = roleDefinitions.find(r => r.type === conv.type);
                                setSelectedAiRole(role);
                            }
                        }}
                        onCreateNewConversation={() => setSelectedAiRole(undefined)} // Reset selected role to show selection screen
                        currentConversationId={currentConversation?.id}
                        onDeleteConversation={(id) => {
                            console.log('删除会话:', id, '当前会话ID:', currentConversation?.id);
                            deleteConversation(id, currentConversation?.id);
                            // If deleting current, reset role selection
                            if (id === currentConversation?.id) {
                                setSelectedAiRole(undefined);
                            }
                        }}
                        onRenameConversation={(id, newTitle) => {
                            console.log('重命名会话:', id, newTitle);
                            // renameConversation(id, newTitle); // Assuming renameConversation exists in the hook
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
                        ) : !selectedAiRole && !currentConversation ? ( // Show role selection if no role selected AND no active conversation
                            <div className="role-selection-container">
                                <h2>请选择服务类型</h2>
                                <div className="role-cards">
                                    {roleDefinitions.length > 0 ? roleDefinitions.map(role => (
                                        <Card
                                            key={role.id} // Use role.id as key if unique
                                            className="role-card"
                                            hoverable
                                            onClick={() => handleRoleSelect(role.id)}
                                        >
                                            <h3>{role.title}</h3>
                                            <p>{role.description}</p>
                                            <button className="select-button">
                                                开始{role.title}
                                            </button>
                                        </Card>
                                    )) : <p>正在加载服务类型...</p>}
                                </div>
                            </div>
                        ) : currentConversation ? ( // Show chat if a conversation is active
                            <div className="conversations-container fade-in">
                                <MessageList
                                    messages={currentConversation?.messages || []}
                                    username={user?.name}
                                />

                                <MessageInput
                                    onSendMessage={(content) => handleSendMessage(content, currentConversation.id)} // Use handleSendMessage from hook
                                    disabled={loading || !currentConversation?.id}
                                />
                            </div>
                        ) : (
                             // Optional: Show a loading or intermediate state if role selected but conversation not yet loaded
                             <div className="loading-container">
                                <div className="loading-spinner"></div>
                                <p>正在准备对话...</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* More specific loading indicator if needed */}
                {/* {loading && (
                    <div className="loading-indicator">
                        <div className="loading-spinner" />
                        <span className="loading-text">正在处理...</span>
                    </div>
                )} */}
            </div>
        </XProvider>
    );
};

export default ChatPage;
