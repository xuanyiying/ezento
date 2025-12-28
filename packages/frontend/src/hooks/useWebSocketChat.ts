import { useEffect, useRef, useCallback } from 'react';
import socketService from '@/services/socket.service';

interface UseWebSocketChatProps {
    consultationId: string | undefined;
    userId: string | undefined;
    tenantId: string | undefined;
    onMessageReceived: (message: any) => void;
    onAiThinking: (status: boolean) => void;
    onError: (error: string) => void;
}

export const useWebSocketChat = ({
    consultationId,
    userId,
    tenantId,
    onMessageReceived,
    onAiThinking,
    onError,
}: UseWebSocketChatProps) => {
    const isConnectedRef = useRef(false);

    useEffect(() => {
        if (!consultationId || !userId) return;

        // Connect to WebSocket
        socketService.connect();
        socketService.joinConsultation(consultationId);
        isConnectedRef.current = true;

        // Set up event listeners
        socketService.onAiMessage((data) => {
            onMessageReceived({
                role: 'assistant',
                content: data.content,
                timestamp: data.timestamp,
            });
            onAiThinking(false);
        });

        socketService.onAiThinking((data) => {
            onAiThinking(data.status === 'processing');
        });

        socketService.onError((data) => {
            onError(data.message);
            onAiThinking(false);
        });

        // Cleanup on unmount
        return () => {
            if (consultationId && isConnectedRef.current) {
                socketService.leaveConsultation(consultationId);
                socketService.offAllListeners();
            }
        };
    }, [consultationId, userId, onMessageReceived, onAiThinking, onError]);

    const sendMessage = useCallback(
        (content: string) => {
            if (!consultationId || !userId || !tenantId) {
                console.error('Missing required parameters for sending message');
                return;
            }

            socketService.sendMessage({
                consultationId,
                content,
                userId,
                tenantId,
            });
        },
        [consultationId, userId, tenantId]
    );

    return { sendMessage };
};
