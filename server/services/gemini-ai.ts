import { GoogleGenerativeAI } from '@google/generative-ai';
import { storage } from '../storage';
import type { DbGoal, DbMonthlyObjective, DbDailyTask, DbUser } from '../db';

// Initialize Gemini client
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export interface GoalDecompositionResult {
  monthlyObjectives: Array<{
    title: string;
    description: string;
    targetMonth: number;
    keyResults: Array<{
      description: string;
      targetValue?: number;
      unit?: string;
    }>;
  }>;
  reasoning: string;
  confidence: number;
}

export interface TaskGenerationResult {
  tasks: Array<{
    title: string;
    description?: string;
    estimatedDuration: number;
    priority: 'low' | 'medium' | 'high' | 'critical';
    suggestedDate?: string;
    suggestedTime?: string;
    tags: string[];
  }>;
  reasoning: string;
  confidence: number;
}

export interface NLProcessingResult {
  intent: 'add_task' | 'modify_task' | 'delete_task' | 'schedule_task' | 'create_goal' | 'create_objective' | 'create_roadmap' | 'ask_question';
  entities: Record<string, any>;
  confidence: number;
  response?: string;
}

export interface ProductivityInsight {
  type: 'task_completion_pattern' | 'optimal_work_hours' | 'task_duration_accuracy' | 'priority_preference' | 'scheduling_preference' | 'goal_progress_pattern';
  title: string;
  description: string;
  actionable_tips: string[];
  confidence: number;
}

export interface ProductivityInsightsResult {
  insights: ProductivityInsight[];
  overall_productivity_score: number;
  summary: string;
  recommendations: string[];
}

export interface ScheduleOptimizationResult {
  optimizedSchedule: Array<{
    taskId: string;
    suggestedTime: string;
    reason: string;
  }>;
  insights: string[];
  productivityScore: number;
}

export interface RoadmapGenerationResult {
  goal: {
    title: string;
    description: string;
    category: string;
    year: number;
    priority: 'low' | 'medium' | 'high' | 'critical';
  };
  objectives: Array<{
    title: string;
    description: string;
    targetMonth: number;
    keyResults: Array<{
      description: string;
      targetValue?: number;
      unit?: string;
    }>;
  }>;
  tasks: Array<{
    title: string;
    description?: string;
    estimatedDuration: number;
    priority: 'low' | 'medium' | 'high' | 'critical';
    scheduledDate: string;
    scheduledTime?: string;
    tags: string[];
    objectiveMonth: number;
  }>;
  reasoning: string;
  confidence: number;
  timeline: {
    startDate: string;
    endDate: string;
    milestones: Array<{
      month: number;
      title: string;
      description: string;
    }>;
  };
}

export class GeminiAIService {
  private model: any;
  private visionModel: any;

  constructor() {
    this.model = genAI.getGenerativeModel({ 
      model: 'gemini-2.0-flash-exp',
      generationConfig: {
        temperature: 0.7,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 8192,
      }
    });
    
    this.visionModel = genAI.getGenerativeModel({ 
      model: 'gemini-2.0-flash-exp' 
    });
  }

  private analyzeProductivityPatterns(completedTasks: any[]): string {
    // Analyze completion patterns by day of week
    const dayPatterns: { [key: string]: number } = {};
    const timePatterns: { [key: string]: number } = {};

    completedTasks.forEach(task => {
      const date = new Date(task.completedAt || task.scheduledDate);
      const dayOfWeek = date.toLocaleDateString('en-US', { weekday: 'long' });
      dayPatterns[dayOfWeek] = (dayPatterns[dayOfWeek] || 0) + 1;

      if (task.scheduledTime) {
        const hour = parseInt(task.scheduledTime.split(':')[0]);
        const timeSlot = hour < 12 ? 'Morning' : hour < 17 ? 'Afternoon' : 'Evening';
        timePatterns[timeSlot] = (timePatterns[timeSlot] || 0) + 1;
      }
    });

    const bestDay = Object.entries(dayPatterns).sort(([,a], [,b]) => b - a)[0];
    const bestTime = Object.entries(timePatterns).sort(([,a], [,b]) => b - a)[0];

    return `
Productivity Patterns:
- Most productive day: ${bestDay ? `${bestDay[0]} (${bestDay[1]} tasks completed)` : 'No clear pattern'}
- Most productive time: ${bestTime ? `${bestTime[0]} (${bestTime[1]} tasks completed)` : 'No clear pattern'}
- Total completed tasks with time data: ${Object.values(timePatterns).reduce((sum, count) => sum + count, 0)}

Day-by-day breakdown:
${Object.entries(dayPatterns).map(([day, count]) => `- ${day}: ${count} tasks`).join('\n')}

Time-slot breakdown:
${Object.entries(timePatterns).map(([time, count]) => `- ${time}: ${count} tasks`).join('\n')}
`;
  }

