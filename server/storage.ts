import { eq, and, gte, lte, desc, asc, sql } from 'drizzle-orm';
import {
  db,
  users,
  goals,
  monthlyObjectives,
  dailyTasks,
  aiInsights,
  nlCommands,
  type DbUser,
  type DbGoal,
  type DbMonthlyObjective,
  type DbDailyTask,
  type DbAIInsight,
  type DbNLCommand,
  type NewUser,
  type NewGoal,
  type NewMonthlyObjective,
  type NewDailyTask,
  type NewAIInsight,
  type NewNLCommand,
} from './db';
import bcrypt from 'bcrypt';

export const preprocessUpdateData = (data: any) => {
  if (data.scheduledDate && typeof data.scheduledDate === 'string') {
    try {
      data.scheduledDate = new Date(data.scheduledDate);
      if (isNaN(data.scheduledDate.getTime())) {
        throw new Error('Invalid date');
      }
    } catch {
      delete data.scheduledDate; // Remove invalid date from update
    }
  }
  return data;
};

// User operations
export class UserStorage {
  async createUser(
    userData: Omit<NewUser, 'id' | 'createdAt' | 'updatedAt'> & {
      password: string;
    }
  ): Promise<DbUser> {
    const { password, ...rest } = userData;
    const passwordHash = await bcrypt.hash(password, 12);

    const [user] = await db
      .insert(users)
      .values({
        ...rest,
        passwordHash,
      })
      .returning();

    return user;
  }

  async getUserById(id: string): Promise<DbUser | null> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || null;
  }

  async getUserByEmail(email: string): Promise<DbUser | null> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user || null;
  }

  async getUserByUsername(username: string): Promise<DbUser | null> {
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.username, username));
    return user || null;
  }

  async updateUser(
    id: string,
    updates: Partial<Omit<DbUser, 'id' | 'createdAt'>>
  ): Promise<DbUser | null> {
    const [user] = await db
      .update(users)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();

    return user || null;
  }

  async deleteUser(id: string): Promise<boolean> {
    const result = await db.delete(users).where(eq(users.id, id));
    return result.length > 0;
  }

  async verifyPassword(
    email: string,
    password: string
  ): Promise<DbUser | null> {
    const user = await this.getUserByEmail(email);
    if (!user) return null;

    const isValid = await bcrypt.compare(password, user.passwordHash);
    return isValid ? user : null;
  }
}

// Goal operations
export class GoalStorage {
  async createGoal(
    goalData: Omit<NewGoal, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<DbGoal> {
    const [goal] = await db.insert(goals).values(goalData).returning();
    return goal;
  }

  async getGoalById(id: string): Promise<DbGoal | null> {
    const [goal] = await db.select().from(goals).where(eq(goals.id, id));
    return goal || null;
  }

  async getUserGoals(userId: string, year?: number): Promise<DbGoal[]> {
    const conditions = [eq(goals.userId, userId)];

    if (year) {
      conditions.push(eq(goals.targetYear, year));
    }

    return await db
      .select()
      .from(goals)
      .where(and(...conditions))
      .orderBy(desc(goals.createdAt));
  }

  async getGoalsByUserId(userId: string, filters?: any): Promise<DbGoal[]> {
    try {
      let conditions = [eq(goals.userId, userId)];

      // Apply additional filters
      if (filters) {
        if (filters.targetYear) {
          conditions.push(eq(goals.targetYear, filters.targetYear));
        }
        if (filters.category) {
          conditions.push(eq(goals.category, filters.category));
        }
        if (filters.status) {
          conditions.push(eq(goals.status, filters.status));
        }
      }

      const result = await db
        .select()
        .from(goals)
        .where(and(...conditions))
        .orderBy(desc(goals.createdAt));
      return result;
    } catch (error) {
      console.error('Storage getGoalsByUserId error:', error);
      throw error;
    }
  }

  async updateGoal(
    id: string,
    updates: Partial<Omit<DbGoal, 'id' | 'createdAt'>>
  ): Promise<DbGoal | null> {
    const [goal] = await db
      .update(goals)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(goals.id, id))
      .returning();

    return goal || null;
  }

