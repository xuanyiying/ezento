import React, { useState, useEffect, useMemo } from 'react';
import { Input, Button, List, Popconfirm, Tooltip, App } from 'antd';
import {
    PlusOutlined,
    SearchOutlined,
    DeleteOutlined,
    EditOutlined,
    StarOutlined,
    StarFilled,
} from '@ant-design/icons';
import { useSelector } from 'react-redux';
import { useAppDispatch } from '@/store/hooks';
import { RootState } from '@/store';
import {
    deleteConversation,
    renameConversation,
    toggleFavorite,
    fetchUserConversations
} from '@/store/slices/conversationSlice';
import './ConversationSidebar.less';

interface ConversationSidebarProps {
    onSelectConversation: (conversationId: string) => void;
    onCreateNewConversation: () => void;
    currentConversationId?: string;
    conversations: any[];
    onDeleteConversation: (id: string) => void;
    onRenameConversation: (id: string, newTitle: string) => void;
    className?: string;
}

const ConversationSidebar: React.FC<ConversationSidebarProps> = ({
    onSelectConversation,
    onCreateNewConversation,
    currentConversationId,
    className,
    onDeleteConversation,
}) => {
    const dispatch = useAppDispatch();
    const [searchText, setSearchText] = useState('');
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editingTitle, setEditingTitle] = useState('');
    const { message } = App.useApp();
    const { conversations, loading } = useSelector((state: RootState) => state.conversation);

    // 获取会话列表
    useEffect(() => {
        const fetchConversations = async () => {
            try {
                // 使用新的异步 action creator 获取会话数据
                await dispatch(fetchUserConversations() as any);
            } catch (error) {
                console.error('获取会话列表失败:', error);
                message.error('获取会话列表失败，请重试');
            }
        };

        // 初始加载会话列表
        fetchConversations();

        // 监听storage事件，当其他页面更新localStorage时更新会话列表
        const handleStorageChange = (event: StorageEvent) => {
            // 只在相关的storage key发生变化时才更新
            if (event.key === 'conversations' || event.key === 'currentConversation') {
                fetchConversations();
            }
        };

        // 添加页面可见性变化监听，在重新聚焦时同步数据
        const handleVisibilityChange = () => {
            if (document.visibilityState === 'visible') {
                console.log('页面获得焦点，同步会话数据...');
                fetchConversations();
            }
        };

        window.addEventListener('storage', handleStorageChange);
        document.addEventListener('visibilitychange', handleVisibilityChange);
        
        // 定期同步（每5分钟）
        const syncInterval = setInterval(fetchConversations, 5 * 60 * 1000);
        
        return () => {
            window.removeEventListener('storage', handleStorageChange);
            document.removeEventListener('visibilitychange', handleVisibilityChange);
            clearInterval(syncInterval);
        };
    }, [dispatch, message]);

    // 处理删除会话
    const handleDeleteConversation = (id: string) => {
        try {
            // 调用props中的onDeleteConversation回调，让父组件处理API调用
            if (onDeleteConversation) {
                onDeleteConversation(id);
                message.success('会话已删除');
            } else {
                // 如果没有提供回调，则尝试使用Redux中的action
                dispatch(deleteConversation(id) as any);
                message.success('会话已删除');
            }
        } catch (error) {
            console.error('删除会话失败:', error);
            message.error('删除会话失败，请重试');
        }
    };

    // 处理重命名会话
    const handleRenameConversation = (id: string) => {
        if (!editingTitle.trim()) {
            message.warning('请输入有效的会话名称');
            return;
        }

        try {
            dispatch(
                renameConversation({
                    id,
                    title: editingTitle,
                })
            );
            setEditingId(null);
            setEditingTitle('');
            message.success('会话已重命名');
        } catch (error) {
            console.error('重命名会话失败:', error);
            message.error('重命名会话失败，请重试');
        }
    };

    // 切换收藏状态
    const handleToggleFavorite = (id: string) => {
        try {
            dispatch(toggleFavorite(id));
        } catch (error) {
            console.error('切换收藏状态失败:', error);
            message.error('操作失败，请重试');
        }
    };

    // 按搜索文本和收藏状态过滤会话
    const filteredConversations = useMemo(() => {
        let filtered = [...conversations];

        // 如果有搜索文本，过滤出标题包含搜索文本的会话
        if (searchText) {
            filtered = filtered.filter(
                (conv) =>
                    conv.title &&
                    conv.title.toLowerCase().includes(searchText.toLowerCase())
            );
        }

        // 按日期排序，最近的会话在前面
        filtered.sort((a, b) => {
            // 收藏的会话置顶
            if (a.favorite && !b.favorite) return -1;
            if (!a.favorite && b.favorite) return 1;

            // 然后按时间降序排序
            const timeA = new Date(a.startTime || a.timestamp || 0).getTime();
            const timeB = new Date(b.startTime || b.timestamp || 0).getTime();
            return timeB - timeA;
        });

        return filtered;
    }, [conversations, searchText]);

    // 将会话分组为"今天"、"昨天"和"更早"
    const groupedConversations = useMemo(() => {
        const result = {
            today: [] as any[],
            yesterday: [] as any[],
            earlier: [] as any[],
        };

        const now = new Date();
        const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
        const yesterdayStart = new Date(
            now.getFullYear(),
            now.getMonth(),
            now.getDate() - 1
        ).getTime();

        filteredConversations.forEach((conv) => {
            const convTime = new Date(conv.startTime || conv.timestamp || 0).getTime();

            if (convTime >= todayStart) {
                result.today.push(conv);
            } else if (convTime >= yesterdayStart) {
                result.yesterday.push(conv);
            } else {
                result.earlier.push(conv);
            }
        });

        return result;
    }, [filteredConversations]);

    return (
        <div className={`conversation-sidebar ${className || ''}`}>
            <div className="sidebar-header">
                <h2>对话历史</h2>
                <Button
                    type="primary"
                    icon={<PlusOutlined />}
                    onClick={onCreateNewConversation}
                    loading={loading}
                >
                    新对话
                </Button>
            </div>

            <div className="search-container">
                <Input
                    placeholder="搜索会话"
                    prefix={<SearchOutlined />}
                    value={searchText}
                    onChange={(e) => setSearchText(e.target.value)}
                    allowClear
                />
            </div>

            <div className="conversations-list">
                {loading ? (
                    <div className="loading-state">加载中...</div>
                ) : filteredConversations.length === 0 ? (
                    <div className="empty-state">
                        <p>暂无对话历史</p>
                        <Button type="primary" onClick={onCreateNewConversation}>
                            开始新对话
                        </Button>
                    </div>
                ) : (
                    <>
                        {groupedConversations.today.length > 0 && (
                            <div className="conversation-group">
                                <div className="group-header">今天</div>
                                <List
                                    dataSource={groupedConversations.today}
                                    renderItem={(item) => (
                                        <div
                                            className={`conversation-item ${currentConversationId === item.id ? 'active' : ''
                                                }`}
                                            onClick={() => onSelectConversation(item.id)}
                                        >
                                            {editingId === item.id ? (
                                                <div
                                                    className="editing-container"
                                                    onClick={(e) => e.stopPropagation()}
                                                >
                                                    <Input
                                                        value={editingTitle}
                                                        onChange={(e) =>
                                                            setEditingTitle(e.target.value)
                                                        }
                                                        onPressEnter={() =>
                                                            handleRenameConversation(item.id)
                                                        }
                                                    />
                                                    <div className="editing-actions">
                                                        <Button
                                                            size="small"
                                                            onClick={() =>
                                                                handleRenameConversation(item.id)
                                                            }
                                                        >
                                                            保存
                                                        </Button>
                                                        <Button
                                                            size="small"
                                                            onClick={() => setEditingId(null)}
                                                        >
                                                            取消
                                                        </Button>
                                                    </div>
                                                </div>
                                            ) : (
                                                <>
                                                    <div className="conversation-title">
                                                        {item.title || '无标题会话'}
                                                    </div>
                                                    <div className="conversation-actions">
                                                        <Tooltip title={item.favorite ? '取消收藏' : '收藏'}>
                                                            <Button
                                                                type="text"
                                                                icon={
                                                                    item.favorite ? (
                                                                        <StarFilled style={{ color: '#faad14' }} />
                                                                    ) : (
                                                                        <StarOutlined />
                                                                    )
                                                                }
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    handleToggleFavorite(item.id);
                                                                }}
                                                            />
                                                        </Tooltip>
                                                        <Tooltip title="重命名">
                                                            <Button
                                                                type="text"
                                                                icon={<EditOutlined />}
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    setEditingId(item.id);
                                                                    setEditingTitle(
                                                                        item.title || '无标题会话'
                                                                    );
                                                                    handleRenameConversation(item.id);
                                                                }}
                                                            />
                                                        </Tooltip>
                                                        <Tooltip title="删除">
                                                            <Popconfirm
                                                                title="删除此会话"                                        
                                                                description="确定要删除此会话吗？"
                                                                onConfirm={() => handleDeleteConversation(item.id)}
                                                                okText="确定"
                                                                cancelText="取消"
                                                            >
                                                                <Button
                                                                    danger
                                                                    icon={<DeleteOutlined />}
                                                                
                                                                    
                                                                />
                                                            </Popconfirm>
                                                        </Tooltip>
                                                    </div>
                                                </>
                                            )}
                                        </div>
                                    )}
                                />
                            </div>
                        )}

                        {groupedConversations.yesterday.length > 0 && (
                            <div className="conversation-group">
                                <div className="group-header">昨天</div>
                                <List
                                    dataSource={groupedConversations.yesterday}
                                    renderItem={(item) => (
                                        <div
                                            className={`conversation-item ${currentConversationId === item.id ? 'active' : ''
                                                }`}
                                            onClick={() => onSelectConversation(item.id)}
                                        >
                                            {editingId === item.id ? (
                                                <div
                                                    className="editing-container"
                                                    onClick={(e) => e.stopPropagation()}
                                                >
                                                    <Input
                                                        value={editingTitle}
                                                        onChange={(e) =>
                                                            setEditingTitle(e.target.value)
                                                        }
                                                        onPressEnter={() =>
                                                            handleRenameConversation(item.id)
                                                        }
                                                    />
                                                    <div className="editing-actions">
                                                        <Button
                                                            size="small"
                                                            onClick={() =>
                                                                handleRenameConversation(item.id)
                                                            }
                                                        >
                                                            保存
                                                        </Button>
                                                        <Button
                                                            size="small"
                                                            onClick={() => setEditingId(null)}
                                                        >
                                                            取消
                                                        </Button>
                                                    </div>
                                                </div>
                                            ) : (
                                                <>
                                                    <div className="conversation-title">
                                                        {item.title || '无标题会话'}
                                                    </div>
                                                    <div className="conversation-actions">
                                                        <Tooltip title={item.favorite ? '取消收藏' : '收藏'}>
                                                            <Button
                                                                type="text"
                                                                icon={
                                                                    item.favorite ? (
                                                                        <StarFilled style={{ color: '#faad14' }} />
                                                                    ) : (
                                                                        <StarOutlined />
                                                                    )
                                                                }
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    handleToggleFavorite(item.id);
                                                                }}
                                                            />
                                                        </Tooltip>
                                                        <Tooltip title="重命名">
                                                            <Button
                                                                type="text"
                                                                icon={<EditOutlined />}
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    setEditingId(item.id);
                                                                    setEditingTitle(
                                                                        item.title || '无标题会话'
                                                                    );
                                                                }}
                                                            />
                                                        </Tooltip>
                                                        <Tooltip title="删除">
                                                            <Popconfirm
                                                                title="确定要删除此会话吗？"
                                                                onConfirm={(e) => {
                                                                    e?.stopPropagation();
                                                                    handleDeleteConversation(item.id);
                                                                }}
                                                                okText="确定"
                                                                cancelText="取消"
                                                            >
                                                                <Button
                                                                    type="text"
                                                                    danger
                                                                    icon={<DeleteOutlined />}
                                                                    onClick={(e) => e.stopPropagation()}
                                                                />
                                                            </Popconfirm>
                                                        </Tooltip>
                                                    </div>
                                                </>
                                            )}
                                        </div>
                                    )}
                                />
                            </div>
                        )}

                        {groupedConversations.earlier.length > 0 && (
                            <div className="conversation-group">
                                <div className="group-header">更早</div>
                                <List
                                    dataSource={groupedConversations.earlier}
                                    renderItem={(item) => (
                                        <div
                                            className={`conversation-item ${currentConversationId === item.id ? 'active' : ''
                                                }`}
                                            onClick={() => onSelectConversation(item.id)}
                                        >
                                            {editingId === item.id ? (
                                                <div
                                                    className="editing-container"
                                                    onClick={(e) => e.stopPropagation()}
                                                >
                                                    <Input
                                                        value={editingTitle}
                                                        onChange={(e) =>
                                                            setEditingTitle(e.target.value)
                                                        }
                                                        onPressEnter={() =>
                                                            handleRenameConversation(item.id)
                                                        }
                                                    />
                                                    <div className="editing-actions">
                                                        <Button
                                                            size="small"
                                                            onClick={() =>
                                                                handleRenameConversation(item.id)
                                                            }
                                                        >
                                                            保存
                                                        </Button>
                                                        <Button
                                                            size="small"
                                                            onClick={() => setEditingId(null)}
                                                        >
                                                            取消
                                                        </Button>
                                                    </div>
                                                </div>
                                            ) : (
                                                <>
                                                    <div className="conversation-title">
                                                        {item.title || '无标题会话'}
                                                    </div>
                                                    <div className="conversation-actions">
                                                        <Tooltip title={item.favorite ? '取消收藏' : '收藏'}>
                                                            <Button
                                                                type="text"
                                                                icon={
                                                                    item.favorite ? (
                                                                        <StarFilled style={{ color: '#faad14' }} />
                                                                    ) : (
                                                                        <StarOutlined />
                                                                    )
                                                                }
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    handleToggleFavorite(item.id);
                                                                }}
                                                            />
                                                        </Tooltip>
                                                        <Tooltip title="重命名">
                                                            <Button
                                                                type="text"
                                                                icon={<EditOutlined />}
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    setEditingId(item.id);
                                                                    setEditingTitle(
                                                                        item.title || '无标题会话'
                                                                    );
                                                                }}
                                                            />
                                                        </Tooltip>
                                                        <Tooltip title="删除">
                                                            <Popconfirm
                                                                title="确定要删除此会话吗？"
                                                                onConfirm={(e) => {
                                                                    e?.stopPropagation();
                                                                    handleDeleteConversation(item.id);
                                                                }}
                                                                okText="确定"
                                                                cancelText="取消"
                                                            >
                                                                <Button
                                                                    type="text"
                                                                    danger
                                                                    icon={<DeleteOutlined />}
                                                                    onClick={(e) => e.stopPropagation()}
                                                                />
                                                            </Popconfirm>
                                                        </Tooltip>
                                                    </div>
                                                </>
                                            )}
                                        </div>
                                    )}
                                />
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
};

export default ConversationSidebar;