import React from 'react';
import { Drawer, Switch, Radio, Typography, Divider, Button, Tooltip } from 'antd';
import {
    BgColorsOutlined,
    FontSizeOutlined,
    EyeOutlined,
    ThunderboltOutlined,
    CloseOutlined,
    SaveOutlined,
} from '@ant-design/icons';
import { useTheme } from '@/utils/themeContext';
import './SettingsPanel.less';

interface SettingsPanelProps {
    visible: boolean;
    onClose: () => void;
}

const SettingsPanel: React.FC<SettingsPanelProps> = ({ visible, onClose }) => {
    const {
        settings,
        toggleDarkMode,
        setFontSize,
        toggleHighContrast,
        toggleReducedMotion,
        addQuickAction,
        removeQuickAction,
    } = useTheme();

    // Available quick actions
    const availableQuickActions = [
        { key: 'voice-input', label: '语音输入' },
        { key: 'text-to-speech', label: '朗读' },
        { key: 'translate', label: '翻译' },
        { key: 'save-draft', label: '保存草稿' },
        { key: 'emergency', label: '紧急求助' },
    ];

    // Handle quick action toggle
    const handleQuickActionToggle = (action: string, checked: boolean) => {
        if (checked) {
            addQuickAction(action);
        } else {
            removeQuickAction(action);
        }
    };

    return (
        <Drawer
            title={
                <div className="settings-header">
                    <Typography.Title level={4} className="settings-title">
                        <ThunderboltOutlined /> 设置与辅助功能
                    </Typography.Title>
                    <Button
                        icon={<CloseOutlined />}
                        type="text"
                        onClick={onClose}
                        aria-label="关闭设置"
                    />
                </div>
            }
            placement="right"
            closable={false}
            onClose={onClose}
            open={visible}
            width={320}
            className="settings-panel-drawer"
            destroyOnClose={false}
            footer={
                <div className="settings-footer">
                    <Button icon={<SaveOutlined />} type="primary" block onClick={onClose}>
                        保存设置
                    </Button>
                </div>
            }
        >
            <div className="settings-content">
                <section className="settings-section">
                    <Typography.Title level={5} className="settings-section-title">
                        <BgColorsOutlined /> 显示模式
                    </Typography.Title>
                    <div className="setting-item">
                        <div className="setting-label">
                            <Typography.Text>深色模式</Typography.Text>
                            <Typography.Text type="secondary" className="setting-description">
                                降低亮度，保护眼睛
                            </Typography.Text>
                        </div>
                        <Switch
                            checked={settings.darkMode}
                            onChange={toggleDarkMode}
                            aria-label="切换深色模式"
                            className="btn-ripple"
                        />
                    </div>

                    <div className="setting-item">
                        <div className="setting-label">
                            <Typography.Text>高对比度</Typography.Text>
                            <Typography.Text type="secondary" className="setting-description">
                                提高文字与背景对比度
                            </Typography.Text>
                        </div>
                        <Switch
                            checked={settings.highContrast}
                            onChange={toggleHighContrast}
                            aria-label="切换高对比度模式"
                            className="btn-ripple"
                        />
                    </div>
                </section>

                <Divider />

                <section className="settings-section">
                    <Typography.Title level={5} className="settings-section-title">
                        <FontSizeOutlined /> 文字大小
                    </Typography.Title>
                    <Radio.Group
                        value={settings.fontSize}
                        onChange={e => setFontSize(e.target.value)}
                        className="font-size-group"
                    >
                        <Tooltip title="小号字体">
                            <Radio.Button value="small" className="font-size-option small">
                                A
                            </Radio.Button>
                        </Tooltip>
                        <Tooltip title="中号字体">
                            <Radio.Button value="medium" className="font-size-option medium">
                                A
                            </Radio.Button>
                        </Tooltip>
                        <Tooltip title="大号字体">
                            <Radio.Button value="large" className="font-size-option large">
                                A
                            </Radio.Button>
                        </Tooltip>
                    </Radio.Group>
                    <Typography.Text type="secondary" className="setting-description block">
                        调整文字大小，使内容更易阅读
                    </Typography.Text>
                </section>

                <Divider />

                <section className="settings-section">
                    <Typography.Title level={5} className="settings-section-title">
                        <EyeOutlined /> 辅助功能
                    </Typography.Title>
                    <div className="setting-item">
                        <div className="setting-label">
                            <Typography.Text>减弱动画效果</Typography.Text>
                            <Typography.Text type="secondary" className="setting-description">
                                减少界面动画，降低眩晕感
                            </Typography.Text>
                        </div>
                        <Switch
                            checked={settings.reducedMotion}
                            onChange={toggleReducedMotion}
                            aria-label="减弱动画效果"
                            className="btn-ripple"
                        />
                    </div>
                </section>

                <Divider />

                <section className="settings-section">
                    <Typography.Title level={5} className="settings-section-title">
                        自定义快捷功能
                    </Typography.Title>
                    <Typography.Text type="secondary" className="setting-description block mb-md">
                        选择在聊天界面显示的快捷按钮
                    </Typography.Text>

                    {availableQuickActions.map(action => (
                        <div className="setting-item" key={action.key}>
                            <Typography.Text>{action.label}</Typography.Text>
                            <Switch
                                checked={settings.quickActions.includes(action.key)}
                                onChange={checked => handleQuickActionToggle(action.key, checked)}
                                aria-label={`启用${action.label}快捷功能`}
                                className="btn-ripple"
                            />
                        </div>
                    ))}
                </section>
            </div>
        </Drawer>
    );
};

export default SettingsPanel;
