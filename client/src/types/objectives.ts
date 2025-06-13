export interface KeyResult {
  id: string;
  description: string;
  targetValue?: number;
  currentValue?: number;
  unit?: string;
  completed: boolean;
}

export interface KeyResultFormData {
  id?: string;
  description: string;
  targetValue?: number;
  currentValue?: number;
  unit?: string;
  completed?: boolean;
}

export interface KeyResultUpdateData {
  id?: string;
  description: string;
  targetValue?: number;
  currentValue?: number;
  unit?: string;
  completed: boolean;
}

export interface Objective {
  id: string;
  goalId: string;
  title: string;
  description: string;
  targetMonth: number;
  targetYear: number;
  keyResults: KeyResult[];
  status: 'active' | 'completed' | 'paused';
  progress: number;
  createdAt: string;
}

export interface Goal {
  id: string;
  title: string;
  category: string;
}

export interface ObjectiveFormData {
  goalId: string;
  title: string;
  description: string;
  targetMonth: number;
  targetYear: number;
  keyResults: KeyResultFormData[];
}

// API update data type
export interface ObjectiveUpdateData {
  goalId?: string;
  title?: string;
  description?: string;
  targetMonth?: number;
  targetYear?: number;
  keyResults?: KeyResultUpdateData[];
  status?: string;
}
