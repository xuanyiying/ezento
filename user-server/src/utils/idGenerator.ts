import { customAlphabet } from 'nanoid';

const alphabet = '0123456789';
const generateId = customAlphabet(alphabet, 10);

export const generateUserId = () => `U${generateId()}`;
export const generateDoctorId = () => `D${generateId()}`;
export const generatePatientId = () => `P${generateId()}`;
export const generateConsultationId = () => `C${generateId()}`;
export const generateConversationId = () => `T${generateId()}`;

// 为不同的模型创建特定的ID生成器
export const generateMessageId = () => generateId();
export const generateDepartmentId = () => generateId();
export const generateTenantId = () => generateId();