  async deleteGoal(id: string): Promise<boolean> {
    const result = await db.delete(goals).where(eq(goals.id, id));
    return result.length > 0;
  }

  async markGoalAsDecomposed(id: string): Promise<DbGoal | null> {
    return await this.updateGoal(id, { aiDecomposed: true });
  }
}

// Monthly Objective operations
export class MonthlyObjectiveStorage {
  async createObjective(
    objectiveData: Omit<NewMonthlyObjective, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<DbMonthlyObjective> {
    const [objective] = await db
      .insert(monthlyObjectives)
      .values(objectiveData)
      .returning();
    return objective;
  }

  async getObjectiveById(id: string): Promise<DbMonthlyObjective | null> {
    const [objective] = await db
      .select()
      .from(monthlyObjectives)
      .where(eq(monthlyObjectives.id, id));
    return objective || null;
  }

  async getGoalObjectives(goalId: string): Promise<DbMonthlyObjective[]> {
    return await db
      .select()
      .from(monthlyObjectives)
      .where(eq(monthlyObjectives.goalId, goalId))
      .orderBy(asc(monthlyObjectives.targetMonth));
  }

  async getUserObjectives(
    userId: string,
    month?: number,
    year?: number
  ): Promise<DbMonthlyObjective[]> {
    let conditions = [eq(monthlyObjectives.userId, userId)];

    if (month) conditions.push(eq(monthlyObjectives.targetMonth, month));
    if (year) conditions.push(eq(monthlyObjectives.targetYear, year));

    return await db
      .select()
      .from(monthlyObjectives)
      .where(and(...conditions))
      .orderBy(
        desc(monthlyObjectives.targetYear),
        desc(monthlyObjectives.targetMonth)
      );
  }

  async updateObjective(
    id: string,
    updates: Partial<Omit<DbMonthlyObjective, 'id' | 'createdAt'>>
  ): Promise<DbMonthlyObjective | null> {
    const [objective] = await db
      .update(monthlyObjectives)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(monthlyObjectives.id, id))
      .returning();

    return objective || null;
  }

  async updateObjectiveProgress(
    id: string,
    progress: number
  ): Promise<DbMonthlyObjective | null> {
    return await this.updateObjective(id, { progress: progress.toString() });
  }

  async deleteObjective(id: string): Promise<boolean> {
    const result = await db
      .delete(monthlyObjectives)
      .where(eq(monthlyObjectives.id, id));
    return result.length > 0;
  }
}

