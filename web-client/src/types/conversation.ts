export enum ConversationType {
  PRE_DIAGNOSIS = 'PRE_DIAGNOSIS',
  GUIDE = 'GUIDE',
  REPORT = 'REPORT'
}

  
export enum SenderType {
  PATIENT = 'PATIENT',
  SYSTEM = 'SYSTEM',
}


export interface Message {
  _id: string;
  content: string;
  senderType: 'PATIENT' | 'SYSTEM';
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