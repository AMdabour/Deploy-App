import OpenAI from 'openai';
import { storage } from '../storage';
import type { DbGoal, DbMonthlyObjective, DbDailyTask, DbUser } from '../db';
import { Router } from 'express';
import { requireAuth } from 'server/middleware/auth';
import { getCurrentAIProvider } from '../services/ai-factory';
import { geminiAIService } from './gemini-ai';

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

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
    priority: string;
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

export class AIService {
  
  /**
   * Decompose an annual goal into monthly objectives with key results
   */
  async decomposeGoal(goal: DbGoal, user: DbUser): Promise<GoalDecompositionResult> {
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
        max_tokens: 3000,
        response_format: { type: "json_object" }
      });

      const response = completion.choices[0]?.message?.content;
      if (!response) {
        throw new Error('No response from OpenAI');
      }

      const result = JSON.parse(response) as GoalDecompositionResult;
      
      // Validate the response structure
      this.validateGoalDecompositionResult(result);
      
      return result;
    } catch (error) {
      console.error('Error in goal decomposition:', error);
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
        max_tokens: 2000,
        response_format: { type: "json_object" }
      });

      const response = completion.choices[0]?.message?.content;
      if (!response) {
        throw new Error('No response from OpenAI');
      }

      const result = JSON.parse(response) as TaskGenerationResult;
      this.validateTaskGenerationResult(result);
      
      return result;
    } catch (error) {
      console.error('Error in task generation:', error);
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
        max_tokens: 1000,
        response_format: { type: "json_object" }
      });

      const response = completion.choices[0]?.message?.content;
      if (!response) {
        throw new Error('No response from OpenAI');
      }

      const result = JSON.parse(response) as NLProcessingResult;
      this.validateNLProcessingResult(result);
      
      return result;
    } catch (error) {
      console.error('Error in NL processing:', error);
      const errorMessage = (error instanceof Error) ? error.message : String(error);
      throw new Error(`Failed to process natural language: ${errorMessage}`);
    }
  }

  /**
   * Create a complete roadmap from a natural language prompt
   */
  async createRoadmap(prompt: string, user: DbUser): Promise<RoadmapGenerationResult> {
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
        max_tokens: 4000,
        response_format: { type: "json_object" }
      });

      const response = completion.choices[0]?.message?.content;
      if (!response) {
        throw new Error('No response from OpenAI');
      }

      const result = JSON.parse(response) as RoadmapGenerationResult;
      this.validateRoadmapResult(result);
      
      return result;
    } catch (error) {
      console.error('Error in roadmap generation:', error);
      const errorMessage = (error instanceof Error) ? error.message : String(error);
      throw new Error(`Failed to generate roadmap: ${errorMessage}`);
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

    return `${userContext}${contextInfo}

User Input: "${text}"

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

Create a complete yearly roadmap with:
1. One clear annual goal based on the user's request
2. 12 monthly objectives (or appropriate number if shorter-term)
3. Distributed daily tasks with specific dates and times
4. Realistic scheduling considering user's preferences
5. Progressive difficulty and logical sequencing
6. Buffer time for reviews and adjustments

Consider:
- Start from current date: ${currentDate.toISOString().split('T')[0]}
- Current month is ${currentMonth}, so adjust timeline accordingly
- User's working hours: ${user.preferences?.workingHours?.start || '09:00'} - ${user.preferences?.workingHours?.end || '17:00'}
- Balance tasks across weekdays
- Include review and planning tasks
- Account for holidays and breaks
- Ensure objectives build upon each other`;
  }

  // Validation methods

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

  private validateScheduleOptimizationResult(result: any): void {
    if (!result.optimizedSchedule || !Array.isArray(result.optimizedSchedule)) {
      throw new Error('Invalid schedule optimization result: missing optimizedSchedule array');
    }
    if (typeof result.productivityScore !== 'number' || result.productivityScore < 0 || result.productivityScore > 100) {
      throw new Error('Invalid productivity score');
    }
  }

  private validateRoadmapResult(result: any): void {
    if (!result || typeof result !== 'object') {
      throw new Error('Invalid roadmap result structure');
    }

    // Validate goal
    if (!result.goal || !result.goal.title || !result.goal.category) {
      throw new Error('Goal must have title and category');
    }

    // Validate objectives
    if (!Array.isArray(result.objectives) || result.objectives.length === 0) {
      throw new Error('Must have at least one objective');
    }

    result.objectives.forEach((obj: any, index: number) => {
      if (!obj.title || !obj.targetMonth || !Array.isArray(obj.keyResults)) {
        throw new Error(`Objective ${index + 1} is missing required fields`);
      }
      if (obj.targetMonth < 1 || obj.targetMonth > 12) {
        throw new Error(`Objective ${index + 1} has invalid target month`);
      }
    });

    // Validate tasks
    if (!Array.isArray(result.tasks) || result.tasks.length === 0) {
      throw new Error('Must have at least one task');
    }

    result.tasks.forEach((task: any, index: number) => {
      if (!task.title || !task.scheduledDate || !task.objectiveMonth) {
        throw new Error(`Task ${index + 1} is missing required fields`);
      }
      if (task.estimatedDuration < 5 || task.estimatedDuration > 480) {
        throw new Error(`Task ${index + 1} has invalid duration`);
      }
    });

    // Validate confidence
    if (typeof result.confidence !== 'number' || result.confidence < 0 || result.confidence > 1) {
      throw new Error('Confidence must be a number between 0 and 1');
    }
  }
}

