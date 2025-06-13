import { Router, Request, Response } from 'express';
import {
  getPersonalizationEngine,
  getAIService,
  getCurrentAIProvider,
  aiServiceFactory,
} from '../services/ai-factory';
import { requireAuth } from '../middleware/auth';
import { z } from 'zod';
import { validateRequest } from '../middleware/validation';
import { storage } from '../storage';

const router = Router();

const personalizationEngine = getPersonalizationEngine();

// Schema definitions for request validation
const FeedbackSchema = z.object({
  suggestionId: z.string().min(1, 'Suggestion ID is required'),
  action: z.enum(['accepted', 'dismissed', 'modified'], {
    errorMap: () => ({
      message: 'Action must be accepted, dismissed, or modified',
    }),
  }),
  effectiveness: z.number().min(1).max(5).optional(),
  comments: z.string().max(500).optional(),
});

const ContextualSuggestionsSchema = z.object({
  location: z.string().max(100).optional(),
  recentActivity: z
    .enum([
      'focused_work',
      'meetings',
      'administrative',
      'creative',
      'break',
      'planning',
    ])
    .optional(),
  energyLevel: z.enum(['low', 'medium', 'high']).optional(),
  includeVisualContext: z.boolean().optional(),
});

const GoalDecompositionSchema = z.object({
  considerPersonalization: z.boolean().default(true),
  customParameters: z
    .object({
      timelineAdjustment: z.number().min(0.5).max(2.0).optional(),
      complexityPreference: z
        .enum(['simple', 'moderate', 'detailed'])
        .optional(),
      focusAreas: z.array(z.string()).max(5).optional(),
    })
    .optional(),
});

// Helper functions (moved outside the routes)
function calculateRecommendationPriority(
  recommendation: any,
  dayTasks: any[]
): number {
  let score = 50; // Base score

  // Impact-based scoring
  switch (recommendation.impact) {
    case 'high':
      score += 30;
      break;
    case 'medium':
      score += 15;
      break;
    case 'low':
      score += 5;
      break;
  }

  // Effort-based scoring (lower effort = higher priority)
  switch (recommendation.effort) {
    case 'low':
      score += 20;
      break;
    case 'medium':
      score += 10;
      break;
    case 'high':
      score -= 10;
      break;
  }

  // Task count influence
  if (dayTasks.length > 10) {
    score += 10; // More recommendations needed for busy days
  }

  return Math.min(100, Math.max(0, score));
}

function isRecommendationApplicableNow(
  recommendation: any,
  currentTime: Date
): boolean {
  const currentHour = currentTime.getHours();

  // Time-sensitive recommendations
  if (recommendation.type === 'energy_optimization') {
    return currentHour >= 6 && currentHour <= 22; // During active hours
  }

  if (recommendation.type === 'break_reminder') {
    return currentHour >= 9 && currentHour <= 18; // During work hours
  }

  // Most recommendations are applicable during work hours
  return currentHour >= 8 && currentHour <= 20;
}

