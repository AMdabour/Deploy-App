import { aiService as openAIService } from './ai';
import { geminiAIService } from './gemini-ai';
import { ambientAI as openAIAmbientAI } from './ambient-ai';
import { geminiAmbientAI } from './gemini-ambient-ai';
import { personalizationEngine } from './personalization';

export type AIProvider = 'openai' | 'gemini';

export interface AIServiceInterface {
  decomposeGoal(goal: any, user: any): Promise<any>;
  generateTasksFromObjective(objective: any, goal: any, user: any, weekNumber?: number): Promise<any>;
  processNaturalLanguage(text: string, user: any, context?: any): Promise<any>;
  optimizeSchedule(userId: string, date: Date, tasks: any[]): Promise<any>;
  generateProductivityInsights(userId: string): Promise<any>;
  generateContextualSuggestions?(userId: string, context: any): Promise<any>;
  createRoadmap(prompt: string, user: any): Promise<any>; // Add this line
}

export interface AmbientAIInterface {
  startAmbientLearning?(userId: string, options?: any): Promise<void>;
  startEnhancedAmbientLearning?(userId: string, options?: any): Promise<void>;
  stopAmbientLearning(userId: string): void;
  getActiveSuggestions(userId: string): Promise<any[]>;
  applySuggestion(userId: string, suggestionId: string): Promise<{ success: boolean; message: string }>;
  dismissSuggestion(userId: string, suggestionId: string): Promise<boolean>;
  generateProactiveSuggestions?(userId: string): Promise<any[]>;
  generateEnhancedProactiveSuggestions?(userId: string, options?: any): Promise<any[]>;
  addConversation?(userId: string, role: 'user' | 'assistant', content: string): void;
  analyzeWorkspaceVisually?(userId: string, imageData: string): Promise<any>;
}

class AIServiceFactory {
  private currentProvider: AIProvider;

  constructor() {
    // Read from environment variable or default to gemini
    this.currentProvider = (process.env.AI_PROVIDER as AIProvider) || 'gemini';
    console.log(`🤖 AI Service Factory initialized with provider: ${this.currentProvider}`);
  }

  /**
   * Set the AI provider
   */
  setProvider(provider: AIProvider): void {
    if (provider !== 'openai' && provider !== 'gemini') {
      throw new Error(`Unsupported AI provider: ${provider}. Supported providers: openai, gemini`);
    }
    
    this.currentProvider = provider;
    console.log(`🔄 AI Service switched to: ${provider}`);
    
    // Update environment variable for persistence
    process.env.AI_PROVIDER = provider;
  }

  /**
   * Get the current AI provider
   */
  getCurrentProvider(): AIProvider {
    return this.currentProvider;
  }

  /**
   * Get the AI service instance based on current provider
   */
  getAIService(): AIServiceInterface {
    switch (this.currentProvider) {
      case 'openai':
        return openAIService as unknown as AIServiceInterface;
      case 'gemini':
        return geminiAIService as unknown as AIServiceInterface;
      default:
        throw new Error(`Unsupported AI provider: ${this.currentProvider}`);
    }
  }

  /**
   * Get the Ambient AI service instance based on current provider
   */
  getAmbientAIService(): AmbientAIInterface {
    switch (this.currentProvider) {
      case 'openai':
        return openAIAmbientAI as AmbientAIInterface;
      case 'gemini':
        return geminiAmbientAI as AmbientAIInterface;
      default:
        throw new Error(`Unsupported AI provider: ${this.currentProvider}`);
    }
  }

  /**
   * Get personalization engine (provider-agnostic)
   */
  getPersonalizationEngine() {
    return personalizationEngine;
  }

  /**
   * Switch provider and return the new services
   */
  switchProvider(provider: AIProvider): { 
    aiService: AIServiceInterface; 
    ambientService: AmbientAIInterface;
    personalizationService: typeof personalizationEngine;
  } {
    this.setProvider(provider);
    return {
      aiService: this.getAIService(),
      ambientService: this.getAmbientAIService(),
      personalizationService: this.getPersonalizationEngine()
    };
  }