// Export singleton instance
export const aiService = new AIService();

// Express router for AI routes
const router = Router();

// Conversational assistant route
router.post(
  '/conversational-assistant',
  requireAuth,
  async (req, res) => {
    try {
      const userId = (req as any).user.id;
      const { message, conversationHistory = [] } = req.body;

      console.log('Conversational assistant request:', {
        userId,
        message,
        historyLength: conversationHistory.length
      });

      // Input validation
      if (!message || typeof message !== 'string' || message.trim().length === 0) {
        return res.status(400).json({
          success: false,
          error: 'Message is required and must be a non-empty string',
        });
      }

      if (message.length > 2000) {
        return res.status(400).json({
          success: false,
          error: 'Message is too long (max 2000 characters)',
        });
      }

      // Get current AI provider
      const { getCurrentAIProvider } = require('../services/ai-factory');
      const currentProvider = getCurrentAIProvider();
      let result;

      if (currentProvider === 'gemini') {
        const { geminiAIService } = require('../services/gemini-ai');
        result = await geminiAIService.conversationalAssistant(
          userId,
          message,
          conversationHistory
        );
      } else {
        // Fallback to basic response for OpenAI
        result = {
          response: "I understand you're trying to communicate with me. While I can help with specific commands and tasks, advanced conversational features are best experienced with our Gemini AI provider.",
          followUpQuestions: [
            "What specific task would you like help with?",
            "Would you like to see your current goals?",
            "How can I help you stay organized?"
          ]
        };
      }

      // Store conversation for future context (optional)
      try {
        await storage.insights.createInsight({
          userId,
          insightType: 'conversational_interaction',
          data: {
            userMessage: message,
            aiResponse: result.response,
            provider: currentProvider,
            timestamp: new Date().toISOString(),
            conversationLength: conversationHistory.length
          },
          confidence: '0.9',
        });
      } catch (insightError) {
        console.error('Failed to store conversation insight:', insightError);
        // Don't fail the request if insight storage fails
      }

      res.json({
        success: true,
        data: result,
        message: 'Conversational response generated successfully',
      });

    } catch (error) {
      console.error('Conversational assistant error:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to generate response',
      });
    }
  }
);

