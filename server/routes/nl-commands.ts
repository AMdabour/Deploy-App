import { Router, Request, Response } from 'express';
import { storage } from '../storage';
import { z } from 'zod';
import { validateRequest } from '../middleware/validation';
import { requireAuth } from '../middleware/auth';

const router = Router();

// Process command schema
const ProcessCommandSchema = z.object({
  text: z.string().min(1),
});

// GET /api/nl/commands
router.get('/commands', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 50;

    const commands = await storage.commands.getUserCommands(userId, limit);

    res.json({
      success: true,
      data: { commands },
    });
  } catch (error) {
    console.error('Get commands error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
});

// POST /api/nl/process
router.post(
  '/process',
  requireAuth,
  validateRequest(ProcessCommandSchema),
  async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user.id;
      const { text } = req.body;

      // Parse the natural language command
      const parsedCommand = parseNaturalLanguageCommand(text);

      // Store the command
      const command = await storage.commands.createCommand({
        userId,
        originalText: text,
        parsedIntent: parsedCommand.intent,
        extractedEntities: parsedCommand.entities,
        confidence: parsedCommand.confidence,
      });

      // Execute the command if confidence is high enough
      let result = null;
      if (parsedCommand.confidence > 0.7) {
        result = await executeCommand(userId, parsedCommand);

        if (result.success) {
          // Mark command as executed
          await storage.commands.markCommandAsExecuted(command.id);
        }
      }

      res.json({
        success: true,
        data: {
          command,
          parsed: parsedCommand,
          result,
        },
        message: 'Command processed successfully',
      });
    } catch (error) {
      console.error('Process command error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
      });
    }
  }
);

// Helper function to parse natural language commands
function parseNaturalLanguageCommand(text: string): any {
  const lowerText = text.toLowerCase();

  // Roadmap patterns - HIGHEST PRIORITY
  if (
    (lowerText.includes('create') || lowerText.includes('build') || lowerText.includes('make') || lowerText.includes('plan')) &&
    (lowerText.includes('roadmap') || lowerText.includes('strategy') || lowerText.includes('journey') || 
     lowerText.includes('complete plan') || lowerText.includes('full plan'))
  ) {
    return {
      intent: 'create_roadmap',
      entities: extractRoadmapEntities(text),
      confidence: 0.9,
    };
  }

  // Goal patterns
  if (
    (lowerText.includes('create') || lowerText.includes('add') || lowerText.includes('make') || lowerText.includes('set')) &&
    (lowerText.includes('goal') && !lowerText.includes('roadmap'))
  ) {
    return {
      intent: 'create_goal',
      entities: extractGoalEntities(text),
      confidence: 0.85,
    };
  }

  // Objective patterns
  if (
    (lowerText.includes('create') || lowerText.includes('add') || lowerText.includes('make') || lowerText.includes('set')) &&
    lowerText.includes('objective')
  ) {
    return {
      intent: 'create_objective',
      entities: extractObjectiveEntities(text),
      confidence: 0.85,
    };
  }

  // Task patterns
  if (
    (lowerText.includes('add') || lowerText.includes('create') || lowerText.includes('schedule')) &&
    lowerText.includes('task')
  ) {
    return {
      intent: 'add_task',
      entities: extractTaskEntities(text),
      confidence: 0.8,
    };
  }

  // Modify task patterns
  if (
    (lowerText.includes('change') || lowerText.includes('update') || lowerText.includes('modify')) &&
    lowerText.includes('task')
  ) {
    return {
      intent: 'modify_task',
      entities: extractModificationEntities(text),
      confidence: 0.7,
    };
  }

  // Delete task patterns
  if (
    (lowerText.includes('delete') || lowerText.includes('remove') || lowerText.includes('cancel')) &&
    lowerText.includes('task')
  ) {
    return {
      intent: 'delete_task',
      entities: extractDeletionEntities(text),
      confidence: 0.8,
    };
  }

  // Question patterns
  if (
    lowerText.includes('what') ||
    lowerText.includes('how') ||
    lowerText.includes('when') ||
    lowerText.includes('show') ||
    lowerText.includes('list')
  ) {
    return {
      intent: 'ask_question',
      entities: extractQuestionEntities(text),
      confidence: 0.6,
    };
  }

  // Default
  return {
    intent: 'ask_question',
    entities: { originalText: text },
    confidence: 0.3,
  };
}

