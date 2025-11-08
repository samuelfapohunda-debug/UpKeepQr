export interface Agent {
  id: string;
  username: string;
  firstName: string;
  lastName: string;
  email: string;
  setupToken?: string;
  isSetupComplete: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface AgentEvent {
  id: string;
  agentId: string;
  title: string;
  description?: string;
  startTime: Date;
  endTime: Date;
  location?: string;
  type: 'meeting' | 'task' | 'training' | 'other';
}

export interface SetupToken {
  id: string;
  token: string;
  agentId?: string;
  isUsed: boolean;
  expiresAt: Date;
  createdAt: Date;
}

export interface QRCodeRequest {
  data: string;
  size?: number;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}
