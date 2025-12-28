import React, { useState, useEffect, useRef } from 'react';
import { Button, Tooltip, App } from 'antd';
import { AudioOutlined, AudioMutedOutlined, LoadingOutlined } from '@ant-design/icons';
import './VoiceInput.less';
import { useTheme } from '@/utils/themeContext';

interface VoiceInputProps {
    onTranscript: (text: string) => void;
    disabled?: boolean;
    buttonOnly?: boolean;
}

const VoiceInput: React.FC<VoiceInputProps> = ({
    onTranscript,
    disabled = false,
    buttonOnly = false,
}) => {
    const [isListening, setIsListening] = useState(false);
    const [transcript, setTranscript] = useState('');
    const [isSupported, setIsSupported] = useState(true);
    const [isLoading, setIsLoading] = useState(false);
    const recognitionRef = useRef<any>(null);
    const { settings } = useTheme();
    const { message } = App.useApp();

    // Check for browser support
    useEffect(() => {
        // @ts-ignore - SpeechRecognition is not in the TypeScript types
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SpeechRecognition) {
            setIsSupported(false);
            return;
        }

        // Initialize speech recognition
        recognitionRef.current = new SpeechRecognition();
        recognitionRef.current.continuous = true;
        recognitionRef.current.interimResults = true;
        recognitionRef.current.lang = 'zh-CN'; // Set to Chinese

        // Set up event handlers
        recognitionRef.current.onstart = () => {
            setIsListening(true);
            setIsLoading(false);
        };

        recognitionRef.current.onend = () => {
            setIsListening(false);
        };

        recognitionRef.current.onerror = (event: any) => {
            console.error('Speech recognition error', event);
            setIsListening(false);
            setIsLoading(false);

            if (event.error === 'no-speech') {
                message.info('未检测到语音，请重试');
            } else if (event.error === 'audio-capture') {
                message.error('无法访问麦克风，请检查权限设置');
            } else if (event.error === 'not-allowed') {
                message.error('麦克风访问被拒绝，请允许访问');
            } else {
                message.error(`语音识别错误: ${event.error}`);
            }
        };

        recognitionRef.current.onresult = (event: any) => {
            let interimTranscript = '';
            let finalTranscript = '';

            for (let i = event.resultIndex; i < event.results.length; i++) {
                const transcript = event.results[i][0].transcript;
                if (event.results[i].isFinal) {
                    finalTranscript += transcript;
                } else {
                    interimTranscript += transcript;
                }
            }

            // If we have a final transcript, update the state
            if (finalTranscript !== '') {
                setTranscript(finalTranscript);
                onTranscript(finalTranscript);
            }
        };

        return () => {
            // Clean up
            if (recognitionRef.current) {
                recognitionRef.current.stop();
            }
        };
    }, [onTranscript]);

    const toggleListening = () => {
        if (!isSupported) {
            message.error('您的浏览器不支持语音识别功能');
            return;
        }

        if (isListening) {
            recognitionRef.current.stop();
            setIsListening(false);
        } else {
            setIsLoading(true);
            try {
                recognitionRef.current.start();
            } catch (error) {
                console.error('Failed to start speech recognition:', error);
                setIsLoading(false);
                message.error('启动语音识别失败，请重试');
            }
        }
    };

    // If voice input is not supported, show only the disabled button
    if (!isSupported) {
        return (
            <Tooltip title="此浏览器不支持语音输入">
                <Button
                    icon={<AudioMutedOutlined />}
                    disabled
                    className="voice-input-button"
                    aria-label="语音输入不可用"
                />
            </Tooltip>
        );
    }

    // If only button mode is requested
    if (buttonOnly) {
        return (
            <Tooltip title={isListening ? '点击停止语音输入' : '点击开始语音输入'}>
                <Button
                    type={isListening ? 'primary' : 'default'}
                    icon={
                        isLoading ? (
                            <LoadingOutlined />
                        ) : isListening ? (
                            <AudioOutlined />
                        ) : (
                            <AudioOutlined />
                        )
                    }
                    onClick={toggleListening}
                    disabled={disabled}
                    className={`voice-input-button ${isListening ? 'listening' : ''} ${settings.highContrast ? 'high-contrast' : ''}`}
                    aria-label={isListening ? '停止语音输入' : '开始语音输入'}
                    loading={isLoading}
                />
            </Tooltip>
        );
    }

    // Full component with visual feedback
    return (
        <div className={`voice-input-container ${isListening ? 'active' : ''}`}>
            {isListening && (
                <div className="voice-pulse-container">
                    <div className="voice-visualization">
                        <div className="voice-wave"></div>
                        <div className="voice-wave"></div>
                        <div className="voice-wave"></div>
                    </div>
                    <div className="voice-status">正在聆听...</div>
                </div>
            )}

            <Button
                type={isListening ? 'primary' : 'default'}
                icon={
                    isLoading ? (
                        <LoadingOutlined />
                    ) : isListening ? (
                        <AudioOutlined />
                    ) : (
                        <AudioOutlined />
                    )
                }
                onClick={toggleListening}
                disabled={disabled}
                className={`voice-input-button ${isListening ? 'listening' : ''}`}
                aria-label={isListening ? '停止语音输入' : '开始语音输入'}
            >
                {isListening ? '停止' : '语音输入'}
            </Button>
        </div>
    );
};

export default VoiceInput;