// Daily Task operations
export class DailyTaskStorage {
  async createTask(
    taskData: Omit<NewDailyTask, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<DbDailyTask> {
    const [task] = await db.insert(dailyTasks).values(taskData).returning();
    return task;
  }

  async getTaskById(id: string): Promise<DbDailyTask | null> {
    const [task] = await db
      .select()
      .from(dailyTasks)
      .where(eq(dailyTasks.id, id));
    return task || null;
  }

  async getUserTasks(
    userId: string,
    startDate?: Date,
    endDate?: Date
  ): Promise<DbDailyTask[]> {
    let conditions = [eq(dailyTasks.userId, userId)];

    if (startDate) conditions.push(gte(dailyTasks.scheduledDate, startDate));
    if (endDate) conditions.push(lte(dailyTasks.scheduledDate, endDate));

    return await db
      .select()
      .from(dailyTasks)
      .where(and(...conditions))
      .orderBy(asc(dailyTasks.scheduledDate), asc(dailyTasks.scheduledTime));
  }

  async getTasksByObjective(objectiveId: string): Promise<DbDailyTask[]> {
    return await db
      .select()
      .from(dailyTasks)
      .where(eq(dailyTasks.objectiveId, objectiveId))
      .orderBy(asc(dailyTasks.scheduledDate));
  }

  async getTasksByGoal(goalId: string): Promise<DbDailyTask[]> {
    return await db
      .select()
      .from(dailyTasks)
      .where(eq(dailyTasks.goalId, goalId))
      .orderBy(asc(dailyTasks.scheduledDate));
  }

  async updateTask(
    id: string,
    updates: Partial<Omit<DbDailyTask, 'id' | 'createdAt'>>
  ): Promise<DbDailyTask | null> {
    try {
      console.log('Storage updating task:', id, 'with data:', {
        ...updates,
        scheduledDate: updates.scheduledDate instanceof Date 
          ? updates.scheduledDate.toISOString() 
          : updates.scheduledDate,
      });

      // List of fields that should NEVER be updated
      const forbiddenFields = ['id', 'userId', 'createdAt'];
      
      // Clean the updates object
      const cleanUpdates: any = {};
      
      Object.entries(updates).forEach(([key, value]) => {
        // Skip forbidden fields
        if (forbiddenFields.includes(key)) {
          console.warn(`Skipping forbidden field: ${key}`);
          return;
        }

        // Special handling for date fields - ENSURE they remain as Date objects
        if (key === 'scheduledDate' || key === 'completedAt') {
          if (value instanceof Date) {
            cleanUpdates[key] = value; // ✅ Keep as Date object
          } else if (value && typeof value === 'string') {
            try {
              const date = new Date(value);
              if (!isNaN(date.getTime())) {
                cleanUpdates[key] = date; // ✅ Convert string to Date object
              }
            } catch (e) {
              console.warn(`Ignoring invalid date: ${value}`);
            }
          }
        } else if (value !== undefined) {
          cleanUpdates[key] = value;
        }
      });

      // Always set updatedAt to current time as Date object
      cleanUpdates.updatedAt = new Date();

      // Log with proper type checking
      console.log('Final clean updates for DB:', {
        ...cleanUpdates,
        scheduledDate: cleanUpdates.scheduledDate instanceof Date 
          ? `Date(${cleanUpdates.scheduledDate.toISOString()})` 
          : cleanUpdates.scheduledDate,
        updatedAt: cleanUpdates.updatedAt instanceof Date 
          ? `Date(${cleanUpdates.updatedAt.toISOString()})` 
          : cleanUpdates.updatedAt
      });

      // Verify all date fields are Date objects before database operation
      ['scheduledDate', 'completedAt', 'updatedAt'].forEach(field => {
        if (cleanUpdates[field] && !(cleanUpdates[field] instanceof Date)) {
          console.error(`❌ ${field} is not a Date object:`, typeof cleanUpdates[field], cleanUpdates[field]);
          // Convert to Date if possible
          try {
            cleanUpdates[field] = new Date(cleanUpdates[field]);
          } catch (e) {
            delete cleanUpdates[field]; // Remove if can't convert
          }
        }
      });

      const [task] = await db
        .update(dailyTasks)
        .set(cleanUpdates)
        .where(eq(dailyTasks.id, id))
        .returning();

      return task || null;
    } catch (error) {
      console.error('Storage updateTask error:', error);
      throw error;
    }
  }

  async completeTask(
    id: string,
    actualDuration?: number
  ): Promise<DbDailyTask | null> {
    const updates: any = {
      status: 'completed',
      completedAt: new Date(),
    };

    if (actualDuration) {
      updates.actualDuration = actualDuration;
    }

    return await this.updateTask(id, updates);
  }

  async deleteTask(id: string): Promise<boolean> {
    const result = await db.delete(dailyTasks).where(eq(dailyTasks.id, id));
    return result.length > 0;
  }

  async getTaskCompletionStats(
    userId: string,
    startDate: Date,
    endDate: Date
  ): Promise<{
    total: number;
    completed: number;
    completionRate: number;
  }> {
    const result = await db
      .select({
        total: sql<number>`count(*)`,
        completed: sql<number>`count(case when status = 'completed' then 1 end)`,
      })
      .from(dailyTasks)
      .where(
        and(
          eq(dailyTasks.userId, userId),
          gte(dailyTasks.scheduledDate, startDate),
          lte(dailyTasks.scheduledDate, endDate)
        )
      );

    const { total, completed } = result[0];
    const completionRate = total > 0 ? (completed / total) * 100 : 0;

    return { total, completed, completionRate };
  }
}

// AI Insights operations
export class AIInsightStorage {
  async createInsight(
    insightData: Omit<NewAIInsight, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<DbAIInsight> {
    const [insight] = await db
      .insert(aiInsights)
      .values(insightData)
      .returning();
    return insight;
  }

  async getInsightById(id: string): Promise<DbAIInsight | null> {
    const [insight] = await db
      .select()
      .from(aiInsights)
      .where(eq(aiInsights.id, id));
    return insight || null;
  }

  async getUserInsights(userId: string, type?: string): Promise<DbAIInsight[]> {
    let conditions = [eq(aiInsights.userId, userId)];

    if (type) {
      conditions.push(eq(aiInsights.insightType, type as any));
    }

    return await db
      .select()
      .from(aiInsights)
      .where(and(...conditions))
      .orderBy(desc(aiInsights.createdAt));
  }

  async updateInsight(
    id: string,
    updates: Partial<Omit<DbAIInsight, 'id' | 'createdAt'>>
  ): Promise<DbAIInsight | null> {
    const [insight] = await db
      .update(aiInsights)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(aiInsights.id, id))
      .returning();

    return insight || null;
  }

