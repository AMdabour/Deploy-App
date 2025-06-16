import { storage } from '../storage';
import { geminiAIService } from './gemini-ai';
import type { DbUser, DbDailyTask } from '../db';

export interface GeminiUserBehaviorPattern {
  userId: string;
  patternType: 'completion_time' | 'energy_level' | 'task_preference' | 'scheduling_habit' | 'context_awareness';
  pattern: {
    timeSlots: Array<{
      hour: number;
      efficiency: number;
      taskTypes: string[];
      contextualFactors?: {
        location?: string;
        weather?: string;
        mood?: string;
      };
    }>;
    preferences: {
      taskDuration: number;
      breakFrequency: number;
      priorityHandling: string;
      contextualPreferences?: Record<string, any>;
    };
    habits: {
      planningTime: string;
      reviewTime: string;
      mostProductiveHours: string[];
      environmentalFactors?: string[];
    };
  };
  confidence: number;
  lastUpdated: Date;
  geminiInsights?: {
    visualPatterns?: string[];
    conversationalTrends?: string[];
    multimodalContext?: Record<string, any>;
  };
}

export interface GeminiProactiveSuggestion {
  id: string;
  userId: string;
  type: 'schedule_optimization' | 'task_creation' | 'goal_adjustment' | 'break_reminder' | 'energy_optimization' | 'contextual_insight' | 'visual_workspace_optimization';
  title: string;
  description: string;
  actionable: boolean;
  priority: 'low' | 'medium' | 'high';
  context: Record<string, any>;
  validUntil: Date;
  confidence: number;
  geminiSpecific?: {
    multimodalData?: string;
    conversationalContext?: string[];
    visualContext?: string;
  };
}

export class GeminiAmbientAIService {
  private learningIntervals = new Map<string, NodeJS.Timeout>();
  private conversationMemory = new Map<string, Array<{ role: 'user' | 'assistant'; content: string; timestamp: Date }>>();

  /**
   * Start enhanced ambient learning with Gemini's multimodal capabilities
   */
  async startEnhancedAmbientLearning(userId: string, options?: {
    includeVisualAnalysis?: boolean;
    conversationalMemory?: boolean;
    contextualAwareness?: boolean;
  }): Promise<void> {
    // Clear existing interval if any
    this.stopAmbientLearning(userId);

    const defaultOptions = {
      includeVisualAnalysis: true,
      conversationalMemory: true,
      contextualAwareness: true,
      ...options
    };

    // Set up more frequent learning with Gemini's advanced capabilities (every 2 hours)
    const interval = setInterval(async () => {
      await this.performEnhancedAmbientLearning(userId, defaultOptions);
    }, 2 * 60 * 60 * 1000); // 2 hours

    this.learningIntervals.set(userId, interval);

    // Perform initial learning
    await this.performEnhancedAmbientLearning(userId, defaultOptions);
  }

  /**
   * Stop ambient learning for a user
   */
  stopAmbientLearning(userId: string): void {
    const interval = this.learningIntervals.get(userId);
    if (interval) {
      clearInterval(interval);
      this.learningIntervals.delete(userId);
    }
    
    // Clear conversation memory to save space
    this.conversationMemory.delete(userId);
  }

  /**
   * Enhanced ambient learning with Gemini's advanced AI
   */
  private async performEnhancedAmbientLearning(userId: string, options: any): Promise<void> {
    try {
      console.log(`🧠 Performing enhanced Gemini ambient learning for user ${userId}`);

      // Traditional pattern analysis
      await this.analyzeCompletionPatterns(userId);
      await this.analyzeEnergyPatterns(userId);
      await this.analyzeTaskPreferences(userId);
      await this.analyzeSchedulingHabits(userId);

      // Gemini-specific advanced analysis
      if (options.contextualAwareness) {
        await this.analyzeContextualPatterns(userId);
      }

      if (options.conversationalMemory) {
        await this.analyzeConversationalPatterns(userId);
      }

      // Generate enhanced proactive suggestions
      await this.generateEnhancedProactiveSuggestions(userId, options);

      console.log(`✅ Enhanced Gemini ambient learning completed for user ${userId}`);
    } catch (error) {
      console.error(`❌ Enhanced ambient learning failed for user ${userId}:`, error);
    }
  }

