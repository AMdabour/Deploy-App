import { z } from 'zod';

// User schema
export const UserSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  username: z.string().min(3).max(50),
  passwordHash: z.string(),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  timezone: z.string().default('UTC'),
  preferences: z
    .object({
      workingHours: z
        .object({
          start: z.string(), // "09:00"
          end: z.string(), // "17:00"
        })
        .optional(),
      preferredTaskDuration: z.number().default(30), // minutes
      energyLevels: z
        .object({
          morning: z.enum(['low', 'medium', 'high']).default('medium'),
          afternoon: z.enum(['low', 'medium', 'high']).default('medium'),
          evening: z.enum(['low', 'medium', 'high']).default('medium'),
        })
        .optional(),
    })
    .optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

// Annual Goal schema
export const GoalSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  title: z.string().min(5).max(200),
  description: z.string().optional(),
  category: z.enum([
    'career',
    'health',
    'personal',
    'financial',
    'education',
    'other',
  ]),
  targetYear: z.number().int().min(2024),
  priority: z.enum(['low', 'medium', 'high', 'critical']).default('medium'),
  status: z
    .enum(['draft', 'active', 'completed', 'paused', 'cancelled'])
    .default('active'),
  aiDecomposed: z.boolean().default(false),
  createdAt: z.date(),
  updatedAt: z.date(),
});

// Monthly Objective (OKR) schema
export const MonthlyObjectiveSchema = z.object({
  id: z.string().uuid(),
  goalId: z.string().uuid(),
  userId: z.string().uuid(),
  title: z.string().min(5).max(200),
  description: z.string().optional(),
  targetMonth: z.number().int().min(1).max(12),
  targetYear: z.number().int().min(2024),
  keyResults: z.array(
    z.object({
      id: z.string().uuid(),
      description: z.string(),
      targetValue: z.number().optional(),
      currentValue: z.number().default(0),
      unit: z.string().optional(), // "hours", "projects", "pages", etc.
      completed: z.boolean().default(false),
    })
  ),
  status: z.enum(['draft', 'active', 'completed', 'paused']).default('active'),
  progress: z.number().min(0).max(100).default(0),
  createdAt: z.date(),
  updatedAt: z.date(),
});

// Daily Task schema
export const DailyTaskSchema = z.object({
  id: z.string().uuid(),
  objectiveId: z.string().uuid().optional(), // Links to monthly objective
  goalId: z.string().uuid().optional(), // Direct link to goal if not part of objective
  userId: z.string().uuid(),
  title: z.string().min(1).max(200),
  description: z.string().optional(),
  scheduledDate: z.date(),
  scheduledTime: z.string().optional(), // "14:30"
  estimatedDuration: z.number().default(30), // minutes
  actualDuration: z.number().optional(),
  priority: z.enum(['low', 'medium', 'high', 'critical']).default('medium'),
  status: z
    .enum(['pending', 'in_progress', 'completed', 'cancelled', 'rescheduled'])
    .default('pending'),
  tags: z.array(z.string()).default([]),
  location: z.string().optional(),
  reminderMinutes: z.number().optional(), // minutes before task
  completedAt: z.date().optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

// AI Insights schema for learning user behavior
export const AIInsightSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  insightType: z.enum([
    'task_completion_pattern',
    'optimal_work_hours',
    'task_duration_accuracy',
    'priority_preference',
    'scheduling_preference',
    'goal_progress_pattern',
    'personalization_feedback',
    'personalization_adjustment',
    'suggestion_status_update',
    'suggestion_dismissed',
    'suggestion_generated',
    'personalization_preferences',
    'contextual_pattern_analysis',
    'conversational_pattern_analysis',
    'visual_workspace_analysis',
    'gemini_proactive_suggestion',
    'gemini_suggestion_dismissed',
    'voice_command_usage',
    'time_management',
    'priority_focus',
    'goal_alignment',
    'scheduling_habits'
  ]),
  data: z.record(z.any()), // Flexible JSON data for different insight types
  confidence: z.number().min(0).max(1), // AI confidence in this insight
  createdAt: z.date(),
  updatedAt: z.date(),
});

// Natural Language Command schema for tracking user interactions
export const NLCommandSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  originalText: z.string(),
  parsedIntent: z.enum([
    'add_task',
    'modify_task',
    'delete_task',
    'schedule_task',
    'create_goal',
    'create_objective',
    'create_roadmap',
    'ask_question',
  ]),
  extractedEntities: z.record(z.any()),
  actionTaken: z.boolean().default(false),
  confidence: z.number().min(0).max(1),
  createdAt: z.date(),
});

// Export types
export type User = z.infer<typeof UserSchema>;
export type Goal = z.infer<typeof GoalSchema>;
export type MonthlyObjective = z.infer<typeof MonthlyObjectiveSchema>;
export type DailyTask = z.infer<typeof DailyTaskSchema>;
export type AIInsight = z.infer<typeof AIInsightSchema>;
export type NLCommand = z.infer<typeof NLCommandSchema>;

// API Response types
export type ApiResponse<T> = {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
};

// Pagination types
export type PaginationParams = {
  page: number;
  limit: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
};

export type PaginatedResponse<T> = ApiResponse<{
  items: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}>;

export interface DbRefreshToken {
  id: string;
  userId: string;
  token: string;
  expiresAt: Date;
  revoked: boolean;
  revokedAt?: Date;
  deviceInfo?: string;
  ipAddress?: string;
  createdAt: Date;
}
