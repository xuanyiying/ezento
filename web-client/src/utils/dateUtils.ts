export const formatDate = (date: string | Date): string => {
    const d = new Date(date);
    const now = new Date();

    // 如果是今天的消息，只显示时间
    if (d.toDateString() === now.toDateString()) {
        return d.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
    }

    // 如果是昨天的消息
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    if (d.toDateString() === yesterday.toDateString()) {
        return `昨天 ${d.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}`;
    }

    // 如果是今年的消息
    if (d.getFullYear() === now.getFullYear()) {
        return d.toLocaleDateString('zh-CN', {
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
        });
    }

    // 其他情况显示完整日期
    return d.toLocaleDateString('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
    });
};

export const getRelativeTime = (date: string | Date): string => {
    const d = new Date(date);
    const now = new Date();
    const diff = now.getTime() - d.getTime();

    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (seconds < 60) {
        return '刚刚';
    } else if (minutes < 60) {
        return `${minutes}分钟前`;
    } else if (hours < 24) {
        return `${hours}小时前`;
    } else if (days < 30) {
        return `${days}天前`;
    } else {
        return formatDate(date);
    }
};
