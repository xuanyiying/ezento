import { useState, useEffect } from 'react';

interface User {
  userId?: string;
  name?: string;
  gender?: string;
  phone?: string;
}

export const useIdentityConfirmation = (user: User | null) => {
  // 从localStorage读取身份确认状态，如果有则使用，否则默认为false
  const [isIdentityConfirmed, setIsIdentityConfirmed] = useState<boolean>(() => {
    // 检查localStorage中是否有保存的确认状态
    const savedState = localStorage.getItem('identityConfirmed');
    
    // 如果存在且为当前用户，则返回true
    if (savedState && user) {
      try {
        const { userId, confirmed } = JSON.parse(savedState);
        // 确保确认状态是针对当前用户的
        return userId === user.userId && confirmed;
      } catch (e) {
        console.error('解析保存的确认状态失败:', e);
        return false;
      }
    }
    return false;
  });

  // 当用户信息变化时更新身份确认状态
  useEffect(() => {
    // 如果当前没有用户（如退出登录状态），清除身份确认
    if (!user) {
      localStorage.removeItem('identityConfirmed');
      setIsIdentityConfirmed(false);
    }
  }, [user]);

  // 确认身份的处理函数
  const confirmIdentity = () => {
    setIsIdentityConfirmed(true);

    // 保存确认状态到localStorage，包含用户ID以确保是当前用户的确认状态
    if (user && user.userId) {
      localStorage.setItem(
        'identityConfirmed',
        JSON.stringify({
          userId: user.userId,
          confirmed: true,
          timestamp: new Date().toISOString(),
        })
      );
    }
  };

  return {
    isIdentityConfirmed,
    confirmIdentity
  };
};

export default useIdentityConfirmation; 