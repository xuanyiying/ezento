import React, { useState } from 'react';
import { XProvider, Conversations } from '@ant-design/x';
import { Typography, Upload, Empty, Spin, Card, App } from 'antd';
import { UploadOutlined, FileTextOutlined, DeleteOutlined } from '@ant-design/icons';
import type { UploadFile, UploadProps } from 'antd/es/upload/interface';
import type { Message } from '../../types/conversation';

interface ReportState {
    files: UploadFile[];
    messages: Message[];
    loading: boolean;
    analyzing: boolean;
}

const ReportsPage: React.FC = () => {
    const { message } = App.useApp();
    const [state, setState] = useState<ReportState>({
        files: [],
        messages: [],
        loading: false,
        analyzing: false,
    });
    const [inputValue, setInputValue] = useState<string>('');

    const handleFileUpload: UploadProps['customRequest'] = options => {
        const { file, onSuccess } = options;

        setState(prev => ({
            ...prev,
            loading: true,
        }));

        // 模拟文件上传和分析
        setTimeout(() => {
            if (file instanceof File) {
                const newFile: UploadFile = {
                    uid: Date.now().toString(),
                    name: file.name,
                    status: 'done',
                    url: URL.createObjectURL(file),
                };

                setState(prev => ({
                    ...prev,
                    files: [...prev.files, newFile],
                    loading: false,
                    analyzing: true,
                }));

                // 模拟AI分析报告
                setTimeout(() => {
                    const aiMessage: Message = {
                        id: Date.now().toString(),
                        content: `我已分析了您上传的"${file.name}"报告，整体健康状况良好。血糖、血压等各项指标在正常范围内。建议保持良好的作息习惯和均衡饮食。`,
                        role: 'system',
                        timestamp: new Date().toISOString(),
                        conversationId: '123',
                        consultationId: '123',
                    };

                    setState(prev => ({
                        ...prev,
                        messages: [...prev.messages, aiMessage],
                        analyzing: false,
                    }));
                }, 2000);
            }

            onSuccess?.('ok');
        }, 1000);
    };

    const handleSendQuestion = (content: string) => {
        if (!content.trim() || state.files.length === 0) return;

        // 创建用户消息
        const userMessage: Message = {
            id: Date.now().toString(),
            content,
            role: 'user',
            timestamp: new Date().toISOString(),
            conversationId: '123',
            consultationId: '123',
        };

        setState(prev => ({
            ...prev,
            messages: [...prev.messages, userMessage],
            loading: true,
        }));

        // 模拟AI回复
        setTimeout(() => {
            const aiMessage: Message = {
                id: (Date.now() + 1).toString(),
                content: `针对您的问题"${content}"，结合报告分析，建议您继续保持现有的健康状态，可以适当增加有氧运动，提高心肺功能。`,
                role: 'system',
                timestamp: new Date().toISOString(),
                conversationId: '123',
                consultationId: '123',
            };

            setState(prev => ({
                ...prev,
                messages: [...prev.messages, aiMessage],
                loading: false,
            }));
        }, 1500);
    };

    const handleDeleteFile = (uid: string) => {
        setState(prev => ({
            ...prev,
            files: prev.files.filter(file => file.uid !== uid),
        }));

        message.success('报告已删除');
    };

    return (
        <XProvider>
            <div className="reports-page">
                <Typography.Title level={4}>医学报告解读</Typography.Title>

                <Upload.Dragger
                    customRequest={handleFileUpload}
                    showUploadList={false}
                    accept=".pdf,.jpg,.png,.jpeg"
                    disabled={state.loading || state.analyzing}
                >
                    <p className="ant-upload-drag-icon">
                        <UploadOutlined />
                    </p>
                    <p className="ant-upload-text">上传您的报告</p>
                    <p className="ant-upload-hint">
                        支持上传检验报告、影像报告等医学文档，我们将为您解读
                    </p>
                </Upload.Dragger>

                {state.analyzing && (
                    <div className="analyzing">
                        <Spin size="small" />
                        <span>AI正在分析报告，请稍候...</span>
                    </div>
                )}

                {state.files.length > 0 && (
                    <div className="file-list">
                        <Typography.Title level={5}>已上传的报告</Typography.Title>
                        {state.files.map(file => (
                            <Card key={file.uid} size="small" className="file-item">
                                <FileTextOutlined /> {file.name}
                                <DeleteOutlined
                                    className="delete-icon"
                                    onClick={() => handleDeleteFile(file.uid)}
                                />
                            </Card>
                        ))}
                    </div>
                )}

                {state.messages.length > 0 ? (
                    <div className="conversation-container">
                        <Conversations
                            items={state.messages.map(msg => ({
                                key: msg.id,
                                id: msg.id,
                                content: msg.content,
                                role: msg.role,
                                timestamp: new Date(msg.timestamp).getTime(),
                            }))}
                            groupable={{
                                sort: (_a, _b) => 0,
                                title: group => <div className="date-group">{group}</div>,
                            }}
                        />
                    </div>
                ) : (
                    <div className="empty-container">
                        <Empty description="上传报告后，AI将自动为您解读" />
                    </div>
                )}

                <div className="input-area">
                    <input
                        type="text"
                        value={inputValue}
                        onChange={e => setInputValue(e.target.value)}
                        onKeyDown={e => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault();
                                handleSendQuestion(inputValue);
                                setInputValue('');
                            }
                        }}
                        placeholder="输入您对报告的疑问..."
                        disabled={state.loading || state.files.length === 0}
                    />
                    <button
                        onClick={() => {
                            handleSendQuestion(inputValue);
                            setInputValue('');
                        }}
                        disabled={state.loading || state.files.length === 0}
                    >
                        发送
                    </button>
                </div>
            </div>
        </XProvider>
    );
};

export default ReportsPage;
