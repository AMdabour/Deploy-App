var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __esm = (fn, res) => function __init() {
  return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
};
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc2) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc2 = __getOwnPropDesc(from, key)) || desc2.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// server/db.ts
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
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
  pgEnum
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import dotenv from "dotenv";
async function connectDB() {
  try {
    await client`SELECT 1`;
    console.log("\u2705 Database connected successfully");
    return true;
  } catch (error) {
    console.error("\u274C Database connection failed:", error);
    return false;
  }
}
var connectionString, client, db, priorityEnum, statusEnum, taskStatusEnum, categoryEnum, energyLevelEnum, insightTypeEnum, intentEnum, users, goals, monthlyObjectives, dailyTasks, aiInsights, nlCommands, usersRelations, goalsRelations, monthlyObjectivesRelations, dailyTasksRelations, aiInsightsRelations, nlCommandsRelations;
var init_db = __esm({
  "server/db.ts"() {
    "use strict";
    dotenv.config();
    connectionString = process.env.DATABASE_URL || "postgresql://postgres:Aa01029371843@localhost:5432/scheduling_app";
    client = postgres(connectionString, {
      max: 10,
      idle_timeout: 20,
      connect_timeout: 10
    });
    db = drizzle(client);
    priorityEnum = pgEnum("priority", [
      "low",
      "medium",
      "high",
      "critical"
    ]);
    statusEnum = pgEnum("status", [
      "draft",
      "active",
      "completed",
      "paused",
      "cancelled"
    ]);
    taskStatusEnum = pgEnum("task_status", [
      "pending",
      "in_progress",
      "completed",
      "cancelled",
      "rescheduled"
    ]);
    categoryEnum = pgEnum("category", [
      "career",
      "health",
      "personal",
      "financial",
      "education",
      "other"
    ]);
    energyLevelEnum = pgEnum("energy_level", [
      "low",
      "medium",
      "high"
    ]);
    insightTypeEnum = pgEnum("insight_type", [
      "task_completion_pattern",
      "optimal_work_hours",
      "task_duration_accuracy",
      "priority_preference",
      "scheduling_preference",
      "goal_progress_pattern",
      "personalization_feedback",
      "personalization_adjustment",
      "suggestion_status_update",
      "suggestion_dismissed",
      "suggestion_generated",
      "personalization_preferences",
      "contextual_pattern_analysis",
      "conversational_pattern_analysis",
      "visual_workspace_analysis",
      "gemini_proactive_suggestion",
      "gemini_suggestion_dismissed",
      "voice_command_usage",
      "time_management",
      "priority_focus",
      "goal_alignment",
      "scheduling_habits",
      "conversational_interaction",
      "text_command_usage",
      "Voice_command"
    ]);
    intentEnum = pgEnum("intent", [
      "add_task",
      "modify_task",
      "delete_task",
      "schedule_task",
      "create_goal",
      "create_objective",
      "create_roadmap",
      "ask_question"
    ]);
    users = pgTable("users", {
      id: uuid("id").primaryKey().defaultRandom(),
      email: varchar("email", { length: 255 }).notNull().unique(),
      username: varchar("username", { length: 50 }).notNull().unique(),
      passwordHash: varchar("password_hash", { length: 255 }).notNull(),
      firstName: varchar("first_name", { length: 100 }),
      lastName: varchar("last_name", { length: 100 }),
      timezone: varchar("timezone", { length: 50 }).notNull().default("UTC"),
      preferences: jsonb("preferences").$type(),
      createdAt: timestamp("created_at").notNull().defaultNow(),
      updatedAt: timestamp("updated_at").notNull().defaultNow()
    });
    goals = pgTable("goals", {
      id: uuid("id").primaryKey().defaultRandom(),
      userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
      title: varchar("title", { length: 200 }).notNull(),
      description: text("description"),
      category: categoryEnum("category").notNull(),
      targetYear: integer("target_year").notNull(),
      priority: priorityEnum("priority").notNull().default("medium"),
      status: statusEnum("status").notNull().default("active"),
      aiDecomposed: boolean("ai_decomposed").notNull().default(false),
      createdAt: timestamp("created_at").notNull().defaultNow(),
      updatedAt: timestamp("updated_at").notNull().defaultNow()
    });
    monthlyObjectives = pgTable("monthly_objectives", {
      id: uuid("id").primaryKey().defaultRandom(),
      goalId: uuid("goal_id").notNull().references(() => goals.id, { onDelete: "cascade" }),
      userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
      title: varchar("title", { length: 200 }).notNull(),
      description: text("description"),
      targetMonth: integer("target_month").notNull(),
      targetYear: integer("target_year").notNull(),
      keyResults: jsonb("key_results").$type().notNull().default([]),
      status: statusEnum("status").notNull().default("active"),
      progress: decimal("progress", { precision: 5, scale: 2 }).notNull().default("0"),
      createdAt: timestamp("created_at").notNull().defaultNow(),
      updatedAt: timestamp("updated_at").notNull().defaultNow()
    });
    dailyTasks = pgTable("daily_tasks", {
      id: uuid("id").primaryKey().defaultRandom(),
      objectiveId: uuid("objective_id").references(() => monthlyObjectives.id, {
        onDelete: "set null"
      }),
      goalId: uuid("goal_id").references(() => goals.id, { onDelete: "set null" }),
      userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
      title: varchar("title", { length: 200 }).notNull(),
      description: text("description"),
      scheduledDate: timestamp("scheduled_date").notNull(),
      scheduledTime: varchar("scheduled_time", { length: 5 }),
      // "14:30"
      estimatedDuration: integer("estimated_duration").notNull().default(30),
      actualDuration: integer("actual_duration"),
      priority: priorityEnum("priority").notNull().default("medium"),
      status: taskStatusEnum("status").notNull().default("pending"),
      tags: jsonb("tags").$type().notNull().default([]),
      location: varchar("location", { length: 200 }),
      reminderMinutes: integer("reminder_minutes"),
      completedAt: timestamp("completed_at"),
      createdAt: timestamp("created_at").notNull().defaultNow(),
      updatedAt: timestamp("updated_at").notNull().defaultNow()
    });
    aiInsights = pgTable("ai_insights", {
      id: uuid("id").primaryKey().defaultRandom(),
      userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
      insightType: insightTypeEnum("insight_type").notNull(),
      data: jsonb("data").notNull(),
      confidence: decimal("confidence", { precision: 3, scale: 2 }).notNull(),
      createdAt: timestamp("created_at").notNull().defaultNow(),
      updatedAt: timestamp("updated_at").notNull().defaultNow()
    });
    nlCommands = pgTable("nl_commands", {
      id: uuid("id").primaryKey().defaultRandom(),
      userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
      originalText: text("original_text").notNull(),
      parsedIntent: intentEnum("parsed_intent").notNull(),
      extractedEntities: jsonb("extracted_entities").notNull(),
      actionTaken: boolean("action_taken").notNull().default(false),
      confidence: decimal("confidence", { precision: 3, scale: 2 }).notNull(),
      createdAt: timestamp("created_at").notNull().defaultNow()
    });
    usersRelations = relations(users, ({ many }) => ({
      goals: many(goals),
      monthlyObjectives: many(monthlyObjectives),
      dailyTasks: many(dailyTasks),
      aiInsights: many(aiInsights),
      nlCommands: many(nlCommands)
    }));
    goalsRelations = relations(goals, ({ one, many }) => ({
      user: one(users, {
        fields: [goals.userId],
        references: [users.id]
      }),
      monthlyObjectives: many(monthlyObjectives),
      dailyTasks: many(dailyTasks)
    }));
    monthlyObjectivesRelations = relations(
      monthlyObjectives,
      ({ one, many }) => ({
        user: one(users, {
          fields: [monthlyObjectives.userId],
          references: [users.id]
        }),
        goal: one(goals, {
          fields: [monthlyObjectives.goalId],
          references: [goals.id]
        }),
        dailyTasks: many(dailyTasks)
      })
    );
    dailyTasksRelations = relations(dailyTasks, ({ one }) => ({
      user: one(users, {
        fields: [dailyTasks.userId],
        references: [users.id]
      }),
      goal: one(goals, {
        fields: [dailyTasks.goalId],
        references: [goals.id]
      }),
      objective: one(monthlyObjectives, {
        fields: [dailyTasks.objectiveId],
        references: [monthlyObjectives.id]
      })
    }));
    aiInsightsRelations = relations(aiInsights, ({ one }) => ({
      user: one(users, {
        fields: [aiInsights.userId],
        references: [users.id]
      })
    }));
    nlCommandsRelations = relations(nlCommands, ({ one }) => ({
      user: one(users, {
        fields: [nlCommands.userId],
        references: [users.id]
      })
    }));
  }
});

// server/storage.ts
import { eq, and, gte, lte, desc, asc, sql } from "drizzle-orm";
import bcrypt from "bcrypt";
var UserStorage, GoalStorage, MonthlyObjectiveStorage, DailyTaskStorage, AIInsightStorage, NLCommandStorage, MemoryRefreshTokenStorage, VoiceCommandStorage, Storage, storage;
var init_storage = __esm({
  "server/storage.ts"() {
    "use strict";
    init_db();
    UserStorage = class {
      async createUser(userData) {
        const { password, ...rest } = userData;
        const passwordHash = await bcrypt.hash(password, 12);
        const [user] = await db.insert(users).values({
          ...rest,
          passwordHash
        }).returning();
        return user;
      }
      async getUserById(id) {
        const [user] = await db.select().from(users).where(eq(users.id, id));
        return user || null;
      }
      async getUserByEmail(email) {
        const [user] = await db.select().from(users).where(eq(users.email, email));
        return user || null;
      }
      async getUserByUsername(username) {
        const [user] = await db.select().from(users).where(eq(users.username, username));
        return user || null;
      }
      async updateUser(id, updates) {
        const [user] = await db.update(users).set({ ...updates, updatedAt: /* @__PURE__ */ new Date() }).where(eq(users.id, id)).returning();
        return user || null;
      }
      async deleteUser(id) {
        const result = await db.delete(users).where(eq(users.id, id));
        return result.length > 0;
      }
      async verifyPassword(email, password) {
        const user = await this.getUserByEmail(email);
        if (!user) return null;
        const isValid = await bcrypt.compare(password, user.passwordHash);
        return isValid ? user : null;
      }
    };
    GoalStorage = class {
      async createGoal(goalData) {
        const [goal] = await db.insert(goals).values(goalData).returning();
        return goal;
      }
      async getGoalById(id) {
        const [goal] = await db.select().from(goals).where(eq(goals.id, id));
        return goal || null;
      }
      async getUserGoals(userId, year) {
        const conditions = [eq(goals.userId, userId)];
        if (year) {
          conditions.push(eq(goals.targetYear, year));
        }
        return await db.select().from(goals).where(and(...conditions)).orderBy(desc(goals.createdAt));
      }
      async getGoalsByUserId(userId, filters) {
        try {
          let conditions = [eq(goals.userId, userId)];
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
          const result = await db.select().from(goals).where(and(...conditions)).orderBy(desc(goals.createdAt));
          return result;
        } catch (error) {
          console.error("Storage getGoalsByUserId error:", error);
          throw error;
        }
      }
      async updateGoal(id, updates) {
        const [goal] = await db.update(goals).set({ ...updates, updatedAt: /* @__PURE__ */ new Date() }).where(eq(goals.id, id)).returning();
        return goal || null;
      }
      async deleteGoal(id) {
        const result = await db.delete(goals).where(eq(goals.id, id));
        return result.length > 0;
      }
      async markGoalAsDecomposed(id) {
        return await this.updateGoal(id, { aiDecomposed: true });
      }
    };
    MonthlyObjectiveStorage = class {
      async createObjective(objectiveData) {
        const [objective] = await db.insert(monthlyObjectives).values(objectiveData).returning();
        return objective;
      }
      async getObjectiveById(id) {
        const [objective] = await db.select().from(monthlyObjectives).where(eq(monthlyObjectives.id, id));
        return objective || null;
      }
      async getGoalObjectives(goalId) {
        return await db.select().from(monthlyObjectives).where(eq(monthlyObjectives.goalId, goalId)).orderBy(asc(monthlyObjectives.targetMonth));
      }
      async getUserObjectives(userId, month, year) {
        let conditions = [eq(monthlyObjectives.userId, userId)];
        if (month) conditions.push(eq(monthlyObjectives.targetMonth, month));
        if (year) conditions.push(eq(monthlyObjectives.targetYear, year));
        return await db.select().from(monthlyObjectives).where(and(...conditions)).orderBy(
          desc(monthlyObjectives.targetYear),
          desc(monthlyObjectives.targetMonth)
        );
      }
      async updateObjective(id, updates) {
        const [objective] = await db.update(monthlyObjectives).set({ ...updates, updatedAt: /* @__PURE__ */ new Date() }).where(eq(monthlyObjectives.id, id)).returning();
        return objective || null;
      }
      async updateObjectiveProgress(id, progress) {
        return await this.updateObjective(id, { progress: progress.toString() });
      }
      async deleteObjective(id) {
        const result = await db.delete(monthlyObjectives).where(eq(monthlyObjectives.id, id));
        return result.length > 0;
      }
    };
    DailyTaskStorage = class {
      async createTask(taskData) {
        const [task] = await db.insert(dailyTasks).values(taskData).returning();
        return task;
      }
      async getTaskById(id) {
        const [task] = await db.select().from(dailyTasks).where(eq(dailyTasks.id, id));
        return task || null;
      }
      async getUserTasks(userId, startDate, endDate) {
        let conditions = [eq(dailyTasks.userId, userId)];
        if (startDate) conditions.push(gte(dailyTasks.scheduledDate, startDate));
        if (endDate) conditions.push(lte(dailyTasks.scheduledDate, endDate));
        return await db.select().from(dailyTasks).where(and(...conditions)).orderBy(asc(dailyTasks.scheduledDate), asc(dailyTasks.scheduledTime));
      }
      async getTasksByObjective(objectiveId) {
        return await db.select().from(dailyTasks).where(eq(dailyTasks.objectiveId, objectiveId)).orderBy(asc(dailyTasks.scheduledDate));
      }
      async getTasksByGoal(goalId) {
        return await db.select().from(dailyTasks).where(eq(dailyTasks.goalId, goalId)).orderBy(asc(dailyTasks.scheduledDate));
      }
      async updateTask(id, updates) {
        try {
          console.log("Storage updating task:", id, "with data:", {
            ...updates,
            scheduledDate: updates.scheduledDate instanceof Date ? updates.scheduledDate.toISOString() : updates.scheduledDate
          });
          const forbiddenFields = ["id", "userId", "createdAt"];
          const cleanUpdates = {};
          Object.entries(updates).forEach(([key, value]) => {
            if (forbiddenFields.includes(key)) {
              console.warn(`Skipping forbidden field: ${key}`);
              return;
            }
            if (key === "scheduledDate" || key === "completedAt") {
              if (value instanceof Date) {
                cleanUpdates[key] = value;
              } else if (value && typeof value === "string") {
                try {
                  const date = new Date(value);
                  if (!isNaN(date.getTime())) {
                    cleanUpdates[key] = date;
                  }
                } catch (e) {
                  console.warn(`Ignoring invalid date: ${value}`);
                }
              }
            } else if (value !== void 0) {
              cleanUpdates[key] = value;
            }
          });
          cleanUpdates.updatedAt = /* @__PURE__ */ new Date();
          console.log("Final clean updates for DB:", {
            ...cleanUpdates,
            scheduledDate: cleanUpdates.scheduledDate instanceof Date ? `Date(${cleanUpdates.scheduledDate.toISOString()})` : cleanUpdates.scheduledDate,
            updatedAt: cleanUpdates.updatedAt instanceof Date ? `Date(${cleanUpdates.updatedAt.toISOString()})` : cleanUpdates.updatedAt
          });
          ["scheduledDate", "completedAt", "updatedAt"].forEach((field) => {
            if (cleanUpdates[field] && !(cleanUpdates[field] instanceof Date)) {
              console.error(`\u274C ${field} is not a Date object:`, typeof cleanUpdates[field], cleanUpdates[field]);
              try {
                cleanUpdates[field] = new Date(cleanUpdates[field]);
              } catch (e) {
                delete cleanUpdates[field];
              }
            }
          });
          const [task] = await db.update(dailyTasks).set(cleanUpdates).where(eq(dailyTasks.id, id)).returning();
          return task || null;
        } catch (error) {
          console.error("Storage updateTask error:", error);
          throw error;
        }
      }
      async completeTask(id, actualDuration) {
        const updates = {
          status: "completed",
          completedAt: /* @__PURE__ */ new Date()
        };
        if (actualDuration) {
          updates.actualDuration = actualDuration;
        }
        return await this.updateTask(id, updates);
      }
      async deleteTask(id) {
        const result = await db.delete(dailyTasks).where(eq(dailyTasks.id, id));
        return result.length > 0;
      }
      async getTaskCompletionStats(userId, startDate, endDate) {
        const result = await db.select({
          total: sql`count(*)`,
          completed: sql`count(case when status = 'completed' then 1 end)`
        }).from(dailyTasks).where(
          and(
            eq(dailyTasks.userId, userId),
            gte(dailyTasks.scheduledDate, startDate),
            lte(dailyTasks.scheduledDate, endDate)
          )
        );
        const { total, completed } = result[0];
        const completionRate = total > 0 ? completed / total * 100 : 0;
        return { total, completed, completionRate };
      }
    };
    AIInsightStorage = class {
      async createInsight(insightData) {
        const [insight] = await db.insert(aiInsights).values(insightData).returning();
        return insight;
      }
      async getInsightById(id) {
        const [insight] = await db.select().from(aiInsights).where(eq(aiInsights.id, id));
        return insight || null;
      }
      async getUserInsights(userId, type) {
        let conditions = [eq(aiInsights.userId, userId)];
        if (type) {
          conditions.push(eq(aiInsights.insightType, type));
        }
        return await db.select().from(aiInsights).where(and(...conditions)).orderBy(desc(aiInsights.createdAt));
      }
      async updateInsight(id, updates) {
        const [insight] = await db.update(aiInsights).set({ ...updates, updatedAt: /* @__PURE__ */ new Date() }).where(eq(aiInsights.id, id)).returning();
        return insight || null;
      }
      async deleteInsight(id) {
        const result = await db.delete(aiInsights).where(eq(aiInsights.id, id));
        return result.length > 0;
      }
    };
    NLCommandStorage = class {
      async createCommand(commandData) {
        const [command] = await db.insert(nlCommands).values(commandData).returning();
        return command;
      }
      async getCommandById(id) {
        const [command] = await db.select().from(nlCommands).where(eq(nlCommands.id, id));
        return command || null;
      }
      async getUserCommands(userId, limit = 50) {
        return await db.select().from(nlCommands).where(eq(nlCommands.userId, userId)).orderBy(desc(nlCommands.createdAt)).limit(limit);
      }
      async markCommandAsExecuted(id) {
        const [command] = await db.update(nlCommands).set({ actionTaken: true }).where(eq(nlCommands.id, id)).returning();
        return command || null;
      }
    };
    MemoryRefreshTokenStorage = class {
      tokens = [];
      async storeRefreshToken(tokenData) {
        const token = {
          ...tokenData,
          id: `refresh_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          createdAt: /* @__PURE__ */ new Date()
        };
        this.tokens.push(token);
        return token;
      }
      async getRefreshToken(token) {
        return this.tokens.find((t) => t.token === token && !t.revoked) || null;
      }
      async getRefreshTokensByUser(userId) {
        return this.tokens.filter((t) => t.userId === userId && !t.revoked);
      }
      async revokeRefreshToken(token) {
        const tokenRecord = this.tokens.find((t) => t.token === token);
        if (tokenRecord) {
          tokenRecord.revoked = true;
          tokenRecord.revokedAt = /* @__PURE__ */ new Date();
          return true;
        }
        return false;
      }
      async revokeAllUserTokens(userId) {
        const userTokens = this.tokens.filter(
          (t) => t.userId === userId && !t.revoked
        );
        userTokens.forEach((token) => {
          token.revoked = true;
          token.revokedAt = /* @__PURE__ */ new Date();
        });
        return userTokens.length;
      }
      async cleanupExpiredTokens() {
        const now = /* @__PURE__ */ new Date();
        const expiredTokens = this.tokens.filter((t) => t.expiresAt < now);
        expiredTokens.forEach((token) => {
          const index = this.tokens.indexOf(token);
          if (index > -1) {
            this.tokens.splice(index, 1);
          }
        });
        return expiredTokens.length;
      }
    };
    VoiceCommandStorage = class {
      async createVoiceCommand(voiceCommandData) {
        const insight = await this.insights.createInsight({
          userId: voiceCommandData.userId,
          insightType: "Voice_command",
          data: {
            transcript: voiceCommandData.transcript,
            confidence: voiceCommandData.confidence,
            language: voiceCommandData.language,
            nlpResult: voiceCommandData.nlpResult,
            executionResult: voiceCommandData.executionResult,
            processingTime: voiceCommandData.processingTime,
            timestamp: (/* @__PURE__ */ new Date()).toISOString()
          },
          confidence: voiceCommandData.confidence.toString()
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
          createdAt: insight.createdAt
        };
      }
      async getVoiceCommands(userId, options = {}) {
        const { limit = 50, offset = 0 } = options;
        const insights = await db.select().from(aiInsights).where(
          and(
            eq(aiInsights.userId, userId),
            eq(aiInsights.insightType, "Voice_command")
          )
        ).orderBy(desc(aiInsights.createdAt)).limit(limit).offset(offset);
        return insights.map((insight) => ({
          id: insight.id,
          userId: insight.userId,
          transcript: insight.data?.transcript || "",
          confidence: insight.data?.confidence || 0,
          language: insight.data?.language || "en",
          nlpResult: insight.data?.nlpResult,
          executionResult: insight.data?.executionResult,
          processingTime: insight.data?.processingTime || 0,
          createdAt: insight.createdAt
        }));
      }
      async getVoiceCommandById(id) {
        const insight = await this.insights.getInsightById(id);
        if (!insight || insight.insightType !== "Voice_command") {
          return null;
        }
        return {
          id: insight.id,
          userId: insight.userId,
          transcript: insight.data?.transcript || "",
          confidence: insight.data?.confidence || 0,
          language: insight.data?.language || "en",
          nlpResult: insight.data?.nlpResult,
          executionResult: insight.data?.executionResult,
          processingTime: insight.data?.processingTime || 0,
          createdAt: insight.createdAt
        };
      }
      // Reference to other storage classes for internal use
      insights;
      constructor(insights) {
        this.insights = insights;
      }
    };
    Storage = class {
      users;
      goals;
      objectives;
      tasks;
      insights;
      commands;
      refreshTokens;
      voiceCommands;
      // Add this line
      constructor() {
        this.users = new UserStorage();
        this.goals = new GoalStorage();
        this.objectives = new MonthlyObjectiveStorage();
        this.tasks = new DailyTaskStorage();
        this.insights = new AIInsightStorage();
        this.commands = new NLCommandStorage();
        this.refreshTokens = new MemoryRefreshTokenStorage();
        this.voiceCommands = new VoiceCommandStorage(this.insights);
      }
      // Database initialization and synchronization
      async initialize() {
        try {
          console.log("\u{1F504} Initializing database connection...");
          const connected = await this.testConnection();
          if (!connected) {
            throw new Error("Database connection failed");
          }
          await this.ensureSchema();
          console.log("\u2705 Database initialized successfully");
          return true;
        } catch (error) {
          console.error("\u274C Database initialization failed:", error);
          return false;
        }
      }
      async testConnection() {
        try {
          await db.execute(sql`SELECT 1`);
          console.log("\u2705 Database connection test passed");
          return true;
        } catch (error) {
          console.error("\u274C Database connection test failed:", error);
          throw error;
        }
      }
      async ensureSchema() {
        try {
          console.log("\u{1F504} Verifying database schema...");
          const tableCheck = await db.execute(sql`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public'
      `);
          const existingTables = tableCheck.map((row) => row.table_name);
          const expectedTables = [
            "users",
            "goals",
            "monthly_objectives",
            "daily_tasks",
            "ai_insights",
            "nl_commands"
          ];
          const missingTables = expectedTables.filter(
            (table) => !existingTables.includes(table)
          );
          if (missingTables.length > 0) {
            console.log(`\u26A0\uFE0F Missing tables detected: ${missingTables.join(", ")}`);
            console.log("\u{1F504} Running drizzle migrations to create schema...");
            throw new Error(
              `Database schema is incomplete. Please run 'npm run db:push' to create the missing tables: ${missingTables.join(
                ", "
              )}`
            );
          }
          const enumCheck = await db.execute(sql`
        SELECT t.typname AS enum_name
        FROM pg_type t
        JOIN pg_enum e ON t.oid = e.enumtypid
        GROUP BY t.typname
      `);
          const existingEnums = enumCheck.map((row) => row.enum_name);
          const expectedEnums = [
            "priority",
            "status",
            "task_status",
            "category",
            "energy_level",
            "insight_type",
            "intent"
          ];
          const missingEnums = expectedEnums.filter(
            (enumType) => !existingEnums.includes(enumType)
          );
          if (missingEnums.length > 0) {
            console.log(`\u26A0\uFE0F Missing enum types: ${missingEnums.join(", ")}`);
            throw new Error(
              `Database enum types are missing. Please run 'npm run db:push' to create them: ${missingEnums.join(
                ", "
              )}`
            );
          }
          console.log("\u2705 Database schema verification complete");
        } catch (error) {
          console.error("\u274C Schema verification failed:", error);
          throw error;
        }
      }
      // Update getObjectivesByUserId method
      async getObjectivesByUserId(userId, filters) {
        try {
          let conditions = [eq(monthlyObjectives.userId, userId)];
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
          const result = await db.select().from(monthlyObjectives).where(and(...conditions)).orderBy(desc(monthlyObjectives.createdAt));
          return result;
        } catch (error) {
          console.error("Storage getObjectivesByUserId error:", error);
          throw error;
        }
      }
    };
    storage = new Storage();
  }
});

// server/services/authService.ts
import jwt from "jsonwebtoken";
var JWTService, jwtService;
var init_authService = __esm({
  "server/services/authService.ts"() {
    "use strict";
    JWTService = class {
      accessTokenSecret;
      refreshTokenSecret;
      accessTokenExpiry;
      refreshTokenExpiry;
      constructor() {
        this.accessTokenSecret = process.env.JWT_ACCESS_SECRET || "your-super-secret-access-key";
        this.refreshTokenSecret = process.env.JWT_REFRESH_SECRET || "your-super-secret-refresh-key";
        this.accessTokenExpiry = process.env.JWT_ACCESS_EXPIRY || "15m";
        this.refreshTokenExpiry = process.env.JWT_REFRESH_EXPIRY || "7d";
        if (!process.env.JWT_ACCESS_SECRET || !process.env.JWT_REFRESH_SECRET) {
          console.warn(
            "\u26A0\uFE0F  JWT secrets not configured. Using default values. THIS IS NOT SECURE FOR PRODUCTION!"
          );
        }
      }
      convertTimeToSeconds(time) {
        const match = time.match(/^(\d+)([mhd])$/);
        if (!match) {
          throw new Error(`Invalid time format: ${time}`);
        }
        const value = parseInt(match[1], 10);
        const unit = match[2];
        switch (unit) {
          case "m":
            return value * 60;
          case "h":
            return value * 60 * 60;
          case "d":
            return value * 60 * 60 * 24;
          default:
            throw new Error(`Unsupported unit: ${unit}`);
        }
      }
      /**
       * Generate access and refresh token pair
       */
      generateTokenPair(user) {
        const payload = {
          userId: user.id,
          email: user.email,
          username: user.username
        };
        const accessToken = jwt.sign(payload, this.accessTokenSecret, {
          expiresIn: this.convertTimeToSeconds(this.accessTokenExpiry),
          issuer: "scheduling-app",
          audience: "scheduling-app-users"
        });
        const refreshToken = jwt.sign(payload, this.refreshTokenSecret, {
          expiresIn: this.convertTimeToSeconds(this.accessTokenExpiry),
          issuer: "scheduling-app",
          audience: "scheduling-app-users"
        });
        return { accessToken, refreshToken };
      }
      /**
       * Generate only access token (for refresh operations)
       */
      generateAccessToken(user) {
        const payload = {
          userId: user.id,
          email: user.email,
          username: user.username
        };
        return jwt.sign(payload, this.accessTokenSecret, {
          expiresIn: this.convertTimeToSeconds(this.accessTokenExpiry),
          issuer: "scheduling-app",
          audience: "scheduling-app-users"
        });
      }
      /**
       * Validate access token
       */
      validateAccessToken(token) {
        try {
          const payload = jwt.verify(token, this.accessTokenSecret, {
            issuer: "scheduling-app",
            audience: "scheduling-app-users"
          });
          return {
            valid: true,
            payload
          };
        } catch (error) {
          if (error instanceof jwt.TokenExpiredError) {
            return {
              valid: false,
              expired: true,
              error: "Access token expired"
            };
          }
          if (error instanceof jwt.JsonWebTokenError) {
            return {
              valid: false,
              expired: false,
              error: "Invalid access token"
            };
          }
          return {
            valid: false,
            error: "Token validation failed"
          };
        }
      }
      /**
       * Validate refresh token
       */
      validateRefreshToken(token) {
        try {
          const payload = jwt.verify(token, this.refreshTokenSecret, {
            issuer: "scheduling-app",
            audience: "scheduling-app-users"
          });
          return {
            valid: true,
            payload
          };
        } catch (error) {
          if (error instanceof jwt.TokenExpiredError) {
            return {
              valid: false,
              expired: true,
              error: "Refresh token expired"
            };
          }
          if (error instanceof jwt.JsonWebTokenError) {
            return {
              valid: false,
              expired: false,
              error: "Invalid refresh token"
            };
          }
          return {
            valid: false,
            error: "Refresh token validation failed"
          };
        }
      }
      /**
       * Extract token from Authorization header
       */
      extractTokenFromHeader(authHeader) {
        if (!authHeader) return null;
        const parts = authHeader.split(" ");
        if (parts.length !== 2 || parts[0] !== "Bearer") {
          return null;
        }
        return parts[1];
      }
      /**
       * Get token expiration date
       */
      getTokenExpiration(token) {
        try {
          const decoded = jwt.decode(token);
          if (!decoded?.exp) return null;
          return new Date(decoded.exp * 1e3);
        } catch {
          return null;
        }
      }
      /**
       * Check if token is about to expire (within 5 minutes)
       */
      isTokenNearExpiry(token) {
        const expiration = this.getTokenExpiration(token);
        if (!expiration) return true;
        const fiveMinutesFromNow = new Date(Date.now() + 5 * 60 * 1e3);
        return expiration < fiveMinutesFromNow;
      }
    };
    jwtService = new JWTService();
  }
});

// server/middleware/auth.ts
function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  const token = jwtService.extractTokenFromHeader(authHeader);
  if (token) {
    const validation = jwtService.validateAccessToken(token);
    if (validation.valid && validation.payload) {
      req.user = {
        id: validation.payload.userId,
        email: validation.payload.email,
        username: validation.payload.username
      };
      req.token = token;
      return next();
    }
    if (validation.expired) {
      return res.status(401).json({
        success: false,
        error: "Access token expired",
        code: "TOKEN_EXPIRED"
      });
    }
    return res.status(401).json({
      success: false,
      error: "Invalid access token",
      code: "INVALID_TOKEN"
    });
  }
  const userId = req.session?.userId;
  if (!userId) {
    return res.status(401).json({
      success: false,
      error: "Authentication required",
      code: "AUTH_REQUIRED"
    });
  }
  req.user = { id: userId };
  next();
}
function requireRefreshToken(req, res, next) {
  const { refreshToken } = req.body;
  if (!refreshToken) {
    return res.status(400).json({
      success: false,
      error: "Refresh token required",
      code: "REFRESH_TOKEN_REQUIRED"
    });
  }
  const validation = jwtService.validateRefreshToken(refreshToken);
  if (!validation.valid) {
    return res.status(401).json({
      success: false,
      error: validation.error || "Invalid refresh token",
      code: validation.expired ? "REFRESH_TOKEN_EXPIRED" : "INVALID_REFRESH_TOKEN"
    });
  }
  req.user = {
    id: validation.payload.userId,
    email: validation.payload.email,
    username: validation.payload.username
  };
  next();
}
var init_auth = __esm({
  "server/middleware/auth.ts"() {
    "use strict";
    init_authService();
  }
});

// server/services/gemini-ai.ts
var gemini_ai_exports = {};
__export(gemini_ai_exports, {
  GeminiAIService: () => GeminiAIService,
  geminiAIService: () => geminiAIService
});
import { GoogleGenerativeAI } from "@google/generative-ai";
var genAI, GeminiAIService, geminiAIService;
var init_gemini_ai = __esm({
  "server/services/gemini-ai.ts"() {
    "use strict";
    init_storage();
    genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");
    GeminiAIService = class {
      model;
      visionModel;
      constructor() {
        this.model = genAI.getGenerativeModel({
          model: "gemini-2.0-flash-exp",
          generationConfig: {
            temperature: 0.7,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 8192
          }
        });
        this.visionModel = genAI.getGenerativeModel({
          model: "gemini-2.0-flash-exp"
        });
      }
      analyzeProductivityPatterns(completedTasks) {
        const dayPatterns = {};
        const timePatterns = {};
        completedTasks.forEach((task) => {
          const date = new Date(task.completedAt || task.scheduledDate);
          const dayOfWeek = date.toLocaleDateString("en-US", { weekday: "long" });
          dayPatterns[dayOfWeek] = (dayPatterns[dayOfWeek] || 0) + 1;
          if (task.scheduledTime) {
            const hour = parseInt(task.scheduledTime.split(":")[0]);
            const timeSlot = hour < 12 ? "Morning" : hour < 17 ? "Afternoon" : "Evening";
            timePatterns[timeSlot] = (timePatterns[timeSlot] || 0) + 1;
          }
        });
        const bestDay = Object.entries(dayPatterns).sort(([, a], [, b]) => b - a)[0];
        const bestTime = Object.entries(timePatterns).sort(([, a], [, b]) => b - a)[0];
        return `
Productivity Patterns:
- Most productive day: ${bestDay ? `${bestDay[0]} (${bestDay[1]} tasks completed)` : "No clear pattern"}
- Most productive time: ${bestTime ? `${bestTime[0]} (${bestTime[1]} tasks completed)` : "No clear pattern"}
- Total completed tasks with time data: ${Object.values(timePatterns).reduce((sum, count) => sum + count, 0)}

Day-by-day breakdown:
${Object.entries(dayPatterns).map(([day, count]) => `- ${day}: ${count} tasks`).join("\n")}

Time-slot breakdown:
${Object.entries(timePatterns).map(([time, count]) => `- ${time}: ${count} tasks`).join("\n")}
`;
      }
      buildProductivityInsightsPrompt(user, recentTasks, goals2, objectives, existingInsights) {
        const userContext = `
User Profile:
- Name: ${user.firstName || "User"} ${user.lastName || ""}
- Timezone: ${user.timezone}
- Working Hours: ${user.preferences?.workingHours?.start || "09:00"} - ${user.preferences?.workingHours?.end || "17:00"}
- Preferred Task Duration: ${user.preferences?.preferredTaskDuration || 30} minutes
- Energy Levels:
  - Morning: ${user.preferences?.energyLevels?.morning || "medium"}
  - Afternoon: ${user.preferences?.energyLevels?.afternoon || "medium"}
  - Evening: ${user.preferences?.energyLevels?.evening || "medium"}
`;
        const completedTasks = recentTasks.filter((t) => t.status === "completed");
        const pendingTasks = recentTasks.filter((t) => t.status === "pending");
        const overdueTasks = recentTasks.filter((t) => t.status === "pending" && new Date(t.scheduledDate) < /* @__PURE__ */ new Date());
        const taskAnalysis = `
Task Analysis (Last 30 Days):
- Total Tasks: ${recentTasks.length}
- Completed Tasks: ${completedTasks.length}
- Pending Tasks: ${pendingTasks.length}
- Overdue Tasks: ${overdueTasks.length}
- Completion Rate: ${recentTasks.length > 0 ? Math.round(completedTasks.length / recentTasks.length * 100) : 0}%

Task Completion Times:
${completedTasks.slice(0, 10).map((t) => `- ${t.title}: ${t.scheduledTime || "No time"} (${t.estimatedDuration || "No duration"}min)`).join("\n")}

Priority Distribution:
- Critical: ${recentTasks.filter((t) => t.priority === "critical").length}
- High: ${recentTasks.filter((t) => t.priority === "high").length}
- Medium: ${recentTasks.filter((t) => t.priority === "medium").length}
- Low: ${recentTasks.filter((t) => t.priority === "low").length}

Task Duration Analysis:
${completedTasks.slice(0, 5).map((t) => {
          const estimated = t.estimatedDuration || 0;
          const actual = t.actualDuration || estimated;
          const accuracy = estimated > 0 ? Math.round((estimated - Math.abs(estimated - actual)) / estimated * 100) : 100;
          return `- ${t.title}: Estimated ${estimated}min, Actual ${actual}min (${accuracy}% accuracy)`;
        }).join("\n")}
`;
        const goalAnalysis = `
Goals and Objectives:
- Active Goals: ${goals2.filter((g) => g.status === "active").length}
- Completed Goals: ${goals2.filter((g) => g.status === "completed").length}
- Active Objectives: ${objectives.filter((o) => o.status === "active").length}
- Average Objective Progress: ${objectives.length > 0 ? Math.round(objectives.reduce((sum, o) => sum + (o.progress || 0), 0) / objectives.length) : 0}%

Recent Goals:
${goals2.slice(0, 3).map((g) => `- ${g.title} (${g.category}, ${g.status})`).join("\n")}

Recent Objectives Progress:
${objectives.slice(0, 5).map((o) => `- ${o.title}: ${o.progress || 0}% complete (Month ${o.targetMonth})`).join("\n")}
`;
        const productivityPatterns = this.analyzeProductivityPatterns(completedTasks);
        return `${userContext}
${taskAnalysis}
${goalAnalysis}
${productivityPatterns}

Please analyze this data to provide actionable productivity insights that will help the user improve their effectiveness and goal achievement.`;
      }
      async generateProductivityInsights(userId) {
        try {
          const user = await storage.users.getUserById(userId);
          if (!user) {
            throw new Error("User not found");
          }
          const thirtyDaysAgo = /* @__PURE__ */ new Date();
          thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
          const recentTasks = await storage.tasks.getUserTasks(userId, thirtyDaysAgo, /* @__PURE__ */ new Date());
          const userGoals = await storage.goals.getUserGoals(userId);
          const userObjectives = await storage.objectives.getUserObjectives(userId);
          const existingInsights = await storage.insights.getUserInsights(userId);
          const prompt = this.buildProductivityInsightsPrompt(user, recentTasks, userGoals, userObjectives, existingInsights);
          const result = await this.model.generateContent([
            {
              text: `You are an expert productivity analyst and personal development coach. Analyze user data to provide actionable insights that will improve their productivity and goal achievement.

CRITICAL: You must respond with ONLY valid JSON, no other text.

ANALYSIS REQUIREMENTS:
1. Analyze task completion patterns and timing
2. Identify optimal work hours based on completed tasks
3. Evaluate task duration accuracy vs estimates
4. Assess priority management effectiveness
5. Review goal progress and alignment
6. Identify scheduling preferences and habits
7. Provide specific, actionable recommendations

INSIGHT TYPES:
- task_completion_pattern: When and how tasks are typically completed
- optimal_work_hours: Best times for productivity based on data
- task_duration_accuracy: How well estimated vs actual durations match
- priority_preference: How user handles different priority levels
- scheduling_preference: User's scheduling habits and preferences
- goal_progress_pattern: Progress toward goals and objectives

JSON SCHEMA (MUST FOLLOW EXACTLY):
{
  "insights": [
    {
      "type": "task_completion_pattern|optimal_work_hours|task_duration_accuracy|priority_preference|scheduling_preference|goal_progress_pattern",
      "title": "string (brief insight title)",
      "description": "string (detailed explanation of the insight)",
      "actionable_tips": ["string", "string", "string"],
      "confidence": number (0-1)
    }
  ],
  "overall_productivity_score": number (0-100),
  "summary": "string (overall productivity assessment)",
  "recommendations": ["string", "string", "string"]
}

USER DATA:
${prompt}`
            }
          ]);
          const response = result.response.text();
          const cleanedResponse = this.extractJsonFromResponse(response);
          const insightsResult = JSON.parse(cleanedResponse);
          this.validateProductivityInsightsResult(insightsResult);
          return insightsResult;
        } catch (error) {
          console.error("Error in Gemini productivity insights generation:", error);
          throw new Error(`Failed to generate productivity insights: ${error instanceof Error ? error.message : String(error)}`);
        }
      }
      analyzeProductivityTimes(historicalTasks) {
        const timeSlots = {
          "morning": historicalTasks.filter((t) => {
            const time = t.scheduledTime;
            return time && time >= "06:00" && time < "12:00";
          }).length,
          "afternoon": historicalTasks.filter((t) => {
            const time = t.scheduledTime;
            return time && time >= "12:00" && time < "18:00";
          }).length,
          "evening": historicalTasks.filter((t) => {
            const time = t.scheduledTime;
            return time && time >= "18:00" && time < "24:00";
          }).length
        };
        return Object.entries(timeSlots).map(([period, count]) => `- ${period}: ${count} completed tasks`).join("\n");
      }
      buildScheduleOptimizationPrompt(user, targetDate, tasksToSchedule, historicalTasks) {
        const dateStr = targetDate.toISOString().split("T")[0];
        const dayOfWeek = targetDate.toLocaleDateString("en-US", { weekday: "long" });
        const userContext = `
User Profile:
- Working Hours: ${user.preferences?.workingHours?.start || "09:00"} - ${user.preferences?.workingHours?.end || "17:00"}
- Energy Levels:
  - Morning: ${user.preferences?.energyLevels?.morning || "medium"}
  - Afternoon: ${user.preferences?.energyLevels?.afternoon || "medium"}
  - Evening: ${user.preferences?.energyLevels?.evening || "medium"}
- Preferred Task Duration: ${user.preferences?.preferredTaskDuration || 30} minutes
- Timezone: ${user.timezone}
`;
        const scheduleContext = `
Schedule Optimization for: ${dateStr} (${dayOfWeek})

Tasks to Schedule:
${tasksToSchedule.map((t) => `
- ID: ${t.id}
- Title: ${t.title}
- Duration: ${t.estimatedDuration || 30} minutes
- Priority: ${t.priority || "medium"}
- Current Time: ${t.scheduledTime || "Not scheduled"}
- Description: ${t.description || "No description"}
`).join("")}

Historical Productivity Patterns:
${historicalTasks.slice(0, 10).map((t) => `
- Completed: ${t.title} at ${t.scheduledTime || "No time"} (${t.estimatedDuration || "Unknown"}min, ${t.priority})
`).join("")}

Peak Productivity Times (based on completed tasks):
${this.analyzeProductivityTimes(historicalTasks)}
`;
        return `${userContext}
${scheduleContext}

Optimize the schedule for maximum productivity considering user preferences, task priorities, and historical patterns.`;
      }
      /**
       * Optimize schedule for a specific date
       */
      async optimizeSchedule(userId, date, tasks) {
        try {
          const user = await storage.users.getUserById(userId);
          if (!user) {
            throw new Error("User not found");
          }
          const sevenDaysAgo = new Date(date);
          sevenDaysAgo.setDate(date.getDate() - 7);
          const recentTasks = await storage.tasks.getUserTasks(userId, sevenDaysAgo, date);
          const completedTasks = recentTasks.filter((t) => t.status === "completed");
          const prompt = this.buildScheduleOptimizationPrompt(user, date, tasks, completedTasks);
          const result = await this.model.generateContent([
            {
              text: `You are an expert schedule optimizer and time management specialist. Analyze the given tasks and user patterns to create an optimal daily schedule.

CRITICAL: You must respond with ONLY valid JSON, no other text.

OPTIMIZATION CRITERIA:
1. User's working hours and energy levels
2. Task priorities and estimated durations
3. Historical productivity patterns
4. Task dependencies and logical sequencing
5. Buffer time for breaks and unexpected delays
6. Energy matching (high-energy tasks during peak hours)
7. Context switching minimization

CONSIDERATIONS:
- Schedule high-priority tasks during peak energy hours
- Group similar tasks together to reduce context switching
- Include breaks between intensive tasks
- Leave buffer time for overruns
- Consider task dependencies
- Respect user's working hours
- Balance workload throughout the day

JSON SCHEMA (MUST FOLLOW EXACTLY):
{
  "optimizedSchedule": [
    {
      "taskId": "string",
      "suggestedTime": "HH:MM",
      "reason": "string (explanation for this timing)"
    }
  ],
  "insights": [
    "string (scheduling insight or recommendation)"
  ],
  "productivityScore": number (0-100, expected productivity for this schedule)
}

USER DATA AND TASKS:
${prompt}`
            }
          ]);
          const response = result.response.text();
          const cleanedResponse = this.extractJsonFromResponse(response);
          const optimizationResult = JSON.parse(cleanedResponse);
          this.validateScheduleOptimizationResult(optimizationResult);
          return optimizationResult;
        } catch (error) {
          console.error("Error in Gemini schedule optimization:", error);
          throw new Error(`Failed to optimize schedule: ${error instanceof Error ? error.message : String(error)}`);
        }
      }
      getModel() {
        return this.model;
      }
      getVisionModel() {
        return this.visionModel;
      }
      /**
       * Decompose an annual goal into monthly objectives with key results
       */
      async decomposeGoal(goal, user) {
        try {
          const prompt = this.buildGoalDecompositionPrompt(goal, user);
          const result = await this.model.generateContent([
            {
              text: `You are an expert goal strategist and productivity coach. Your task is to break down annual goals into actionable monthly objectives with measurable key results (OKRs).

CRITICAL REQUIREMENTS:
1. Create exactly 12 monthly objectives (one for each month)
2. Each objective must have 2-4 key results
3. Key results must be specific, measurable, and time-bound
4. Consider the user's context and preferences
5. Ensure progressive difficulty and logical sequencing
6. Response MUST be valid JSON only, no additional text

JSON SCHEMA:
{
  "monthlyObjectives": [
    {
      "title": "string",
      "description": "string", 
      "targetMonth": number,
      "keyResults": [
        {
          "description": "string",
          "targetValue": number (optional),
          "unit": "string" (optional)
        }
      ]
    }
  ],
  "reasoning": "string explaining the decomposition strategy",
  "confidence": number between 0 and 1
}

USER INPUT:
${prompt}`
            }
          ]);
          const response = result.response.text();
          const cleanedResponse = this.extractJsonFromResponse(response);
          const decompositionResult = JSON.parse(cleanedResponse);
          this.validateGoalDecompositionResult(decompositionResult);
          return decompositionResult;
        } catch (error) {
          console.error("Error in Gemini goal decomposition:", error);
          const errorMessage = error instanceof Error ? error.message : String(error);
          throw new Error(`Failed to decompose goal: ${errorMessage}`);
        }
      }
      /**
       * Generate daily tasks from monthly objectives
       */
      async generateTasksFromObjective(objective, goal, user, weekNumber = 1) {
        try {
          const prompt = this.buildTaskGenerationPrompt(objective, goal, user, weekNumber);
          const result = await this.model.generateContent([
            {
              text: `You are a productivity expert specializing in task breakdown and scheduling. Break down monthly objectives into specific, actionable daily tasks.

CRITICAL REQUIREMENTS:
1. Generate 5-10 tasks for the specified week
2. Tasks must be specific and actionable
3. Consider user's working hours and preferences
4. Estimate realistic durations (15-120 minutes)
5. Assign appropriate priorities
6. Suggest optimal days and times
7. Include relevant tags for organization
8. Response MUST be valid JSON only

JSON SCHEMA:
{
  "tasks": [
    {
      "title": "string",
      "description": "string (optional)",
      "estimatedDuration": number (minutes),
      "priority": "low|medium|high|critical",
      "suggestedDate": "YYYY-MM-DD (optional)",
      "suggestedTime": "HH:MM (optional)",
      "tags": ["string"]
    }
  ],
  "reasoning": "string explaining the task selection and scheduling",
  "confidence": number between 0 and 1
}

USER INPUT:
${prompt}`
            }
          ]);
          const response = result.response.text();
          const cleanedResponse = this.extractJsonFromResponse(response);
          const taskResult = JSON.parse(cleanedResponse);
          this.validateTaskGenerationResult(taskResult);
          return taskResult;
        } catch (error) {
          console.error("Error in Gemini task generation:", error);
          const errorMessage = error instanceof Error ? error.message : String(error);
          throw new Error(`Failed to generate tasks: ${errorMessage}`);
        }
      }
      /**
       * Process natural language commands with enhanced NLP including roadmap creation
       */
      async processNaturalLanguage(text2, user, context) {
        try {
          const prompt = this.buildEnhancedNLProcessingPrompt(text2, user, context);
          const result = await this.model.generateContent([
            {
              text: `You are an intelligent task management assistant. Parse natural language commands related to scheduling, task management, goal creation, objective creation, and roadmap planning.

CRITICAL: You must respond with ONLY valid JSON, no other text.

Supported intents:
- add_task: Creating new tasks
- modify_task: Updating existing tasks  
- delete_task: Removing tasks
- schedule_task: Scheduling or rescheduling tasks
- create_goal: Creating new annual goals
- create_objective: Creating new monthly objectives
- create_roadmap: Creating complete yearly roadmaps with goals, objectives, and tasks
- ask_question: Information queries

For ROADMAPS, extract:
- prompt: the complete description of what the user wants to achieve
- description: detailed explanation of the desired outcome
- timeframe: when they want to accomplish this
- category: career|health|personal|financial|education|other

For GOALS, extract:
- title: goal name (required)
- description: detailed description
- category: career|health|personal|financial|education|other
- year: target year
- priority: low|medium|high|critical

For OBJECTIVES, extract:
- title: objective name (required)
- description: detailed description
- goal: related goal name (required)
- month: target month (1-12)
- year: target year

For TASKS, extract:
- title: task name (required)
- description: task details
- date: when to do it
- time: specific time
- duration: estimated minutes
- priority: low|medium|high|critical
- objective: related objective name
- goal: related goal name

JSON Schema:
{
  "intent": "add_task|modify_task|delete_task|schedule_task|create_goal|create_objective|create_roadmap|ask_question",
  "entities": {
    "title": "string",
    "description": "string",
    "prompt": "string",
    "category": "string",
    "year": number,
    "month": number,
    "priority": "string",
    "date": "string",
    "time": "string",
    "duration": number,
    "objective": "string",
    "goal": "string",
    "timeframe": "string"
  },
  "confidence": number,
  "response": "string"
}

Examples:
"Create a roadmap to become a senior developer this year" -> intent: create_roadmap
"I want to plan my fitness journey for 2024" -> intent: create_roadmap
"Build a complete plan to learn Python programming" -> intent: create_roadmap

USER INPUT: ${prompt}`
            }
          ]);
          const response = result.response.text();
          const cleanedResponse = this.extractJsonFromResponse(response);
          const parsed = JSON.parse(cleanedResponse);
          this.validateNLProcessingResult(parsed);
          return parsed;
        } catch (error) {
          console.error("Error in Gemini NL processing:", error);
          throw new Error(`Failed to process natural language: ${error instanceof Error ? error.message : String(error)}`);
        }
      }
      /**
       * Create a complete roadmap from a natural language prompt
       */
      async createRoadmap(prompt, user) {
        try {
          const roadmapPrompt = this.buildRoadmapPrompt(prompt, user);
          const result = await this.model.generateContent([
            {
              text: `You are an expert productivity and goal-setting strategist. Create comprehensive yearly roadmaps that break down into monthly objectives and daily tasks with proper scheduling.

CRITICAL: You must respond with ONLY valid JSON, no other text.

REQUIREMENTS:
1. Always create ONE annual goal
2. Break it into 12 monthly objectives (or fewer if goal is shorter-term)
3. Each objective should have 2-4 measurable key results
4. Generate specific daily tasks distributed throughout the year
5. Schedule tasks with realistic dates and times
6. Consider user's working hours and preferences
7. Ensure logical progression and dependencies
8. Balance workload across months
9. Include buffer time and review periods

JSON SCHEMA (MUST FOLLOW EXACTLY):
{
  "goal": {
    "title": "string (5-100 chars)",
    "description": "string (detailed explanation)",
    "category": "career|health|personal|financial|education|other",
    "year": number,
    "priority": "low|medium|high|critical"
  },
  "objectives": [
    {
      "title": "string (specific monthly objective)",
      "description": "string (detailed description)",
      "targetMonth": number (1-12),
      "keyResults": [
        {
          "description": "string (measurable outcome)",
          "targetValue": number (optional),
          "unit": "string (optional - hours, projects, etc.)"
        }
      ]
    }
  ],
  "tasks": [
    {
      "title": "string (specific actionable task)",
      "description": "string (optional details)",
      "estimatedDuration": number (15-480 minutes),
      "priority": "low|medium|high|critical",
      "scheduledDate": "YYYY-MM-DD",
      "scheduledTime": "HH:MM (optional)",
      "tags": ["string"],
      "objectiveMonth": number (1-12, which month this task belongs to)
    }
  ],
  "reasoning": "string (explanation of the roadmap strategy)",
  "confidence": number (0-1),
  "timeline": {
    "startDate": "YYYY-MM-DD",
    "endDate": "YYYY-MM-DD",
    "milestones": [
      {
        "month": number,
        "title": "string",
        "description": "string"
      }
    ]
  }
}

USER REQUEST: ${roadmapPrompt}`
            }
          ]);
          const response = result.response.text();
          const cleanedResponse = this.extractJsonFromResponse(response);
          const parsed = JSON.parse(cleanedResponse);
          this.validateRoadmapResult(parsed);
          return parsed;
        } catch (error) {
          console.error("Error in Gemini roadmap generation:", error);
          throw new Error(`Failed to generate roadmap: ${error instanceof Error ? error.message : String(error)}`);
        }
      }
      buildEnhancedNLProcessingPrompt(text2, user, context) {
        const userContext = `
User Context:
- Name: ${user.firstName || "User"} ${user.lastName || ""}
- Timezone: ${user.timezone}
- Working Hours: ${user.preferences?.workingHours?.start || "09:00"} - ${user.preferences?.workingHours?.end || "17:00"}
`;
        const contextInfo = context ? `
Additional Context: ${JSON.stringify(context)}` : "";
        return `${userContext}${contextInfo}

User Input: "${text2}"`;
      }
      // Private helper methods
      extractJsonFromResponse(response) {
        let cleaned = response.replace(/```json\n?/g, "").replace(/```\n?/g, "");
        const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          return jsonMatch[0];
        }
        return cleaned.trim();
      }
      buildGoalDecompositionPrompt(goal, user) {
        const userContext = `
User Context:
- Name: ${user.firstName || "User"} ${user.lastName || ""}
- Timezone: ${user.timezone}
- Working Hours: ${user.preferences?.workingHours?.start || "09:00"} - ${user.preferences?.workingHours?.end || "17:00"}
- Preferred Task Duration: ${user.preferences?.preferredTaskDuration || 30} minutes
- Energy Levels: Morning: ${user.preferences?.energyLevels?.morning || "medium"}, Afternoon: ${user.preferences?.energyLevels?.afternoon || "medium"}, Evening: ${user.preferences?.energyLevels?.evening || "medium"}
`;
        const goalContext = `
Goal to Decompose:
- Title: ${goal.title}
- Description: ${goal.description || "No description provided"}
- Category: ${goal.category}
- Target Year: ${goal.targetYear}
- Priority: ${goal.priority}
- Current Status: ${goal.status}
`;
        return `${userContext}
${goalContext}

Please break down this annual goal into 12 monthly objectives with specific, measurable key results. Consider the user's schedule, preferences, and energy patterns. Make sure the progression is logical and achievable.`;
      }
      buildTaskGenerationPrompt(objective, goal, user, weekNumber) {
        const objectiveContext = `
Monthly Objective:
- Title: ${objective.title}
- Description: ${objective.description || "No description provided"}
- Target Month: ${objective.targetMonth}
- Key Results: ${JSON.stringify(objective.keyResults, null, 2)}
- Current Progress: ${objective.progress}%
`;
        const userContext = `
User Context:
- Working Hours: ${user.preferences?.workingHours?.start || "09:00"} - ${user.preferences?.workingHours?.end || "17:00"}
- Preferred Task Duration: ${user.preferences?.preferredTaskDuration || 30} minutes
- Energy Levels: Morning: ${user.preferences?.energyLevels?.morning || "medium"}, Afternoon: ${user.preferences?.energyLevels?.afternoon || "medium"}, Evening: ${user.preferences?.energyLevels?.evening || "medium"}
`;
        return `${objectiveContext}
${userContext}

Generate specific, actionable tasks for week ${weekNumber} of this month that will help achieve the objective and its key results. Consider the user's working hours and energy patterns when suggesting times.`;
      }
      buildRoadmapPrompt(prompt, user) {
        const currentDate = /* @__PURE__ */ new Date();
        const currentYear = currentDate.getFullYear();
        const currentMonth = currentDate.getMonth() + 1;
        const userContext = `
User Context:
- Name: ${user.firstName || "User"} ${user.lastName || ""}
- Timezone: ${user.timezone}
- Current Date: ${currentDate.toISOString().split("T")[0]}
- Current Year: ${currentYear}
- Current Month: ${currentMonth}
- Working Hours: ${user.preferences?.workingHours?.start || "09:00"} - ${user.preferences?.workingHours?.end || "17:00"}
- Preferred Task Duration: ${user.preferences?.preferredTaskDuration || 30} minutes
- Energy Levels: 
  - Morning: ${user.preferences?.energyLevels?.morning || "medium"}
  - Afternoon: ${user.preferences?.energyLevels?.afternoon || "medium"}
  - Evening: ${user.preferences?.energyLevels?.evening || "medium"}
`;
        return `${userContext}

User's Roadmap Request: "${prompt}"

Create a complete yearly roadmap considering:
- Start from current date: ${currentDate.toISOString().split("T")[0]}
- Current month is ${currentMonth}, adjust timeline accordingly
- User's working hours and energy patterns
- Realistic scheduling and progression
- Include review and planning tasks
- Balance workload appropriately`;
      }
      validateGoalDecompositionResult(result) {
        if (!result.monthlyObjectives || !Array.isArray(result.monthlyObjectives)) {
          throw new Error("Invalid goal decomposition result: missing monthlyObjectives array");
        }
        if (typeof result.confidence !== "number" || result.confidence < 0 || result.confidence > 1) {
          throw new Error("Invalid confidence score");
        }
      }
      validateTaskGenerationResult(result) {
        if (!result.tasks || !Array.isArray(result.tasks)) {
          throw new Error("Invalid task generation result: missing tasks array");
        }
        if (typeof result.confidence !== "number" || result.confidence < 0 || result.confidence > 1) {
          throw new Error("Invalid confidence score");
        }
      }
      validateNLProcessingResult(result) {
        const validIntents = [
          "add_task",
          "modify_task",
          "delete_task",
          "schedule_task",
          "create_goal",
          "create_objective",
          "create_roadmap",
          "ask_question"
        ];
        if (!result || typeof result !== "object") {
          throw new Error("Invalid NL processing result structure");
        }
        if (!result.intent || !validIntents.includes(result.intent)) {
          throw new Error(`Invalid intent in NL processing result: ${result.intent}. Valid intents: ${validIntents.join(", ")}`);
        }
        if (!result.entities || typeof result.entities !== "object") {
          throw new Error("NL processing result must have entities object");
        }
        if (typeof result.confidence !== "number" || result.confidence < 0 || result.confidence > 1) {
          throw new Error("Invalid confidence score in NL processing result");
        }
      }
      validateProductivityInsightsResult(result) {
        if (!result || typeof result !== "object") {
          throw new Error("Invalid productivity insights result structure");
        }
        if (!Array.isArray(result.insights)) {
          throw new Error("Insights must be an array");
        }
        result.insights.forEach((insight, index) => {
          if (!insight.type || !insight.title || !insight.description || !Array.isArray(insight.actionable_tips)) {
            throw new Error(`Insight ${index + 1} is missing required fields`);
          }
          if (typeof insight.confidence !== "number" || insight.confidence < 0 || insight.confidence > 1) {
            throw new Error(`Insight ${index + 1} has invalid confidence score`);
          }
        });
        if (typeof result.overall_productivity_score !== "number" || result.overall_productivity_score < 0 || result.overall_productivity_score > 100) {
          throw new Error("Invalid overall productivity score");
        }
        if (!Array.isArray(result.recommendations)) {
          throw new Error("Recommendations must be an array");
        }
      }
      validateScheduleOptimizationResult(result) {
        if (!result || typeof result !== "object") {
          throw new Error("Invalid schedule optimization result structure");
        }
        if (!Array.isArray(result.optimizedSchedule)) {
          throw new Error("Optimized schedule must be an array");
        }
        result.optimizedSchedule.forEach((item, index) => {
          if (!item.taskId || !item.suggestedTime || !item.reason) {
            throw new Error(`Schedule item ${index + 1} is missing required fields`);
          }
          const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;
          if (!timeRegex.test(item.suggestedTime)) {
            throw new Error(`Schedule item ${index + 1} has invalid time format`);
          }
        });
        if (!Array.isArray(result.insights)) {
          throw new Error("Insights must be an array");
        }
        if (typeof result.productivityScore !== "number" || result.productivityScore < 0 || result.productivityScore > 100) {
          throw new Error("Invalid productivity score");
        }
      }
      validateRoadmapResult(result) {
        if (!result || typeof result !== "object") {
          throw new Error("Invalid roadmap result structure");
        }
        if (!result.goal || typeof result.goal !== "object") {
          throw new Error("Roadmap must have a goal object");
        }
        if (!result.goal.title || typeof result.goal.title !== "string" || result.goal.title.length < 5) {
          throw new Error("Goal must have a title with at least 5 characters");
        }
        if (!result.goal.category || !["career", "health", "personal", "financial", "education", "other"].includes(result.goal.category)) {
          throw new Error("Goal must have a valid category");
        }
        if (!result.goal.year || typeof result.goal.year !== "number" || result.goal.year < 2024) {
          throw new Error("Goal must have a valid target year");
        }
        if (!result.goal.priority || !["low", "medium", "high", "critical"].includes(result.goal.priority)) {
          throw new Error("Goal must have a valid priority");
        }
        if (!Array.isArray(result.objectives) || result.objectives.length === 0) {
          throw new Error("Roadmap must have at least one objective");
        }
        if (result.objectives.length > 12) {
          throw new Error("Roadmap cannot have more than 12 objectives");
        }
        result.objectives.forEach((obj, index) => {
          if (!obj.title || typeof obj.title !== "string") {
            throw new Error(`Objective ${index + 1} must have a title`);
          }
          if (!obj.description || typeof obj.description !== "string") {
            throw new Error(`Objective ${index + 1} must have a description`);
          }
          if (!obj.targetMonth || typeof obj.targetMonth !== "number" || obj.targetMonth < 1 || obj.targetMonth > 12) {
            throw new Error(`Objective ${index + 1} must have a valid target month (1-12)`);
          }
          if (!Array.isArray(obj.keyResults) || obj.keyResults.length === 0) {
            throw new Error(`Objective ${index + 1} must have at least one key result`);
          }
          if (obj.keyResults.length > 4) {
            throw new Error(`Objective ${index + 1} cannot have more than 4 key results`);
          }
          obj.keyResults.forEach((kr, krIndex) => {
            if (!kr.description || typeof kr.description !== "string") {
              throw new Error(`Objective ${index + 1}, Key Result ${krIndex + 1} must have a description`);
            }
            if (kr.targetValue !== void 0 && (typeof kr.targetValue !== "number" || kr.targetValue < 0)) {
              throw new Error(`Objective ${index + 1}, Key Result ${krIndex + 1} target value must be a positive number`);
            }
            if (kr.unit !== void 0 && typeof kr.unit !== "string") {
              throw new Error(`Objective ${index + 1}, Key Result ${krIndex + 1} unit must be a string`);
            }
          });
        });
        if (!Array.isArray(result.tasks) || result.tasks.length === 0) {
          throw new Error("Roadmap must have at least one task");
        }
        result.tasks.forEach((task, index) => {
          if (!task.title || typeof task.title !== "string") {
            throw new Error(`Task ${index + 1} must have a title`);
          }
          if (task.description !== void 0 && typeof task.description !== "string") {
            throw new Error(`Task ${index + 1} description must be a string`);
          }
          if (!task.estimatedDuration || typeof task.estimatedDuration !== "number" || task.estimatedDuration < 15 || task.estimatedDuration > 480) {
            throw new Error(`Task ${index + 1} must have a valid estimated duration (15-480 minutes)`);
          }
          if (!task.priority || !["low", "medium", "high", "critical"].includes(task.priority)) {
            throw new Error(`Task ${index + 1} must have a valid priority`);
          }
          if (!task.scheduledDate || typeof task.scheduledDate !== "string") {
            throw new Error(`Task ${index + 1} must have a scheduled date`);
          }
          const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
          if (!dateRegex.test(task.scheduledDate)) {
            throw new Error(`Task ${index + 1} must have a valid date format (YYYY-MM-DD)`);
          }
          const taskDate = new Date(task.scheduledDate);
          if (isNaN(taskDate.getTime())) {
            throw new Error(`Task ${index + 1} has an invalid date`);
          }
          if (task.scheduledTime !== void 0) {
            if (typeof task.scheduledTime !== "string") {
              throw new Error(`Task ${index + 1} scheduled time must be a string`);
            }
            const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;
            if (!timeRegex.test(task.scheduledTime)) {
              throw new Error(`Task ${index + 1} must have a valid time format (HH:MM)`);
            }
          }
          if (!Array.isArray(task.tags)) {
            throw new Error(`Task ${index + 1} tags must be an array`);
          }
          if (!task.objectiveMonth || typeof task.objectiveMonth !== "number" || task.objectiveMonth < 1 || task.objectiveMonth > 12) {
            throw new Error(`Task ${index + 1} must have a valid objective month (1-12)`);
          }
          const correspondingObjective = result.objectives.find((obj) => obj.targetMonth === task.objectiveMonth);
          if (!correspondingObjective) {
            throw new Error(`Task ${index + 1} references objective month ${task.objectiveMonth} but no objective exists for that month`);
          }
        });
        if (!result.reasoning || typeof result.reasoning !== "string" || result.reasoning.length < 20) {
          throw new Error("Roadmap must include reasoning with at least 20 characters");
        }
        if (typeof result.confidence !== "number" || result.confidence < 0 || result.confidence > 1) {
          throw new Error("Confidence must be a number between 0 and 1");
        }
        if (!result.timeline || typeof result.timeline !== "object") {
          throw new Error("Roadmap must have a timeline object");
        }
        if (!result.timeline.startDate || typeof result.timeline.startDate !== "string") {
          throw new Error("Timeline must have a start date");
        }
        if (!result.timeline.endDate || typeof result.timeline.endDate !== "string") {
          throw new Error("Timeline must have an end date");
        }
        const startDateRegex = /^\d{4}-\d{2}-\d{2}$/;
        const endDateRegex = /^\d{4}-\d{2}-\d{2}$/;
        if (!startDateRegex.test(result.timeline.startDate)) {
          throw new Error("Timeline start date must be in YYYY-MM-DD format");
        }
        if (!endDateRegex.test(result.timeline.endDate)) {
          throw new Error("Timeline end date must be in YYYY-MM-DD format");
        }
        const startDate = new Date(result.timeline.startDate);
        const endDate = new Date(result.timeline.endDate);
        if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
          throw new Error("Timeline dates must be valid dates");
        }
        if (endDate <= startDate) {
          throw new Error("Timeline end date must be after start date");
        }
        if (!Array.isArray(result.timeline.milestones)) {
          throw new Error("Timeline must have a milestones array");
        }
        result.timeline.milestones.forEach((milestone, index) => {
          if (!milestone.month || typeof milestone.month !== "number" || milestone.month < 1 || milestone.month > 12) {
            throw new Error(`Milestone ${index + 1} must have a valid month (1-12)`);
          }
          if (!milestone.title || typeof milestone.title !== "string") {
            throw new Error(`Milestone ${index + 1} must have a title`);
          }
          if (!milestone.description || typeof milestone.description !== "string") {
            throw new Error(`Milestone ${index + 1} must have a description`);
          }
        });
        const objectiveMonths = result.objectives.map((obj) => obj.targetMonth);
        const uniqueMonths = new Set(objectiveMonths);
        if (uniqueMonths.size !== objectiveMonths.length) {
          throw new Error("Cannot have multiple objectives for the same month");
        }
        const timelineStart = new Date(result.timeline.startDate);
        const timelineEnd = new Date(result.timeline.endDate);
        result.tasks.forEach((task, index) => {
          const taskDate = new Date(task.scheduledDate);
          if (taskDate < timelineStart || taskDate > timelineEnd) {
            throw new Error(`Task ${index + 1} is scheduled outside the roadmap timeline`);
          }
        });
        const tasksByMonth = {};
        result.tasks.forEach((task) => {
          const taskDate = new Date(task.scheduledDate);
          const month = taskDate.getMonth() + 1;
          tasksByMonth[month] = (tasksByMonth[month] || 0) + 1;
        });
        const maxTasksPerMonth = Math.max(...Object.values(tasksByMonth));
        if (maxTasksPerMonth > 50) {
          throw new Error("Too many tasks scheduled for a single month (maximum 50 per month)");
        }
      }
    };
    geminiAIService = new GeminiAIService();
  }
});

// server/services/ai.ts
var ai_exports = {};
__export(ai_exports, {
  AIService: () => AIService,
  aiService: () => aiService
});
import OpenAI from "openai";
import { Router as Router6 } from "express";
var openai, AIService, aiService, router6;
var init_ai = __esm({
  "server/services/ai.ts"() {
    "use strict";
    init_storage();
    init_auth();
    openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });
    AIService = class {
      /**
       * Decompose an annual goal into monthly objectives with key results
       */
      async decomposeGoal(goal, user) {
        try {
          const prompt = this.buildGoalDecompositionPrompt(goal, user);
          const completion = await openai.chat.completions.create({
            model: "gpt-4-turbo-preview",
            messages: [
              {
                role: "system",
                content: `You are an expert goal strategist and productivity coach. Your task is to break down annual goals into actionable monthly objectives with measurable key results (OKRs). 

Rules:
1. Create 12 monthly objectives (one for each month)
2. Each objective should have 2-4 key results
3. Key results should be specific, measurable, and time-bound
4. Consider the user's context and preferences
5. Ensure progressive difficulty and logical sequencing
6. Response must be valid JSON

Response format:
{
  "monthlyObjectives": [
    {
      "title": "string",
      "description": "string", 
      "targetMonth": number,
      "keyResults": [
        {
          "description": "string",
          "targetValue": number (optional),
          "unit": "string" (optional)
        }
      ]
    }
  ],
  "reasoning": "string explaining the decomposition strategy",
  "confidence": number between 0 and 1
}`
              },
              {
                role: "user",
                content: prompt
              }
            ],
            temperature: 0.7,
            max_tokens: 3e3,
            response_format: { type: "json_object" }
          });
          const response = completion.choices[0]?.message?.content;
          if (!response) {
            throw new Error("No response from OpenAI");
          }
          const result = JSON.parse(response);
          this.validateGoalDecompositionResult(result);
          return result;
        } catch (error) {
          console.error("Error in goal decomposition:", error);
          const errorMessage = error instanceof Error ? error.message : String(error);
          throw new Error(`Failed to decompose goal: ${errorMessage}`);
        }
      }
      /**
       * Generate daily tasks from monthly objectives
       */
      async generateTasksFromObjective(objective, goal, user, weekNumber = 1) {
        try {
          const prompt = this.buildTaskGenerationPrompt(objective, goal, user, weekNumber);
          const completion = await openai.chat.completions.create({
            model: "gpt-4-turbo-preview",
            messages: [
              {
                role: "system",
                content: `You are a productivity expert specializing in task breakdown and scheduling. Break down monthly objectives into specific, actionable daily tasks.

Rules:
1. Generate 5-10 tasks for the specified week
2. Tasks should be specific and actionable
3. Consider user's working hours and preferences
4. Estimate realistic durations (15-120 minutes)
5. Assign appropriate priorities
6. Suggest optimal days and times
7. Include relevant tags for organization

Response format:
{
  "tasks": [
    {
      "title": "string",
      "description": "string (optional)",
      "estimatedDuration": number (minutes),
      "priority": "low|medium|high|critical",
      "suggestedDate": "YYYY-MM-DD (optional)",
      "suggestedTime": "HH:MM (optional)",
      "tags": ["string"]
    }
  ],
  "reasoning": "string explaining the task selection and scheduling",
  "confidence": number between 0 and 1
}`
              },
              {
                role: "user",
                content: prompt
              }
            ],
            temperature: 0.7,
            max_tokens: 2e3,
            response_format: { type: "json_object" }
          });
          const response = completion.choices[0]?.message?.content;
          if (!response) {
            throw new Error("No response from OpenAI");
          }
          const result = JSON.parse(response);
          this.validateTaskGenerationResult(result);
          return result;
        } catch (error) {
          console.error("Error in task generation:", error);
          const errorMessage = error instanceof Error ? error.message : String(error);
          throw new Error(`Failed to generate tasks: ${errorMessage}`);
        }
      }
      /**
       * Process natural language commands with enhanced NLP including roadmap creation
       */
      async processNaturalLanguage(text2, user, context) {
        try {
          const prompt = this.buildEnhancedNLProcessingPrompt(text2, user, context);
          const completion = await openai.chat.completions.create({
            model: "gpt-4-turbo-preview",
            messages: [
              {
                role: "system",
                content: `You are an intelligent task management assistant. Parse natural language commands related to scheduling, task management, goal creation, objective creation, and roadmap planning.

Supported intents:
- add_task: Creating new tasks
- modify_task: Updating existing tasks  
- delete_task: Removing tasks
- schedule_task: Scheduling or rescheduling tasks
- create_goal: Creating new annual goals
- create_objective: Creating new monthly objectives
- create_roadmap: Creating complete yearly roadmaps with goals, objectives, and tasks
- ask_question: Information queries

For ROADMAPS, extract:
- prompt: the complete description of what the user wants to achieve
- description: detailed explanation of the desired outcome
- timeframe: when they want to accomplish this
- category: career|health|personal|financial|education|other

For GOALS, extract:
- title: goal name
- description: detailed description
- category: career|health|personal|financial|education|other
- year: target year
- priority: low|medium|high|critical

For OBJECTIVES, extract:
- title: objective name
- description: detailed description
- goal: related goal name
- month: target month (1-12)
- year: target year

For TASKS, extract:
- title: task name
- description: task details
- date: when to do it
- time: specific time
- duration: estimated minutes
- priority: low|medium|high|critical
- objective: related objective name
- goal: related goal name

Examples:
"Create a roadmap to become a senior developer this year" -> intent: create_roadmap
"I want to plan my fitness journey for 2024" -> intent: create_roadmap
"Build a complete plan to learn Python programming" -> intent: create_roadmap
"Create a goal to learn Python programming this year" -> intent: create_goal
"Add objective to complete 5 Python projects for March" -> intent: create_objective  
"Schedule a meeting with John tomorrow at 3pm" -> intent: add_task

Be flexible in understanding natural language variations. If someone asks for a "plan", "roadmap", "journey", or "complete strategy", use create_roadmap intent.`
              },
              {
                role: "user",
                content: prompt
              }
            ],
            temperature: 0.3,
            max_tokens: 1e3,
            response_format: { type: "json_object" }
          });
          const response = completion.choices[0]?.message?.content;
          if (!response) {
            throw new Error("No response from OpenAI");
          }
          const result = JSON.parse(response);
          this.validateNLProcessingResult(result);
          return result;
        } catch (error) {
          console.error("Error in NL processing:", error);
          const errorMessage = error instanceof Error ? error.message : String(error);
          throw new Error(`Failed to process natural language: ${errorMessage}`);
        }
      }
      /**
       * Create a complete roadmap from a natural language prompt
       */
      async createRoadmap(prompt, user) {
        try {
          const roadmapPrompt = this.buildRoadmapPrompt(prompt, user);
          const completion = await openai.chat.completions.create({
            model: "gpt-4-turbo-preview",
            messages: [
              {
                role: "system",
                content: `You are an expert productivity and goal-setting strategist. Create comprehensive yearly roadmaps that break down into monthly objectives and daily tasks with proper scheduling.

CRITICAL REQUIREMENTS:
1. Always create ONE annual goal
2. Break it into 12 monthly objectives (or fewer if goal is shorter-term)
3. Each objective should have 2-4 measurable key results
4. Generate specific daily tasks distributed throughout the year
5. Schedule tasks with realistic dates and times
6. Consider user's working hours and preferences
7. Ensure logical progression and dependencies
8. Balance workload across months
9. Include buffer time and review periods

RESPONSE FORMAT - MUST BE VALID JSON:
{
  "goal": {
    "title": "string (5-100 chars)",
    "description": "string (detailed explanation)",
    "category": "career|health|personal|financial|education|other",
    "year": number,
    "priority": "low|medium|high|critical"
  },
  "objectives": [
    {
      "title": "string (specific monthly objective)",
      "description": "string (detailed description)",
      "targetMonth": number (1-12),
      "keyResults": [
        {
          "description": "string (measurable outcome)",
          "targetValue": number (optional),
          "unit": "string (optional - hours, projects, etc.)"
        }
      ]
    }
  ],
  "tasks": [
    {
      "title": "string (specific actionable task)",
      "description": "string (optional details)",
      "estimatedDuration": number (15-480 minutes),
      "priority": "low|medium|high|critical",
      "scheduledDate": "YYYY-MM-DD",
      "scheduledTime": "HH:MM (optional)",
      "tags": ["string"],
      "objectiveMonth": number (1-12, which month this task belongs to)
    }
  ],
  "reasoning": "string (explanation of the roadmap strategy)",
  "confidence": number (0-1),
  "timeline": {
    "startDate": "YYYY-MM-DD",
    "endDate": "YYYY-MM-DD",
    "milestones": [
      {
        "month": number,
        "title": "string",
        "description": "string"
      }
    ]
  }
}`
              },
              {
                role: "user",
                content: roadmapPrompt
              }
            ],
            temperature: 0.7,
            max_tokens: 4e3,
            response_format: { type: "json_object" }
          });
          const response = completion.choices[0]?.message?.content;
          if (!response) {
            throw new Error("No response from OpenAI");
          }
          const result = JSON.parse(response);
          this.validateRoadmapResult(result);
          return result;
        } catch (error) {
          console.error("Error in roadmap generation:", error);
          const errorMessage = error instanceof Error ? error.message : String(error);
          throw new Error(`Failed to generate roadmap: ${errorMessage}`);
        }
      }
      buildEnhancedNLProcessingPrompt(text2, user, context) {
        const userContext = `
User Context:
- Name: ${user.firstName || "User"} ${user.lastName || ""}
- Timezone: ${user.timezone}
- Working Hours: ${user.preferences?.workingHours?.start || "09:00"} - ${user.preferences?.workingHours?.end || "17:00"}
`;
        const contextInfo = context ? `
Additional Context: ${JSON.stringify(context)}` : "";
        return `${userContext}${contextInfo}

User Input: "${text2}"

Parse this natural language input and provide a JSON response with:
{
  "intent": "add_task|modify_task|delete_task|schedule_task|create_goal|create_objective|ask_question",
  "entities": {
    // For goals:
    "title": "string (required for goals)",
    "description": "string (optional)",
    "category": "career|health|personal|financial|education|other",
    "year": number,
    "priority": "low|medium|high|critical",
    
    // For objectives:
    "goal": "string (goal name to link to)",
    "month": number (1-12),
    
    // For tasks:
    "date": "string (optional)", 
    "time": "string (optional)",
    "duration": number (optional),
    "objective": "string (objective name to link to)",
    
    // Common:
    "taskIdentifier": "string (for modifications)",
    "questionType": "string (for questions)"
  },
  "confidence": number between 0 and 1,
  "response": "string - friendly response explaining what you understood"
}`;
      }
      // Private helper methods for building prompts
      buildGoalDecompositionPrompt(goal, user) {
        const userContext = `
User Context:
- Name: ${user.firstName || "User"} ${user.lastName || ""}
- Timezone: ${user.timezone}
- Working Hours: ${user.preferences?.workingHours?.start || "09:00"} - ${user.preferences?.workingHours?.end || "17:00"}
- Preferred Task Duration: ${user.preferences?.preferredTaskDuration || 30} minutes
- Energy Levels: Morning: ${user.preferences?.energyLevels?.morning || "medium"}, Afternoon: ${user.preferences?.energyLevels?.afternoon || "medium"}, Evening: ${user.preferences?.energyLevels?.evening || "medium"}
`;
        const goalContext = `
Goal to Decompose:
- Title: ${goal.title}
- Description: ${goal.description || "No description provided"}
- Category: ${goal.category}
- Target Year: ${goal.targetYear}
- Priority: ${goal.priority}
- Current Status: ${goal.status}
`;
        return `${userContext}
${goalContext}

Please break down this annual goal into 12 monthly objectives with specific, measurable key results. Consider the user's schedule, preferences, and energy patterns. Make sure the progression is logical and achievable.`;
      }
      buildTaskGenerationPrompt(objective, goal, user, weekNumber) {
        const objectiveContext = `
Monthly Objective:
- Title: ${objective.title}
- Description: ${objective.description || "No description provided"}
- Target Month: ${objective.targetMonth}
- Key Results: ${JSON.stringify(objective.keyResults, null, 2)}
- Current Progress: ${objective.progress}%
`;
        const userContext = `
User Context:
- Working Hours: ${user.preferences?.workingHours?.start || "09:00"} - ${user.preferences?.workingHours?.end || "17:00"}
- Preferred Task Duration: ${user.preferences?.preferredTaskDuration || 30} minutes
- Energy Levels: Morning: ${user.preferences?.energyLevels?.morning || "medium"}, Afternoon: ${user.preferences?.energyLevels?.afternoon || "medium"}, Evening: ${user.preferences?.energyLevels?.evening || "medium"}
`;
        return `${objectiveContext}
${userContext}

Generate specific, actionable tasks for week ${weekNumber} of this month that will help achieve the objective and its key results. Consider the user's working hours and energy patterns when suggesting times.`;
      }
      buildRoadmapPrompt(prompt, user) {
        const currentDate = /* @__PURE__ */ new Date();
        const currentYear = currentDate.getFullYear();
        const currentMonth = currentDate.getMonth() + 1;
        const userContext = `
User Context:
- Name: ${user.firstName || "User"} ${user.lastName || ""}
- Timezone: ${user.timezone}
- Current Date: ${currentDate.toISOString().split("T")[0]}
- Current Year: ${currentYear}
- Current Month: ${currentMonth}
- Working Hours: ${user.preferences?.workingHours?.start || "09:00"} - ${user.preferences?.workingHours?.end || "17:00"}
- Preferred Task Duration: ${user.preferences?.preferredTaskDuration || 30} minutes
- Energy Levels: 
  - Morning: ${user.preferences?.energyLevels?.morning || "medium"}
  - Afternoon: ${user.preferences?.energyLevels?.afternoon || "medium"}
  - Evening: ${user.preferences?.energyLevels?.evening || "medium"}
`;
        return `${userContext}

User's Roadmap Request: "${prompt}"

Create a complete yearly roadmap with:
1. One clear annual goal based on the user's request
2. 12 monthly objectives (or appropriate number if shorter-term)
3. Distributed daily tasks with specific dates and times
4. Realistic scheduling considering user's preferences
5. Progressive difficulty and logical sequencing
6. Buffer time for reviews and adjustments

Consider:
- Start from current date: ${currentDate.toISOString().split("T")[0]}
- Current month is ${currentMonth}, so adjust timeline accordingly
- User's working hours: ${user.preferences?.workingHours?.start || "09:00"} - ${user.preferences?.workingHours?.end || "17:00"}
- Balance tasks across weekdays
- Include review and planning tasks
- Account for holidays and breaks
- Ensure objectives build upon each other`;
      }
      // Validation methods
      validateGoalDecompositionResult(result) {
        if (!result.monthlyObjectives || !Array.isArray(result.monthlyObjectives)) {
          throw new Error("Invalid goal decomposition result: missing monthlyObjectives array");
        }
        if (typeof result.confidence !== "number" || result.confidence < 0 || result.confidence > 1) {
          throw new Error("Invalid confidence score");
        }
      }
      validateTaskGenerationResult(result) {
        if (!result.tasks || !Array.isArray(result.tasks)) {
          throw new Error("Invalid task generation result: missing tasks array");
        }
        if (typeof result.confidence !== "number" || result.confidence < 0 || result.confidence > 1) {
          throw new Error("Invalid confidence score");
        }
      }
      validateNLProcessingResult(result) {
        const validIntents = [
          "add_task",
          "modify_task",
          "delete_task",
          "schedule_task",
          "create_goal",
          "create_objective",
          "create_roadmap",
          "ask_question"
        ];
        if (!result || typeof result !== "object") {
          throw new Error("Invalid NL processing result structure");
        }
        if (!result.intent || !validIntents.includes(result.intent)) {
          throw new Error(`Invalid intent in NL processing result: ${result.intent}. Valid intents: ${validIntents.join(", ")}`);
        }
        if (!result.entities || typeof result.entities !== "object") {
          throw new Error("NL processing result must have entities object");
        }
        if (typeof result.confidence !== "number" || result.confidence < 0 || result.confidence > 1) {
          throw new Error("Invalid confidence score in NL processing result");
        }
      }
      validateScheduleOptimizationResult(result) {
        if (!result.optimizedSchedule || !Array.isArray(result.optimizedSchedule)) {
          throw new Error("Invalid schedule optimization result: missing optimizedSchedule array");
        }
        if (typeof result.productivityScore !== "number" || result.productivityScore < 0 || result.productivityScore > 100) {
          throw new Error("Invalid productivity score");
        }
      }
      validateRoadmapResult(result) {
        if (!result || typeof result !== "object") {
          throw new Error("Invalid roadmap result structure");
        }
        if (!result.goal || !result.goal.title || !result.goal.category) {
          throw new Error("Goal must have title and category");
        }
        if (!Array.isArray(result.objectives) || result.objectives.length === 0) {
          throw new Error("Must have at least one objective");
        }
        result.objectives.forEach((obj, index) => {
          if (!obj.title || !obj.targetMonth || !Array.isArray(obj.keyResults)) {
            throw new Error(`Objective ${index + 1} is missing required fields`);
          }
          if (obj.targetMonth < 1 || obj.targetMonth > 12) {
            throw new Error(`Objective ${index + 1} has invalid target month`);
          }
        });
        if (!Array.isArray(result.tasks) || result.tasks.length === 0) {
          throw new Error("Must have at least one task");
        }
        result.tasks.forEach((task, index) => {
          if (!task.title || !task.scheduledDate || !task.objectiveMonth) {
            throw new Error(`Task ${index + 1} is missing required fields`);
          }
          if (task.estimatedDuration < 5 || task.estimatedDuration > 480) {
            throw new Error(`Task ${index + 1} has invalid duration`);
          }
        });
        if (typeof result.confidence !== "number" || result.confidence < 0 || result.confidence > 1) {
          throw new Error("Confidence must be a number between 0 and 1");
        }
      }
    };
    aiService = new AIService();
    router6 = Router6();
    router6.post(
      "/conversational-assistant",
      requireAuth,
      async (req, res) => {
        try {
          const userId = req.user.id;
          const { message, conversationHistory = [] } = req.body;
          console.log("Conversational assistant request:", {
            userId,
            message,
            historyLength: conversationHistory.length
          });
          if (!message || typeof message !== "string" || message.trim().length === 0) {
            return res.status(400).json({
              success: false,
              error: "Message is required and must be a non-empty string"
            });
          }
          if (message.length > 2e3) {
            return res.status(400).json({
              success: false,
              error: "Message is too long (max 2000 characters)"
            });
          }
          const { getCurrentAIProvider: getCurrentAIProvider2 } = (init_ai_factory(), __toCommonJS(ai_factory_exports));
          const currentProvider = getCurrentAIProvider2();
          let result;
          if (currentProvider === "gemini") {
            const { geminiAIService: geminiAIService2 } = (init_gemini_ai(), __toCommonJS(gemini_ai_exports));
            result = await geminiAIService2.conversationalAssistant(
              userId,
              message,
              conversationHistory
            );
          } else {
            result = {
              response: "I understand you're trying to communicate with me. While I can help with specific commands and tasks, advanced conversational features are best experienced with our Gemini AI provider.",
              followUpQuestions: [
                "What specific task would you like help with?",
                "Would you like to see your current goals?",
                "How can I help you stay organized?"
              ]
            };
          }
          try {
            await storage.insights.createInsight({
              userId,
              insightType: "conversational_interaction",
              data: {
                userMessage: message,
                aiResponse: result.response,
                provider: currentProvider,
                timestamp: (/* @__PURE__ */ new Date()).toISOString(),
                conversationLength: conversationHistory.length
              },
              confidence: "0.9"
            });
          } catch (insightError) {
            console.error("Failed to store conversation insight:", insightError);
          }
          res.json({
            success: true,
            data: result,
            message: "Conversational response generated successfully"
          });
        } catch (error) {
          console.error("Conversational assistant error:", error);
          res.status(500).json({
            success: false,
            error: error instanceof Error ? error.message : "Failed to generate response"
          });
        }
      }
    );
    router6.post(
      "/process-command",
      requireAuth,
      async (req, res) => {
        try {
          const userId = req.user.id;
          const { command, executeCommand: executeCommand2 = true, context } = req.body;
          console.log("Processing text command:", {
            userId,
            command,
            executeCommand: executeCommand2
          });
          if (!command || typeof command !== "string" || command.trim().length === 0) {
            return res.status(400).json({
              success: false,
              error: "Command is required and must be a non-empty string"
            });
          }
          const user = await storage.users.getUserById(userId);
          if (!user) {
            return res.status(404).json({
              success: false,
              error: "User not found"
            });
          }
          const { getCurrentAIProvider: getCurrentAIProvider2 } = (init_ai_factory(), __toCommonJS(ai_factory_exports));
          const currentProvider = getCurrentAIProvider2();
          let nlpResult;
          if (currentProvider === "gemini") {
            const { geminiAIService: geminiAIService2 } = (init_gemini_ai(), __toCommonJS(gemini_ai_exports));
            nlpResult = await geminiAIService2.processNaturalLanguage(
              command,
              user,
              context
            );
          } else {
            const { aiService: aiService2 } = (init_ai(), __toCommonJS(ai_exports));
            nlpResult = await aiService2.processNaturalLanguage(
              command,
              user,
              context
            );
          }
          let executionResult = null;
          if (executeCommand2 && nlpResult.intent !== "ask_question") {
            try {
              executionResult = await executeCommand2(userId, nlpResult);
            } catch (execError) {
              console.error("Command execution error:", execError);
              executionResult = {
                success: false,
                message: `Failed to execute command: ${execError instanceof Error ? execError.message : "Unknown error"}`
              };
            }
          }
          try {
            await storage.insights.createInsight({
              userId,
              insightType: "text_command_usage",
              data: {
                command,
                intent: nlpResult.intent,
                entities: nlpResult.entities,
                executed: executeCommand2,
                success: executionResult?.success || false,
                provider: currentProvider,
                timestamp: (/* @__PURE__ */ new Date()).toISOString()
              },
              confidence: nlpResult.confidence || "0.8"
            });
          } catch (insightError) {
            console.error("Failed to store command insight:", insightError);
          }
          res.json({
            success: true,
            data: {
              intent: nlpResult.intent,
              entities: nlpResult.entities,
              response: nlpResult.response,
              confidence: nlpResult.confidence,
              executionResult
            },
            message: "Command processed successfully"
          });
        } catch (error) {
          console.error("Text command processing error:", error);
          res.status(500).json({
            success: false,
            error: error instanceof Error ? error.message : "Failed to process command"
          });
        }
      }
    );
  }
});

// server/services/ambient-ai.ts
var AmbientAIService, ambientAI;
var init_ambient_ai = __esm({
  "server/services/ambient-ai.ts"() {
    "use strict";
    init_storage();
    AmbientAIService = class {
      learningIntervals = /* @__PURE__ */ new Map();
      /**
       * Start ambient learning for a user
       */
      async startAmbientLearning(userId) {
        this.stopAmbientLearning(userId);
        const interval = setInterval(async () => {
          await this.performAmbientLearning(userId);
        }, 4 * 60 * 60 * 1e3);
        this.learningIntervals.set(userId, interval);
        await this.performAmbientLearning(userId);
      }
      /**
       * Stop ambient learning for a user
       */
      stopAmbientLearning(userId) {
        const interval = this.learningIntervals.get(userId);
        if (interval) {
          clearInterval(interval);
          this.learningIntervals.delete(userId);
        }
      }
      /**
       * Perform ambient learning to update user patterns
       */
      async performAmbientLearning(userId) {
        try {
          console.log(`\u{1F9E0} Performing ambient learning for user ${userId}`);
          await this.analyzeCompletionPatterns(userId);
          await this.analyzeEnergyPatterns(userId);
          await this.analyzeTaskPreferences(userId);
          await this.analyzeSchedulingHabits(userId);
          await this.generateProactiveSuggestions(userId);
          console.log(`\u2705 Ambient learning completed for user ${userId}`);
        } catch (error) {
          console.error(`\u274C Ambient learning failed for user ${userId}:`, error);
        }
      }
      /**
       * Analyze when user completes tasks most efficiently
       */
      async analyzeCompletionPatterns(userId) {
        const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1e3);
        const completedTasks = await storage.tasks.getUserTasks(userId, thirtyDaysAgo, /* @__PURE__ */ new Date());
        const completionsByHour = {};
        completedTasks.filter((task) => task.status === "completed" && task.scheduledTime).forEach((task) => {
          const hour = parseInt(task.scheduledTime.split(":")[0]);
          const efficiency = this.calculateTaskEfficiency(task);
          if (!completionsByHour[hour]) {
            completionsByHour[hour] = { count: 0, totalDuration: 0, avgEfficiency: 0 };
          }
          completionsByHour[hour].count++;
          completionsByHour[hour].totalDuration += task.estimatedDuration;
          completionsByHour[hour].avgEfficiency = (completionsByHour[hour].avgEfficiency * (completionsByHour[hour].count - 1) + efficiency) / completionsByHour[hour].count;
        });
        const timeSlots = Object.entries(completionsByHour).map(([hour, data]) => ({
          hour: parseInt(hour),
          efficiency: data.avgEfficiency,
          taskTypes: this.getMostCommonTaskTypes(completedTasks, parseInt(hour)),
          completionCount: data.count
        })).filter((slot) => slot.completionCount >= 3).sort((a, b) => b.efficiency - a.efficiency);
        if (timeSlots.length > 0) {
          await storage.insights.createInsight({
            userId,
            insightType: "optimal_work_hours",
            data: {
              timeSlots: timeSlots.slice(0, 5),
              // Top 5 most efficient hours
              peakHours: timeSlots.slice(0, 2).map((slot) => `${slot.hour}:00`),
              analysisDate: (/* @__PURE__ */ new Date()).toISOString()
            },
            confidence: (timeSlots.length >= 5 ? 0.8 : 0.6).toString()
          });
        }
      }
      /**
       * Analyze user's energy patterns based on task completion and timing
       */
      async analyzeEnergyPatterns(userId) {
        const user = await storage.users.getUserById(userId);
        if (!user) return;
        const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1e3);
        const recentTasks = await storage.tasks.getUserTasks(userId, sevenDaysAgo, /* @__PURE__ */ new Date());
        const energyPatterns = {
          morning: { efficiency: 0, taskCount: 0 },
          // 6-12
          afternoon: { efficiency: 0, taskCount: 0 },
          // 12-18
          evening: { efficiency: 0, taskCount: 0 }
          // 18-24
        };
        recentTasks.filter((task) => task.status === "completed" && task.scheduledTime).forEach((task) => {
          const hour = parseInt(task.scheduledTime.split(":")[0]);
          const efficiency = this.calculateTaskEfficiency(task);
          let period;
          if (hour >= 6 && hour < 12) period = "morning";
          else if (hour >= 12 && hour < 18) period = "afternoon";
          else period = "evening";
          energyPatterns[period].efficiency = (energyPatterns[period].efficiency * energyPatterns[period].taskCount + efficiency) / (energyPatterns[period].taskCount + 1);
          energyPatterns[period].taskCount++;
        });
        const energyLevels = {
          morning: this.efficiencyToEnergyLevel(energyPatterns.morning.efficiency),
          afternoon: this.efficiencyToEnergyLevel(energyPatterns.afternoon.efficiency),
          evening: this.efficiencyToEnergyLevel(energyPatterns.evening.efficiency)
        };
        const currentPrefs = user.preferences?.energyLevels;
        if (!currentPrefs || this.energyLevelsChanged(currentPrefs, energyLevels)) {
          await storage.users.updateUser(userId, {
            preferences: {
              ...user.preferences,
              energyLevels
            }
          });
          await storage.insights.createInsight({
            userId,
            insightType: "optimal_work_hours",
            data: {
              energyPatterns,
              updatedEnergyLevels: energyLevels,
              analysisDate: (/* @__PURE__ */ new Date()).toISOString()
            },
            confidence: "0.7"
          });
        }
      }
      /**
       * Analyze user's task preferences and patterns
       */
      async analyzeTaskPreferences(userId) {
        const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1e3);
        const tasks = await storage.tasks.getUserTasks(userId, thirtyDaysAgo, /* @__PURE__ */ new Date());
        const preferences = {
          preferredDuration: this.calculatePreferredDuration(tasks),
          preferredPriorities: this.analyzePreferredPriorities(tasks),
          taskCompletionPatterns: this.analyzeTaskCompletionPatterns(tasks),
          procrastinationTendencies: this.analyzeProcrastinationTendencies(tasks)
        };
        await storage.insights.createInsight({
          userId,
          insightType: "task_completion_pattern",
          data: preferences,
          confidence: (tasks.length >= 20 ? 0.8 : 0.6).toString()
        });
      }
      /**
       * Analyze user's scheduling habits
       */
      async analyzeSchedulingHabits(userId) {
        const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1e3);
        const tasks = await storage.tasks.getUserTasks(userId, thirtyDaysAgo, /* @__PURE__ */ new Date());
        const habits = {
          planningFrequency: this.analyzePlanningFrequency(tasks),
          scheduleAdhereence: this.analyzeScheduleAdherence(tasks),
          bufferTimeUsage: this.analyzeBufferTimeUsage(tasks),
          breakPatterns: this.analyzeBreakPatterns(tasks)
        };
        await storage.insights.createInsight({
          userId,
          insightType: "scheduling_preference",
          data: habits,
          confidence: "0.7"
        });
      }
      /**
       * Generate proactive suggestions based on learned patterns
       */
      async generateProactiveSuggestions(userId) {
        const suggestions = [];
        const insights = await storage.insights.getUserInsights(userId);
        const user = await storage.users.getUserById(userId);
        if (!user) return suggestions;
        const today = /* @__PURE__ */ new Date();
        const todayTasks = await storage.tasks.getUserTasks(userId, today, today);
        const scheduleOptimization = await this.generateScheduleOptimizationSuggestion(userId, todayTasks, insights);
        if (scheduleOptimization) suggestions.push(scheduleOptimization);
        const energyOptimization = await this.generateEnergyOptimizationSuggestion(userId, todayTasks, user);
        if (energyOptimization) suggestions.push(energyOptimization);
        const breakReminder = await this.generateBreakReminderSuggestion(userId, todayTasks);
        if (breakReminder) suggestions.push(breakReminder);
        const goalNudge = await this.generateGoalProgressSuggestion(userId);
        if (goalNudge) suggestions.push(goalNudge);
        const taskCreation = await this.generateTaskCreationSuggestion(userId, insights);
        if (taskCreation) suggestions.push(taskCreation);
        for (const suggestion of suggestions) {
          await this.storeSuggestion(suggestion);
        }
        return suggestions;
      }
      /**
       * Get active suggestions for a user (renamed from getActiveProactiveSuggestions)
       */
      async getActiveSuggestions(userId) {
        const insights = await storage.insights.getUserInsights(userId);
        const suggestions = [];
        insights.filter((insight) => {
          const data = insight.data;
          return data && Array.isArray(data.suggestions);
        }).forEach((insight) => {
          const data = insight.data;
          if (Array.isArray(data.suggestions)) {
            suggestions.push(...data.suggestions);
          }
        });
        return suggestions.filter((s) => new Date(s.validUntil) > /* @__PURE__ */ new Date());
      }
      /**
       * Dismiss a suggestion
       */
      async dismissSuggestion(userId, suggestionId) {
        try {
          await storage.insights.createInsight({
            userId,
            insightType: "suggestion_dismissed",
            data: {
              suggestionId,
              dismissedAt: (/* @__PURE__ */ new Date()).toISOString(),
              reason: "user_dismissed"
            },
            confidence: "1.0"
          });
          return true;
        } catch (error) {
          console.error("Error dismissing suggestion:", error);
          return false;
        }
      }
      /**
       * Apply a suggestion
       */
      async applySuggestion(userId, suggestionId) {
        const suggestions = await this.getActiveSuggestions(userId);
        const suggestion = suggestions.find((s) => s.id === suggestionId);
        if (!suggestion) {
          return { success: false, message: "Suggestion not found or expired" };
        }
        try {
          switch (suggestion.type) {
            case "schedule_optimization":
              return await this.applyScheduleOptimization(userId, suggestion);
            case "task_creation":
              return await this.applyTaskCreation(userId, suggestion);
            case "energy_optimization":
              return await this.applyEnergyOptimization(userId, suggestion);
            case "break_reminder":
              return await this.applyBreakReminder(userId, suggestion);
            case "goal_adjustment":
              return await this.applyGoalAdjustment(userId, suggestion);
            default:
              return { success: false, message: "Unknown suggestion type" };
          }
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : String(error);
          return { success: false, message: `Failed to apply suggestion: ${errorMessage}` };
        }
      }
      // Private helper methods
      calculateTaskEfficiency(task) {
        const baseEfficiency = task.status === "completed" ? 1 : 0;
        const priorityBonus = {
          "critical": 0.2,
          "high": 0.1,
          "medium": 0,
          "low": -0.1
        }[task.priority] || 0;
        return Math.max(0, Math.min(1, baseEfficiency + priorityBonus));
      }
      getMostCommonTaskTypes(tasks, hour) {
        const hourTasks = tasks.filter(
          (task) => task.scheduledTime && parseInt(task.scheduledTime.split(":")[0]) === hour
        );
        const tagCounts = {};
        hourTasks.forEach((task) => {
          task.tags?.forEach((tag) => {
            tagCounts[tag] = (tagCounts[tag] || 0) + 1;
          });
        });
        return Object.entries(tagCounts).sort(([, a], [, b]) => b - a).slice(0, 3).map(([tag]) => tag);
      }
      efficiencyToEnergyLevel(efficiency) {
        if (efficiency >= 0.8) return "high";
        if (efficiency >= 0.6) return "medium";
        return "low";
      }
      energyLevelsChanged(current, new_levels) {
        return current.morning !== new_levels.morning || current.afternoon !== new_levels.afternoon || current.evening !== new_levels.evening;
      }
      calculatePreferredDuration(tasks) {
        const completedTasks = tasks.filter((t) => t.status === "completed");
        if (completedTasks.length === 0) return 30;
        const totalDuration = completedTasks.reduce((sum, task) => sum + task.estimatedDuration, 0);
        return Math.round(totalDuration / completedTasks.length);
      }
      analyzePreferredPriorities(tasks) {
        const priorityCounts = tasks.reduce((acc, task) => {
          acc[task.priority] = (acc[task.priority] || 0) + 1;
          return acc;
        }, {});
        const total = tasks.length;
        const percentages = {};
        Object.entries(priorityCounts).forEach(([priority, count]) => {
          percentages[priority] = Math.round(count / total * 100);
        });
        return percentages;
      }
      analyzeTaskCompletionPatterns(tasks) {
        const completed = tasks.filter((t) => t.status === "completed").length;
        const total = tasks.length;
        return {
          completionRate: total > 0 ? Math.round(completed / total * 100) : 0,
          avgTasksPerDay: this.calculateAvgTasksPerDay(tasks),
          completionTrend: this.calculateCompletionTrend(tasks)
        };
      }
      analyzeProcrastinationTendencies(tasks) {
        const overdueTasksCount = tasks.filter((task) => {
          const scheduledDate = new Date(task.scheduledDate);
          const today = /* @__PURE__ */ new Date();
          return scheduledDate < today && task.status === "pending";
        }).length;
        return {
          overdueTasksPercentage: tasks.length > 0 ? Math.round(overdueTasksCount / tasks.length * 100) : 0,
          procrastinationRisk: overdueTasksCount > tasks.length * 0.3 ? "high" : overdueTasksCount > tasks.length * 0.1 ? "medium" : "low"
        };
      }
      analyzePlanningFrequency(tasks) {
        const tasksWithFutureScheduling = tasks.filter((task) => {
          const scheduledDate = new Date(task.scheduledDate);
          const createdDate = new Date(task.createdAt);
          const daysDifference = Math.floor((scheduledDate.getTime() - createdDate.getTime()) / (1e3 * 60 * 60 * 24));
          return daysDifference > 0;
        }).length;
        return {
          planningAheadPercentage: tasks.length > 0 ? Math.round(tasksWithFutureScheduling / tasks.length * 100) : 0,
          planningStyle: tasksWithFutureScheduling > tasks.length * 0.7 ? "proactive" : tasksWithFutureScheduling > tasks.length * 0.3 ? "moderate" : "reactive"
        };
      }
      analyzeScheduleAdherence(tasks) {
        const scheduledTasks = tasks.filter((t) => t.scheduledTime);
        const completedOnTime = scheduledTasks.filter((t) => t.status === "completed").length;
        return {
          adherenceRate: scheduledTasks.length > 0 ? Math.round(completedOnTime / scheduledTasks.length * 100) : 0,
          schedulingReliability: completedOnTime > scheduledTasks.length * 0.8 ? "high" : completedOnTime > scheduledTasks.length * 0.6 ? "medium" : "low"
        };
      }
      analyzeBufferTimeUsage(tasks) {
        const scheduledTasks = tasks.filter((t) => t.scheduledTime).sort((a, b) => a.scheduledTime.localeCompare(b.scheduledTime));
        let totalGaps = 0;
        let gapCount = 0;
        for (let i = 0; i < scheduledTasks.length - 1; i++) {
          const currentEnd = this.addMinutesToTime(scheduledTasks[i].scheduledTime, scheduledTasks[i].estimatedDuration);
          const nextStart = scheduledTasks[i + 1].scheduledTime;
          const gap = this.calculateTimeDifference(currentEnd, nextStart);
          if (gap >= 0) {
            totalGaps += gap;
            gapCount++;
          }
        }
        return {
          avgBufferTime: gapCount > 0 ? Math.round(totalGaps / gapCount) : 0,
          bufferUsage: totalGaps > 0 ? "uses_buffer" : "tight_scheduling"
        };
      }
      analyzeBreakPatterns(tasks) {
        const workingHours = 8 * 60;
        const totalTaskTime = tasks.reduce((sum, task) => sum + task.estimatedDuration, 0);
        const breakTime = Math.max(0, workingHours - totalTaskTime);
        return {
          breakTimePercentage: Math.round(breakTime / workingHours * 100),
          breakTakingHabits: breakTime > workingHours * 0.2 ? "good" : breakTime > workingHours * 0.1 ? "moderate" : "insufficient"
        };
      }
      calculateAvgTasksPerDay(tasks) {
        if (tasks.length === 0) return 0;
        const dates = new Set(tasks.map((task) => new Date(task.scheduledDate).toDateString()));
        return Math.round(tasks.length / dates.size);
      }
      calculateCompletionTrend(tasks) {
        const midpoint = Math.floor(tasks.length / 2);
        const recentTasks = tasks.slice(0, midpoint);
        const olderTasks = tasks.slice(midpoint);
        const recentCompletionRate = recentTasks.filter((t) => t.status === "completed").length / recentTasks.length;
        const olderCompletionRate = olderTasks.filter((t) => t.status === "completed").length / olderTasks.length;
        if (recentCompletionRate > olderCompletionRate + 0.1) return "improving";
        if (recentCompletionRate < olderCompletionRate - 0.1) return "declining";
        return "stable";
      }
      addMinutesToTime(time, minutes) {
        const [hours, mins] = time.split(":").map(Number);
        const totalMinutes = hours * 60 + mins + minutes;
        const newHours = Math.floor(totalMinutes / 60) % 24;
        const newMins = totalMinutes % 60;
        return `${newHours.toString().padStart(2, "0")}:${newMins.toString().padStart(2, "0")}`;
      }
      calculateTimeDifference(time1, time2) {
        const [h1, m1] = time1.split(":").map(Number);
        const [h2, m2] = time2.split(":").map(Number);
        const minutes1 = h1 * 60 + m1;
        const minutes2 = h2 * 60 + m2;
        return minutes2 - minutes1;
      }
      // Suggestion generation methods
      async generateScheduleOptimizationSuggestion(userId, tasks, insights) {
        const unscheduledTasks = tasks.filter((t) => !t.scheduledTime && t.status === "pending");
        if (unscheduledTasks.length === 0) return null;
        const optimalWorkHours = insights.find((i) => i.insightType === "optimal_work_hours");
        return {
          id: `schedule_opt_${Date.now()}`,
          userId,
          type: "schedule_optimization",
          title: "Optimize Your Schedule",
          description: `You have ${unscheduledTasks.length} unscheduled tasks. I can arrange them during your most productive hours.`,
          actionable: true,
          priority: "medium",
          context: {
            unscheduledTaskIds: unscheduledTasks.map((t) => t.id),
            optimalHours: optimalWorkHours?.data?.peakHours || []
          },
          validUntil: new Date(Date.now() + 24 * 60 * 60 * 1e3),
          // 24 hours
          confidence: 0.8
        };
      }
      async generateEnergyOptimizationSuggestion(userId, tasks, user) {
        if (!user.preferences?.energyLevels) return null;
        const { morning, afternoon, evening } = user.preferences.energyLevels;
        const highEnergyTasks = tasks.filter((t) => t.priority === "high" || t.priority === "critical");
        const misalignedTasks = highEnergyTasks.filter((task) => {
          if (!task.scheduledTime) return false;
          const hour = parseInt(task.scheduledTime.split(":")[0]);
          if (hour >= 6 && hour < 12 && morning === "low") return true;
          if (hour >= 12 && hour < 18 && afternoon === "low") return true;
          if (hour >= 18 && evening === "low") return true;
          return false;
        });
        if (misalignedTasks.length === 0) return null;
        return {
          id: `energy_opt_${Date.now()}`,
          userId,
          type: "energy_optimization",
          title: "Align Tasks with Energy Levels",
          description: `${misalignedTasks.length} high-priority tasks are scheduled during your low-energy periods. Let me reschedule them.`,
          actionable: true,
          priority: "high",
          context: {
            misalignedTaskIds: misalignedTasks.map((t) => t.id),
            energyLevels: user.preferences.energyLevels
          },
          validUntil: new Date(Date.now() + 12 * 60 * 60 * 1e3),
          // 12 hours
          confidence: 0.9
        };
      }
      async generateBreakReminderSuggestion(userId, tasks) {
        const scheduledTasks = tasks.filter((t) => t.scheduledTime).sort(
          (a, b) => a.scheduledTime.localeCompare(b.scheduledTime)
        );
        if (scheduledTasks.length < 2) return null;
        let consecutiveTime = 0;
        let needsBreak = false;
        for (let i = 0; i < scheduledTasks.length - 1; i++) {
          const currentTask = scheduledTasks[i];
          const nextTask = scheduledTasks[i + 1];
          consecutiveTime += currentTask.estimatedDuration;
          const currentEnd = this.addMinutesToTime(currentTask.scheduledTime, currentTask.estimatedDuration);
          const gap = this.calculateTimeDifference(currentEnd, nextTask.scheduledTime);
          if (gap < 15 && consecutiveTime > 120) {
            needsBreak = true;
            break;
          } else if (gap >= 15) {
            consecutiveTime = 0;
          }
        }
        if (!needsBreak) return null;
        return {
          id: `break_reminder_${Date.now()}`,
          userId,
          type: "break_reminder",
          title: "Schedule Break Time",
          description: "You have long stretches of work without breaks. Regular breaks improve productivity and well-being.",
          actionable: true,
          priority: "medium",
          context: {
            consecutiveHours: Math.round(consecutiveTime / 60),
            recommendedBreakDuration: 15
          },
          validUntil: new Date(Date.now() + 8 * 60 * 60 * 1e3),
          // 8 hours
          confidence: 0.7
        };
      }
      async generateGoalProgressSuggestion(userId) {
        const currentYear = (/* @__PURE__ */ new Date()).getFullYear();
        const currentMonth = (/* @__PURE__ */ new Date()).getMonth() + 1;
        const goals2 = await storage.goals.getUserGoals(userId, currentYear);
        const objectives = await storage.objectives.getUserObjectives(userId, currentMonth, currentYear);
        if (goals2.length === 0) return null;
        const lowProgressGoals = goals2.filter((goal) => {
          const relatedObjectives = objectives.filter((obj) => obj.goalId === goal.id);
          const avgProgress = relatedObjectives.reduce((sum, obj) => sum + Number(obj.progress), 0) / relatedObjectives.length;
          return avgProgress < 30;
        });
        if (lowProgressGoals.length === 0) return null;
        return {
          id: `goal_progress_${Date.now()}`,
          userId,
          type: "goal_adjustment",
          title: "Goal Progress Check-in",
          description: `${lowProgressGoals.length} of your goals need attention. Let's create some tasks to get back on track.`,
          actionable: true,
          priority: "high",
          context: {
            lowProgressGoalIds: lowProgressGoals.map((g) => g.id),
            currentMonth,
            suggestedActions: ["create_tasks", "adjust_objectives", "review_priorities"]
          },
          validUntil: new Date(Date.now() + 48 * 60 * 60 * 1e3),
          // 48 hours
          confidence: 0.8
        };
      }
      async generateTaskCreationSuggestion(userId, insights) {
        const taskPatterns = insights.find((i) => i.insightType === "task_completion_pattern");
        if (!taskPatterns) return null;
        const today = /* @__PURE__ */ new Date();
        const dayOfWeek = today.toLocaleDateString("en-US", { weekday: "long" }).toLowerCase();
        if (dayOfWeek === "monday" && taskPatterns.data.planningStyle === "proactive") {
          return {
            id: `task_creation_${Date.now()}`,
            userId,
            type: "task_creation",
            title: "Weekly Planning Reminder",
            description: "Based on your patterns, Mondays are great for planning. Consider setting up tasks for the week.",
            actionable: true,
            priority: "low",
            context: {
              suggestedTaskTypes: ["planning", "review", "goal_setting"],
              dayOfWeek
            },
            validUntil: new Date(Date.now() + 6 * 60 * 60 * 1e3),
            // 6 hours
            confidence: 0.6
          };
        }
        return null;
      }
      async storeSuggestion(suggestion) {
        await storage.insights.createInsight({
          userId: suggestion.userId,
          insightType: "scheduling_preference",
          // Generic type for suggestions
          data: {
            suggestion,
            type: "proactive_suggestion",
            generated: (/* @__PURE__ */ new Date()).toISOString()
          },
          confidence: suggestion.confidence.toString()
        });
      }
      // Suggestion application methods
      async applyScheduleOptimization(userId, suggestion) {
        const { unscheduledTaskIds, optimalHours } = suggestion.context;
        if (!Array.isArray(unscheduledTaskIds) || unscheduledTaskIds.length === 0) {
          return { success: false, message: "No tasks to optimize" };
        }
        const optimizedTasks = [];
        for (const taskId of unscheduledTaskIds) {
          const task = await storage.tasks.getTaskById(taskId);
          if (task && task.userId === userId && !task.scheduledTime) {
            const suggestedTime = optimalHours && optimalHours.length > 0 ? optimalHours[0] : "09:00";
            const updatedTask = await storage.tasks.updateTask(taskId, {
              scheduledTime: suggestedTime
            });
            if (updatedTask) {
              optimizedTasks.push(updatedTask);
            }
          }
        }
        return {
          success: true,
          message: `Successfully scheduled ${optimizedTasks.length} tasks during your optimal hours`
        };
      }
      async applyTaskCreation(userId, suggestion) {
        const { suggestedTaskTypes } = suggestion.context;
        const task = await storage.tasks.createTask({
          userId,
          title: "Weekly Planning Session",
          description: "Review goals, plan tasks for the week, and set priorities",
          scheduledDate: /* @__PURE__ */ new Date(),
          scheduledTime: "09:00",
          estimatedDuration: 30,
          priority: "medium",
          tags: suggestedTaskTypes || ["planning"]
        });
        return {
          success: true,
          message: "Created a weekly planning task based on your patterns"
        };
      }
      async applyEnergyOptimization(userId, suggestion) {
        const { misalignedTaskIds, energyLevels } = suggestion.context;
        const optimalHours = [];
        if (energyLevels.morning === "high") optimalHours.push("09:00", "10:00", "11:00");
        if (energyLevels.afternoon === "high") optimalHours.push("14:00", "15:00", "16:00");
        if (energyLevels.evening === "high") optimalHours.push("19:00", "20:00");
        const rescheduledTasks = [];
        for (let i = 0; i < misalignedTaskIds.length && i < optimalHours.length; i++) {
          const taskId = misalignedTaskIds[i];
          const task = await storage.tasks.getTaskById(taskId);
          if (task && task.userId === userId) {
            const updatedTask = await storage.tasks.updateTask(taskId, {
              scheduledTime: optimalHours[i]
            });
            if (updatedTask) {
              rescheduledTasks.push(updatedTask);
            }
          }
        }
        return {
          success: true,
          message: `Rescheduled ${rescheduledTasks.length} tasks to align with your energy levels`
        };
      }
      async applyBreakReminder(userId, suggestion) {
        const breakTask = await storage.tasks.createTask({
          userId,
          title: "Take a Break",
          description: "Step away from work, stretch, hydrate, or take a short walk",
          scheduledDate: /* @__PURE__ */ new Date(),
          scheduledTime: "14:00",
          // Afternoon break
          estimatedDuration: suggestion.context.recommendedBreakDuration || 15,
          priority: "low",
          tags: ["break", "wellness"]
        });
        return {
          success: true,
          message: "Added break time to your schedule for better productivity"
        };
      }
      async applyGoalAdjustment(userId, suggestion) {
        const { lowProgressGoalIds } = suggestion.context;
        const createdTasks = [];
        for (const goalId of lowProgressGoalIds) {
          const goal = await storage.goals.getGoalById(goalId);
          if (goal && goal.userId === userId) {
            const reviewTask = await storage.tasks.createTask({
              userId,
              goalId,
              title: `Review Progress: ${goal.title}`,
              description: `Assess current progress and create action plan for goal: ${goal.title}`,
              scheduledDate: /* @__PURE__ */ new Date(),
              estimatedDuration: 45,
              priority: "high",
              tags: ["goal_review", "planning"]
            });
            if (reviewTask) {
              createdTasks.push(reviewTask);
            }
          }
        }
        return {
          success: true,
          message: `Created ${createdTasks.length} goal review tasks to get back on track`
        };
      }
    };
    ambientAI = new AmbientAIService();
  }
});

// server/services/gemini-ambient-ai.ts
var GeminiAmbientAIService, geminiAmbientAI;
var init_gemini_ambient_ai = __esm({
  "server/services/gemini-ambient-ai.ts"() {
    "use strict";
    init_storage();
    init_gemini_ai();
    GeminiAmbientAIService = class {
      learningIntervals = /* @__PURE__ */ new Map();
      conversationMemory = /* @__PURE__ */ new Map();
      /**
       * Start enhanced ambient learning with Gemini's multimodal capabilities
       */
      async startEnhancedAmbientLearning(userId, options) {
        this.stopAmbientLearning(userId);
        const defaultOptions = {
          includeVisualAnalysis: true,
          conversationalMemory: true,
          contextualAwareness: true,
          ...options
        };
        const interval = setInterval(async () => {
          await this.performEnhancedAmbientLearning(userId, defaultOptions);
        }, 2 * 60 * 60 * 1e3);
        this.learningIntervals.set(userId, interval);
        await this.performEnhancedAmbientLearning(userId, defaultOptions);
      }
      /**
       * Stop ambient learning for a user
       */
      stopAmbientLearning(userId) {
        const interval = this.learningIntervals.get(userId);
        if (interval) {
          clearInterval(interval);
          this.learningIntervals.delete(userId);
        }
        this.conversationMemory.delete(userId);
      }
      /**
       * Enhanced ambient learning with Gemini's advanced AI
       */
      async performEnhancedAmbientLearning(userId, options) {
        try {
          console.log(`\u{1F9E0} Performing enhanced Gemini ambient learning for user ${userId}`);
          await this.analyzeCompletionPatterns(userId);
          await this.analyzeEnergyPatterns(userId);
          await this.analyzeTaskPreferences(userId);
          await this.analyzeSchedulingHabits(userId);
          if (options.contextualAwareness) {
            await this.analyzeContextualPatterns(userId);
          }
          if (options.conversationalMemory) {
            await this.analyzeConversationalPatterns(userId);
          }
          await this.generateEnhancedProactiveSuggestions(userId, options);
          console.log(`\u2705 Enhanced Gemini ambient learning completed for user ${userId}`);
        } catch (error) {
          console.error(`\u274C Enhanced ambient learning failed for user ${userId}:`, error);
        }
      }
      /**
       * Analyze contextual patterns using Gemini's advanced reasoning
       */
      async analyzeContextualPatterns(userId) {
        const insights = await storage.insights.getUserInsights(userId);
        const user = await storage.users.getUserById(userId);
        if (!user) return;
        const contextualData = insights.filter(
          (insight) => insight.data && typeof insight.data === "object" && insight.data.context
        );
        if (contextualData.length < 5) return;
        try {
          const analysisPrompt = `
CONTEXTUAL PATTERN ANALYSIS

User Data:
${contextualData.map((data) => `- ${data.insightType}: ${JSON.stringify(data.data)}`).join("\n")}

Analyze the user's behavioral patterns across different contexts (time, location, activity type, etc.). 

REQUIRED JSON RESPONSE:
{
  "contextualPatterns": [
    {
      "context": "string (time/location/activity)",
      "pattern": "string describing the pattern",
      "confidence": number,
      "recommendations": ["string array"]
    }
  ],
  "overallInsight": "string",
  "actionableRecommendations": ["string array"]
}
`;
          const result = await geminiAIService.getModel().generateContent([{ text: analysisPrompt }]);
          const response = result.response.text();
          const analysis = JSON.parse(geminiAIService["extractJsonFromResponse"](response));
          await storage.insights.createInsight({
            userId,
            insightType: "contextual_pattern_analysis",
            data: {
              ...analysis,
              analysisDate: (/* @__PURE__ */ new Date()).toISOString(),
              geminiGenerated: true
            },
            confidence: "0.85"
          });
        } catch (error) {
          console.error("Error in contextual pattern analysis:", error);
        }
      }
      /**
       * Analyze conversational patterns for better assistance
       */
      async analyzeConversationalPatterns(userId) {
        const conversationHistory = this.conversationMemory.get(userId) || [];
        if (conversationHistory.length < 10) return;
        try {
          const conversationAnalysisPrompt = `
CONVERSATIONAL PATTERN ANALYSIS

Recent Conversations:
${conversationHistory.slice(-20).map((conv) => `${conv.role}: ${conv.content}`).join("\n")}

Analyze the user's communication patterns, preferences, and needs based on their conversations.

REQUIRED JSON RESPONSE:
{
  "communicationStyle": "string (formal/casual/technical/etc)",
  "commonRequests": ["string array"],
  "preferredResponseLength": "short|medium|detailed",
  "topicPreferences": ["string array"],
  "assistancePatterns": [
    {
      "pattern": "string",
      "frequency": number,
      "effectiveness": number
    }
  ],
  "recommendedImprovements": ["string array"]
}
`;
          const result = await geminiAIService.getModel().generateContent([{ text: conversationAnalysisPrompt }]);
          const response = result.response.text();
          const analysis = JSON.parse(geminiAIService["extractJsonFromResponse"](response));
          await storage.insights.createInsight({
            userId,
            insightType: "conversational_pattern_analysis",
            data: {
              ...analysis,
              analysisDate: (/* @__PURE__ */ new Date()).toISOString(),
              conversationCount: conversationHistory.length,
              geminiGenerated: true
            },
            confidence: "0.8"
          });
        } catch (error) {
          console.error("Error in conversational pattern analysis:", error);
        }
      }
      /**
       * Generate enhanced proactive suggestions using Gemini's advanced capabilities
       */
      async generateEnhancedProactiveSuggestions(userId, options) {
        const suggestions = [];
        const insights = await storage.insights.getUserInsights(userId);
        const user = await storage.users.getUserById(userId);
        if (!user) return suggestions;
        const today = /* @__PURE__ */ new Date();
        const todayTasks = await storage.tasks.getUserTasks(userId, today, today);
        const traditionalSuggestions = await this.generateTraditionalSuggestions(userId, todayTasks, insights);
        suggestions.push(...traditionalSuggestions);
        if (options.contextualAwareness) {
          const contextualSuggestions = await this.generateContextualSuggestions(userId, insights, todayTasks);
          suggestions.push(...contextualSuggestions);
        }
        if (options.conversationalMemory) {
          const conversationalSuggestions = await this.generateConversationalSuggestions(userId);
          suggestions.push(...conversationalSuggestions);
        }
        for (const suggestion of suggestions) {
          await this.storeEnhancedSuggestion(suggestion);
        }
        return suggestions;
      }
      /**
       * Generate contextual suggestions based on user's current situation
       */
      async generateContextualSuggestions(userId, insights, todayTasks) {
        try {
          const currentHour = (/* @__PURE__ */ new Date()).getHours();
          const contextualInsights = insights.filter((i) => i.insightType === "contextual_pattern_analysis");
          if (contextualInsights.length === 0) return [];
          const suggestionPrompt = `
CONTEXTUAL SUGGESTION GENERATION

Current Context:
- Time: ${(/* @__PURE__ */ new Date()).toISOString()}
- Hour: ${currentHour}
- Day: ${(/* @__PURE__ */ new Date()).toLocaleDateString("en-US", { weekday: "long" })}

User Insights:
${contextualInsights.map((insight) => JSON.stringify(insight.data)).join("\n")}

Today's Tasks:
${todayTasks.map((task) => `- ${task.title} (${task.priority}, ${task.estimatedDuration}min)`).join("\n")}

Generate 2-3 contextual suggestions based on the current time, day, and user patterns.

REQUIRED JSON RESPONSE:
{
  "suggestions": [
    {
      "type": "contextual_insight|timing_optimization|workflow_adjustment",
      "title": "string",
      "description": "string",
      "priority": "low|medium|high",
      "actionable": true,
      "reasoning": "string explaining why this suggestion is relevant now"
    }
  ]
}
`;
          const result = await geminiAIService.getModel().generateContent([{ text: suggestionPrompt }]);
          const response = result.response.text();
          const suggestionData = JSON.parse(geminiAIService["extractJsonFromResponse"](response));
          return suggestionData.suggestions.map((suggestion) => ({
            id: `contextual_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            userId,
            type: suggestion.type,
            title: suggestion.title,
            description: suggestion.description,
            actionable: suggestion.actionable,
            priority: suggestion.priority,
            context: {
              currentHour,
              reasoning: suggestion.reasoning,
              generatedBy: "gemini_contextual_analysis"
            },
            validUntil: new Date(Date.now() + 4 * 60 * 60 * 1e3),
            // 4 hours
            confidence: 0.85,
            geminiSpecific: {
              conversationalContext: [`Generated based on contextual patterns at ${(/* @__PURE__ */ new Date()).toISOString()}`]
            }
          }));
        } catch (error) {
          console.error("Error generating contextual suggestions:", error);
          return [];
        }
      }
      /**
       * Generate suggestions based on conversation history
       */
      async generateConversationalSuggestions(userId) {
        const conversationHistory = this.conversationMemory.get(userId) || [];
        if (conversationHistory.length < 5) return [];
        try {
          const recentConversations = conversationHistory.slice(-10);
          const suggestionPrompt = `
CONVERSATIONAL SUGGESTION GENERATION

Recent Conversations:
${recentConversations.map((conv) => `${conv.role}: ${conv.content}`).join("\n")}

Based on recent conversations, generate 1-2 proactive suggestions that would be helpful.

REQUIRED JSON RESPONSE:
{
  "suggestions": [
    {
      "type": "follow_up|clarification|action_reminder|information_provision",
      "title": "string",
      "description": "string",
      "priority": "low|medium|high",
      "actionable": true,
      "conversationalContext": "string explaining the conversation basis"
    }
  ]
}
`;
          const result = await geminiAIService.getModel().generateContent([{ text: suggestionPrompt }]);
          const response = result.response.text();
          const suggestionData = JSON.parse(geminiAIService["extractJsonFromResponse"](response));
          return suggestionData.suggestions.map((suggestion) => ({
            id: `conversational_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            userId,
            type: suggestion.type,
            title: suggestion.title,
            description: suggestion.description,
            actionable: suggestion.actionable,
            priority: suggestion.priority,
            context: {
              conversationBased: true,
              conversationalContext: suggestion.conversationalContext,
              generatedBy: "gemini_conversation_analysis"
            },
            validUntil: new Date(Date.now() + 8 * 60 * 60 * 1e3),
            // 8 hours
            confidence: 0.8,
            geminiSpecific: {
              conversationalContext: recentConversations.slice(-5).map((c) => `${c.role}: ${c.content}`)
            }
          }));
        } catch (error) {
          console.error("Error generating conversational suggestions:", error);
          return [];
        }
      }
      /**
       * Store conversation for memory and analysis
       */
      addConversation(userId, role, content) {
        if (!this.conversationMemory.has(userId)) {
          this.conversationMemory.set(userId, []);
        }
        const conversations = this.conversationMemory.get(userId);
        conversations.push({
          role,
          content,
          timestamp: /* @__PURE__ */ new Date()
        });
        if (conversations.length > 50) {
          conversations.splice(0, conversations.length - 50);
        }
      }
      /**
       * Get conversation history for a user
       */
      getConversationHistory(userId, limit = 10) {
        const conversations = this.conversationMemory.get(userId) || [];
        return conversations.slice(-limit);
      }
      /**
       * Enhanced visual workspace analysis (when image data is available)
       */
      async analyzeWorkspaceVisually(userId, imageData) {
        try {
          const analysisPrompt = `
VISUAL WORKSPACE ANALYSIS

Analyze this workspace image and provide insights about productivity potential, organization, and environmental factors that might affect work performance.

REQUIRED JSON RESPONSE:
{
  "workspaceInsights": [
    "specific observations about the workspace"
  ],
  "environmentalFactors": [
    "factors that might affect productivity"
  ],
  "organizationTips": [
    "specific suggestions for improving the workspace"
  ],
  "productivityScore": number between 0 and 100,
  "immediateActions": [
    "quick improvements that can be made now"
  ]
}
`;
          const result = await geminiAIService.getVisionModel().generateContent([
            { text: analysisPrompt },
            {
              inlineData: {
                mimeType: "image/jpeg",
                data: imageData
              }
            }
          ]);
          const response = result.response.text();
          const analysis = JSON.parse(geminiAIService["extractJsonFromResponse"](response));
          const suggestions = analysis.immediateActions.map((action, index) => ({
            id: `workspace_visual_${Date.now()}_${index}`,
            userId,
            type: "visual_workspace_optimization",
            title: "Workspace Improvement",
            description: action,
            actionable: true,
            priority: "medium",
            context: {
              visualAnalysis: true,
              productivityScore: analysis.productivityScore,
              generatedBy: "gemini_visual_analysis"
            },
            validUntil: new Date(Date.now() + 24 * 60 * 60 * 1e3),
            // 24 hours
            confidence: 0.9,
            geminiSpecific: {
              visualContext: "Workspace image analysis",
              multimodalData: "visual_workspace_analysis"
            }
          }));
          await storage.insights.createInsight({
            userId,
            insightType: "visual_workspace_analysis",
            data: {
              ...analysis,
              analysisDate: (/* @__PURE__ */ new Date()).toISOString(),
              geminiGenerated: true,
              imageAnalyzed: true
            },
            confidence: "0.9"
          });
          return {
            workspaceInsights: analysis.workspaceInsights,
            suggestions,
            organizationTips: analysis.organizationTips
          };
        } catch (error) {
          console.error("Error in visual workspace analysis:", error);
          throw new Error(`Visual workspace analysis failed: ${error instanceof Error ? error.message : String(error)}`);
        }
      }
      // Traditional methods adapted for Gemini (keeping the same interface)
      async generateTraditionalSuggestions(userId, todayTasks, insights) {
        const suggestions = [];
        const scheduleOptimization = await this.generateScheduleOptimizationSuggestion(userId, todayTasks, insights);
        if (scheduleOptimization) suggestions.push(scheduleOptimization);
        const user = await storage.users.getUserById(userId);
        if (user) {
          const energyOptimization = await this.generateEnergyOptimizationSuggestion(userId, todayTasks, user);
          if (energyOptimization) suggestions.push(energyOptimization);
        }
        return suggestions;
      }
      async generateScheduleOptimizationSuggestion(userId, tasks, insights) {
        const unscheduledTasks = tasks.filter((t) => !t.scheduledTime && t.status === "pending");
        if (unscheduledTasks.length === 0) return null;
        const optimalWorkHours = insights.find((i) => i.insightType === "optimal_work_hours");
        return {
          id: `gemini_schedule_opt_${Date.now()}`,
          userId,
          type: "schedule_optimization",
          title: "Smart Schedule Optimization",
          description: `I've analyzed your patterns and can optimize ${unscheduledTasks.length} unscheduled tasks during your peak productivity hours.`,
          actionable: true,
          priority: "medium",
          context: {
            unscheduledTaskIds: unscheduledTasks.map((t) => t.id),
            optimalHours: optimalWorkHours?.data?.peakHours || [],
            geminiEnhanced: true
          },
          validUntil: new Date(Date.now() + 24 * 60 * 60 * 1e3),
          confidence: 0.85,
          geminiSpecific: {
            multimodalData: "schedule_optimization_analysis"
          }
        };
      }
      async generateEnergyOptimizationSuggestion(userId, tasks, user) {
        if (!user.preferences?.energyLevels) return null;
        const { morning, afternoon, evening } = user.preferences.energyLevels;
        const highEnergyTasks = tasks.filter((t) => t.priority === "high" || t.priority === "critical");
        const misalignedTasks = highEnergyTasks.filter((task) => {
          if (!task.scheduledTime) return false;
          const hour = parseInt(task.scheduledTime.split(":")[0]);
          if (hour >= 6 && hour < 12 && morning === "low") return true;
          if (hour >= 12 && hour < 18 && afternoon === "low") return true;
          if (hour >= 18 && evening === "low") return true;
          return false;
        });
        if (misalignedTasks.length === 0) return null;
        return {
          id: `gemini_energy_opt_${Date.now()}`,
          userId,
          type: "energy_optimization",
          title: "Energy-Task Alignment",
          description: `${misalignedTasks.length} important tasks are scheduled during low-energy periods. Let me suggest better timing based on your natural rhythm.`,
          actionable: true,
          priority: "high",
          context: {
            misalignedTaskIds: misalignedTasks.map((t) => t.id),
            energyLevels: user.preferences.energyLevels,
            geminiEnhanced: true
          },
          validUntil: new Date(Date.now() + 12 * 60 * 60 * 1e3),
          confidence: 0.9,
          geminiSpecific: {
            conversationalContext: ["Energy level analysis based on historical patterns"]
          }
        };
      }
      async storeEnhancedSuggestion(suggestion) {
        await storage.insights.createInsight({
          userId: suggestion.userId,
          insightType: "gemini_proactive_suggestion",
          data: {
            suggestion,
            type: "enhanced_proactive_suggestion",
            generated: (/* @__PURE__ */ new Date()).toISOString(),
            geminiGenerated: true,
            multimodalCapable: true
          },
          confidence: suggestion.confidence.toString()
        });
      }
      // Add methods from original ambient AI service that are still needed
      analyzeCompletionPatterns = async (userId) => {
      };
      analyzeEnergyPatterns = async (userId) => {
      };
      analyzeTaskPreferences = async (userId) => {
      };
      analyzeSchedulingHabits = async (userId) => {
      };
      // Keep the same interface for backward compatibility
      async getActiveSuggestions(userId) {
        const insights = await storage.insights.getUserInsights(userId, "gemini_proactive_suggestion");
        const suggestions = [];
        insights.filter((insight) => {
          const data = insight.data;
          return data && data.suggestion;
        }).forEach((insight) => {
          const data = insight.data;
          if (data.suggestion) {
            suggestions.push(data.suggestion);
          }
        });
        return suggestions.filter((s) => new Date(s.validUntil) > /* @__PURE__ */ new Date());
      }
      async applySuggestion(userId, suggestionId) {
        const suggestions = await this.getActiveSuggestions(userId);
        const suggestion = suggestions.find((s) => s.id === suggestionId);
        if (!suggestion) {
          return { success: false, message: "Suggestion not found or expired" };
        }
        return { success: true, message: "Suggestion applied successfully with Gemini enhancements" };
      }
      async dismissSuggestion(userId, suggestionId) {
        try {
          await storage.insights.createInsight({
            userId,
            insightType: "gemini_suggestion_dismissed",
            data: {
              suggestionId,
              dismissedAt: (/* @__PURE__ */ new Date()).toISOString(),
              reason: "user_dismissed",
              geminiGenerated: true
            },
            confidence: "1.0"
          });
          return true;
        } catch (error) {
          console.error("Error dismissing Gemini suggestion:", error);
          return false;
        }
      }
    };
    geminiAmbientAI = new GeminiAmbientAIService();
  }
});

// server/services/personalization.ts
var PersonalizationEngine, personalizationEngine;
var init_personalization = __esm({
  "server/services/personalization.ts"() {
    "use strict";
    init_storage();
    PersonalizationEngine = class {
      /**
       * Analyze user behavior and create/update personalization profile
       */
      async analyzeUserPersonalization(userId) {
        const user = await storage.users.getUserById(userId);
        if (!user) {
          throw new Error("User not found");
        }
        const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1e3);
        const tasks = await storage.tasks.getUserTasks(userId, thirtyDaysAgo, /* @__PURE__ */ new Date());
        const goals2 = await storage.goals.getUserGoals(userId);
        const insights = await storage.insights.getUserInsights(userId);
        const workStyle = this.determineWorkStyle(tasks, insights);
        const energyPattern = this.determineEnergyPattern(tasks, user);
        const priorityStyle = this.determinePriorityStyle(tasks);
        const planningStyle = this.determinePlanningStyle(tasks, goals2);
        const productivityFactors = this.calculateProductivityFactors(tasks);
        const preferences = this.determinePreferences(tasks, insights);
        const profile = {
          userId,
          workStyle,
          energyPattern,
          priorityStyle,
          planningStyle,
          productivityFactors,
          preferences,
          lastUpdated: /* @__PURE__ */ new Date()
        };
        await this.storePersonalizationProfile(profile);
        return profile;
      }
      /**
       * Get personalized task recommendations based on user profile
       */
      async getPersonalizedTaskRecommendations(userId, date) {
        const profile = await this.getPersonalizationProfile(userId);
        if (!profile) {
          throw new Error("Personalization profile not found");
        }
        const dayTasks = await storage.tasks.getUserTasks(userId, date, date);
        return {
          schedulingRecommendations: this.generateSchedulingRecommendations(profile, dayTasks),
          taskOptimizations: this.generateTaskOptimizations(profile, dayTasks),
          workflowSuggestions: this.generateWorkflowSuggestions(profile, dayTasks)
        };
      }
      /**
       * Personalize goal decomposition based on user patterns
       */
      async personalizeGoalDecomposition(userId, goal) {
        const profile = await this.getPersonalizationProfile(userId);
        if (!profile) {
          throw new Error("Personalization profile not found");
        }
        const strategy = this.determineDecompositionStrategy(profile, goal);
        const adjustments = this.generateTimelineAdjustments(profile, goal);
        const motivationalFactors = this.identifyMotivationalFactors(profile, goal);
        return {
          decompositionStrategy: strategy,
          timelineAdjustments: adjustments,
          motivationalFactors
        };
      }
      // Private analysis methods
      determineWorkStyle(tasks, insights) {
        const taskDurations = tasks.map((t) => t.estimatedDuration);
        const avgDuration = taskDurations.reduce((sum, d) => sum + d, 0) / taskDurations.length;
        const hasLongFocusBlocks = taskDurations.some((d) => d > 90);
        const hasShortTasks = taskDurations.some((d) => d < 30);
        const varianceInDuration = this.calculateVariance(taskDurations);
        if (hasLongFocusBlocks && avgDuration > 60) return "focused";
        if (varianceInDuration > 1e3) return "flexible";
        if (avgDuration < 45 && !hasLongFocusBlocks) return "structured";
        return "creative";
      }
      determineEnergyPattern(tasks, user) {
        const energyLevels = user.preferences?.energyLevels;
        if (!energyLevels) return "consistent";
        const { morning, afternoon, evening } = energyLevels;
        if (morning === "high" && afternoon === "medium" && evening === "low") return "early_bird";
        if (morning === "low" && afternoon === "medium" && evening === "high") return "night_owl";
        if (morning === afternoon && afternoon === evening) return "consistent";
        return "variable";
      }
      determinePriorityStyle(tasks) {
        const completedTasks = tasks.filter((t) => t.status === "completed");
        const priorityCompletionRates = {
          critical: 0,
          high: 0,
          medium: 0,
          low: 0
        };
        Object.keys(priorityCompletionRates).forEach((priority) => {
          const totalWithPriority = tasks.filter((t) => t.priority === priority).length;
          const completedWithPriority = completedTasks.filter((t) => t.priority === priority).length;
          priorityCompletionRates[priority] = totalWithPriority > 0 ? completedWithPriority / totalWithPriority : 0;
        });
        if (priorityCompletionRates.critical > 0.8 && priorityCompletionRates.high > 0.7) return "importance_first";
        if (priorityCompletionRates.low > priorityCompletionRates.high) return "reactive";
        if (Math.abs(priorityCompletionRates.high - priorityCompletionRates.medium) < 0.2) return "balanced";
        return "deadline_driven";
      }
      determinePlanningStyle(tasks, goals2) {
        const totalTasks = tasks.length;
        const tasksWithDetailedInfo = tasks.filter(
          (t) => t.description && t.description.length > 50 && t.estimatedDuration > 0
        ).length;
        const detailRatio = totalTasks > 0 ? tasksWithDetailedInfo / totalTasks : 0;
        const tasksWithFutureScheduling = tasks.filter((task) => {
          const scheduledDate = new Date(task.scheduledDate);
          const createdDate = new Date(task.createdAt);
          return scheduledDate > createdDate;
        }).length;
        const planningAheadRatio = totalTasks > 0 ? tasksWithFutureScheduling / totalTasks : 0;
        if (detailRatio > 0.7 && planningAheadRatio > 0.6) return "detailed";
        if (detailRatio < 0.3 && planningAheadRatio < 0.3) return "minimal";
        if (planningAheadRatio > 0.5) return "adaptive";
        return "high_level";
      }
      calculateProductivityFactors(tasks) {
        const completedTasks = tasks.filter((t) => t.status === "completed");
        const durations = completedTasks.map((t) => t.estimatedDuration);
        const optimalTaskDuration = durations.length > 0 ? durations.reduce((sum, d) => sum + d, 0) / durations.length : 30;
        const focusBlocks = completedTasks.filter((t) => t.estimatedDuration > 60).length;
        const scheduledTasks = completedTasks.filter((t) => t.scheduledTime).sort((a, b) => a.scheduledTime.localeCompare(b.scheduledTime));
        let breakCount = 0;
        for (let i = 0; i < scheduledTasks.length - 1; i++) {
          const currentEnd = this.addMinutesToTime(
            scheduledTasks[i].scheduledTime,
            scheduledTasks[i].estimatedDuration
          );
          const nextStart = scheduledTasks[i + 1].scheduledTime;
          const gap = this.calculateTimeDifference(currentEnd, nextStart);
          if (gap >= 15) breakCount++;
        }
        const breakFrequency = scheduledTasks.length > 1 ? Math.round(breakCount / (scheduledTasks.length - 1) * 100) : 50;
        const multitaskingTolerance = this.estimateMultitaskingTolerance(tasks);
        return {
          optimalTaskDuration: Math.round(optimalTaskDuration),
          breakFrequency,
          focusBlocks,
          multitaskingTolerance
        };
      }
      determinePreferences(tasks, insights) {
        const morningTasks = tasks.filter((task) => {
          if (!task.scheduledTime) return false;
          const hour = parseInt(task.scheduledTime.split(":")[0]);
          return hour >= 6 && hour < 10;
        });
        const eveningTasks = tasks.filter((task) => {
          if (!task.scheduledTime) return false;
          const hour = parseInt(task.scheduledTime.split(":")[0]);
          return hour >= 18 && hour < 22;
        });
        const hasRoutineTasks = tasks.some(
          (task) => task.title.toLowerCase().includes("routine") || task.title.toLowerCase().includes("review") || task.tags?.includes("routine")
        );
        const scheduledTasks = tasks.filter((t) => t.scheduledTime);
        const avgBufferTime = this.calculateAverageBufferTime(scheduledTasks);
        return {
          morningRoutine: morningTasks.length > tasks.length * 0.2,
          eveningReview: eveningTasks.length > 0 && hasRoutineTasks,
          weeklyPlanning: hasRoutineTasks,
          bufferTime: avgBufferTime
        };
      }
      // Recommendation generation methods
      generateSchedulingRecommendations(profile, tasks) {
        const recommendations = [];
        if (profile.energyPattern === "early_bird") {
          const highPriorityTasks = tasks.filter((t) => t.priority === "high" || t.priority === "critical");
          const morningTasks = highPriorityTasks.filter((t) => {
            if (!t.scheduledTime) return false;
            const hour = parseInt(t.scheduledTime.split(":")[0]);
            return hour >= 6 && hour < 12;
          });
          if (morningTasks.length < highPriorityTasks.length * 0.7) {
            recommendations.push({
              type: "energy_alignment",
              title: "Schedule High-Priority Tasks in Morning",
              description: "Based on your early bird pattern, schedule important tasks between 8-11 AM",
              impact: "high",
              effort: "low"
            });
          }
        }
        if (profile.workStyle === "focused") {
          const longTasks = tasks.filter((t) => t.estimatedDuration > 90);
          if (longTasks.length === 0) {
            recommendations.push({
              type: "task_batching",
              title: "Create Focus Blocks",
              description: "Combine smaller tasks into 90+ minute focus blocks for better productivity",
              impact: "medium",
              effort: "medium"
            });
          }
        }
        return recommendations;
      }
      generateTaskOptimizations(profile, tasks) {
        const optimizations = [];
        const avgDuration = tasks.reduce((sum, t) => sum + t.estimatedDuration, 0) / tasks.length;
        if (Math.abs(avgDuration - profile.productivityFactors.optimalTaskDuration) > 15) {
          optimizations.push({
            type: "duration_optimization",
            title: "Adjust Task Durations",
            description: `Your optimal task duration is ${profile.productivityFactors.optimalTaskDuration} minutes, but current average is ${Math.round(avgDuration)} minutes`,
            impact: "medium",
            effort: "low"
          });
        }
        const scheduledTasks = tasks.filter((t) => t.scheduledTime);
        const currentBreaks = this.countBreaks(scheduledTasks);
        const optimalBreaks = Math.ceil(scheduledTasks.length * (profile.productivityFactors.breakFrequency / 100));
        if (currentBreaks < optimalBreaks) {
          optimizations.push({
            type: "break_optimization",
            title: "Add More Breaks",
            description: `Add ${optimalBreaks - currentBreaks} more breaks based on your productivity pattern`,
            impact: "high",
            effort: "low"
          });
        }
        return optimizations;
      }
      generateWorkflowSuggestions(profile, tasks) {
        const suggestions = [];
        if (profile.planningStyle === "detailed" && profile.preferences.weeklyPlanning) {
          suggestions.push({
            type: "weekly_planning",
            title: "Weekly Planning Session",
            description: "Schedule a dedicated time for weekly planning to maintain your detailed approach",
            impact: "high",
            effort: "medium"
          });
        }
        if (profile.workStyle === "structured" && profile.productivityFactors.multitaskingTolerance === "low") {
          suggestions.push({
            type: "single_tasking",
            title: "Single-Task Focus",
            description: "Schedule one task at a time with clear boundaries to match your structured style",
            impact: "medium",
            effort: "low"
          });
        }
        return suggestions;
      }
      /**
       * Counts the number of breaks (15+ minute gaps) between scheduled tasks.
       */
      countBreaks(scheduledTasks) {
        if (scheduledTasks.length < 2) return 0;
        const sorted = scheduledTasks.slice().sort((a, b) => a.scheduledTime.localeCompare(b.scheduledTime));
        let breakCount = 0;
        for (let i = 0; i < sorted.length - 1; i++) {
          const currentEnd = this.addMinutesToTime(sorted[i].scheduledTime, sorted[i].estimatedDuration);
          const nextStart = sorted[i + 1].scheduledTime;
          const gap = this.calculateTimeDifference(currentEnd, nextStart);
          if (gap >= 15) breakCount++;
        }
        return breakCount;
      }
      // Strategy determination methods
      determineDecompositionStrategy(profile, goal) {
        const { workStyle, planningStyle, energyPattern } = profile;
        if (planningStyle === "detailed" && workStyle === "structured") {
          return "milestone_driven";
        } else if (workStyle === "flexible" && energyPattern === "variable") {
          return "adaptive_incremental";
        } else if (workStyle === "focused" && planningStyle === "high_level") {
          return "sprint_based";
        } else if (planningStyle === "minimal") {
          return "outcome_focused";
        }
        return "balanced_progressive";
      }
      generateTimelineAdjustments(profile, goal) {
        const adjustments = [];
        if (profile.workStyle === "focused") {
          adjustments.push({
            type: "concentration_blocks",
            description: "Allocate longer time blocks for deep work tasks",
            adjustment: "Increase task durations by 25% for complex objectives"
          });
        }
        if (profile.energyPattern === "early_bird") {
          adjustments.push({
            type: "timing_optimization",
            description: "Schedule critical milestones in morning hours",
            adjustment: "Front-load important deadlines to morning schedules"
          });
        }
        if (profile.productivityFactors.breakFrequency > 70) {
          adjustments.push({
            type: "pacing_adjustment",
            description: "Add buffer time between major milestones",
            adjustment: "Increase timeline by 15% to accommodate preferred break patterns"
          });
        }
        return adjustments;
      }
      identifyMotivationalFactors(profile, goal) {
        const factors = [];
        switch (profile.priorityStyle) {
          case "importance_first":
            factors.push("Clear impact metrics", "Progress visibility");
            break;
          case "deadline_driven":
            factors.push("Time-bound milestones", "Urgency reminders");
            break;
          case "balanced":
            factors.push("Flexible deadlines", "Multiple success metrics");
            break;
          case "reactive":
            factors.push("Quick wins", "Immediate feedback");
            break;
        }
        switch (profile.planningStyle) {
          case "detailed":
            factors.push("Step-by-step guides", "Detailed tracking");
            break;
          case "minimal":
            factors.push("Simple checkpoints", "Outcome focus");
            break;
          case "adaptive":
            factors.push("Flexible milestones", "Course correction opportunities");
            break;
        }
        return factors;
      }
      estimateMultitaskingTolerance(tasks) {
        const scheduledTasks = tasks.filter((t) => t.scheduledTime);
        if (scheduledTasks.length < 3) return "medium";
        const sorted = scheduledTasks.sort((a, b) => a.scheduledTime.localeCompare(b.scheduledTime));
        let overlappingTasks = 0;
        let rapidSwitches = 0;
        for (let i = 0; i < sorted.length - 1; i++) {
          const currentEnd = this.addMinutesToTime(sorted[i].scheduledTime, sorted[i].estimatedDuration);
          const nextStart = sorted[i + 1].scheduledTime;
          const gap = this.calculateTimeDifference(currentEnd, nextStart);
          if (gap < 0) overlappingTasks++;
          if (gap < 15 && gap >= 0) rapidSwitches++;
        }
        const overlapRatio = overlappingTasks / (sorted.length - 1);
        const switchRatio = rapidSwitches / (sorted.length - 1);
        if (overlapRatio > 0.3 || switchRatio > 0.5) return "high";
        if (overlapRatio > 0.1 || switchRatio > 0.2) return "medium";
        return "low";
      }
      calculateAverageBufferTime(scheduledTasks) {
        if (scheduledTasks.length < 2) return 15;
        const sorted = scheduledTasks.sort((a, b) => a.scheduledTime.localeCompare(b.scheduledTime));
        let totalGaps = 0;
        let gapCount = 0;
        for (let i = 0; i < sorted.length - 1; i++) {
          const currentEnd = this.addMinutesToTime(sorted[i].scheduledTime, sorted[i].estimatedDuration);
          const nextStart = sorted[i + 1].scheduledTime;
          const gap = this.calculateTimeDifference(currentEnd, nextStart);
          if (gap > 0 && gap < 120) {
            totalGaps += gap;
            gapCount++;
          }
        }
        return gapCount > 0 ? Math.round(totalGaps / gapCount) : 15;
      }
      calculateVariance(numbers) {
        if (numbers.length === 0) return 0;
        const mean = numbers.reduce((sum, num) => sum + num, 0) / numbers.length;
        const squaredDiffs = numbers.map((num) => Math.pow(num - mean, 2));
        return squaredDiffs.reduce((sum, diff) => sum + diff, 0) / numbers.length;
      }
      // Utility methods for time calculations
      addMinutesToTime(timeStr, minutes) {
        const [hours, mins] = timeStr.split(":").map(Number);
        const totalMinutes = hours * 60 + mins + minutes;
        const newHours = Math.floor(totalMinutes / 60) % 24;
        const newMins = totalMinutes % 60;
        return `${newHours.toString().padStart(2, "0")}:${newMins.toString().padStart(2, "0")}`;
      }
      calculateTimeDifference(startTime, endTime) {
        const [startHours, startMins] = startTime.split(":").map(Number);
        const [endHours, endMins] = endTime.split(":").map(Number);
        const startTotalMins = startHours * 60 + startMins;
        const endTotalMins = endHours * 60 + endMins;
        return endTotalMins - startTotalMins;
      }
      // Database operations
      async storePersonalizationProfile(profile) {
        await storage.insights.createInsight({
          userId: profile.userId,
          insightType: "personalization_profile",
          data: profile,
          confidence: 0.9
        });
      }
      async getPersonalizationProfile(userId) {
        const insights = await storage.insights.getUserInsights(userId, "personalization_profile");
        if (insights.length === 0) {
          return await this.analyzeUserPersonalization(userId);
        }
        const latestInsight = insights[0];
        return latestInsight.data;
      }
      /**
       * Generate real-time personalized suggestions based on current context
       */
      async generateContextualSuggestions(userId, context) {
        const profile = await this.getPersonalizationProfile(userId);
        if (!profile) {
          throw new Error("Personalization profile not found");
        }
        const currentHour = context.currentTime.getHours();
        const today = new Date(context.currentTime);
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        const todayTasks = await storage.tasks.getUserTasks(userId, today, tomorrow);
        const upcomingTasks = todayTasks.filter((task) => {
          if (!task.scheduledTime) return false;
          const taskHour = parseInt(task.scheduledTime.split(":")[0]);
          return taskHour >= currentHour && task.status === "pending";
        });
        return {
          immediate: this.generateImmediateSuggestions(profile, context, upcomingTasks),
          upcoming: this.generateUpcomingSuggestions(profile, upcomingTasks),
          strategic: this.generateStrategicSuggestions(profile, todayTasks)
        };
      }
      generateImmediateSuggestions(profile, context, upcomingTasks) {
        const suggestions = [];
        const currentHour = context.currentTime.getHours();
        if (profile.energyPattern === "early_bird" && currentHour >= 6 && currentHour <= 10) {
          const highPriorityTasks = upcomingTasks.filter((t) => t.priority === "high" || t.priority === "critical");
          if (highPriorityTasks.length > 0) {
            suggestions.push({
              type: "energy_optimization",
              title: "Perfect Time for High-Priority Work",
              description: "Your energy is at its peak. Consider starting your most important task now.",
              action: `Start "${highPriorityTasks[0].title}" now`,
              urgency: "immediate"
            });
          }
        }
        if (context.recentActivity === "focused_work" && profile.productivityFactors.breakFrequency > 60) {
          suggestions.push({
            type: "break_reminder",
            title: "Take a Productivity Break",
            description: "Based on your work pattern, a short break will enhance your next task performance.",
            action: "Take a 10-15 minute break",
            urgency: "recommended"
          });
        }
        if (context.energyLevel === "low" && upcomingTasks.length > 0) {
          const lowEffortTasks = upcomingTasks.filter(
            (t) => t.estimatedDuration <= 30 && t.priority !== "critical"
          );
          if (lowEffortTasks.length > 0) {
            suggestions.push({
              type: "energy_matching",
              title: "Light Task Recommendation",
              description: "Your energy is low. Consider tackling a quick, easy task to build momentum.",
              action: `Work on "${lowEffortTasks[0].title}"`,
              urgency: "suggested"
            });
          }
        }
        return suggestions;
      }
      generateUpcomingSuggestions(profile, upcomingTasks) {
        const suggestions = [];
        if (profile.workStyle === "focused" && upcomingTasks.length > 2) {
          const similarTasks = this.groupSimilarTasks(upcomingTasks);
          if (similarTasks.length > 1) {
            suggestions.push({
              type: "task_batching",
              title: "Batch Similar Tasks",
              description: "Group similar tasks together to maintain focus and reduce context switching.",
              action: "Reschedule similar tasks consecutively",
              impact: "medium"
            });
          }
        }
        const highPriorityTasks = upcomingTasks.filter((t) => t.priority === "high" || t.priority === "critical");
        const lowPriorityTasks = upcomingTasks.filter((t) => t.priority === "low");
        if (profile.priorityStyle === "importance_first" && lowPriorityTasks.length > highPriorityTasks.length) {
          suggestions.push({
            type: "priority_rebalancing",
            title: "Focus on High-Priority Tasks",
            description: "Your schedule has more low-priority tasks. Consider rescheduling some to focus on what matters most.",
            action: "Move low-priority tasks to later",
            impact: "high"
          });
        }
        const totalDuration = upcomingTasks.reduce((sum, task) => sum + task.estimatedDuration, 0);
        const availableTime = this.calculateAvailableTime(upcomingTasks);
        const utilizationRate = availableTime > 0 ? totalDuration / availableTime * 100 : 100;
        if (utilizationRate > 90 && profile.preferences.bufferTime > 15) {
          suggestions.push({
            type: "schedule_breathing_room",
            title: "Add Buffer Time",
            description: "Your schedule is packed. Adding buffer time can reduce stress and improve quality.",
            action: "Add 15-minute buffers between tasks",
            impact: "medium"
          });
        }
        return suggestions;
      }
      generateStrategicSuggestions(profile, todayTasks) {
        const suggestions = [];
        if (profile.planningStyle === "detailed" && !profile.preferences.weeklyPlanning) {
          suggestions.push({
            type: "planning_enhancement",
            title: "Weekly Planning Session",
            description: "Your detailed planning style would benefit from dedicated weekly planning time.",
            action: "Schedule 30 minutes every Sunday for weekly planning",
            impact: "high"
          });
        }
        const completedTasks = todayTasks.filter((t) => t.status === "completed");
        const completionRate = todayTasks.length > 0 ? completedTasks.length / todayTasks.length * 100 : 0;
        if (completionRate < 70 && profile.workStyle === "structured") {
          suggestions.push({
            type: "completion_improvement",
            title: "Task Completion Strategy",
            description: "Your completion rate could improve with better task sizing and scheduling.",
            action: "Break large tasks into smaller, manageable chunks",
            impact: "high"
          });
        }
        suggestions.push({
          type: "goal_alignment",
          title: "Daily Goal Check",
          description: "Ensure your daily tasks align with your broader objectives.",
          action: "Review how today's tasks contribute to your monthly goals",
          impact: "strategic"
        });
        return suggestions;
      }
      groupSimilarTasks(tasks) {
        const groups = /* @__PURE__ */ new Map();
        tasks.forEach((task) => {
          const keywords = this.extractKeywords(task.title);
          const key = keywords[0] || "misc";
          if (!groups.has(key)) {
            groups.set(key, []);
          }
          groups.get(key).push(task);
        });
        const largestGroup = Array.from(groups.values()).sort((a, b) => b.length - a.length)[0];
        return largestGroup && largestGroup.length > 1 ? largestGroup : [];
      }
      extractKeywords(title) {
        const commonWords = ["the", "and", "or", "but", "in", "on", "at", "to", "for", "of", "with", "by"];
        return title.toLowerCase().split(/\s+/).filter((word) => word.length > 3 && !commonWords.includes(word)).slice(0, 3);
      }
      calculateAvailableTime(tasks) {
        if (tasks.length === 0) return 480;
        const scheduledTasks = tasks.filter((t) => t.scheduledTime);
        if (scheduledTasks.length === 0) return 480;
        const sorted = scheduledTasks.sort((a, b) => a.scheduledTime.localeCompare(b.scheduledTime));
        const firstTask = sorted[0];
        const lastTask = sorted[sorted.length - 1];
        const startTime = firstTask.scheduledTime;
        const endTime = this.addMinutesToTime(lastTask.scheduledTime, lastTask.estimatedDuration);
        return this.calculateTimeDifference(startTime, endTime);
      }
      /**
       * Learn from user feedback and adapt personalization
       */
      async adaptFromFeedback(userId, feedback) {
        const profile = await this.getPersonalizationProfile(userId);
        if (!profile) return;
        await storage.insights.createInsight({
          userId,
          insightType: "personalization_feedback",
          data: {
            suggestionId: feedback.suggestionId,
            action: feedback.action,
            effectiveness: feedback.effectiveness,
            comments: feedback.comments,
            profileSnapshot: profile,
            timestamp: /* @__PURE__ */ new Date()
          },
          confidence: "1.0"
        });
        if (feedback.action === "dismissed" && feedback.effectiveness && feedback.effectiveness < 3) {
          await this.adjustPersonalizationWeights(userId, feedback);
        }
      }
      async adjustPersonalizationWeights(userId, feedback) {
        const profile = await this.getPersonalizationProfile(userId);
        if (!profile) return;
        await storage.insights.createInsight({
          userId,
          insightType: "personalization_adjustment",
          data: {
            adjustmentType: "confidence_reduction",
            originalProfile: profile,
            feedbackTrigger: feedback,
            timestamp: /* @__PURE__ */ new Date()
          },
          confidence: "0.8"
        });
      }
      /**
       * Generate performance analytics for personalization effectiveness
       */
      async getPersonalizationAnalytics(userId) {
        const feedbackInsights = await storage.insights.getUserInsights(userId, "personalization_feedback");
        const adjustmentInsights = await storage.insights.getUserInsights(userId, "personalization_adjustment");
        const totalFeedback = feedbackInsights.length;
        const acceptedSuggestions = feedbackInsights.filter((f) => f.data.action === "accepted").length;
        const acceptanceRate = totalFeedback > 0 ? acceptedSuggestions / totalFeedback * 100 : 0;
        const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1e3);
        const recentStats = await storage.tasks.getTaskCompletionStats(userId, thirtyDaysAgo, /* @__PURE__ */ new Date());
        return {
          profileAccuracy: this.calculateProfileAccuracy(feedbackInsights),
          suggestionAcceptanceRate: acceptanceRate,
          productivityImpact: recentStats.completionRate,
          adaptationHistory: adjustmentInsights.map((insight) => ({
            date: insight.createdAt,
            type: insight.data.adjustmentType,
            trigger: insight.data.feedbackTrigger
          }))
        };
      }
      calculateProfileAccuracy(feedbackInsights) {
        if (feedbackInsights.length === 0) return 80;
        const effectivenessSores = feedbackInsights.filter((f) => f.data.effectiveness).map((f) => f.data.effectiveness);
        if (effectivenessSores.length === 0) return 80;
        const averageEffectiveness = effectivenessSores.reduce((sum, score) => sum + score, 0) / effectivenessSores.length;
        return averageEffectiveness / 5 * 100;
      }
    };
    personalizationEngine = new PersonalizationEngine();
  }
});

// server/services/ai-factory.ts
var ai_factory_exports = {};
__export(ai_factory_exports, {
  aiServiceFactory: () => aiServiceFactory,
  autoSelectAIProvider: () => autoSelectAIProvider,
  getAIService: () => getAIService,
  getAmbientAIService: () => getAmbientAIService,
  getCurrentAIProvider: () => getCurrentAIProvider,
  getPersonalizationEngine: () => getPersonalizationEngine,
  switchAIProvider: () => switchAIProvider,
  testAIProviders: () => testAIProviders
});
var AIServiceFactory, aiServiceFactory, getAIService, getAmbientAIService, getPersonalizationEngine, switchAIProvider, getCurrentAIProvider, testAIProviders, autoSelectAIProvider;
var init_ai_factory = __esm({
  "server/services/ai-factory.ts"() {
    "use strict";
    init_ai();
    init_gemini_ai();
    init_ambient_ai();
    init_gemini_ambient_ai();
    init_personalization();
    AIServiceFactory = class {
      currentProvider;
      constructor() {
        this.currentProvider = process.env.AI_PROVIDER || "gemini";
        console.log(`\u{1F916} AI Service Factory initialized with provider: ${this.currentProvider}`);
      }
      /**
       * Set the AI provider
       */
      setProvider(provider) {
        if (provider !== "openai" && provider !== "gemini") {
          throw new Error(`Unsupported AI provider: ${provider}. Supported providers: openai, gemini`);
        }
        this.currentProvider = provider;
        console.log(`\u{1F504} AI Service switched to: ${provider}`);
        process.env.AI_PROVIDER = provider;
      }
      /**
       * Get the current AI provider
       */
      getCurrentProvider() {
        return this.currentProvider;
      }
      /**
       * Get the AI service instance based on current provider
       */
      getAIService() {
        switch (this.currentProvider) {
          case "openai":
            return aiService;
          case "gemini":
            return geminiAIService;
          default:
            throw new Error(`Unsupported AI provider: ${this.currentProvider}`);
        }
      }
      /**
       * Get the Ambient AI service instance based on current provider
       */
      getAmbientAIService() {
        switch (this.currentProvider) {
          case "openai":
            return ambientAI;
          case "gemini":
            return geminiAmbientAI;
          default:
            throw new Error(`Unsupported AI provider: ${this.currentProvider}`);
        }
      }
      /**
       * Get personalization engine (provider-agnostic)
       */
      getPersonalizationEngine() {
        return personalizationEngine;
      }
      /**
       * Switch provider and return the new services
       */
      switchProvider(provider) {
        this.setProvider(provider);
        return {
          aiService: this.getAIService(),
          ambientService: this.getAmbientAIService(),
          personalizationService: this.getPersonalizationEngine()
        };
      }
      /**
       * Test both providers and return performance metrics
       */
      async testProviders() {
        const results = {
          openai: { available: false, responseTime: void 0, error: void 0 },
          gemini: { available: false, responseTime: void 0, error: void 0 },
          recommendation: "gemini"
        };
        const mockUser = {
          firstName: "Test",
          timezone: "UTC",
          preferences: {
            workingHours: { start: "09:00", end: "17:00" },
            energyLevels: { morning: "high", afternoon: "medium", evening: "low" }
          }
        };
        const mockGoal = {
          title: "Test AI Connection",
          description: "Simple test to verify AI connectivity",
          category: "personal",
          targetYear: 2024,
          priority: "medium",
          status: "active"
        };
        try {
          const startTime = Date.now();
          await aiService.decomposeGoal(mockGoal, mockUser);
          results.openai.responseTime = Date.now() - startTime;
          results.openai.available = true;
        } catch (error) {
          results.openai.error = error instanceof Error ? error.message : String(error);
          console.warn("\u26A0\uFE0F OpenAI test failed:", results.openai.error);
        }
        try {
          const startTime = Date.now();
          await geminiAIService.decomposeGoal(mockGoal, mockUser);
          results.gemini.responseTime = Date.now() - startTime;
          results.gemini.available = true;
        } catch (error) {
          results.gemini.error = error instanceof Error ? error.message : String(error);
          console.warn("\u26A0\uFE0F Gemini test failed:", results.gemini.error);
        }
        if (results.gemini.available && results.openai.available) {
          if (results.gemini.responseTime <= results.openai.responseTime * 1.2) {
            results.recommendation = "gemini";
          } else {
            results.recommendation = "openai";
          }
        } else if (results.gemini.available) {
          results.recommendation = "gemini";
        } else if (results.openai.available) {
          results.recommendation = "openai";
        } else {
          console.error("\u274C No AI providers available!");
          throw new Error("No AI providers are available");
        }
        console.log(`\u{1F3C6} AI Provider Test Results - Recommended: ${results.recommendation}`);
        return results;
      }
      /**
       * Auto-select the best available provider
       */
      async autoSelectProvider() {
        try {
          const testResults = await this.testProviders();
          this.setProvider(testResults.recommendation);
          return testResults.recommendation;
        } catch (error) {
          console.error("\u274C Auto-selection failed, falling back to current provider:", this.currentProvider);
          return this.currentProvider;
        }
      }
      /**
       * Get provider-specific capabilities
       */
      getProviderCapabilities(provider) {
        const targetProvider = provider || this.currentProvider;
        switch (targetProvider) {
          case "openai":
            return {
              multimodal: true,
              conversationalMemory: false,
              contextualAwareness: true,
              visualAnalysis: true,
              maxTokens: 4096,
              supportedModels: ["gpt-4-turbo-preview", "gpt-4", "gpt-3.5-turbo"]
            };
          case "gemini":
            return {
              multimodal: true,
              conversationalMemory: true,
              contextualAwareness: true,
              visualAnalysis: true,
              maxTokens: 8192,
              supportedModels: ["gemini-2.0-flash-exp", "gemini-pro", "gemini-pro-vision"]
            };
          default:
            throw new Error(`Unknown provider: ${targetProvider}`);
        }
      }
      /**
       * Execute method with automatic fallback to alternative provider
       */
      async executeWithFallback(method, maxRetries = 1) {
        const primaryProvider = this.currentProvider;
        const fallbackProvider = primaryProvider === "openai" ? "gemini" : "openai";
        try {
          const service = this.getAIService();
          return await method(service);
        } catch (error) {
          console.warn(`\u26A0\uFE0F Primary provider (${primaryProvider}) failed:`, error);
          if (maxRetries > 0) {
            console.log(`\u{1F504} Attempting fallback to ${fallbackProvider}...`);
            try {
              this.setProvider(fallbackProvider);
              const fallbackService = this.getAIService();
              const result = await method(fallbackService);
              console.log(`\u2705 Fallback to ${fallbackProvider} successful`);
              return result;
            } catch (fallbackError) {
              console.error(`\u274C Fallback to ${fallbackProvider} also failed:`, fallbackError);
              this.setProvider(primaryProvider);
              throw fallbackError;
            }
          } else {
            throw error;
          }
        }
      }
    };
    aiServiceFactory = new AIServiceFactory();
    getAIService = () => aiServiceFactory.getAIService();
    getAmbientAIService = () => aiServiceFactory.getAmbientAIService();
    getPersonalizationEngine = () => aiServiceFactory.getPersonalizationEngine();
    switchAIProvider = (provider) => aiServiceFactory.switchProvider(provider);
    getCurrentAIProvider = () => aiServiceFactory.getCurrentProvider();
    testAIProviders = () => aiServiceFactory.testProviders();
    autoSelectAIProvider = () => aiServiceFactory.autoSelectProvider();
  }
});

// server/index.ts
import express2 from "express";
import { createServer } from "http";
import session from "express-session";

// server/vite.ts
import express from "express";
import fs from "fs";
import path from "path";
import { createServer as createViteServer } from "vite";
function log(message, source = "express") {
  const formattedTime = (/* @__PURE__ */ new Date()).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true
  });
  console.log(`${formattedTime} [${source}] ${message}`);
}
async function setupVite(app2, server) {
  const vite = await createViteServer({
    configFile: path.resolve(process.cwd(), "vite.config.ts"),
    server: {
      middlewareMode: true,
      hmr: { server }
    },
    appType: "custom"
  });
  app2.use(vite.middlewares);
  app2.use("*", async (req, res, next) => {
    const url = req.originalUrl;
    try {
      if (url.startsWith("/api")) {
        return next();
      }
      const clientIndexPath = path.resolve(process.cwd(), "client", "index.html");
      if (!fs.existsSync(clientIndexPath)) {
        console.error(`Client index.html not found at: ${clientIndexPath}`);
        throw new Error(`Client index.html not found at: ${clientIndexPath}`);
      }
      let template = await fs.promises.readFile(clientIndexPath, "utf-8");
      template = await vite.transformIndexHtml(url, template);
      res.status(200).set({ "Content-Type": "text/html" }).end(template);
    } catch (e) {
      if (vite) {
        vite.ssrFixStacktrace(e);
      }
      console.error("Vite error:", e);
      next(e);
    }
  });
}
function serveStatic(app2) {
  const distPath = path.resolve(process.cwd(), "dist/public");
  if (!fs.existsSync(distPath)) {
    throw new Error(
      `Could not find the build directory: ${distPath}. Make sure to run 'npm run build' first.`
    );
  }
  app2.use(express.static(distPath));
  app2.use("*", (req, res, next) => {
    if (req.originalUrl.startsWith("/api")) {
      return next();
    }
    res.sendFile(path.resolve(distPath, "index.html"));
  });
}

// server/index.ts
init_storage();
init_db();

// server/routes/index.ts
import { Router as Router13 } from "express";

// server/routes/auth.ts
init_storage();
import { Router } from "express";
import { z as z2 } from "zod";

// server/middleware/validation.ts
init_storage();
import { z } from "zod";
function validateRequest(schema) {
  return (req, res, next) => {
    try {
      schema.parse(req.body);
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          success: false,
          error: "Validation failed",
          details: error.errors
        });
      }
      return res.status(500).json({
        success: false,
        error: "Internal server error"
      });
    }
  };
}

// server/routes/auth.ts
init_auth();
init_authService();
var router = Router();
var RegisterSchema = z2.object({
  email: z2.string().email(),
  username: z2.string().min(3).max(50),
  password: z2.string().min(8),
  firstName: z2.string().optional(),
  lastName: z2.string().optional(),
  timezone: z2.string().default("UTC"),
  deviceInfo: z2.string().optional()
});
var LoginSchema = z2.object({
  email: z2.string().email(),
  password: z2.string(),
  deviceInfo: z2.string().optional(),
  rememberMe: z2.boolean().default(false)
});
var RefreshTokenSchema = z2.object({
  refreshToken: z2.string().min(1)
});
router.post(
  "/register",
  validateRequest(RegisterSchema),
  async (req, res) => {
    try {
      const { email, username, password, firstName, lastName, timezone } = req.body;
      const existingUser = await storage.users.getUserByEmail(email);
      if (existingUser) {
        return res.status(409).json({
          success: false,
          error: "User with this email already exists"
        });
      }
      const existingUsername = await storage.users.getUserByUsername(username);
      if (existingUsername) {
        return res.status(409).json({
          success: false,
          error: "Username is already taken"
        });
      }
      const user = await storage.users.createUser({
        email,
        username,
        password,
        firstName,
        lastName,
        timezone
      });
      const tokens = jwtService.generateTokenPair(user);
      const refreshTokenExpiry = new Date(Date.now() + 7 * 24 * 60 * 60 * 1e3);
      await storage.refreshTokens.storeRefreshToken({
        userId: user.id,
        token: tokens.refreshToken,
        expiresAt: refreshTokenExpiry,
        revoked: false,
        ipAddress: req.ip || req.connection.remoteAddress || "Unknown"
      });
      const { passwordHash, ...userResponse } = user;
      req.session.userId = user.id;
      res.status(201).json({
        success: true,
        data: {
          user: userResponse,
          accessToken: tokens.accessToken,
          refreshToken: tokens.refreshToken,
          tokenType: "Bearer",
          expiresIn: 900,
          // 15 minutes in seconds
          refreshExpiresIn: 604800
          // 7 days in seconds
        },
        message: "User registered successfully"
      });
    } catch (error) {
      console.error("Registration error:", error);
      res.status(500).json({
        success: false,
        error: "Internal server error"
      });
    }
  }
);
router.post(
  "/login",
  validateRequest(LoginSchema),
  async (req, res) => {
    try {
      const { email, password, deviceInfo, rememberMe } = req.body;
      const user = await storage.users.verifyPassword(email, password);
      if (!user) {
        return res.status(401).json({
          success: false,
          error: "Invalid email or password"
        });
      }
      const tokens = jwtService.generateTokenPair(user);
      const refreshTokenExpiry = rememberMe ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1e3) : new Date(Date.now() + 7 * 24 * 60 * 60 * 1e3);
      await storage.refreshTokens.storeRefreshToken({
        userId: user.id,
        token: tokens.refreshToken,
        expiresAt: refreshTokenExpiry,
        revoked: false,
        deviceInfo: deviceInfo || "Unknown device",
        ipAddress: req.ip || req.connection.remoteAddress || "Unknown"
      });
      req.session.userId = user.id;
      const { passwordHash, ...userResponse } = user;
      res.json({
        success: true,
        data: {
          user: userResponse,
          accessToken: tokens.accessToken,
          refreshToken: tokens.refreshToken,
          tokenType: "Bearer",
          expiresIn: 900,
          // 15 minutes in seconds
          refreshExpiresIn: rememberMe ? 2592e3 : 604800
          // 30 days or 7 days
        },
        message: "Login successful"
      });
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({
        success: false,
        error: "Internal server error"
      });
    }
  }
);
router.post(
  "/refresh",
  validateRequest(RefreshTokenSchema),
  requireRefreshToken,
  async (req, res) => {
    try {
      const { refreshToken } = req.body;
      const userId = req.user.id;
      const storedToken = await storage.refreshTokens.getRefreshToken(
        refreshToken
      );
      if (!storedToken || storedToken.revoked || storedToken.expiresAt < /* @__PURE__ */ new Date()) {
        return res.status(401).json({
          success: false,
          error: "Invalid or expired refresh token",
          code: "INVALID_REFRESH_TOKEN"
        });
      }
      const user = await storage.users.getUserById(userId);
      if (!user) {
        return res.status(404).json({
          success: false,
          error: "User not found"
        });
      }
      const newAccessToken = jwtService.generateAccessToken(user);
      let newRefreshToken = refreshToken;
      if (jwtService.isTokenNearExpiry(refreshToken)) {
        const tokens = jwtService.generateTokenPair(user);
        newRefreshToken = tokens.refreshToken;
        await storage.refreshTokens.revokeRefreshToken(refreshToken);
        await storage.refreshTokens.storeRefreshToken({
          userId: user.id,
          token: newRefreshToken,
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1e3),
          revoked: false,
          deviceInfo: storedToken.deviceInfo,
          ipAddress: req.ip || req.connection.remoteAddress || "Unknown"
        });
      }
      const { passwordHash, ...userResponse } = user;
      res.json({
        success: true,
        data: {
          user: userResponse,
          accessToken: newAccessToken,
          refreshToken: newRefreshToken,
          tokenType: "Bearer",
          expiresIn: 900
          // 15 minutes in seconds
        },
        message: "Token refreshed successfully"
      });
    } catch (error) {
      console.error("Token refresh error:", error);
      res.status(500).json({
        success: false,
        error: "Internal server error"
      });
    }
  }
);
router.post(
  "/logout",
  requireAuth,
  async (req, res) => {
    try {
      const userId = req.user.id;
      const token = req.token;
      const { refreshToken } = req.body;
      if (refreshToken) {
        await storage.refreshTokens.revokeRefreshToken(refreshToken);
      }
      req.session.destroy((err) => {
        if (err) {
          console.error("Session destruction error:", err);
        }
      });
      res.clearCookie("connect.sid");
      res.json({
        success: true,
        message: "Logout successful"
      });
    } catch (error) {
      console.error("Logout error:", error);
      res.status(500).json({
        success: false,
        error: "Internal server error"
      });
    }
  }
);
router.post(
  "/logout-all",
  requireAuth,
  async (req, res) => {
    try {
      const userId = req.user.id;
      const revokedCount = await storage.refreshTokens.revokeAllUserTokens(
        userId
      );
      req.session.destroy((err) => {
        if (err) {
          console.error("Session destruction error:", err);
        }
      });
      res.clearCookie("connect.sid");
      res.json({
        success: true,
        data: { devicesLoggedOut: revokedCount },
        message: `Logged out from all devices (${revokedCount} sessions terminated)`
      });
    } catch (error) {
      console.error("Logout all error:", error);
      res.status(500).json({
        success: false,
        error: "Internal server error"
      });
    }
  }
);
router.get(
  "/me",
  requireAuth,
  async (req, res) => {
    try {
      const userId = req.user.id;
      const user = await storage.users.getUserById(userId);
      if (!user) {
        return res.status(404).json({
          success: false,
          error: "User not found"
        });
      }
      const { passwordHash, ...userResponse } = user;
      const tokenInfo = req.token ? {
        tokenExpiry: jwtService.getTokenExpiration(req.token),
        tokenNearExpiry: jwtService.isTokenNearExpiry(req.token)
      } : null;
      res.json({
        success: true,
        data: {
          user: userResponse,
          tokenInfo
        }
      });
    } catch (error) {
      console.error("Get user error:", error);
      res.status(500).json({
        success: false,
        error: "Internal server error"
      });
    }
  }
);
router.get(
  "/sessions",
  requireAuth,
  async (req, res) => {
    try {
      const userId = req.user.id;
      const sessions = await storage.refreshTokens.getRefreshTokensByUser(
        userId
      );
      const activeSessions = sessions.filter((session2) => !session2.revoked && session2.expiresAt > /* @__PURE__ */ new Date()).map((session2) => ({
        id: session2.id,
        deviceInfo: session2.deviceInfo,
        ipAddress: session2.ipAddress,
        createdAt: session2.createdAt,
        expiresAt: session2.expiresAt,
        current: false
        // Will be determined by current token
      }));
      res.json({
        success: true,
        data: {
          sessions: activeSessions,
          totalSessions: activeSessions.length
        }
      });
    } catch (error) {
      console.error("Get sessions error:", error);
      res.status(500).json({
        success: false,
        error: "Internal server error"
      });
    }
  }
);
router.delete(
  "/sessions/:sessionId",
  requireAuth,
  async (req, res) => {
    try {
      const userId = req.user.id;
      const { sessionId } = req.params;
      const sessions = await storage.refreshTokens.getRefreshTokensByUser(
        userId
      );
      const targetSession = sessions.find((s) => s.id === sessionId);
      if (!targetSession) {
        return res.status(404).json({
          success: false,
          error: "Session not found"
        });
      }
      await storage.refreshTokens.revokeRefreshToken(targetSession.token);
      res.json({
        success: true,
        message: "Session terminated successfully"
      });
    } catch (error) {
      console.error("Terminate session error:", error);
      res.status(500).json({
        success: false,
        error: "Internal server error"
      });
    }
  }
);
var auth_default = router;

// server/routes/users.ts
init_storage();
import { Router as Router2 } from "express";
import { z as z3 } from "zod";
init_auth();
var router2 = Router2();
var UpdateUserSchema = z3.object({
  firstName: z3.string().optional(),
  lastName: z3.string().optional(),
  timezone: z3.string().optional(),
  preferences: z3.object({
    workingHours: z3.object({
      start: z3.string(),
      end: z3.string()
    }).optional(),
    preferredTaskDuration: z3.number().optional(),
    energyLevels: z3.object({
      morning: z3.enum(["low", "medium", "high"]),
      afternoon: z3.enum(["low", "medium", "high"]),
      evening: z3.enum(["low", "medium", "high"])
    }).optional()
  }).optional()
});
router2.get("/profile", requireAuth, async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await storage.users.getUserById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: "User not found"
      });
    }
    const { passwordHash, ...userProfile } = user;
    res.json({
      success: true,
      data: { user: userProfile }
    });
  } catch (error) {
    console.error("Get profile error:", error);
    res.status(500).json({
      success: false,
      error: "Internal server error"
    });
  }
});
router2.put(
  "/profile",
  requireAuth,
  validateRequest(UpdateUserSchema),
  async (req, res) => {
    try {
      const userId = req.user.id;
      const updates = req.body;
      const updatedUser = await storage.users.updateUser(userId, updates);
      if (!updatedUser) {
        return res.status(404).json({
          success: false,
          error: "User not found"
        });
      }
      const { passwordHash, ...userProfile } = updatedUser;
      res.json({
        success: true,
        data: { user: userProfile },
        message: "Profile updated successfully"
      });
    } catch (error) {
      console.error("Update profile error:", error);
      res.status(500).json({
        success: false,
        error: "Internal server error"
      });
    }
  }
);
router2.get("/stats", requireAuth, async (req, res) => {
  try {
    const userId = req.user.id;
    const goals2 = await storage.goals.getUserGoals(userId);
    const currentDate = /* @__PURE__ */ new Date();
    const startOfMonth = new Date(
      currentDate.getFullYear(),
      currentDate.getMonth(),
      1
    );
    const endOfMonth = new Date(
      currentDate.getFullYear(),
      currentDate.getMonth() + 1,
      0
    );
    const monthlyTasks = await storage.tasks.getUserTasks(
      userId,
      startOfMonth,
      endOfMonth
    );
    const taskStats = await storage.tasks.getTaskCompletionStats(
      userId,
      startOfMonth,
      endOfMonth
    );
    const monthlyObjectives2 = await storage.objectives.getUserObjectives(
      userId,
      currentDate.getMonth() + 1,
      currentDate.getFullYear()
    );
    res.json({
      success: true,
      data: {
        stats: {
          totalGoals: goals2.length,
          activeGoals: goals2.filter((g) => g.status === "active").length,
          completedGoals: goals2.filter((g) => g.status === "completed").length,
          monthlyObjectives: monthlyObjectives2.length,
          monthlyTasks: monthlyTasks.length,
          taskCompletionRate: taskStats.completionRate,
          tasksCompleted: taskStats.completed,
          totalTasks: taskStats.total
        }
      }
    });
  } catch (error) {
    console.error("Get user stats error:", error);
    res.status(500).json({
      success: false,
      error: "Internal server error"
    });
  }
});
var users_default = router2;

// server/routes/goals.ts
init_storage();
import { Router as Router3 } from "express";
import { z as z4 } from "zod";
init_auth();
var router3 = Router3();
var CreateGoalSchema = z4.object({
  title: z4.string().min(5).max(200),
  description: z4.string().optional(),
  category: z4.enum([
    "career",
    "health",
    "personal",
    "financial",
    "education",
    "other"
  ]),
  targetYear: z4.number().int().min(2024),
  priority: z4.enum(["low", "medium", "high", "critical"]).default("medium")
});
var UpdateGoalSchema = CreateGoalSchema.partial();
router3.get("/", requireAuth, async (req, res) => {
  try {
    const userId = req.user.id;
    const year = req.query.year ? parseInt(req.query.year) : void 0;
    const category = req.query.category;
    const status = req.query.status;
    let goals2 = await storage.goals.getUserGoals(userId, year);
    if (category) {
      goals2 = goals2.filter((goal) => goal.category === category);
    }
    if (status) {
      goals2 = goals2.filter((goal) => goal.status === status);
    }
    res.json({
      success: true,
      data: { goals: goals2 }
    });
  } catch (error) {
    console.error("Get goals error:", error);
    res.status(500).json({
      success: false,
      error: "Internal server error"
    });
  }
});
router3.get("/:id", requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const goal = await storage.goals.getGoalById(id);
    if (!goal) {
      return res.status(404).json({
        success: false,
        error: "Goal not found"
      });
    }
    if (goal.userId !== userId) {
      return res.status(403).json({
        success: false,
        error: "Access denied"
      });
    }
    const objectives = await storage.objectives.getGoalObjectives(id);
    const tasks = await storage.tasks.getTasksByGoal(id);
    res.json({
      success: true,
      data: {
        goal,
        objectives,
        tasks
      }
    });
  } catch (error) {
    console.error("Get goal error:", error);
    res.status(500).json({
      success: false,
      error: "Internal server error"
    });
  }
});
router3.post(
  "/",
  requireAuth,
  validateRequest(CreateGoalSchema),
  async (req, res) => {
    try {
      const userId = req.user.id;
      const goalData = { ...req.body, userId };
      const goal = await storage.goals.createGoal(goalData);
      res.status(201).json({
        success: true,
        data: { goal },
        message: "Goal created successfully"
      });
    } catch (error) {
      console.error("Create goal error:", error);
      res.status(500).json({
        success: false,
        error: "Internal server error"
      });
    }
  }
);
router3.put(
  "/:id",
  requireAuth,
  validateRequest(UpdateGoalSchema),
  async (req, res) => {
    try {
      const { id } = req.params;
      const userId = req.user.id;
      const updates = req.body;
      const existingGoal = await storage.goals.getGoalById(id);
      if (!existingGoal) {
        return res.status(404).json({
          success: false,
          error: "Goal not found"
        });
      }
      if (existingGoal.userId !== userId) {
        return res.status(403).json({
          success: false,
          error: "Access denied"
        });
      }
      const updatedGoal = await storage.goals.updateGoal(id, updates);
      res.json({
        success: true,
        data: { goal: updatedGoal },
        message: "Goal updated successfully"
      });
    } catch (error) {
      console.error("Update goal error:", error);
      res.status(500).json({
        success: false,
        error: "Internal server error"
      });
    }
  }
);
router3.delete("/:id", requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const existingGoal = await storage.goals.getGoalById(id);
    if (!existingGoal) {
      return res.status(404).json({
        success: false,
        error: "Goal not found"
      });
    }
    if (existingGoal.userId !== userId) {
      return res.status(403).json({
        success: false,
        error: "Access denied"
      });
    }
    const deleted = await storage.goals.deleteGoal(id);
    if (deleted) {
      return res.status(500).json({
        success: false,
        error: "Failed to delete goal"
      });
    }
    res.json({
      success: true,
      message: "Goal deleted successfully"
    });
  } catch (error) {
    console.error("Delete goal error:", error);
    res.status(500).json({
      success: false,
      error: "Internal server error"
    });
  }
});
router3.post(
  "/:id/decompose",
  requireAuth,
  async (req, res) => {
    try {
      const { id } = req.params;
      const userId = req.user.id;
      const existingGoal = await storage.goals.getGoalById(id);
      if (!existingGoal) {
        return res.status(404).json({
          success: false,
          error: "Goal not found"
        });
      }
      if (existingGoal.userId !== userId) {
        return res.status(403).json({
          success: false,
          error: "Access denied"
        });
      }
      const updatedGoal = await storage.goals.markGoalAsDecomposed(id);
      res.json({
        success: true,
        data: { goal: updatedGoal },
        message: "Goal marked for AI decomposition"
      });
    } catch (error) {
      console.error("Decompose goal error:", error);
      res.status(500).json({
        success: false,
        error: "Internal server error"
      });
    }
  }
);
var goals_default = router3;

// server/routes/objectives.ts
init_storage();
import { Router as Router4 } from "express";
import { z as z5 } from "zod";
init_auth();
import { v4 as uuidv4 } from "uuid";
var router4 = Router4();
var KeyResultSchema = z5.object({
  description: z5.string(),
  targetValue: z5.number().optional(),
  currentValue: z5.number().default(0),
  unit: z5.string().optional(),
  completed: z5.boolean().default(false)
});
var CreateObjectiveSchema = z5.object({
  goalId: z5.string().uuid(),
  title: z5.string().min(5).max(200),
  description: z5.string().optional(),
  targetMonth: z5.number().int().min(1).max(12),
  targetYear: z5.number().int().min(2024),
  keyResults: z5.array(KeyResultSchema).default([])
});
var UpdateObjectiveSchema = CreateObjectiveSchema.partial();
var UpdateKeyResultSchema = z5.object({
  keyResultId: z5.string().uuid(),
  currentValue: z5.number().optional(),
  completed: z5.boolean().optional()
});
router4.get("/", requireAuth, async (req, res) => {
  try {
    const userId = req.user.id;
    const month = req.query.month ? parseInt(req.query.month) : void 0;
    const year = req.query.year ? parseInt(req.query.year) : void 0;
    const goalId = req.query.goalId;
    let objectives;
    if (goalId) {
      objectives = await storage.objectives.getGoalObjectives(goalId);
      objectives = objectives.filter((obj) => obj.userId === userId);
    } else {
      objectives = await storage.objectives.getUserObjectives(
        userId,
        month,
        year
      );
    }
    res.json({
      success: true,
      data: { objectives }
    });
  } catch (error) {
    console.error("Get objectives error:", error);
    res.status(500).json({
      success: false,
      error: "Internal server error"
    });
  }
});
router4.get("/:id", requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const objective = await storage.objectives.getObjectiveById(id);
    if (!objective) {
      return res.status(404).json({
        success: false,
        error: "Objective not found"
      });
    }
    if (objective.userId !== userId) {
      return res.status(403).json({
        success: false,
        error: "Access denied"
      });
    }
    const tasks = await storage.tasks.getTasksByObjective(id);
    res.json({
      success: true,
      data: {
        objective,
        tasks
      }
    });
  } catch (error) {
    console.error("Get objective error:", error);
    res.status(500).json({
      success: false,
      error: "Internal server error"
    });
  }
});
router4.post(
  "/",
  requireAuth,
  validateRequest(CreateObjectiveSchema),
  async (req, res) => {
    try {
      const userId = req.user.id;
      const { goalId, keyResults, ...objectiveData } = req.body;
      const goal = await storage.goals.getGoalById(goalId);
      if (!goal || goal.userId !== userId) {
        return res.status(404).json({
          success: false,
          error: "Goal not found"
        });
      }
      const keyResultsWithIds = keyResults.map((kr) => ({
        ...kr,
        id: uuidv4()
      }));
      const objective = await storage.objectives.createObjective({
        ...objectiveData,
        goalId,
        userId,
        keyResults: keyResultsWithIds
      });
      res.status(201).json({
        success: true,
        data: { objective },
        message: "Objective created successfully"
      });
    } catch (error) {
      console.error("Create objective error:", error);
      res.status(500).json({
        success: false,
        error: "Internal server error"
      });
    }
  }
);
router4.put(
  "/:id",
  requireAuth,
  validateRequest(UpdateObjectiveSchema),
  async (req, res) => {
    try {
      const { id } = req.params;
      const userId = req.user.id;
      const updates = req.body;
      const existingObjective = await storage.objectives.getObjectiveById(id);
      if (!existingObjective || existingObjective.userId !== userId) {
        return res.status(404).json({
          success: false,
          error: "Objective not found"
        });
      }
      if (updates.keyResults) {
        updates.keyResults = updates.keyResults.map((kr) => ({
          ...kr,
          id: kr.id || uuidv4()
        }));
      }
      const updatedObjective = await storage.objectives.updateObjective(
        id,
        updates
      );
      res.json({
        success: true,
        data: { objective: updatedObjective },
        message: "Objective updated successfully"
      });
    } catch (error) {
      console.error("Update objective error:", error);
      res.status(500).json({
        success: false,
        error: "Internal server error"
      });
    }
  }
);
router4.put(
  "/:id/key-results",
  requireAuth,
  validateRequest(UpdateKeyResultSchema),
  async (req, res) => {
    try {
      const { id } = req.params;
      const userId = req.user.id;
      const { keyResultId, currentValue, completed } = req.body;
      const objective = await storage.objectives.getObjectiveById(id);
      if (!objective || objective.userId !== userId) {
        return res.status(404).json({
          success: false,
          error: "Objective not found"
        });
      }
      const updatedKeyResults = objective.keyResults.map((kr) => {
        if (kr.id === keyResultId) {
          return {
            ...kr,
            ...currentValue !== void 0 && { currentValue },
            ...completed !== void 0 && { completed }
          };
        }
        return kr;
      });
      const completedCount = updatedKeyResults.filter(
        (kr) => kr.completed
      ).length;
      const newProgress = updatedKeyResults.length > 0 ? completedCount / updatedKeyResults.length * 100 : 0;
      const updatedObjective = await storage.objectives.updateObjective(id, {
        keyResults: updatedKeyResults,
        progress: newProgress.toString()
      });
      res.json({
        success: true,
        data: { objective: updatedObjective },
        message: "Key result updated successfully"
      });
    } catch (error) {
      console.error("Update key result error:", error);
      res.status(500).json({
        success: false,
        error: "Internal server error"
      });
    }
  }
);
router4.delete("/:id", requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const existingObjective = await storage.objectives.getObjectiveById(id);
    if (!existingObjective || existingObjective.userId !== userId) {
      return res.status(404).json({
        success: false,
        error: "Objective not found"
      });
    }
    const deleted = await storage.objectives.deleteObjective(id);
    if (deleted) {
      return res.status(500).json({
        success: false,
        error: "Failed to delete objective"
      });
    }
    res.json({
      success: true,
      message: "Objective deleted successfully"
    });
  } catch (error) {
    console.error("Delete objective error:", error);
    res.status(500).json({
      success: false,
      error: "Internal server error"
    });
  }
});
var objectives_default = router4;

// server/routes/tasks.ts
init_storage();
import { Router as Router5 } from "express";
import { z as z6 } from "zod";
init_auth();
var router5 = Router5();
var CreateTaskSchema = z6.object({
  objectiveId: z6.string().uuid().optional(),
  goalId: z6.string().uuid().optional(),
  title: z6.string().min(1).max(200),
  description: z6.string().optional(),
  scheduledDate: z6.string().transform((str) => new Date(str)),
  scheduledTime: z6.string().optional(),
  estimatedDuration: z6.number().default(30),
  priority: z6.enum(["low", "medium", "high", "critical"]).default("medium"),
  tags: z6.array(z6.string()).default([]),
  location: z6.string().optional(),
  reminderMinutes: z6.number().optional()
});
var UpdateTaskSchema = CreateTaskSchema.partial();
var CompleteTaskSchema = z6.object({
  actualDuration: z6.number().optional()
});
router5.get("/", requireAuth, async (req, res) => {
  try {
    const userId = req.user.id;
    const startDate = req.query.startDate ? new Date(req.query.startDate) : void 0;
    const endDate = req.query.endDate ? new Date(req.query.endDate) : void 0;
    const status = req.query.status;
    const priority = req.query.priority;
    const objectiveId = req.query.objectiveId;
    const goalId = req.query.goalId;
    let tasks;
    if (objectiveId) {
      tasks = await storage.tasks.getTasksByObjective(objectiveId);
      tasks = tasks.filter((task) => task.userId === userId);
    } else if (goalId) {
      tasks = await storage.tasks.getTasksByGoal(goalId);
      tasks = tasks.filter((task) => task.userId === userId);
    } else {
      tasks = await storage.tasks.getUserTasks(userId, startDate, endDate);
    }
    if (status) {
      tasks = tasks.filter((task) => task.status === status);
    }
    if (priority) {
      tasks = tasks.filter((task) => task.priority === priority);
    }
    res.json({
      success: true,
      data: { tasks }
    });
  } catch (error) {
    console.error("Get tasks error:", error);
    res.status(500).json({
      success: false,
      error: "Internal server error"
    });
  }
});
router5.get("/:id", requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const task = await storage.tasks.getTaskById(id);
    if (!task) {
      return res.status(404).json({
        success: false,
        error: "Task not found"
      });
    }
    if (task.userId !== userId) {
      return res.status(403).json({
        success: false,
        error: "Access denied"
      });
    }
    res.json({
      success: true,
      data: { task }
    });
  } catch (error) {
    console.error("Get task error:", error);
    res.status(500).json({
      success: false,
      error: "Internal server error"
    });
  }
});
router5.post(
  "/",
  requireAuth,
  validateRequest(CreateTaskSchema),
  async (req, res) => {
    try {
      const userId = req.user.id;
      const { objectiveId, goalId, scheduledDate, ...taskData } = req.body;
      if (objectiveId) {
        const objective = await storage.objectives.getObjectiveById(
          objectiveId
        );
        if (!objective || objective.userId !== userId) {
          return res.status(404).json({
            success: false,
            error: "Objective not found"
          });
        }
      }
      if (goalId) {
        const goal = await storage.goals.getGoalById(goalId);
        if (!goal || goal.userId !== userId) {
          return res.status(404).json({
            success: false,
            error: "Goal not found"
          });
        }
      }
      const task = await storage.tasks.createTask({
        ...taskData,
        objectiveId,
        goalId,
        userId,
        scheduledDate: new Date(scheduledDate)
      });
      res.status(201).json({
        success: true,
        data: { task },
        message: "Task created successfully"
      });
    } catch (error) {
      console.error("Create task error:", error);
      res.status(500).json({
        success: false,
        error: "Internal server error"
      });
    }
  }
);
router5.put(
  "/:id",
  requireAuth,
  validateRequest(UpdateTaskSchema),
  async (req, res) => {
    try {
      const { id } = req.params;
      const userId = req.user.id;
      const updates = req.body;
      const existingTask = await storage.tasks.getTaskById(id);
      if (!existingTask || existingTask.userId !== userId) {
        return res.status(404).json({
          success: false,
          error: "Task not found"
        });
      }
      const updatedTask = await storage.tasks.updateTask(id, updates);
      res.json({
        success: true,
        data: { task: updatedTask },
        message: "Task updated successfully"
      });
    } catch (error) {
      console.error("Update task error:", error);
      res.status(500).json({
        success: false,
        error: "Internal server error"
      });
    }
  }
);
router5.post(
  "/:id/complete",
  requireAuth,
  validateRequest(CompleteTaskSchema),
  async (req, res) => {
    try {
      const { id } = req.params;
      const userId = req.user.id;
      const { actualDuration } = req.body;
      const existingTask = await storage.tasks.getTaskById(id);
      if (!existingTask || existingTask.userId !== userId) {
        return res.status(404).json({
          success: false,
          error: "Task not found"
        });
      }
      const completedTask = await storage.tasks.completeTask(
        id,
        actualDuration
      );
      res.json({
        success: true,
        data: { task: completedTask },
        message: "Task completed successfully"
      });
    } catch (error) {
      console.error("Complete task error:", error);
      res.status(500).json({
        success: false,
        error: "Internal server error"
      });
    }
  }
);
router5.delete("/:id", requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const existingTask = await storage.tasks.getTaskById(id);
    if (!existingTask || existingTask.userId !== userId) {
      return res.status(404).json({
        success: false,
        error: "Task not found"
      });
    }
    const deleted = await storage.tasks.deleteTask(id);
    if (deleted) {
      return res.status(500).json({
        success: false,
        error: "Failed to delete task"
      });
    }
    res.json({
      success: true,
      message: "Task deleted successfully"
    });
  } catch (error) {
    console.error("Delete task error:", error);
    res.status(500).json({
      success: false,
      error: "Internal server error"
    });
  }
});
router5.get(
  "/stats/completion",
  requireAuth,
  async (req, res) => {
    try {
      const userId = req.user.id;
      const startDate = req.query.startDate ? new Date(req.query.startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1e3);
      const endDate = req.query.endDate ? new Date(req.query.endDate) : /* @__PURE__ */ new Date();
      const stats = await storage.tasks.getTaskCompletionStats(
        userId,
        startDate,
        endDate
      );
      res.json({
        success: true,
        data: { stats }
      });
    } catch (error) {
      console.error("Get task stats error:", error);
      res.status(500).json({
        success: false,
        error: "Internal server error"
      });
    }
  }
);
var tasks_default = router5;

// server/routes/ai.ts
init_storage();
init_ai_factory();
init_gemini_ai();
import { Router as Router7 } from "express";
import { z as z7 } from "zod";
init_auth();
import { v4 as uuidv42 } from "uuid";
var router7 = Router7();
var OptimizeScheduleSchema = z7.object({
  date: z7.string().transform((str) => new Date(str)),
  taskIds: z7.array(z7.string().uuid()).optional()
});
var DecomposeGoalSchema = z7.object({
  goalId: z7.string().uuid()
});
var GenerateTasksSchema = z7.object({
  objectiveId: z7.string().uuid(),
  weekNumber: z7.number().int().min(1).max(4).default(1)
});
var Schema = z7.object({
  date: z7.string().transform((str) => new Date(str)),
  taskIds: z7.array(z7.string().uuid()).optional()
});
var ProcessNLSchema = z7.object({
  text: z7.string().min(1),
  context: z7.record(z7.any()).optional()
});
var SwitchProviderSchema = z7.object({
  provider: z7.enum(["openai", "gemini"])
});
var CreateRoadmapSchema = z7.object({
  prompt: z7.string().min(10).max(1e3),
  autoExecute: z7.boolean().default(false)
});
router7.get("/provider/status", requireAuth, async (req, res) => {
  try {
    const currentProvider = getCurrentAIProvider();
    const capabilities = aiServiceFactory.getProviderCapabilities();
    res.json({
      success: true,
      data: {
        currentProvider,
        capabilities,
        switchingEnabled: true
      },
      message: `Current AI provider: ${currentProvider}`
    });
  } catch (error) {
    console.error("Get provider status error:", error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : "Failed to get provider status"
    });
  }
});
router7.post("/provider/switch", requireAuth, validateRequest(SwitchProviderSchema), async (req, res) => {
  try {
    const { provider } = req.body;
    const previousProvider = getCurrentAIProvider();
    if (provider === previousProvider) {
      return res.json({
        success: true,
        data: { provider, changed: false },
        message: `Already using ${provider} provider`
      });
    }
    const { aiService: aiService2, ambientService } = switchAIProvider(provider);
    const capabilities = aiServiceFactory.getProviderCapabilities(provider);
    res.json({
      success: true,
      data: {
        previousProvider,
        currentProvider: provider,
        capabilities,
        changed: true
      },
      message: `Successfully switched from ${previousProvider} to ${provider}`
    });
  } catch (error) {
    console.error("Switch provider error:", error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : "Failed to switch AI provider"
    });
  }
});
router7.get("/provider/test", requireAuth, async (req, res) => {
  try {
    const testResults = await testAIProviders();
    res.json({
      success: true,
      data: testResults,
      message: "AI provider testing completed"
    });
  } catch (error) {
    console.error("Test providers error:", error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : "Failed to test AI providers"
    });
  }
});
router7.post("/decompose-goal", requireAuth, validateRequest(DecomposeGoalSchema), async (req, res) => {
  try {
    const userId = req.user.id;
    const { goalId } = req.body;
    const goal = await storage.goals.getGoalById(goalId);
    if (!goal || goal.userId !== userId) {
      return res.status(404).json({
        success: false,
        error: "Goal not found"
      });
    }
    const user = await storage.users.getUserById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: "User not found"
      });
    }
    if (goal.aiDecomposed) {
      const existingObjectives = await storage.objectives.getGoalObjectives(goalId);
      if (existingObjectives.length > 0) {
        return res.json({
          success: true,
          data: {
            message: "Goal already decomposed",
            objectives: existingObjectives,
            provider: getCurrentAIProvider()
          }
        });
      }
    }
    const aiService2 = getAIService();
    const decompositionResult = await aiServiceFactory.executeWithFallback(
      async (service) => await service.decomposeGoal(goal, user)
    );
    const createdObjectives = [];
    for (const objData of decompositionResult.monthlyObjectives) {
      const keyResultsWithIds = objData.keyResults.map((kr) => ({
        ...kr,
        id: uuidv42(),
        currentValue: 0,
        completed: false
      }));
      const objective = await storage.objectives.createObjective({
        goalId,
        userId,
        title: objData.title,
        description: objData.description,
        targetMonth: objData.targetMonth,
        targetYear: goal.targetYear,
        keyResults: keyResultsWithIds
      });
      createdObjectives.push(objective);
    }
    await storage.goals.markGoalAsDecomposed(goalId);
    await storage.insights.createInsight({
      userId,
      insightType: "goal_progress_pattern",
      data: {
        goalId,
        decompositionStrategy: decompositionResult.reasoning,
        objectiveCount: createdObjectives.length,
        aiConfidence: decompositionResult.confidence,
        aiProvider: getCurrentAIProvider(),
        generatedAt: (/* @__PURE__ */ new Date()).toISOString()
      },
      confidence: decompositionResult.confidence.toString()
    });
    res.json({
      success: true,
      data: {
        objectives: createdObjectives,
        reasoning: decompositionResult.reasoning,
        confidence: decompositionResult.confidence,
        provider: getCurrentAIProvider()
      },
      message: `Goal successfully decomposed into monthly objectives using ${getCurrentAIProvider()}`
    });
  } catch (error) {
    console.error("Goal decomposition error:", error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : "Failed to decompose goal"
    });
  }
});
router7.post("/generate-tasks", requireAuth, validateRequest(GenerateTasksSchema), async (req, res) => {
  try {
    const userId = req.user.id;
    const { objectiveId, weekNumber } = req.body;
    const objective = await storage.objectives.getObjectiveById(objectiveId);
    if (!objective || objective.userId !== userId) {
      return res.status(404).json({
        success: false,
        error: "Objective not found"
      });
    }
    const goal = await storage.goals.getGoalById(objective.goalId);
    const user = await storage.users.getUserById(userId);
    if (!goal || !user) {
      return res.status(404).json({
        success: false,
        error: "Required data not found"
      });
    }
    const taskResult = await aiServiceFactory.executeWithFallback(
      async (service) => await service.generateTasksFromObjective(objective, goal, user, weekNumber)
    );
    const createdTasks = [];
    for (const taskData of taskResult.tasks) {
      const task = await storage.tasks.createTask({
        objectiveId,
        goalId: objective.goalId,
        userId,
        title: taskData.title,
        description: taskData.description,
        scheduledDate: taskData.suggestedDate ? new Date(taskData.suggestedDate) : /* @__PURE__ */ new Date(),
        scheduledTime: taskData.suggestedTime,
        estimatedDuration: taskData.estimatedDuration,
        priority: taskData.priority,
        tags: taskData.tags
      });
      createdTasks.push(task);
    }
    await storage.insights.createInsight({
      userId,
      insightType: "scheduling_preference",
      data: {
        objectiveId,
        weekNumber,
        generatedTaskCount: createdTasks.length,
        reasoning: taskResult.reasoning,
        aiConfidence: taskResult.confidence,
        aiProvider: getCurrentAIProvider(),
        generatedAt: (/* @__PURE__ */ new Date()).toISOString()
      },
      confidence: taskResult.confidence.toString()
    });
    res.json({
      success: true,
      data: {
        tasks: createdTasks,
        reasoning: taskResult.reasoning,
        confidence: taskResult.confidence,
        provider: getCurrentAIProvider()
      },
      message: `Generated ${createdTasks.length} tasks for week ${weekNumber} using ${getCurrentAIProvider()}`
    });
  } catch (error) {
    console.error("Task generation error:", error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : "Failed to generate tasks"
    });
  }
});
router7.post("/optimize-schedule", requireAuth, validateRequest(OptimizeScheduleSchema), async (req, res) => {
  try {
    const userId = req.user.id;
    const { date, taskIds } = req.body;
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);
    let tasks = await storage.tasks.getUserTasks(userId, startOfDay, endOfDay);
    if (taskIds && taskIds.length > 0) {
      tasks = tasks.filter((task) => taskIds.includes(task.id));
    }
    if (tasks.length === 0) {
      return res.json({
        success: true,
        data: {
          optimizedSchedule: [],
          insights: ["No tasks found for the specified date"],
          productivityScore: 0
        },
        message: "No tasks to optimize"
      });
    }
    const optimizationResult = await geminiAIService.optimizeSchedule(userId, date, tasks);
    const updatedTasks = [];
    if (optimizationResult?.optimizedSchedule) {
      for (const suggestion of optimizationResult.optimizedSchedule) {
        const task = tasks.find((t) => t.id === suggestion.taskId);
        if (task) {
          const updatedTask = await storage.tasks.updateTask(task.id, {
            scheduledTime: suggestion.suggestedTime
          });
          updatedTasks.push({
            task: updatedTask,
            reason: suggestion.reason
          });
        }
      }
      await storage.insights.createInsight({
        userId,
        insightType: "optimal_work_hours",
        data: {
          date: date.toISOString(),
          optimizedTaskCount: updatedTasks.length,
          insights: optimizationResult.insights,
          productivityScore: optimizationResult.productivityScore
        },
        confidence: 0.8.toString()
      });
      res.json({
        success: true,
        data: {
          optimizedSchedule: updatedTasks,
          insights: optimizationResult.insights,
          productivityScore: optimizationResult.productivityScore
        },
        message: `Optimized schedule for ${updatedTasks.length} tasks`
      });
    }
  } catch (error) {
    console.error("Schedule optimization error:", error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : "Failed to optimize schedule"
    });
  }
});
router7.post("/process-nl", requireAuth, validateRequest(ProcessNLSchema), async (req, res) => {
  try {
    const userId = req.user.id;
    const { text: text2, context } = req.body;
    const user = await storage.users.getUserById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: "User not found"
      });
    }
    const nlResult = await geminiAIService.processNaturalLanguage(text2, user, context);
    const command = await storage.commands.createCommand({
      userId,
      originalText: text2,
      parsedIntent: nlResult.intent,
      extractedEntities: nlResult.entities,
      confidence: nlResult.confidence.toString()
    });
    let executionResult = null;
    if (nlResult.confidence > 0.7) {
      executionResult = await executeAICommand(userId, nlResult);
      if (executionResult.success) {
        await storage.commands.markCommandAsExecuted(command.id);
      }
    }
    res.json({
      success: true,
      data: {
        command,
        parsed: nlResult,
        execution: executionResult,
        response: nlResult.response
      },
      message: "Natural language command processed"
    });
  } catch (error) {
    console.error("NL processing error:", error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : "Failed to process natural language"
    });
  }
});
router7.get("/productivity-insights", requireAuth, async (req, res) => {
  try {
    const userId = req.user.id;
    const insights = await geminiAIService.generateProductivityInsights(userId);
    for (const insight of insights.insights) {
      await storage.insights.createInsight({
        userId,
        insightType: insight.type,
        data: {
          title: insight.title,
          description: insight.description,
          actionable_tips: insight.actionable_tips,
          overall_score: insights
        },
        confidence: insight.confidence.toString()
      });
    }
    res.json({
      success: true,
      data: insights,
      message: "Productivity insights generated"
    });
  } catch (error) {
    console.error("Productivity insights error:", error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : "Failed to generate productivity insights"
    });
  }
});
router7.post("/create-roadmap", requireAuth, validateRequest(CreateRoadmapSchema), async (req, res) => {
  try {
    const userId = req.user.id;
    const { prompt, autoExecute } = req.body;
    const user = await storage.users.getUserById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: "User not found"
      });
    }
    const roadmapResult = await aiServiceFactory.executeWithFallback(
      async (service) => await service.createRoadmap(prompt, user)
    );
    let executionResult = null;
    if (autoExecute) {
      executionResult = await executeRoadmapCreation(userId, roadmapResult);
    }
    await storage.insights.createInsight({
      userId,
      insightType: "goal_progress_pattern",
      data: {
        roadmapPrompt: prompt,
        generatedGoal: roadmapResult.goal.title,
        objectiveCount: roadmapResult.objectives.length,
        taskCount: roadmapResult.tasks.length,
        aiConfidence: roadmapResult.confidence,
        aiProvider: getCurrentAIProvider(),
        autoExecuted: autoExecute,
        generatedAt: (/* @__PURE__ */ new Date()).toISOString()
      },
      confidence: roadmapResult.confidence.toString()
    });
    res.json({
      success: true,
      data: {
        roadmap: roadmapResult,
        execution: executionResult,
        provider: getCurrentAIProvider()
      },
      message: autoExecute ? `Roadmap created and executed successfully! Created 1 goal, ${roadmapResult.objectives.length} objectives, and ${roadmapResult.tasks.length} tasks.` : `Roadmap generated successfully using ${getCurrentAIProvider()}`
    });
  } catch (error) {
    console.error("Roadmap creation error:", error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : "Failed to create roadmap"
    });
  }
});
async function executeRoadmapCreation(userId, roadmap) {
  try {
    const results = {
      goal: null,
      objectives: [],
      tasks: [],
      errors: []
    };
    try {
      const goal = await storage.goals.createGoal({
        userId,
        title: roadmap.goal.title,
        description: roadmap.goal.description,
        category: roadmap.goal.category,
        targetYear: roadmap.goal.year,
        priority: roadmap.goal.priority,
        status: "active"
      });
      results.goal = goal;
    } catch (error) {
      results.errors.push(`Failed to create goal: ${error instanceof Error ? error.message : "Unknown error"}`);
      throw error;
    }
    for (const objData of roadmap.objectives) {
      try {
        const objective = await storage.objectives.createObjective({
          userId,
          goalId: results.goal.id,
          title: objData.title,
          description: objData.description,
          targetMonth: objData.targetMonth,
          targetYear: roadmap.goal.year,
          keyResults: objData.keyResults.map((kr) => ({
            id: `kr_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            description: kr.description,
            targetValue: kr.targetValue || 0,
            currentValue: 0,
            unit: kr.unit || "",
            completed: false
          })),
          status: "active"
        });
        results.objectives.push(objective);
      } catch (error) {
        results.errors.push(`Failed to create objective "${objData.title}": ${error instanceof Error ? error.message : "Unknown error"}`);
      }
    }
    for (const taskData of roadmap.tasks) {
      try {
        const correspondingObjective = results.objectives.find((obj) => {
          return obj.targetMonth === taskData.objectiveMonth;
        });
        const task = await storage.tasks.createTask({
          userId,
          objectiveId: correspondingObjective?.id || null,
          goalId: results.goal.id,
          title: taskData.title,
          description: taskData.description || "",
          scheduledDate: new Date(taskData.scheduledDate),
          scheduledTime: taskData.scheduledTime || null,
          estimatedDuration: taskData.estimatedDuration,
          priority: taskData.priority,
          status: "pending",
          tags: taskData.tags || []
        });
        results.tasks.push(task);
      } catch (error) {
        results.errors.push(`Failed to create task "${taskData.title}": ${error instanceof Error ? error.message : "Unknown error"}`);
      }
    }
    return {
      success: true,
      message: `Roadmap executed successfully! Created 1 goal, ${results.objectives.length} objectives, and ${results.tasks.length} tasks.`,
      data: results
    };
  } catch (error) {
    console.error("Roadmap execution error:", error);
    return {
      success: false,
      message: "Failed to execute roadmap",
      error: error instanceof Error ? error.message : "Unknown error"
    };
  }
}
async function executeAICreateRoadmap(userId, entities) {
  try {
    const { prompt, description, autoExecute } = entities;
    if (!prompt && !description) {
      return {
        success: false,
        message: "Please provide a description or prompt for the roadmap you want to create"
      };
    }
    const user = await storage.users.getUserById(userId);
    if (!user) {
      return {
        success: false,
        message: "User not found"
      };
    }
    const roadmapPrompt = prompt || description || "";
    const roadmapResult = await aiServiceFactory.executeWithFallback(
      async (service) => await service.createRoadmap(roadmapPrompt, user)
    );
    const shouldAutoExecute = autoExecute || roadmapResult.confidence > 0.8;
    let executionResult = null;
    if (shouldAutoExecute) {
      executionResult = await executeRoadmapCreation(userId, roadmapResult);
    }
    await storage.insights.createInsight({
      userId,
      insightType: "goal_progress_pattern",
      data: {
        roadmapPrompt,
        generatedGoal: roadmapResult.goal.title,
        objectiveCount: roadmapResult.objectives.length,
        taskCount: roadmapResult.tasks.length,
        aiConfidence: roadmapResult.confidence,
        aiProvider: getCurrentAIProvider(),
        autoExecuted: shouldAutoExecute,
        executedViaCommand: true,
        generatedAt: (/* @__PURE__ */ new Date()).toISOString()
      },
      confidence: roadmapResult.confidence.toString()
    });
    let message = "";
    if (shouldAutoExecute && executionResult?.success) {
      message = `Roadmap created and executed successfully! Generated "${roadmapResult.goal.title}" with ${roadmapResult.objectives.length} objectives and ${roadmapResult.tasks.length} tasks using ${getCurrentAIProvider()}.`;
    } else if (shouldAutoExecute && executionResult && !executionResult.success) {
      message = `Roadmap generated successfully but execution failed: ${executionResult.message}`;
    } else {
      message = `Roadmap "${roadmapResult.goal.title}" generated successfully using ${getCurrentAIProvider()}. Would you like me to create it in your account?`;
    }
    return {
      success: true,
      message,
      data: {
        roadmap: roadmapResult,
        execution: executionResult,
        provider: getCurrentAIProvider(),
        autoExecuted: shouldAutoExecute
      }
    };
  } catch (error) {
    console.error("Create roadmap command error:", error);
    return {
      success: false,
      message: "Failed to create roadmap",
      error: error instanceof Error ? error.message : "Unknown error"
    };
  }
}
async function executeAICommand(userId, nlResult) {
  try {
    switch (nlResult.intent) {
      case "add_task":
        return await executeAIAddTask(userId, nlResult.entities);
      case "create_goal":
        return await executeAICreateGoal(userId, nlResult.entities);
      case "create_objective":
        return await executeAICreateObjective(userId, nlResult.entities);
      case "create_roadmap":
        return await executeAICreateRoadmap(userId, nlResult.entities);
      case "modify_task":
        return await executeAIModifyTask(userId, nlResult.entities);
      case "delete_task":
        return await executeAIDeleteTask(userId, nlResult.entities);
      case "schedule_task":
        return await executeAIScheduleTask(userId, nlResult.entities);
      case "ask_question":
        return await executeAIQuestion(userId, nlResult.entities);
      default:
        return {
          success: false,
          message: "Unknown command intent"
        };
    }
  } catch (error) {
    return {
      success: false,
      message: "Failed to execute command",
      error: error instanceof Error ? error.message : "Failed to execute command"
    };
  }
}
async function executeAICreateGoal(userId, entities) {
  try {
    const { title, description, category, year, priority } = entities;
    if (!title) {
      return { success: false, message: "Goal title is required" };
    }
    const goal = await storage.goals.createGoal({
      userId,
      title,
      description: description || "",
      category: category || "personal",
      targetYear: year || (/* @__PURE__ */ new Date()).getFullYear(),
      priority: priority || "medium",
      status: "active"
    });
    return {
      success: true,
      message: `Goal "${title}" created successfully`,
      data: { goal }
    };
  } catch (error) {
    console.error("Create goal error:", error);
    return {
      success: false,
      message: "Failed to create goal"
    };
  }
}
async function executeAICreateObjective(userId, entities) {
  try {
    const { title, description, goal, month, year } = entities;
    if (!title) {
      return { success: false, message: "Objective title is required" };
    }
    let goalId = null;
    if (goal) {
      const goals2 = await storage.goals.getUserGoals(userId);
      const matchedGoal = goals2.find(
        (g) => g.title.toLowerCase().includes(goal.toLowerCase())
      );
      if (matchedGoal) {
        goalId = matchedGoal.id;
      }
    }
    if (!goalId) {
      return {
        success: false,
        message: "Please specify which goal this objective belongs to, or create a goal first"
      };
    }
    const objective = await storage.objectives.createObjective({
      userId,
      goalId,
      title,
      description: description || "",
      targetMonth: month || (/* @__PURE__ */ new Date()).getMonth() + 1,
      targetYear: year || (/* @__PURE__ */ new Date()).getFullYear(),
      keyResults: [],
      status: "active"
    });
    return {
      success: true,
      message: `Objective "${title}" created successfully under your goal`,
      data: { objective }
    };
  } catch (error) {
    console.error("Create objective error:", error);
    return {
      success: false,
      message: "Failed to create objective"
    };
  }
}
async function executeAIAddTask(userId, entities) {
  try {
    const { title, description, date, time, duration, priority, objective, goal } = entities;
    if (!title) {
      return { success: false, message: "Task title is required" };
    }
    let scheduledDate = /* @__PURE__ */ new Date();
    if (date) {
      const parsedDate = parseDate(date);
      if (parsedDate) {
        scheduledDate = parsedDate;
      }
    }
    let objectiveId = null;
    let goalId = null;
    if (objective) {
      const objectives = await storage.objectives.getUserObjectives(userId);
      const matchedObjective = objectives.find(
        (obj) => obj.title.toLowerCase().includes(objective.toLowerCase())
      );
      if (matchedObjective) {
        objectiveId = matchedObjective.id;
        goalId = matchedObjective.goalId;
      }
    }
    if (!objectiveId && goal) {
      const goals2 = await storage.goals.getUserGoals(userId);
      const matchedGoal = goals2.find(
        (g) => g.title.toLowerCase().includes(goal.toLowerCase())
      );
      if (matchedGoal) {
        goalId = matchedGoal.id;
      }
    }
    const task = await storage.tasks.createTask({
      userId,
      objectiveId,
      goalId,
      title,
      description: description || "",
      scheduledDate,
      scheduledTime: time || null,
      estimatedDuration: duration || 30,
      priority: priority || "medium",
      status: "pending",
      tags: []
    });
    let linkMessage = "";
    if (objectiveId) {
      linkMessage = " under your specified objective";
    } else if (goalId) {
      linkMessage = " under your specified goal";
    }
    return {
      success: true,
      message: `Task "${title}" created successfully${linkMessage}`,
      data: { task }
    };
  } catch (error) {
    console.error("Add task error:", error);
    return {
      success: false,
      message: "Failed to create task"
    };
  }
}
async function executeAIModifyTask(userId, entities) {
  try {
    console.log("\u{1F50D} ModifyTask entities received:", JSON.stringify(entities, null, 2));
    const { taskIdentifier, field, newValue, title, originalText, date, time, priority, status, duration, description } = entities;
    let task = null;
    let searchTerm = taskIdentifier || title || "";
    if (!searchTerm && originalText) {
      searchTerm = extractTaskFromText(originalText);
    }
    if (!searchTerm) {
      return {
        success: false,
        message: 'Please specify which task to modify. For example: "Change task meeting priority to high" or "Update workout to tomorrow"'
      };
    }
    task = await findTaskByTitle(userId, searchTerm);
    if (!task) {
      const userTasks = await storage.tasks.getUserTasks(userId, /* @__PURE__ */ new Date(0), /* @__PURE__ */ new Date());
      const taskTitles = userTasks.slice(0, 5).map((t) => `"${t.title}"`).join(", ");
      return {
        success: false,
        message: `\u274C I couldn't find a task matching "${searchTerm}". ${userTasks.length > 0 ? `Available tasks: ${taskTitles}${userTasks.length > 5 ? "..." : ""}` : "You have no tasks yet."}`
      };
    }
    let detectedField = field;
    let detectedValue = newValue;
    if (!detectedField || !detectedValue) {
      if (date) {
        detectedField = "scheduledDate";
        detectedValue = date;
        console.log("\u2705 Found date from entities:", date);
      } else if (time) {
        detectedField = "scheduledTime";
        detectedValue = time;
        console.log("\u2705 Found time from entities:", time);
      } else if (priority) {
        detectedField = "priority";
        detectedValue = priority;
        console.log("\u2705 Found priority from entities:", priority);
      } else if (status) {
        detectedField = "status";
        detectedValue = status;
        console.log("\u2705 Found status from entities:", status);
      } else if (duration) {
        detectedField = "estimatedDuration";
        detectedValue = duration;
        console.log("\u2705 Found duration from entities:", duration);
      } else if (description) {
        detectedField = "description";
        detectedValue = description;
        console.log("\u2705 Found description from entities:", description);
      }
    }
    if ((!detectedField || !detectedValue) && originalText) {
      const extracted = extractFieldAndValueFromText(originalText, task.title);
      if (extracted.field && extracted.value) {
        detectedField = extracted.field;
        detectedValue = extracted.value;
        console.log("\u2705 Extracted from text:", extracted);
      }
    }
    if (!detectedField || !detectedValue) {
      const inferredResult = inferFieldAndValue(entities, originalText);
      if (inferredResult.field && inferredResult.value) {
        detectedField = inferredResult.field;
        detectedValue = inferredResult.value;
        console.log("\u2705 Inferred field/value:", inferredResult);
      }
    }
    if (!detectedField || !detectedValue) {
      return {
        success: false,
        message: `\u274C Please specify what to change about "${task.title}". Examples:
\u2022 "Change priority to high"
\u2022 "Move to tomorrow"
\u2022 "Set duration to 60 minutes"
\u2022 "Mark as completed"`
      };
    }
    const normalizedField = normalizeField(detectedField);
    const normalizedValue = await normalizeValue(normalizedField, detectedValue);
    if (!normalizedField) {
      return {
        success: false,
        message: `\u274C Cannot modify "${detectedField}". Supported fields: title, description, priority, date, time, duration, status, location`
      };
    }
    const validation = validateFieldValue(normalizedField, normalizedValue);
    if (!validation.valid) {
      return {
        success: false,
        message: validation.message
      };
    }
    const updateData = {};
    updateData[normalizedField] = normalizedValue;
    console.log(`\u{1F527} Updating task "${task.title}" - ${normalizedField}: ${normalizedValue}`);
    const updatedTask = await storage.tasks.updateTask(task.id, updateData);
    return {
      success: true,
      message: `\u2705 Successfully updated "${task.title}" - ${getFieldDisplayName(normalizedField)} changed to "${getValueDisplayText(normalizedField, normalizedValue)}"`,
      data: { task: updatedTask }
    };
  } catch (error) {
    console.error("\u274C Modify task error:", error);
    return {
      success: false,
      message: "Failed to modify task: " + (error instanceof Error ? error.message : "Unknown error")
    };
  }
}
function inferFieldAndValue(entities, originalText = "") {
  console.log("\u{1F50D} Inferring field/value from entities:", entities);
  const entityChecks = [
    { condition: entities.date, field: "scheduledDate", value: entities.date },
    { condition: entities.time, field: "scheduledTime", value: entities.time },
    { condition: entities.priority, field: "priority", value: entities.priority },
    { condition: entities.status, field: "status", value: entities.status },
    { condition: entities.duration, field: "estimatedDuration", value: entities.duration },
    { condition: entities.description, field: "description", value: entities.description },
    { condition: entities.location, field: "location", value: entities.location }
  ];
  for (const check of entityChecks) {
    if (check.condition) {
      console.log(`\u2705 Inferred: ${check.field} = ${check.value}`);
      return { field: check.field, value: check.value };
    }
  }
  if (originalText) {
    const text2 = originalText.toLowerCase();
    const patterns = [
      { regex: /move.*?to\s+(.*?)(?:\s|$)/, field: "scheduledDate" },
      { regex: /reschedule.*?(?:to|for)\s+(.*?)(?:\s|$)/, field: "scheduledDate" },
      { regex: /set.*?time.*?(?:to|at)\s+(.*?)(?:\s|$)/, field: "scheduledTime" },
      { regex: /change.*?time.*?(?:to|at)\s+(.*?)(?:\s|$)/, field: "scheduledTime" },
      { regex: /make.*?(high|medium|low|critical)/, field: "priority" },
      { regex: /set.*?priority.*?(?:to|as)\s+(high|medium|low|critical)/, field: "priority" },
      { regex: /mark.*?(?:as|to)\s+(completed|pending|in_progress|cancelled)/, field: "status" },
      { regex: /set.*?duration.*?(?:to|for)\s+(\d+)/, field: "estimatedDuration" }
    ];
    for (const pattern of patterns) {
      const match = text2.match(pattern.regex);
      if (match && match[1]) {
        console.log(`\u2705 Pattern matched: ${pattern.field} = ${match[1]}`);
        return { field: pattern.field, value: match[1].trim() };
      }
    }
    if (/(today|tomorrow|monday|tuesday|wednesday|thursday|friday|saturday|sunday|next\s+\w+)/.test(text2)) {
      const dateMatch = text2.match(/(today|tomorrow|monday|tuesday|wednesday|thursday|friday|saturday|sunday|next\s+\w+)/);
      if (dateMatch) {
        console.log(`\u2705 Date pattern inferred: scheduledDate = ${dateMatch[0]}`);
        return { field: "scheduledDate", value: dateMatch[0] };
      }
    }
  }
  console.log("\u274C Could not infer field/value");
  return { field: "", value: "" };
}
function extractFieldAndValueFromText(text2, taskTitle) {
  const lowerText = text2.toLowerCase();
  const cleanText = lowerText.replace(taskTitle.toLowerCase(), "").trim();
  console.log("\u{1F50D} Extracting field and value from:", cleanText);
  if (cleanText.includes("date") || cleanText.includes("reschedule") || cleanText.includes("move") || cleanText.includes("schedule") || /(today|tomorrow|monday|tuesday|wednesday|thursday|friday|saturday|sunday|next\s+\w+)/.test(cleanText)) {
    const datePatterns = [
      // Explicit patterns
      /(?:to|for|on)\s+(today|tomorrow|yesterday|monday|tuesday|wednesday|thursday|friday|saturday|sunday)/,
      /(?:to|for|on)\s+(next\s+\w+)/,
      /(?:to|for|on)\s+(\d{1,2}\/\d{1,2}\/?\d{0,4})/,
      /(?:to|for|on)\s+(\d{4}-\d{2}-\d{2})/,
      /(?:to|for|on)\s+(\w+\s+\d{1,2})/,
      // ✅ NEW: More flexible patterns that should catch your case
      /(today|tomorrow|yesterday|monday|tuesday|wednesday|thursday|friday|saturday|sunday)(?!\s+(?:at|time|priority))/,
      /(next\s+\w+)(?!\s+(?:at|time|priority))/,
      // Move/reschedule patterns
      /(?:move|reschedule|schedule).*?(today|tomorrow|monday|tuesday|wednesday|thursday|friday|saturday|sunday)/,
      /(?:move|reschedule|schedule).*?(next\s+\w+)/
    ];
    for (const pattern of datePatterns) {
      const match = cleanText.match(pattern);
      if (match) {
        console.log("\u2705 Found date:", match[1] || match[0]);
        return { field: "scheduledDate", value: match[1] || match[0] };
      }
    }
  }
  if (cleanText.includes("priority") || /\b(high|medium|low|critical)\s+priority\b/.test(cleanText)) {
    const priorityMatch = cleanText.match(/\b(high|medium|low|critical)\b/);
    if (priorityMatch) {
      console.log("\u2705 Found priority:", priorityMatch[1]);
      return { field: "priority", value: priorityMatch[1] };
    }
  }
  if (cleanText.includes("status") || cleanText.includes("mark") || cleanText.includes("complete")) {
    const statusPatterns = [
      /\b(completed|pending|in_progress|cancelled|done|finished)\b/,
      /mark.*?as\s+(completed|pending|in_progress|cancelled|done|finished)/,
      /set.*?to\s+(completed|pending|in_progress|cancelled|done|finished)/
    ];
    for (const pattern of statusPatterns) {
      const match = cleanText.match(pattern);
      if (match) {
        let status = match[1];
        if (status === "done" || status === "finished") status = "completed";
        console.log("\u2705 Found status:", status);
        return { field: "status", value: status };
      }
    }
  }
  if (cleanText.includes("time") && !cleanText.includes("duration")) {
    const timePatterns = [
      /(?:to|at|for)\s+(\d{1,2}:?\d{0,2}\s*(?:am|pm)?)/,
      /(?:to|at|for)\s+(\d{1,2}\s*(?:am|pm))/,
      /(\d{1,2}:?\d{0,2}\s*(?:am|pm))/,
      /(\d{1,2}\s*(?:am|pm))/
    ];
    for (const pattern of timePatterns) {
      const match = cleanText.match(pattern);
      if (match) {
        console.log("\u2705 Found time:", match[1]);
        return { field: "scheduledTime", value: match[1] };
      }
    }
  }
  if (cleanText.includes("duration") || cleanText.includes("minutes") || cleanText.includes("hours")) {
    const durationPatterns = [
      /(\d+)\s*(?:minutes?|mins?)/,
      /(\d+)\s*(?:hours?|hrs?)/,
      /duration.*?(\d+)/,
      /(?:to|for)\s+(\d+)\s*(?:minutes?|mins?|hours?|hrs?)/
    ];
    for (const pattern of durationPatterns) {
      const match = cleanText.match(pattern);
      if (match) {
        let duration = parseInt(match[1]);
        if (cleanText.includes("hour")) duration *= 60;
        console.log("\u2705 Found duration:", duration);
        return { field: "estimatedDuration", value: duration.toString() };
      }
    }
  }
  if (cleanText.includes("title") || cleanText.includes("name") || cleanText.includes("rename")) {
    const titlePatterns = [
      /(?:title|name|rename)(?:\s+to|\s+as)?\s+["']?([^"']+?)["']?$/,
      /(?:to|as)\s+["']?([^"']+?)["']?$/
    ];
    for (const pattern of titlePatterns) {
      const match = cleanText.match(pattern);
      if (match) {
        console.log("\u2705 Found title:", match[1].trim());
        return { field: "title", value: match[1].trim() };
      }
    }
  }
  if (cleanText.includes("location") || cleanText.includes("where") || cleanText.includes("place")) {
    const locationMatch = cleanText.match(/(?:location|where|place)(?:\s+to|\s+at)?\s+["']?([^"']+?)["']?$/);
    if (locationMatch) {
      console.log("\u2705 Found location:", locationMatch[1].trim());
      return { field: "location", value: locationMatch[1].trim() };
    }
  }
  console.log("\u274C No field/value extracted from:", cleanText);
  return { field: "", value: "" };
}
function extractTaskFromText(text2) {
  const patterns = [
    // "change task 'meeting' to..."
    /(?:change|modify|update|edit|set|mark)\s+(?:task\s+)?["']([^"']+)["']/i,
    // "change meeting to..."
    /(?:change|modify|update|edit|set)\s+([^"'\s]+(?:\s+[^"'\s]+)*?)\s+(?:to|priority|date|time|status|duration|location)/i,
    // "mark 'project work' as..."
    /(?:mark|set)\s+["']([^"']+)["']\s+(?:as|to)/i,
    // "mark project work as..."
    /(?:mark|set)\s+([^"'\s]+(?:\s+[^"'\s]+)*?)\s+(?:as|to)/i,
    // "move 'dentist appointment' to..."
    /(?:move|reschedule)\s+["']([^"']+)["']\s+(?:to|for)/i,
    // "move dentist appointment to..."
    /(?:move|reschedule)\s+([^"'\s]+(?:\s+[^"'\s]+)*?)\s+(?:to|for)/i,
    // Extract any quoted text
    /["']([^"']+)["']/i
  ];
  for (const pattern of patterns) {
    const match = text2.match(pattern);
    if (match && match[1] && match[1].length > 2) {
      return match[1].trim();
    }
  }
  const actionWords = ["change", "modify", "update", "edit", "set", "mark", "move", "reschedule"];
  const fieldWords = ["priority", "date", "time", "status", "title", "duration", "location", "to", "as", "for"];
  const words = text2.toLowerCase().split(/\s+/);
  let startIndex = -1;
  let endIndex = -1;
  for (let i = 0; i < words.length; i++) {
    if (actionWords.some((action) => words[i].includes(action))) {
      startIndex = i + 1;
      if (words[i + 1] === "task") startIndex = i + 2;
      break;
    }
  }
  if (startIndex !== -1) {
    for (let i = startIndex; i < words.length; i++) {
      if (fieldWords.some((field) => words[i].includes(field))) {
        endIndex = i;
        break;
      }
    }
  }
  if (startIndex !== -1 && endIndex !== -1 && endIndex > startIndex) {
    return words.slice(startIndex, endIndex).join(" ");
  }
  return "";
}
async function findTaskByTitle(userId, titleQuery) {
  try {
    const userTasks = await storage.tasks.getUserTasks(userId, /* @__PURE__ */ new Date(0), /* @__PURE__ */ new Date());
    if (userTasks.length === 0) return null;
    const query = titleQuery.toLowerCase().trim();
    let task = userTasks.find((t) => t.title.toLowerCase() === query);
    if (task) return task;
    task = userTasks.find((t) => t.title.toLowerCase().startsWith(query));
    if (task) return task;
    task = userTasks.find((t) => t.title.toLowerCase().includes(query));
    if (task) return task;
    const queryWords = query.split(/\s+/);
    task = userTasks.find((t) => {
      const titleWords = t.title.toLowerCase().split(/\s+/);
      return queryWords.every(
        (word) => titleWords.some((titleWord) => titleWord.includes(word) || word.includes(titleWord))
      );
    });
    if (task) return task;
    const bestMatch = userTasks.reduce((best, current) => {
      const similarity = calculateSimilarity(query, current.title.toLowerCase());
      return similarity > best.similarity && similarity > 0.6 ? { task: current, similarity } : best;
    }, { task: null, similarity: 0 });
    return bestMatch.task;
  } catch (error) {
    console.error("Error finding task by title:", error);
    return null;
  }
}
function calculateSimilarity(str1, str2) {
  const longer = str1.length > str2.length ? str1 : str2;
  const shorter = str1.length > str2.length ? str2 : str1;
  if (longer.length === 0) return 1;
  return (longer.length - editDistance(longer, shorter)) / longer.length;
}
function editDistance(str1, str2) {
  const matrix = Array(str2.length + 1).fill(null).map(() => Array(str1.length + 1).fill(null));
  for (let i = 0; i <= str1.length; i += 1) matrix[0][i] = i;
  for (let j = 0; j <= str2.length; j += 1) matrix[j][0] = j;
  for (let j = 1; j <= str2.length; j += 1) {
    for (let i = 1; i <= str1.length; i += 1) {
      const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1;
      matrix[j][i] = Math.min(
        matrix[j][i - 1] + 1,
        matrix[j - 1][i] + 1,
        matrix[j - 1][i - 1] + indicator
      );
    }
  }
  return matrix[str2.length][str1.length];
}
function normalizeField(field) {
  const fieldMap = {
    "title": "title",
    "name": "title",
    "description": "description",
    "desc": "description",
    "priority": "priority",
    "prio": "priority",
    "status": "status",
    "state": "status",
    "date": "scheduledDate",
    "scheduleddate": "scheduledDate",
    "scheduled_date": "scheduledDate",
    "time": "scheduledTime",
    "scheduledtime": "scheduledTime",
    "scheduled_time": "scheduledTime",
    "duration": "estimatedDuration",
    "estimatedduration": "estimatedDuration",
    "estimated_duration": "estimatedDuration",
    "location": "location",
    "place": "location",
    "where": "location"
  };
  const normalized = field.toLowerCase().replace(/[^a-z]/g, "");
  return fieldMap[normalized] || "";
}
async function normalizeValue(field, value) {
  switch (field) {
    case "priority":
      const priorities = ["low", "medium", "high", "critical"];
      const normalizedPriority = value.toLowerCase();
      return priorities.includes(normalizedPriority) ? normalizedPriority : "medium";
    case "status":
      const statusMap = {
        "done": "completed",
        "finished": "completed",
        "complete": "completed",
        "todo": "pending",
        "in progress": "in_progress",
        "working": "in_progress",
        "active": "in_progress",
        "cancelled": "cancelled",
        "canceled": "cancelled",
        "rescheduled": "rescheduled"
      };
      return statusMap[value.toLowerCase()] || value.toLowerCase();
    case "scheduledDate":
      return formatDateString(value);
    case "scheduledTime":
      return formatTimeString(value);
    case "estimatedDuration":
      const duration = parseInt(value);
      return isNaN(duration) ? "30" : duration.toString();
    default:
      return value;
  }
}
function validateFieldValue(field, value) {
  switch (field) {
    case "priority":
      const validPriorities = ["low", "medium", "high", "critical"];
      if (!validPriorities.includes(value)) {
        return {
          valid: false,
          message: `\u274C Priority must be one of: ${validPriorities.join(", ")}`
        };
      }
      break;
    case "status":
      const validStatuses = ["pending", "in_progress", "completed", "cancelled", "rescheduled"];
      if (!validStatuses.includes(value)) {
        return {
          valid: false,
          message: `\u274C Status must be one of: ${validStatuses.join(", ")}`
        };
      }
      break;
    case "estimatedDuration":
      const duration = parseInt(value);
      if (isNaN(duration) || duration <= 0) {
        return {
          valid: false,
          message: "\u274C Duration must be a positive number (in minutes)"
        };
      }
      break;
    case "title":
      if (value.length < 1 || value.length > 200) {
        return {
          valid: false,
          message: "\u274C Title must be between 1 and 200 characters"
        };
      }
      break;
  }
  return { valid: true, message: "" };
}
function formatDateString(dateStr) {
  const today = /* @__PURE__ */ new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  switch (dateStr.toLowerCase().trim()) {
    case "today":
      return today.toISOString().split("T")[0];
    case "tomorrow":
      return tomorrow.toISOString().split("T")[0];
    case "yesterday":
      return yesterday.toISOString().split("T")[0];
    default:
      const weekdays = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
      const dayIndex = weekdays.indexOf(dateStr.toLowerCase());
      if (dayIndex !== -1) {
        const targetDate = getNextWeekday(dayIndex);
        return targetDate.toISOString().split("T")[0];
      }
      const parsed = new Date(dateStr);
      return isNaN(parsed.getTime()) ? today.toISOString().split("T")[0] : parsed.toISOString().split("T")[0];
  }
}
function formatTimeString(timeStr) {
  const cleaned = timeStr.toLowerCase().replace(/\s/g, "");
  if (cleaned.includes("am") || cleaned.includes("pm")) {
    const isPM = cleaned.includes("pm");
    const timeOnly = cleaned.replace(/[ap]m/, "");
    let [hours, minutes = "00"] = timeOnly.split(":");
    let hourNum2 = parseInt(hours);
    if (isPM && hourNum2 !== 12) {
      hourNum2 += 12;
    } else if (!isPM && hourNum2 === 12) {
      hourNum2 = 0;
    }
    return `${hourNum2.toString().padStart(2, "0")}:${minutes.padStart(2, "0")}`;
  }
  if (cleaned.includes(":")) {
    const [hours, minutes] = cleaned.split(":");
    return `${hours.padStart(2, "0")}:${minutes.padStart(2, "0")}`;
  }
  const hourNum = parseInt(cleaned);
  if (!isNaN(hourNum) && hourNum >= 0 && hourNum <= 23) {
    return `${hourNum.toString().padStart(2, "0")}:00`;
  }
  return timeStr;
}
function getFieldDisplayName(field) {
  const displayNames = {
    "title": "title",
    "description": "description",
    "priority": "priority",
    "status": "status",
    "scheduledDate": "date",
    "scheduledTime": "time",
    "estimatedDuration": "duration",
    "location": "location"
  };
  return displayNames[field] || field;
}
function getValueDisplayText(field, value) {
  switch (field) {
    case "scheduledDate":
      const date = new Date(value);
      return date.toLocaleDateString();
    case "scheduledTime":
      return value;
    case "estimatedDuration":
      const minutes = parseInt(value);
      if (minutes >= 60) {
        const hours = Math.floor(minutes / 60);
        const remainingMinutes = minutes % 60;
        return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : `${hours}h`;
      }
      return `${minutes} minutes`;
    default:
      return value;
  }
}
async function executeAIDeleteTask(userId, entities) {
  try {
    const { taskIdentifier, title } = entities;
    if (!taskIdentifier && !title) {
      return {
        success: false,
        message: "Please specify which task to delete by title or identifier"
      };
    }
    let task = null;
    const userTasks = await storage.tasks.getUserTasks(userId, /* @__PURE__ */ new Date(0), /* @__PURE__ */ new Date());
    if (taskIdentifier) {
      task = userTasks.find(
        (t) => t.title.toLowerCase().includes(taskIdentifier.toLowerCase()) || t.id === taskIdentifier
      );
    } else if (title) {
      task = userTasks.find(
        (t) => t.title.toLowerCase().includes(title.toLowerCase())
      );
    }
    if (!task) {
      return {
        success: false,
        message: `Task "${taskIdentifier || title}" not found`
      };
    }
    const taskTitle = task.title;
    await storage.tasks.deleteTask(task.id);
    return {
      success: true,
      message: `Task "${taskTitle}" deleted successfully`,
      data: { deletedTaskId: task.id }
    };
  } catch (error) {
    console.error("Delete task error:", error);
    return {
      success: false,
      message: "Failed to delete task"
    };
  }
}
async function executeAIScheduleTask(userId, entities) {
  try {
    const { taskIdentifier, title, date, time } = entities;
    if (!taskIdentifier && !title) {
      return {
        success: false,
        message: "Please specify which task to schedule by title or identifier"
      };
    }
    if (!date && !time) {
      return {
        success: false,
        message: "Please specify when to schedule the task (date and/or time)"
      };
    }
    let task = null;
    const userTasks = await storage.tasks.getUserTasks(userId, /* @__PURE__ */ new Date(0), /* @__PURE__ */ new Date());
    if (taskIdentifier) {
      task = userTasks.find(
        (t) => t.title.toLowerCase().includes(taskIdentifier.toLowerCase()) || t.id === taskIdentifier
      );
    } else if (title) {
      task = userTasks.find(
        (t) => t.title.toLowerCase().includes(title.toLowerCase())
      );
    }
    if (!task) {
      return {
        success: false,
        message: `Task "${taskIdentifier || title}" not found`
      };
    }
    const updateData = {};
    if (date) {
      const parsedDate = parseDate(date);
      if (parsedDate) {
        updateData.scheduledDate = parsedDate;
      } else {
        return {
          success: false,
          message: "Invalid date format"
        };
      }
    }
    if (time) {
      updateData.scheduledTime = normalizeTime(time);
    }
    const updatedTask = await storage.tasks.updateTask(task.id, updateData);
    const dateStr = updateData.scheduledDate ? updateData.scheduledDate.toLocaleDateString() : "current date";
    const timeStr = updateData.scheduledTime || "no specific time";
    return {
      success: true,
      message: `Task "${task.title}" scheduled for ${dateStr} at ${timeStr}`,
      data: { task: updatedTask }
    };
  } catch (error) {
    console.error("Schedule task error:", error);
    return {
      success: false,
      message: "Failed to schedule task"
    };
  }
}
async function executeAIQuestion(userId, entities) {
  try {
    const { questionType, subject, timeframe } = entities;
    switch (questionType) {
      case "count":
        return await handleAICountQuestion(userId, entities);
      case "time":
        return await handleAITimeQuestion(userId, entities);
      case "next_task":
        return await handleAINextTaskQuestion(userId, entities);
      case "progress":
        return await handleAIProgressQuestion(userId, entities);
      case "schedule":
        return await handleAIScheduleQuestion(userId, entities);
      case "stats":
        return await handleAIStatsQuestion(userId, entities);
      default:
        return await handleAIGeneralQuestion(userId, entities);
    }
  } catch (error) {
    console.error("Question processing error:", error);
    return {
      success: false,
      message: "Failed to process question"
    };
  }
}
async function handleAICountQuestion(userId, entities) {
  const { subject, status, timeframe } = entities;
  try {
    let count = 0;
    let description = "";
    if (subject?.includes("task")) {
      const startDate = timeframe === "today" ? /* @__PURE__ */ new Date() : /* @__PURE__ */ new Date(0);
      const endDate = timeframe === "today" ? /* @__PURE__ */ new Date() : /* @__PURE__ */ new Date();
      const tasks = await storage.tasks.getUserTasks(userId, startDate, endDate);
      if (status) {
        const filteredTasks = tasks.filter((t) => t.status === status);
        count = filteredTasks.length;
        description = `You have ${count} ${status} tasks${timeframe ? ` for ${timeframe}` : ""}`;
      } else {
        count = tasks.length;
        description = `You have ${count} total tasks${timeframe ? ` for ${timeframe}` : ""}`;
      }
    } else if (subject?.includes("goal")) {
      const goals2 = await storage.goals.getUserGoals(userId);
      count = goals2.length;
      description = `You have ${count} goals`;
    } else if (subject?.includes("objective")) {
      const objectives = await storage.objectives.getUserObjectives(userId);
      count = objectives.length;
      description = `You have ${count} objectives`;
    }
    return {
      success: true,
      message: description,
      data: { count, subject, timeframe }
    };
  } catch (error) {
    return {
      success: false,
      message: "Failed to count items"
    };
  }
}
async function handleAITimeQuestion(userId, entities) {
  try {
    const today = /* @__PURE__ */ new Date();
    const tasks = await storage.tasks.getUserTasks(userId, today, today);
    const pendingTasks = tasks.filter((t) => t.status === "pending");
    if (pendingTasks.length === 0) {
      return {
        success: true,
        message: "You have no pending tasks for today. Great job staying on top of things!",
        data: { freeTime: true }
      };
    }
    const totalEstimatedTime = pendingTasks.reduce((sum, task) => sum + (task.estimatedDuration || 30), 0);
    const hours = Math.floor(totalEstimatedTime / 60);
    const minutes = totalEstimatedTime % 60;
    let timeString = "";
    if (hours > 0) {
      timeString = `${hours} hour${hours > 1 ? "s" : ""}`;
      if (minutes > 0) {
        timeString += ` and ${minutes} minute${minutes > 1 ? "s" : ""}`;
      }
    } else {
      timeString = `${minutes} minute${minutes > 1 ? "s" : ""}`;
    }
    return {
      success: true,
      message: `You have approximately ${timeString} of work remaining today (${pendingTasks.length} pending tasks)`,
      data: {
        totalMinutes: totalEstimatedTime,
        pendingTaskCount: pendingTasks.length,
        tasks: pendingTasks.map((t) => ({ title: t.title, duration: t.estimatedDuration }))
      }
    };
  } catch (error) {
    return {
      success: false,
      message: "Failed to calculate time information"
    };
  }
}
async function handleAINextTaskQuestion(userId, entities) {
  try {
    const today = /* @__PURE__ */ new Date();
    const tasks = await storage.tasks.getUserTasks(userId, today, void 0);
    const pendingTasks = tasks.filter((t) => t.status === "pending").sort((a, b) => {
      const dateCompare = new Date(a.scheduledDate).getTime() - new Date(b.scheduledDate).getTime();
      if (dateCompare !== 0) return dateCompare;
      if (a.scheduledTime && b.scheduledTime) {
        return a.scheduledTime.localeCompare(b.scheduledTime);
      }
      const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
      return (priorityOrder[a.priority] || 2) - (priorityOrder[b.priority] || 2);
    });
    if (pendingTasks.length === 0) {
      return {
        success: true,
        message: "You don't have any pending tasks. Time to relax or plan ahead!",
        data: { nextTask: null }
      };
    }
    const nextTask = pendingTasks[0];
    const dateStr = new Date(nextTask.scheduledDate).toLocaleDateString();
    const timeStr = nextTask.scheduledTime || "no specific time";
    const isToday = new Date(nextTask.scheduledDate).toDateString() === today.toDateString();
    let message = `Your next task is "${nextTask.title}"`;
    if (isToday) {
      message += ` today at ${timeStr}`;
    } else {
      message += ` on ${dateStr} at ${timeStr}`;
    }
    if (nextTask.estimatedDuration) {
      message += ` (estimated ${nextTask.estimatedDuration} minutes)`;
    }
    return {
      success: true,
      message,
      data: {
        nextTask: {
          id: nextTask.id,
          title: nextTask.title,
          scheduledDate: nextTask.scheduledDate,
          scheduledTime: nextTask.scheduledTime,
          priority: nextTask.priority,
          estimatedDuration: nextTask.estimatedDuration
        }
      }
    };
  } catch (error) {
    return {
      success: false,
      message: "Failed to find next task"
    };
  }
}
async function handleAIProgressQuestion(userId, entities) {
  try {
    const { subject } = entities;
    if (subject?.includes("goal")) {
      const goals2 = await storage.goals.getUserGoals(userId);
      const completedGoals = goals2.filter((g) => g.status === "completed");
      const activeGoals = goals2.filter((g) => g.status === "active");
      return {
        success: true,
        message: `You have ${completedGoals.length} completed goals and ${activeGoals.length} active goals. ${activeGoals.length > 0 ? "Keep pushing forward!" : "Time to set new goals!"}`,
        data: {
          totalGoals: goals2.length,
          completedGoals: completedGoals.length,
          activeGoals: activeGoals.length
        }
      };
    } else {
      const today = /* @__PURE__ */ new Date();
      const startOfWeek = new Date(today);
      startOfWeek.setDate(today.getDate() - today.getDay());
      const weekTasks = await storage.tasks.getUserTasks(userId, startOfWeek, today);
      const completedTasks = weekTasks.filter((t) => t.status === "completed");
      const totalTasks = weekTasks.length;
      const percentage = totalTasks > 0 ? Math.round(completedTasks.length / totalTasks * 100) : 0;
      return {
        success: true,
        message: `This week you've completed ${completedTasks.length} out of ${totalTasks} tasks (${percentage}% completion rate)`,
        data: {
          completedTasks: completedTasks.length,
          totalTasks,
          completionPercentage: percentage
        }
      };
    }
  } catch (error) {
    return {
      success: false,
      message: "Failed to get progress information"
    };
  }
}
async function handleAIScheduleQuestion(userId, entities) {
  try {
    const { timeframe } = entities;
    const today = /* @__PURE__ */ new Date();
    let startDate = today;
    let endDate = today;
    let timeframeLabel = "today";
    if (timeframe?.includes("tomorrow")) {
      startDate = new Date(today);
      startDate.setDate(today.getDate() + 1);
      endDate = startDate;
      timeframeLabel = "tomorrow";
    } else if (timeframe?.includes("week")) {
      endDate = new Date(today);
      endDate.setDate(today.getDate() + 7);
      timeframeLabel = "this week";
    }
    const tasks = await storage.tasks.getUserTasks(userId, startDate, endDate);
    const scheduledTasks = tasks.filter((t) => t.scheduledTime).sort((a, b) => {
      const dateCompare = new Date(a.scheduledDate).getTime() - new Date(b.scheduledDate).getTime();
      if (dateCompare !== 0) return dateCompare;
      return (a.scheduledTime || "").localeCompare(b.scheduledTime || "");
    });
    if (scheduledTasks.length === 0) {
      return {
        success: true,
        message: `You don't have any scheduled tasks ${timeframeLabel}`,
        data: { tasks: [] }
      };
    }
    const taskList = scheduledTasks.map((t) => {
      const date = new Date(t.scheduledDate).toLocaleDateString();
      return `${t.title} at ${t.scheduledTime} on ${date}`;
    }).join(", ");
    return {
      success: true,
      message: `Your schedule ${timeframeLabel}: ${taskList}`,
      data: {
        tasks: scheduledTasks.map((t) => ({
          title: t.title,
          scheduledDate: t.scheduledDate,
          scheduledTime: t.scheduledTime,
          priority: t.priority
        }))
      }
    };
  } catch (error) {
    return {
      success: false,
      message: "Failed to get schedule information"
    };
  }
}
async function handleAIStatsQuestion(userId, entities) {
  try {
    const allTasks = await storage.tasks.getUserTasks(userId, /* @__PURE__ */ new Date(0), /* @__PURE__ */ new Date());
    const completedTasks = allTasks.filter((t) => t.status === "completed").length;
    const pendingTasks = allTasks.filter((t) => t.status === "pending").length;
    const inProgressTasks = allTasks.filter((t) => t.status === "in_progress").length;
    const totalTasks = allTasks.length;
    const completedTasksWithDuration = allTasks.filter((t) => t.status === "completed" && t.estimatedDuration);
    const averageCompletionTime = completedTasksWithDuration.length > 0 ? Math.round(completedTasksWithDuration.reduce((sum, task) => sum + (task.estimatedDuration || 0), 0) / completedTasksWithDuration.length) : 0;
    const stats = {
      totalTasks,
      completedTasks,
      pendingTasks,
      inProgressTasks,
      averageCompletionTime
    };
    return {
      success: true,
      message: `Your productivity stats: ${completedTasks} completed tasks, ${pendingTasks} pending tasks, with an average completion time of ${averageCompletionTime || "N/A"} minutes`,
      data: stats
    };
  } catch (error) {
    return {
      success: false,
      message: "Failed to get statistics"
    };
  }
}
async function handleAIGeneralQuestion(userId, entities) {
  return {
    success: true,
    message: "I can help you with tasks, goals, schedules, and productivity questions. Try asking about your next task, how many tasks you have, or your progress this week!",
    data: {
      supportedQuestions: [
        "What's my next task?",
        "How many tasks do I have today?",
        "What's my progress this week?",
        "What's my schedule for tomorrow?",
        "How much time do I have left today?"
      ]
    }
  };
}
function normalizeTime(timeStr) {
  const cleaned = timeStr.toLowerCase().replace(/\s/g, "");
  if (cleaned.includes("am") || cleaned.includes("pm")) {
    const isPM = cleaned.includes("pm");
    const timeOnly = cleaned.replace(/[ap]m/, "");
    let [hours, minutes = "00"] = timeOnly.split(":");
    let hourNum2 = parseInt(hours);
    if (isPM && hourNum2 !== 12) {
      hourNum2 += 12;
    } else if (!isPM && hourNum2 === 12) {
      hourNum2 = 0;
    }
    return `${hourNum2.toString().padStart(2, "0")}:${minutes.padStart(2, "0")}`;
  }
  if (cleaned.includes(":")) {
    const [hours, minutes] = cleaned.split(":");
    return `${hours.padStart(2, "0")}:${minutes.padStart(2, "0")}`;
  }
  const hourNum = parseInt(cleaned);
  if (!isNaN(hourNum) && hourNum >= 0 && hourNum <= 23) {
    return `${hourNum.toString().padStart(2, "0")}:00`;
  }
  return timeStr;
}
function parseDate(dateStr) {
  const today = /* @__PURE__ */ new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);
  const lowerDate = dateStr.toLowerCase();
  if (lowerDate.includes("today")) {
    return today;
  } else if (lowerDate.includes("tomorrow")) {
    return tomorrow;
  } else if (lowerDate.includes("monday")) {
    return getNextWeekday(1);
  } else if (lowerDate.includes("tuesday")) {
    return getNextWeekday(2);
  } else if (lowerDate.includes("wednesday")) {
    return getNextWeekday(3);
  } else if (lowerDate.includes("thursday")) {
    return getNextWeekday(4);
  } else if (lowerDate.includes("friday")) {
    return getNextWeekday(5);
  } else if (lowerDate.includes("saturday")) {
    return getNextWeekday(6);
  } else if (lowerDate.includes("sunday")) {
    return getNextWeekday(0);
  }
  const parsed = new Date(dateStr);
  return isNaN(parsed.getTime()) ? null : parsed;
}
function getNextWeekday(dayOfWeek) {
  const today = /* @__PURE__ */ new Date();
  const todayDayOfWeek = today.getDay();
  const daysUntilTarget = (dayOfWeek - todayDayOfWeek + 7) % 7;
  const targetDate = new Date(today);
  targetDate.setDate(today.getDate() + (daysUntilTarget === 0 ? 7 : daysUntilTarget));
  return targetDate;
}
var ai_default = router7;

// server/routes/voice.ts
init_auth();
import { Router as Router8 } from "express";
import multer from "multer";
import { z as z8 } from "zod";

// server/services/voice-processing.ts
init_storage();
init_ai();
init_gemini_ai();
init_ai_factory();
import OpenAI2 from "openai";
import fs2 from "fs";
var openai2 = new OpenAI2({
  apiKey: process.env.OPENAI_API_KEY
});
var VoiceProcessingService = class {
  async processAudioFile(audioFile, userId, options = {}) {
    const startTime = Date.now();
    try {
      if (!audioFile) {
        throw new Error("No audio file provided");
      }
      if (audioFile.size > 25 * 1024 * 1024) {
        throw new Error("Audio file too large (max 25MB)");
      }
      const allowedTypes = ["audio/webm", "audio/wav", "audio/mp3", "audio/m4a", "audio/ogg"];
      if (!allowedTypes.includes(audioFile.mimetype)) {
        throw new Error(`Unsupported audio format: ${audioFile.mimetype}`);
      }
      const transcription = await openai2.audio.transcriptions.create({
        file: fs2.createReadStream(audioFile.path),
        model: "whisper-1",
        language: options.language || "en",
        response_format: "verbose_json"
      });
      try {
        fs2.unlinkSync(audioFile.path);
      } catch (cleanupError) {
        console.warn("Failed to cleanup temp file:", cleanupError);
      }
      if (!transcription.text || transcription.text.trim().length === 0) {
        throw new Error("No speech detected in audio");
      }
      const user = await storage.users.getUserById(userId);
      if (!user) {
        throw new Error("User not found");
      }
      let nlpResult = null;
      let executionResult = null;
      try {
        const currentProvider = getCurrentAIProvider();
        if (currentProvider === "gemini") {
          nlpResult = await geminiAIService.processNaturalLanguage(
            transcription.text,
            user,
            options.context
          );
        } else {
          nlpResult = await aiService.processNaturalLanguage(
            transcription.text,
            user,
            options.context
          );
        }
        if (options.executeCommand && nlpResult.confidence > 0.6) {
          executionResult = await this.executeVoiceCommand(userId, nlpResult);
        }
      } catch (nlpError) {
        console.error("NLP processing failed:", nlpError);
        nlpResult = {
          intent: "ask_question",
          entities: {},
          confidence: 0.3,
          response: "I heard you, but I'm not sure how to help with that. Could you try rephrasing your request?"
        };
      }
      await this.storeVoiceCommand(userId, {
        transcript: transcription.text,
        confidence: 0.8,
        language: options.language || "en",
        intent: nlpResult?.intent,
        executed: options.executeCommand,
        success: executionResult?.success || false
      });
      const processingTime = Date.now() - startTime;
      return {
        transcript: transcription.text,
        confidence: 0.8,
        language: options.language || "en",
        duration: transcription.duration || 0,
        nlpResult,
        executionResult,
        processingTime
      };
    } catch (error) {
      console.error("Voice processing error:", error);
      throw new Error(
        error instanceof Error ? error.message : "Failed to process voice command"
      );
    }
  }
  async executeVoiceCommand(userId, nlpResult) {
    try {
      switch (nlpResult.intent) {
        case "add_task":
          return await this.executeAddTask(userId, nlpResult.entities);
        case "modify_task":
          return await this.executeModifyTask(userId, nlpResult.entities);
        case "delete_task":
          return await this.executeDeleteTask(userId, nlpResult.entities);
        case "schedule_task":
          return await this.executeScheduleTask(userId, nlpResult.entities);
        case "create_goal":
          return await this.executeCreateGoal(userId, nlpResult.entities);
        case "create_objective":
          return await this.executeCreateObjective(userId, nlpResult.entities);
        case "create_roadmap":
          return await this.executeCreateRoadmap(userId, nlpResult.entities);
        default:
          return {
            success: false,
            message: `Command "${nlpResult.intent}" not supported via voice yet`
          };
      }
    } catch (error) {
      console.error("Voice command execution error:", error);
      return {
        success: false,
        message: error instanceof Error ? error.message : "Failed to execute command"
      };
    }
  }
  async executeCreateRoadmap(userId, entities) {
    try {
      const { prompt, description } = entities;
      if (!prompt && !description) {
        return {
          success: false,
          message: "Please provide a description of what you want to achieve"
        };
      }
      const roadmapPrompt = prompt || description;
      const user = await storage.users.getUserById(userId);
      if (!user) {
        return { success: false, message: "User not found" };
      }
      const { getCurrentAIProvider: getCurrentAIProvider2 } = await Promise.resolve().then(() => (init_ai_factory(), ai_factory_exports));
      const { aiService: aiService2 } = await Promise.resolve().then(() => (init_ai(), ai_exports));
      const { geminiAIService: geminiAIService2 } = await Promise.resolve().then(() => (init_gemini_ai(), gemini_ai_exports));
      let roadmapResult;
      const currentProvider = getCurrentAIProvider2();
      if (currentProvider === "gemini") {
        roadmapResult = await geminiAIService2.createRoadmap(roadmapPrompt, user);
      } else {
        roadmapResult = await aiService2.createRoadmap(roadmapPrompt, user);
      }
      return {
        success: true,
        message: `Roadmap for "${roadmapResult.goal.title}" created with ${roadmapResult.objectives.length} objectives and ${roadmapResult.tasks.length} tasks. Use the dashboard to review and activate it.`,
        data: { roadmap: roadmapResult }
      };
    } catch (error) {
      console.error("Create roadmap error:", error);
      return {
        success: false,
        message: "Failed to create roadmap"
      };
    }
  }
  async executeAddTask(userId, entities) {
    try {
      const { title, description, date, time, duration, priority, objective, goal } = entities;
      if (!title) {
        return { success: false, message: "Task title is required" };
      }
      let scheduledDate = /* @__PURE__ */ new Date();
      if (date) {
        const parsedDate = this.parseDate(date);
        if (parsedDate) {
          scheduledDate = parsedDate;
        }
      }
      let objectiveId = null;
      let goalId = null;
      if (objective) {
        const objectives = await storage.objectives.getUserObjectives(userId);
        const matchedObjective = objectives.find(
          (obj) => obj.title.toLowerCase().includes(objective.toLowerCase())
        );
        if (matchedObjective) {
          objectiveId = matchedObjective.id;
          goalId = matchedObjective.goalId;
        }
      }
      if (!objectiveId && goal) {
        const goals2 = await storage.goals.getUserGoals(userId);
        const matchedGoal = goals2.find(
          (g) => g.title.toLowerCase().includes(goal.toLowerCase())
        );
        if (matchedGoal) {
          goalId = matchedGoal.id;
        }
      }
      const task = await storage.tasks.createTask({
        userId,
        objectiveId,
        goalId,
        title,
        description: description || "",
        scheduledDate,
        scheduledTime: time || null,
        estimatedDuration: duration || 30,
        priority: priority || "medium",
        status: "pending",
        tags: []
      });
      return {
        success: true,
        message: `Task "${title}" created successfully`,
        data: { task }
      };
    } catch (error) {
      console.error("Add task error:", error);
      return {
        success: false,
        message: "Failed to create task"
      };
    }
  }
  async executeCreateGoal(userId, entities) {
    try {
      const { title, description, category, year, priority } = entities;
      if (!title) {
        return { success: false, message: "Goal title is required" };
      }
      const goal = await storage.goals.createGoal({
        userId,
        title,
        description: description || "",
        category: category || "personal",
        targetYear: year || (/* @__PURE__ */ new Date()).getFullYear(),
        priority: priority || "medium",
        status: "active"
      });
      return {
        success: true,
        message: `Goal "${title}" created successfully`,
        data: { goal }
      };
    } catch (error) {
      console.error("Create goal error:", error);
      return {
        success: false,
        message: "Failed to create goal"
      };
    }
  }
  async executeCreateObjective(userId, entities) {
    try {
      const { title, description, goal, month, year } = entities;
      if (!title) {
        return { success: false, message: "Objective title is required" };
      }
      let goalId = null;
      if (goal) {
        const goals2 = await storage.goals.getUserGoals(userId);
        const matchedGoal = goals2.find(
          (g) => g.title.toLowerCase().includes(goal.toLowerCase())
        );
        if (matchedGoal) {
          goalId = matchedGoal.id;
        }
      }
      if (!goalId) {
        return {
          success: false,
          message: "Please specify which goal this objective belongs to"
        };
      }
      const objective = await storage.objectives.createObjective({
        userId,
        goalId,
        title,
        description: description || "",
        targetMonth: month || (/* @__PURE__ */ new Date()).getMonth() + 1,
        targetYear: year || (/* @__PURE__ */ new Date()).getFullYear(),
        keyResults: [],
        status: "active"
      });
      return {
        success: true,
        message: `Objective "${title}" created successfully`,
        data: { objective }
      };
    } catch (error) {
      console.error("Create objective error:", error);
      return {
        success: false,
        message: "Failed to create objective"
      };
    }
  }
  async executeModifyTask(userId, entities) {
    return { success: false, message: "Task modification via voice not yet implemented" };
  }
  async executeDeleteTask(userId, entities) {
    return { success: false, message: "Task deletion via voice not yet implemented" };
  }
  async executeScheduleTask(userId, entities) {
    return { success: false, message: "Task scheduling via voice not yet implemented" };
  }
  parseDate(dateStr) {
    const today = /* @__PURE__ */ new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);
    const lowerDate = dateStr.toLowerCase();
    if (lowerDate.includes("today")) {
      return today;
    } else if (lowerDate.includes("tomorrow")) {
      return tomorrow;
    } else if (lowerDate.includes("monday")) {
      return this.getNextWeekday(1);
    } else if (lowerDate.includes("tuesday")) {
      return this.getNextWeekday(2);
    } else if (lowerDate.includes("wednesday")) {
      return this.getNextWeekday(3);
    } else if (lowerDate.includes("thursday")) {
      return this.getNextWeekday(4);
    } else if (lowerDate.includes("friday")) {
      return this.getNextWeekday(5);
    } else if (lowerDate.includes("saturday")) {
      return this.getNextWeekday(6);
    } else if (lowerDate.includes("sunday")) {
      return this.getNextWeekday(0);
    }
    const parsed = new Date(dateStr);
    return isNaN(parsed.getTime()) ? null : parsed;
  }
  getNextWeekday(dayOfWeek) {
    const today = /* @__PURE__ */ new Date();
    const todayDayOfWeek = today.getDay();
    const daysUntilTarget = (dayOfWeek - todayDayOfWeek + 7) % 7;
    const targetDate = new Date(today);
    targetDate.setDate(today.getDate() + (daysUntilTarget === 0 ? 7 : daysUntilTarget));
    return targetDate;
  }
  async storeVoiceCommand(userId, commandData) {
    try {
      await storage.insights.createInsight({
        userId,
        insightType: "voice_command_usage",
        data: commandData,
        confidence: commandData.confidence.toString()
      });
    } catch (error) {
      console.error("Failed to store voice command insight:", error);
    }
  }
};
var voiceProcessingService = new VoiceProcessingService();

// server/routes/voice.ts
init_storage();
var router8 = Router8();
var storage2 = multer.memoryStorage();
var upload = multer({
  storage: storage2,
  limits: {
    fileSize: 25 * 1024 * 1024,
    // 25MB limit
    files: 1
  },
  fileFilter: (req, file, cb) => {
    const allowedMimes = [
      "audio/mpeg",
      "audio/mp3",
      "audio/wav",
      "audio/webm",
      "audio/mp4",
      "audio/x-m4a",
      "audio/ogg"
    ];
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`Unsupported audio format: ${file.mimetype}`));
    }
  }
});
var ProcessVoiceSchema = z8.object({
  language: z8.string().optional(),
  executeCommand: z8.boolean().optional().default(true),
  context: z8.object({}).optional()
});
var VoiceCommandHistorySchema = z8.object({
  limit: z8.number().min(1).max(100).optional().default(20),
  offset: z8.number().min(0).optional().default(0),
  dateFrom: z8.string().optional(),
  dateTo: z8.string().optional()
});
router8.post(
  "/process-audio",
  requireAuth,
  upload.single("audio"),
  async (req, res) => {
    try {
      const userId = req.user.id;
      const { language, executeCommand: executeCommand2 = "true", context } = req.body;
      console.log("Voice processing request:", {
        userId,
        language,
        executeCommand: executeCommand2,
        hasFile: !!req.file
      });
      if (!req.file) {
        return res.status(400).json({
          success: false,
          error: "No audio file provided"
        });
      }
      const user = await storage.users.getUserById(userId);
      if (!user) {
        return res.status(404).json({
          success: false,
          error: "User not found"
        });
      }
      const result = await voiceProcessingService.processVoiceCommand(
        req.file.buffer,
        req.file.originalname || "audio.wav",
        user,
        {
          language,
          executeCommand: executeCommand2 === "true",
          context: context ? JSON.parse(context) : void 0
        }
      );
      await storage.insights.createInsight({
        userId,
        insightType: "voice_command_usage",
        data: {
          transcript: result.transcript,
          confidence: result.confidence,
          language: result.language,
          processingTime: result.processingTime,
          intent: result.nlpResult?.intent,
          executed: executeCommand2 === "true",
          success: result.executionResult?.success || false
        },
        confidence: result.confidence.toString()
      });
      res.json({
        success: true,
        data: {
          transcript: result.transcript,
          confidence: result.confidence,
          language: result.language,
          duration: result.duration,
          nlpResult: result.nlpResult,
          executionResult: result.executionResult,
          processingTime: result.processingTime
        },
        message: "Voice command processed successfully"
      });
    } catch (error) {
      console.error("Voice processing error:", error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : "Failed to process voice command"
      });
    }
  }
);
router8.post(
  "/transcribe-only",
  requireAuth,
  upload.single("audio"),
  async (req, res) => {
    try {
      const { language } = req.body;
      if (!req.file) {
        return res.status(400).json({
          success: false,
          error: "No audio file provided"
        });
      }
      const result = await voiceProcessingService.processAudioToText(
        req.file.buffer,
        req.file.originalname || "audio.wav",
        { language }
      );
      res.json({
        success: true,
        data: {
          transcript: result.transcript,
          confidence: result.confidence,
          language: result.language
        },
        message: "Audio transcribed successfully"
      });
    } catch (error) {
      console.error("Transcription error:", error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : "Failed to transcribe audio"
      });
    }
  }
);
router8.get(
  "/commands/history",
  requireAuth,
  validateRequest(VoiceCommandHistorySchema),
  async (req, res) => {
    try {
      const userId = req.user.id;
      const { limit, offset, dateFrom, dateTo } = req.query;
      const options = {
        limit: Number(limit),
        offset: Number(offset),
        dateFrom: dateFrom ? new Date(dateFrom) : void 0,
        dateTo: dateTo ? new Date(dateTo) : void 0
      };
      const commands = await voiceProcessingService.getVoiceCommandHistory(
        userId,
        options
      );
      res.json({
        success: true,
        data: {
          commands,
          pagination: {
            limit: options.limit,
            offset: options.offset,
            total: commands.length
          }
        },
        message: "Voice command history retrieved successfully"
      });
    } catch (error) {
      console.error("Voice history error:", error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : "Failed to get voice command history"
      });
    }
  }
);
router8.get("/analytics", requireAuth, async (req, res) => {
  try {
    const userId = req.user.id;
    const analytics = await voiceProcessingService.analyzeVoiceUsagePatterns(
      userId
    );
    res.json({
      success: true,
      data: analytics,
      message: "Voice usage analytics retrieved successfully"
    });
  } catch (error) {
    console.error("Voice analytics error:", error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : "Failed to get voice analytics"
    });
  }
});
router8.post(
  "/test-connection",
  requireAuth,
  async (req, res) => {
    try {
      const testResult = {
        whisperAPI: !!process.env.OPENAI_API_KEY,
        uploadDirectory: true,
        // voiceProcessingService checks this
        supportedFormats: ["mp3", "wav", "webm", "m4a", "mp4"],
        maxFileSize: "25MB",
        status: "operational"
      };
      res.json({
        success: true,
        data: testResult,
        message: "Voice processing service is operational"
      });
    } catch (error) {
      console.error("Voice test error:", error);
      res.status(500).json({
        success: false,
        error: "Voice processing service is not available"
      });
    }
  }
);
router8.post(
  "/stream/start",
  requireAuth,
  async (req, res) => {
    try {
      res.json({
        success: true,
        data: {
          streamId: `stream_${Date.now()}`,
          websocketUrl: `ws://localhost:3000/voice-stream`,
          message: "Real-time voice streaming not yet implemented"
        },
        message: "Voice streaming session prepared (placeholder)"
      });
    } catch (error) {
      console.error("Voice streaming error:", error);
      res.status(500).json({
        success: false,
        error: "Failed to start voice streaming"
      });
    }
  }
);
var voice_default = router8;

// server/routes/nl-commands.ts
init_storage();
import { Router as Router9 } from "express";
import { z as z9 } from "zod";
init_auth();
var router9 = Router9();
var ProcessCommandSchema = z9.object({
  text: z9.string().min(1)
});
router9.get("/commands", requireAuth, async (req, res) => {
  try {
    const userId = req.user.id;
    const limit = req.query.limit ? parseInt(req.query.limit) : 50;
    const commands = await storage.commands.getUserCommands(userId, limit);
    res.json({
      success: true,
      data: { commands }
    });
  } catch (error) {
    console.error("Get commands error:", error);
    res.status(500).json({
      success: false,
      error: "Internal server error"
    });
  }
});
router9.post(
  "/process",
  requireAuth,
  validateRequest(ProcessCommandSchema),
  async (req, res) => {
    try {
      const userId = req.user.id;
      const { text: text2 } = req.body;
      const parsedCommand = parseNaturalLanguageCommand(text2);
      const command = await storage.commands.createCommand({
        userId,
        originalText: text2,
        parsedIntent: parsedCommand.intent,
        extractedEntities: parsedCommand.entities,
        confidence: parsedCommand.confidence
      });
      let result = null;
      if (parsedCommand.confidence > 0.7) {
        result = await executeCommand(userId, parsedCommand);
        if (result.success) {
          await storage.commands.markCommandAsExecuted(command.id);
        }
      }
      res.json({
        success: true,
        data: {
          command,
          parsed: parsedCommand,
          result
        },
        message: "Command processed successfully"
      });
    } catch (error) {
      console.error("Process command error:", error);
      res.status(500).json({
        success: false,
        error: "Internal server error"
      });
    }
  }
);
function parseNaturalLanguageCommand(text2) {
  const lowerText = text2.toLowerCase();
  if ((lowerText.includes("create") || lowerText.includes("build") || lowerText.includes("make") || lowerText.includes("plan")) && (lowerText.includes("roadmap") || lowerText.includes("strategy") || lowerText.includes("journey") || lowerText.includes("complete plan") || lowerText.includes("full plan"))) {
    return {
      intent: "create_roadmap",
      entities: extractRoadmapEntities(text2),
      confidence: 0.9
    };
  }
  if ((lowerText.includes("create") || lowerText.includes("add") || lowerText.includes("make") || lowerText.includes("set")) && (lowerText.includes("goal") && !lowerText.includes("roadmap"))) {
    return {
      intent: "create_goal",
      entities: extractGoalEntities(text2),
      confidence: 0.85
    };
  }
  if ((lowerText.includes("create") || lowerText.includes("add") || lowerText.includes("make") || lowerText.includes("set")) && lowerText.includes("objective")) {
    return {
      intent: "create_objective",
      entities: extractObjectiveEntities(text2),
      confidence: 0.85
    };
  }
  if ((lowerText.includes("add") || lowerText.includes("create") || lowerText.includes("schedule")) && lowerText.includes("task")) {
    return {
      intent: "add_task",
      entities: extractTaskEntities(text2),
      confidence: 0.8
    };
  }
  if ((lowerText.includes("change") || lowerText.includes("update") || lowerText.includes("modify")) && lowerText.includes("task")) {
    return {
      intent: "modify_task",
      entities: extractModificationEntities(text2),
      confidence: 0.7
    };
  }
  if ((lowerText.includes("delete") || lowerText.includes("remove") || lowerText.includes("cancel")) && lowerText.includes("task")) {
    return {
      intent: "delete_task",
      entities: extractDeletionEntities(text2),
      confidence: 0.8
    };
  }
  if (lowerText.includes("what") || lowerText.includes("how") || lowerText.includes("when") || lowerText.includes("show") || lowerText.includes("list")) {
    return {
      intent: "ask_question",
      entities: extractQuestionEntities(text2),
      confidence: 0.6
    };
  }
  return {
    intent: "ask_question",
    entities: { originalText: text2 },
    confidence: 0.3
  };
}
function extractRoadmapEntities(text2) {
  const entities = {};
  const promptMatch = text2.match(/(?:create|build|make|plan)(?:\s+(?:a|an|the))?\s+(?:roadmap|strategy|journey|complete plan|full plan)?(?:\s+(?:for|to|of))?\s*(.+)/i);
  if (promptMatch) {
    entities.prompt = promptMatch[1].trim();
    entities.description = promptMatch[1].trim();
  }
  const timeframeMatch = text2.match(/(this year|next year|2024|2025|this semester|next semester|in \d+ months?)/i);
  if (timeframeMatch) {
    entities.timeframe = timeframeMatch[1];
  }
  if (text2.toLowerCase().includes("developer") || text2.toLowerCase().includes("programming") || text2.toLowerCase().includes("coding")) {
    entities.category = "career";
  } else if (text2.toLowerCase().includes("fitness") || text2.toLowerCase().includes("health") || text2.toLowerCase().includes("workout")) {
    entities.category = "health";
  } else if (text2.toLowerCase().includes("business") || text2.toLowerCase().includes("startup") || text2.toLowerCase().includes("company")) {
    entities.category = "financial";
  } else if (text2.toLowerCase().includes("learn") || text2.toLowerCase().includes("study") || text2.toLowerCase().includes("course") || text2.toLowerCase().includes("grade") || text2.toLowerCase().includes("subject")) {
    entities.category = "education";
  } else {
    entities.category = "personal";
  }
  return entities;
}
function extractGoalEntities(text2) {
  const entities = {};
  const titleMatch = text2.match(/(?:create|add|make|set)(?:\s+(?:a|an|the))?\s+goal\s*(.+)/i);
  if (titleMatch) {
    entities.title = titleMatch[1].trim();
    entities.description = titleMatch[1].trim();
  }
  const yearMatch = text2.match(/(2024|2025|this year|next year)/i);
  if (yearMatch) {
    const yearText = yearMatch[1].toLowerCase();
    if (yearText === "this year") {
      entities.year = (/* @__PURE__ */ new Date()).getFullYear();
    } else if (yearText === "next year") {
      entities.year = (/* @__PURE__ */ new Date()).getFullYear() + 1;
    } else {
      entities.year = parseInt(yearText);
    }
  } else {
    entities.year = (/* @__PURE__ */ new Date()).getFullYear();
  }
  if (text2.toLowerCase().includes("developer") || text2.toLowerCase().includes("career") || text2.toLowerCase().includes("job")) {
    entities.category = "career";
    entities.priority = "high";
  } else if (text2.toLowerCase().includes("fitness") || text2.toLowerCase().includes("health")) {
    entities.category = "health";
    entities.priority = "medium";
  } else if (text2.toLowerCase().includes("learn") || text2.toLowerCase().includes("study") || text2.toLowerCase().includes("education")) {
    entities.category = "education";
    entities.priority = "high";
  } else if (text2.toLowerCase().includes("business") || text2.toLowerCase().includes("money") || text2.toLowerCase().includes("financial")) {
    entities.category = "financial";
    entities.priority = "high";
  } else {
    entities.category = "personal";
    entities.priority = "medium";
  }
  return entities;
}
function extractObjectiveEntities(text2) {
  const entities = {};
  const titleMatch = text2.match(/(?:create|add|make|set)(?:\s+(?:a|an|the))?\s+objective\s*(.+)/i);
  if (titleMatch) {
    entities.title = titleMatch[1].trim();
    entities.description = titleMatch[1].trim();
  }
  const monthMatch = text2.match(/(?:for|in|by)\s+(january|february|march|april|may|june|july|august|september|october|november|december|\d{1,2})/i);
  if (monthMatch) {
    const monthText = monthMatch[1].toLowerCase();
    if (isNaN(parseInt(monthText))) {
      const months = ["january", "february", "march", "april", "may", "june", "july", "august", "september", "october", "november", "december"];
      entities.month = months.indexOf(monthText) + 1;
    } else {
      entities.month = parseInt(monthText);
    }
  } else {
    entities.month = (/* @__PURE__ */ new Date()).getMonth() + 1;
  }
  const yearMatch = text2.match(/(2024|2025|this year|next year)/i);
  if (yearMatch) {
    const yearText = yearMatch[1].toLowerCase();
    if (yearText === "this year") {
      entities.year = (/* @__PURE__ */ new Date()).getFullYear();
    } else if (yearText === "next year") {
      entities.year = (/* @__PURE__ */ new Date()).getFullYear() + 1;
    } else {
      entities.year = parseInt(yearText);
    }
  } else {
    entities.year = (/* @__PURE__ */ new Date()).getFullYear();
  }
  return entities;
}
function extractTaskEntities(text2) {
  const entities = {};
  const timeMatch = text2.match(/(\d{1,2}):(\d{2})|(\d{1,2})\s*(am|pm)/i);
  if (timeMatch) {
    entities.time = timeMatch[0];
  }
  const dateMatch = text2.match(
    /(today|tomorrow|monday|tuesday|wednesday|thursday|friday|saturday|sunday)/i
  );
  if (dateMatch) {
    entities.date = dateMatch[0];
  }
  const durationMatch = text2.match(/(\d+)\s*(hour|minute|min)/i);
  if (durationMatch) {
    entities.duration = parseInt(durationMatch[1]);
    entities.durationUnit = durationMatch[2];
  }
  const taskMatch = text2.match(
    /(?:add|create|schedule)\s+(?:task\s+)?["']?([^"']+)["']?/i
  );
  if (taskMatch) {
    entities.title = taskMatch[1].trim();
  }
  return entities;
}
function extractModificationEntities(text2) {
  const entities = {};
  const taskIdentifierMatch = text2.match(
    /(?:change|update|modify)\s+(?:task\s+)?["']?([^"']+?)["']?\s+(?:to|from)/i
  );
  if (taskIdentifierMatch) {
    entities.taskIdentifier = taskIdentifierMatch[1].trim();
  }
  if (text2.includes("time")) {
    entities.field = "scheduledTime";
    const timeMatch = text2.match(
      /(?:to|at)\s+(\d{1,2}):(\d{2})|(\d{1,2})\s*(am|pm)/i
    );
    if (timeMatch) {
      entities.newValue = timeMatch[0].replace(/^(?:to|at)\s+/, "");
    }
  }
  if (text2.includes("date")) {
    entities.field = "scheduledDate";
    const dateMatch = text2.match(
      /(?:to|on)\s+(today|tomorrow|monday|tuesday|wednesday|thursday|friday|saturday|sunday)/i
    );
    if (dateMatch) {
      entities.newValue = dateMatch[1];
    }
  }
  if (text2.includes("title") || text2.includes("name")) {
    entities.field = "title";
    const titleMatch = text2.match(/(?:to|name)\s+["']?([^"']+)["']?$/i);
    if (titleMatch) {
      entities.newValue = titleMatch[1].trim();
    }
  }
  if (text2.includes("priority")) {
    entities.field = "priority";
    const priorityMatch = text2.match(
      /(?:to|priority)\s+(low|medium|high|critical)/i
    );
    if (priorityMatch) {
      entities.newValue = priorityMatch[1].toLowerCase();
    }
  }
  if (text2.includes("duration")) {
    entities.field = "estimatedDuration";
    const durationMatch = text2.match(
      /(?:to|duration)\s+(\d+)\s*(hour|minute|min)/i
    );
    if (durationMatch) {
      const value = parseInt(durationMatch[1]);
      const unit = durationMatch[2];
      entities.newValue = unit.startsWith("hour") ? value * 60 : value;
    }
  }
  return entities;
}
function extractDeletionEntities(text2) {
  const entities = {};
  const taskMatch = text2.match(
    /(?:delete|remove|cancel)\s+(?:task\s+)?["']?([^"']+)["']?/i
  );
  if (taskMatch) {
    entities.taskIdentifier = taskMatch[1].trim();
  }
  const dateMatch = text2.match(
    /(?:delete|remove|cancel)\s+(?:all\s+)?(?:tasks?\s+)?(?:for\s+)?(today|tomorrow|monday|tuesday|wednesday|thursday|friday|saturday|sunday)/i
  );
  if (dateMatch) {
    entities.dateFilter = dateMatch[1];
    entities.deleteType = "by_date";
  }
  return entities;
}
function extractQuestionEntities(text2) {
  const entities = { question: text2 };
  if (text2.includes("today")) {
    entities.timeframe = "today";
  } else if (text2.includes("tomorrow")) {
    entities.timeframe = "tomorrow";
  } else if (text2.includes("week")) {
    entities.timeframe = "week";
  } else if (text2.includes("month")) {
    entities.timeframe = "month";
  }
  if (text2.toLowerCase().includes("how many")) {
    entities.questionType = "count";
  } else if (text2.toLowerCase().includes("what time") || text2.toLowerCase().includes("when")) {
    entities.questionType = "time";
  } else if (text2.toLowerCase().includes("what") && text2.toLowerCase().includes("next")) {
    entities.questionType = "next_task";
  } else if (text2.toLowerCase().includes("progress") || text2.toLowerCase().includes("completed")) {
    entities.questionType = "progress";
  }
  return entities;
}
async function executeAddTask(userId, entities) {
  try {
    const { title, description, date, time, duration, priority, objective, goal } = entities;
    if (!title) {
      return { success: false, message: "Task title is required" };
    }
    let scheduledDate = /* @__PURE__ */ new Date();
    if (date) {
      const parsedDate = parseDateString(date);
      if (parsedDate) {
        scheduledDate = parsedDate;
      }
    }
    let objectiveId = null;
    let goalId = null;
    if (objective) {
      const objectives = await storage.objectives.getUserObjectives(userId);
      const matchedObjective = objectives.find(
        (obj) => obj.title.toLowerCase().includes(objective.toLowerCase())
      );
      if (matchedObjective) {
        objectiveId = matchedObjective.id;
        goalId = matchedObjective.goalId;
      }
    }
    if (!objectiveId && goal) {
      const goals2 = await storage.goals.getUserGoals(userId);
      const matchedGoal = goals2.find(
        (g) => g.title.toLowerCase().includes(goal.toLowerCase())
      );
      if (matchedGoal) {
        goalId = matchedGoal.id;
      }
    }
    const task = await storage.tasks.createTask({
      userId,
      objectiveId,
      goalId,
      title,
      description: description || "",
      scheduledDate,
      scheduledTime: time || null,
      estimatedDuration: duration || 30,
      priority: priority || "medium",
      status: "pending",
      tags: []
    });
    let linkMessage = "";
    if (objectiveId) {
      linkMessage = " under your specified objective";
    } else if (goalId) {
      linkMessage = " under your specified goal";
    }
    return {
      success: true,
      message: `Task "${title}" created successfully${linkMessage}`,
      data: { task }
    };
  } catch (error) {
    console.error("Add task error:", error);
    return {
      success: false,
      message: "Failed to create task"
    };
  }
}
async function executeModifyTask(userId, entities) {
  try {
    const { taskIdentifier, field, newValue, title } = entities;
    if (!taskIdentifier && !title) {
      return {
        success: false,
        message: "Please specify which task to modify by title or identifier"
      };
    }
    if (!field || !newValue) {
      return {
        success: false,
        message: "Please specify what field to change and the new value"
      };
    }
    let task = null;
    if (taskIdentifier) {
      const userTasks = await storage.tasks.getUserTasks(userId, /* @__PURE__ */ new Date(0), /* @__PURE__ */ new Date());
      task = userTasks.find(
        (t) => t.title.toLowerCase().includes(taskIdentifier.toLowerCase()) || t.id === taskIdentifier
      );
    } else if (title) {
      const userTasks = await storage.tasks.getUserTasks(userId, /* @__PURE__ */ new Date(0), /* @__PURE__ */ new Date());
      task = userTasks.find(
        (t) => t.title.toLowerCase().includes(title.toLowerCase())
      );
    }
    if (!task) {
      return {
        success: false,
        message: `Task "${taskIdentifier || title}" not found`
      };
    }
    const updateData = {};
    switch (field.toLowerCase()) {
      case "title":
        updateData.title = newValue;
        break;
      case "description":
        updateData.description = newValue;
        break;
      case "priority":
        if (["low", "medium", "high", "critical"].includes(newValue.toLowerCase())) {
          updateData.priority = newValue.toLowerCase();
        } else {
          return {
            success: false,
            message: "Priority must be: low, medium, high, or critical"
          };
        }
        break;
      case "time":
      case "scheduledtime":
        updateData.scheduledTime = normalizeTime2(newValue);
        break;
      case "date":
      case "scheduleddate":
        const parsedDate = parseDateString(newValue);
        if (parsedDate) {
          updateData.scheduledDate = parsedDate;
        } else {
          return {
            success: false,
            message: "Invalid date format"
          };
        }
        break;
      case "duration":
      case "estimatedduration":
        const duration = parseInt(newValue);
        if (isNaN(duration) || duration <= 0) {
          return {
            success: false,
            message: "Duration must be a positive number (in minutes)"
          };
        }
        updateData.estimatedDuration = duration;
        break;
      case "status":
        if (["pending", "in_progress", "completed", "cancelled", "rescheduled"].includes(newValue.toLowerCase())) {
          updateData.status = newValue.toLowerCase();
        } else {
          return {
            success: false,
            message: "Status must be: pending, in_progress, completed, cancelled, or rescheduled"
          };
        }
        break;
      case "location":
        updateData.location = newValue;
        break;
      default:
        return {
          success: false,
          message: `Cannot modify field: ${field}. Supported fields: title, description, priority, time, date, duration, status, location`
        };
    }
    const updatedTask = await storage.tasks.updateTask(task.id, updateData);
    return {
      success: true,
      message: `Task "${task.title}" updated successfully`,
      data: { task: updatedTask }
    };
  } catch (error) {
    console.error("Modify task error:", error);
    return {
      success: false,
      message: "Failed to modify task"
    };
  }
}
async function executeDeleteTask(userId, entities) {
  try {
    const { taskIdentifier, title } = entities;
    if (!taskIdentifier && !title) {
      return {
        success: false,
        message: "Please specify which task to delete by title or identifier"
      };
    }
    let task = null;
    const userTasks = await storage.tasks.getUserTasks(userId, /* @__PURE__ */ new Date(0), /* @__PURE__ */ new Date());
    if (taskIdentifier) {
      task = userTasks.find(
        (t) => t.title.toLowerCase().includes(taskIdentifier.toLowerCase()) || t.id === taskIdentifier
      );
    } else if (title) {
      task = userTasks.find(
        (t) => t.title.toLowerCase().includes(title.toLowerCase())
      );
    }
    if (!task) {
      return {
        success: false,
        message: `Task "${taskIdentifier || title}" not found`
      };
    }
    const taskTitle = task.title;
    await storage.tasks.deleteTask(task.id);
    return {
      success: true,
      message: `Task "${taskTitle}" deleted successfully`,
      data: { deletedTaskId: task.id }
    };
  } catch (error) {
    console.error("Delete task error:", error);
    return {
      success: false,
      message: "Failed to delete task"
    };
  }
}
async function executeQuestion(userId, entities) {
  return { success: true, message: "Question answering via AI not yet implemented" };
}
async function executeCommand(userId, parsedCommand) {
  try {
    switch (parsedCommand.intent) {
      case "add_task":
        return await executeAddTask(userId, parsedCommand.entities);
      case "modify_task":
        return await executeModifyTask(userId, parsedCommand.entities);
      case "delete_task":
        return await executeDeleteTask(userId, parsedCommand.entities);
      case "create_goal":
        return await executeCreateGoal(userId, parsedCommand.entities);
      case "create_objective":
        return await executeCreateObjective(userId, parsedCommand.entities);
      case "create_roadmap":
        return await executeCreateRoadmap(userId, parsedCommand.entities);
      case "ask_question":
        return await executeQuestion(userId, parsedCommand.entities);
      default:
        return {
          success: false,
          message: "Unknown command intent"
        };
    }
  } catch (error) {
    return {
      success: false,
      message: "Failed to execute command",
      error: error instanceof Error ? error.message : String(error)
    };
  }
}
async function executeCreateGoal(userId, entities) {
  try {
    const { title, description, category, year, priority } = entities;
    if (!title) {
      return { success: false, message: "Goal title is required" };
    }
    const goal = await storage.goals.createGoal({
      userId,
      title,
      description: description || "",
      category: category || "personal",
      targetYear: year || (/* @__PURE__ */ new Date()).getFullYear(),
      priority: priority || "medium",
      status: "active"
    });
    return {
      success: true,
      message: `Goal "${title}" created successfully for ${year || (/* @__PURE__ */ new Date()).getFullYear()}`,
      data: { goal }
    };
  } catch (error) {
    console.error("Create goal error:", error);
    return {
      success: false,
      message: "Failed to create goal"
    };
  }
}
async function executeCreateObjective(userId, entities) {
  try {
    const { title, description, month, year } = entities;
    if (!title) {
      return { success: false, message: "Objective title is required" };
    }
    const goals2 = await storage.goals.getUserGoals(userId);
    const activeGoals = goals2.filter((g) => g.status === "active");
    if (activeGoals.length === 0) {
      return {
        success: false,
        message: "Please create a goal first before adding objectives"
      };
    }
    const goalId = activeGoals[0].id;
    const objective = await storage.objectives.createObjective({
      userId,
      goalId,
      title,
      description: description || "",
      targetMonth: month || (/* @__PURE__ */ new Date()).getMonth() + 1,
      targetYear: year || (/* @__PURE__ */ new Date()).getFullYear(),
      keyResults: [],
      status: "active"
    });
    return {
      success: true,
      message: `Objective "${title}" created successfully for month ${month || (/* @__PURE__ */ new Date()).getMonth() + 1}`,
      data: { objective }
    };
  } catch (error) {
    console.error("Create objective error:", error);
    return {
      success: false,
      message: "Failed to create objective"
    };
  }
}
async function executeCreateRoadmap(userId, entities) {
  try {
    const { prompt, description } = entities;
    if (!prompt && !description) {
      return {
        success: false,
        message: "Please provide a description of what you want to achieve"
      };
    }
    return {
      success: false,
      message: 'Roadmap creation requires AI services. Please use the AI-powered chat interface or try: "I want to create a goal for [your objective]" instead.',
      data: {
        suggestion: "Try creating a goal first, then break it into objectives and tasks.",
        alternativeCommands: [
          `create a goal ${prompt || description}`,
          `create an objective ${prompt || description}`
        ]
      }
    };
  } catch (error) {
    console.error("Create roadmap error:", error);
    return {
      success: false,
      message: "Failed to create roadmap"
    };
  }
}
function normalizeTime2(timeStr) {
  const timeMatch = timeStr.match(/(\d{1,2}):(\d{2})/);
  if (timeMatch) {
    return timeMatch[0];
  }
  const amPmMatch = timeStr.match(/(\d{1,2})\s*(am|pm)/i);
  if (amPmMatch) {
    let hour = parseInt(amPmMatch[1]);
    const isPM = amPmMatch[2].toLowerCase() === "pm";
    if (isPM && hour !== 12) {
      hour += 12;
    } else if (!isPM && hour === 12) {
      hour = 0;
    }
    return `${hour.toString().padStart(2, "0")}:00`;
  }
  return timeStr;
}
function parseDateString(dateStr) {
  const today = /* @__PURE__ */ new Date();
  const lowerDate = dateStr.toLowerCase();
  if (lowerDate === "today") {
    return today;
  } else if (lowerDate === "tomorrow") {
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);
    return tomorrow;
  }
  const days = [
    "sunday",
    "monday",
    "tuesday",
    "wednesday",
    "thursday",
    "friday",
    "saturday"
  ];
  const dayIndex = days.indexOf(lowerDate);
  if (dayIndex !== -1) {
    const targetDate = new Date(today);
    const currentDay = today.getDay();
    let daysToAdd = dayIndex - currentDay;
    if (daysToAdd <= 0) {
      daysToAdd += 7;
    }
    targetDate.setDate(today.getDate() + daysToAdd);
    return targetDate;
  }
  return today;
}
var nl_commands_default = router9;

// server/routes/ambient-ai.ts
init_ai_factory();
init_auth();
import { Router as Router10 } from "express";
import { z as z10 } from "zod";
init_ambient_ai();
var router10 = Router10();
var StartLearningSchema = z10.object({
  options: z10.object({
    includeVisualAnalysis: z10.boolean().optional(),
    conversationalMemory: z10.boolean().optional(),
    contextualAwareness: z10.boolean().optional()
  }).optional()
});
var VisualAnalysisSchema = z10.object({
  imageData: z10.string().min(1)
});
router10.get("/suggestions", requireAuth, async (req, res) => {
  try {
    const userId = req.user.id;
    const suggestions = await ambientAI.getActiveSuggestions(userId);
    const sortedSuggestions = suggestions.sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      const priorityA = a.priority;
      const priorityB = b.priority;
      const priorityDiff = priorityOrder[priorityB] - priorityOrder[priorityA];
      if (priorityDiff !== 0) return priorityDiff;
      return b.confidence - a.confidence;
    });
    res.json({
      success: true,
      data: {
        suggestions: sortedSuggestions,
        count: sortedSuggestions.length,
        provider: getCurrentAIProvider(),
        enhanced: getCurrentAIProvider() === "gemini"
      },
      message: `Found ${sortedSuggestions.length} active suggestions from ${getCurrentAIProvider()}`
    });
  } catch (error) {
    console.error("Get ambient suggestions error:", error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : "Failed to get suggestions"
    });
  }
});
router10.post("/suggestions/:id/apply", requireAuth, async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    const ambientService = getAmbientAIService();
    const result = await ambientService.applySuggestion(userId, id);
    if (!result.success) {
      return res.status(404).json({
        success: false,
        error: result.message
      });
    }
    res.json({
      success: true,
      data: {
        result,
        provider: getCurrentAIProvider()
      },
      message: `${result.message} (via ${getCurrentAIProvider()})`
    });
  } catch (error) {
    console.error("Apply ambient suggestion error:", error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : "Failed to apply suggestion"
    });
  }
});
router10.post("/suggestions/:id/dismiss", requireAuth, async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    const ambientService = getAmbientAIService();
    const dismissed = await ambientService.dismissSuggestion(userId, id);
    if (!dismissed) {
      return res.status(404).json({
        success: false,
        error: "Suggestion not found"
      });
    }
    res.json({
      success: true,
      message: `Suggestion dismissed and learning updated (${getCurrentAIProvider()})`
    });
  } catch (error) {
    console.error("Dismiss ambient suggestion error:", error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : "Failed to dismiss suggestion"
    });
  }
});
router10.post("/start-learning", requireAuth, validateRequest(StartLearningSchema), async (req, res) => {
  try {
    const userId = req.user.id;
    const { options } = req.body;
    const ambientService = getAmbientAIService();
    const currentProvider = getCurrentAIProvider();
    if (currentProvider === "gemini" && ambientService.startEnhancedAmbientLearning) {
      await ambientService.startEnhancedAmbientLearning(userId, options);
    } else if (ambientService.startAmbientLearning) {
      await ambientService.startAmbientLearning(userId);
    } else {
      throw new Error("Ambient learning not supported by current provider");
    }
    res.json({
      success: true,
      data: {
        provider: currentProvider,
        enhanced: currentProvider === "gemini",
        options: options || {}
      },
      message: `${currentProvider === "gemini" ? "Enhanced" : "Standard"} ambient learning started with ${currentProvider}`
    });
  } catch (error) {
    console.error("Start ambient learning error:", error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : "Failed to start ambient learning"
    });
  }
});
router10.post("/stop-learning", requireAuth, async (req, res) => {
  try {
    const userId = req.user.id;
    const ambientService = getAmbientAIService();
    ambientService.stopAmbientLearning(userId);
    res.json({
      success: true,
      data: {
        provider: getCurrentAIProvider()
      },
      message: `Ambient learning stopped (${getCurrentAIProvider()})`
    });
  } catch (error) {
    console.error("Stop ambient learning error:", error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : "Failed to stop ambient learning"
    });
  }
});
router10.post("/visual-analysis", requireAuth, validateRequest(VisualAnalysisSchema), async (req, res) => {
  try {
    const userId = req.user.id;
    const { imageData } = req.body;
    const currentProvider = getCurrentAIProvider();
    const ambientService = getAmbientAIService();
    if (currentProvider !== "gemini" || !ambientService.analyzeWorkspaceVisually) {
      return res.status(400).json({
        success: false,
        error: `Visual analysis is only available with Gemini provider. Current provider: ${currentProvider}`
      });
    }
    const analysis = await ambientService.analyzeWorkspaceVisually(userId, imageData);
    res.json({
      success: true,
      data: {
        ...analysis,
        provider: currentProvider,
        multimodal: true
      },
      message: "Visual workspace analysis completed using Gemini"
    });
  } catch (error) {
    console.error("Visual analysis error:", error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : "Failed to analyze workspace visually"
    });
  }
});
router10.post("/add-conversation", requireAuth, async (req, res) => {
  try {
    const userId = req.user.id;
    const { role, content } = req.body;
    const currentProvider = getCurrentAIProvider();
    const ambientService = getAmbientAIService();
    if (currentProvider !== "gemini" || !ambientService.addConversation) {
      return res.status(400).json({
        success: false,
        error: `Conversational memory is only available with Gemini provider. Current provider: ${currentProvider}`
      });
    }
    ambientService.addConversation(userId, role, content);
    res.json({
      success: true,
      data: {
        provider: currentProvider,
        conversationalMemory: true
      },
      message: "Conversation added to memory for enhanced learning"
    });
  } catch (error) {
    console.error("Add conversation error:", error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : "Failed to add conversation"
    });
  }
});
router10.get("/capabilities", requireAuth, async (req, res) => {
  try {
    const currentProvider = getCurrentAIProvider();
    const capabilities = aiServiceFactory.getProviderCapabilities();
    res.json({
      success: true,
      data: {
        provider: currentProvider,
        ...capabilities,
        ambientFeatures: {
          standardLearning: true,
          enhancedLearning: currentProvider === "gemini",
          visualAnalysis: currentProvider === "gemini" && capabilities.visualAnalysis,
          conversationalMemory: currentProvider === "gemini" && capabilities.conversationalMemory,
          contextualAwareness: capabilities.contextualAwareness
        }
      },
      message: `Ambient AI capabilities for ${currentProvider}`
    });
  } catch (error) {
    console.error("Get capabilities error:", error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : "Failed to get capabilities"
    });
  }
});
var ambient_ai_default = router10;

// server/routes/suggestions.ts
init_ambient_ai();
init_auth();
import { Router as Router11 } from "express";
import { z as z11 } from "zod";
var router11 = Router11();
var ApplySuggestionSchema = z11.object({
  suggestionId: z11.string()
});
router11.get("/", requireAuth, async (req, res) => {
  try {
    const userId = req.user.id;
    const suggestions = await ambientAI.getActiveSuggestions(userId);
    const sortedSuggestions = suggestions.sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      const priorityDiff = priorityOrder[b.priority] - priorityOrder[a.priority];
      if (priorityDiff !== 0) return priorityDiff;
      return b.confidence - a.confidence;
    });
    res.json({
      success: true,
      data: {
        suggestions: sortedSuggestions,
        count: sortedSuggestions.length
      },
      message: `Found ${sortedSuggestions.length} active suggestions`
    });
  } catch (error) {
    console.error("Get suggestions error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch suggestions"
    });
  }
});
router11.post(
  "/apply",
  requireAuth,
  validateRequest(ApplySuggestionSchema),
  async (req, res) => {
    try {
      const userId = req.user.id;
      const { suggestionId } = req.body;
      const result = await ambientAI.applySuggestion(userId, suggestionId);
      if (result.success) {
        res.json({
          success: true,
          message: result.message
        });
      } else {
        res.status(400).json({
          success: false,
          error: result.message
        });
      }
    } catch (error) {
      console.error("Apply suggestion error:", error);
      res.status(500).json({
        success: false,
        error: "Failed to apply suggestion"
      });
    }
  }
);
router11.post(
  "/dismiss/:id",
  requireAuth,
  async (req, res) => {
    try {
      const userId = req.user.id;
      const suggestionId = req.params.id;
      res.json({
        success: true,
        message: "Suggestion dismissed"
      });
    } catch (error) {
      console.error("Dismiss suggestion error:", error);
      res.status(500).json({
        success: false,
        error: "Failed to dismiss suggestion"
      });
    }
  }
);
router11.post("/generate", requireAuth, async (req, res) => {
  try {
    const userId = req.user.id;
    const suggestions = await ambientAI.generateProactiveSuggestions(userId);
    res.json({
      success: true,
      data: {
        suggestions,
        count: suggestions.length
      },
      message: `Generated ${suggestions.length} new suggestions`
    });
  } catch (error) {
    console.error("Generate suggestions error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to generate suggestions"
    });
  }
});
router11.get(
  "/learning-status",
  requireAuth,
  async (req, res) => {
    try {
      const userId = req.user.id;
      const isLearning = ambientAI["learningIntervals"].has(userId);
      res.json({
        success: true,
        data: {
          isLearning,
          status: isLearning ? "active" : "inactive",
          message: isLearning ? "AI is actively learning your patterns" : "Ambient learning is not active"
        }
      });
    } catch (error) {
      console.error("Learning status error:", error);
      res.status(500).json({
        success: false,
        error: "Failed to get learning status"
      });
    }
  }
);
router11.post(
  "/start-learning",
  requireAuth,
  async (req, res) => {
    try {
      const userId = req.user.id;
      await ambientAI.startAmbientLearning(userId);
      res.json({
        success: true,
        message: "Ambient learning started successfully"
      });
    } catch (error) {
      console.error("Start learning error:", error);
      res.status(500).json({
        success: false,
        error: "Failed to start ambient learning"
      });
    }
  }
);
router11.post(
  "/stop-learning",
  requireAuth,
  async (req, res) => {
    try {
      const userId = req.user.id;
      ambientAI.stopAmbientLearning(userId);
      res.json({
        success: true,
        message: "Ambient learning stopped"
      });
    } catch (error) {
      console.error("Stop learning error:", error);
      res.status(500).json({
        success: false,
        error: "Failed to stop ambient learning"
      });
    }
  }
);
var suggestions_default = router11;

// server/routes/personalization.ts
init_ai_factory();
init_auth();
import { Router as Router12 } from "express";
import { z as z12 } from "zod";
init_storage();
var router12 = Router12();
var personalizationEngine2 = getPersonalizationEngine();
var FeedbackSchema = z12.object({
  suggestionId: z12.string().min(1, "Suggestion ID is required"),
  action: z12.enum(["accepted", "dismissed", "modified"], {
    errorMap: () => ({
      message: "Action must be accepted, dismissed, or modified"
    })
  }),
  effectiveness: z12.number().min(1).max(5).optional(),
  comments: z12.string().max(500).optional()
});
var ContextualSuggestionsSchema = z12.object({
  location: z12.string().max(100).optional(),
  recentActivity: z12.enum([
    "focused_work",
    "meetings",
    "administrative",
    "creative",
    "break",
    "planning"
  ]).optional(),
  energyLevel: z12.enum(["low", "medium", "high"]).optional(),
  includeVisualContext: z12.boolean().optional()
});
var GoalDecompositionSchema = z12.object({
  considerPersonalization: z12.boolean().default(true),
  customParameters: z12.object({
    timelineAdjustment: z12.number().min(0.5).max(2).optional(),
    complexityPreference: z12.enum(["simple", "moderate", "detailed"]).optional(),
    focusAreas: z12.array(z12.string()).max(5).optional()
  }).optional()
});
function calculateRecommendationPriority(recommendation, dayTasks) {
  let score = 50;
  switch (recommendation.impact) {
    case "high":
      score += 30;
      break;
    case "medium":
      score += 15;
      break;
    case "low":
      score += 5;
      break;
  }
  switch (recommendation.effort) {
    case "low":
      score += 20;
      break;
    case "medium":
      score += 10;
      break;
    case "high":
      score -= 10;
      break;
  }
  if (dayTasks.length > 10) {
    score += 10;
  }
  return Math.min(100, Math.max(0, score));
}
function isRecommendationApplicableNow(recommendation, currentTime) {
  const currentHour = currentTime.getHours();
  if (recommendation.type === "energy_optimization") {
    return currentHour >= 6 && currentHour <= 22;
  }
  if (recommendation.type === "break_reminder") {
    return currentHour >= 9 && currentHour <= 18;
  }
  return currentHour >= 8 && currentHour <= 20;
}
async function storeSuggestionsForTracking(userId, suggestions) {
  const allSuggestions = [
    ...suggestions.immediate,
    ...suggestions.upcoming,
    ...suggestions.strategic
  ];
  for (const suggestion of allSuggestions) {
    await storage.insights.createInsight({
      userId,
      insightType: "suggestion_generated",
      data: {
        suggestion,
        generatedAt: (/* @__PURE__ */ new Date()).toISOString(),
        category: suggestion.category,
        provider: getCurrentAIProvider()
      },
      confidence: "0.8"
    });
  }
}
function applyCustomDecompositionParameters(decomposition, params) {
  let modified = { ...decomposition };
  if (params.timelineAdjustment) {
    modified.timelineAdjustments = modified.timelineAdjustments || [];
    modified.timelineAdjustments = modified.timelineAdjustments.map(
      (adj) => ({
        ...adj,
        adjustmentFactor: params.timelineAdjustment
      })
    );
  }
  if (params.complexityPreference) {
    modified.decompositionStrategy = `${modified.decompositionStrategy}_${params.complexityPreference}`;
  }
  if (params.focusAreas && params.focusAreas.length > 0) {
    modified.motivationalFactors = modified.motivationalFactors || [];
    modified.motivationalFactors = [
      ...modified.motivationalFactors,
      ...params.focusAreas.map((area) => `Focus on ${area}`)
    ];
  }
  return modified;
}
async function validateSuggestionExists(userId, suggestionId) {
  try {
    const insights = await storage.insights.getUserInsights(
      userId,
      "suggestion_generated"
    );
    return insights.some((insight) => {
      const data = insight.data;
      return data.suggestion && data.suggestion.id === suggestionId;
    });
  } catch (error) {
    console.error("Error validating suggestion:", error);
    return false;
  }
}
async function updateSuggestionStatus(userId, suggestionId, action) {
  await storage.insights.createInsight({
    userId,
    insightType: "suggestion_status_update",
    data: {
      suggestionId,
      action,
      updatedAt: (/* @__PURE__ */ new Date()).toISOString()
    },
    confidence: "1.0"
  });
}
async function getAdditionalAnalytics(userId, timeframeDays) {
  const startDate = new Date(Date.now() - timeframeDays * 24 * 60 * 60 * 1e3);
  const endDate = /* @__PURE__ */ new Date();
  try {
    const taskStats = await storage.tasks.getTaskCompletionStats(
      userId,
      startDate,
      endDate
    );
    const insights = await storage.insights.getUserInsights(userId);
    const recentInsights = insights.filter(
      (i) => new Date(i.createdAt) >= startDate
    );
    const suggestionInsights = recentInsights.filter(
      (i) => i.insightType === "suggestion_generated"
    );
    const feedbackInsights = recentInsights.filter(
      (i) => i.insightType === "personalization_feedback"
    );
    return {
      taskCompletionRate: taskStats.completionRate,
      totalTasksInPeriod: taskStats.total,
      suggestionsGenerated: suggestionInsights.length,
      feedbackProvided: feedbackInsights.length,
      avgDailyInsights: recentInsights.length / timeframeDays,
      personalizationEngagement: feedbackInsights.length / Math.max(1, suggestionInsights.length) * 100
    };
  } catch (error) {
    console.error("Error getting additional analytics:", error);
    return {
      taskCompletionRate: 0,
      totalTasksInPeriod: 0,
      suggestionsGenerated: 0,
      feedbackProvided: 0,
      avgDailyInsights: 0,
      personalizationEngagement: 0
    };
  }
}
function analyzePersonalizationPatterns(insights) {
  const feedbackInsights = insights.filter(
    (i) => i.insightType === "personalization_feedback"
  );
  const adjustmentInsights = insights.filter(
    (i) => i.insightType === "personalization_adjustment"
  );
  const feedbackByAction = feedbackInsights.reduce((acc, insight) => {
    const action = insight.data.action;
    acc[action] = (acc[action] || 0) + 1;
    return acc;
  }, {});
  const suggestionTypeEngagement = feedbackInsights.reduce((acc, insight) => {
    const suggestionType = insight.data.suggestionType || "unknown";
    acc[suggestionType] = (acc[suggestionType] || 0) + 1;
    return acc;
  }, {});
  return {
    feedbackDistribution: feedbackByAction,
    engagementBySuggestionType: suggestionTypeEngagement,
    adaptationCount: adjustmentInsights.length,
    patterns: identifyBehavioralPatterns(feedbackInsights)
  };
}
function identifyBehavioralPatterns(feedbackInsights) {
  const patterns = [];
  if (feedbackInsights.length === 0) {
    return ["Insufficient data for pattern analysis"];
  }
  const acceptanceRate = feedbackInsights.filter((f) => f.data.action === "accepted").length / feedbackInsights.length;
  if (acceptanceRate > 0.8) {
    patterns.push("High engagement with personalization suggestions");
  } else if (acceptanceRate < 0.3) {
    patterns.push("Low acceptance rate - personalization needs improvement");
  }
  const effectivenessRatings = feedbackInsights.filter((f) => f.data.effectiveness).map((f) => f.data.effectiveness);
  if (effectivenessRatings.length > 0) {
    const avgEffectiveness = effectivenessRatings.reduce((sum, rating) => sum + rating, 0) / effectivenessRatings.length;
    if (avgEffectiveness > 4) {
      patterns.push(
        "High effectiveness ratings - personalization working well"
      );
    } else if (avgEffectiveness < 3) {
      patterns.push("Low effectiveness ratings - need to adjust algorithms");
    }
  }
  return patterns;
}
function generatePersonalizationImprovements(patterns) {
  const improvements = [];
  if (patterns.feedbackDistribution.dismissed > patterns.feedbackDistribution.accepted) {
    improvements.push({
      area: "suggestion_accuracy",
      recommendation: "Improve suggestion relevance by analyzing dismissed suggestions",
      priority: "high",
      effort: "medium"
    });
  }
  if (patterns.adaptationCount < 5) {
    improvements.push({
      area: "learning_speed",
      recommendation: "Increase learning rate by collecting more feedback data points",
      priority: "medium",
      effort: "low"
    });
  }
  if (patterns.patterns.includes("Low acceptance rate")) {
    improvements.push({
      area: "personalization_algorithm",
      recommendation: "Revise personalization algorithm to better match user preferences",
      priority: "high",
      effort: "high"
    });
  }
  return improvements;
}
function validatePersonalizationPreferences(preferences) {
  const validatedPreferences = {};
  if (preferences.workStyle && ["focused", "flexible", "structured", "creative"].includes(
    preferences.workStyle
  )) {
    validatedPreferences.workStyle = preferences.workStyle;
  }
  if (preferences.energyPattern && ["early_bird", "night_owl", "consistent", "variable"].includes(
    preferences.energyPattern
  )) {
    validatedPreferences.energyPattern = preferences.energyPattern;
  }
  if (preferences.priorityStyle && ["deadline_driven", "importance_first", "balanced", "reactive"].includes(
    preferences.priorityStyle
  )) {
    validatedPreferences.priorityStyle = preferences.priorityStyle;
  }
  if (preferences.planningStyle && ["detailed", "high_level", "adaptive", "minimal"].includes(
    preferences.planningStyle
  )) {
    validatedPreferences.planningStyle = preferences.planningStyle;
  }
  if (preferences.productivityFactors) {
    validatedPreferences.productivityFactors = {};
    if (typeof preferences.productivityFactors.optimalTaskDuration === "number" && preferences.productivityFactors.optimalTaskDuration >= 15 && preferences.productivityFactors.optimalTaskDuration <= 240) {
      validatedPreferences.productivityFactors.optimalTaskDuration = preferences.productivityFactors.optimalTaskDuration;
    }
    if (typeof preferences.productivityFactors.breakFrequency === "number" && preferences.productivityFactors.breakFrequency >= 0 && preferences.productivityFactors.breakFrequency <= 100) {
      validatedPreferences.productivityFactors.breakFrequency = preferences.productivityFactors.breakFrequency;
    }
  }
  if (preferences.preferences) {
    validatedPreferences.preferences = {};
    if (typeof preferences.preferences.morningRoutine === "boolean") {
      validatedPreferences.preferences.morningRoutine = preferences.preferences.morningRoutine;
    }
    if (typeof preferences.preferences.eveningReview === "boolean") {
      validatedPreferences.preferences.eveningReview = preferences.preferences.eveningReview;
    }
    if (typeof preferences.preferences.weeklyPlanning === "boolean") {
      validatedPreferences.preferences.weeklyPlanning = preferences.preferences.weeklyPlanning;
    }
    if (typeof preferences.preferences.bufferTime === "number" && preferences.preferences.bufferTime >= 5 && preferences.preferences.bufferTime <= 60) {
      validatedPreferences.preferences.bufferTime = preferences.preferences.bufferTime;
    }
  }
  return validatedPreferences;
}
router12.get("/profile", requireAuth, async (req, res) => {
  try {
    const userId = req.user.id;
    const personalizationEngine3 = getPersonalizationEngine();
    const profile = await personalizationEngine3.analyzeUserPersonalization(
      userId
    );
    const analytics = await personalizationEngine3.getPersonalizationAnalytics(
      userId
    );
    res.json({
      success: true,
      data: {
        profile,
        analytics: {
          accuracy: analytics.profileAccuracy,
          lastUpdated: profile.lastUpdated,
          dataPoints: analytics.adaptationHistory.length
        },
        aiProvider: getCurrentAIProvider()
      },
      message: `Personalization profile retrieved successfully (powered by ${getCurrentAIProvider()})`
    });
  } catch (error) {
    console.error("Get personalization profile error:", error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : "Failed to get personalization profile"
    });
  }
});
router12.post(
  "/profile/refresh",
  requireAuth,
  async (req, res) => {
    try {
      const userId = req.user.id;
      const profile = await personalizationEngine2.analyzeUserPersonalization(
        userId
      );
      res.json({
        success: true,
        data: { profile },
        message: "Personalization profile refreshed successfully"
      });
    } catch (error) {
      console.error("Refresh personalization profile error:", error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : "Failed to refresh personalization profile"
      });
    }
  }
);
router12.get(
  "/recommendations",
  requireAuth,
  async (req, res) => {
    try {
      const userId = req.user.id;
      const dateParam = req.query.date;
      let targetDate;
      if (dateParam) {
        targetDate = new Date(dateParam);
        if (isNaN(targetDate.getTime())) {
          return res.status(400).json({
            success: false,
            error: "Invalid date format. Please use YYYY-MM-DD format."
          });
        }
      } else {
        targetDate = /* @__PURE__ */ new Date();
      }
      targetDate.setHours(0, 0, 0, 0);
      const recommendations = await personalizationEngine2.getPersonalizedTaskRecommendations(
        userId,
        targetDate
      );
      const dayEnd = new Date(targetDate);
      dayEnd.setHours(23, 59, 59, 999);
      const dayTasks = await storage.tasks.getUserTasks(
        userId,
        targetDate,
        dayEnd
      );
      const enrichedRecommendations = {
        schedulingRecommendations: recommendations.schedulingRecommendations.map((rec) => ({
          ...rec,
          priorityScore: calculateRecommendationPriority(rec, dayTasks),
          applicableNow: isRecommendationApplicableNow(rec, /* @__PURE__ */ new Date())
        })),
        taskOptimizations: recommendations.taskOptimizations.map((rec) => ({
          ...rec,
          priorityScore: calculateRecommendationPriority(rec, dayTasks),
          applicableNow: isRecommendationApplicableNow(rec, /* @__PURE__ */ new Date())
        })),
        workflowSuggestions: recommendations.workflowSuggestions.map((rec) => ({
          ...rec,
          priorityScore: calculateRecommendationPriority(rec, dayTasks),
          applicableNow: isRecommendationApplicableNow(rec, /* @__PURE__ */ new Date())
        }))
      };
      res.json({
        success: true,
        data: {
          ...enrichedRecommendations,
          targetDate: targetDate.toISOString().split("T")[0],
          taskCount: dayTasks.length,
          completedTasks: dayTasks.filter((t) => t.status === "completed").length
        },
        message: "Personalized recommendations generated successfully"
      });
    } catch (error) {
      console.error("Get recommendations error:", error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : "Failed to get recommendations"
      });
    }
  }
);
router12.post(
  "/contextual-suggestions",
  requireAuth,
  validateRequest(ContextualSuggestionsSchema),
  async (req, res) => {
    try {
      const userId = req.user.id;
      const { location, recentActivity, energyLevel, includeVisualContext } = req.body;
      const context = {
        currentTime: /* @__PURE__ */ new Date(),
        location,
        recentActivity,
        energyLevel
      };
      const currentProvider = getCurrentAIProvider();
      let suggestions;
      if (currentProvider === "gemini" && includeVisualContext) {
        const aiService2 = getAIService();
        if (aiService2.generateContextualSuggestions) {
          suggestions = await aiService2.generateContextualSuggestions(
            userId,
            context
          );
          const geminiSuggestions = suggestions;
          suggestions = {
            immediate: geminiSuggestions.suggestions?.filter(
              (s) => s.priority === "high"
            ) || [],
            upcoming: geminiSuggestions.suggestions?.filter(
              (s) => s.priority === "medium"
            ) || [],
            strategic: geminiSuggestions.suggestions?.filter(
              (s) => s.priority === "low"
            ) || []
          };
        } else {
          suggestions = await personalizationEngine2.generateContextualSuggestions(
            userId,
            context
          );
        }
      } else {
        suggestions = await personalizationEngine2.generateContextualSuggestions(
          userId,
          context
        );
      }
      const enrichedSuggestions = {
        immediate: suggestions.immediate.map((suggestion) => ({
          ...suggestion,
          id: `immediate_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          validUntil: new Date(Date.now() + 60 * 60 * 1e3).toISOString(),
          category: "immediate_action",
          provider: currentProvider
        })),
        upcoming: suggestions.upcoming.map((suggestion) => ({
          ...suggestion,
          id: `upcoming_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          validUntil: new Date(Date.now() + 4 * 60 * 60 * 1e3).toISOString(),
          category: "upcoming_optimization",
          provider: currentProvider
        })),
        strategic: suggestions.strategic.map((suggestion) => ({
          ...suggestion,
          id: `strategic_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          validUntil: new Date(Date.now() + 24 * 60 * 60 * 1e3).toISOString(),
          category: "strategic_improvement",
          provider: currentProvider
        }))
      };
      await storeSuggestionsForTracking(userId, enrichedSuggestions);
      res.json({
        success: true,
        data: {
          ...enrichedSuggestions,
          context: {
            timestamp: context.currentTime.toISOString(),
            location: context.location,
            recentActivity: context.recentActivity,
            energyLevel: context.energyLevel,
            visualContext: includeVisualContext && currentProvider === "gemini"
          },
          totalSuggestions: suggestions.immediate.length + suggestions.upcoming.length + suggestions.strategic.length,
          provider: currentProvider,
          enhanced: currentProvider === "gemini" && includeVisualContext
        },
        message: `Contextual suggestions generated successfully using ${currentProvider}${includeVisualContext && currentProvider === "gemini" ? " with enhanced visual context" : ""}`
      });
    } catch (error) {
      console.error("Generate contextual suggestions error:", error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : "Failed to generate contextual suggestions"
      });
    }
  }
);
router12.post(
  "/goal-decomposition/:goalId",
  requireAuth,
  validateRequest(GoalDecompositionSchema),
  async (req, res) => {
    try {
      const userId = req.user.id;
      const { goalId } = req.params;
      const { considerPersonalization = true, customParameters } = req.body;
      const goal = await storage.goals.getGoalById(goalId);
      if (!goal || goal.userId !== userId) {
        return res.status(404).json({
          success: false,
          error: "Goal not found or access denied"
        });
      }
      const decomposition = await personalizationEngine2.personalizeGoalDecomposition(userId, goal);
      let finalDecomposition = decomposition;
      if (customParameters) {
        finalDecomposition = applyCustomDecompositionParameters(
          decomposition,
          customParameters
        );
      }
      const existingObjectives = await storage.objectives.getGoalObjectives(
        goalId
      );
      res.json({
        success: true,
        data: {
          decomposition: finalDecomposition,
          goal: {
            id: goal.id,
            title: goal.title,
            description: goal.description,
            category: goal.category,
            targetYear: goal.targetYear,
            priority: goal.priority
          },
          existingObjectives: existingObjectives.length,
          customizationApplied: !!customParameters,
          personalizationUsed: considerPersonalization
        },
        message: "Personalized goal decomposition completed"
      });
    } catch (error) {
      console.error("Personalized goal decomposition error:", error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : "Failed to decompose goal"
      });
    }
  }
);
router12.post(
  "/feedback",
  requireAuth,
  validateRequest(FeedbackSchema),
  async (req, res) => {
    try {
      const userId = req.user.id;
      const feedback = req.body;
      const suggestionExists = await validateSuggestionExists(
        userId,
        feedback.suggestionId
      );
      if (!suggestionExists) {
        return res.status(404).json({
          success: false,
          error: "Suggestion not found or has expired"
        });
      }
      await personalizationEngine2.adaptFromFeedback(userId, feedback);
      await updateSuggestionStatus(
        userId,
        feedback.suggestionId,
        feedback.action
      );
      const analytics = await personalizationEngine2.getPersonalizationAnalytics(
        userId
      );
      res.json({
        success: true,
        data: {
          feedbackRecorded: true,
          suggestionId: feedback.suggestionId,
          action: feedback.action,
          updatedAnalytics: {
            profileAccuracy: analytics.profileAccuracy,
            suggestionAcceptanceRate: analytics.suggestionAcceptanceRate
          }
        },
        message: "Feedback recorded and personalization adapted"
      });
    } catch (error) {
      console.error("Record feedback error:", error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : "Failed to record feedback"
      });
    }
  }
);
router12.get("/analytics", requireAuth, async (req, res) => {
  try {
    const userId = req.user.id;
    const timeframe = req.query.timeframe || "30";
    const analytics = await personalizationEngine2.getPersonalizationAnalytics(
      userId
    );
    const additionalMetrics = await getAdditionalAnalytics(
      userId,
      parseInt(timeframe)
    );
    res.json({
      success: true,
      data: {
        ...analytics,
        ...additionalMetrics,
        timeframe: `${timeframe} days`,
        lastUpdated: (/* @__PURE__ */ new Date()).toISOString()
      },
      message: "Personalization analytics retrieved successfully"
    });
  } catch (error) {
    console.error("Get personalization analytics error:", error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : "Failed to get analytics"
    });
  }
});
router12.get("/insights", requireAuth, async (req, res) => {
  try {
    const userId = req.user.id;
    const insights = await storage.insights.getUserInsights(userId);
    const personalizationInsights = insights.filter(
      (insight) => insight.insightType.includes("personalization") || insight.insightType.includes("suggestion")
    );
    const patterns = analyzePersonalizationPatterns(personalizationInsights);
    const improvements = generatePersonalizationImprovements(patterns);
    res.json({
      success: true,
      data: {
        insights: personalizationInsights.slice(0, 10),
        // Latest 10 insights
        patterns,
        improvements,
        totalInsights: personalizationInsights.length
      },
      message: "Personalization insights retrieved successfully"
    });
  } catch (error) {
    console.error("Get personalization insights error:", error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : "Failed to get insights"
    });
  }
});
router12.post(
  "/preferences",
  requireAuth,
  async (req, res) => {
    try {
      const userId = req.user.id;
      const preferences = req.body;
      const validatedPreferences = validatePersonalizationPreferences(preferences);
      await storage.insights.createInsight({
        userId,
        insightType: "personalization_preferences",
        data: {
          preferences: validatedPreferences,
          updatedAt: (/* @__PURE__ */ new Date()).toISOString(),
          source: "user_input"
        },
        confidence: "1.0"
      });
      const personalizationEngine3 = getPersonalizationEngine();
      const updatedProfile = await personalizationEngine3.analyzeUserPersonalization(userId);
      res.json({
        success: true,
        data: {
          preferences: validatedPreferences,
          profileUpdated: true,
          updatedProfile: {
            workStyle: updatedProfile.workStyle,
            energyPattern: updatedProfile.energyPattern,
            priorityStyle: updatedProfile.priorityStyle,
            planningStyle: updatedProfile.planningStyle
          }
        },
        message: "Personalization preferences updated successfully"
      });
    } catch (error) {
      console.error("Update personalization preferences error:", error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : "Failed to update preferences"
      });
    }
  }
);
var personalization_default = router12;

// server/routes/index.ts
var router13 = Router13();
router13.use("/auth", auth_default);
router13.use("/users", users_default);
router13.use("/goals", goals_default);
router13.use("/objectives", objectives_default);
router13.use("/tasks", tasks_default);
router13.use("/ai", ai_default);
router13.use("/voice", voice_default);
router13.use("/nl", nl_commands_default);
router13.use("/ambient-ai", ambient_ai_default);
router13.use("/suggestions", suggestions_default);
router13.use("/personalization", personalization_default);
var routes_default = router13;

// server/index.ts
init_ai_factory();

// server/config/ai-config.ts
var aiConfig = {
  provider: process.env.AI_PROVIDER || "gemini",
  openai: {
    apiKey: process.env.OPENAI_API_KEY || "",
    model: process.env.OPENAI_MODEL || "gpt-4-turbo-preview",
    maxTokens: parseInt(process.env.OPENAI_MAX_TOKENS || "4096"),
    temperature: parseFloat(process.env.OPENAI_TEMPERATURE || "0.7")
  },
  gemini: {
    apiKey: process.env.GEMINI_API_KEY || "",
    model: process.env.GEMINI_MODEL || "gemini-2.0-flash-exp",
    visionModel: process.env.GEMINI_VISION_MODEL || "gemini-2.0-flash-exp",
    maxTokens: parseInt(process.env.GEMINI_MAX_TOKENS || "8192"),
    temperature: parseFloat(process.env.GEMINI_TEMPERATURE || "0.7")
  },
  fallback: {
    enabled: process.env.AI_FALLBACK_ENABLED === "true",
    maxRetries: parseInt(process.env.AI_FALLBACK_MAX_RETRIES || "1")
  },
  features: {
    multimodal: process.env.AI_MULTIMODAL_ENABLED !== "false",
    conversationalMemory: process.env.AI_CONVERSATIONAL_MEMORY_ENABLED !== "false",
    visualAnalysis: process.env.AI_VISUAL_ANALYSIS_ENABLED !== "false",
    autoSwitch: process.env.AI_AUTO_SWITCH_ENABLED === "true"
  }
};
function validateAIConfig() {
  const errors = [];
  if (!aiConfig.openai.apiKey && !aiConfig.gemini.apiKey) {
    errors.push("At least one AI provider API key must be configured");
  }
  if (aiConfig.provider === "openai" && !aiConfig.openai.apiKey) {
    errors.push("OpenAI API key is required when OpenAI is the selected provider");
  }
  if (aiConfig.provider === "gemini" && !aiConfig.gemini.apiKey) {
    errors.push("Gemini API key is required when Gemini is the selected provider");
  }
  return {
    valid: errors.length === 0,
    errors
  };
}

// server/index.ts
import cors from "cors";
var app = express2();
app.use(cors({}));
app.use(express2.json());
app.use(express2.urlencoded({ extended: false }));
app.use(session({
  secret: process.env.SESSION_SECRET || "your-secret-key-change-this",
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === "production",
    maxAge: 24 * 60 * 60 * 1e3
    // 24 hours
  }
}));
app.use((req, res, next) => {
  const start2 = Date.now();
  const path2 = req.path;
  let capturedJsonResponse = void 0;
  const originalResJson = res.json;
  res.json = function(bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };
  res.on("finish", () => {
    const duration = Date.now() - start2;
    if (path2.startsWith("/api")) {
      let logLine = `${req.method} ${path2} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }
      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "\u2026";
      }
      log(logLine);
    }
  });
  next();
});
app.use("/api", routes_default);
app.use((err, _req, res, _next) => {
  console.error("Unhandled error:", err);
  const status = err.status || err.statusCode || 500;
  const message = err.message || "Internal Server Error";
  res.status(status).json({
    success: false,
    error: message
  });
});
async function initializeAI() {
  console.log("\u{1F680} Initializing AI services...");
  const configValidation = validateAIConfig();
  if (!configValidation.valid) {
    console.error("\u274C AI Configuration validation failed:");
    configValidation.errors.forEach((error) => console.error(`  - ${error}`));
    process.exit(1);
  }
  try {
    if (aiConfig.features.autoSwitch) {
      console.log("\u{1F916} Auto-selecting optimal AI provider...");
      const selectedProvider = await autoSelectAIProvider();
      console.log(`\u2705 Selected AI provider: ${selectedProvider}`);
    } else {
      console.log(`\u{1F916} Using configured AI provider: ${aiConfig.provider}`);
    }
    const testResults = await aiServiceFactory.testProviders();
    console.log("\u{1F4CA} AI Provider Test Results:", testResults);
  } catch (error) {
    console.error("\u274C Failed to initialize AI services:", error);
    if (process.env.NODE_ENV === "production") {
      process.exit(1);
    }
  }
}
async function start() {
  try {
    const dbConnected = await connectDB();
    if (!dbConnected) {
      console.error("\u274C Failed to connect to database");
      process.exit(1);
    }
    const storageInitialized = await storage.initialize();
    if (!storageInitialized) {
      console.error("\u274C Failed to initialize storage layer");
      process.exit(1);
    }
    const server = createServer(app);
    if (process.env.NODE_ENV !== "production") {
      await setupVite(app, server);
    } else {
      serveStatic(app);
    }
    const port = process.env.PORT || 8888;
    server.listen(port, () => {
      console.log(`\u{1F680} Server running on port ${port}`);
      console.log(`\u{1F4CA} Database connected and synchronized`);
      console.log(`\u{1F517} API endpoints available at http://localhost:${port}/api`);
    });
  } catch (error) {
    console.error("\u274C Failed to start server:", error);
    process.exit(1);
  }
}
initializeAI().then(() => {
  const PORT = process.env.PORT || 3e3;
  app.listen(PORT, () => {
    console.log(`\u{1F680} Server running on port ${PORT} with AI provider: ${aiServiceFactory.getCurrentProvider()}`);
  });
});
start();
var index_default = app;
export {
  index_default as default
};