// New entity extraction functions
function extractRoadmapEntities(text: string): any {
  const entities: any = {};
  
  // Extract the main prompt (everything after create/build/make/plan)
  const promptMatch = text.match(/(?:create|build|make|plan)(?:\s+(?:a|an|the))?\s+(?:roadmap|strategy|journey|complete plan|full plan)?(?:\s+(?:for|to|of))?\s*(.+)/i);
  if (promptMatch) {
    entities.prompt = promptMatch[1].trim();
    entities.description = promptMatch[1].trim();
  }

  // Extract timeframe
  const timeframeMatch = text.match(/(this year|next year|2024|2025|this semester|next semester|in \d+ months?)/i);
  if (timeframeMatch) {
    entities.timeframe = timeframeMatch[1];
  }

  // Infer category
  if (text.toLowerCase().includes('developer') || text.toLowerCase().includes('programming') || text.toLowerCase().includes('coding')) {
    entities.category = 'career';
  } else if (text.toLowerCase().includes('fitness') || text.toLowerCase().includes('health') || text.toLowerCase().includes('workout')) {
    entities.category = 'health';
  } else if (text.toLowerCase().includes('business') || text.toLowerCase().includes('startup') || text.toLowerCase().includes('company')) {
    entities.category = 'financial';
  } else if (text.toLowerCase().includes('learn') || text.toLowerCase().includes('study') || text.toLowerCase().includes('course') || text.toLowerCase().includes('grade') || text.toLowerCase().includes('subject')) {
    entities.category = 'education';
  } else {
    entities.category = 'personal';
  }

  return entities;
}

function extractGoalEntities(text: string): any {
  const entities: any = {};
  
  // Extract title (everything after create/add/make/set goal)
  const titleMatch = text.match(/(?:create|add|make|set)(?:\s+(?:a|an|the))?\s+goal\s*(.+)/i);
  if (titleMatch) {
    entities.title = titleMatch[1].trim();
    entities.description = titleMatch[1].trim();
  }

  // Extract year
  const yearMatch = text.match(/(2024|2025|this year|next year)/i);
  if (yearMatch) {
    const yearText = yearMatch[1].toLowerCase();
    if (yearText === 'this year') {
      entities.year = new Date().getFullYear();
    } else if (yearText === 'next year') {
      entities.year = new Date().getFullYear() + 1;
    } else {
      entities.year = parseInt(yearText);
    }
  } else {
    entities.year = new Date().getFullYear();
  }

  // Infer category and priority
  if (text.toLowerCase().includes('developer') || text.toLowerCase().includes('career') || text.toLowerCase().includes('job')) {
    entities.category = 'career';
    entities.priority = 'high';
  } else if (text.toLowerCase().includes('fitness') || text.toLowerCase().includes('health')) {
    entities.category = 'health';
    entities.priority = 'medium';
  } else if (text.toLowerCase().includes('learn') || text.toLowerCase().includes('study') || text.toLowerCase().includes('education')) {
    entities.category = 'education';
    entities.priority = 'high';
  } else if (text.toLowerCase().includes('business') || text.toLowerCase().includes('money') || text.toLowerCase().includes('financial')) {
    entities.category = 'financial';
    entities.priority = 'high';
  } else {
    entities.category = 'personal';
    entities.priority = 'medium';
  }

  return entities;
}

function extractObjectiveEntities(text: string): any {
  const entities: any = {};
  
  // Extract title
  const titleMatch = text.match(/(?:create|add|make|set)(?:\s+(?:a|an|the))?\s+objective\s*(.+)/i);
  if (titleMatch) {
    entities.title = titleMatch[1].trim();
    entities.description = titleMatch[1].trim();
  }

  // Extract month
  const monthMatch = text.match(/(?:for|in|by)\s+(january|february|march|april|may|june|july|august|september|october|november|december|\d{1,2})/i);
  if (monthMatch) {
    const monthText = monthMatch[1].toLowerCase();
    if (isNaN(parseInt(monthText))) {
      const months = ['january', 'february', 'march', 'april', 'may', 'june', 'july', 'august', 'september', 'october', 'november', 'december'];
      entities.month = months.indexOf(monthText) + 1;
    } else {
      entities.month = parseInt(monthText);
    }
  } else {
    entities.month = new Date().getMonth() + 1;
  }

  // Extract year
  const yearMatch = text.match(/(2024|2025|this year|next year)/i);
  if (yearMatch) {
    const yearText = yearMatch[1].toLowerCase();
    if (yearText === 'this year') {
      entities.year = new Date().getFullYear();
    } else if (yearText === 'next year') {
      entities.year = new Date().getFullYear() + 1;
    } else {
      entities.year = parseInt(yearText);
    }
  } else {
    entities.year = new Date().getFullYear();
  }

  return entities;
}

