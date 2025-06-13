import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import {
  pgTable,
  uuid,
  varchar,
  text,
  timestamp,
  integer,
  boolean,
  jsonb,
  decimal,
  pgEnum,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Database connection
const connectionString =
  process.env.DATABASE_URL ||
  'postgresql://postgres:Aa01029371843@localhost:5432/scheduling_app';

// Create the connection
const client = postgres(connectionString, {
  max: 10,
  idle_timeout: 20,
  connect_timeout: 10,
});

export const db = drizzle(client);

// Enums
export const priorityEnum = pgEnum('priority', [
  'low',
  'medium',
  'high',
  'critical',
]);
export const statusEnum = pgEnum('status', [
  'draft',
  'active',
  'completed',
  'paused',
  'cancelled',
]);
export const taskStatusEnum = pgEnum('task_status', [
  'pending',
  'in_progress',
  'completed',
  'cancelled',
  'rescheduled',
]);
export const categoryEnum = pgEnum('category', [
  'career',
  'health',
  'personal',
  'financial',
  'education',
  'other',
]);
export const energyLevelEnum = pgEnum('energy_level', [
  'low',
  'medium',
  'high',
]);
export const insightTypeEnum = pgEnum('insight_type', [
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
  'scheduling_habits',
  'conversational_interaction',
  'text_command_usage',
  'Voice_command'
]);
export const intentEnum = pgEnum('intent', [
  'add_task',
  'modify_task',
  'delete_task',
  'schedule_task',
  'create_goal',
  'create_objective',
  'create_roadmap',
  'ask_question',
]);

// Tables
export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  username: varchar('username', { length: 50 }).notNull().unique(),
  passwordHash: varchar('password_hash', { length: 255 }).notNull(),
  firstName: varchar('first_name', { length: 100 }),
  lastName: varchar('last_name', { length: 100 }),
  timezone: varchar('timezone', { length: 50 }).notNull().default('UTC'),
  preferences: jsonb('preferences').$type<{
    workingHours?: {
      start: string;
      end: string;
    };
    preferredTaskDuration?: number;
    energyLevels?: {
      morning: 'low' | 'medium' | 'high';
      afternoon: 'low' | 'medium' | 'high';
      evening: 'low' | 'medium' | 'high';
    };
  }>(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const goals = pgTable('goals', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  title: varchar('title', { length: 200 }).notNull(),
  description: text('description'),
  category: categoryEnum('category').notNull(),
  targetYear: integer('target_year').notNull(),
  priority: priorityEnum('priority').notNull().default('medium'),
  status: statusEnum('status').notNull().default('active'),
  aiDecomposed: boolean('ai_decomposed').notNull().default(false),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const monthlyObjectives = pgTable('monthly_objectives', {
  id: uuid('id').primaryKey().defaultRandom(),
  goalId: uuid('goal_id')
    .notNull()
    .references(() => goals.id, { onDelete: 'cascade' }),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  title: varchar('title', { length: 200 }).notNull(),
  description: text('description'),
  targetMonth: integer('target_month').notNull(),
  targetYear: integer('target_year').notNull(),
  keyResults: jsonb('key_results')
    .$type<
      Array<{
        id: string;
        description: string;
        targetValue?: number;
        currentValue: number;
        unit?: string;
        completed: boolean;
      }>
    >()
    .notNull()
    .default([]),
  status: statusEnum('status').notNull().default('active'),
  progress: decimal('progress', { precision: 5, scale: 2 })
    .notNull()
    .default('0'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const dailyTasks = pgTable('daily_tasks', {
  id: uuid('id').primaryKey().defaultRandom(),
  objectiveId: uuid('objective_id').references(() => monthlyObjectives.id, {
    onDelete: 'set null',
  }),
  goalId: uuid('goal_id').references(() => goals.id, { onDelete: 'set null' }),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  title: varchar('title', { length: 200 }).notNull(),
  description: text('description'),
  scheduledDate: timestamp('scheduled_date').notNull(),
  scheduledTime: varchar('scheduled_time', { length: 5 }), // "14:30"
  estimatedDuration: integer('estimated_duration').notNull().default(30),
  actualDuration: integer('actual_duration'),
  priority: priorityEnum('priority').notNull().default('medium'),
  status: taskStatusEnum('status').notNull().default('pending'),
  tags: jsonb('tags').$type<string[]>().notNull().default([]),
  location: varchar('location', { length: 200 }),
  reminderMinutes: integer('reminder_minutes'),
  completedAt: timestamp('completed_at'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const aiInsights = pgTable('ai_insights', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  insightType: insightTypeEnum('insight_type').notNull(),
  data: jsonb('data').notNull(),
  confidence: decimal('confidence', { precision: 3, scale: 2 }).notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const nlCommands = pgTable('nl_commands', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  originalText: text('original_text').notNull(),
  parsedIntent: intentEnum('parsed_intent').notNull(),
  extractedEntities: jsonb('extracted_entities').notNull(),
  actionTaken: boolean('action_taken').notNull().default(false),
  confidence: decimal('confidence', { precision: 3, scale: 2 }).notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  goals: many(goals),
  monthlyObjectives: many(monthlyObjectives),
  dailyTasks: many(dailyTasks),
  aiInsights: many(aiInsights),
  nlCommands: many(nlCommands),
}));

export const goalsRelations = relations(goals, ({ one, many }) => ({
  user: one(users, {
    fields: [goals.userId],
    references: [users.id],
  }),
  monthlyObjectives: many(monthlyObjectives),
  dailyTasks: many(dailyTasks),
}));

export const monthlyObjectivesRelations = relations(
  monthlyObjectives,
  ({ one, many }) => ({
    user: one(users, {
      fields: [monthlyObjectives.userId],
      references: [users.id],
    }),
    goal: one(goals, {
      fields: [monthlyObjectives.goalId],
      references: [goals.id],
    }),
    dailyTasks: many(dailyTasks),
  })
);

export const dailyTasksRelations = relations(dailyTasks, ({ one }) => ({
  user: one(users, {
    fields: [dailyTasks.userId],
    references: [users.id],
  }),
  goal: one(goals, {
    fields: [dailyTasks.goalId],
    references: [goals.id],
  }),
  objective: one(monthlyObjectives, {
    fields: [dailyTasks.objectiveId],
    references: [monthlyObjectives.id],
  }),
}));

export const aiInsightsRelations = relations(aiInsights, ({ one }) => ({
  user: one(users, {
    fields: [aiInsights.userId],
    references: [users.id],
  }),
}));

export const nlCommandsRelations = relations(nlCommands, ({ one }) => ({
  user: one(users, {
    fields: [nlCommands.userId],
    references: [users.id],
  }),
}));

// Connection management
export async function connectDB() {
  try {
    // Test the connection
    await client`SELECT 1`;
    console.log('✅ Database connected successfully');
    return true;
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    return false;
  }
}

export async function closeDB() {
  await client.end();
}

// Export types for TypeScript
export type DbUser = typeof users.$inferSelect;
export type DbGoal = typeof goals.$inferSelect;
export type DbMonthlyObjective = typeof monthlyObjectives.$inferSelect;
export type DbDailyTask = typeof dailyTasks.$inferSelect;
export type DbAIInsight = typeof aiInsights.$inferSelect;
export type DbNLCommand = typeof nlCommands.$inferSelect;

export type NewUser = typeof users.$inferInsert;
export type NewGoal = typeof goals.$inferInsert;
export type NewMonthlyObjective = typeof monthlyObjectives.$inferInsert;
export type NewDailyTask = typeof dailyTasks.$inferInsert;
export type NewAIInsight = typeof aiInsights.$inferInsert;
export type NewNLCommand = typeof nlCommands.$inferInsert;
