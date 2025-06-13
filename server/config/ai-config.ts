export interface AIConfig {
  provider: 'openai' | 'gemini';
  openai: {
    apiKey: string;
    model: string;
    maxTokens: number;
    temperature: number;
  };
  gemini: {
    apiKey: string;
    model: string;
    visionModel: string;
    maxTokens: number;
    temperature: number;
  };
  fallback: {
    enabled: boolean;
    maxRetries: number;
  };
  features: {
    multimodal: boolean;
    conversationalMemory: boolean;
    visualAnalysis: boolean;
    autoSwitch: boolean;
  };
}

export const aiConfig: AIConfig = {
  provider: (process.env.AI_PROVIDER as 'openai' | 'gemini') || 'gemini',
  openai: {
    apiKey: process.env.OPENAI_API_KEY || '',
    model: process.env.OPENAI_MODEL || 'gpt-4-turbo-preview',
    maxTokens: parseInt(process.env.OPENAI_MAX_TOKENS || '4096'),
    temperature: parseFloat(process.env.OPENAI_TEMPERATURE || '0.7'),
  },
  gemini: {
    apiKey: process.env.GEMINI_API_KEY || '',
    model: process.env.GEMINI_MODEL || 'gemini-2.0-flash-exp',
    visionModel: process.env.GEMINI_VISION_MODEL || 'gemini-2.0-flash-exp',
    maxTokens: parseInt(process.env.GEMINI_MAX_TOKENS || '8192'),
    temperature: parseFloat(process.env.GEMINI_TEMPERATURE || '0.7'),
  },
  fallback: {
    enabled: process.env.AI_FALLBACK_ENABLED === 'true',
    maxRetries: parseInt(process.env.AI_FALLBACK_MAX_RETRIES || '1'),
  },
  features: {
    multimodal: process.env.AI_MULTIMODAL_ENABLED !== 'false',
    conversationalMemory: process.env.AI_CONVERSATIONAL_MEMORY_ENABLED !== 'false',
    visualAnalysis: process.env.AI_VISUAL_ANALYSIS_ENABLED !== 'false',
    autoSwitch: process.env.AI_AUTO_SWITCH_ENABLED === 'true',
  }
};

export function validateAIConfig(): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  if (!aiConfig.openai.apiKey && !aiConfig.gemini.apiKey) {
    errors.push('At least one AI provider API key must be configured');
  }
  
  if (aiConfig.provider === 'openai' && !aiConfig.openai.apiKey) {
    errors.push('OpenAI API key is required when OpenAI is the selected provider');
  }
  
  if (aiConfig.provider === 'gemini' && !aiConfig.gemini.apiKey) {
    errors.push('Gemini API key is required when Gemini is the selected provider');
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
}