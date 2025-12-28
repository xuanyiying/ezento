import { io, Socket } from 'socket.io-client';

class SocketService {
    private socket: Socket | null = null;
    private readonly serverUrl: string;

    constructor() {
        this.serverUrl = import.meta.env.VITE_WEBSOCKET_URL || 'http://localhost:3000';
    }

    connect(): Socket {
        if (!this.socket) {
            this.socket = io(`${this.serverUrl}/chat`, {
                transports: ['websocket', 'polling'],
                reconnection: true,
                reconnectionDelay: 1000,
                reconnectionAttempts: 5,
            });

            this.socket.on('connect', () => {
                console.log('✅ WebSocket connected:', this.socket?.id);
            });

            this.socket.on('disconnect', (reason) => {
                console.log('❌ WebSocket disconnected:', reason);
            });

            this.socket.on('connect_error', (error) => {
                console.error('WebSocket connection error:', error);
            });
        }

        return this.socket;
    }

    disconnect() {
        if (this.socket) {
            this.socket.disconnect();
            this.socket = null;
        }
    }

    joinConsultation(consultationId: string) {
        if (!this.socket) this.connect();
        this.socket?.emit('joinConsultation', { consultationId });
    }

    leaveConsultation(consultationId: string) {
        this.socket?.emit('leaveConsultation', { consultationId });
    }

    sendMessage(data: {
        consultationId: string;
        content: string;
        userId: string;
        tenantId: string;
    }) {
        if (!this.socket) this.connect();
        this.socket?.emit('sendMessage', data);
    }

    onUserMessage(callback: (data: any) => void) {
        this.socket?.on('userMessage', callback);
    }

    onAiThinking(callback: (data: any) => void) {
        this.socket?.on('aiThinking', callback);
    }

    onAiMessage(callback: (data: any) => void) {
        this.socket?.on('aiMessage', callback);
    }

    onError(callback: (data: any) => void) {
        this.socket?.on('error', callback);
    }

    offAllListeners() {
        this.socket?.off('userMessage');
        this.socket?.off('aiThinking');
        this.socket?.off('aiMessage');
        this.socket?.off('error');
    }

    getSocket(): Socket | null {
        return this.socket;
    }
}

export default new SocketService();