function generateSuggestionId(type: string): string {
  return `${type}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

async function storeSuggestionsForTracking(
  userId: string,
  suggestions: any
): Promise<void> {
  const allSuggestions = [
    ...suggestions.immediate,
    ...suggestions.upcoming,
    ...suggestions.strategic,
  ];

  for (const suggestion of allSuggestions) {
    await storage.insights.createInsight({
      userId,
      insightType: 'suggestion_generated',
      data: {
        suggestion,
        generatedAt: new Date().toISOString(),
        category: suggestion.category,
        provider: getCurrentAIProvider(),
      },
      confidence: '0.8',
    });
  }
}

function applyCustomDecompositionParameters(
  decomposition: any,
  params: any
): any {
  let modified = { ...decomposition };

  if (params.timelineAdjustment) {
    modified.timelineAdjustments = modified.timelineAdjustments || [];
    modified.timelineAdjustments = modified.timelineAdjustments.map(
      (adj: any) => ({
        ...adj,
        adjustmentFactor: params.timelineAdjustment,
      })
    );
  }

  if (params.complexityPreference) {
    modified.decompositionStrategy = `${modified.decompositionStrategy}_${params.complexityPreference}`;
  }

  if (params.focusAreas && params.focusAreas.length > 0) {
    modified.motivationalFactors = modified.motivationalFactors || [];
    modified.motivationalFactors = [
      ...modified.motivationalFactors,
      ...params.focusAreas.map((area: string) => `Focus on ${area}`),
    ];
  }

  return modified;
}

async function validateSuggestionExists(
  userId: string,
  suggestionId: string
): Promise<boolean> {
  try {
    const insights = await storage.insights.getUserInsights(
      userId,
      'suggestion_generated'
    );
    return insights.some((insight) => {
      const data = insight.data as { suggestion?: { id?: string } };
      return data.suggestion && data.suggestion.id === suggestionId;
    });
  } catch (error) {
    console.error('Error validating suggestion:', error);
    return false;
  }
}

async function updateSuggestionStatus(
  userId: string,
  suggestionId: string,
  action: string
): Promise<void> {
  await storage.insights.createInsight({
    userId,
    insightType: 'suggestion_status_update',
    data: {
      suggestionId,
      action,
      updatedAt: new Date().toISOString(),
    },
    confidence: '1.0',
  });
}

async function getAdditionalAnalytics(
  userId: string,
  timeframeDays: number
): Promise<any> {
  const startDate = new Date(Date.now() - timeframeDays * 24 * 60 * 60 * 1000);
  const endDate = new Date();

  try {
    // Get task completion stats
    const taskStats = await storage.tasks.getTaskCompletionStats(
      userId,
      startDate,
      endDate
    );

    // Get recent insights
    const insights = await storage.insights.getUserInsights(userId);
    const recentInsights = insights.filter(
      (i) => new Date(i.createdAt) >= startDate
    );

    // Calculate metrics
    const suggestionInsights = recentInsights.filter(
      (i) => (i.insightType as string) === 'suggestion_generated'
    );

    const feedbackInsights = recentInsights.filter(
      (i) => (i.insightType as string) === 'personalization_feedback'
    );

    return {
      taskCompletionRate: taskStats.completionRate,
      totalTasksInPeriod: taskStats.total,
      suggestionsGenerated: suggestionInsights.length,
      feedbackProvided: feedbackInsights.length,
      avgDailyInsights: recentInsights.length / timeframeDays,
      personalizationEngagement:
        (feedbackInsights.length / Math.max(1, suggestionInsights.length)) *
        100,
    };
  } catch (error) {
    console.error('Error getting additional analytics:', error);
    return {
      taskCompletionRate: 0,
      totalTasksInPeriod: 0,
      suggestionsGenerated: 0,
      feedbackProvided: 0,
      avgDailyInsights: 0,
      personalizationEngagement: 0,
    };
  }
}

function analyzePersonalizationPatterns(insights: any[]): any {
  const feedbackInsights = insights.filter(
    (i) => i.insightType === 'personalization_feedback'
  );
  const adjustmentInsights = insights.filter(
    (i) => i.insightType === 'personalization_adjustment'
  );

  // Analyze feedback patterns
  const feedbackByAction = feedbackInsights.reduce((acc, insight) => {
    const action = insight.data.action;
    acc[action] = (acc[action] || 0) + 1;
    return acc;
  }, {});

  // Analyze suggestion types that get most feedback
  const suggestionTypeEngagement = feedbackInsights.reduce((acc, insight) => {
    const suggestionType = insight.data.suggestionType || 'unknown';
    acc[suggestionType] = (acc[suggestionType] || 0) + 1;
    return acc;
  }, {});

  return {
    feedbackDistribution: feedbackByAction,
    engagementBySuggestionType: suggestionTypeEngagement,
    adaptationCount: adjustmentInsights.length,
    patterns: identifyBehavioralPatterns(feedbackInsights),
  };
}

function identifyBehavioralPatterns(feedbackInsights: any[]): string[] {
  const patterns = [];

  if (feedbackInsights.length === 0) {
    return ['Insufficient data for pattern analysis'];
  }

  const acceptanceRate =
    feedbackInsights.filter((f) => f.data.action === 'accepted').length /
    feedbackInsights.length;

  if (acceptanceRate > 0.8) {
    patterns.push('High engagement with personalization suggestions');
  } else if (acceptanceRate < 0.3) {
    patterns.push('Low acceptance rate - personalization needs improvement');
  }

  // Analyze effectiveness ratings
  const effectivenessRatings = feedbackInsights
    .filter((f) => f.data.effectiveness)
    .map((f) => f.data.effectiveness);

  if (effectivenessRatings.length > 0) {
    const avgEffectiveness =
      effectivenessRatings.reduce((sum, rating) => sum + rating, 0) /
      effectivenessRatings.length;

    if (avgEffectiveness > 4) {
      patterns.push(
        'High effectiveness ratings - personalization working well'
      );
    } else if (avgEffectiveness < 3) {
      patterns.push('Low effectiveness ratings - need to adjust algorithms');
    }
  }

  return patterns;
}

function generatePersonalizationImprovements(patterns: any): any[] {
  const improvements = [];

  // Based on feedback patterns
  if (
    patterns.feedbackDistribution.dismissed >
    patterns.feedbackDistribution.accepted
  ) {
    improvements.push({
      area: 'suggestion_accuracy',
      recommendation:
        'Improve suggestion relevance by analyzing dismissed suggestions',
      priority: 'high',
      effort: 'medium',
    });
  }

  // Based on engagement
  if (patterns.adaptationCount < 5) {
    improvements.push({
      area: 'learning_speed',
      recommendation:
        'Increase learning rate by collecting more feedback data points',
      priority: 'medium',
      effort: 'low',
    });
  }

  // Based on patterns
  if (patterns.patterns.includes('Low acceptance rate')) {
    improvements.push({
      area: 'personalization_algorithm',
      recommendation:
        'Revise personalization algorithm to better match user preferences',
      priority: 'high',
      effort: 'high',
    });
  }

  return improvements;
}

function validatePersonalizationPreferences(preferences: any): any {
  // Validate and sanitize preferences
  const validatedPreferences: any = {};

  if (
    preferences.workStyle &&
    ['focused', 'flexible', 'structured', 'creative'].includes(
      preferences.workStyle
    )
  ) {
    validatedPreferences.workStyle = preferences.workStyle;
  }

  if (
    preferences.energyPattern &&
    ['early_bird', 'night_owl', 'consistent', 'variable'].includes(
      preferences.energyPattern
    )
  ) {
    validatedPreferences.energyPattern = preferences.energyPattern;
  }

  if (
    preferences.priorityStyle &&
    ['deadline_driven', 'importance_first', 'balanced', 'reactive'].includes(
      preferences.priorityStyle
    )
  ) {
    validatedPreferences.priorityStyle = preferences.priorityStyle;
  }

  if (
    preferences.planningStyle &&
    ['detailed', 'high_level', 'adaptive', 'minimal'].includes(
      preferences.planningStyle
    )
  ) {
    validatedPreferences.planningStyle = preferences.planningStyle;
  }

  if (preferences.productivityFactors) {
    validatedPreferences.productivityFactors = {};

    if (
      typeof preferences.productivityFactors.optimalTaskDuration === 'number' &&
      preferences.productivityFactors.optimalTaskDuration >= 15 &&
      preferences.productivityFactors.optimalTaskDuration <= 240
    ) {
      validatedPreferences.productivityFactors.optimalTaskDuration =
        preferences.productivityFactors.optimalTaskDuration;
    }

    if (
      typeof preferences.productivityFactors.breakFrequency === 'number' &&
      preferences.productivityFactors.breakFrequency >= 0 &&
      preferences.productivityFactors.breakFrequency <= 100
    ) {
      validatedPreferences.productivityFactors.breakFrequency =
        preferences.productivityFactors.breakFrequency;
    }
  }

  if (preferences.preferences) {
    validatedPreferences.preferences = {};

    if (typeof preferences.preferences.morningRoutine === 'boolean') {
      validatedPreferences.preferences.morningRoutine =
        preferences.preferences.morningRoutine;
    }

    if (typeof preferences.preferences.eveningReview === 'boolean') {
      validatedPreferences.preferences.eveningReview =
        preferences.preferences.eveningReview;
    }

    if (typeof preferences.preferences.weeklyPlanning === 'boolean') {
      validatedPreferences.preferences.weeklyPlanning =
        preferences.preferences.weeklyPlanning;
    }

    if (
      typeof preferences.preferences.bufferTime === 'number' &&
      preferences.preferences.bufferTime >= 5 &&
      preferences.preferences.bufferTime <= 60
    ) {
      validatedPreferences.preferences.bufferTime =
        preferences.preferences.bufferTime;
    }
  }

  return validatedPreferences;
}

// Route handlers

// GET /api/personalization/profile
router.get('/profile', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;

    const personalizationEngine = getPersonalizationEngine();
    const profile = await personalizationEngine.analyzeUserPersonalization(
      userId
    );
    const analytics = await personalizationEngine.getPersonalizationAnalytics(
      userId
    );

    res.json({
      success: true,
      data: {
        profile,
        analytics: {
          accuracy: analytics.profileAccuracy,
          lastUpdated: profile.lastUpdated,
          dataPoints: analytics.adaptationHistory.length,
        },
        aiProvider: getCurrentAIProvider(),
      },
      message: `Personalization profile retrieved successfully (powered by ${getCurrentAIProvider()})`,
    });
  } catch (error) {
    console.error('Get personalization profile error:', error);
    res.status(500).json({
      success: false,
      error:
        error instanceof Error
          ? error.message
          : 'Failed to get personalization profile',
    });
  }
});

// POST /api/personalization/profile/refresh
router.post(
  '/profile/refresh',
  requireAuth,
  async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user.id;

      // Force re-analysis of user personalization
      const profile = await personalizationEngine.analyzeUserPersonalization(
        userId
      );

      res.json({
        success: true,
        data: { profile },
        message: 'Personalization profile refreshed successfully',
      });
    } catch (error) {
      console.error('Refresh personalization profile error:', error);
      res.status(500).json({
        success: false,
        error:
          error instanceof Error
            ? error.message
            : 'Failed to refresh personalization profile',
      });
    }
  }
);

// GET /api/personalization/recommendations
router.get(
  '/recommendations',
  requireAuth,
  async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user.id;
      const dateParam = req.query.date as string;

      // Parse and validate date
      let targetDate: Date;
      if (dateParam) {
        targetDate = new Date(dateParam);
        if (isNaN(targetDate.getTime())) {
          return res.status(400).json({
            success: false,
            error: 'Invalid date format. Please use YYYY-MM-DD format.',
          });
        }
      } else {
        targetDate = new Date();
      }

      // Set to start of day for consistent querying
      targetDate.setHours(0, 0, 0, 0);

      const recommendations =
        await personalizationEngine.getPersonalizedTaskRecommendations(
          userId,
          targetDate
        );

      // Get tasks for context
      const dayEnd = new Date(targetDate);
      dayEnd.setHours(23, 59, 59, 999);
      const dayTasks = await storage.tasks.getUserTasks(
        userId,
        targetDate,
        dayEnd
      );

      // Calculate recommendation priority scores
      const enrichedRecommendations = {
        schedulingRecommendations:
          recommendations.schedulingRecommendations.map((rec) => ({
            ...rec,
            priorityScore: calculateRecommendationPriority(rec, dayTasks),
            applicableNow: isRecommendationApplicableNow(rec, new Date()),
          })),
        taskOptimizations: recommendations.taskOptimizations.map((rec) => ({
          ...rec,
          priorityScore: calculateRecommendationPriority(rec, dayTasks),
          applicableNow: isRecommendationApplicableNow(rec, new Date()),
        })),
        workflowSuggestions: recommendations.workflowSuggestions.map((rec) => ({
          ...rec,
          priorityScore: calculateRecommendationPriority(rec, dayTasks),
          applicableNow: isRecommendationApplicableNow(rec, new Date()),
        })),
      };

      res.json({
        success: true,
        data: {
          ...enrichedRecommendations,
          targetDate: targetDate.toISOString().split('T')[0],
          taskCount: dayTasks.length,
          completedTasks: dayTasks.filter((t) => t.status === 'completed')
            .length,
        },
        message: 'Personalized recommendations generated successfully',
      });
    } catch (error) {
      console.error('Get recommendations error:', error);
      res.status(500).json({
        success: false,
        error:
          error instanceof Error
            ? error.message
            : 'Failed to get recommendations',
      });
    }
  }
);

// POST /api/personalization/contextual-suggestions
router.post(
  '/contextual-suggestions',
  requireAuth,
  validateRequest(ContextualSuggestionsSchema),
  async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user.id;
      const { location, recentActivity, energyLevel, includeVisualContext } =
        req.body;

      const context = {
        currentTime: new Date(),
        location,
        recentActivity,
        energyLevel,
      };

      const currentProvider = getCurrentAIProvider();

      // Use enhanced suggestions if Gemini and visual context requested
      let suggestions;
      if (currentProvider === 'gemini' && includeVisualContext) {
        const aiService = getAIService();
        if (aiService.generateContextualSuggestions) {
          suggestions = await aiService.generateContextualSuggestions(
            userId,
            context
          );

          // Convert to expected format
          interface GeminiSuggestion {
            id?: string;
            title: string;
            description?: string;
            priority: 'high' | 'medium' | 'low';
            [key: string]: any;
          }

          interface GeminiSuggestionsResponse {
            suggestions?: GeminiSuggestion[];
          }

          interface CategorizedSuggestions {
            immediate: GeminiSuggestion[];
            upcoming: GeminiSuggestion[];
            strategic: GeminiSuggestion[];
          }

          const geminiSuggestions = suggestions as GeminiSuggestionsResponse;

          suggestions = {
            immediate:
              geminiSuggestions.suggestions?.filter(
                (s: GeminiSuggestion) => s.priority === 'high'
              ) || [],
            upcoming:
              geminiSuggestions.suggestions?.filter(
                (s: GeminiSuggestion) => s.priority === 'medium'
              ) || [],
            strategic:
              geminiSuggestions.suggestions?.filter(
                (s: GeminiSuggestion) => s.priority === 'low'
              ) || [],
          } as CategorizedSuggestions;
        } else {
          suggestions =
            await personalizationEngine.generateContextualSuggestions(
              userId,
              context
            );
        }
      } else {
        suggestions = await personalizationEngine.generateContextualSuggestions(
          userId,
          context
        );
      }

      // Add metadata and scoring
      const enrichedSuggestions = {
        immediate: suggestions.immediate.map((suggestion) => ({
          ...suggestion,
          id: `immediate_${Date.now()}_${Math.random()
            .toString(36)
            .substr(2, 9)}`,
          validUntil: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
          category: 'immediate_action',
          provider: currentProvider,
        })),
        upcoming: suggestions.upcoming.map((suggestion) => ({
          ...suggestion,
          id: `upcoming_${Date.now()}_${Math.random()
            .toString(36)
            .substr(2, 9)}`,
          validUntil: new Date(Date.now() + 4 * 60 * 60 * 1000).toISOString(),
          category: 'upcoming_optimization',
          provider: currentProvider,
        })),
        strategic: suggestions.strategic.map((suggestion) => ({
          ...suggestion,
          id: `strategic_${Date.now()}_${Math.random()
            .toString(36)
            .substr(2, 9)}`,
          validUntil: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
          category: 'strategic_improvement',
          provider: currentProvider,
        })),
      };

      // Store suggestions for tracking
      await storeSuggestionsForTracking(userId, enrichedSuggestions);

      res.json({
        success: true,
        data: {
          ...enrichedSuggestions,
          context: {
            timestamp: context.currentTime.toISOString(),
            location: context.location,
            recentActivity: context.recentActivity,
            energyLevel: context.energyLevel,
            visualContext: includeVisualContext && currentProvider === 'gemini',
          },
          totalSuggestions:
            suggestions.immediate.length +
            suggestions.upcoming.length +
            suggestions.strategic.length,
          provider: currentProvider,
          enhanced: currentProvider === 'gemini' && includeVisualContext,
        },
        message: `Contextual suggestions generated successfully using ${currentProvider}${
          includeVisualContext && currentProvider === 'gemini'
            ? ' with enhanced visual context'
            : ''
        }`,
      });
    } catch (error) {
      console.error('Generate contextual suggestions error:', error);
      res.status(500).json({
        success: false,
        error:
          error instanceof Error
            ? error.message
            : 'Failed to generate contextual suggestions',
      });
    }
  }
);

// POST /api/personalization/goal-decomposition/:goalId
router.post(
  '/goal-decomposition/:goalId',
  requireAuth,
  validateRequest(GoalDecompositionSchema),
  async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user.id;
      const { goalId } = req.params;
      const { considerPersonalization = true, customParameters } = req.body;

      // Get the goal and verify ownership
      const goal = await storage.goals.getGoalById(goalId);
      if (!goal || goal.userId !== userId) {
        return res.status(404).json({
          success: false,
          error: 'Goal not found or access denied',
        });
      }

      // Get personalized decomposition strategy
      const decomposition =
        await personalizationEngine.personalizeGoalDecomposition(userId, goal);

      // Apply custom parameters if provided
      let finalDecomposition = decomposition;
      if (customParameters) {
        finalDecomposition = applyCustomDecompositionParameters(
          decomposition,
          customParameters
        );
      }

      // Get existing objectives for this goal
      const existingObjectives = await storage.objectives.getGoalObjectives(
        goalId
      );

      res.json({
        success: true,
        data: {
          decomposition: finalDecomposition,
          goal: {
            id: goal.id,
            title: goal.title,
            description: goal.description,
            category: goal.category,
            targetYear: goal.targetYear,
            priority: goal.priority,
          },
          existingObjectives: existingObjectives.length,
          customizationApplied: !!customParameters,
          personalizationUsed: considerPersonalization,
        },
        message: 'Personalized goal decomposition completed',
      });
    } catch (error) {
      console.error('Personalized goal decomposition error:', error);
      res.status(500).json({
        success: false,
        error:
          error instanceof Error ? error.message : 'Failed to decompose goal',
      });
    }
  }
);

// POST /api/personalization/feedback
router.post(
  '/feedback',
  requireAuth,
  validateRequest(FeedbackSchema),
  async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user.id;
      const feedback = req.body;

      // Validate suggestion exists
      const suggestionExists = await validateSuggestionExists(
        userId,
        feedback.suggestionId
      );
      if (!suggestionExists) {
        return res.status(404).json({
          success: false,
          error: 'Suggestion not found or has expired',
        });
      }

      // Record feedback and adapt personalization
      await personalizationEngine.adaptFromFeedback(userId, feedback);

      // Update suggestion status
      await updateSuggestionStatus(
        userId,
        feedback.suggestionId,
        feedback.action
      );

      // Get updated analytics
      const analytics = await personalizationEngine.getPersonalizationAnalytics(
        userId
      );

      res.json({
        success: true,
        data: {
          feedbackRecorded: true,
          suggestionId: feedback.suggestionId,
          action: feedback.action,
          updatedAnalytics: {
            profileAccuracy: analytics.profileAccuracy,
            suggestionAcceptanceRate: analytics.suggestionAcceptanceRate,
          },
        },
        message: 'Feedback recorded and personalization adapted',
      });
    } catch (error) {
      console.error('Record feedback error:', error);
      res.status(500).json({
        success: false,
        error:
          error instanceof Error ? error.message : 'Failed to record feedback',
      });
    }
  }
);

// GET /api/personalization/analytics
router.get('/analytics', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const timeframe = (req.query.timeframe as string) || '30'; // days

    const analytics = await personalizationEngine.getPersonalizationAnalytics(
      userId
    );

    // Get additional metrics
    const additionalMetrics = await getAdditionalAnalytics(
      userId,
      parseInt(timeframe)
    );

    res.json({
      success: true,
      data: {
        ...analytics,
        ...additionalMetrics,
        timeframe: `${timeframe} days`,
        lastUpdated: new Date().toISOString(),
      },
      message: 'Personalization analytics retrieved successfully',
    });
  } catch (error) {
    console.error('Get personalization analytics error:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get analytics',
    });
  }
});

// GET /api/personalization/insights
router.get('/insights', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;

    // Get all personalization-related insights
    const insights = await storage.insights.getUserInsights(userId);
    const personalizationInsights = insights.filter(
      (insight) =>
        insight.insightType.includes('personalization') ||
        insight.insightType.includes('suggestion')
    );

    // Analyze patterns in feedback and adaptations
    const patterns = analyzePersonalizationPatterns(personalizationInsights);

    // Generate improvement recommendations
    const improvements = generatePersonalizationImprovements(patterns);

    res.json({
      success: true,
      data: {
        insights: personalizationInsights.slice(0, 10), // Latest 10 insights
        patterns,
        improvements,
        totalInsights: personalizationInsights.length,
      },
      message: 'Personalization insights retrieved successfully',
    });
  } catch (error) {
    console.error('Get personalization insights error:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get insights',
    });
  }
});

// POST /api/personalization/preferences
router.post(
  '/preferences',
  requireAuth,
  async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user.id;
      const preferences = req.body;

      // Validate preferences structure
      const validatedPreferences =
        validatePersonalizationPreferences(preferences);

      // Store preferences
      await storage.insights.createInsight({
        userId,
        insightType: 'personalization_preferences',
        data: {
          preferences: validatedPreferences,
          updatedAt: new Date().toISOString(),
          source: 'user_input',
        },
        confidence: '1.0',
      });

      // Trigger profile refresh with new preferences
      const personalizationEngine = getPersonalizationEngine();
      const updatedProfile =
        await personalizationEngine.analyzeUserPersonalization(userId);

      res.json({
        success: true,
        data: {
          preferences: validatedPreferences,
          profileUpdated: true,
          updatedProfile: {
            workStyle: updatedProfile.workStyle,
            energyPattern: updatedProfile.energyPattern,
            priorityStyle: updatedProfile.priorityStyle,
            planningStyle: updatedProfile.planningStyle,
          },
        },
        message: 'Personalization preferences updated successfully',
      });
    } catch (error) {
      console.error('Update personalization preferences error:', error);
      res.status(500).json({
        success: false,
        error:
          error instanceof Error
            ? error.message
            : 'Failed to update preferences',
      });
    }
  }
);

export default router;
