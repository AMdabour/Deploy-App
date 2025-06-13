import { Router, Request, Response } from 'express';
import { storage } from '../storage';
import { getAIService, getCurrentAIProvider, switchAIProvider, testAIProviders, aiServiceFactory } from '../services/ai-factory';
import {geminiAIService} from '../services/gemini-ai';
import { z } from 'zod';
import { validateRequest } from '../middleware/validation';
import { requireAuth } from '../middleware/auth';
import { v4 as uuidv4 } from 'uuid';

const router = Router();

const OptimizeScheduleSchema = z.object({
  date: z.string().transform(str => new Date(str)),
  taskIds: z.array(z.string().uuid()).optional(),
});

// Schema definitions
const DecomposeGoalSchema = z.object({
  goalId: z.string().uuid(),
});

const GenerateTasksSchema = z.object({
  objectiveId: z.string().uuid(),
  weekNumber: z.number().int().min(1).max(4).default(1),
});

const Schema = z.object({
  date: z.string().transform(str => new Date(str)),
  taskIds: z.array(z.string().uuid()).optional(),
});

const ProcessNLSchema = z.object({
  text: z.string().min(1),
  context: z.record(z.any()).optional(),
});

const SwitchProviderSchema = z.object({
  provider: z.enum(['openai', 'gemini']),
});

const CreateRoadmapSchema = z.object({
  prompt: z.string().min(10).max(1000),
  autoExecute: z.boolean().default(false),
});

// GET /api/ai/provider/status - Get current AI provider and capabilities
router.get('/provider/status', requireAuth, async (req: Request, res: Response) => {
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
    console.error('Get provider status error:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get provider status'
    });
  }
});

// POST /api/ai/provider/switch - Switch AI provider
router.post('/provider/switch', requireAuth, validateRequest(SwitchProviderSchema), async (req: Request, res: Response) => {
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
    
    const { aiService, ambientService } = switchAIProvider(provider);
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
    console.error('Switch provider error:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to switch AI provider'
    });
  }
});

// GET /api/ai/provider/test - Test AI providers
router.get('/provider/test', requireAuth, async (req: Request, res: Response) => {
  try {
    const testResults = await testAIProviders();
    
    res.json({
      success: true,
      data: testResults,
      message: 'AI provider testing completed'
    });
  } catch (error) {
    console.error('Test providers error:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to test AI providers'
    });
  }
});

// POST /api/ai/decompose-goal - Updated to use factory
router.post('/decompose-goal', requireAuth, validateRequest(DecomposeGoalSchema), async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const { goalId } = req.body;

    // Get the goal and verify ownership
    const goal = await storage.goals.getGoalById(goalId);
    if (!goal || goal.userId !== userId) {
      return res.status(404).json({
        success: false,
        error: 'Goal not found'
      });
    }

    // Get user data
    const user = await storage.users.getUserById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    // Check if goal is already decomposed
    if (goal.aiDecomposed) {
      const existingObjectives = await storage.objectives.getGoalObjectives(goalId);
      if (existingObjectives.length > 0) {
        return res.json({
          success: true,
          data: { 
            message: 'Goal already decomposed',
            objectives: existingObjectives,
            provider: getCurrentAIProvider()
          }
        });
      }
    }

    // Use AI Factory to decompose the goal with automatic fallback
    const aiService = getAIService();
    const decompositionResult = await aiServiceFactory.executeWithFallback(
      async (service) => await service.decomposeGoal(goal, user)
    );

    // Create the monthly objectives in the database
    const createdObjectives = [];
    for (const objData of decompositionResult.monthlyObjectives) {
      // Add IDs to key results
      interface KeyResultInput {
        title: string;
        description: string;
        targetValue: number;
        unit?: string;
      }

      interface KeyResult extends KeyResultInput {
        id: string;
        currentValue: number;
        completed: boolean;
      }

      const keyResultsWithIds: KeyResult[] = objData.keyResults.map((kr: KeyResultInput): KeyResult => ({
        ...kr,
        id: uuidv4(),
        currentValue: 0,
        completed: false,
      }));

      const objective = await storage.objectives.createObjective({
        goalId,
        userId,
        title: objData.title,
        description: objData.description,
        targetMonth: objData.targetMonth,
        targetYear: goal.targetYear,
        keyResults: keyResultsWithIds,
      });

      createdObjectives.push(objective);
    }

    // Mark goal as AI decomposed
    await storage.goals.markGoalAsDecomposed(goalId);

    // Store AI insight with provider information
    await storage.insights.createInsight({
      userId,
      insightType: 'goal_progress_pattern',
      data: {
        goalId,
        decompositionStrategy: decompositionResult.reasoning,
        objectiveCount: createdObjectives.length,
        aiConfidence: decompositionResult.confidence,
        aiProvider: getCurrentAIProvider(),
        generatedAt: new Date().toISOString()
      },
      confidence: decompositionResult.confidence.toString(),
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
    console.error('Goal decomposition error:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to decompose goal'
    });
  }
});

// POST /api/ai/generate-tasks - Updated to use factory
router.post('/generate-tasks', requireAuth, validateRequest(GenerateTasksSchema), async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const { objectiveId, weekNumber } = req.body;

    // Get the objective and verify ownership
    const objective = await storage.objectives.getObjectiveById(objectiveId);
    if (!objective || objective.userId !== userId) {
      return res.status(404).json({
        success: false,
        error: 'Objective not found'
      });
    }

    // Get related goal and user data
    const goal = await storage.goals.getGoalById(objective.goalId);
    const user = await storage.users.getUserById(userId);
    
    if (!goal || !user) {
      return res.status(404).json({
        success: false,
        error: 'Required data not found'
      });
    }

    // Generate tasks using AI Factory with automatic fallback
    const taskResult = await aiServiceFactory.executeWithFallback(
      async (service) => await service.generateTasksFromObjective(objective, goal, user, weekNumber)
    );

    // Create the tasks in the database
    const createdTasks = [];
    for (const taskData of taskResult.tasks) {
      const task = await storage.tasks.createTask({
        objectiveId,
        goalId: objective.goalId,
        userId,
        title: taskData.title,
        description: taskData.description,
        scheduledDate: taskData.suggestedDate ? new Date(taskData.suggestedDate) : new Date(),
        scheduledTime: taskData.suggestedTime,
        estimatedDuration: taskData.estimatedDuration,
        priority: taskData.priority,
        tags: taskData.tags,
      });

      createdTasks.push(task);
    }

    // Store AI insight with provider information
    await storage.insights.createInsight({
      userId,
      insightType: 'scheduling_preference',
      data: {
        objectiveId,
        weekNumber,
        generatedTaskCount: createdTasks.length,
        reasoning: taskResult.reasoning,
        aiConfidence: taskResult.confidence,
        aiProvider: getCurrentAIProvider(),
        generatedAt: new Date().toISOString()
      },
      confidence: taskResult.confidence.toString(),
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
    console.error('Task generation error:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to generate tasks'
    });
  }
});

