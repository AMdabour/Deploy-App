import { Router, Request, Response } from 'express';
import { ambientAI } from '../services/ambient-ai';
import { requireAuth } from '../middleware/auth';
import { z } from 'zod';
import { validateRequest } from '../middleware/validation';

const router = Router();

const ApplySuggestionSchema = z.object({
  suggestionId: z.string(),
});

// GET /api/suggestions - Get active suggestions for user
router.get('/', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;

    const suggestions = await ambientAI.getActiveSuggestions(userId);

    // Sort by priority and confidence
    const sortedSuggestions = suggestions.sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      const priorityDiff =
        priorityOrder[b.priority] - priorityOrder[a.priority];
      if (priorityDiff !== 0) return priorityDiff;

      return b.confidence - a.confidence;
    });

    res.json({
      success: true,
      data: {
        suggestions: sortedSuggestions,
        count: sortedSuggestions.length,
      },
      message: `Found ${sortedSuggestions.length} active suggestions`,
    });
  } catch (error) {
    console.error('Get suggestions error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch suggestions',
    });
  }
});

// POST /api/suggestions/apply - Apply a suggestion
router.post(
  '/apply',
  requireAuth,
  validateRequest(ApplySuggestionSchema),
  async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user.id;
      const { suggestionId } = req.body;

      const result = await ambientAI.applySuggestion(userId, suggestionId);

      if (result.success) {
        res.json({
          success: true,
          message: result.message,
        });
      } else {
        res.status(400).json({
          success: false,
          error: result.message,
        });
      }
    } catch (error) {
      console.error('Apply suggestion error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to apply suggestion',
      });
    }
  }
);

// POST /api/suggestions/dismiss/:id - Dismiss a suggestion
router.post(
  '/dismiss/:id',
  requireAuth,
  async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user.id;
      const suggestionId = req.params.id;

      // Mark suggestion as dismissed (implementation would depend on storage)
      // For now, we'll just return success

      res.json({
        success: true,
        message: 'Suggestion dismissed',
      });
    } catch (error) {
      console.error('Dismiss suggestion error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to dismiss suggestion',
      });
    }
  }
);

// POST /api/suggestions/generate - Force generate new suggestions
router.post('/generate', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;

    const suggestions = await ambientAI.generateProactiveSuggestions(userId);

    res.json({
      success: true,
      data: {
        suggestions,
        count: suggestions.length,
      },
      message: `Generated ${suggestions.length} new suggestions`,
    });
  } catch (error) {
    console.error('Generate suggestions error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate suggestions',
    });
  }
});

// GET /api/suggestions/learning-status - Get ambient learning status
router.get(
  '/learning-status',
  requireAuth,
  async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user.id;

      // Check if learning is active (simplified check)
      const isLearning = ambientAI['learningIntervals'].has(userId);

      res.json({
        success: true,
        data: {
          isLearning,
          status: isLearning ? 'active' : 'inactive',
          message: isLearning
            ? 'AI is actively learning your patterns'
            : 'Ambient learning is not active',
        },
      });
    } catch (error) {
      console.error('Learning status error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get learning status',
      });
    }
  }
);

// POST /api/suggestions/start-learning - Start ambient learning
router.post(
  '/start-learning',
  requireAuth,
  async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user.id;

      await ambientAI.startAmbientLearning(userId);

      res.json({
        success: true,
        message: 'Ambient learning started successfully',
      });
    } catch (error) {
      console.error('Start learning error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to start ambient learning',
      });
    }
  }
);

// POST /api/suggestions/stop-learning - Stop ambient learning
router.post(
  '/stop-learning',
  requireAuth,
  async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user.id;

      ambientAI.stopAmbientLearning(userId);

      res.json({
        success: true,
        message: 'Ambient learning stopped',
      });
    } catch (error) {
      console.error('Stop learning error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to stop ambient learning',
      });
    }
  }
);

export default router;
