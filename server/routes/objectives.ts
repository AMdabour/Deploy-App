import { Router, Request, Response } from 'express';
import { storage } from '../storage';
import { z } from 'zod';
import { validateRequest } from '../middleware/validation';
import { requireAuth } from '../middleware/auth';
import { v4 as uuidv4 } from 'uuid';

const router = Router();

// Key Result schema
const KeyResultSchema = z.object({
  description: z.string(),
  targetValue: z.number().optional(),
  currentValue: z.number().default(0),
  unit: z.string().optional(),
  completed: z.boolean().default(false),
});

// Create objective schema
const CreateObjectiveSchema = z.object({
  goalId: z.string().uuid(),
  title: z.string().min(5).max(200),
  description: z.string().optional(),
  targetMonth: z.number().int().min(1).max(12),
  targetYear: z.number().int().min(2024),
  keyResults: z.array(KeyResultSchema).default([]),
});

// Update objective schema
const UpdateObjectiveSchema = CreateObjectiveSchema.partial();

// Update key result schema
const UpdateKeyResultSchema = z.object({
  keyResultId: z.string().uuid(),
  currentValue: z.number().optional(),
  completed: z.boolean().optional(),
});

// GET /api/objectives
router.get('/', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const month = req.query.month
      ? parseInt(req.query.month as string)
      : undefined;
    const year = req.query.year
      ? parseInt(req.query.year as string)
      : undefined;
    const goalId = req.query.goalId as string;

    let objectives;

    if (goalId) {
      // Get objectives for a specific goal
      objectives = await storage.objectives.getGoalObjectives(goalId);
      // Filter by user ownership
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
      data: { objectives },
    });
  } catch (error) {
    console.error('Get objectives error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
});

// GET /api/objectives/:id
router.get('/:id', requireAuth, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = (req as any).user.id;

    const objective = await storage.objectives.getObjectiveById(id);

    if (!objective) {
      return res.status(404).json({
        success: false,
        error: 'Objective not found',
      });
    }

    if (objective.userId !== userId) {
      return res.status(403).json({
        success: false,
        error: 'Access denied',
      });
    }

    // Get related tasks
    const tasks = await storage.tasks.getTasksByObjective(id);

    res.json({
      success: true,
      data: {
        objective,
        tasks,
      },
    });
  } catch (error) {
    console.error('Get objective error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
});

// POST /api/objectives
router.post(
  '/',
  requireAuth,
  validateRequest(CreateObjectiveSchema),
  async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user.id;
      const { goalId, keyResults, ...objectiveData } = req.body;

      // Verify goal exists and user owns it
      const goal = await storage.goals.getGoalById(goalId);
      if (!goal || goal.userId !== userId) {
        return res.status(404).json({
          success: false,
          error: 'Goal not found',
        });
      }

      // Add IDs to key results
      const keyResultsWithIds = keyResults.map((kr: any) => ({
        ...kr,
        id: uuidv4(),
      }));

      const objective = await storage.objectives.createObjective({
        ...objectiveData,
        goalId,
        userId,
        keyResults: keyResultsWithIds,
      });

      res.status(201).json({
        success: true,
        data: { objective },
        message: 'Objective created successfully',
      });
    } catch (error) {
      console.error('Create objective error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
      });
    }
  }
);