// Command processing route
router.post(
  '/process-command',
  requireAuth,
  async (req, res) => {
    try {
      const userId = (req as any).user.id;
      const { command, executeCommand = true, context } = req.body;

      console.log('Processing text command:', {
        userId,
        command,
        executeCommand
      });

      // Input validation
      if (!command || typeof command !== 'string' || command.trim().length === 0) {
        return res.status(400).json({
          success: false,
          error: 'Command is required and must be a non-empty string',
        });
      }

      // Get user data
      const user = await storage.users.getUserById(userId);
      if (!user) {
        return res.status(404).json({
          success: false,
          error: 'User not found',
        });
      }

      // Process natural language
      const { getCurrentAIProvider } = require('../services/ai-factory');
      const currentProvider = getCurrentAIProvider();
      let nlpResult;

      if (currentProvider === 'gemini') {
        const { geminiAIService } = require('../services/gemini-ai');
        nlpResult = await geminiAIService.processNaturalLanguage(
          command, 
          user, 
          context
        );
      } else {
        const { aiService } = require('../services/ai');
        nlpResult = await aiService.processNaturalLanguage(
          command, 
          user, 
          context
        );
      }

      // Execute command if requested
      let executionResult = null;
      if (executeCommand && nlpResult.intent !== 'ask_question') {
        try {
          executionResult = await executeCommand(userId, nlpResult);
        } catch (execError) {
          console.error('Command execution error:', execError);
          executionResult = {
            success: false,
            message: `Failed to execute command: ${execError instanceof Error ? execError.message : 'Unknown error'}`
          };
        }
      }

      // Store command for analytics
      try {
        await storage.insights.createInsight({
          userId,
          insightType: 'text_command_usage',
          data: {
            command,
            intent: nlpResult.intent,
            entities: nlpResult.entities,
            executed: executeCommand,
            success: executionResult?.success || false,
            provider: currentProvider,
            timestamp: new Date().toISOString()
          },
          confidence: nlpResult.confidence || '0.8',
        });
      } catch (insightError) {
        console.error('Failed to store command insight:', insightError);
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
        message: 'Command processed successfully',
      });

    } catch (error) {
      console.error('Text command processing error:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to process command',
      });
    }
  }
);


function parseDateString(dateStr: string): Date {
  const today = new Date();
  const lowerDate = dateStr.toLowerCase();

  if (lowerDate === 'today') {
    return today;
  } else if (lowerDate === 'tomorrow') {
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);
    return tomorrow;
  }

  // Handle day names (simple approach)
  const days = [
    'sunday',
    'monday',
    'tuesday',
    'wednesday',
    'thursday',
    'friday',
    'saturday',
  ];
  const dayIndex = days.indexOf(lowerDate);

  if (dayIndex !== -1) {
    const targetDate = new Date(today);
    const currentDay = today.getDay();
    let daysToAdd = dayIndex - currentDay;

    if (daysToAdd <= 0) {
      daysToAdd += 7; // Next week
    }

    targetDate.setDate(today.getDate() + daysToAdd);
    return targetDate;
  }

  return today;
}


async function executeAddTask(userId: string, entities: any): Promise<any> {
  try {
    const { title, description, date, time, duration, priority, objective, goal } = entities;

    if (!title) {
      return { success: false, message: 'Task title is required' };
    }

    // Parse date
    let scheduledDate = new Date();
    if (date) {
      const parsedDate = parseDateString(date);
      if (parsedDate) {
        scheduledDate = parsedDate;
      }
    }

    // Find objective or goal if specified
    let objectiveId = null;
    let goalId = null;

    if (objective) {
      const objectives = await storage.objectives.getUserObjectives(userId);
      const matchedObjective = objectives.find(obj => 
        obj.title.toLowerCase().includes(objective.toLowerCase())
      );
      if (matchedObjective) {
        objectiveId = matchedObjective.id;
        goalId = matchedObjective.goalId;
      }
    }

    if (!objectiveId && goal) {
      const goals = await storage.goals.getUserGoals(userId);
      const matchedGoal = goals.find(g => 
        g.title.toLowerCase().includes(goal.toLowerCase())
      );
      if (matchedGoal) {
        goalId = matchedGoal.id;
      }
    }

    // Create task
    const task = await storage.tasks.createTask({
      userId,
      objectiveId,
      goalId,
      title,
      description: description || '',
      scheduledDate,
      scheduledTime: time || null,
      estimatedDuration: duration || 30,
      priority: priority || 'medium',
      status: 'pending',
      tags: [],
    });

    let linkMessage = '';
    if (objectiveId) {
      linkMessage = ' under your specified objective';
    } else if (goalId) {
      linkMessage = ' under your specified goal';
    }

    return {
      success: true,
      message: `Task "${title}" created successfully${linkMessage}`,
      data: { task }
    };
  } catch (error) {
    console.error('Add task error:', error);
    return {
      success: false,
      message: 'Failed to create task'
    };
  }
}

function normalizeTime(timeStr: string): string {
  // Convert various time formats to HH:MM
  const timeMatch = timeStr.match(/(\d{1,2}):(\d{2})/);
  if (timeMatch) {
    return timeMatch[0];
  }

  const amPmMatch = timeStr.match(/(\d{1,2})\s*(am|pm)/i);
  if (amPmMatch) {
    let hour = parseInt(amPmMatch[1]);
    const isPM = amPmMatch[2].toLowerCase() === 'pm';

    if (isPM && hour !== 12) {
      hour += 12;
    } else if (!isPM && hour === 12) {
      hour = 0;
    }

    return `${hour.toString().padStart(2, '0')}:00`;
  }

  return timeStr;
}


