import React, { useState } from 'react';
import { XProvider, Conversations } from '@ant-design/x';
import { Typography, Upload, Card, App, Row, Col, Progress, Badge } from 'antd';
import {
    UploadOutlined,
    SafetyCertificateOutlined,
    AlertOutlined,
    CheckCircleOutlined
} from '@ant-design/icons';
import type { UploadFile, UploadProps } from 'antd/es/upload/interface';
import type { Message } from '../../types/conversation';
import './ReportsPage.less';

const { Title, Text } = Typography;

interface HealthIndicator {
    name: string;
    value: string;
    unit: string;
    status: 'normal' | 'abnormal' | 'warning';
    reference: string;
}

interface ReportState {
    files: UploadFile[];
    messages: Message[];
    loading: boolean;
    analyzing: boolean;
    indicators: HealthIndicator[];
}

const ReportsPage: React.FC = () => {
    const { message } = App.useApp();
    const [state, setState] = useState<ReportState>({
        files: [],
        messages: [],
        loading: false,
        analyzing: false,
        indicators: [],
    });
    const [inputValue, setInputValue] = useState<string>('');

    const handleFileUpload: UploadProps['customRequest'] = options => {
        const { file, onSuccess } = options;

        setState(prev => ({ ...prev, loading: true }));

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

                // 模拟AI分析报告并提取指标
                setTimeout(() => {
                    const mockIndicators: HealthIndicator[] = [
                        { name: '空腹血糖', value: '5.2', unit: 'mmol/L', status: 'normal', reference: '3.9-6.1' },
                        { name: '总胆固醇', value: '6.5', unit: 'mmol/L', status: 'abnormal', reference: '< 5.2' },
                        { name: '收缩压', value: '135', unit: 'mmHg', status: 'warning', reference: '90-120' },
                        { name: '舒张压', value: '85', unit: 'mmHg', status: 'normal', reference: '60-80' },
                    ];

                    const aiMessage: Message = {
                        id: Date.now().toString(),
                        content: `报告分析完成。发现 **总胆固醇** 偏高，建议注意饮食习惯，减少高油脂食物摄入。血压处于临界值，请定期监测。`,
                        role: 'system',
                        timestamp: new Date().toISOString(),
                        conversationId: '123',
                        consultationId: '123',
                    };

                    setState(prev => ({
                        ...prev,
                        indicators: mockIndicators,
                        messages: [...prev.messages, aiMessage],
                        analyzing: false,
                    }));
                }, 3000);
            }
            onSuccess?.('ok');
        }, 1000);
    };

    const handleSendQuestion = (content: string) => {
        if (!content.trim() || state.files.length === 0) return;
        const userMessage: Message = {
            id: Date.now().toString(),
            content,
            role: 'user',
            timestamp: new Date().toISOString(),
            conversationId: '123',
            consultationId: '123',
        };
        setState(prev => ({ ...prev, messages: [...prev.messages, userMessage], loading: true }));
        setTimeout(() => {
            const aiMessage: Message = {
                id: (Date.now() + 1).toString(),
                content: `针对您问的"${content}"，建议保持现有健康饮食，同时每周进行3次以上的有氧运动。`,
                role: 'system',
                timestamp: new Date().toISOString(),
                conversationId: '123',
                consultationId: '123',
            };
            setState(prev => ({ ...prev, messages: [...prev.messages, aiMessage], loading: false }));
        }, 1500);
    };

    return (
        <XProvider>
            <div className="reports-page">
                <div className="reports-container">
                    <header className="page-header">
                        <Title level={3}>报告智能解读</Title>
                        <Text type="secondary">上传化验单或检查报告，AI 医生为您深度分析</Text>
                    </header>

                    <section className="upload-section">
                        <Upload.Dragger
                            customRequest={handleFileUpload}
                            showUploadList={false}
                            accept=".pdf,.jpg,.png,.jpeg"
                            disabled={state.loading || state.analyzing}
                            className="glass-dragger"
                        >
                            <p className="ant-upload-drag-icon">
                                <UploadOutlined style={{ color: '#0052D9' }} />
                            </p>
                            <p className="ant-upload-text">点击或拖拽报告至此区域</p>
                            <p className="ant-upload-hint">支持图片及 PDF 格式，多页报告请依次上传</p>
                        </Upload.Dragger>
                    </section>

                    {state.analyzing && (
                        <div className="analysis-progress">
                            <Progress percent={75} status="active" strokeColor="#0052D9" />
                            <Text>AI 正在扫描并提取医学指标...</Text>
                        </div>
                    )}

                    {state.indicators.length > 0 && (
                        <section className="dashboard-section fade-in">
                            <Title level={4}><SafetyCertificateOutlined /> 指标概览</Title>
                            <Row gutter={[16, 16]}>
                                {state.indicators.map((item, idx) => (
                                    <Col xs={12} sm={6} key={idx}>
                                        <Card size="small" className={`indicator-card ${item.status}`}>
                                            <div className="indicator-header">
                                                <Text type="secondary">{item.name}</Text>
                                                {item.status === 'abnormal' ? <AlertOutlined style={{ color: '#D54941' }} /> : <CheckCircleOutlined style={{ color: '#2BA471' }} />}
                                            </div>
                                            <div className="indicator-value">
                                                <Title level={3} style={{ margin: 0 }}>{item.value}</Title>
                                                <Text>{item.unit}</Text>
                                            </div>
                                            <div className="indicator-footer">
                                                <Badge status={item.status === 'normal' ? 'success' : 'error'} text={`范围: ${item.reference}`} />
                                            </div>
                                        </Card>
                                    </Col>
                                ))}
                            </Row>
                        </section>
                    )}

                    <section className="analysis-section">
                        {state.messages.length > 0 && (
                            <div className="chat-container glass-card">
                                <Title level={4}>专家建议</Title>
                                <Conversations
                                    items={state.messages.map(msg => ({
                                        key: msg.id,
                                        id: msg.id,
                                        content: msg.content,
                                        role: msg.role,
                                        timestamp: new Date(msg.timestamp).getTime(),
                                    }))}
                                />
                            </div>
                        )}
                        {!state.loading && state.files.length > 0 && (
                            <div className="input-area glass-input">
                                <input
                                    type="text"
                                    value={inputValue}
                                    onChange={e => setInputValue(e.target.value)}
                                    placeholder="关于报告还有什么想问的？"
                                    onKeyDown={e => e.key === 'Enter' && handleSendQuestion(inputValue)}
                                />
                                <button onClick={() => handleSendQuestion(inputValue)}>询问</button>
                            </div>
                        )}
                    </section>
                </div>
            </div>
        </XProvider>
    );
};

export default ReportsPage;