// POST /api/ai/optimize-schedule
router.post('/optimize-schedule', requireAuth, validateRequest(OptimizeScheduleSchema), async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const { date, taskIds } = req.body;

    // Get tasks for the specified date
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    let tasks = await storage.tasks.getUserTasks(userId, startOfDay, endOfDay);

    // Filter by specific task IDs if provided
    if (taskIds && taskIds.length > 0) {
      tasks = tasks.filter(task => taskIds.includes(task.id));
    }

    if (tasks.length === 0) {
      return res.json({
        success: true,
        data: { 
          optimizedSchedule: [],
          insights: ['No tasks found for the specified date'],
          productivityScore: 0
        },
        message: 'No tasks to optimize'
      });
    }

    // Use AI to optimize the schedule
    const optimizationResult = await geminiAIService.optimizeSchedule(userId, date, tasks) as any;

    // Apply the optimization suggestions (update task times)
    const updatedTasks = [];
    if (optimizationResult?.optimizedSchedule) {
      for (const suggestion of optimizationResult.optimizedSchedule) {
      const task = tasks.find(t => t.id === suggestion.taskId);
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

    // Store AI insight
    await storage.insights.createInsight({
      userId,
      insightType: 'optimal_work_hours',
      data: {
        date: date.toISOString(),
        optimizedTaskCount: updatedTasks.length,
        insights: optimizationResult.insights,
        productivityScore: optimizationResult.productivityScore,
      },
      confidence: (0.8).toString(),
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
  }} catch (error) {
    console.error('Schedule optimization error:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to optimize schedule'
    });
    }
  });

// POST /api/ai/process-nl
router.post('/process-nl', requireAuth, validateRequest(ProcessNLSchema), async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const { text, context } = req.body;

    // Get user data
    const user = await storage.users.getUserById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    // Process natural language using AI
    const nlResult = await geminiAIService.processNaturalLanguage(text, user, context);

    // Store the command
    const command = await storage.commands.createCommand({
      userId,
      originalText: text,
      parsedIntent: nlResult.intent,
      extractedEntities: nlResult.entities,
      confidence: nlResult.confidence.toString(),
    });

    // Execute the command if confidence is high enough
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
      message: 'Natural language command processed'
    });
  } catch (error) {
    console.error('NL processing error:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to process natural language'
    });
  }
});

// GET /api/ai/productivity-insights
router.get('/productivity-insights', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;

    // Generate productivity insights using AI
    const insights = await geminiAIService.generateProductivityInsights(userId);

    // Store each insight in the database
    for (const insight of insights.insights) {
      await storage.insights.createInsight({
        userId,
        insightType: insight.type as any,
        data: {
          title: insight.title,
          description: insight.description,
          actionable_tips: insight.actionable_tips,
          overall_score: insights
        },
        confidence: insight.confidence.toString(),
      });
    }

    res.json({
      success: true,
      data: insights,
      message: 'Productivity insights generated'
    });
  } catch (error) {
    console.error('Productivity insights error:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to generate productivity insights'
    });
  }
});

// // POST /api/ai/smart-recommendations
// router.post('/smart-recommendations', requireAuth, async (req: Request, res: Response) => {
//   try {
//     const userId = (req as any).user.id;
//     const { type, context } = req.body;

//     // Get user data and recent insights
//     const user = await storage.users.getUserById(userId);
//     const insights = await storage.insights.getUserInsights(userId);
//     const goals = await storage.goals.getUserGoals(userId);

//     if (!user) {
//       return res.status(404).json({
//         success: false,
//         error: 'User not found'
//       });
//     }

//     // Generate smart recommendations based on type
//     let recommendations = [];
//     switch (type) {
//       case 'daily_schedule':
//         recommendations = await generateDailyScheduleRecommendations(userId, insights);
//         break;
//       case 'goal_prioritization':
//         recommendations = await generateGoalPrioritizationRecommendations(goals, insights);
//         break;
//       case 'productivity_tips':
//         recommendations = await generateProductivityTipsRecommendations(user, insights);
//         break;
//       default:
//         return res.status(400).json({
//           success: false,
//           error: 'Invalid recommendation type'
//         });
//     }

//     res.json({
//       success: true,
//       data: { recommendations },
//       message: `Generated ${recommendations.length} ${type} recommendations`
//     });
//   } catch (error) {
//     console.error('Smart recommendations error:', error);
//     res.status(500).json({
//       success: false,
//       error: error instanceof Error ? error.message : 'Failed to generate recommendations'
//     });
//   }
// });

// POST /api/ai/create-roadmap - Create complete roadmap from prompt
router.post('/create-roadmap', requireAuth, validateRequest(CreateRoadmapSchema), async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const { prompt, autoExecute } = req.body;

    // Get user data
    const user = await storage.users.getUserById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    // Generate roadmap using AI Factory with automatic fallback
    const roadmapResult = await aiServiceFactory.executeWithFallback(
      async (service) => await service.createRoadmap(prompt, user)
    );

    let executionResult = null;
    if (autoExecute) {
      executionResult = await executeRoadmapCreation(userId, roadmapResult);
    }

    // Store AI insight
    await storage.insights.createInsight({
      userId,
      insightType: 'goal_progress_pattern',
      data: {
        roadmapPrompt: prompt,
        generatedGoal: roadmapResult.goal.title,
        objectiveCount: roadmapResult.objectives.length,
        taskCount: roadmapResult.tasks.length,
        aiConfidence: roadmapResult.confidence,
        aiProvider: getCurrentAIProvider(),
        autoExecuted: autoExecute,
        generatedAt: new Date().toISOString()
      },
      confidence: roadmapResult.confidence.toString(),
    });

    res.json({
      success: true,
      data: { 
        roadmap: roadmapResult,
        execution: executionResult,
        provider: getCurrentAIProvider()
      },
      message: autoExecute 
        ? `Roadmap created and executed successfully! Created 1 goal, ${roadmapResult.objectives.length} objectives, and ${roadmapResult.tasks.length} tasks.`
        : `Roadmap generated successfully using ${getCurrentAIProvider()}`
    });
  } catch (error) {
    console.error('Roadmap creation error:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create roadmap'
    });
  }
});