async function executeModifyTask(userId: string, entities: any): Promise<any> {
  try {
    const { taskIdentifier, field, newValue, title } = entities;

    if (!taskIdentifier && !title) {
      return {
        success: false,
        message: 'Please specify which task to modify by title or identifier'
      };
    }

    if (!field || !newValue) {
      return {
        success: false,
        message: 'Please specify what field to change and the new value'
      };
    }

    // Find the task
    let task = null;
    if (taskIdentifier) {
      const userTasks = await storage.tasks.getUserTasks(userId, new Date(0), new Date());
      task = userTasks.find(t => 
        t.title.toLowerCase().includes(taskIdentifier.toLowerCase()) ||
        t.id === taskIdentifier
      );
    } else if (title) {
      const userTasks = await storage.tasks.getUserTasks(userId, new Date(0), new Date());
      task = userTasks.find(t => 
        t.title.toLowerCase().includes(title.toLowerCase())
      );
    }

    if (!task) {
      return {
        success: false,
        message: `Task "${taskIdentifier || title}" not found`
      };
    }

    // Prepare update data based on field
    const updateData: any = {};
    
    switch (field.toLowerCase()) {
      case 'title':
        updateData.title = newValue;
        break;
      case 'description':
        updateData.description = newValue;
        break;
      case 'priority':
        if (['low', 'medium', 'high', 'critical'].includes(newValue.toLowerCase())) {
          updateData.priority = newValue.toLowerCase();
        } else {
          return {
            success: false,
            message: 'Priority must be: low, medium, high, or critical'
          };
        }
        break;
      case 'time':
      case 'scheduledtime':
        updateData.scheduledTime = normalizeTime(newValue);
        break;
      case 'date':
      case 'scheduleddate':
        const parsedDate = parseDateString(newValue);
        if (parsedDate) {
          updateData.scheduledDate = parsedDate;
        } else {
          return {
            success: false,
            message: 'Invalid date format'
          };
        }
        break;
      case 'duration':
      case 'estimatedduration':
        const duration = parseInt(newValue);
        if (isNaN(duration) || duration <= 0) {
          return {
            success: false,
            message: 'Duration must be a positive number (in minutes)'
          };
        }
        updateData.estimatedDuration = duration;
        break;
      case 'status':
        if (['pending', 'in_progress', 'completed', 'cancelled', 'rescheduled'].includes(newValue.toLowerCase())) {
          updateData.status = newValue.toLowerCase();
        } else {
          return {
            success: false,
            message: 'Status must be: pending, in_progress, completed, cancelled, or rescheduled'
          };
        }
        break;
      case 'location':
        updateData.location = newValue;
        break;
      default:
        return {
          success: false,
          message: `Cannot modify field: ${field}. Supported fields: title, description, priority, time, date, duration, status, location`
        };
    }

    // Update the task
    const updatedTask = await storage.tasks.updateTask(task.id, updateData);

    return {
      success: true,
      message: `Task "${task.title}" updated successfully`,
      data: { task: updatedTask }
    };
  } catch (error) {
    console.error('Modify task error:', error);
    return {
      success: false,
      message: 'Failed to modify task'
    };
  }
}

async function executeDeleteTask(userId: string, entities: any): Promise<any> {
  try {
    const { taskIdentifier, title } = entities;

    if (!taskIdentifier && !title) {
      return {
        success: false,
        message: 'Please specify which task to delete by title or identifier'
      };
    }

    // Find the task
    let task = null;
    const userTasks = await storage.tasks.getUserTasks(userId, new Date(0), new Date());
    
    if (taskIdentifier) {
      task = userTasks.find(t => 
        t.title.toLowerCase().includes(taskIdentifier.toLowerCase()) ||
        t.id === taskIdentifier
      );
    } else if (title) {
      task = userTasks.find(t => 
        t.title.toLowerCase().includes(title.toLowerCase())
      );
    }

    if (!task) {
      return {
        success: false,
        message: `Task "${taskIdentifier || title}" not found`
      };
    }

    // Confirm deletion for safety
    const taskTitle = task.title;
    
    // Delete the task
    await storage.tasks.deleteTask(task.id);

    return {
      success: true,
      message: `Task "${taskTitle}" deleted successfully`,
      data: { deletedTaskId: task.id }
    };
  } catch (error) {
    console.error('Delete task error:', error);
    return {
      success: false,
      message: 'Failed to delete task'
    };
  }
}