// PUT /api/objectives/:id
router.put(
  '/:id',
  requireAuth,
  validateRequest(UpdateObjectiveSchema),
  async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const userId = (req as any).user.id;
      const updates = req.body;

      // Check ownership
      const existingObjective = await storage.objectives.getObjectiveById(id);
      if (!existingObjective || existingObjective.userId !== userId) {
        return res.status(404).json({
          success: false,
          error: 'Objective not found',
        });
      }

      // Add IDs to new key results if provided
      if (updates.keyResults) {
        updates.keyResults = updates.keyResults.map((kr: any) => ({
          ...kr,
          id: kr.id || uuidv4(),
        }));
        
        // If key results are being updated, recalculate status
        const newStatus = determineObjectiveStatus(updates.keyResults, existingObjective.status);
        updates.status = newStatus;
        
        // Recalculate progress
        const completedCount = updates.keyResults.filter((kr: any) => kr.completed).length;
        const newProgress = updates.keyResults.length > 0
          ? (completedCount / updates.keyResults.length) * 100
          : 0;
        updates.progress = newProgress.toString();
      }

      const updatedObjective = await storage.objectives.updateObjective(
        id,
        updates
      );

      res.json({
        success: true,
        data: { objective: updatedObjective },
        message: 'Objective updated successfully',
      });
    } catch (error) {
      console.error('Update objective error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
      });
    }
  }
);

// Helper function to determine objective status based on key results
function determineObjectiveStatus(
  keyResults: any[],
  currentStatus: string
): 'active' | 'completed' | 'paused' {
  if (keyResults.length === 0) {
    // No key results, keep current status unless it's completed
    return currentStatus === 'completed' ? 'active' : (currentStatus as any);
  }

  const completedCount = keyResults.filter((kr) => kr.completed).length;

  if (completedCount === keyResults.length) {
    // All key results completed
    return 'completed';
  } else if (completedCount > 0 && currentStatus === 'completed') {
    // Some key results uncompleted, revert from completed
    return 'active';
  } else {
    // Keep current status (active/paused)
    return currentStatus as any;
  }
}

// PUT /api/objectives/:id/key-results
router.put(
  '/:id/key-results',
  requireAuth,
  validateRequest(UpdateKeyResultSchema),
  async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const userId = (req as any).user.id;
      const { keyResultId, currentValue, completed } = req.body;

      const objective = await storage.objectives.getObjectiveById(id);
      if (!objective || objective.userId !== userId) {
        return res.status(404).json({
          success: false,
          error: 'Objective not found',
        });
      }

      // Update the specific key result
      const updatedKeyResults = objective.keyResults.map((kr) => {
        if (kr.id === keyResultId) {
          return {
            ...kr,
            ...(currentValue !== undefined && { currentValue }),
            ...(completed !== undefined && { completed }),
          };
        }
        return kr;
      });

      // Calculate new progress
      const completedCount = updatedKeyResults.filter(
        (kr) => kr.completed
      ).length;
      const newProgress =
        updatedKeyResults.length > 0
          ? (completedCount / updatedKeyResults.length) * 100
          : 0;

      // Determine new status using helper function
      const newStatus = determineObjectiveStatus(
        updatedKeyResults,
        objective.status
      );

      const updatedObjective = await storage.objectives.updateObjective(id, {
        keyResults: updatedKeyResults,
        progress: newProgress.toString(),
        status: newStatus,
      });

      // Log status change for debugging
      if (newStatus !== objective.status) {
        console.log(
          `📋 Objective "${objective.title}" status changed from "${objective.status}" to "${newStatus}"`
        );
      }

      res.json({
        success: true,
        data: { objective: updatedObjective },
        message: `Key result updated successfully${
          newStatus !== objective.status
            ? `. Objective status changed to ${newStatus}`
            : ''
        }`,
      });
    } catch (error) {
      console.error('Update key result error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
      });
    }
  }
);

// DELETE /api/objectives/:id
router.delete('/:id', requireAuth, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = (req as any).user.id;

    const existingObjective = await storage.objectives.getObjectiveById(id);
    if (!existingObjective || existingObjective.userId !== userId) {
      return res.status(404).json({
        success: false,
        error: 'Objective not found',
      });
    }

    const deleted = await storage.objectives.deleteObjective(id);

    if (deleted) {
      return res.status(500).json({
        success: false,
        error: 'Failed to delete objective',
      });
    }

    res.json({
      success: true,
      message: 'Objective deleted successfully',
    });
  } catch (error) {
    console.error('Delete objective error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
});

export default router;