  private buildProductivityInsightsPrompt(
    user: any, 
    recentTasks: any[], 
    goals: any[], 
    objectives: any[], 
    existingInsights: any[]
  ): string {
    const userContext = `
User Profile:
- Name: ${user.firstName || 'User'} ${user.lastName || ''}
- Timezone: ${user.timezone}
- Working Hours: ${user.preferences?.workingHours?.start || '09:00'} - ${user.preferences?.workingHours?.end || '17:00'}
- Preferred Task Duration: ${user.preferences?.preferredTaskDuration || 30} minutes
- Energy Levels:
  - Morning: ${user.preferences?.energyLevels?.morning || 'medium'}
  - Afternoon: ${user.preferences?.energyLevels?.afternoon || 'medium'}
  - Evening: ${user.preferences?.energyLevels?.evening || 'medium'}
`;

    // Analyze task patterns
    const completedTasks = recentTasks.filter(t => t.status === 'completed');
    const pendingTasks = recentTasks.filter(t => t.status === 'pending');
    const overdueTasks = recentTasks.filter(t => t.status === 'pending' && new Date(t.scheduledDate) < new Date());

    const taskAnalysis = `
Task Analysis (Last 30 Days):
- Total Tasks: ${recentTasks.length}
- Completed Tasks: ${completedTasks.length}
- Pending Tasks: ${pendingTasks.length}
- Overdue Tasks: ${overdueTasks.length}
- Completion Rate: ${recentTasks.length > 0 ? Math.round((completedTasks.length / recentTasks.length) * 100) : 0}%

Task Completion Times:
${completedTasks.slice(0, 10).map(t => `- ${t.title}: ${t.scheduledTime || 'No time'} (${t.estimatedDuration || 'No duration'}min)`).join('\n')}

Priority Distribution:
- Critical: ${recentTasks.filter(t => t.priority === 'critical').length}
- High: ${recentTasks.filter(t => t.priority === 'high').length}
- Medium: ${recentTasks.filter(t => t.priority === 'medium').length}
- Low: ${recentTasks.filter(t => t.priority === 'low').length}

Task Duration Analysis:
${completedTasks.slice(0, 5).map(t => {
  const estimated = t.estimatedDuration || 0;
  const actual = t.actualDuration || estimated;
  const accuracy = estimated > 0 ? Math.round(((estimated - Math.abs(estimated - actual)) / estimated) * 100) : 100;
  return `- ${t.title}: Estimated ${estimated}min, Actual ${actual}min (${accuracy}% accuracy)`;
}).join('\n')}
`;

    const goalAnalysis = `
Goals and Objectives:
- Active Goals: ${goals.filter(g => g.status === 'active').length}
- Completed Goals: ${goals.filter(g => g.status === 'completed').length}
- Active Objectives: ${objectives.filter(o => o.status === 'active').length}
- Average Objective Progress: ${objectives.length > 0 ? Math.round(objectives.reduce((sum, o) => sum + (o.progress || 0), 0) / objectives.length) : 0}%

Recent Goals:
${goals.slice(0, 3).map(g => `- ${g.title} (${g.category}, ${g.status})`).join('\n')}

Recent Objectives Progress:
${objectives.slice(0, 5).map(o => `- ${o.title}: ${o.progress || 0}% complete (Month ${o.targetMonth})`).join('\n')}
`;

    const productivityPatterns = this.analyzeProductivityPatterns(completedTasks);

    return `${userContext}\n${taskAnalysis}\n${goalAnalysis}\n${productivityPatterns}

Please analyze this data to provide actionable productivity insights that will help the user improve their effectiveness and goal achievement.`;
  }

