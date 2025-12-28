import {
    WebSocketGateway,
    WebSocketServer,
    SubscribeMessage,
    OnGatewayConnection,
    OnGatewayDisconnect,
    MessageBody,
    ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';
import { ConsultationService } from '../consultation/consultation.service';
import { AIEngineService } from '../ai-providers/ai-engine.service';

interface ChatMessage {
    consultationId: string;
    content: string;
    userId: string;
    tenantId: string;
}

@WebSocketGateway({
    cors: {
        origin: process.env.FRONTEND_URL || '*',
        credentials: true,
    },
    namespace: '/chat',
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
    @WebSocketServer()
    server: Server;

    private readonly logger = new Logger(ChatGateway.name);

    constructor(
        private readonly consultationService: ConsultationService,
        private readonly aiEngine: AIEngineService,
    ) { }

    handleConnection(client: Socket) {
        this.logger.log(`Client connected: ${client.id}`);
    }

    handleDisconnect(client: Socket) {
        this.logger.log(`Client disconnected: ${client.id}`);
    }

    @SubscribeMessage('joinConsultation')
    async handleJoinRoom(
        @ConnectedSocket() client: Socket,
        @MessageBody() data: { consultationId: string },
    ) {
        await client.join(data.consultationId);
        this.logger.log(`Client ${client.id} joined consultation ${data.consultationId}`);
        return { event: 'joined', data: { consultationId: data.consultationId } };
    }

    @SubscribeMessage('sendMessage')
    async handleMessage(
        @ConnectedSocket() client: Socket,
        @MessageBody() message: ChatMessage,
    ) {
        const { consultationId, content, userId, tenantId } = message;

        // Broadcast user message to room
        this.server.to(consultationId).emit('userMessage', {
            content,
            userId,
            timestamp: new Date(),
        });

        // Get AI response with streaming
        try {
            // Indicate AI is thinking
            this.server.to(consultationId).emit('aiThinking', { status: 'processing' });

            const aiResponse = await this.aiEngine.call(
                {
                    prompt: content,
                    model: '', // Auto-select
                    metadata: {
                        templateName: 'medical_consultation',
                        templateVariables: { userQuery: content },
                    },
                },
                userId,
                'CONSULTATION',
            );

            // Send AI response
            this.server.to(consultationId).emit('aiMessage', {
                content: aiResponse.content,
                timestamp: new Date(),
            });

            // Update consultation record
            await this.consultationService.addAiSuggestion(tenantId, consultationId, {
                possibleConditions: aiResponse.content,
                recommendations: '',
                urgencyLevel: 'routine',
                suggestedDepartments: [],
                createTime: new Date(),
            } as any);
        } catch (error) {
            this.logger.error(`AI response error: ${error.message}`);
            this.server.to(consultationId).emit('error', {
                message: '抱歉，AI 服务暂时不可用，请稍后再试。',
            });
        }

        return { event: 'messageSent', data: { success: true } };
    }

    @SubscribeMessage('leaveConsultation')
    async handleLeaveRoom(
        @ConnectedSocket() client: Socket,
        @MessageBody() data: { consultationId: string },
    ) {
        await client.leave(data.consultationId);
        this.logger.log(`Client ${client.id} left consultation ${data.consultationId}`);
        return { event: 'left', data: { consultationId: data.consultationId } };
    }
}