// Existing entity extraction functions
function extractTaskEntities(text: string): any {
  const entities: any = {};

  // Extract time patterns
  const timeMatch = text.match(/(\d{1,2}):(\d{2})|(\d{1,2})\s*(am|pm)/i);
  if (timeMatch) {
    entities.time = timeMatch[0];
  }

  // Extract date patterns
  const dateMatch = text.match(
    /(today|tomorrow|monday|tuesday|wednesday|thursday|friday|saturday|sunday)/i
  );
  if (dateMatch) {
    entities.date = dateMatch[0];
  }

  // Extract duration
  const durationMatch = text.match(/(\d+)\s*(hour|minute|min)/i);
  if (durationMatch) {
    entities.duration = parseInt(durationMatch[1]);
    entities.durationUnit = durationMatch[2];
  }

  // Extract task title (simple approach)
  const taskMatch = text.match(
    /(?:add|create|schedule)\s+(?:task\s+)?["']?([^"']+)["']?/i
  );
  if (taskMatch) {
    entities.title = taskMatch[1].trim();
  }

  return entities;
}

function extractModificationEntities(text: string): any {
  const entities: any = {};

  // Extract task identifier first
  const taskIdentifierMatch = text.match(
    /(?:change|update|modify)\s+(?:task\s+)?["']?([^"']+?)["']?\s+(?:to|from)/i
  );
  if (taskIdentifierMatch) {
    entities.taskIdentifier = taskIdentifierMatch[1].trim();
  }

  // Extract what to change
  if (text.includes('time')) {
    entities.field = 'scheduledTime';
    const timeMatch = text.match(
      /(?:to|at)\s+(\d{1,2}):(\d{2})|(\d{1,2})\s*(am|pm)/i
    );
    if (timeMatch) {
      entities.newValue = timeMatch[0].replace(/^(?:to|at)\s+/, '');
    }
  }

  if (text.includes('date')) {
    entities.field = 'scheduledDate';
    const dateMatch = text.match(
      /(?:to|on)\s+(today|tomorrow|monday|tuesday|wednesday|thursday|friday|saturday|sunday)/i
    );
    if (dateMatch) {
      entities.newValue = dateMatch[1];
    }
  }

  if (text.includes('title') || text.includes('name')) {
    entities.field = 'title';
    const titleMatch = text.match(/(?:to|name)\s+["']?([^"']+)["']?$/i);
    if (titleMatch) {
      entities.newValue = titleMatch[1].trim();
    }
  }

  if (text.includes('priority')) {
    entities.field = 'priority';
    const priorityMatch = text.match(
      /(?:to|priority)\s+(low|medium|high|critical)/i
    );
    if (priorityMatch) {
      entities.newValue = priorityMatch[1].toLowerCase();
    }
  }

  if (text.includes('duration')) {
    entities.field = 'estimatedDuration';
    const durationMatch = text.match(
      /(?:to|duration)\s+(\d+)\s*(hour|minute|min)/i
    );
    if (durationMatch) {
      const value = parseInt(durationMatch[1]);
      const unit = durationMatch[2];
      entities.newValue = unit.startsWith('hour') ? value * 60 : value;
    }
  }

  return entities;
}

function extractDeletionEntities(text: string): any {
  const entities: any = {};

  // Extract task identifier
  const taskMatch = text.match(
    /(?:delete|remove|cancel)\s+(?:task\s+)?["']?([^"']+)["']?/i
  );
  if (taskMatch) {
    entities.taskIdentifier = taskMatch[1].trim();
  }

  // Check if it's a date-based deletion
  const dateMatch = text.match(
    /(?:delete|remove|cancel)\s+(?:all\s+)?(?:tasks?\s+)?(?:for\s+)?(today|tomorrow|monday|tuesday|wednesday|thursday|friday|saturday|sunday)/i
  );
  if (dateMatch) {
    entities.dateFilter = dateMatch[1];
    entities.deleteType = 'by_date';
  }

  return entities;
}