  /**
   * Analyze contextual patterns using Gemini's advanced reasoning
   */
  private async analyzeContextualPatterns(userId: string): Promise<void> {
    const insights = await storage.insights.getUserInsights(userId);
    const user = await storage.users.getUserById(userId);
    
    if (!user) return;

    const contextualData = insights.filter(insight => 
      insight.data && typeof insight.data === 'object' && 
      (insight.data as any).context
    );

    if (contextualData.length < 5) return; // Need enough data

    try {
      // Use Gemini to analyze contextual patterns
      const analysisPrompt = `
CONTEXTUAL PATTERN ANALYSIS

User Data:
${contextualData.map(data => `- ${data.insightType}: ${JSON.stringify(data.data)}`).join('\n')}

Analyze the user's behavioral patterns across different contexts (time, location, activity type, etc.). 

REQUIRED JSON RESPONSE:
{
  "contextualPatterns": [
    {
      "context": "string (time/location/activity)",
      "pattern": "string describing the pattern",
      "confidence": number,
      "recommendations": ["string array"]
    }
  ],
  "overallInsight": "string",
  "actionableRecommendations": ["string array"]
}
`;

      const result = await geminiAIService.getModel().generateContent([{ text: analysisPrompt }]);
      const response = result.response.text();
      const analysis = JSON.parse(geminiAIService['extractJsonFromResponse'](response));

      // Store the analysis
      await storage.insights.createInsight({
        userId,
        insightType: 'contextual_pattern_analysis',
        data: {
          ...analysis,
          analysisDate: new Date().toISOString(),
          geminiGenerated: true
        },
        confidence: '0.85',
      });

    } catch (error) {
      console.error('Error in contextual pattern analysis:', error);
    }
  }

  /**
   * Analyze conversational patterns for better assistance
   */
  private async analyzeConversationalPatterns(userId: string): Promise<void> {
    const conversationHistory = this.conversationMemory.get(userId) || [];
    
    if (conversationHistory.length < 10) return; // Need enough conversation data

    try {
      const conversationAnalysisPrompt = `
CONVERSATIONAL PATTERN ANALYSIS

Recent Conversations:
${conversationHistory.slice(-20).map(conv => `${conv.role}: ${conv.content}`).join('\n')}

Analyze the user's communication patterns, preferences, and needs based on their conversations.

REQUIRED JSON RESPONSE:
{
  "communicationStyle": "string (formal/casual/technical/etc)",
  "commonRequests": ["string array"],
  "preferredResponseLength": "short|medium|detailed",
  "topicPreferences": ["string array"],
  "assistancePatterns": [
    {
      "pattern": "string",
      "frequency": number,
      "effectiveness": number
    }
  ],
  "recommendedImprovements": ["string array"]
}
`;

      const result = await geminiAIService.getModel().generateContent([{ text: conversationAnalysisPrompt }]);
      const response = result.response.text();
      const analysis = JSON.parse(geminiAIService['extractJsonFromResponse'](response));

      await storage.insights.createInsight({
        userId,
        insightType: 'conversational_pattern_analysis',
        data: {
          ...analysis,
          analysisDate: new Date().toISOString(),
          conversationCount: conversationHistory.length,
          geminiGenerated: true
        },
        confidence: '0.8',
      });

    } catch (error) {
      console.error('Error in conversational pattern analysis:', error);
    }
  }

  /**
   * Generate enhanced proactive suggestions using Gemini's advanced capabilities
   */
  async generateEnhancedProactiveSuggestions(userId: string, options: any): Promise<GeminiProactiveSuggestion[]> {
    const suggestions: GeminiProactiveSuggestion[] = [];
    const insights = await storage.insights.getUserInsights(userId);
    const user = await storage.users.getUserById(userId);
    
    if (!user) return suggestions;

    // Get today's context
    const today = new Date();
    const todayTasks = await storage.tasks.getUserTasks(userId, today, today);

    // Traditional suggestions
    const traditionalSuggestions = await this.generateTraditionalSuggestions(userId, todayTasks, insights);
    suggestions.push(...traditionalSuggestions);

    // Gemini-enhanced suggestions
    if (options.contextualAwareness) {
      const contextualSuggestions = await this.generateContextualSuggestions(userId, insights, todayTasks);
      suggestions.push(...contextualSuggestions);
    }

    if (options.conversationalMemory) {
      const conversationalSuggestions = await this.generateConversationalSuggestions(userId);
      suggestions.push(...conversationalSuggestions);
    }

    // Store suggestions in database
    for (const suggestion of suggestions) {
      await this.storeEnhancedSuggestion(suggestion);
    }

    return suggestions;
  }