  /**
   * Test both providers and return performance metrics
   */
  async testProviders(): Promise<{
    openai: { available: boolean; responseTime?: number; error?: string };
    gemini: { available: boolean; responseTime?: number; error?: string };
    recommendation: AIProvider;
  }> {
    const results = {
      openai: { available: false, responseTime: undefined as number | undefined, error: undefined as string | undefined },
      gemini: { available: false, responseTime: undefined as number | undefined, error: undefined as string | undefined },
      recommendation: 'gemini' as AIProvider
    };

    const mockUser = {
      firstName: 'Test',
      timezone: 'UTC',
      preferences: { 
        workingHours: { start: '09:00', end: '17:00' },
        energyLevels: { morning: 'high', afternoon: 'medium', evening: 'low' }
      }
    };
    
    const mockGoal = {
      title: 'Test AI Connection',
      description: 'Simple test to verify AI connectivity',
      category: 'personal',
      targetYear: 2024,
      priority: 'medium',
      status: 'active'
    };

    // Test OpenAI
    try {
      const startTime = Date.now();
      await openAIService.decomposeGoal(mockGoal as any, mockUser as any);
      results.openai.responseTime = Date.now() - startTime;
      results.openai.available = true;
    } catch (error) {
      results.openai.error = error instanceof Error ? error.message : String(error);
      console.warn('⚠️ OpenAI test failed:', results.openai.error);
    }

    // Test Gemini
    try {
      const startTime = Date.now();
      await geminiAIService.decomposeGoal(mockGoal as any, mockUser as any);
      results.gemini.responseTime = Date.now() - startTime;
      results.gemini.available = true;
    } catch (error) {
      results.gemini.error = error instanceof Error ? error.message : String(error);
      console.warn('⚠️ Gemini test failed:', results.gemini.error);
    }

    // Determine recommendation based on availability and performance
    if (results.gemini.available && results.openai.available) {
      // Both available, prefer Gemini if faster or similar performance
      if (results.gemini.responseTime! <= (results.openai.responseTime! * 1.2)) {
        results.recommendation = 'gemini';
      } else {
        results.recommendation = 'openai';
      }
    } else if (results.gemini.available) {
      results.recommendation = 'gemini';
    } else if (results.openai.available) {
      results.recommendation = 'openai';
    } else {
      console.error('❌ No AI providers available!');
      throw new Error('No AI providers are available');
    }

    console.log(`🏆 AI Provider Test Results - Recommended: ${results.recommendation}`);
    return results;
  }

  /**
   * Auto-select the best available provider
   */
  async autoSelectProvider(): Promise<AIProvider> {
    try {
      const testResults = await this.testProviders();
      this.setProvider(testResults.recommendation);
      return testResults.recommendation;
    } catch (error) {
      console.error('❌ Auto-selection failed, falling back to current provider:', this.currentProvider);
      return this.currentProvider;
    }
  }

  /**
   * Get provider-specific capabilities
   */
  getProviderCapabilities(provider?: AIProvider): {
    multimodal: boolean;
    conversationalMemory: boolean;
    contextualAwareness: boolean;
    visualAnalysis: boolean;
    maxTokens: number;
    supportedModels: string[];
  } {
    const targetProvider = provider || this.currentProvider;
    
    switch (targetProvider) {
      case 'openai':
        return {
          multimodal: true,
          conversationalMemory: false,
          contextualAwareness: true,
          visualAnalysis: true,
          maxTokens: 4096,
          supportedModels: ['gpt-4-turbo-preview', 'gpt-4', 'gpt-3.5-turbo']
        };
      case 'gemini':
        return {
          multimodal: true,
          conversationalMemory: true,
          contextualAwareness: true,
          visualAnalysis: true,
          maxTokens: 8192,
          supportedModels: ['gemini-2.0-flash-exp', 'gemini-pro', 'gemini-pro-vision']
        };
      default:
        throw new Error(`Unknown provider: ${targetProvider}`);
    }
  }

  /**
   * Execute method with automatic fallback to alternative provider
   */
  async executeWithFallback<T>(
    method: (service: AIServiceInterface) => Promise<T>,
    maxRetries: number = 1
  ): Promise<T> {
    const primaryProvider = this.currentProvider;
    const fallbackProvider: AIProvider = primaryProvider === 'openai' ? 'gemini' : 'openai';
    
    try {
      const service = this.getAIService();
      return await method(service);
    } catch (error) {
      console.warn(`⚠️ Primary provider (${primaryProvider}) failed:`, error);
      
      if (maxRetries > 0) {
        console.log(`🔄 Attempting fallback to ${fallbackProvider}...`);
        
        try {
          this.setProvider(fallbackProvider);
          const fallbackService = this.getAIService();
          const result = await method(fallbackService);
          
          console.log(`✅ Fallback to ${fallbackProvider} successful`);
          return result;
        } catch (fallbackError) {
          console.error(`❌ Fallback to ${fallbackProvider} also failed:`, fallbackError);
          // Restore original provider
          this.setProvider(primaryProvider);
          throw fallbackError;
        }
      } else {
        throw error;
      }
    }
  }
}

// Export singleton instance
export const aiServiceFactory = new AIServiceFactory();

// Export convenient getters with type safety
export const getAIService = (): AIServiceInterface => aiServiceFactory.getAIService();
export const getAmbientAIService = (): AmbientAIInterface => aiServiceFactory.getAmbientAIService();
export const getPersonalizationEngine = () => aiServiceFactory.getPersonalizationEngine();

// Export utility functions
export const switchAIProvider = (provider: AIProvider) => aiServiceFactory.switchProvider(provider);
export const getCurrentAIProvider = () => aiServiceFactory.getCurrentProvider();
export const testAIProviders = () => aiServiceFactory.testProviders();
export const autoSelectAIProvider = () => aiServiceFactory.autoSelectProvider();