function extractQuestionEntities(text: string): any {
  const entities: any = { question: text };

  // Time-based questions
  if (text.includes('today')) {
    entities.timeframe = 'today';
  } else if (text.includes('tomorrow')) {
    entities.timeframe = 'tomorrow';
  } else if (text.includes('week')) {
    entities.timeframe = 'week';
  } else if (text.includes('month')) {
    entities.timeframe = 'month';
  }

  // Question type detection
  if (text.toLowerCase().includes('how many')) {
    entities.questionType = 'count';
  } else if (
    text.toLowerCase().includes('what time') ||
    text.toLowerCase().includes('when')
  ) {
    entities.questionType = 'time';
  } else if (
    text.toLowerCase().includes('what') &&
    text.toLowerCase().includes('next')
  ) {
    entities.questionType = 'next_task';
  } else if (
    text.toLowerCase().includes('progress') ||
    text.toLowerCase().includes('completed')
  ) {
    entities.questionType = 'progress';
  }

  return entities;
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

// Helper function to execute parsed commands
async function executeCommand(
  userId: string,
  parsedCommand: any
): Promise<any> {
  try {
    switch (parsedCommand.intent) {
      case 'add_task':
        return await executeAddTask(userId, parsedCommand.entities);

      case 'modify_task':
        return await executeModifyTask(userId, parsedCommand.entities);

      case 'delete_task':
        return await executeDeleteTask(userId, parsedCommand.entities);

      case 'create_goal':
        return await executeCreateGoal(userId, parsedCommand.entities);

      case 'create_objective':
        return await executeCreateObjective(userId, parsedCommand.entities);

      case 'create_roadmap':
        return await executeCreateRoadmap(userId, parsedCommand.entities);

      case 'ask_question':
        return await executeQuestion(userId, parsedCommand.entities);

      default:
        return {
          success: false,
          message: 'Unknown command intent',
        };
    }
  } catch (error) {
    return {
      success: false,
      message: 'Failed to execute command',
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

// New execution functions
async function executeCreateGoal(userId: string, entities: any): Promise<any> {
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
      message: `Goal "${title}" created successfully for ${year || new Date().getFullYear()}`,
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

async function executeCreateObjective(userId: string, entities: any): Promise<any> {
  try {
    const { title, description, month, year } = entities;

    if (!title) {
      return { success: false, message: 'Objective title is required' };
    }

    // Try to find an active goal to link to
    const goals = await storage.goals.getUserGoals(userId);
    const activeGoals = goals.filter(g => g.status === 'active');
    
    if (activeGoals.length === 0) {
      return { 
        success: false, 
        message: 'Please create a goal first before adding objectives' 
      };
    }

    // Use the most recent active goal
    const goalId = activeGoals[0].id;

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
      message: `Objective "${title}" created successfully for month ${month || new Date().getMonth() + 1}`,
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

async function executeCreateRoadmap(userId: string, entities: any): Promise<any> {
  try {
    const { prompt, description } = entities;

    if (!prompt && !description) {
      return { 
        success: false, 
        message: 'Please provide a description of what you want to achieve' 
      };
    }

    return {
      success: false,
      message: 'Roadmap creation requires AI services. Please use the AI-powered chat interface or try: "I want to create a goal for [your objective]" instead.',
      data: { 
        suggestion: 'Try creating a goal first, then break it into objectives and tasks.',
        alternativeCommands: [
          `create a goal ${prompt || description}`,
          `create an objective ${prompt || description}`
        ]
      }
    };
  } catch (error) {
    console.error('Create roadmap error:', error);
    return {
      success: false,
      message: 'Failed to create roadmap'
    };
  }
}

// Helper function to find task by identifier (title or partial match)
async function findTaskByIdentifier(
  userId: string,
  identifier: string
): Promise<any> {
  // Get recent tasks (last 30 days) to search through
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const tasks = await storage.tasks.getUserTasks(
    userId,
    thirtyDaysAgo,
    undefined
  );

  // Try exact title match first
  let foundTask = tasks.find(
    (task) => task.title.toLowerCase() === identifier.toLowerCase()
  );

  // If no exact match, try partial match
  if (!foundTask) {
    foundTask = tasks.find((task) =>
      task.title.toLowerCase().includes(identifier.toLowerCase())
    );
  }

  return foundTask;
}

// Helper function to normalize time format
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

export default router;