  async deleteInsight(id: string): Promise<boolean> {
    const result = await db.delete(aiInsights).where(eq(aiInsights.id, id));
    return result.length > 0;
  }
}

// Natural Language Command operations
export class NLCommandStorage {
  async createCommand(
    commandData: Omit<NewNLCommand, 'id' | 'createdAt'>
  ): Promise<DbNLCommand> {
    const [command] = await db
      .insert(nlCommands)
      .values(commandData)
      .returning();
    return command;
  }

  async getCommandById(id: string): Promise<DbNLCommand | null> {
    const [command] = await db
      .select()
      .from(nlCommands)
      .where(eq(nlCommands.id, id));
    return command || null;
  }

  async getUserCommands(
    userId: string,
    limit: number = 50
  ): Promise<DbNLCommand[]> {
    return await db
      .select()
      .from(nlCommands)
      .where(eq(nlCommands.userId, userId))
      .orderBy(desc(nlCommands.createdAt))
      .limit(limit);
  }

  async markCommandAsExecuted(id: string): Promise<DbNLCommand | null> {
    const [command] = await db
      .update(nlCommands)
      .set({ actionTaken: true })
      .where(eq(nlCommands.id, id))
      .returning();

    return command || null;
  }
}

import type { DbRefreshToken } from '../shared/schema';

export interface RefreshTokenStorage {
  storeRefreshToken(
    token: Omit<DbRefreshToken, 'id' | 'createdAt'>
  ): Promise<DbRefreshToken>;
  getRefreshToken(token: string): Promise<DbRefreshToken | null>;
  getRefreshTokensByUser(userId: string): Promise<DbRefreshToken[]>;
  revokeRefreshToken(token: string): Promise<boolean>;
  revokeAllUserTokens(userId: string): Promise<number>;
  cleanupExpiredTokens(): Promise<number>;
}

export class MemoryRefreshTokenStorage implements RefreshTokenStorage {
  private tokens: DbRefreshToken[] = [];