  async generateProductivityInsights(userId: string): Promise<ProductivityInsightsResult> {
    try {
      // Gather user data
      const user = await storage.users.getUserById(userId);
      if (!user) {
        throw new Error('User not found');
      }

      // Get recent tasks, goals, and insights
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      const recentTasks = await storage.tasks.getUserTasks(userId, thirtyDaysAgo, new Date());
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
      
      const insightsResult = JSON.parse(cleanedResponse) as ProductivityInsightsResult;
      this.validateProductivityInsightsResult(insightsResult);
      
      return insightsResult;
    } catch (error) {
      console.error('Error in Gemini productivity insights generation:', error);
      throw new Error(`Failed to generate productivity insights: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  private analyzeProductivityTimes(historicalTasks: any[]): string {
    const timeSlots = {
      'morning': historicalTasks.filter(t => {
        const time = t.scheduledTime;
        return time && time >= '06:00' && time < '12:00';
      }).length,
      'afternoon': historicalTasks.filter(t => {
        const time = t.scheduledTime;
        return time && time >= '12:00' && time < '18:00';
      }).length,
      'evening': historicalTasks.filter(t => {
        const time = t.scheduledTime;
        return time && time >= '18:00' && time < '24:00';
      }).length
    };

    return Object.entries(timeSlots)
      .map(([period, count]) => `- ${period}: ${count} completed tasks`)
      .join('\n');
  }

  private buildScheduleOptimizationPrompt(
    user: any, 
    targetDate: Date, 
    tasksToSchedule: any[], 
    historicalTasks: any[]
  ): string {
    const dateStr = targetDate.toISOString().split('T')[0];
    const dayOfWeek = targetDate.toLocaleDateString('en-US', { weekday: 'long' });

    const userContext = `
User Profile:
- Working Hours: ${user.preferences?.workingHours?.start || '09:00'} - ${user.preferences?.workingHours?.end || '17:00'}
- Energy Levels:
  - Morning: ${user.preferences?.energyLevels?.morning || 'medium'}
  - Afternoon: ${user.preferences?.energyLevels?.afternoon || 'medium'}
  - Evening: ${user.preferences?.energyLevels?.evening || 'medium'}
- Preferred Task Duration: ${user.preferences?.preferredTaskDuration || 30} minutes
- Timezone: ${user.timezone}
`;

    const scheduleContext = `
Schedule Optimization for: ${dateStr} (${dayOfWeek})

Tasks to Schedule:
${tasksToSchedule.map(t => `
- ID: ${t.id}
- Title: ${t.title}
- Duration: ${t.estimatedDuration || 30} minutes
- Priority: ${t.priority || 'medium'}
- Current Time: ${t.scheduledTime || 'Not scheduled'}
- Description: ${t.description || 'No description'}
`).join('')}

Historical Productivity Patterns:
${historicalTasks.slice(0, 10).map(t => `
- Completed: ${t.title} at ${t.scheduledTime || 'No time'} (${t.estimatedDuration || 'Unknown'}min, ${t.priority})
`).join('')}

Peak Productivity Times (based on completed tasks):
${this.analyzeProductivityTimes(historicalTasks)}
`;

    return `${userContext}\n${scheduleContext}

Optimize the schedule for maximum productivity considering user preferences, task priorities, and historical patterns.`;
  }

  /**
   * Optimize schedule for a specific date
   */
  async optimizeSchedule(userId: string, date: Date, tasks: any[]): Promise<ScheduleOptimizationResult> {
    try {
      // Get user data
      const user = await storage.users.getUserById(userId);
      if (!user) {
        throw new Error('User not found');
      }

      // Get historical productivity data
      const sevenDaysAgo = new Date(date);
      sevenDaysAgo.setDate(date.getDate() - 7);
      
      const recentTasks = await storage.tasks.getUserTasks(userId, sevenDaysAgo, date);
      const completedTasks = recentTasks.filter(t => t.status === 'completed');

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
      
      const optimizationResult = JSON.parse(cleanedResponse) as ScheduleOptimizationResult;
      this.validateScheduleOptimizationResult(optimizationResult);
      
      return optimizationResult;
    } catch (error) {
      console.error('Error in Gemini schedule optimization:', error);
      throw new Error(`Failed to optimize schedule: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  public getModel() {
    return this.model;
  }

  public getVisionModel() {
    return this.visionModel;
  }
  /**
   * Decompose an annual goal into monthly objectives with key results
   */
  async decomposeGoal(goal: DbGoal, user: DbUser): Promise<GoalDecompositionResult> {
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
      
      // Clean the response to extract JSON
      const cleanedResponse = this.extractJsonFromResponse(response);
      const decompositionResult = JSON.parse(cleanedResponse) as GoalDecompositionResult;
      
      // Validate the response structure
      this.validateGoalDecompositionResult(decompositionResult);
      
      return decompositionResult;
    } catch (error) {
      console.error('Error in Gemini goal decomposition:', error);
      const errorMessage = (error instanceof Error) ? error.message : String(error);
      throw new Error(`Failed to decompose goal: ${errorMessage}`);
    }
  }

  /**
   * Generate daily tasks from monthly objectives
   */
  async generateTasksFromObjective(
    objective: DbMonthlyObjective, 
    goal: DbGoal, 
    user: DbUser,
    weekNumber: number = 1
  ): Promise<TaskGenerationResult> {
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
      const taskResult = JSON.parse(cleanedResponse) as TaskGenerationResult;
      
      this.validateTaskGenerationResult(taskResult);
      
      return taskResult;
    } catch (error) {
      console.error('Error in Gemini task generation:', error);
      const errorMessage = (error instanceof Error) ? error.message : String(error);
      throw new Error(`Failed to generate tasks: ${errorMessage}`);
    }
  }

  /**
   * Process natural language commands with enhanced NLP including roadmap creation
   */
  async processNaturalLanguage(text: string, user: DbUser, context?: any): Promise<NLProcessingResult> {
    try {
      const prompt = this.buildEnhancedNLProcessingPrompt(text, user, context);
      
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
      
      const parsed = JSON.parse(cleanedResponse) as NLProcessingResult;
      this.validateNLProcessingResult(parsed);
      
      return parsed;
    } catch (error) {
      console.error('Error in Gemini NL processing:', error);
      throw new Error(`Failed to process natural language: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Create a complete roadmap from a natural language prompt
   */
  async createRoadmap(prompt: string, user: DbUser): Promise<RoadmapGenerationResult> {
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
      
      const parsed = JSON.parse(cleanedResponse) as RoadmapGenerationResult;
      this.validateRoadmapResult(parsed);
      
      return parsed;
    } catch (error) {
      console.error('Error in Gemini roadmap generation:', error);
      throw new Error(`Failed to generate roadmap: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  private buildEnhancedNLProcessingPrompt(text: string, user: DbUser, context?: any): string {
    const userContext = `
User Context:
- Name: ${user.firstName || 'User'} ${user.lastName || ''}
- Timezone: ${user.timezone}
- Working Hours: ${user.preferences?.workingHours?.start || '09:00'} - ${user.preferences?.workingHours?.end || '17:00'}
`;

    const contextInfo = context ? `\nAdditional Context: ${JSON.stringify(context)}` : '';

    return `${userContext}${contextInfo}\n\nUser Input: "${text}"`;
  }

  // Private helper methods

  private extractJsonFromResponse(response: string): string {
    // Remove markdown code blocks if present
    let cleaned = response.replace(/```json\n?/g, '').replace(/```\n?/g, '');
    
    // Try to find JSON within the response
    const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return jsonMatch[0];
    }
    
    // If no braces found, assume the entire response is JSON
    return cleaned.trim();
  }

  private buildGoalDecompositionPrompt(goal: DbGoal, user: DbUser): string {
    const userContext = `
User Context:
- Name: ${user.firstName || 'User'} ${user.lastName || ''}
- Timezone: ${user.timezone}
- Working Hours: ${user.preferences?.workingHours?.start || '09:00'} - ${user.preferences?.workingHours?.end || '17:00'}
- Preferred Task Duration: ${user.preferences?.preferredTaskDuration || 30} minutes
- Energy Levels: Morning: ${user.preferences?.energyLevels?.morning || 'medium'}, Afternoon: ${user.preferences?.energyLevels?.afternoon || 'medium'}, Evening: ${user.preferences?.energyLevels?.evening || 'medium'}
`;

    const goalContext = `
Goal to Decompose:
- Title: ${goal.title}
- Description: ${goal.description || 'No description provided'}
- Category: ${goal.category}
- Target Year: ${goal.targetYear}
- Priority: ${goal.priority}
- Current Status: ${goal.status}
`;

    return `${userContext}\n${goalContext}\n\nPlease break down this annual goal into 12 monthly objectives with specific, measurable key results. Consider the user's schedule, preferences, and energy patterns. Make sure the progression is logical and achievable.`;
  }

  private buildTaskGenerationPrompt(objective: DbMonthlyObjective, goal: DbGoal, user: DbUser, weekNumber: number): string {
    const objectiveContext = `
Monthly Objective:
- Title: ${objective.title}
- Description: ${objective.description || 'No description provided'}
- Target Month: ${objective.targetMonth}
- Key Results: ${JSON.stringify(objective.keyResults, null, 2)}
- Current Progress: ${objective.progress}%
`;

    const userContext = `
User Context:
- Working Hours: ${user.preferences?.workingHours?.start || '09:00'} - ${user.preferences?.workingHours?.end || '17:00'}
- Preferred Task Duration: ${user.preferences?.preferredTaskDuration || 30} minutes
- Energy Levels: Morning: ${user.preferences?.energyLevels?.morning || 'medium'}, Afternoon: ${user.preferences?.energyLevels?.afternoon || 'medium'}, Evening: ${user.preferences?.energyLevels?.evening || 'medium'}
`;

    return `${objectiveContext}\n${userContext}\n\nGenerate specific, actionable tasks for week ${weekNumber} of this month that will help achieve the objective and its key results. Consider the user's working hours and energy patterns when suggesting times.`;
  }

  private buildRoadmapPrompt(prompt: string, user: DbUser): string {
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth() + 1;

    const userContext = `
User Context:
- Name: ${user.firstName || 'User'} ${user.lastName || ''}
- Timezone: ${user.timezone}
- Current Date: ${currentDate.toISOString().split('T')[0]}
- Current Year: ${currentYear}
- Current Month: ${currentMonth}
- Working Hours: ${user.preferences?.workingHours?.start || '09:00'} - ${user.preferences?.workingHours?.end || '17:00'}
- Preferred Task Duration: ${user.preferences?.preferredTaskDuration || 30} minutes
- Energy Levels: 
  - Morning: ${user.preferences?.energyLevels?.morning || 'medium'}
  - Afternoon: ${user.preferences?.energyLevels?.afternoon || 'medium'}
  - Evening: ${user.preferences?.energyLevels?.evening || 'medium'}
`;

    return `${userContext}

User's Roadmap Request: "${prompt}"

Create a complete yearly roadmap considering:
- Start from current date: ${currentDate.toISOString().split('T')[0]}
- Current month is ${currentMonth}, adjust timeline accordingly
- User's working hours and energy patterns
- Realistic scheduling and progression
- Include review and planning tasks
- Balance workload appropriately`;
  }

  private validateGoalDecompositionResult(result: any): void {
    if (!result.monthlyObjectives || !Array.isArray(result.monthlyObjectives)) {
      throw new Error('Invalid goal decomposition result: missing monthlyObjectives array');
    }
    if (typeof result.confidence !== 'number' || result.confidence < 0 || result.confidence > 1) {
      throw new Error('Invalid confidence score');
    }
  }

  private validateTaskGenerationResult(result: any): void {
    if (!result.tasks || !Array.isArray(result.tasks)) {
      throw new Error('Invalid task generation result: missing tasks array');
    }
    if (typeof result.confidence !== 'number' || result.confidence < 0 || result.confidence > 1) {
      throw new Error('Invalid confidence score');
    }
  }

  private validateNLProcessingResult(result: any): void {
    const validIntents = [
      'add_task', 
      'modify_task', 
      'delete_task', 
      'schedule_task', 
      'create_goal', 
      'create_objective', 
      'create_roadmap', 
      'ask_question'
    ];
    
    if (!result || typeof result !== 'object') {
      throw new Error('Invalid NL processing result structure');
    }

    if (!result.intent || !validIntents.includes(result.intent)) {
      throw new Error(`Invalid intent in NL processing result: ${result.intent}. Valid intents: ${validIntents.join(', ')}`);
    }

    if (!result.entities || typeof result.entities !== 'object') {
      throw new Error('NL processing result must have entities object');
    }

    if (typeof result.confidence !== 'number' || result.confidence < 0 || result.confidence > 1) {
      throw new Error('Invalid confidence score in NL processing result');
    }
  }

  private validateProductivityInsightsResult(result: any): void {
    if (!result || typeof result !== 'object') {
      throw new Error('Invalid productivity insights result structure');
    }

    if (!Array.isArray(result.insights)) {
      throw new Error('Insights must be an array');
    }

    result.insights.forEach((insight: any, index: number) => {
      if (!insight.type || !insight.title || !insight.description || !Array.isArray(insight.actionable_tips)) {
        throw new Error(`Insight ${index + 1} is missing required fields`);
      }
      if (typeof insight.confidence !== 'number' || insight.confidence < 0 || insight.confidence > 1) {
        throw new Error(`Insight ${index + 1} has invalid confidence score`);
      }
    });

    if (typeof result.overall_productivity_score !== 'number' || 
        result.overall_productivity_score < 0 || 
        result.overall_productivity_score > 100) {
      throw new Error('Invalid overall productivity score');
    }

    if (!Array.isArray(result.recommendations)) {
      throw new Error('Recommendations must be an array');
    }
  }

  private validateScheduleOptimizationResult(result: any): void {
    if (!result || typeof result !== 'object') {
      throw new Error('Invalid schedule optimization result structure');
    }

    if (!Array.isArray(result.optimizedSchedule)) {
      throw new Error('Optimized schedule must be an array');
    }

    result.optimizedSchedule.forEach((item: any, index: number) => {
      if (!item.taskId || !item.suggestedTime || !item.reason) {
        throw new Error(`Schedule item ${index + 1} is missing required fields`);
      }
      
      // Validate time format (HH:MM)
      const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;
      if (!timeRegex.test(item.suggestedTime)) {
        throw new Error(`Schedule item ${index + 1} has invalid time format`);
      }
    });

    if (!Array.isArray(result.insights)) {
      throw new Error('Insights must be an array');
    }

    if (typeof result.productivityScore !== 'number' || 
        result.productivityScore < 0 || 
        result.productivityScore > 100) {
      throw new Error('Invalid productivity score');
    }
  }

  private validateRoadmapResult(result: any): void {
    if (!result || typeof result !== 'object') {
      throw new Error('Invalid roadmap result structure');
    }

    // Validate goal
    if (!result.goal || typeof result.goal !== 'object') {
      throw new Error('Roadmap must have a goal object');
    }

    if (!result.goal.title || typeof result.goal.title !== 'string' || result.goal.title.length < 5) {
      throw new Error('Goal must have a title with at least 5 characters');
    }

    if (!result.goal.category || !['career', 'health', 'personal', 'financial', 'education', 'other'].includes(result.goal.category)) {
      throw new Error('Goal must have a valid category');
    }

    if (!result.goal.year || typeof result.goal.year !== 'number' || result.goal.year < 2024) {
      throw new Error('Goal must have a valid target year');
    }

    if (!result.goal.priority || !['low', 'medium', 'high', 'critical'].includes(result.goal.priority)) {
      throw new Error('Goal must have a valid priority');
    }

    // Validate objectives
    if (!Array.isArray(result.objectives) || result.objectives.length === 0) {
      throw new Error('Roadmap must have at least one objective');
    }

    if (result.objectives.length > 12) {
      throw new Error('Roadmap cannot have more than 12 objectives');
    }

    result.objectives.forEach((obj: any, index: number) => {
      if (!obj.title || typeof obj.title !== 'string') {
        throw new Error(`Objective ${index + 1} must have a title`);
      }

      if (!obj.description || typeof obj.description !== 'string') {
        throw new Error(`Objective ${index + 1} must have a description`);
      }

      if (!obj.targetMonth || typeof obj.targetMonth !== 'number' || obj.targetMonth < 1 || obj.targetMonth > 12) {
        throw new Error(`Objective ${index + 1} must have a valid target month (1-12)`);
      }

      if (!Array.isArray(obj.keyResults) || obj.keyResults.length === 0) {
        throw new Error(`Objective ${index + 1} must have at least one key result`);
      }

      if (obj.keyResults.length > 4) {
        throw new Error(`Objective ${index + 1} cannot have more than 4 key results`);
      }

      obj.keyResults.forEach((kr: any, krIndex: number) => {
        if (!kr.description || typeof kr.description !== 'string') {
          throw new Error(`Objective ${index + 1}, Key Result ${krIndex + 1} must have a description`);
        }

        if (kr.targetValue !== undefined && (typeof kr.targetValue !== 'number' || kr.targetValue < 0)) {
          throw new Error(`Objective ${index + 1}, Key Result ${krIndex + 1} target value must be a positive number`);
        }

        if (kr.unit !== undefined && typeof kr.unit !== 'string') {
          throw new Error(`Objective ${index + 1}, Key Result ${krIndex + 1} unit must be a string`);
        }
      });
    });

    // Validate tasks
    if (!Array.isArray(result.tasks) || result.tasks.length === 0) {
      throw new Error('Roadmap must have at least one task');
    }

    result.tasks.forEach((task: any, index: number) => {
      if (!task.title || typeof task.title !== 'string') {
        throw new Error(`Task ${index + 1} must have a title`);
      }

      if (task.description !== undefined && typeof task.description !== 'string') {
        throw new Error(`Task ${index + 1} description must be a string`);
      }

      if (!task.estimatedDuration || typeof task.estimatedDuration !== 'number' || task.estimatedDuration < 15 || task.estimatedDuration > 480) {
        throw new Error(`Task ${index + 1} must have a valid estimated duration (15-480 minutes)`);
      }

      if (!task.priority || !['low', 'medium', 'high', 'critical'].includes(task.priority)) {
        throw new Error(`Task ${index + 1} must have a valid priority`);
      }

      if (!task.scheduledDate || typeof task.scheduledDate !== 'string') {
        throw new Error(`Task ${index + 1} must have a scheduled date`);
      }

      // Validate date format (YYYY-MM-DD)
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
      if (!dateRegex.test(task.scheduledDate)) {
        throw new Error(`Task ${index + 1} must have a valid date format (YYYY-MM-DD)`);
      }

      // Validate the date is actually valid
      const taskDate = new Date(task.scheduledDate);
      if (isNaN(taskDate.getTime())) {
        throw new Error(`Task ${index + 1} has an invalid date`);
      }

      if (task.scheduledTime !== undefined) {
        if (typeof task.scheduledTime !== 'string') {
          throw new Error(`Task ${index + 1} scheduled time must be a string`);
        }

        // Validate time format (HH:MM)
        const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;
        if (!timeRegex.test(task.scheduledTime)) {
          throw new Error(`Task ${index + 1} must have a valid time format (HH:MM)`);
        }
      }

      if (!Array.isArray(task.tags)) {
        throw new Error(`Task ${index + 1} tags must be an array`);
      }

      if (!task.objectiveMonth || typeof task.objectiveMonth !== 'number' || task.objectiveMonth < 1 || task.objectiveMonth > 12) {
        throw new Error(`Task ${index + 1} must have a valid objective month (1-12)`);
      }

      // Validate that the task's objective month corresponds to an existing objective
      const correspondingObjective = result.objectives.find((obj: any) => obj.targetMonth === task.objectiveMonth);
      if (!correspondingObjective) {
        throw new Error(`Task ${index + 1} references objective month ${task.objectiveMonth} but no objective exists for that month`);
      }
    });

    // Validate reasoning
    if (!result.reasoning || typeof result.reasoning !== 'string' || result.reasoning.length < 20) {
      throw new Error('Roadmap must include reasoning with at least 20 characters');
    }

    // Validate confidence
    if (typeof result.confidence !== 'number' || result.confidence < 0 || result.confidence > 1) {
      throw new Error('Confidence must be a number between 0 and 1');
    }

    // Validate timeline
    if (!result.timeline || typeof result.timeline !== 'object') {
      throw new Error('Roadmap must have a timeline object');
    }

    if (!result.timeline.startDate || typeof result.timeline.startDate !== 'string') {
      throw new Error('Timeline must have a start date');
    }

    if (!result.timeline.endDate || typeof result.timeline.endDate !== 'string') {
      throw new Error('Timeline must have an end date');
    }

    // Validate date formats
    const startDateRegex = /^\d{4}-\d{2}-\d{2}$/;
    const endDateRegex = /^\d{4}-\d{2}-\d{2}$/;
    
    if (!startDateRegex.test(result.timeline.startDate)) {
      throw new Error('Timeline start date must be in YYYY-MM-DD format');
    }

    if (!endDateRegex.test(result.timeline.endDate)) {
      throw new Error('Timeline end date must be in YYYY-MM-DD format');
    }

    // Validate that end date is after start date
    const startDate = new Date(result.timeline.startDate);
    const endDate = new Date(result.timeline.endDate);
    
    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      throw new Error('Timeline dates must be valid dates');
    }

    if (endDate <= startDate) {
      throw new Error('Timeline end date must be after start date');
    }

    // Validate milestones
    if (!Array.isArray(result.timeline.milestones)) {
      throw new Error('Timeline must have a milestones array');
    }

    result.timeline.milestones.forEach((milestone: any, index: number) => {
      if (!milestone.month || typeof milestone.month !== 'number' || milestone.month < 1 || milestone.month > 12) {
        throw new Error(`Milestone ${index + 1} must have a valid month (1-12)`);
      }

      if (!milestone.title || typeof milestone.title !== 'string') {
        throw new Error(`Milestone ${index + 1} must have a title`);
      }

      if (!milestone.description || typeof milestone.description !== 'string') {
        throw new Error(`Milestone ${index + 1} must have a description`);
      }
    });

    // Additional business logic validations
    
    // Check for duplicate objective months
    const objectiveMonths = result.objectives.map((obj: any) => obj.targetMonth);
    const uniqueMonths = new Set(objectiveMonths);
    if (uniqueMonths.size !== objectiveMonths.length) {
      throw new Error('Cannot have multiple objectives for the same month');
    }

    // Check that all tasks fall within the timeline
    const timelineStart = new Date(result.timeline.startDate);
    const timelineEnd = new Date(result.timeline.endDate);

    result.tasks.forEach((task: any, index: number) => {
      const taskDate = new Date(task.scheduledDate);
      if (taskDate < timelineStart || taskDate > timelineEnd) {
        throw new Error(`Task ${index + 1} is scheduled outside the roadmap timeline`);
      }
    });

    // Validate task distribution (ensure tasks are reasonably distributed)
    const tasksByMonth: { [key: number]: number } = {};
    result.tasks.forEach((task: any) => {
      const taskDate = new Date(task.scheduledDate);
      const month = taskDate.getMonth() + 1;
      tasksByMonth[month] = (tasksByMonth[month] || 0) + 1;
    });

    const maxTasksPerMonth = Math.max(...Object.values(tasksByMonth));
    if (maxTasksPerMonth > 50) {
      throw new Error('Too many tasks scheduled for a single month (maximum 50 per month)');
    }
  }}

// Export singleton instance
export const geminiAIService = new GeminiAIService();