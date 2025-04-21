import React, { useState } from 'react';
import { Modal, Input, Dropdown, Button } from 'antd';
import { Conversation } from '@/types/conversation';
import { EditOutlined, DeleteOutlined, PushpinOutlined, EllipsisOutlined } from '@ant-design/icons';
import './ConversationMenu.less';

interface ConversationMenuProps {
  conversation: Conversation;
  onRename: (conversation: Conversation, newName: string) => void;
  onDelete: (conversation: Conversation) => void;
  onTogglePin: (conversation: Conversation) => void;
  onToggleFavorite: (conversation: Conversation) => void;
  isPinned: boolean;
  isFavorite: boolean;
}

const ConversationMenu: React.FC<ConversationMenuProps> = ({
  conversation,
  onRename,
  onDelete,
  onTogglePin,
  onToggleFavorite,
  isPinned,
  isFavorite
}) => {
  const [renameModalVisible, setRenameModalVisible] = useState(false);
  const [newName, setNewName] = useState('');
  const [deleteConfirmVisible, setDeleteConfirmVisible] = useState(false);

  const handleRename = () => {
    if (newName.trim()) {
      onRename(conversation, newName.trim());
      setRenameModalVisible(false);
      setNewName('');
    }
  };

  const openRenameModal = () => {
    setNewName(conversation.title || '');
    setRenameModalVisible(true);
  };

  const handleDelete = () => {
    setDeleteConfirmVisible(false);
    onDelete(conversation);
  };

  const menuItems = [
    {
      key: 'edit',
      icon: <EditOutlined />,
      label: '编辑名称',
      onClick: openRenameModal
    },
    {
      key: 'pin',
      icon: <PushpinOutlined />,
      label: isPinned ? '取消置顶' : '置顶',
      onClick: () => onTogglePin(conversation)
    },
    {
      key: 'favorite',
      icon: <i className="icon-star" />,
      label: isFavorite ? '取消收藏' : '收藏',
      onClick: () => onToggleFavorite(conversation)
    },
    {
      key: 'delete',
      icon: <DeleteOutlined />,
      label: '删除',
      danger: true,
      onClick: () => setDeleteConfirmVisible(true)
    }
  ];

  return (
    <>
      <Dropdown
        menu={{ items: menuItems }}
        trigger={['click']}
        placement="bottomRight"
        getPopupContainer={trigger => trigger.parentElement || document.body}
      >
        <Button 
          type="text"
          icon={<EllipsisOutlined />}
          className="conversation-menu-button"
          onClick={e => e.stopPropagation()}
        />
      </Dropdown>
      
      <Modal
        title="修改名称"
        open={renameModalVisible}
        onOk={handleRename}
        onCancel={() => setRenameModalVisible(false)}
        okButtonProps={{ disabled: !newName.trim() }}
      >
        <Input 
          value={newName} 
          onChange={e => setNewName(e.target.value)} 
          placeholder="请输入新名称"
          autoFocus
        />
      </Modal>
      
      <Modal
        title="确认删除"
        open={deleteConfirmVisible}
        onOk={handleDelete}
        onCancel={() => setDeleteConfirmVisible(false)}
        okText="删除"
        okButtonProps={{ danger: true }}
        cancelText="取消"
      >
        <p>确定要删除这个会话吗？此操作不可恢复。</p>
      </Modal>
    </>
  );
};

export default ConversationMenu; 