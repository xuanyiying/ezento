export enum ConversationType {
    PRE_DIAGNOSIS = 'PRE_DIAGNOSIS',
    GUIDE = 'GUIDE',
    REPORT_INTERPRETATION = 'REPORT',
}

export interface Message {
    id: string;
    content: string;
    role: 'user' | 'system';
    metadata?: any;
    timestamp: string;
    conversationId: string;
    consultationId: string;
}

export interface Conversation {
    conversationId: string;
    consultationId: string;
    id: string;
    type: ConversationType;
    referenceId: string;
    patientId: string;
    messages: Message[];
    status: 'ACTIVE' | 'CLOSED';
    startTime: string;
}
