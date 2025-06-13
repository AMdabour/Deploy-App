import { Router, Request, Response } from 'express';
import { getAmbientAIService, getCurrentAIProvider, aiServiceFactory } from '../services/ai-factory';
import { requireAuth } from '../middleware/auth';
import { z } from 'zod';
import { validateRequest } from '../middleware/validation';
import { ambientAI } from 'server/services/ambient-ai';

const router = Router();

const StartLearningSchema = z.object({
  options: z.object({
    includeVisualAnalysis: z.boolean().optional(),
    conversationalMemory: z.boolean().optional(),
    contextualAwareness: z.boolean().optional(),
  }).optional()
});

const VisualAnalysisSchema = z.object({
  imageData: z.string().min(1),
});

// GET /api/ambient-ai/suggestions
router.get('/suggestions', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    
    // const ambientService = getAmbientAIService();
    const suggestions = await ambientAI.getActiveSuggestions(userId);
    
    // Sort by priority and confidence
    const sortedSuggestions = suggestions.sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      type Priority = keyof typeof priorityOrder;
      const priorityA = a.priority as Priority;
      const priorityB = b.priority as Priority;
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
        enhanced: getCurrentAIProvider() === 'gemini'
      },
      message: `Found ${sortedSuggestions.length} active suggestions from ${getCurrentAIProvider()}`
    });
  } catch (error) {
    console.error('Get ambient suggestions error:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get suggestions'
    });
  }
});

// POST /api/ambient-ai/suggestions/:id/apply
router.post('/suggestions/:id/apply', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
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
    console.error('Apply ambient suggestion error:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to apply suggestion'
    });
  }
});

// POST /api/ambient-ai/suggestions/:id/dismiss
router.post('/suggestions/:id/dismiss', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const { id } = req.params;
    
    const ambientService = getAmbientAIService();
    const dismissed = await ambientService.dismissSuggestion(userId, id);
    
    if (!dismissed) {
      return res.status(404).json({
        success: false,
        error: 'Suggestion not found'
      });
    }
    
    res.json({
      success: true,
      message: `Suggestion dismissed and learning updated (${getCurrentAIProvider()})`
    });
  } catch (error) {
    console.error('Dismiss ambient suggestion error:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to dismiss suggestion'
    });
  }
});

// POST /api/ambient-ai/start-learning
router.post('/start-learning', requireAuth, validateRequest(StartLearningSchema), async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const { options } = req.body;
    
    const ambientService = getAmbientAIService();
    const currentProvider = getCurrentAIProvider();
    
    if (currentProvider === 'gemini' && ambientService.startEnhancedAmbientLearning) {
      await ambientService.startEnhancedAmbientLearning(userId, options);
    } else if (ambientService.startAmbientLearning) {
      await ambientService.startAmbientLearning(userId);
    } else {
      throw new Error('Ambient learning not supported by current provider');
    }
    
    res.json({
      success: true,
      data: {
        provider: currentProvider,
        enhanced: currentProvider === 'gemini',
        options: options || {}
      },
      message: `${currentProvider === 'gemini' ? 'Enhanced' : 'Standard'} ambient learning started with ${currentProvider}`
    });
  } catch (error) {
    console.error('Start ambient learning error:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to start ambient learning'
    });
  }
});

// POST /api/ambient-ai/stop-learning
router.post('/stop-learning', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    
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
    console.error('Stop ambient learning error:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to stop ambient learning'
    });
  }
});

// POST /api/ambient-ai/visual-analysis (Gemini-specific feature)
router.post('/visual-analysis', requireAuth, validateRequest(VisualAnalysisSchema), async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const { imageData } = req.body;
    
    const currentProvider = getCurrentAIProvider();
    const ambientService = getAmbientAIService();
    
    if (currentProvider !== 'gemini' || !ambientService.analyzeWorkspaceVisually) {
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
      message: 'Visual workspace analysis completed using Gemini'
    });
  } catch (error) {
    console.error('Visual analysis error:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to analyze workspace visually'
    });
  }
});

// POST /api/ambient-ai/add-conversation (Gemini-specific feature)
router.post('/add-conversation', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const { role, content } = req.body;
    
    const currentProvider = getCurrentAIProvider();
    const ambientService = getAmbientAIService();
    
    if (currentProvider !== 'gemini' || !ambientService.addConversation) {
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
      message: 'Conversation added to memory for enhanced learning'
    });
  } catch (error) {
    console.error('Add conversation error:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to add conversation'
    });
  }
});

// GET /api/ambient-ai/capabilities
router.get('/capabilities', requireAuth, async (req: Request, res: Response) => {
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
          enhancedLearning: currentProvider === 'gemini',
          visualAnalysis: currentProvider === 'gemini' && capabilities.visualAnalysis,
          conversationalMemory: currentProvider === 'gemini' && capabilities.conversationalMemory,
          contextualAwareness: capabilities.contextualAwareness
        }
      },
      message: `Ambient AI capabilities for ${currentProvider}`
    });
  } catch (error) {
    console.error('Get capabilities error:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get capabilities'
    });
  }
});

export default router;