async function executeQuestion(userId: string, entities: any): Promise<any> {
  // Implementation for answering questions
  return { success: true, message: 'Question answering via AI not yet implemented' };
}


// Helper function for command execution
async function executeCommand(userId: string, nlResult: any): Promise<any> {
  try {
    switch (nlResult.intent) {
      case 'add_task':
        return await executeAddTask(userId, nlResult.entities);
      case 'modify_task':
        return await executeModifyTask(userId, nlResult.entities);
      case 'delete_task':
        return await executeDeleteTask(userId, nlResult.entities);
      // case 'schedule_task':
      //   return await executeScheduleTask(userId, nlResult.entities);
      case 'create_goal':
        return await executeCreateGoal(userId, nlResult.entities);
      case 'create_objective':
        return await executeCreateObjective(userId, nlResult.entities);
      case 'create_roadmap':
        return await executeCreateRoadmap(userId, nlResult.entities);
      case 'ask_question':
        return await executeQuestion(userId, nlResult.entities);
      default:
        return {
          success: false,
          message: `Unknown command intent: ${nlResult.intent}`
        };
    }
  } catch (error) {
    return {
      success: false,
      message: 'Failed to execute command',
      error: error instanceof Error ? error.message : 'Failed to execute command'
    };
  }
}

// Add the missing execution functions

async function executeCreateGoal(userId: string, entities: any): Promise<any> {
  try {
    const { title, description, category, year, priority } = entities;

    if (!title) {
      return { 
        success: false, 
        message: 'Goal title is required. Please specify what you want to achieve.' 
      };
    }

    const goalData = {
      userId,
      title,
      description: description || `Goal to ${title}`,
      category: category || 'personal',
      targetYear: year || new Date().getFullYear(),
      priority: priority || 'medium',
      status: 'active' as const,
    };

    const goal = await storage.goals.createGoal(goalData);

    return {
      success: true,
      message: `🎯 Goal "${title}" created successfully for ${goalData.targetYear}!`,
      data: { goalId: goal.id, goal }
    };
  } catch (error) {
    console.error('Create goal error:', error);
    return {
      success: false,
      message: `Failed to create goal: ${error instanceof Error ? error.message : 'Unknown error'}`
    };
  }
}

async function executeCreateObjective(userId: string, entities: any): Promise<any> {
  try {
    const { title, description, month, year, goal: goalName } = entities;

    if (!title) {
      return { 
        success: false, 
        message: 'Objective title is required. Please specify what you want to achieve this month.' 
      };
    }

    // Try to find an active goal to link to
    const goals = await storage.goals.getUserGoals(userId);
    let goalId = null;

    if (goalName) {
      // Look for a goal that matches the specified name
      const matchingGoal = goals.find(g => 
        g.status === 'active' && 
        g.title.toLowerCase().includes(goalName.toLowerCase())
      );
      if (matchingGoal) {
        goalId = matchingGoal.id;
      }
    }

    if (!goalId) {
      // Use the most recent active goal
      const activeGoals = goals.filter(g => g.status === 'active');
      if (activeGoals.length === 0) {
        return { 
          success: false, 
          message: 'Please create a goal first before adding objectives. Try: "create a goal [your goal title]"' 
        };
      }
      goalId = activeGoals[0].id;
    }

    const objectiveData = {
      userId,
      goalId,
      title,
      description: description || `Objective to ${title}`,
      targetMonth: month || new Date().getMonth() + 1,
      targetYear: year || new Date().getFullYear(),
      keyResults: [],
      status: 'active' as const,
      progress: '0',
    };

    const objective = await storage.objectives.createObjective(objectiveData);

    const monthNames = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    const monthName = monthNames[objectiveData.targetMonth - 1];

    return {
      success: true,
      message: `📋 Objective "${title}" created successfully for ${monthName} ${objectiveData.targetYear}!`,
      data: { objectiveId: objective.id, objective }
    };
  } catch (error) {
    console.error('Create objective error:', error);
    return {
      success: false,
      message: `Failed to create objective: ${error instanceof Error ? error.message : 'Unknown error'}`
    };
  }
}

