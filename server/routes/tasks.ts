import { Router, Request, Response } from 'express';
import { storage } from '../storage';
import { z } from 'zod';
import { validateRequest } from '../middleware/validation';
import { requireAuth } from '../middleware/auth';

const router = Router();

// Create task schema
const CreateTaskSchema = z.object({
  objectiveId: z.string().uuid().optional(),
  goalId: z.string().uuid().optional(),
  title: z.string().min(1).max(200),
  description: z.string().optional(),
  scheduledDate: z.string().transform((str) => new Date(str)),
  scheduledTime: z.string().optional(),
  estimatedDuration: z.number().default(30),
  priority: z.enum(['low', 'medium', 'high', 'critical']).default('medium'),
  tags: z.array(z.string()).default([]),
  location: z.string().optional(),
  reminderMinutes: z.number().optional(),
});

// Update task schema
const UpdateTaskSchema = CreateTaskSchema.partial();

// Complete task schema
const CompleteTaskSchema = z.object({
  actualDuration: z.number().optional(),
});

// GET /api/tasks
router.get('/', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const startDate = req.query.startDate
      ? new Date(req.query.startDate as string)
      : undefined;
    const endDate = req.query.endDate
      ? new Date(req.query.endDate as string)
      : undefined;
    const status = req.query.status as string;
    const priority = req.query.priority as string;
    const objectiveId = req.query.objectiveId as string;
    const goalId = req.query.goalId as string;

    let tasks;

    if (objectiveId) {
      tasks = await storage.tasks.getTasksByObjective(objectiveId);
      // Filter by user ownership
      tasks = tasks.filter((task) => task.userId === userId);
    } else if (goalId) {
      tasks = await storage.tasks.getTasksByGoal(goalId);
      // Filter by user ownership
      tasks = tasks.filter((task) => task.userId === userId);
    } else {
      tasks = await storage.tasks.getUserTasks(userId, startDate, endDate);
    }

    // Apply additional filters
    if (status) {
      tasks = tasks.filter((task) => task.status === status);
    }
    if (priority) {
      tasks = tasks.filter((task) => task.priority === priority);
    }

    res.json({
      success: true,
      data: { tasks },
    });
  } catch (error) {
    console.error('Get tasks error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
});

// GET /api/tasks/:id
router.get('/:id', requireAuth, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = (req as any).user.id;

    const task = await storage.tasks.getTaskById(id);

    if (!task) {
      return res.status(404).json({
        success: false,
        error: 'Task not found',
      });
    }

    if (task.userId !== userId) {
      return res.status(403).json({
        success: false,
        error: 'Access denied',
      });
    }

    res.json({
      success: true,
      data: { task },
    });
  } catch (error) {
    console.error('Get task error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
});

// POST /api/tasks
router.post(
  '/',
  requireAuth,
  validateRequest(CreateTaskSchema),
  async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user.id;
      const { objectiveId, goalId, scheduledDate, ...taskData } = req.body;

      // Verify objective or goal exists and user owns it
      if (objectiveId) {
        const objective = await storage.objectives.getObjectiveById(
          objectiveId
        );
        if (!objective || objective.userId !== userId) {
          return res.status(404).json({
            success: false,
            error: 'Objective not found',
          });
        }
      }

      if (goalId) {
        const goal = await storage.goals.getGoalById(goalId);
        if (!goal || goal.userId !== userId) {
          return res.status(404).json({
            success: false,
            error: 'Goal not found',
          });
        }
      }

      const task = await storage.tasks.createTask({
        ...taskData,
        objectiveId,
        goalId,
        userId,
        scheduledDate: new Date(scheduledDate),
      });

      res.status(201).json({
        success: true,
        data: { task },
        message: 'Task created successfully',
      });
    } catch (error) {
      console.error('Create task error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
      });
    }
  }
);

// PUT /api/tasks/:id
router.put(
  '/:id',
  requireAuth,
  validateRequest(UpdateTaskSchema),
  async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const userId = (req as any).user.id;
      const updates = req.body;

      // Check ownership
      const existingTask = await storage.tasks.getTaskById(id);
      if (!existingTask || existingTask.userId !== userId) {
        return res.status(404).json({
          success: false,
          error: 'Task not found',
        });
      }

      const updatedTask = await storage.tasks.updateTask(id, updates);

      res.json({
        success: true,
        data: { task: updatedTask },
        message: 'Task updated successfully',
      });
    } catch (error) {
      console.error('Update task error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
      });
    }
  }
);

// POST /api/tasks/:id/complete
router.post(
  '/:id/complete',
  requireAuth,
  validateRequest(CompleteTaskSchema),
  async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const userId = (req as any).user.id;
      const { actualDuration } = req.body;

      const existingTask = await storage.tasks.getTaskById(id);
      if (!existingTask || existingTask.userId !== userId) {
        return res.status(404).json({
          success: false,
          error: 'Task not found',
        });
      }

      const completedTask = await storage.tasks.completeTask(
        id,
        actualDuration
      );

      res.json({
        success: true,
        data: { task: completedTask },
        message: 'Task completed successfully',
      });
    } catch (error) {
      console.error('Complete task error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
      });
    }
  }
);

// DELETE /api/tasks/:id
router.delete('/:id', requireAuth, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = (req as any).user.id;

    const existingTask = await storage.tasks.getTaskById(id);
    if (!existingTask || existingTask.userId !== userId) {
      return res.status(404).json({
        success: false,
        error: 'Task not found',
      });
    }

    const deleted = await storage.tasks.deleteTask(id);

    if (deleted) {
      return res.status(500).json({
        success: false,
        error: 'Failed to delete task',
      });
    }

    res.json({
      success: true,
      message: 'Task deleted successfully',
    });
  } catch (error) {
    console.error('Delete task error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
});

// GET /api/tasks/stats/completion
router.get(
  '/stats/completion',
  requireAuth,
  async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user.id;
      const startDate = req.query.startDate
        ? new Date(req.query.startDate as string)
        : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const endDate = req.query.endDate
        ? new Date(req.query.endDate as string)
        : new Date();

      const stats = await storage.tasks.getTaskCompletionStats(
        userId,
        startDate,
        endDate
      );

      res.json({
        success: true,
        data: { stats },
      });
    } catch (error) {
      console.error('Get task stats error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
      });
    }
  }
);

export default router;