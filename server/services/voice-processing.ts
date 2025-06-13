import OpenAI from 'openai';
import fs from 'fs';
import path from 'path';
import { storage } from '../storage';
import type { DbUser } from '../db';
import { aiService } from './ai';
import { geminiAIService } from './gemini-ai';
import { getCurrentAIProvider } from './ai-factory';
import { v4 as uuidv4 } from 'uuid';
import { extractFieldAndValueFromText, extractTaskFromText, findTaskByTitle, getFieldDisplayName, getValueDisplayText, inferFieldAndValue, normalizeField, normalizeValue, transformModifyTaskEntities, validateFieldValue } from 'server/routes/ai';

// Initialize OpenAI for Whisper
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export interface VoiceProcessingResult {
  transcript: string;
  confidence: number;
  language: string;
  duration: number;
  nlpResult?: any;
  executionResult?: any;
  processingTime: number;
}

export interface VoiceUploadResult {
  success: boolean;
  data?: VoiceProcessingResult;
  error?: string;
}

export class VoiceProcessingService {
  // ✅ ADD: Main method that the route is calling
  async processVoiceCommand(
    audioBuffer: Buffer,
    filename: string,
    user: DbUser,
    options: {
      language?: string;
      executeCommand?: boolean;
      context?: any;
    } = {}
  ): Promise<VoiceProcessingResult> {
    // Create a temporary file-like object from buffer
    const tempFile = {
      buffer: audioBuffer,
      originalname: filename,
      mimetype: this.getMimeTypeFromFilename(filename),
      size: audioBuffer.length,
      path: '', // We'll handle this differently
    };

    return this.processAudioBuffer(tempFile, user.id, options);
  }

  // ✅ ADD: Process audio from buffer (called by processVoiceCommand)
  async processAudioBuffer(
    audioFile: {
      buffer: Buffer;
      originalname: string;
      mimetype: string;
      size: number;
      path?: string;
    },
    userId: string,
    options: {
      executeCommand?: boolean;
      language?: string;
      context?: any;
    } = {}
  ): Promise<VoiceProcessingResult> {
    const startTime = Date.now();
    
    try {
      // Validate audio file
      if (!audioFile || !audioFile.buffer) {
        throw new Error('No audio data provided');
      }

      // Check file size (max 25MB for Whisper)
      if (audioFile.size > 25 * 1024 * 1024) {
        throw new Error('Audio file too large (max 25MB)');
      }

      // Check file type
      const allowedTypes = ['audio/webm', 'audio/wav', 'audio/mp3', 'audio/m4a', 'audio/ogg', 'audio/mpeg', 'audio/mp4', 'audio/x-m4a'];
      if (!allowedTypes.includes(audioFile.mimetype)) {
        throw new Error(`Unsupported audio format: ${audioFile.mimetype}`);
      }

      // Create temporary file for Whisper API
      const tempDir = path.join(process.cwd(), 'temp');
      if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir, { recursive: true });
      }

      const tempFilePath = path.join(tempDir, `voice_${Date.now()}_${audioFile.originalname}`);
      fs.writeFileSync(tempFilePath, audioFile.buffer);

      // Transcribe using OpenAI Whisper
      const transcription = await openai.audio.transcriptions.create({
        file: fs.createReadStream(tempFilePath),
        model: 'whisper-1',
        language: options.language || 'en',
        response_format: 'verbose_json',
      });

      // Clean up temp file
      try {
        fs.unlinkSync(tempFilePath);
      } catch (cleanupError) {
        console.warn('Failed to cleanup temp file:', cleanupError);
      }

      if (!transcription.text || transcription.text.trim().length === 0) {
        throw new Error('No speech detected in audio');
      }

      console.log('✅ Voice transcription successful:', transcription.text);

      // Get user data
      const user = await storage.users.getUserById(userId);
      if (!user) {
        throw new Error('User not found');
      }

      // Process natural language
      let nlpResult = null;
      let executionResult = null;

      try {
        const currentProvider = getCurrentAIProvider();
        
        if (currentProvider === 'gemini') {
          nlpResult = await geminiAIService.processNaturalLanguage(
            transcription.text,
            user,
            options.context
          );
        } else {
          nlpResult = await aiService.processNaturalLanguage(
            transcription.text,
            user,
            options.context
          );
        }

        console.log('✅ NLP processing result:', nlpResult);

        // Execute command if requested and confidence is high enough
        if (options.executeCommand && nlpResult.confidence > 0.5) { // Lowered threshold slightly
          console.log('🎯 Executing command with confidence:', nlpResult.confidence);
          
          try {
            executionResult = await this.executeVoiceCommand(userId, nlpResult);
            console.log('✅ Voice command execution result:', JSON.stringify(executionResult, null, 2));
            
            // ✅ Validate execution result structure
            if (!executionResult || typeof executionResult.success !== 'boolean') {
              console.error('❌ Invalid execution result structure:', executionResult);
              throw new Error('Invalid command execution result');
            }
          } catch (execError) {
            console.error('❌ Command execution failed:', execError);
            console.error('Error stack:', execError instanceof Error ? execError.stack : 'No stack trace');
            
            executionResult = {
              success: false,
              message: `Command execution failed: ${execError instanceof Error ? execError.message : 'Unknown error'}`
            };
          }
        }
      } catch (nlpError) {
        console.error('NLP processing failed:', nlpError);
        nlpResult = {
          intent: 'ask_question',
          entities: {},
          confidence: 0.3,
          response: "I heard you, but I'm not sure how to help with that. Could you try rephrasing your request?"
        };
      }

