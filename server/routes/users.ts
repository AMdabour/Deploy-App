import { Router, Request, Response } from 'express';
import { storage } from '../storage';
import { z } from 'zod';
import { validateRequest } from '../middleware/validation';
import { requireAuth } from '../middleware/auth';

const router = Router();

// Update user profile schema
const UpdateUserSchema = z.object({
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  timezone: z.string().optional(),
  preferences: z
    .object({
      workingHours: z
        .object({
          start: z.string(),
          end: z.string(),
        })
        .optional(),
      preferredTaskDuration: z.number().optional(),
      energyLevels: z
        .object({
          morning: z.enum(['low', 'medium', 'high']),
          afternoon: z.enum(['low', 'medium', 'high']),
          evening: z.enum(['low', 'medium', 'high']),
        })
        .optional(),
    })
    .optional(),
});

// GET /api/users/profile
router.get('/profile', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const user = await storage.users.getUserById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found',
      });
    }

    const { passwordHash, ...userProfile } = user;

    res.json({
      success: true,
      data: { user: userProfile },
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
});

// PUT /api/users/profile
router.put(
  '/profile',
  requireAuth,
  validateRequest(UpdateUserSchema),
  async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user.id;
      const updates = req.body;

      const updatedUser = await storage.users.updateUser(userId, updates);

      if (!updatedUser) {
        return res.status(404).json({
          success: false,
          error: 'User not found',
        });
      }

      const { passwordHash, ...userProfile } = updatedUser;

      res.json({
        success: true,
        data: { user: userProfile },
        message: 'Profile updated successfully',
      });
    } catch (error) {
      console.error('Update profile error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
      });
    }
  }
);

// GET /api/users/stats
router.get('/stats', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;

    // Get user statistics
    const goals = await storage.goals.getUserGoals(userId);
    const currentDate = new Date();
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

    const monthlyObjectives = await storage.objectives.getUserObjectives(
      userId,
      currentDate.getMonth() + 1,
      currentDate.getFullYear()
    );

    res.json({
      success: true,
      data: {
        stats: {
          totalGoals: goals.length,
          activeGoals: goals.filter((g) => g.status === 'active').length,
          completedGoals: goals.filter((g) => g.status === 'completed').length,
          monthlyObjectives: monthlyObjectives.length,
          monthlyTasks: monthlyTasks.length,
          taskCompletionRate: taskStats.completionRate,
          tasksCompleted: taskStats.completed,
          totalTasks: taskStats.total,
        },
      },
    });
  } catch (error) {
    console.error('Get user stats error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
});

export default router;
