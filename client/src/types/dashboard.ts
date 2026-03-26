export type TaskStatus = 'completed' | 'pending' | 'overdue';
export type TaskPriority = 'low' | 'medium' | 'high';

export interface Task {
  id: number;
  taskName: string;
  description: string;
  category: string;
  priority: TaskPriority;
  status: TaskStatus;
  dueDate: string;
  frequencyMonths: number;
  completedAt?: string;
}

export interface Household {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  homeType: string;
  streetAddress: string;
  city: string;
  state: string;
  zip: string;
  subscriptionTier: string;
}

export interface ManagedProperty {
  id: string;
  portfolioHouseholdId: string;
  propertyName: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  unitNumber?: string | null;
  propertyType: string;
  yearBuilt?: number | null;
  squareFootage?: number | null;
  activationStatus: string;
  scheduleGenerated: boolean;
  homeProfileId?: string | null;
  createdAt: string;
}

export interface TasksResponse {
  tasks: Task[];
  summary?: {
    total: number;
    completed: number;
    pending: number;
    overdue: number;
  };
}

export interface TaskStats {
  total: number;
  completed: number;
  pending: number;
  overdue: number;
}

export type DashboardTab = 'tasks' | 'appliances' | 'details';