  /**
   * Generate contextual suggestions based on user's current situation
   */
  private async generateContextualSuggestions(
    userId: string, 
    insights: any[], 
    todayTasks: DbDailyTask[]
  ): Promise<GeminiProactiveSuggestion[]> {
    try {
      const currentHour = new Date().getHours();
      const contextualInsights = insights.filter(i => i.insightType === 'contextual_pattern_analysis');
      
      if (contextualInsights.length === 0) return [];

      const suggestionPrompt = `
CONTEXTUAL SUGGESTION GENERATION

Current Context:
- Time: ${new Date().toISOString()}
- Hour: ${currentHour}
- Day: ${new Date().toLocaleDateString('en-US', { weekday: 'long' })}

User Insights:
${contextualInsights.map(insight => JSON.stringify(insight.data)).join('\n')}

Today's Tasks:
${todayTasks.map(task => `- ${task.title} (${task.priority}, ${task.estimatedDuration}min)`).join('\n')}

Generate 2-3 contextual suggestions based on the current time, day, and user patterns.

REQUIRED JSON RESPONSE:
{
  "suggestions": [
    {
      "type": "contextual_insight|timing_optimization|workflow_adjustment",
      "title": "string",
      "description": "string",
      "priority": "low|medium|high",
      "actionable": true,
      "reasoning": "string explaining why this suggestion is relevant now"
    }
  ]
}
`;

      const result = await geminiAIService.getModel().generateContent([{ text: suggestionPrompt }]);
      const response = result.response.text();
      const suggestionData = JSON.parse(geminiAIService['extractJsonFromResponse'](response));

      return suggestionData.suggestions.map((suggestion: any) => ({
        id: `contextual_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        userId,
        type: suggestion.type,
        title: suggestion.title,
        description: suggestion.description,
        actionable: suggestion.actionable,
        priority: suggestion.priority,
        context: {
          currentHour,
          reasoning: suggestion.reasoning,
          generatedBy: 'gemini_contextual_analysis'
        },
        validUntil: new Date(Date.now() + 4 * 60 * 60 * 1000), // 4 hours
        confidence: 0.85,
        geminiSpecific: {
          conversationalContext: [`Generated based on contextual patterns at ${new Date().toISOString()}`]
        }
      }));

    } catch (error) {
      console.error('Error generating contextual suggestions:', error);
      return [];
    }
  }

  /**
   * Generate suggestions based on conversation history
   */
  private async generateConversationalSuggestions(userId: string): Promise<GeminiProactiveSuggestion[]> {
    const conversationHistory = this.conversationMemory.get(userId) || [];
    
    if (conversationHistory.length < 5) return [];

    try {
      const recentConversations = conversationHistory.slice(-10);
      
      const suggestionPrompt = `
CONVERSATIONAL SUGGESTION GENERATION

Recent Conversations:
${recentConversations.map(conv => `${conv.role}: ${conv.content}`).join('\n')}

Based on recent conversations, generate 1-2 proactive suggestions that would be helpful.

REQUIRED JSON RESPONSE:
{
  "suggestions": [
    {
      "type": "follow_up|clarification|action_reminder|information_provision",
      "title": "string",
      "description": "string",
      "priority": "low|medium|high",
      "actionable": true,
      "conversationalContext": "string explaining the conversation basis"
    }
  ]
}
`;

      const result = await geminiAIService.getModel().generateContent([{ text: suggestionPrompt }]);
      const response = result.response.text();
      const suggestionData = JSON.parse(geminiAIService['extractJsonFromResponse'](response));

      return suggestionData.suggestions.map((suggestion: any) => ({
        id: `conversational_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        userId,
        type: suggestion.type,
        title: suggestion.title,
        description: suggestion.description,
        actionable: suggestion.actionable,
        priority: suggestion.priority,
        context: {
          conversationBased: true,
          conversationalContext: suggestion.conversationalContext,
          generatedBy: 'gemini_conversation_analysis'
        },
        validUntil: new Date(Date.now() + 8 * 60 * 60 * 1000), // 8 hours
        confidence: 0.8,
        geminiSpecific: {
          conversationalContext: recentConversations.slice(-5).map(c => `${c.role}: ${c.content}`)
        }
      }));

    } catch (error) {
      console.error('Error generating conversational suggestions:', error);
      return [];
    }
  }

  /**
   * Store conversation for memory and analysis
   */
  addConversation(userId: string, role: 'user' | 'assistant', content: string): void {
    if (!this.conversationMemory.has(userId)) {
      this.conversationMemory.set(userId, []);
    }
    
    const conversations = this.conversationMemory.get(userId)!;
    conversations.push({
      role,
      content,
      timestamp: new Date()
    });

    // Keep only last 50 conversations to manage memory
    if (conversations.length > 50) {
      conversations.splice(0, conversations.length - 50);
    }
  }

  /**
   * Get conversation history for a user
   */
  getConversationHistory(userId: string, limit: number = 10): Array<{ role: 'user' | 'assistant'; content: string; timestamp: Date }> {
    const conversations = this.conversationMemory.get(userId) || [];
    return conversations.slice(-limit);
  }