// Helper function to execute roadmap creation
async function executeRoadmapCreation(userId: string, roadmap: any): Promise<any> {
  try {
    const results: {
      goal: any;
      objectives: any[];
      tasks: any[];
      errors: string[];
    } = {
      goal: null,
      objectives: [],
      tasks: [],
      errors: []
    };

    // 1. Create the goal
    try {
      const goal = await storage.goals.createGoal({
        userId,
        title: roadmap.goal.title,
        description: roadmap.goal.description,
        category: roadmap.goal.category,
        targetYear: roadmap.goal.year,
        priority: roadmap.goal.priority,
        status: 'active',
      });
      results.goal = goal;
    } catch (error) {
      results.errors.push(`Failed to create goal: ${error instanceof Error ? error.message : 'Unknown error'}`);
      throw error; // Stop execution if goal creation fails
    }

    // 2. Create objectives
    for (const objData of roadmap.objectives) {
      try {
        const objective = await storage.objectives.createObjective({
          userId,
          goalId: results.goal.id,
          title: objData.title,
          description: objData.description,
          targetMonth: objData.targetMonth,
          targetYear: roadmap.goal.year,
          keyResults: objData.keyResults.map((kr: any) => ({
                  id: uuidv4(),
                  description: kr.description,
                  targetValue: kr.targetValue || 0,
                  currentValue: 0,
                  unit: kr.unit || '',
                  completed: false,
                  })),
          status: 'active',
        });
        results.objectives.push(objective);
      } catch (error) {
        results.errors.push(`Failed to create objective "${objData.title}": ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    // 3. Create tasks
    for (const taskData of roadmap.tasks) {
      try {
        // Find the corresponding objective
        const correspondingObjective = results.objectives.find(obj => {
          // Find objective by matching target month with task's objective month
          return obj.targetMonth === taskData.objectiveMonth;
        });

        const task = await storage.tasks.createTask({
          userId,
          objectiveId: correspondingObjective?.id || null,
          goalId: results.goal.id,
          title: taskData.title,
          description: taskData.description || '',
          scheduledDate: new Date(taskData.scheduledDate),
          scheduledTime: taskData.scheduledTime || null,
          estimatedDuration: taskData.estimatedDuration,
          priority: taskData.priority,
          status: 'pending',
          tags: taskData.tags || [],
        });
        results.tasks.push(task);
      } catch (error) {
        results.errors.push(`Failed to create task "${taskData.title}": ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    return {
      success: true,
      message: `Roadmap executed successfully! Created 1 goal, ${results.objectives.length} objectives, and ${results.tasks.length} tasks.`,
      data: results
    };
  } catch (error) {
    console.error('Roadmap execution error:', error);
    return {
      success: false,
      message: 'Failed to execute roadmap',
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

        async function executeAICreateRoadmap(userId: string, entities: any): Promise<any> {
          try {
            const { prompt, description, autoExecute } = entities;

            if (!prompt && !description) {
              return { 
                success: false, 
                message: 'Please provide a description or prompt for the roadmap you want to create' 
              };
            }

            // Get user data
            const user = await storage.users.getUserById(userId);
            if (!user) {
              return {
                success: false,
                message: 'User not found'
              };
            }

            // Use the prompt from entities, fallback to description
            const roadmapPrompt = prompt || description || '';

            // Generate roadmap using AI Factory with automatic fallback
            const roadmapResult = await aiServiceFactory.executeWithFallback(
              async (service) => await service.createRoadmap(roadmapPrompt, user)
            );

            // Auto-execute if specified or if confidence is high
            const shouldAutoExecute = autoExecute || (roadmapResult.confidence > 0.8);
            
            let executionResult = null;
            if (shouldAutoExecute) {
              executionResult = await executeRoadmapCreation(userId, roadmapResult);
            }

            // Store AI insight
            await storage.insights.createInsight({
              userId,
              insightType: 'goal_progress_pattern',
              data: {
                roadmapPrompt,
                generatedGoal: roadmapResult.goal.title,
                objectiveCount: roadmapResult.objectives.length,
                taskCount: roadmapResult.tasks.length,
                aiConfidence: roadmapResult.confidence,
                aiProvider: getCurrentAIProvider(),
                autoExecuted: shouldAutoExecute,
                executedViaCommand: true,
                generatedAt: new Date().toISOString()
              },
              confidence: roadmapResult.confidence.toString(),
            });

            let message = '';
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
            console.error('Create roadmap command error:', error);
            return {
              success: false,
              message: 'Failed to create roadmap',
              error: error instanceof Error ? error.message : 'Unknown error'
            };
          }
        }

        // ✅ NEW: Add entity transformation function
export function transformModifyTaskEntities(entities: any): any {
  console.log('🔍 Transforming entities:', entities);
  
  const transformed: any = {};

  // ✅ Extract task identifier from various fields
  if (entities.original_title) {
    transformed.taskIdentifier = entities.original_title;
    transformed.title = entities.original_title;
  } else if (entities.task_title) {
    transformed.taskIdentifier = entities.task_title;
    transformed.title = entities.task_title;
  } else if (entities.task) {
    transformed.taskIdentifier = entities.task;
    transformed.title = entities.task;
  } else if (entities.task_name) {
    transformed.taskIdentifier = entities.task_name;
    transformed.title = entities.task_name;
  }

  // ✅ Detect what field is being changed and set field/newValue
  if (entities.title && entities.original_title && entities.title !== entities.original_title) {
    transformed.field = 'title';
    transformed.newValue = entities.title;
  } else if (entities.title && entities.task && entities.title !== entities.task) {
    transformed.field = 'title';
    transformed.newValue = entities.title;
  } else if (entities.priority) {
    transformed.field = 'priority';
    transformed.newValue = entities.priority;
  } else if (entities.status) {
    transformed.field = 'status';
    transformed.newValue = entities.status;
  } else if (entities.scheduled_date || entities.date) {
    transformed.field = 'scheduledDate';
    transformed.newValue = entities.scheduled_date || entities.date;
  } else if (entities.scheduled_time || entities.time) {
    transformed.field = 'scheduledTime';
    transformed.newValue = entities.scheduled_time || entities.time;
  } else if (entities.duration || entities.estimated_duration) {
    transformed.field = 'estimatedDuration';
    transformed.newValue = entities.duration || entities.estimated_duration;
  } else if (entities.description) {
    transformed.field = 'description';
    transformed.newValue = entities.description;
  } else if (entities.location) {
    transformed.field = 'location';
    transformed.newValue = entities.location;
  }

  // ✅ If no specific field detected, try to infer from entities
  if (!transformed.field || !transformed.newValue) {
    // Copy all entity fields for fallback processing
    Object.assign(transformed, entities);
  }

  console.log('✅ Final transformed entities:', transformed);
  return transformed;
}

// Enhanced executeAICommand function to support roadmap creation
async function executeAICommand(userId: string, nlResult: any): Promise<any> {
  try {
    switch (nlResult.intent) {
      case 'add_task':
        return await executeAIAddTask(userId, nlResult.entities);
      case 'create_goal':
        return await executeAICreateGoal(userId, nlResult.entities);
      case 'create_objective':
        return await executeAICreateObjective(userId, nlResult.entities);
      case 'create_roadmap':
        return await executeAICreateRoadmap(userId, nlResult.entities);
      case 'modify_task':
        try {
          console.log('🔧 Processing modify task with entities:', nlResult.entities);
          
          // ✅ Transform entities to match expected format
          const transformedEntities = transformModifyTaskEntities(nlResult.entities);
          
          console.log('🔄 Transformed entities:', transformedEntities);
          
          const modifyResult = await executeAIModifyTask(userId, transformedEntities);
          
          return {
            success: true,
            data: {
              parsed: nlResult,
              execution: modifyResult, // Use 'execution' instead of 'result'
              response: modifyResult.message
            }
          };
        } catch (error) {
          console.error('Modify task execution error:', error);
          return {
            success: false,
            data: {
              parsed: nlResult,
              execution: { success: false, message: 'Failed to modify task' },
              response: 'Failed to modify task'
            }
          };
        }
      case 'delete_task':
        return await executeAIDeleteTask(userId, nlResult.entities);
      case 'schedule_task':
        return await executeAIScheduleTask(userId, nlResult.entities);
      case 'ask_question':
        return await executeAIQuestion(userId, nlResult.entities);
      default:
        return {
          success: false,
          message: 'Unknown command intent'
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

async function executeAICreateGoal(userId: string, entities: any): Promise<any> {
  try {
    const { title, description, category, year, priority } = entities;

    if (!title) {
      return { success: false, message: 'Goal title is required' };
    }

    const goal = await storage.goals.createGoal({
      userId,
      title,
      description: description || '',
      category: category || 'personal',
      targetYear: year || new Date().getFullYear(),
      priority: priority || 'medium',
      status: 'active',
    });

    return {
      success: true,
      message: `Goal "${title}" created successfully`,
      data: { goal }
    };
  } catch (error) {
    console.error('Create goal error:', error);
    return {
      success: false,
      message: 'Failed to create goal'
    };
  }
}

async function executeAICreateObjective(userId: string, entities: any): Promise<any> {
  try {
    const { title, description, goal, month, year } = entities;

    if (!title) {
      return { success: false, message: 'Objective title is required' };
    }

    // Find goal by name
    let goalId = null;
    if (goal) {
      const goals = await storage.goals.getUserGoals(userId);
      const matchedGoal = goals.find(g => 
        g.title.toLowerCase().includes(goal.toLowerCase())
      );
      if (matchedGoal) {
        goalId = matchedGoal.id;
      }
    }

    if (!goalId) {
      return { 
        success: false, 
        message: 'Please specify which goal this objective belongs to, or create a goal first' 
      };
    }

    const objective = await storage.objectives.createObjective({
      userId,
      goalId,
      title,
      description: description || '',
      targetMonth: month || new Date().getMonth() + 1,
      targetYear: year || new Date().getFullYear(),
      keyResults: [],
      status: 'active',
    });

    return {
      success: true,
      message: `Objective "${title}" created successfully under your goal`,
      data: { objective }
    };
  } catch (error) {
    console.error('Create objective error:', error);
    return {
      success: false,
      message: 'Failed to create objective'
    };
  }
}

async function executeAIAddTask(userId: string, entities: any): Promise<any> {
  try {
    const { title, description, date, time, duration, priority, objective, goal } = entities;

    if (!title) {
      return { success: false, message: 'Task title is required' };
    }

    // Parse date
    let scheduledDate = new Date();
    if (date) {
      const parsedDate = parseDate(date);
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

// async function executeAIModifyTask(userId: string, entities: any): Promise<any> {
//   try {
//     const { taskIdentifier, field, newValue, title } = entities;

//     if (!taskIdentifier && !title) {
//       return {
//         success: false,
//         message: 'Please specify which task to modify by title or identifier'
//       };
//     }

//     if (!field || !newValue) {
//       return {
//         success: false,
//         message: 'Please specify what field to change and the new value'
//       };
//     }

//     // Find the task
//     let task = null;
//     if (taskIdentifier) {
//       const userTasks = await storage.tasks.getUserTasks(userId, new Date(0), new Date());
//       task = userTasks.find(t => 
//         t.title.toLowerCase().includes(taskIdentifier.toLowerCase()) ||
//         t.id === taskIdentifier
//       );
//     } else if (title) {
//       const userTasks = await storage.tasks.getUserTasks(userId, new Date(0), new Date());
//       task = userTasks.find(t => 
//         t.title.toLowerCase().includes(title.toLowerCase())
//       );
//     }

//     if (!task) {
//       return {
//         success: false,
//         message: `Task "${taskIdentifier || title}" not found`
//       };
//     }

//     // Prepare update data based on field
//     const updateData: any = {};
    
//     switch (field.toLowerCase()) {
//       case 'title':
//         updateData.title = newValue;
//         break;
//       case 'description':
//         updateData.description = newValue;
//         break;
//       case 'priority':
//         if (['low', 'medium', 'high', 'critical'].includes(newValue.toLowerCase())) {
//           updateData.priority = newValue.toLowerCase();
//         } else {
//           return {
//             success: false,
//             message: 'Priority must be: low, medium, high, or critical'
//           };
//         }
//         break;
//       case 'time':
//       case 'scheduledtime':
//         updateData.scheduledTime = normalizeTime(newValue);
//         break;
//       case 'date':
//       case 'scheduleddate':
//         const parsedDate = parseDate(newValue);
//         if (parsedDate) {
//           updateData.scheduledDate = parsedDate;
//         } else {
//           return {
//             success: false,
//             message: 'Invalid date format'
//           };
//         }
//         break;
//       case 'duration':
//       case 'estimatedduration':
//         const duration = parseInt(newValue);
//         if (isNaN(duration) || duration <= 0) {
//           return {
//             success: false,
//             message: 'Duration must be a positive number (in minutes)'
//           };
//         }
//         updateData.estimatedDuration = duration;
//         break;
//       case 'status':
//         if (['pending', 'in_progress', 'completed', 'cancelled', 'rescheduled'].includes(newValue.toLowerCase())) {
//           updateData.status = newValue.toLowerCase();
//         } else {
//           return {
//             success: false,
//             message: 'Status must be: pending, in_progress, completed, cancelled, or rescheduled'
//           };
//         }
//         break;
//       case 'location':
//         updateData.location = newValue;
//         break;
//       default:
//         return {
//           success: false,
//           message: `Cannot modify field: ${field}. Supported fields: title, description, priority, time, date, duration, status, location`
//         };
//     }

//     // Update the task
//     const updatedTask = await storage.tasks.updateTask(task.id, updateData);

//     return {
//       success: true,
//       message: `Task "${task.title}" updated successfully`,
//       data: { task: updatedTask }
//     };
//   } catch (error) {
//     console.error('Modify task error:', error);
//     return {
//       success: false,
//       message: 'Failed to modify task'
//     };
//   }
// }

// Replace the executeAIModifyTask function with this enhanced version:

async function executeAIModifyTask(userId: string, entities: any): Promise<any> {
  try {
    console.log('🔍 ModifyTask entities received:', JSON.stringify(entities, null, 2));
    
    const { original_title, field, newValue, title, originalText, date, time, priority, status, duration, description } = entities;

    // ✅ STEP 1: Find the task using multiple strategies
    let task = null;
    let searchTerm = original_title || title || '';

    console.log('🔍 Searching for task with identifier:', searchTerm);
    // If no explicit task identifier, try to extract from original text
    if (!searchTerm && originalText) {
      searchTerm = extractTaskFromText(originalText);
    }

    if (!searchTerm) {
      return {
        success: false,
        message: 'Please specify which task to modify. For example: "Change task meeting priority to high" or "Update workout to tomorrow"'
      };
    }

    // Find the task with fuzzy matching
    task = await findTaskByTitle(userId, searchTerm);
    
    if (!task) {
      // Get all user tasks to show available options
      const userTasks = await storage.tasks.getUserTasks(userId, new Date(0), new Date());
      const taskTitles = userTasks.slice(0, 5).map(t => `"${t.title}"`).join(', ');
      
      return {
        success: false,
        message: `❌ I couldn't find a task matching "${searchTerm}". ${userTasks.length > 0 ? `Available tasks: ${taskTitles}${userTasks.length > 5 ? '...' : ''}` : 'You have no tasks yet.'}`
      };
    }

    // ✅ STEP 2: Enhanced field and value detection from entities
    let detectedField = field;
    let detectedValue = newValue;

    // ✅ NEW: Check for direct entity fields (this is what was missing!)
    if (!detectedField || !detectedValue) {
      if (date) {
        detectedField = 'scheduledDate';
        detectedValue = date;
        console.log('✅ Found date from entities:', date);
      } else if (time) {
        detectedField = 'scheduledTime';
        detectedValue = time;
        console.log('✅ Found time from entities:', time);
      } else if (priority) {
        detectedField = 'priority';
        detectedValue = priority;
        console.log('✅ Found priority from entities:', priority);
      } else if (status) {
        detectedField = 'status';
        detectedValue = status;
        console.log('✅ Found status from entities:', status);
      } else if (duration) {
        detectedField = 'estimatedDuration';
        detectedValue = duration;
        console.log('✅ Found duration from entities:', duration);
      } else if (description) {
        detectedField = 'description';
        detectedValue = description;
        console.log('✅ Found description from entities:', description);
      }
    }

    // ✅ STEP 3: If still no field/value, try to extract from original text
    if ((!detectedField || !detectedValue) && originalText) {
      const extracted = extractFieldAndValueFromText(originalText, task.title);
      if (extracted.field && extracted.value) {
        detectedField = extracted.field;
        detectedValue = extracted.value;
        console.log('✅ Extracted from text:', extracted);
      }
    }

    // ✅ STEP 4: Smart inference for common patterns
    if (!detectedField || !detectedValue) {
      // Try to infer from the entities we have
      const inferredResult = inferFieldAndValue(entities, originalText);
      if (inferredResult.field && inferredResult.value) {
        detectedField = inferredResult.field;
        detectedValue = inferredResult.value;
        console.log('✅ Inferred field/value:', inferredResult);
      }
    }

    if (!detectedField || !detectedValue) {
      return {
        success: false,
        message: `❌ Please specify what to change about "${task.title}". Examples:\n• "Change priority to high"\n• "Move to tomorrow"\n• "Set duration to 60 minutes"\n• "Mark as completed"`
      };
    }

    // ✅ STEP 5: Normalize and validate the field and value
    const normalizedField = normalizeField(detectedField);
    const normalizedValue = await normalizeValue(normalizedField, detectedValue);

    if (!normalizedField) {
      return {
        success: false,
        message: `❌ Cannot modify "${detectedField}". Supported fields: title, description, priority, date, time, duration, status, location`
      };
    }

    // ✅ STEP 6: Validate the value
    const validation = validateFieldValue(normalizedField, normalizedValue);
    if (!validation.valid) {
      return {
        success: false,
        message: validation.message
      };
    }

    // ✅ STEP 7: Update the task
    const updateData: any = {};
    updateData[normalizedField] = normalizedValue;

    console.log(`🔧 Updating task "${task.title}" - ${normalizedField}: ${normalizedValue}`);
    
    const updatedTask = await storage.tasks.updateTask(task.id, updateData);

    return {
      success: true,
      message: `✅ Successfully updated "${task.title}" - ${getFieldDisplayName(normalizedField)} changed to "${getValueDisplayText(normalizedField, normalizedValue)}"`,
      data: { task: updatedTask }
    };
  } catch (error) {
    console.error('❌ Modify task error:', error);
    return {
      success: false,
      message: 'Failed to modify task: ' + (error instanceof Error ? error.message : 'Unknown error')
    };
  }
}

// ✅ NEW: Smart inference function for common patterns
export function inferFieldAndValue(entities: any, originalText: string = ''): { field: string; value: string } {
  console.log('🔍 Inferring field/value from entities:', entities);
  
  // Check all possible entity fields
  const entityChecks = [
    { condition: entities.date, field: 'scheduledDate', value: entities.date },
    { condition: entities.time, field: 'scheduledTime', value: entities.time },
    { condition: entities.priority, field: 'priority', value: entities.priority },
    { condition: entities.status, field: 'status', value: entities.status },
    { condition: entities.duration, field: 'estimatedDuration', value: entities.duration },
    { condition: entities.description, field: 'description', value: entities.description },
    { condition: entities.location, field: 'location', value: entities.location },
  ];

  for (const check of entityChecks) {
    if (check.condition) {
      console.log(`✅ Inferred: ${check.field} = ${check.value}`);
      return { field: check.field, value: check.value };
    }
  }

  // If we have originalText, try to infer from common patterns
  if (originalText) {
    const text = originalText.toLowerCase();
    
    // Common modification patterns
    const patterns = [
      { regex: /move.*?to\s+(.*?)(?:\s|$)/, field: 'scheduledDate' },
      { regex: /reschedule.*?(?:to|for)\s+(.*?)(?:\s|$)/, field: 'scheduledDate' },
      { regex: /set.*?time.*?(?:to|at)\s+(.*?)(?:\s|$)/, field: 'scheduledTime' },
      { regex: /change.*?time.*?(?:to|at)\s+(.*?)(?:\s|$)/, field: 'scheduledTime' },
      { regex: /make.*?(high|medium|low|critical)/, field: 'priority' },
      { regex: /set.*?priority.*?(?:to|as)\s+(high|medium|low|critical)/, field: 'priority' },
      { regex: /mark.*?(?:as|to)\s+(completed|pending|in_progress|cancelled)/, field: 'status' },
      { regex: /set.*?duration.*?(?:to|for)\s+(\d+)/, field: 'estimatedDuration' },
    ];

    for (const pattern of patterns) {
      const match = text.match(pattern.regex);
      if (match && match[1]) {
        console.log(`✅ Pattern matched: ${pattern.field} = ${match[1]}`);
        return { field: pattern.field, value: match[1].trim() };
      }
    }

    // Special case: if we just have a date/time word, infer it's a schedule change
    if (/(today|tomorrow|monday|tuesday|wednesday|thursday|friday|saturday|sunday|next\s+\w+)/.test(text)) {
      const dateMatch = text.match(/(today|tomorrow|monday|tuesday|wednesday|thursday|friday|saturday|sunday|next\s+\w+)/);
      if (dateMatch) {
        console.log(`✅ Date pattern inferred: scheduledDate = ${dateMatch[0]}`);
        return { field: 'scheduledDate', value: dateMatch[0] };
      }
    }
  }

  console.log('❌ Could not infer field/value');
  return { field: '', value: '' };
}

// ✅ Enhanced extractFieldAndValueFromText function
export function extractFieldAndValueFromText(text: string, taskTitle: string): { field: string; value: string } {
  const lowerText = text.toLowerCase();
  
  // Remove task title from text to avoid confusion
  const cleanText = lowerText.replace(taskTitle.toLowerCase(), '').trim();
  
  console.log('🔍 Extracting field and value from:', cleanText);
  
  // ✅ Enhanced date patterns (this should catch your "tomorrow" case)
  if (cleanText.includes('date') || cleanText.includes('reschedule') || cleanText.includes('move') || cleanText.includes('schedule') || 
      /(today|tomorrow|monday|tuesday|wednesday|thursday|friday|saturday|sunday|next\s+\w+)/.test(cleanText)) {
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
      /(?:move|reschedule|schedule).*?(next\s+\w+)/,
    ];
    
    for (const pattern of datePatterns) {
      const match = cleanText.match(pattern);
      if (match) {
        console.log('✅ Found date:', match[1] || match[0]);
        return { field: 'scheduledDate', value: match[1] || match[0] };
      }
    }
  }

  // Priority patterns
  if (cleanText.includes('priority') || /\b(high|medium|low|critical)\s+priority\b/.test(cleanText)) {
    const priorityMatch = cleanText.match(/\b(high|medium|low|critical)\b/);
    if (priorityMatch) {
      console.log('✅ Found priority:', priorityMatch[1]);
      return { field: 'priority', value: priorityMatch[1] };
    }
  }

  // Status patterns - enhanced
  if (cleanText.includes('status') || cleanText.includes('mark') || cleanText.includes('complete')) {
    const statusPatterns = [
      /\b(completed|pending|in_progress|cancelled|done|finished)\b/,
      /mark.*?as\s+(completed|pending|in_progress|cancelled|done|finished)/,
      /set.*?to\s+(completed|pending|in_progress|cancelled|done|finished)/
    ];
    
    for (const pattern of statusPatterns) {
      const match = cleanText.match(pattern);
      if (match) {
        let status = match[1];
        if (status === 'done' || status === 'finished') status = 'completed';
        console.log('✅ Found status:', status);
        return { field: 'status', value: status };
      }
    }
  }

  // Time patterns - enhanced
  if (cleanText.includes('time') && !cleanText.includes('duration')) {
    const timePatterns = [
      /(?:to|at|for)\s+(\d{1,2}:?\d{0,2}\s*(?:am|pm)?)/,
      /(?:to|at|for)\s+(\d{1,2}\s*(?:am|pm))/,
      /(\d{1,2}:?\d{0,2}\s*(?:am|pm))/,
      /(\d{1,2}\s*(?:am|pm))/,
    ];
    
    for (const pattern of timePatterns) {
      const match = cleanText.match(pattern);
      if (match) {
        console.log('✅ Found time:', match[1]);
        return { field: 'scheduledTime', value: match[1] };
      }
    }
  }

  // Duration patterns - enhanced
  if (cleanText.includes('duration') || cleanText.includes('minutes') || cleanText.includes('hours')) {
    const durationPatterns = [
      /(\d+)\s*(?:minutes?|mins?)/,
      /(\d+)\s*(?:hours?|hrs?)/,
      /duration.*?(\d+)/,
      /(?:to|for)\s+(\d+)\s*(?:minutes?|mins?|hours?|hrs?)/,
    ];
    
    for (const pattern of durationPatterns) {
      const match = cleanText.match(pattern);
      if (match) {
        let duration = parseInt(match[1]);
        if (cleanText.includes('hour')) duration *= 60;
        console.log('✅ Found duration:', duration);
        return { field: 'estimatedDuration', value: duration.toString() };
      }
    }
  }

  // Title patterns - enhanced
  if (cleanText.includes('title') || cleanText.includes('name') || cleanText.includes('rename')) {
    const titlePatterns = [
      /(?:title|name|rename)(?:\s+to|\s+as)?\s+["']?([^"']+?)["']?$/,
      /(?:to|as)\s+["']?([^"']+?)["']?$/,
    ];
    
    for (const pattern of titlePatterns) {
      const match = cleanText.match(pattern);
      if (match) {
        console.log('✅ Found title:', match[1].trim());
        return { field: 'title', value: match[1].trim() };
      }
    }
  }

  // Location patterns
  if (cleanText.includes('location') || cleanText.includes('where') || cleanText.includes('place')) {
    const locationMatch = cleanText.match(/(?:location|where|place)(?:\s+to|\s+at)?\s+["']?([^"']+?)["']?$/);
    if (locationMatch) {
      console.log('✅ Found location:', locationMatch[1].trim());
      return { field: 'location', value: locationMatch[1].trim() };
    }
  }

  console.log('❌ No field/value extracted from:', cleanText);
  return { field: '', value: '' };
}

// ✅ The rest of the helper functions remain the same...
// (normalizeField, normalizeValue, validateFieldValue, formatDateString, formatTimeString, etc.)

export function extractTaskFromText(text: string): string {
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
    /["']([^"']+)["']/i,
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match && match[1] && match[1].length > 2) {
      return match[1].trim();
    }
  }

  // Fallback: extract words between action and field keywords
  const actionWords = ['change', 'modify', 'update', 'edit', 'set', 'mark', 'move', 'reschedule'];
  const fieldWords = ['priority', 'date', 'time', 'status', 'title', 'duration', 'location', 'to', 'as', 'for'];
  
  const words = text.toLowerCase().split(/\s+/);
  let startIndex = -1;
  let endIndex = -1;

  // Find action word
  for (let i = 0; i < words.length; i++) {
    if (actionWords.some(action => words[i].includes(action))) {
      startIndex = i + 1;
      if (words[i + 1] === 'task') startIndex = i + 2;
      break;
    }
  }

  // Find field word or connector
  if (startIndex !== -1) {
    for (let i = startIndex; i < words.length; i++) {
      if (fieldWords.some(field => words[i].includes(field))) {
        endIndex = i;
        break;
      }
    }
  }

  if (startIndex !== -1 && endIndex !== -1 && endIndex > startIndex) {
    return words.slice(startIndex, endIndex).join(' ');
  }

  return '';
}

export async function findTaskByTitle(userId: string, titleQuery: string): Promise<any | null> {
  try {
    const userTasks = await storage.tasks.getUserTasks(userId, new Date(0), new Date());
    
    if (userTasks.length === 0) return null;
    
    const query = titleQuery.toLowerCase().trim();
    
    // 1. Exact match first
    let task = userTasks.find(t => t.title.toLowerCase() === query);
    if (task) return task;
    
    // 2. Starts with match
    task = userTasks.find(t => t.title.toLowerCase().startsWith(query));
    if (task) return task;
    
    // 3. Contains match
    task = userTasks.find(t => t.title.toLowerCase().includes(query));
    if (task) return task;
    
    // 4. Word-based matching
    const queryWords = query.split(/\s+/);
    task = userTasks.find(t => {
      const titleWords = t.title.toLowerCase().split(/\s+/);
      return queryWords.every(word => 
        titleWords.some(titleWord => titleWord.includes(word) || word.includes(titleWord))
      );
    });
    if (task) return task;
    
    // 5. Fuzzy matching (simple similarity)
    const bestMatch = userTasks.reduce<{ task: any | null; similarity: number }>((best, current) => {
      const similarity = calculateSimilarity(query, current.title.toLowerCase());
      return similarity > best.similarity && similarity > 0.6 ? 
        { task: current, similarity } : best;
    }, { task: null, similarity: 0 });
    
    return bestMatch.task;
  } catch (error) {
    console.error('Error finding task by title:', error);
    return null;
  }
}

function calculateSimilarity(str1: string, str2: string): number {
  const longer = str1.length > str2.length ? str1 : str2;
  const shorter = str1.length > str2.length ? str2 : str1;
  if (longer.length === 0) return 1.0;
  return (longer.length - editDistance(longer, shorter)) / longer.length;
}

function editDistance(str1: string, str2: string): number {
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
export function normalizeField(field: string): string {
  const fieldMap: { [key: string]: string } = {
    'title': 'title',
    'name': 'title',
    'description': 'description',
    'desc': 'description',
    'priority': 'priority',
    'prio': 'priority',
    'status': 'status',
    'state': 'status',
    'date': 'scheduledDate',
    'scheduleddate': 'scheduledDate',
    'scheduled_date': 'scheduledDate',
    'time': 'scheduledTime',
    'scheduledtime': 'scheduledTime',
    'scheduled_time': 'scheduledTime',
    'duration': 'estimatedDuration',
    'estimatedduration': 'estimatedDuration',
    'estimated_duration': 'estimatedDuration',
    'location': 'location',
    'place': 'location',
    'where': 'location',
  };

  const normalized = field.toLowerCase().replace(/[^a-z]/g, '');
  return fieldMap[normalized] || '';
}

export async function normalizeValue(field: string, value: string): Promise<string> {
  switch (field) {
    case 'priority':
      const priorities = ['low', 'medium', 'high', 'critical'];
      const normalizedPriority = value.toLowerCase();
      return priorities.includes(normalizedPriority) ? normalizedPriority : 'medium';
      
    case 'status':
      const statusMap: { [key: string]: string } = {
        'done': 'completed',
        'finished': 'completed',
        'complete': 'completed',
        'todo': 'pending',
        'in progress': 'in_progress',
        'working': 'in_progress',
        'active': 'in_progress',
        'cancelled': 'cancelled',
        'canceled': 'cancelled',
        'rescheduled': 'rescheduled'
      };
      return statusMap[value.toLowerCase()] || value.toLowerCase();
      
    case 'scheduledDate':
      return formatDateString(value);
      
    case 'scheduledTime':
      return formatTimeString(value);
      
    case 'estimatedDuration':
      const duration = parseInt(value);
      return isNaN(duration) ? '30' : duration.toString();
      
    default:
      return value;
  }
}

export function validateFieldValue(field: string, value: string): { valid: boolean; message: string } {
  switch (field) {
    case 'priority':
      const validPriorities = ['low', 'medium', 'high', 'critical'];
      if (!validPriorities.includes(value)) {
        return {
          valid: false,
          message: `❌ Priority must be one of: ${validPriorities.join(', ')}`
        };
      }
      break;
      
    case 'status':
      const validStatuses = ['pending', 'in_progress', 'completed', 'cancelled', 'rescheduled'];
      if (!validStatuses.includes(value)) {
        return {
          valid: false,
          message: `❌ Status must be one of: ${validStatuses.join(', ')}`
        };
      }
      break;
      
    case 'estimatedDuration':
      const duration = parseInt(value);
      if (isNaN(duration) || duration <= 0) {
        return {
          valid: false,
          message: '❌ Duration must be a positive number (in minutes)'
        };
      }
      break;
      
    case 'title':
      if (value.length < 1 || value.length > 200) {
        return {
          valid: false,
          message: '❌ Title must be between 1 and 200 characters'
        };
      }
      break;
  }
  
  return { valid: true, message: '' };
}

function formatDateString(dateStr: string): string {
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  
  switch (dateStr.toLowerCase().trim()) {
    case 'today':
      return today.toISOString().split('T')[0];
    case 'tomorrow':
      return tomorrow.toISOString().split('T')[0];
    case 'yesterday':
      return yesterday.toISOString().split('T')[0];
    default:
      // Handle weekdays
      const weekdays = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
      const dayIndex = weekdays.indexOf(dateStr.toLowerCase());
      if (dayIndex !== -1) {
        const targetDate = getNextWeekday(dayIndex);
        return targetDate.toISOString().split('T')[0];
      }
      
      // Try to parse as date
      const parsed = new Date(dateStr);
      return isNaN(parsed.getTime()) ? today.toISOString().split('T')[0] : parsed.toISOString().split('T')[0];
  }
}

function formatTimeString(timeStr: string): string {
  // Remove spaces and convert to lowercase
  const cleaned = timeStr.toLowerCase().replace(/\s/g, '');
  
  // Handle AM/PM format
  if (cleaned.includes('am') || cleaned.includes('pm')) {
    const isPM = cleaned.includes('pm');
    const timeOnly = cleaned.replace(/[ap]m/, '');
    
    let [hours, minutes = '00'] = timeOnly.split(':');
    let hourNum = parseInt(hours);
    
    if (isPM && hourNum !== 12) {
      hourNum += 12;
    } else if (!isPM && hourNum === 12) {
      hourNum = 0;
    }
    
    return `${hourNum.toString().padStart(2, '0')}:${minutes.padStart(2, '0')}`;
  }
  
  // Handle 24-hour format
  if (cleaned.includes(':')) {
    const [hours, minutes] = cleaned.split(':');
    return `${hours.padStart(2, '0')}:${minutes.padStart(2, '0')}`;
  }
  
  // Handle just hour number
  const hourNum = parseInt(cleaned);
  if (!isNaN(hourNum) && hourNum >= 0 && hourNum <= 23) {
    return `${hourNum.toString().padStart(2, '0')}:00`;
  }
  
  return timeStr; // Return original if can't parse
}

export function getFieldDisplayName(field: string): string {
  const displayNames: { [key: string]: string } = {
    'title': 'title',
    'description': 'description',
    'priority': 'priority',
    'status': 'status',
    'scheduledDate': 'date',
    'scheduledTime': 'time',
    'estimatedDuration': 'duration',
    'location': 'location'
  };
  
  return displayNames[field] || field;
}

export function getValueDisplayText(field: string, value: string): string {
  switch (field) {
    case 'scheduledDate':
      const date = new Date(value);
      return date.toLocaleDateString();
    case 'scheduledTime':
      return value;
    case 'estimatedDuration':
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


async function executeAIDeleteTask(userId: string, entities: any): Promise<any> {
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

async function executeAIScheduleTask(userId: string, entities: any): Promise<any> {
  try {
    const { taskIdentifier, title, date, time } = entities;

    if (!taskIdentifier && !title) {
      return {
        success: false,
        message: 'Please specify which task to schedule by title or identifier'
      };
    }

    if (!date && !time) {
      return {
        success: false,
        message: 'Please specify when to schedule the task (date and/or time)'
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

    // Prepare update data
    const updateData: any = {};
    
    if (date) {
      const parsedDate = parseDate(date);
      if (parsedDate) {
        updateData.scheduledDate = parsedDate;
      } else {
        return {
          success: false,
          message: 'Invalid date format'
        };
      }
    }
    
    if (time) {
      updateData.scheduledTime = normalizeTime(time);
    }

    // Update the task
    const updatedTask = await storage.tasks.updateTask(task.id, updateData);

    const dateStr = updateData.scheduledDate ? 
      updateData.scheduledDate.toLocaleDateString() : 
      'current date';
    const timeStr = updateData.scheduledTime || 'no specific time';

    return {
      success: true,
      message: `Task "${task.title}" scheduled for ${dateStr} at ${timeStr}`,
      data: { task: updatedTask }
    };
  } catch (error) {
    console.error('Schedule task error:', error);
    return {
      success: false,
      message: 'Failed to schedule task'
    };
  }
}

async function executeAIQuestion(userId: string, entities: any): Promise<any> {
  try {
    const { questionType, subject, timeframe } = entities;

    switch (questionType) {
      case 'count':
        return await handleAICountQuestion(userId, entities);
      case 'time':
        return await handleAITimeQuestion(userId, entities);
      case 'next_task':
        return await handleAINextTaskQuestion(userId, entities);
      case 'progress':
        return await handleAIProgressQuestion(userId, entities);
      case 'schedule':
        return await handleAIScheduleQuestion(userId, entities);
      case 'stats':
        return await handleAIStatsQuestion(userId, entities);
      default:
        return await handleAIGeneralQuestion(userId, entities);
    }
  } catch (error) {
    console.error('Question processing error:', error);
    return {
      success: false,
      message: 'Failed to process question'
    };
  }
}

// Helper functions for question handling
async function handleAICountQuestion(userId: string, entities: any): Promise<any> {
  const { subject, status, timeframe } = entities;
  
  try {
    let count = 0;
    let description = '';

    if (subject?.includes('task')) {
      const startDate = timeframe === 'today' ? new Date() : new Date(0);
      const endDate = timeframe === 'today' ? new Date() : new Date();
      
      const tasks = await storage.tasks.getUserTasks(userId, startDate, endDate);
      
      if (status) {
        const filteredTasks = tasks.filter(t => t.status === status);
        count = filteredTasks.length;
        description = `You have ${count} ${status} tasks${timeframe ? ` for ${timeframe}` : ''}`;
      } else {
        count = tasks.length;
        description = `You have ${count} total tasks${timeframe ? ` for ${timeframe}` : ''}`;
      }
    } else if (subject?.includes('goal')) {
      const goals = await storage.goals.getUserGoals(userId);
      count = goals.length;
      description = `You have ${count} goals`;
    } else if (subject?.includes('objective')) {
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
      message: 'Failed to count items'
    };
  }
}

async function handleAITimeQuestion(userId: string, entities: any): Promise<any> {
  try {
    const today = new Date();
    const tasks = await storage.tasks.getUserTasks(userId, today, today);
    const pendingTasks = tasks.filter(t => t.status === 'pending');
    
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
    
    let timeString = '';
    if (hours > 0) {
      timeString = `${hours} hour${hours > 1 ? 's' : ''}`;
      if (minutes > 0) {
        timeString += ` and ${minutes} minute${minutes > 1 ? 's' : ''}`;
      }
    } else {
      timeString = `${minutes} minute${minutes > 1 ? 's' : ''}`;
    }

    return {
      success: true,
      message: `You have approximately ${timeString} of work remaining today (${pendingTasks.length} pending tasks)`,
      data: { 
        totalMinutes: totalEstimatedTime,
        pendingTaskCount: pendingTasks.length,
        tasks: pendingTasks.map(t => ({ title: t.title, duration: t.estimatedDuration }))
      }
    };
  } catch (error) {
    return {
      success: false,
      message: 'Failed to calculate time information'
    };
  }
}

async function handleAINextTaskQuestion(userId: string, entities: any): Promise<any> {
  try {
    const today = new Date();
    const tasks = await storage.tasks.getUserTasks(userId, today, undefined);
    const pendingTasks = tasks
      .filter(t => t.status === 'pending')
      .sort((a, b) => {
        // Sort by date first, then by time, then by priority
        const dateCompare = new Date(a.scheduledDate).getTime() - new Date(b.scheduledDate).getTime();
        if (dateCompare !== 0) return dateCompare;

        if (a.scheduledTime && b.scheduledTime) {
          return a.scheduledTime.localeCompare(b.scheduledTime);
        }
        
        // Sort by priority if no time specified
        const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
        return (priorityOrder[a.priority as keyof typeof priorityOrder] || 2) - 
               (priorityOrder[b.priority as keyof typeof priorityOrder] || 2);
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
    const timeStr = nextTask.scheduledTime || 'no specific time';
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
      message: 'Failed to find next task'
    };
  }
}

async function handleAIProgressQuestion(userId: string, entities: any): Promise<any> {
  try {
    const { subject } = entities;
    
    if (subject?.includes('goal')) {
      const goals = await storage.goals.getUserGoals(userId);
      const completedGoals = goals.filter(g => g.status === 'completed');
      const activeGoals = goals.filter(g => g.status === 'active');
      
      return {
        success: true,
        message: `You have ${completedGoals.length} completed goals and ${activeGoals.length} active goals. ${activeGoals.length > 0 ? 'Keep pushing forward!' : 'Time to set new goals!'}`,
        data: { 
          totalGoals: goals.length,
          completedGoals: completedGoals.length,
          activeGoals: activeGoals.length 
        }
      };
    } else {
      // Default to task progress
      const today = new Date();
      const startOfWeek = new Date(today);
      startOfWeek.setDate(today.getDate() - today.getDay());
      
      const weekTasks = await storage.tasks.getUserTasks(userId, startOfWeek, today);
      const completedTasks = weekTasks.filter(t => t.status === 'completed');
      const totalTasks = weekTasks.length;
      
      const percentage = totalTasks > 0 ? Math.round((completedTasks.length / totalTasks) * 100) : 0;
      
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
      message: 'Failed to get progress information'
    };
  }
}

async function handleAIScheduleQuestion(userId: string, entities: any): Promise<any> {
  try {
    const { timeframe } = entities;
    const today = new Date();
    let startDate = today;
    let endDate = today;
    let timeframeLabel = 'today';
    
    if (timeframe?.includes('tomorrow')) {
      startDate = new Date(today);
      startDate.setDate(today.getDate() + 1);
      endDate = startDate;
      timeframeLabel = 'tomorrow';
    } else if (timeframe?.includes('week')) {
      endDate = new Date(today);
      endDate.setDate(today.getDate() + 7);
      timeframeLabel = 'this week';
    }
    
    const tasks = await storage.tasks.getUserTasks(userId, startDate, endDate);
    const scheduledTasks = tasks.filter(t => t.scheduledTime).sort((a, b) => {
      const dateCompare = new Date(a.scheduledDate).getTime() - new Date(b.scheduledDate).getTime();
      if (dateCompare !== 0) return dateCompare;
      return (a.scheduledTime || '').localeCompare(b.scheduledTime || '');
    });
    
    if (scheduledTasks.length === 0) {
      return {
        success: true,
        message: `You don't have any scheduled tasks ${timeframeLabel}`,
        data: { tasks: [] }
      };
    }
    
    const taskList = scheduledTasks.map(t => {
      const date = new Date(t.scheduledDate).toLocaleDateString();
      return `${t.title} at ${t.scheduledTime} on ${date}`;
    }).join(', ');
    
    return {
      success: true,
      message: `Your schedule ${timeframeLabel}: ${taskList}`,
      data: { 
        tasks: scheduledTasks.map(t => ({
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
      message: 'Failed to get schedule information'
    };
  }
}

async function handleAIStatsQuestion(userId: string, entities: any): Promise<any> {
  try {
    // Get all tasks for the user
    const allTasks = await storage.tasks.getUserTasks(userId, new Date(0), new Date());
    
    // Calculate stats manually
    const completedTasks = allTasks.filter(t => t.status === 'completed').length;
    const pendingTasks = allTasks.filter(t => t.status === 'pending').length;
    const inProgressTasks = allTasks.filter(t => t.status === 'in_progress').length;
    const totalTasks = allTasks.length;
    
    // Calculate average estimated duration for completed tasks
    const completedTasksWithDuration = allTasks.filter(t => t.status === 'completed' && t.estimatedDuration);
    const averageCompletionTime = completedTasksWithDuration.length > 0 
      ? Math.round(completedTasksWithDuration.reduce((sum, task) => sum + (task.estimatedDuration || 0), 0) / completedTasksWithDuration.length)
      : 0;
    
    const stats = {
      totalTasks,
      completedTasks,
      pendingTasks,
      inProgressTasks,
      averageCompletionTime
    };
    
    return {
      success: true,
      message: `Your productivity stats: ${completedTasks} completed tasks, ${pendingTasks} pending tasks, with an average completion time of ${averageCompletionTime || 'N/A'} minutes`,
      data: stats
    };
  } catch (error) {
    return {
      success: false,
      message: 'Failed to get statistics'
    };
  }
}

async function handleAIGeneralQuestion(userId: string, entities: any): Promise<any> {
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

// Helper function to normalize time format
function normalizeTime(timeStr: string): string {
  // Remove spaces and convert to lowercase
  const cleaned = timeStr.toLowerCase().replace(/\s/g, '');
  
  // Handle AM/PM format
  if (cleaned.includes('am') || cleaned.includes('pm')) {
    const isPM = cleaned.includes('pm');
    const timeOnly = cleaned.replace(/[ap]m/, '');
    
    let [hours, minutes = '00'] = timeOnly.split(':');
    let hourNum = parseInt(hours);
    
    if (isPM && hourNum !== 12) {
      hourNum += 12;
    } else if (!isPM && hourNum === 12) {
      hourNum = 0;
    }
    
    return `${hourNum.toString().padStart(2, '0')}:${minutes.padStart(2, '0')}`;
  }
  
  // Handle 24-hour format
  if (cleaned.includes(':')) {
    const [hours, minutes] = cleaned.split(':');
    return `${hours.padStart(2, '0')}:${minutes.padStart(2, '0')}`;
  }
  
  // Handle just hour number
  const hourNum = parseInt(cleaned);
  if (!isNaN(hourNum) && hourNum >= 0 && hourNum <= 23) {
    return `${hourNum.toString().padStart(2, '0')}:00`;
  }
  
  return timeStr; // Return original if can't parse
}

// Helper function to parse dates
function parseDate(dateStr: string): Date | null {
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);

  const lowerDate = dateStr.toLowerCase();
  
  if (lowerDate.includes('today')) {
    return today;
  } else if (lowerDate.includes('tomorrow')) {
    return tomorrow;
  } else if (lowerDate.includes('monday')) {
    return getNextWeekday(1);
  } else if (lowerDate.includes('tuesday')) {
    return getNextWeekday(2);
  } else if (lowerDate.includes('wednesday')) {
    return getNextWeekday(3);
  } else if (lowerDate.includes('thursday')) {
    return getNextWeekday(4);
  } else if (lowerDate.includes('friday')) {
    return getNextWeekday(5);
  } else if (lowerDate.includes('saturday')) {
    return getNextWeekday(6);
  } else if (lowerDate.includes('sunday')) {
    return getNextWeekday(0);
  }

  // Try to parse as date
  const parsed = new Date(dateStr);
  return isNaN(parsed.getTime()) ? null : parsed;
}

function getNextWeekday(dayOfWeek: number): Date {
  const today = new Date();
  const todayDayOfWeek = today.getDay();
  const daysUntilTarget = (dayOfWeek - todayDayOfWeek + 7) % 7;
  
  const targetDate = new Date(today);
  targetDate.setDate(today.getDate() + (daysUntilTarget === 0 ? 7 : daysUntilTarget));
  
  return targetDate;
}

export default router;