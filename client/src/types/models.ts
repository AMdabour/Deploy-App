export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface User {
  id: string;
  email: string;
  username: string;
  firstName?: string;
  lastName?: string;
  timezone?: string;
}

export interface Goal {
  id: string;
  title: string;
  description?: string;
  category: string;
  targetYear: number;
  priority: string;
  status: string;
  aiDecomposed?: boolean;
  createdAt: string;
}

export interface Objective {
  createdAt: string;
  id: string;
  goalId: string;
  title: string;
  description?: string;
  targetMonth: number;
  targetYear: number;
  keyResults: KeyResult[];
  status: string;
  progress: number;
}

export interface KeyResult {
  id: string;
  description: string;
  targetValue?: number;
  currentValue?: number;
  unit?: string;
  completed: boolean;
}

export interface Task {
  objectiveTitle: any;
  goalTitle: any;
  id: string;
  objectiveId?: string;
  goalId?: string;
  title: string;
  description?: string;
  scheduledDate: string;
  scheduledTime?: string;
  estimatedDuration: number;
  actualDuration?: number;
  priority: string;
  status: string;
  tags: string[];
  location?: string;
  reminderMinutes?: number;
  completedAt?: string;
}