async function executeCreateRoadmap(userId: string, entities: any): Promise<any> {
  try {
    const { prompt, description } = entities;

    if (!prompt && !description) {
      return { 
        success: false, 
        message: 'Please provide a description of what you want to achieve. For example: "create roadmap to become a software developer"' 
      };
    }

    const roadmapPrompt = prompt || description;

    // Get user data
    const user = await storage.users.getUserById(userId);
    if (!user) {
      return { success: false, message: 'User not found' };
    }

    // Generate roadmap using the current AI service
    const { getCurrentAIProvider } = require('../services/ai-factory');
    const currentProvider = getCurrentAIProvider();
    let roadmapResult;

    if (currentProvider === 'gemini') {
      const { geminiAIService } = require('../services/gemini-ai');
      roadmapResult = await geminiAIService.createRoadmap(roadmapPrompt, user);
    } else {
      roadmapResult = await aiService.createRoadmap(roadmapPrompt, user);
    }

    // Execute the roadmap creation (this would call the roadmap creation logic)
    const executionResult = await executeRoadmapCreation(userId, roadmapResult);

    if (executionResult.success) {
      const goalTitle = roadmapResult.goal.title;
      const objectiveCount = roadmapResult.objectives.length;
      const taskCount = roadmapResult.tasks.length;
      
      return {
        success: true,
        message: `🗺️ Complete roadmap created successfully! 

**"${goalTitle}"** 
📊 Created: ${objectiveCount} objectives, ${taskCount} tasks
🎯 Category: ${roadmapResult.goal.category}
📈 Priority: ${roadmapResult.goal.priority}

Your yearly roadmap is now active and ready to guide your journey!`,
        data: { 
          roadmap: roadmapResult,
          execution: executionResult
        }
      };
    } else {
      return {
        success: false,
        message: `Failed to create roadmap: ${executionResult.message || 'Unknown error occurred'}`,
        data: { 
          roadmap: roadmapResult,
          execution: executionResult
        }
      };
    }
  } catch (error) {
    console.error('Create roadmap error:', error);
    return {
      success: false,
      message: `Failed to create roadmap: ${error instanceof Error ? error.message : 'An unexpected error occurred'}`
    };
  }
}

// Helper function to execute roadmap creation in the database
async function executeRoadmapCreation(userId: string, roadmapResult: any): Promise<any> {
  try {
    // Create the goal
    const goal = await storage.goals.createGoal({
      userId,
      title: roadmapResult.goal.title,
      description: roadmapResult.goal.description,
      category: roadmapResult.goal.category,
      targetYear: roadmapResult.goal.year,
      priority: roadmapResult.goal.priority,
      status: 'active',
    });

    // Create objectives
    const objectives = [];
    for (const objData of roadmapResult.objectives) {
      const objective = await storage.objectives.createObjective({
        userId,
        goalId: goal.id,
        title: objData.title,
        description: objData.description,
        targetMonth: objData.targetMonth,
        targetYear: roadmapResult.goal.year,
        keyResults: objData.keyResults,
        status: 'active',
        progress: '0',
      });
      objectives.push(objective);
    }

    // Create tasks
    const tasks = [];
    for (const taskData of roadmapResult.tasks) {
      // Find the corresponding objective
      const relatedObjective = objectives.find(obj => obj.targetMonth === taskData.objectiveMonth);
      
      const task = await storage.tasks.createTask({
        userId,
        objectiveId: relatedObjective?.id,
        goalId: goal.id,
        title: taskData.title,
        description: taskData.description,
        scheduledDate: new Date(taskData.scheduledDate),
        scheduledTime: taskData.scheduledTime,
        estimatedDuration: taskData.estimatedDuration,
        priority: taskData.priority,
        tags: taskData.tags,
        status: 'pending',
      });
      tasks.push(task);
    }

    return {
      success: true,
      message: 'Roadmap created successfully',
      data: {
        goal,
        objectives,
        tasks,
        stats: {
          goalId: goal.id,
          objectiveCount: objectives.length,
          taskCount: tasks.length
        }
      }
    };
  } catch (error) {
    console.error('Roadmap execution error:', error);
    return {
      success: false,
      message: `Failed to create roadmap in database: ${error instanceof Error ? error.message : 'Unknown error'}`
    };
  }
}

// ...existing functions (executeAddTask, executeModifyTask, etc.)...