export enum ConversationType {
  PRE_DIAGNOSIS = 'PRE_DIAGNOSIS',
  GUIDE = 'GUIDE',
  REPORT = 'REPORT'
}

export interface Message {
  _id: string;
  content: string;
  role: 'user' | 'system';
  metadata?: any;
  createdAt: string;
  updatedAt: string;
  conversationId: string;
}

export interface Conversation {
  _id: string;
  type: ConversationType;
  referenceId: string;
  patientId: string;
  messages: Message[];
  status: 'ACTIVE' | 'CLOSED';
  createdAt: string;
  updatedAt: string;
} 