  async storeRefreshToken(
    tokenData: Omit<DbRefreshToken, 'id' | 'createdAt'>
  ): Promise<DbRefreshToken> {
    const token: DbRefreshToken = {
      ...tokenData,
      id: `refresh_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date(),
    };

    this.tokens.push(token);
    return token;
  }

  async getRefreshToken(token: string): Promise<DbRefreshToken | null> {
    return this.tokens.find((t) => t.token === token && !t.revoked) || null;
  }

  async getRefreshTokensByUser(userId: string): Promise<DbRefreshToken[]> {
    return this.tokens.filter((t) => t.userId === userId && !t.revoked);
  }

  async revokeRefreshToken(token: string): Promise<boolean> {
    const tokenRecord = this.tokens.find((t) => t.token === token);
    if (tokenRecord) {
      tokenRecord.revoked = true;
      tokenRecord.revokedAt = new Date();
      return true;
    }
    return false;
  }

  async revokeAllUserTokens(userId: string): Promise<number> {
    const userTokens = this.tokens.filter(
      (t) => t.userId === userId && !t.revoked
    );
    userTokens.forEach((token) => {
      token.revoked = true;
      token.revokedAt = new Date();
    });
    return userTokens.length;
  }

  async cleanupExpiredTokens(): Promise<number> {
    const now = new Date();
    const expiredTokens = this.tokens.filter((t) => t.expiresAt < now);

    expiredTokens.forEach((token) => {
      const index = this.tokens.indexOf(token);
      if (index > -1) {
        this.tokens.splice(index, 1);
      }
    });

    return expiredTokens.length;
  }
}

// Voice Commands operations
export class VoiceCommandStorage {
  async createVoiceCommand(
    voiceCommandData: {
      userId: string;
      transcript: string;
      confidence: number;
      language?: string;
      nlpResult?: any;
      executionResult?: any;
      processingTime?: number;
    }
  ): Promise<any> {
    // For now, we'll store voice commands in the AI insights table with a specific type
    // In a production app, you'd want a dedicated voice_commands table
    const insight = await this.insights.createInsight({
      userId: voiceCommandData.userId,
      insightType: 'Voice_command',
      data: {
        transcript: voiceCommandData.transcript,
        confidence: voiceCommandData.confidence,
        language: voiceCommandData.language,
        nlpResult: voiceCommandData.nlpResult,
        executionResult: voiceCommandData.executionResult,
        processingTime: voiceCommandData.processingTime,
        timestamp: new Date().toISOString()
      },
      confidence: voiceCommandData.confidence.toString(),
    });

    return {
      id: insight.id,
      userId: insight.userId,
      transcript: voiceCommandData.transcript,
      confidence: voiceCommandData.confidence,
      language: voiceCommandData.language,
      nlpResult: voiceCommandData.nlpResult,
      executionResult: voiceCommandData.executionResult,
      processingTime: voiceCommandData.processingTime,
      createdAt: insight.createdAt,
    };
  }

  async getVoiceCommands(
    userId: string,
    options: {
      limit?: number;
      offset?: number;
      dateFrom?: Date;
      dateTo?: Date;
    } = {}
  ): Promise<any[]> {
    const { limit = 50, offset = 0 } = options;
    
    // Get voice command insights
    const insights = await db
      .select()
      .from(aiInsights)
      .where(
        and(
          eq(aiInsights.userId, userId),
          eq(aiInsights.insightType, 'Voice_command')
        )
      )
      .orderBy(desc(aiInsights.createdAt))
      .limit(limit)
      .offset(offset);

    // Transform insights back to voice command format
    return insights.map(insight => ({
      id: insight.id,
      userId: insight.userId,
      transcript: (insight.data as any)?.transcript || '',
      confidence: (insight.data as any)?.confidence || 0,
      language: (insight.data as any)?.language || 'en',
      nlpResult: (insight.data as any)?.nlpResult,
      executionResult: (insight.data as any)?.executionResult,
      processingTime: (insight.data as any)?.processingTime || 0,
      createdAt: insight.createdAt,
    }));
  }

  async getVoiceCommandById(id: string): Promise<any | null> {
    const insight = await this.insights.getInsightById(id);
    if (!insight || insight.insightType !== 'Voice_command') {
      return null;
    }

    return {
      id: insight.id,
      userId: insight.userId,
      transcript: (insight.data as any)?.transcript || '',
      confidence: (insight.data as any)?.confidence || 0,
      language: (insight.data as any)?.language || 'en',
      nlpResult: (insight.data as any)?.nlpResult,
      executionResult: (insight.data as any)?.executionResult,
      processingTime: (insight.data as any)?.processingTime || 0,
      createdAt: insight.createdAt,
    };
  }

  // Reference to other storage classes for internal use
  private insights: AIInsightStorage;

  constructor(insights: AIInsightStorage) {
    this.insights = insights;
  }
}

// Unified Storage class
export class Storage {
  public users: UserStorage;
  public goals: GoalStorage;
  public objectives: MonthlyObjectiveStorage;
  public tasks: DailyTaskStorage;
  public insights: AIInsightStorage;
  public commands: NLCommandStorage;
  public refreshTokens: RefreshTokenStorage;
  public voiceCommands: VoiceCommandStorage; // Add this line

  constructor() {
    this.users = new UserStorage();
    this.goals = new GoalStorage();
    this.objectives = new MonthlyObjectiveStorage();
    this.tasks = new DailyTaskStorage();
    this.insights = new AIInsightStorage();
    this.commands = new NLCommandStorage();
    this.refreshTokens = new MemoryRefreshTokenStorage();
    this.voiceCommands = new VoiceCommandStorage(this.insights); // Add this line
  }

  // Database initialization and synchronization
  async initialize(): Promise<boolean> {
    try {
      console.log('🔄 Initializing database connection...');

      // Test connection
      const connected = await this.testConnection();
      if (!connected) {
        throw new Error('Database connection failed');
      }

      // Check database schema and apply migrations if needed
      await this.ensureSchema();

      console.log('✅ Database initialized successfully');
      return true;
    } catch (error) {
      console.error('❌ Database initialization failed:', error);
      return false;
    }
  }

  private async testConnection(): Promise<boolean> {
    try {
      await db.execute(sql`SELECT 1`);
      console.log('✅ Database connection test passed');
      return true;
    } catch (error) {
      console.error('❌ Database connection test failed:', error);
      throw error; // Re-throw to be caught by initialize()
    }
  }

  private async ensureSchema(): Promise<void> {
    try {
      console.log('🔄 Verifying database schema...');

      // Check if the required tables exist
      const tableCheck = await db.execute(sql`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public'
      `);

      const existingTables = tableCheck.map((row: any) => row.table_name);

      // List all the expected table names from our schema
      const expectedTables = [
        'users',
        'goals',
        'monthly_objectives',
        'daily_tasks',
        'ai_insights',
        'nl_commands',
      ];

      const missingTables = expectedTables.filter(
        (table) => !existingTables.includes(table)
      );

      if (missingTables.length > 0) {
        console.log(`⚠️ Missing tables detected: ${missingTables.join(', ')}`);
        console.log('🔄 Running drizzle migrations to create schema...');

        // In production code, you would trigger migrations here
        // For now, we'll throw an error instructing the user to run migrations manually
        throw new Error(
          `Database schema is incomplete. Please run 'npm run db:push' to create the missing tables: ${missingTables.join(
            ', '
          )}`
        );
      }

      // Check if enum types exist
      const enumCheck = await db.execute(sql`
        SELECT t.typname AS enum_name
        FROM pg_type t
        JOIN pg_enum e ON t.oid = e.enumtypid
        GROUP BY t.typname
      `);

      const existingEnums = enumCheck.map((row: any) => row.enum_name);

      // List all expected enum types
      const expectedEnums = [
        'priority',
        'status',
        'task_status',
        'category',
        'energy_level',
        'insight_type',
        'intent',
      ];

      const missingEnums = expectedEnums.filter(
        (enumType) => !existingEnums.includes(enumType)
      );

      if (missingEnums.length > 0) {
        console.log(`⚠️ Missing enum types: ${missingEnums.join(', ')}`);
        throw new Error(
          `Database enum types are missing. Please run 'npm run db:push' to create them: ${missingEnums.join(
            ', '
          )}`
        );
      }

      console.log('✅ Database schema verification complete');
    } catch (error) {
      console.error('❌ Schema verification failed:', error);
      throw error;
    }
  }

  // Update getObjectivesByUserId method
  async getObjectivesByUserId(userId: string, filters?: any): Promise<DbMonthlyObjective[]> {
    try {
      let conditions = [eq(monthlyObjectives.userId, userId)];

      // Apply additional filters
      if (filters) {
        if (filters.targetMonth) {
          conditions.push(eq(monthlyObjectives.targetMonth, filters.targetMonth));
        }
        if (filters.targetYear) {
          conditions.push(eq(monthlyObjectives.targetYear, filters.targetYear));
        }
        if (filters.goalId) {
          conditions.push(eq(monthlyObjectives.goalId, filters.goalId));
        }
        if (filters.status) {
          conditions.push(eq(monthlyObjectives.status, filters.status));
        }
      }

      const result = await db
        .select()
        .from(monthlyObjectives)
        .where(and(...conditions))
        .orderBy(desc(monthlyObjectives.createdAt));
      return result;
    } catch (error) {
      console.error('Storage getObjectivesByUserId error:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const storage = new Storage();
