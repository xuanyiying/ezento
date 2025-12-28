import { useEffect, useState } from 'react';
import WebSocketService from '@/services/websocket';

/**
 * 管理WebSocket连接的Hook
 * @param conversationId - 当前会话ID
 * @param isAuthenticated - 用户是否已认证
 * @param userId - 用户ID
 * @returns WebSocketService实例
 */
export const useWebSocketConnection = (
  conversationId: string | undefined,
  isAuthenticated: boolean,
  userId: string | undefined
) => {
  const [wsService] = useState(() => WebSocketService.getInstance());

  useEffect(() => {
    let isComponentMounted = true; // 跟踪组件是否仍然挂载
    
    // 仅当会话ID存在且用户已认证且组件挂载时才连接
    if (conversationId && isAuthenticated && userId && isComponentMounted) {
      console.log('开始连接WebSocket...');
      wsService.connect(conversationId);
      
      // 创建轮询检查连接状态
      const checkConnection = setInterval(() => {
        if (wsService.isConnected() && isComponentMounted) {
          clearInterval(checkConnection);
        }
      }, 2000); // 检查间隔

      // 监听socket事件
      const handleReconnect = () => {
        console.log('WebSocket 重新连接成功');
        wsService.connect(conversationId);
      };

      const handleDisconnect = () => {
        console.log('WebSocket 连接断开');
        wsService.disconnect();
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
    } else if (!isAuthenticated || !userId) {
      console.log('用户未认证，无法建立WebSocket连接');
    }

    return () => {
      wsService.disconnect();
    };
  }, [conversationId, isAuthenticated, userId, wsService]);

  return wsService;
};

export default useWebSocketConnection; 