      // Store voice command for analytics
      await this.storeVoiceCommand(userId, {
        transcript: transcription.text,
        confidence: 0.8,
        language: options.language || 'en',
        intent: nlpResult?.intent,
        executed: options.executeCommand,
        success: executionResult?.success || false,
      });

      const processingTime = Date.now() - startTime;

      return {
        transcript: transcription.text,
        confidence: 0.8,
        language: options.language || 'en',
        duration: transcription.duration || 0,
        nlpResult,
        executionResult,
        processingTime,
      };
    } catch (error) {
      console.error('Voice processing error:', error);
      throw new Error(
        error instanceof Error
          ? error.message
          : 'Failed to process voice command'
      );
    }
  }

  // ✅ ADD: Audio-only transcription method
  async processAudioToText(
    audioBuffer: Buffer,
    filename: string,
    options: {
      language?: string;
    } = {}
  ): Promise<{ transcript: string; confidence: number; language: string }> {
    try {
      // Create temporary file for Whisper API
      const tempDir = path.join(process.cwd(), 'temp');
      if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir, { recursive: true });
      }

      const tempFilePath = path.join(tempDir, `transcribe_${Date.now()}_${filename}`);
      fs.writeFileSync(tempFilePath, audioBuffer);

      // Transcribe using OpenAI Whisper
      const transcription = await openai.audio.transcriptions.create({
        file: fs.createReadStream(tempFilePath),
        model: 'whisper-1',
        language: options.language || 'en',
        response_format: 'verbose_json',
      });

      // Clean up temp file
      try {
        fs.unlinkSync(tempFilePath);
      } catch (cleanupError) {
        console.warn('Failed to cleanup temp file:', cleanupError);
      }

      if (!transcription.text || transcription.text.trim().length === 0) {
        throw new Error('No speech detected in audio');
      }

      return {
        transcript: transcription.text,
        confidence: 0.8, // Whisper doesn't provide confidence, using default
        language: options.language || 'en',
      };
    } catch (error) {
      console.error('Audio transcription error:', error);
      throw new Error(
        error instanceof Error
          ? error.message
          : 'Failed to transcribe audio'
      );
    }
  }

  // ✅ ADD: Get voice command history
  async getVoiceCommandHistory(
    userId: string,
    options: {
      limit?: number;
      offset?: number;
      dateFrom?: Date;
      dateTo?: Date;
    } = {}
  ): Promise<any[]> {
    try {
      // Get insights with voice command data
      const insights = await storage.insights.getUserInsights(
        userId,
        'voice_command_usage'
      );

      let filteredInsights = insights;

      // Apply date filters
      if (options.dateFrom) {
        filteredInsights = filteredInsights.filter(
          insight => new Date(insight.createdAt) >= options.dateFrom!
        );
      }

      if (options.dateTo) {
        filteredInsights = filteredInsights.filter(
          insight => new Date(insight.createdAt) <= options.dateTo!
        );
      }

      // Sort by date (newest first)
      filteredInsights.sort((a, b) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );

      // Apply pagination
      const offset = options.offset || 0;
      const limit = options.limit || 20;
      
      return filteredInsights
        .slice(offset, offset + limit)
        .map(insight => {
          const data = insight.data as any;
          return {
            id: insight.id,
            transcript: data.transcript,
            confidence: data.confidence,
            language: data.language,
            intent: data.intent,
            executed: data.executed,
            success: data.success,
            processingTime: data.processingTime,
            createdAt: insight.createdAt,
          };
        });
    } catch (error) {
      console.error('Get voice history error:', error);
      throw new Error('Failed to get voice command history');
    }
  }

  // ✅ ADD: Voice usage analytics
  async analyzeVoiceUsagePatterns(userId: string): Promise<any> {
    try {
      const insights = await storage.insights.getUserInsights(
        userId,
        'voice_command_usage'
      );

      const totalCommands = insights.length;
      const successfulCommands = insights.filter(i => (i.data as any).success).length;
      const averageConfidence = totalCommands > 0 
        ? insights.reduce((sum, i) => sum + ((i.data as any).confidence || 0), 0) / totalCommands 
        : 0;

      // Intent distribution
      const intentCounts: { [key: string]: number } = {};
      insights.forEach(insight => {
        const intent = (insight.data as any).intent || 'unknown';
        intentCounts[intent] = (intentCounts[intent] || 0) + 1;
      });

      // Language distribution
      const languageCounts: { [key: string]: number } = {};
      insights.forEach(insight => {
        const language = (insight.data as any).language || 'en';
        languageCounts[language] = (languageCounts[language] || 0) + 1;
      });

      return {
        summary: {
          totalCommands,
          successfulCommands,
          successRate: totalCommands > 0 ? (successfulCommands / totalCommands) * 100 : 0,
          averageConfidence: Math.round(averageConfidence * 100),
        },
        intentDistribution: intentCounts,
        languageDistribution: languageCounts,
        recentActivity: insights
          .slice(-10)
          .reverse()
          .map(insight => ({
            transcript: (insight.data as any).transcript,
            intent: (insight.data as any).intent,
            success: (insight.data as any).success,
            date: insight.createdAt,
          })),
      };
    } catch (error) {
      console.error('Voice analytics error:', error);
      throw new Error('Failed to analyze voice usage patterns');
    }
  }

  // ✅ ADD: Helper method to get MIME type from filename
  private getMimeTypeFromFilename(filename: string): string {
    const ext = path.extname(filename).toLowerCase();
    const mimeTypes: { [key: string]: string } = {
      '.mp3': 'audio/mpeg',
      '.wav': 'audio/wav',
      '.webm': 'audio/webm',
      '.m4a': 'audio/x-m4a',
      '.mp4': 'audio/mp4',
      '.ogg': 'audio/ogg',
    };
    return mimeTypes[ext] || 'audio/wav';
  }

  async processAudioFile(
    audioFile: Express.Multer.File,
    userId: string,
    options: {
      executeCommand?: boolean;
      language?: string;
      context?: any;
    } = {}
  ): Promise<VoiceProcessingResult> {
    const startTime = Date.now();
    
    try {
      // Validate audio file
      if (!audioFile) {
        throw new Error('No audio file provided');
      }

      // Check file size (max 25MB for Whisper)
      if (audioFile.size > 25 * 1024 * 1024) {
        throw new Error('Audio file too large (max 25MB)');
      }

      // Check file type
      const allowedTypes = ['audio/webm', 'audio/wav', 'audio/mp3', 'audio/m4a', 'audio/ogg'];
      if (!allowedTypes.includes(audioFile.mimetype)) {
        throw new Error(`Unsupported audio format: ${audioFile.mimetype}`);
      }

      // Transcribe using OpenAI Whisper
      const transcription = await openai.audio.transcriptions.create({
        file: fs.createReadStream(audioFile.path),
        model: 'whisper-1',
        language: options.language || 'en',
        response_format: 'verbose_json',
      });

      // Clean up temp file
      try {
        fs.unlinkSync(audioFile.path);
      } catch (cleanupError) {
        console.warn('Failed to cleanup temp file:', cleanupError);
      }

      if (!transcription.text || transcription.text.trim().length === 0) {
        throw new Error('No speech detected in audio');
      }

      // Get user data
      const user = await storage.users.getUserById(userId);
      if (!user) {
        throw new Error('User not found');
      }

      // Process natural language
      let nlpResult = null;
      let executionResult = null;

      try {
        const currentProvider = getCurrentAIProvider();
        
        if (currentProvider === 'gemini') {
          nlpResult = await geminiAIService.processNaturalLanguage(
            transcription.text,
            user,
            options.context
          );
        } else {
          nlpResult = await aiService.processNaturalLanguage(
            transcription.text,
            user,
            options.context
          );
        }

        // Execute command if requested and confidence is high enough
        if (options.executeCommand && nlpResult.confidence > 0.6) {
          executionResult = await this.executeVoiceCommand(userId, nlpResult);
        }
      } catch (nlpError) {
        console.error('NLP processing failed:', nlpError);
        nlpResult = {
          intent: 'ask_question',
          entities: {},
          confidence: 0.3,
          response: "I heard you, but I'm not sure how to help with that. Could you try rephrasing your request?"
        };
      }

      // Store voice command for analytics
      await this.storeVoiceCommand(userId, {
        transcript: transcription.text,
        confidence: 0.8,
        language: options.language || 'en',
        intent: nlpResult?.intent,
        executed: options.executeCommand,
        success: executionResult?.success || false,
      });

      const processingTime = Date.now() - startTime;

      return {
        transcript: transcription.text,
        confidence: 0.8,
        language: options.language || 'en',
        duration: transcription.duration || 0,
        nlpResult,
        executionResult,
        processingTime,
      };
    } catch (error) {
      console.error('Voice processing error:', error);
      throw new Error(
        error instanceof Error
          ? error.message
          : 'Failed to process voice command'
      );
    }
  }

  private async executeVoiceCommand(userId: string, nlpResult: any): Promise<any> {
    try {
      console.log(`🎯 Executing voice command: ${nlpResult.intent}`);
      
      switch (nlpResult.intent) {
        case 'add_task':
          return await this.executeAddTask(userId, nlpResult.entities);
          
        case 'modify_task':
          try {
            console.log('🔧 Processing modify task with entities:', nlpResult.entities);
            
            // ✅ Transform entities to match expected format
            const transformedEntities = transformModifyTaskEntities(nlpResult.entities);
            
            console.log('🔄 Transformed entities:', transformedEntities);
            
            const modifyResult = await this.executeModifyTask(userId, transformedEntities);
            
            return {
              success: true,
              data: {
                parsed: nlpResult,
                execution: modifyResult, // Use 'execution' instead of 'result'
                response: modifyResult.message
              }
            };
          } catch (error) {
            console.error('Modify task execution error:', error);
            return {
              success: false,
              data: {
                parsed: nlpResult,
                execution: { success: false, message: 'Failed to modify task' },
                response: 'Failed to modify task'
              }
            };
          }
          
        case 'delete_task':
          return await this.executeDeleteTask(userId, nlpResult.entities);
          
        case 'schedule_task':
          return await this.executeScheduleTask(userId, nlpResult.entities);
          
        case 'create_goal':
          return await this.executeCreateGoal(userId, nlpResult.entities);
          
        case 'create_objective':
          return await this.executeCreateObjective(userId, nlpResult.entities);
          
        case 'create_roadmap':
          // Enhanced roadmap creation with better error handling
          const roadmapResult = await this.executeCreateRoadmap(userId, nlpResult.entities);
          console.log('✅ Roadmap creation result:', roadmapResult);
          return roadmapResult;
          
        case 'ask_question':
          return {
            success: true,
            message: nlpResult.response || "I heard your question. For voice commands, try saying things like 'create a task', 'add a goal', or 'make a roadmap for learning programming'."
          };
          
        default:
          return { 
            success: false, 
            message: `Voice command "${nlpResult.intent}" is not supported yet. Try commands like: create task, add goal, or make roadmap.` 
          };
      }
    } catch (error) {
      console.error('Voice command execution error:', error);
      
      // Provide more helpful error messages
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      let userFriendlyMessage = 'I had trouble processing your command. ';
      
      if (errorMessage.includes('target value')) {
        userFriendlyMessage += 'There was an issue with the roadmap structure. ';
      } else if (errorMessage.includes('validation')) {
        userFriendlyMessage += 'The information provided needs some adjustments. ';
      } else if (errorMessage.includes('not found')) {
        userFriendlyMessage += 'I couldn\'t find the requested item. ';
      }
      
      userFriendlyMessage += 'Please try rephrasing your request or use the dashboard instead.';
      
      return {
        success: false,
        message: userFriendlyMessage
      };
    }
  }

  private async executeCreateRoadmap(userId: string, entities: any): Promise<any> {
    try {
      const { prompt, description, title, goal } = entities;

      // Enhanced prompt extraction
      let roadmapPrompt = prompt || description || title || goal;

      if (!roadmapPrompt) {
        return { 
          success: false, 
          message: 'Please provide a description of what you want to achieve. For example: "Create a roadmap to learn programming" or "Plan to start a business"' 
        };
      }

      // Clean and enhance the prompt for better AI processing
      roadmapPrompt = this.enhanceRoadmapPrompt(roadmapPrompt);

      console.log('🎯 Creating roadmap with enhanced prompt:', roadmapPrompt);

      // Get user data
      const user = await storage.users.getUserById(userId);
      if (!user) {
        return { success: false, message: 'User not found' };
      }

      // Generate roadmap with enhanced error handling
      let roadmapResult;
      const currentProvider = getCurrentAIProvider();
      
      try {
        if (currentProvider === 'gemini') {
          roadmapResult = await geminiAIService.createRoadmap(roadmapPrompt, user);
        } else {
          roadmapResult = await aiService.createRoadmap(roadmapPrompt, user);
        }

        // ✅ Validate the result before returning
        if (!roadmapResult || !roadmapResult.goal) {
          throw new Error('Invalid roadmap result structure');
        }

        // ✅ Sanitize the roadmap data
        roadmapResult = this.sanitizeRoadmapResult(roadmapResult);

        console.log('💾 Saving roadmap to database...');
      
        // 1. Create the Goal
        const createdGoal = await storage.goals.createGoal({
          userId,
          title: roadmapResult.goal.title,
          description: roadmapResult.goal.description,
          category: roadmapResult.goal.category || 'personal',
          targetYear: roadmapResult.goal.targetYear || new Date().getFullYear(),
          priority: roadmapResult.goal.priority || 'medium',
          status: 'active',
        });

        console.log('✅ Goal created with ID:', createdGoal.id);

        // 2. Create Objectives
        const createdObjectives = [];
        if (roadmapResult.objectives && Array.isArray(roadmapResult.objectives)) {
          for (const objective of roadmapResult.objectives) {
            try {
              const createdObjective = await storage.objectives.createObjective({
                userId,
                goalId: createdGoal.id,
                title: objective.title,
                description: objective.description || '',
                targetMonth: objective.targetMonth || new Date().getMonth() + 1,
                targetYear: objective.targetYear || new Date().getFullYear(),
                keyResults: objective.keyResults.map((kr: any) => ({
                  id: uuidv4(),
                  description: kr.description,
                  targetValue: kr.targetValue || 0,
                  currentValue: 0,
                  unit: kr.unit || '',
                  completed: false,
                  })),
                status: 'active',
                progress: '0'
              });
              createdObjectives.push(createdObjective);
              console.log('✅ Objective created:', createdObjective.title);
            } catch (objError) {
              console.error('Failed to create objective:', objective.title, objError);
            }
          }
        }

        // 3. Create Tasks
        const createdTasks = [];
        if (roadmapResult.tasks && Array.isArray(roadmapResult.tasks)) {
          for (const task of roadmapResult.tasks) {
            try {
              // Find matching objective for the task
              let objectiveId = null;
              if (task.objectiveTitle) {
                const matchingObjective = createdObjectives.find(obj => 
                  obj.title.toLowerCase().includes(task.objectiveTitle.toLowerCase()) ||
                  task.objectiveTitle.toLowerCase().includes(obj.title.toLowerCase())
                );
                if (matchingObjective) {
                  objectiveId = matchingObjective.id;
                }
              }

              // Parse scheduled date
              let scheduledDate = new Date();
              if (task.scheduledDate) {
                const parsedDate = this.parseDate(task.scheduledDate);
                scheduledDate = parsedDate || new Date();
              } else if (task.targetMonth && task.targetYear) {
                scheduledDate = new Date(task.targetYear, task.targetMonth - 1, 1);
              }

              const createdTask = await storage.tasks.createTask({
                userId,
                objectiveId,
                goalId: createdGoal.id,
                title: task.title,
                description: task.description || '',
                scheduledDate,
                scheduledTime: task.scheduledTime || null,
                estimatedDuration: task.estimatedDuration || 30,
                priority: task.priority || 'medium',
                status: 'pending',
                tags: task.tags || [],
              });
              createdTasks.push(createdTask);
              console.log('✅ Task created:', createdTask.title);
            } catch (taskError) {
              console.error('Failed to create task:', task.title, taskError);
            }
          }
        }

        console.log(`🎉 Roadmap saved successfully! Goal: ${createdGoal.id}, Objectives: ${createdObjectives.length}, Tasks: ${createdTasks.length}`);


        return {
          success: true,
          message: `Roadmap "${createdGoal.title}" created and saved successfully with ${createdObjectives.length} objectives and ${createdTasks.length} tasks. Check your dashboard to review it!`,
          data: { 
            goal: createdGoal,
            objectives: createdObjectives,
            tasks: createdTasks,
            roadmap: roadmapResult // Keep original for reference
          }
        };
     } catch (aiError) {
         console.error('AI roadmap generation failed:', aiError);
        
        // ✅ Fallback: Create a simple roadmap structure
        const fallbackRoadmap = await this.createFallbackRoadmap(userId, roadmapPrompt);
        
        return {
          success: true,
          message: `Created a basic roadmap structure for "${roadmapPrompt}". You can expand it in your dashboard.`,
          data: { roadmap: fallbackRoadmap }
        };
      }
    } catch (error) {
      console.error('Create roadmap error:', error);
      return {
        success: false,
        message: `I couldn't create the roadmap right now. ${error instanceof Error ? error.message : 'Please try again later.'}`
      };
    }
  }

  // ✅ NEW: Enhance the roadmap prompt for better AI processing
  private enhanceRoadmapPrompt(originalPrompt: string): string {
    // Add context and structure hints for the AI
    let enhancedPrompt = originalPrompt.trim();
    
    // If the prompt is too short, add clarifying context
    if (enhancedPrompt.length < 10) {
      enhancedPrompt = `Create a comprehensive plan to: ${enhancedPrompt}`;
    }
    
    // Add guidance for better AI generation
    if (!enhancedPrompt.toLowerCase().includes('roadmap') && 
        !enhancedPrompt.toLowerCase().includes('plan') &&
        !enhancedPrompt.toLowerCase().includes('strategy')) {
      enhancedPrompt = `Create a detailed roadmap and action plan for: ${enhancedPrompt}`;
    }
    
    return enhancedPrompt;
  }

  // ✅ NEW: Sanitize roadmap results to fix validation issues
  private sanitizeRoadmapResult(roadmapResult: any): any {
    try {
      // Deep clone to avoid mutations
      const sanitized = JSON.parse(JSON.stringify(roadmapResult));
      
      // Sanitize objectives and key results
      if (sanitized.objectives && Array.isArray(sanitized.objectives)) {
        sanitized.objectives = sanitized.objectives.map((objective: any, objIndex: number) => {
          // Ensure objective has required fields
          objective.title = objective.title || `Objective ${objIndex + 1}`;
          objective.description = objective.description || '';
          
          // Sanitize key results
          if (objective.keyResults && Array.isArray(objective.keyResults)) {
            objective.keyResults = objective.keyResults.map((kr: any, krIndex: number) => {
              // Fix target value issues
              if (kr.targetValue !== undefined) {
                const numValue = parseFloat(kr.targetValue);
                kr.targetValue = isNaN(numValue) || numValue <= 0 ? 1 : numValue;
              } else {
                kr.targetValue = 1; // Default value
              }
              
              // Fix current value
              if (kr.currentValue !== undefined) {
                const numValue = parseFloat(kr.currentValue);
                kr.currentValue = isNaN(numValue) || numValue < 0 ? 0 : numValue;
              } else {
                kr.currentValue = 0; // Default value
              }
              
              // Ensure other required fields
              kr.title = kr.title || `Key Result ${krIndex + 1}`;
              kr.description = kr.description || '';
              kr.unit = kr.unit || 'units';
              
              return kr;
            });
          } else {
            // Create default key result if none exist
            objective.keyResults = [{
              title: 'Complete this objective',
              description: 'Mark this objective as completed',
              targetValue: 1,
              currentValue: 0,
              unit: 'completion'
            }];
          }
          
          return objective;
        });
      }
      
      // Sanitize tasks
      if (sanitized.tasks && Array.isArray(sanitized.tasks)) {
        sanitized.tasks = sanitized.tasks.map((task: any, taskIndex: number) => {
          task.title = task.title || `Task ${taskIndex + 1}`;
          task.description = task.description || '';
          task.estimatedDuration = task.estimatedDuration && task.estimatedDuration > 0 ? task.estimatedDuration : 30;
          task.priority = task.priority || 'medium';
          task.status = task.status || 'pending';
          return task;
        });
      }
      
      // Ensure goal structure
      if (sanitized.goal) {
        sanitized.goal.title = sanitized.goal.title || 'New Goal';
        sanitized.goal.description = sanitized.goal.description || '';
        sanitized.goal.category = sanitized.goal.category || 'personal';
        sanitized.goal.priority = sanitized.goal.priority || 'medium';
      }
      
      console.log('✅ Roadmap result sanitized successfully');
      return sanitized;
    } catch (error) {
      console.error('Roadmap sanitization failed:', error);
      return roadmapResult; // Return original if sanitization fails
    }
  }

  // ✅ NEW: Create a fallback roadmap when AI generation fails
  private async createFallbackRoadmap(userId: string, prompt: string): Promise<any> {
    try {
      // Extract a goal title from the prompt
      let goalTitle = prompt;
      if (prompt.toLowerCase().startsWith('create a roadmap')) {
        goalTitle = prompt.replace(/create a roadmap (to|for|about)?/i, '').trim();
      }
      if (goalTitle.length > 100) {
        goalTitle = goalTitle.substring(0, 97) + '...';
      }
      
      // Create a simple goal structure
      const fallbackGoal = {
        title: goalTitle || 'Personal Development Goal',
        description: `A goal to achieve: ${prompt}`,
        category: 'personal',
        priority: 'medium',
        status: 'active',
        targetYear: new Date().getFullYear()
      };
      
      // Create basic objectives
      const fallbackObjectives = [
        {
          title: 'Research and Planning',
          description: 'Research requirements and create a detailed plan',
          targetMonth: new Date().getMonth() + 1,
          targetYear: new Date().getFullYear(),
          keyResults: [
            {
              title: 'Complete initial research',
              description: 'Gather information and resources',
              targetValue: 1,
              currentValue: 0,
              unit: 'completion'
            }
          ],
          status: 'active'
        },
        {
          title: 'Implementation',
          description: 'Execute the plan and work towards the goal',
          targetMonth: new Date().getMonth() + 2,
          targetYear: new Date().getFullYear(),
          keyResults: [
            {
              title: 'Make significant progress',
              description: 'Complete key milestones',
              targetValue: 100,
              currentValue: 0,
              unit: 'percent'
            }
          ],
          status: 'active'
        }
      ];
      
      // Create basic tasks
      const fallbackTasks = [
        {
          title: 'Define clear objectives',
          description: 'Break down the goal into specific, measurable objectives',
          estimatedDuration: 60,
          priority: 'high',
          status: 'pending'
        },
        {
          title: 'Create action plan',
          description: 'Develop a step-by-step plan to achieve the goal',
          estimatedDuration: 90,
          priority: 'high',
          status: 'pending'
        },
        {
          title: 'Start implementation',
          description: 'Begin working on the first steps',
          estimatedDuration: 120,
          priority: 'medium',
          status: 'pending'
        }
      ];
      
      return {
        goal: fallbackGoal,
        objectives: fallbackObjectives,
        tasks: fallbackTasks
      };
    } catch (error) {
      console.error('Fallback roadmap creation failed:', error);
      throw new Error('Failed to create even a basic roadmap structure');
    }
  }

  private async executeAddTask(userId: string, entities: any): Promise<any> {
    try {
      const { title, description, date, time, duration, priority, objective, goal } = entities;

      if (!title) {
        return { success: false, message: 'Task title is required' };
      }

      // Parse date
      let scheduledDate = new Date();
      if (date) {
        const parsedDate = this.parseDate(date);
        if (parsedDate) {
          scheduledDate = parsedDate;
        }
      }

      // Find objective or goal if specified
      let objectiveId = null;
      let goalId = null;

      if (objective) {
        const objectives = await storage.objectives.getUserObjectives(userId);
        const matchedObjective = objectives.find(obj => 
          obj.title.toLowerCase().includes(objective.toLowerCase())
        );
        if (matchedObjective) {
          objectiveId = matchedObjective.id;
          goalId = matchedObjective.goalId;
        }
      }

      if (!objectiveId && goal) {
        const goals = await storage.goals.getUserGoals(userId);
        const matchedGoal = goals.find(g => 
          g.title.toLowerCase().includes(goal.toLowerCase())
        );
        if (matchedGoal) {
          goalId = matchedGoal.id;
        }
      }

      // Create task
      const task = await storage.tasks.createTask({
        userId,
        objectiveId,
        goalId,
        title,
        description: description || '',
        scheduledDate,
        scheduledTime: time || null,
        estimatedDuration: duration || 30,
        priority: priority || 'medium',
        status: 'pending',
        tags: [],
      });

      return {
        success: true,
        message: `Task "${title}" created successfully`,
        data: { task }
      };
    } catch (error) {
      console.error('Add task error:', error);
      return {
        success: false,
        message: 'Failed to create task'
      };
    }
  }

  private async executeCreateGoal(userId: string, entities: any): Promise<any> {
    try {
      const { title, description, category, year, priority } = entities;

      if (!title) {
        return { success: false, message: 'Goal title is required' };
      }

      const goal = await storage.goals.createGoal({
        userId,
        title,
        description: description || '',
        category: category || 'personal',
        targetYear: year || new Date().getFullYear(),
        priority: priority || 'medium',
        status: 'active',
      });

      return {
        success: true,
        message: `Goal "${title}" created successfully`,
        data: { goal }
      };
    } catch (error) {
      console.error('Create goal error:', error);
      return {
        success: false,
        message: 'Failed to create goal'
      };
    }
  }

  private async executeCreateObjective(userId: string, entities: any): Promise<any> {
    try {
      const { title, description, goal, month, year } = entities;

      if (!title) {
        return { success: false, message: 'Objective title is required' };
      }

      // Find goal
      let goalId = null;
      if (goal) {
        const goals = await storage.goals.getUserGoals(userId);
        const matchedGoal = goals.find(g => 
          g.title.toLowerCase().includes(goal.toLowerCase())
        );
        if (matchedGoal) {
          goalId = matchedGoal.id;
        }
      }

      if (!goalId) {
        return { 
          success: false, 
          message: 'Please specify which goal this objective belongs to' 
        };
      }

      const objective = await storage.objectives.createObjective({
        userId,
        goalId,
        title,
        description: description || '',
        targetMonth: month || new Date().getMonth() + 1,
        targetYear: year || new Date().getFullYear(),
        keyResults: [],
        status: 'active',
      });

      return {
        success: true,
        message: `Objective "${title}" created successfully`,
        data: { objective }
      };
    } catch (error) {
      console.error('Create objective error:', error);
      return {
        success: false,
        message: 'Failed to create objective'
      };
    }
  }

  private async executeModifyTask(userId: string, entities: any): Promise<any> {
      try {
        console.log('🔍 ModifyTask entities received:', JSON.stringify(entities, null, 2));
        
        const { original_title, field, newValue, title, originalText, date, time, priority, status, duration, description } = entities;
    
        // ✅ STEP 1: Find the task using multiple strategies
        let task = null;
        let searchTerm = original_title || title || '';
    
        console.log('🔍 Searching for task with identifier:', searchTerm);
        // If no explicit task identifier, try to extract from original text
        if (!searchTerm && originalText) {
          searchTerm = extractTaskFromText(originalText);
        }
    
        if (!searchTerm) {
          return {
            success: false,
            message: 'Please specify which task to modify. For example: "Change task meeting priority to high" or "Update workout to tomorrow"'
          };
        }
    
        // Find the task with fuzzy matching
        task = await findTaskByTitle(userId, searchTerm);
        
        if (!task) {
          // Get all user tasks to show available options
          const userTasks = await storage.tasks.getUserTasks(userId, new Date(0), new Date());
          const taskTitles = userTasks.slice(0, 5).map(t => `"${t.title}"`).join(', ');
          
          return {
            success: false,
            message: `❌ I couldn't find a task matching "${searchTerm}". ${userTasks.length > 0 ? `Available tasks: ${taskTitles}${userTasks.length > 5 ? '...' : ''}` : 'You have no tasks yet.'}`
          };
        }
    
        // ✅ STEP 2: Enhanced field and value detection from entities
        let detectedField = field;
        let detectedValue = newValue;
    
        // ✅ NEW: Check for direct entity fields (this is what was missing!)
        if (!detectedField || !detectedValue) {
          if (date) {
            detectedField = 'scheduledDate';
            detectedValue = date;
            console.log('✅ Found date from entities:', date);
          } else if (time) {
            detectedField = 'scheduledTime';
            detectedValue = time;
            console.log('✅ Found time from entities:', time);
          } else if (priority) {
            detectedField = 'priority';
            detectedValue = priority;
            console.log('✅ Found priority from entities:', priority);
          } else if (status) {
            detectedField = 'status';
            detectedValue = status;
            console.log('✅ Found status from entities:', status);
          } else if (duration) {
            detectedField = 'estimatedDuration';
            detectedValue = duration;
            console.log('✅ Found duration from entities:', duration);
          } else if (description) {
            detectedField = 'description';
            detectedValue = description;
            console.log('✅ Found description from entities:', description);
          }
        }
    
        // ✅ STEP 3: If still no field/value, try to extract from original text
        if ((!detectedField || !detectedValue) && originalText) {
          const extracted = extractFieldAndValueFromText(originalText, task.title);
          if (extracted.field && extracted.value) {
            detectedField = extracted.field;
            detectedValue = extracted.value;
            console.log('✅ Extracted from text:', extracted);
          }
        }
    
        // ✅ STEP 4: Smart inference for common patterns
        if (!detectedField || !detectedValue) {
          // Try to infer from the entities we have
          const inferredResult = inferFieldAndValue(entities, originalText);
          if (inferredResult.field && inferredResult.value) {
            detectedField = inferredResult.field;
            detectedValue = inferredResult.value;
            console.log('✅ Inferred field/value:', inferredResult);
          }
        }
    
        if (!detectedField || !detectedValue) {
          return {
            success: false,
            message: `❌ Please specify what to change about "${task.title}". Examples:\n• "Change priority to high"\n• "Move to tomorrow"\n• "Set duration to 60 minutes"\n• "Mark as completed"`
          };
        }
    
        // ✅ STEP 5: Normalize and validate the field and value
        const normalizedField = normalizeField(detectedField);
        const normalizedValue = await normalizeValue(normalizedField, detectedValue);
    
        if (!normalizedField) {
          return {
            success: false,
            message: `❌ Cannot modify "${detectedField}". Supported fields: title, description, priority, date, time, duration, status, location`
          };
        }
    
        // ✅ STEP 6: Validate the value
        const validation = validateFieldValue(normalizedField, normalizedValue);
        if (!validation.valid) {
          return {
            success: false,
            message: validation.message
          };
        }
    
        // ✅ STEP 7: Update the task
        const updateData: any = {};
        updateData[normalizedField] = normalizedValue;
    
        console.log(`🔧 Updating task "${task.title}" - ${normalizedField}: ${normalizedValue}`);
        
        const updatedTask = await storage.tasks.updateTask(task.id, updateData);
    
        return {
          success: true,
          message: `✅ Successfully updated "${task.title}" - ${getFieldDisplayName(normalizedField)} changed to "${getValueDisplayText(normalizedField, normalizedValue)}"`,
          data: { task: updatedTask }
        };
      } catch (error) {
        console.error('❌ Modify task error:', error);
        return {
          success: false,
          message: 'Failed to modify task: ' + (error instanceof Error ? error.message : 'Unknown error')
        };
      }
  }

  private async executeDeleteTask(userId: string, entities: any): Promise<any> {
    // TODO: Implement task deletion
    return { success: false, message: 'Task deletion via voice not yet implemented' };
  }

  private async executeScheduleTask(userId: string, entities: any): Promise<any> {
    // TODO: Implement task scheduling
    return { success: false, message: 'Task scheduling via voice not yet implemented' };
  }

  private parseDate(dateStr: string): Date | null {
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);

    const lowerDate = dateStr.toLowerCase();
    
    if (lowerDate.includes('today')) {
      return today;
    } else if (lowerDate.includes('tomorrow')) {
      return tomorrow;
    } else if (lowerDate.includes('monday')) {
      return this.getNextWeekday(1);
    } else if (lowerDate.includes('tuesday')) {
      return this.getNextWeekday(2);
    } else if (lowerDate.includes('wednesday')) {
      return this.getNextWeekday(3);
    } else if (lowerDate.includes('thursday')) {
      return this.getNextWeekday(4);
    } else if (lowerDate.includes('friday')) {
      return this.getNextWeekday(5);
    } else if (lowerDate.includes('saturday')) {
      return this.getNextWeekday(6);
    } else if (lowerDate.includes('sunday')) {
      return this.getNextWeekday(0);
    }

    // Try to parse as date
    const parsed = new Date(dateStr);
    return isNaN(parsed.getTime()) ? null : parsed;
  }

  private getNextWeekday(dayOfWeek: number): Date {
    const today = new Date();
    const todayDayOfWeek = today.getDay();
    const daysUntilTarget = (dayOfWeek - todayDayOfWeek + 7) % 7;
    
    const targetDate = new Date(today);
    targetDate.setDate(today.getDate() + (daysUntilTarget === 0 ? 7 : daysUntilTarget));
    
    return targetDate;
  }

  private async storeVoiceCommand(userId: string, commandData: any): Promise<void> {
    try {
      // ✅ Validate and clean data before storing
      const cleanData = {
        transcript: String(commandData.transcript || ''),
        confidence: Number(commandData.confidence) || 0.8,
        language: String(commandData.language || 'en'),
        intent: String(commandData.intent || 'unknown'),
        executed: Boolean(commandData.executed),
        success: Boolean(commandData.success),
        processingTime: Number(commandData.processingTime) || 0,
      };

      await storage.insights.createInsight({
        userId,
        insightType: 'voice_command_usage',
        data: cleanData,
        confidence: String(cleanData.confidence), // Ensure it's a string
      });
      
      console.log('✅ Voice command insight stored successfully');
    } catch (error) {
      console.error('❌ Failed to store voice command insight:', error);
      // Don't throw - this shouldn't break the main flow
    }
  }
}

export const voiceProcessingService = new VoiceProcessingService();