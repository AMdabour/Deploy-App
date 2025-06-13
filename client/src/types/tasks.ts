export interface TaskFilters {
  startDate: string;
  endDate: string;
  status: string;
  priority: string;
  objectiveId: string;
  goalId: string;
}

export interface TaskFormData {
  objectiveId?: string;
  goalId?: string;
  title: string;
  description?: string;
  scheduledDate: string;
  scheduledTime?: string;
  estimatedDuration?: number;
  priority: string;
  tags?: string[];
  location?: string;
  reminderMinutes?: number;
}

export const taskStatuses = [
  {
    value: 'pending',
    label: 'Pending',
    color: 'bg-warning/10 text-warning border-warning/20',
  },
  {
    value: 'completed',
    label: 'Completed',
    color: 'bg-success/10 text-success border-success/20',
  },
];

export const taskPriorities = [
  {
    value: 'low',
    label: 'Low',
    icon: '🟢',
    color: 'bg-muted/50 text-muted-foreground border-muted',
  },
  {
    value: 'medium',
    label: 'Medium',
    icon: '🟡',
    color: 'bg-info/10 text-info border-info/20',
  },
  {
    value: 'high',
    label: 'High',
    icon: '🟠',
    color: 'bg-warning/10 text-warning border-warning/20',
  },
  {
    value: 'critical',
    label: 'Critical',
    icon: '🔴',
    color: 'bg-destructive/10 text-destructive border-destructive/20',
  },
];
