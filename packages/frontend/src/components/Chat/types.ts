
export interface ChatHeaderProps {
  sidebarCollapsed: boolean;
  toggleSidebar: () => void;
  user: {
    name?: string;
    avatar?: string;
    userId?: string;
    email?: string;
    age?: number;
    gender?: string;
    idCardNumber?: string;
  } | null;
} 