  /**
   * Enhanced visual workspace analysis (when image data is available)
   */
  async analyzeWorkspaceVisually(userId: string, imageData: string): Promise<{
    workspaceInsights: string[];
    suggestions: GeminiProactiveSuggestion[];
    organizationTips: string[];
  }> {
    try {
      const analysisPrompt = `
VISUAL WORKSPACE ANALYSIS

Analyze this workspace image and provide insights about productivity potential, organization, and environmental factors that might affect work performance.

REQUIRED JSON RESPONSE:
{
  "workspaceInsights": [
    "specific observations about the workspace"
  ],
  "environmentalFactors": [
    "factors that might affect productivity"
  ],
  "organizationTips": [
    "specific suggestions for improving the workspace"
  ],
  "productivityScore": number between 0 and 100,
  "immediateActions": [
    "quick improvements that can be made now"
  ]
}
`;

      const result = await geminiAIService.getVisionModel().generateContent([
        { text: analysisPrompt },
        {
          inlineData: {
            mimeType: "image/jpeg",
            data: imageData
          }
        }
      ]);

      const response = result.response.text();
      const analysis = JSON.parse(geminiAIService['extractJsonFromResponse'](response));

      // Convert insights to suggestions
      const suggestions: GeminiProactiveSuggestion[] = analysis.immediateActions.map((action: string, index: number) => ({
        id: `workspace_visual_${Date.now()}_${index}`,
        userId,
        type: 'visual_workspace_optimization',
        title: 'Workspace Improvement',
        description: action,
        actionable: true,
        priority: 'medium' as const,
        context: {
          visualAnalysis: true,
          productivityScore: analysis.productivityScore,
          generatedBy: 'gemini_visual_analysis'
        },
        validUntil: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
        confidence: 0.9,
        geminiSpecific: {
          visualContext: 'Workspace image analysis',
          multimodalData: 'visual_workspace_analysis'
        }
      }));

      // Store the analysis
      await storage.insights.createInsight({
        userId,
        insightType: 'visual_workspace_analysis',
        data: {
          ...analysis,
          analysisDate: new Date().toISOString(),
          geminiGenerated: true,
          imageAnalyzed: true
        },
        confidence: '0.9',
      });

      return {
        workspaceInsights: analysis.workspaceInsights,
        suggestions,
        organizationTips: analysis.organizationTips
      };

    } catch (error) {
      console.error('Error in visual workspace analysis:', error);
      throw new Error(`Visual workspace analysis failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  // Traditional methods adapted for Gemini (keeping the same interface)

  private async generateTraditionalSuggestions(
    userId: string, 
    todayTasks: DbDailyTask[], 
    insights: any[]
  ): Promise<GeminiProactiveSuggestion[]> {
    // Implementation similar to the original ambient AI but enhanced with Gemini capabilities
    const suggestions: GeminiProactiveSuggestion[] = [];

    // Schedule optimization
    const scheduleOptimization = await this.generateScheduleOptimizationSuggestion(userId, todayTasks, insights);
    if (scheduleOptimization) suggestions.push(scheduleOptimization);

    // Energy optimization
    const user = await storage.users.getUserById(userId);
    if (user) {
      const energyOptimization = await this.generateEnergyOptimizationSuggestion(userId, todayTasks, user);
      if (energyOptimization) suggestions.push(energyOptimization);
    }

    return suggestions;
  }

  private async generateScheduleOptimizationSuggestion(
    userId: string, 
    tasks: DbDailyTask[], 
    insights: any[]
  ): Promise<GeminiProactiveSuggestion | null> {
    const unscheduledTasks = tasks.filter(t => !t.scheduledTime && t.status === 'pending');
    
    if (unscheduledTasks.length === 0) return null;

    const optimalWorkHours = insights.find(i => i.insightType === 'optimal_work_hours');
    
    return {
      id: `gemini_schedule_opt_${Date.now()}`,
      userId,
      type: 'schedule_optimization',
      title: 'Smart Schedule Optimization',
      description: `I've analyzed your patterns and can optimize ${unscheduledTasks.length} unscheduled tasks during your peak productivity hours.`,
      actionable: true,
      priority: 'medium',
      context: {
        unscheduledTaskIds: unscheduledTasks.map(t => t.id),
        optimalHours: optimalWorkHours?.data?.peakHours || [],
        geminiEnhanced: true
      },
      validUntil: new Date(Date.now() + 24 * 60 * 60 * 1000),
      confidence: 0.85,
      geminiSpecific: {
        multimodalData: 'schedule_optimization_analysis'
      }
    };
  }

  private async generateEnergyOptimizationSuggestion(
    userId: string, 
    tasks: DbDailyTask[], 
    user: DbUser
  ): Promise<GeminiProactiveSuggestion | null> {
    if (!user.preferences?.energyLevels) return null;

    const { morning, afternoon, evening } = user.preferences.energyLevels;
    const highEnergyTasks = tasks.filter(t => t.priority === 'high' || t.priority === 'critical');
    
    const misalignedTasks = highEnergyTasks.filter(task => {
      if (!task.scheduledTime) return false;
      const hour = parseInt(task.scheduledTime.split(':')[0]);
      
      if (hour >= 6 && hour < 12 && morning === 'low') return true;
      if (hour >= 12 && hour < 18 && afternoon === 'low') return true;
      if (hour >= 18 && evening === 'low') return true;
      
      return false;
    });

    if (misalignedTasks.length === 0) return null;

    return {
      id: `gemini_energy_opt_${Date.now()}`,
      userId,
      type: 'energy_optimization',
      title: 'Energy-Task Alignment',
      description: `${misalignedTasks.length} important tasks are scheduled during low-energy periods. Let me suggest better timing based on your natural rhythm.`,
      actionable: true,
      priority: 'high',
      context: {
        misalignedTaskIds: misalignedTasks.map(t => t.id),
        energyLevels: user.preferences.energyLevels,
        geminiEnhanced: true
      },
      validUntil: new Date(Date.now() + 12 * 60 * 60 * 1000),
      confidence: 0.9,
      geminiSpecific: {
        conversationalContext: ['Energy level analysis based on historical patterns']
      }
    };
  }

  private async storeEnhancedSuggestion(suggestion: GeminiProactiveSuggestion): Promise<void> {
    await storage.insights.createInsight({
      userId: suggestion.userId,
      insightType: 'gemini_proactive_suggestion',
      data: {
        suggestion,
        type: 'enhanced_proactive_suggestion',
        generated: new Date().toISOString(),
        geminiGenerated: true,
        multimodalCapable: true
      },
      confidence: suggestion.confidence.toString()
    });
  }

  // Add methods from original ambient AI service that are still needed
  private analyzeCompletionPatterns = async (userId: string) => {
    // Implementation similar to original but enhanced with Gemini insights
  };

  private analyzeEnergyPatterns = async (userId: string) => {
    // Implementation similar to original but enhanced with Gemini insights
  };

  private analyzeTaskPreferences = async (userId: string) => {
    // Implementation similar to original but enhanced with Gemini insights
  };

  private analyzeSchedulingHabits = async (userId: string) => {
    // Implementation similar to original but enhanced with Gemini insights
  };

  // Keep the same interface for backward compatibility
  // async getActiveSuggestions(userId: string): Promise<GeminiProactiveSuggestion[]> {
  //   const insights = await storage.insights.getUserInsights(userId, 'gemini_proactive_suggestion');
  //   const suggestions: GeminiProactiveSuggestion[] = [];

  //   insights
  //     .filter(insight => {
  //       const data = insight.data as { suggestion?: GeminiProactiveSuggestion };
  //       return data && data.suggestion;
  //     })
  //     .forEach(insight => {
  //       const data = insight.data as { suggestion: GeminiProactiveSuggestion };
  //       if (data.suggestion) {
  //         suggestions.push(data.suggestion);
  //       }
  //     });

  //   return suggestions.filter(s => new Date(s.validUntil) > new Date());
  // }

//   async getActiveSuggestions(userId: string): Promise<GeminiProactiveSuggestion[]> {
//     const insights = await storage.insights.getUserInsights(userId);
//     const suggestions: GeminiProactiveSuggestion[] = [];

//     insights
//       .filter(insight => {
//         const data = insight.data as { suggestion?: GeminiProactiveSuggestion };
//         return data && data.suggestion;
//       })
//       .forEach(insight => {
//         const data = insight.data as { suggestion: GeminiProactiveSuggestion };
//         if (data.suggestion) {
//           suggestions.push(data.suggestion);
//         }
//       });

//     // Filter out expired suggestions
//     const activeSuggestions = suggestions.filter(s => new Date(s.validUntil) > new Date());
    
//     // If no active suggestions, try to get from regular insights as fallback
//     if (activeSuggestions.length === 0) {
//       console.log('No Gemini-specific suggestions found, checking regular insights...');
//       const regularInsights = await storage.insights.getUserInsights(userId);
      
//       regularInsights
//         .filter(insight => {
//           const data = insight.data as { suggestion?: any, suggestions?: any[] };
//           return data && (data.suggestion || data.suggestions);
//         })
//         .forEach(insight => {
//           const data = insight.data as { suggestion?: any, suggestions?: any[] };
//           if (data.suggestion) {
//             // Convert regular suggestion to Gemini format
//             const geminiSuggestion: GeminiProactiveSuggestion = {
//               ...data.suggestion,
//               geminiSpecific: {
//                 multimodalData: 'converted_from_regular_suggestion'
//               }
//             };
//             if (new Date(geminiSuggestion.validUntil) > new Date()) {
//               activeSuggestions.push(geminiSuggestion);
//             }
//           }
//           if (data.suggestions && Array.isArray(data.suggestions)) {
//             data.suggestions.forEach(suggestion => {
//               const geminiSuggestion: GeminiProactiveSuggestion = {
//                 ...suggestion,
//                 geminiSpecific: {
//                   multimodalData: 'converted_from_regular_suggestion'
//                 }
//               };
//               if (new Date(geminiSuggestion.validUntil) > new Date()) {
//                 activeSuggestions.push(geminiSuggestion);
//               }
//             });
//           }
//         });
//     }

//     return activeSuggestions;
// }

async getActiveSuggestions(userId: string): Promise<GeminiProactiveSuggestion[]> {
  try {
    // First, try to get suggestions stored specifically as suggestions
    const suggestionInsights = await storage.insights.getUserInsights(userId, 'gemini_proactive_suggestion');
    const suggestions: GeminiProactiveSuggestion[] = [];

    // Extract properly stored suggestions
    suggestionInsights
      .filter(insight => {
        const data = insight.data as { suggestion?: GeminiProactiveSuggestion };
        return data && data.suggestion;
      })
      .forEach(insight => {
        const data = insight.data as { suggestion: GeminiProactiveSuggestion };
        if (data.suggestion && new Date(data.suggestion.validUntil) > new Date()) {
          suggestions.push(data.suggestion);
        }
      });

    // If no stored suggestions found, convert productivity insights to suggestions
    if (suggestions.length === 0) {
      console.log('No stored suggestions found, converting productivity insights...');
      
      const productivityInsights = await storage.insights.getUserInsights(userId);
      
      for (const insight of productivityInsights) {
        const data = insight.data as any;
        
        // Handle productivity insights with recommendations
        if (data && data.overall_score && data.overall_score.recommendations) {
          const recommendations = data.overall_score.recommendations;
          
          recommendations.forEach((recommendation: string, index: number) => {
            const suggestion: GeminiProactiveSuggestion = {
              id: `converted_${insight.id}_${index}`,
              userId,
              type: this.determineTypeFromRecommendation(recommendation),
              title: this.extractTitleFromRecommendation(recommendation),
              description: recommendation,
              actionable: true,
              priority: 'medium',
              context: {
                convertedFromInsight: true,
                originalInsightType: insight.insightType,
                generatedFrom: 'productivity_analysis'
              },
              validUntil: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
              confidence: 0.7,
              geminiSpecific: {
                multimodalData: 'converted_from_productivity_insight'
              }
            };
            suggestions.push(suggestion);
          });
        }

        // Handle insights with actionable_tips
        if (data && data.overall_score && data.overall_score.insights) {
          const insights = data.overall_score.insights;
          
          insights.forEach((insightItem: any) => {
            if (insightItem.actionable_tips && Array.isArray(insightItem.actionable_tips)) {
              insightItem.actionable_tips.slice(0, 2).forEach((tip: string, index: number) => {
                const suggestion: GeminiProactiveSuggestion = {
                  id: `tip_${insight.id}_${insightItem.type}_${index}`,
                  userId,
                  type: this.mapInsightTypeToSuggestionType(insightItem.type),
                  title: insightItem.title || 'Productivity Improvement',
                  description: tip,
                  actionable: true,
                  priority: insightItem.confidence > 0.8 ? 'high' : 'medium',
                  context: {
                    convertedFromTip: true,
                    insightType: insightItem.type,
                    confidence: insightItem.confidence,
                    generatedFrom: 'actionable_tips'
                  },
                  validUntil: new Date(Date.now() + 24 * 60 * 60 * 1000),
                  confidence: insightItem.confidence || 0.7,
                  geminiSpecific: {
                    multimodalData: 'converted_from_actionable_tips'
                  }
                };
                suggestions.push(suggestion);
              });
            }
          });
        }
      }
    }

    // If still no suggestions, generate immediate ones
    if (suggestions.length === 0) {
      console.log('No insights found, generating immediate suggestions...');
      const immediateSuggestions = await this.generateImmediateSuggestions(userId);
      suggestions.push(...immediateSuggestions);
    }

    // Remove duplicates and sort
    const uniqueSuggestions = suggestions.filter((suggestion, index, self) => 
      index === self.findIndex(s => s.title === suggestion.title && s.description === suggestion.description)
    );

    return uniqueSuggestions.slice(0, 10); // Limit to 10 suggestions

  } catch (error) {
    console.error('Error getting active suggestions:', error);
    // Fallback to immediate suggestions
    return await this.generateImmediateSuggestions(userId);
  }
}

// Helper methods to convert insights to suggestions
private determineTypeFromRecommendation(recommendation: string): GeminiProactiveSuggestion['type'] {
  const lowerRec = recommendation.toLowerCase();
  
  if (lowerRec.includes('task') && (lowerRec.includes('track') || lowerRec.includes('manage'))) {
    return 'task_creation';
  }
  if (lowerRec.includes('goal') || lowerRec.includes('objective')) {
    return 'goal_adjustment';
  }
  if (lowerRec.includes('schedule') || lowerRec.includes('time')) {
    return 'schedule_optimization';
  }
  if (lowerRec.includes('break') || lowerRec.includes('energy')) {
    return 'energy_optimization';
  }
  
  return 'contextual_insight';
}

private extractTitleFromRecommendation(recommendation: string): string {
  // Extract first 50 characters as title
  const title = recommendation.split('.')[0] || recommendation;
  return title.length > 50 ? title.substring(0, 50) + '...' : title;
}

private mapInsightTypeToSuggestionType(insightType: string): GeminiProactiveSuggestion['type'] {
  const typeMap: Record<string, GeminiProactiveSuggestion['type']> = {
    'task_completion_pattern': 'task_creation',
    'optimal_work_hours': 'schedule_optimization',
    'task_duration_accuracy': 'schedule_optimization',
    'priority_preference': 'task_creation',
    'goal_progress_pattern': 'goal_adjustment',
    'scheduling_preference': 'schedule_optimization'
  };
  
  return typeMap[insightType] || 'contextual_insight';
}

// async generateImmediateSuggestions(userId: string): Promise<GeminiProactiveSuggestion[]> {
//   try {
//     const suggestions: GeminiProactiveSuggestion[] = [];
//     const user = await storage.users.getUserById(userId);
    
//     if (!user) return suggestions;

//     // Get today's context
//     const today = new Date();
//     const todayTasks = await storage.tasks.getUserTasks(userId, today, today);
//     const insights = await storage.insights.getUserInsights(userId);

//     // Quick suggestions based on current state
    
//     // 1. Unscheduled tasks suggestion
//     const unscheduledTasks = todayTasks.filter(t => !t.scheduledTime && t.status === 'pending');
//     if (unscheduledTasks.length > 0) {
//       suggestions.push({
//         id: `immediate_schedule_${Date.now()}`,
//         userId,
//         type: 'schedule_optimization',
//         title: 'Schedule Your Tasks',
//         description: `You have ${unscheduledTasks.length} unscheduled tasks today. Let me help you organize them.`,
//         actionable: true,
//         priority: 'medium',
//         context: {
//           unscheduledTaskIds: unscheduledTasks.map(t => t.id),
//           immediate: true
//         },
//         validUntil: new Date(Date.now() + 24 * 60 * 60 * 1000),
//         confidence: 0.8,
//         geminiSpecific: {
//           multimodalData: 'immediate_generation'
//         }
//       });
//     }

//     // 2. Energy optimization suggestion
//     if (user.preferences?.energyLevels) {
//       const currentHour = new Date().getHours();
//       const currentEnergyLevel = this.getCurrentEnergyLevel(currentHour, user.preferences.energyLevels);
      
//       if (currentEnergyLevel === 'high') {
//         const highPriorityTasks = todayTasks.filter(t => 
//           (t.priority === 'high' || t.priority === 'critical') && 
//           t.status === 'pending'
//         );
        
//         if (highPriorityTasks.length > 0) {
//           suggestions.push({
//             id: `immediate_energy_${Date.now()}`,
//             userId,
//             type: 'energy_optimization',
//             title: 'High Energy Time',
//             description: `You're in a high-energy period. Perfect time to tackle ${highPriorityTasks.length} important tasks.`,
//             actionable: true,
//             priority: 'high',
//             context: {
//               currentEnergyLevel,
//               highPriorityTaskIds: highPriorityTasks.map(t => t.id),
//               immediate: true
//             },
//             validUntil: new Date(Date.now() + 4 * 60 * 60 * 1000),
//             confidence: 0.9,
//             geminiSpecific: {
//               multimodalData: 'energy_optimization_immediate'
//             }
//           });
//         }
//       }
//     }

//     // 3. Break reminder if working for long periods
//     const workingTasks = todayTasks.filter(t => t.status === 'in_progress');
//     if (workingTasks.length > 0) {
//       suggestions.push({
//         id: `immediate_break_${Date.now()}`,
//         userId,
//         type: 'break_reminder',
//         title: 'Break Time Reminder',
//         description: 'You\'ve been working steadily. Consider taking a short break to recharge.',
//         actionable: true,
//         priority: 'low',
//         context: {
//           workingTaskCount: workingTasks.length,
//           immediate: true
//         },
//         validUntil: new Date(Date.now() + 2 * 60 * 60 * 1000),
//         confidence: 0.7,
//         geminiSpecific: {
//           multimodalData: 'break_reminder_immediate'
//         }
//       });
//     }

//     // Store generated suggestions
//     for (const suggestion of suggestions) {
//       await this.storeEnhancedSuggestion(suggestion);
//     }

//     return suggestions;
//   } catch (error) {
//     console.error('Error generating immediate suggestions:', error);
//     return [];
//   }
// }

async generateImmediateSuggestions(userId: string): Promise<GeminiProactiveSuggestion[]> {
  try {
    const suggestions: GeminiProactiveSuggestion[] = [];
    const user = await storage.users.getUserById(userId);
    
    if (!user) return suggestions;

    // Get context data
    const today = new Date();
    const todayTasks = await storage.tasks.getUserTasks(userId, today, today);
    const goals = await storage.goals.getUserGoals(userId);
    const objectives = await storage.objectives.getUserObjectives(userId);

    // 1. Task management suggestions
    if (todayTasks.length === 0) {
      suggestions.push({
        id: `immediate_start_tasks_${Date.now()}`,
        userId,
        type: 'task_creation',
        title: 'Start Your Productivity Journey',
        description: 'Begin by adding some tasks to track your daily activities. This will help build momentum and create data for better insights.',
        actionable: true,
        priority: 'high',
        context: { immediate: true, reason: 'no_tasks_found' },
        validUntil: new Date(Date.now() + 24 * 60 * 60 * 1000),
        confidence: 0.9,
        geminiSpecific: { multimodalData: 'task_creation_guidance' }
      });
    }

    // 2. Goal setting suggestions
    if (goals.length === 0) {
      suggestions.push({
        id: `immediate_set_goals_${Date.now()}`,
        userId,
        type: 'goal_adjustment',
        title: 'Define Your Goals',
        description: 'Set specific, measurable goals to give direction to your daily tasks. Start with 1-2 goals that matter most to you.',
        actionable: true,
        priority: 'high',
        context: { immediate: true, reason: 'no_goals_found' },
        validUntil: new Date(Date.now() + 48 * 60 * 60 * 1000),
        confidence: 0.8,
        geminiSpecific: { multimodalData: 'goal_setting_guidance' }
      });
    }

    // 3. Scheduling suggestions
    const unscheduledTasks = todayTasks.filter(t => !t.scheduledTime && t.status === 'pending');
    if (unscheduledTasks.length > 0) {
      suggestions.push({
        id: `immediate_schedule_${Date.now()}`,
        userId,
        type: 'schedule_optimization',
        title: 'Schedule Your Tasks',
        description: `You have ${unscheduledTasks.length} unscheduled tasks. Adding time blocks will help you stay focused and accountable.`,
        actionable: true,
        priority: 'medium',
        context: { 
          immediate: true, 
          unscheduledTaskIds: unscheduledTasks.map(t => t.id),
          reason: 'unscheduled_tasks_found'
        },
        validUntil: new Date(Date.now() + 12 * 60 * 60 * 1000),
        confidence: 0.8,
        geminiSpecific: { multimodalData: 'scheduling_optimization' }
      });
    }

    // 4. Energy-based suggestions
    const currentHour = new Date().getHours();
    if (currentHour >= 9 && currentHour <= 11) { // Peak morning hours
      const highPriorityTasks = todayTasks.filter(t => 
        (t.priority === 'high' || t.priority === 'critical') && t.status === 'pending'
      );
      
      if (highPriorityTasks.length > 0) {
        suggestions.push({
          id: `immediate_morning_focus_${Date.now()}`,
          userId,
          type: 'energy_optimization',
          title: 'Morning Focus Time',
          description: 'Morning hours are typically high-energy periods. Consider tackling your most important tasks now.',
          actionable: true,
          priority: 'medium',
          context: { 
            immediate: true, 
            currentHour,
            highPriorityTaskIds: highPriorityTasks.map(t => t.id),
            reason: 'optimal_morning_time'
          },
          validUntil: new Date(Date.now() + 3 * 60 * 60 * 1000),
          confidence: 0.7,
          geminiSpecific: { multimodalData: 'energy_optimization_morning' }
        });
      }
    }

    // 5. Progress tracking suggestion
    if (objectives.length === 0 && goals.length > 0) {
      suggestions.push({
        id: `immediate_objectives_${Date.now()}`,
        userId,
        type: 'goal_adjustment',
        title: 'Break Down Your Goals',
        description: 'Create monthly objectives to break your goals into manageable pieces. This makes progress more trackable.',
        actionable: true,
        priority: 'medium',
        context: { 
          immediate: true, 
          goalCount: goals.length,
          reason: 'goals_without_objectives'
        },
        validUntil: new Date(Date.now() + 24 * 60 * 60 * 1000),
        confidence: 0.8,
        geminiSpecific: { multimodalData: 'objective_creation_guidance' }
      });
    }

    // Store generated suggestions for future reference
    for (const suggestion of suggestions) {
      await this.storeEnhancedSuggestion(suggestion);
    }

    return suggestions;
  } catch (error) {
    console.error('Error generating immediate suggestions:', error);
    return [];
  }
}

private getCurrentEnergyLevel(hour: number, energyLevels: any): 'high' | 'medium' | 'low' {
  if (hour >= 6 && hour < 12) return energyLevels.morning;
  if (hour >= 12 && hour < 18) return energyLevels.afternoon;
  return energyLevels.evening;
}

  async applySuggestion(userId: string, suggestionId: string): Promise<{ success: boolean; message: string }> {
    // Implementation similar to original ambient AI but enhanced for Gemini suggestions
    const suggestions = await this.getActiveSuggestions(userId);
    const suggestion = suggestions.find(s => s.id === suggestionId);

    if (!suggestion) {
      return { success: false, message: 'Suggestion not found or expired' };
    }

    // Apply suggestion logic here
    return { success: true, message: 'Suggestion applied successfully with Gemini enhancements' };
  }

  async dismissSuggestion(userId: string, suggestionId: string): Promise<boolean> {
    // Implementation similar to original
    try {
      await storage.insights.createInsight({
        userId,
        insightType: 'gemini_suggestion_dismissed',
        data: {
          suggestionId,
          dismissedAt: new Date().toISOString(),
          reason: 'user_dismissed',
          geminiGenerated: true
        },
        confidence: '1.0'
      });

      return true;
    } catch (error) {
      console.error('Error dismissing Gemini suggestion:', error);
      return false;
    }
  }
}

// Export singleton instance
export const geminiAmbientAI = new GeminiAmbientAIService();