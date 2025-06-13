import { Router, Request, Response } from 'express';
import { storage } from '../storage';
import { GoalSchema } from '../../shared/schema';
import { z } from 'zod';
import { validateRequest } from '../middleware/validation';
import { requireAuth } from '../middleware/auth';

const router = Router();

// Create goal schema
const CreateGoalSchema = z.object({
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
});

// Update goal schema
const UpdateGoalSchema = CreateGoalSchema.partial();

// GET /api/goals
router.get('/', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const year = req.query.year
      ? parseInt(req.query.year as string)
      : undefined;
    const category = req.query.category as string;
    const status = req.query.status as string;

    let goals = await storage.goals.getUserGoals(userId, year);

    // Apply additional filters
    if (category) {
      goals = goals.filter((goal) => goal.category === category);
    }
    if (status) {
      goals = goals.filter((goal) => goal.status === status);
    }

    res.json({
      success: true,
      data: { goals },
    });
  } catch (error) {
    console.error('Get goals error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
});

// GET /api/goals/:id
router.get('/:id', requireAuth, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = (req as any).user.id;

    const goal = await storage.goals.getGoalById(id);

    if (!goal) {
      return res.status(404).json({
        success: false,
        error: 'Goal not found',
      });
    }

    // Check if user owns this goal
    if (goal.userId !== userId) {
      return res.status(403).json({
        success: false,
        error: 'Access denied',
      });
    }

    // Get related objectives and tasks
    const objectives = await storage.objectives.getGoalObjectives(id);
    const tasks = await storage.tasks.getTasksByGoal(id);

    res.json({
      success: true,
      data: {
        goal,
        objectives,
        tasks,
      },
    });
  } catch (error) {
    console.error('Get goal error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
});

// POST /api/goals
router.post(
  '/',
  requireAuth,
  validateRequest(CreateGoalSchema),
  async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user.id;
      const goalData = { ...req.body, userId };

      const goal = await storage.goals.createGoal(goalData);

      res.status(201).json({
        success: true,
        data: { goal },
        message: 'Goal created successfully',
      });
    } catch (error) {
      console.error('Create goal error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
      });
    }
  }
);

// PUT /api/goals/:id
router.put(
  '/:id',
  requireAuth,
  validateRequest(UpdateGoalSchema),
  async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const userId = (req as any).user.id;
      const updates = req.body;

      // Check if goal exists and user owns it
      const existingGoal = await storage.goals.getGoalById(id);
      if (!existingGoal) {
        return res.status(404).json({
          success: false,
          error: 'Goal not found',
        });
      }

      if (existingGoal.userId !== userId) {
        return res.status(403).json({
          success: false,
          error: 'Access denied',
        });
      }

      const updatedGoal = await storage.goals.updateGoal(id, updates);

      res.json({
        success: true,
        data: { goal: updatedGoal },
        message: 'Goal updated successfully',
      });
    } catch (error) {
      console.error('Update goal error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
      });
    }
  }
);

// DELETE /api/goals/:id
router.delete('/:id', requireAuth, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = (req as any).user.id;

    // Check if goal exists and user owns it
    const existingGoal = await storage.goals.getGoalById(id);
    if (!existingGoal) {
      return res.status(404).json({
        success: false,
        error: 'Goal not found',
      });
    }

    if (existingGoal.userId !== userId) {
      return res.status(403).json({
        success: false,
        error: 'Access denied',
      });
    }

    const deleted = await storage.goals.deleteGoal(id);

    if (deleted) {
      return res.status(500).json({
        success: false,
        error: 'Failed to delete goal',
      });
    }

    res.json({
      success: true,
      message: 'Goal deleted successfully',
    });
  } catch (error) {
    console.error('Delete goal error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
});

// POST /api/goals/:id/decompose
router.post(
  '/:id/decompose',
  requireAuth,
  async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const userId = (req as any).user.id;

      // Check if goal exists and user owns it
      const existingGoal = await storage.goals.getGoalById(id);
      if (!existingGoal) {
        return res.status(404).json({
          success: false,
          error: 'Goal not found',
        });
      }

      if (existingGoal.userId !== userId) {
        return res.status(403).json({
          success: false,
          error: 'Access denied',
        });
      }

      // Mark goal as AI decomposed
      const updatedGoal = await storage.goals.markGoalAsDecomposed(id);

      // TODO: Integrate with AI service to actually decompose the goal
      // This would call an AI service to break down the goal into monthly objectives

      res.json({
        success: true,
        data: { goal: updatedGoal },
        message: 'Goal marked for AI decomposition',
      });
    } catch (error) {
      console.error('Decompose goal error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
      });
    }
  }
);

export default router;