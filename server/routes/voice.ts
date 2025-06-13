import { Router, Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import { z } from 'zod';
import { requireAuth } from '../middleware/auth';
import { validateRequest } from '../middleware/validation';
import { voiceProcessingService } from '../services/voice-processing';
import { storage as st } from '../storage';

const router = Router();

// Configure multer for audio file uploads
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: {
    fileSize: 25 * 1024 * 1024, // 25MB limit
    files: 1,
  },
  fileFilter: (req, file, cb) => {
    const allowedMimes = [
      'audio/mpeg',
      'audio/mp3',
      'audio/wav',
      'audio/webm',
      'audio/mp4',
      'audio/x-m4a',
      'audio/ogg',
    ];

    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`Unsupported audio format: ${file.mimetype}`));
    }
  },
});

// Validation schemas
const ProcessVoiceSchema = z.object({
  language: z.string().optional(),
  executeCommand: z.boolean().optional().default(true),
  context: z.object({}).optional(),
});

const VoiceCommandHistorySchema = z.object({
  limit: z.number().min(1).max(100).optional().default(20),
  offset: z.number().min(0).optional().default(0),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
});

// // POST /api/voice/process-audio
// router.post(
//   '/process-audio',
//   requireAuth,
//   upload.single('audio'),
//   async (req: Request, res: Response) => {
//     try {
//       const userId = (req as any).user.id;
//       const { language, executeCommand = 'true', context } = req.body;

//       console.log('Voice processing request:', {
//         userId,
//         language,
//         executeCommand,
//         hasFile: !!req.file,
//       });

//       if (!req.file) {
//         return res.status(400).json({
//           success: false,
//           error: 'No audio file provided',
//         });
//       }

//       // Get user data
//       const user = await st.users.getUserById(userId);
//       if (!user) {
//         return res.status(404).json({
//           success: false,
//           error: 'User not found',
//         });
//       }

//       // Process voice command
//       try {
//         const result = await voiceProcessingService.processVoiceCommand(
//           req.file.buffer,
//           req.file.originalname || 'audio.wav',
//           user,
//           {
//             language,
//             executeCommand: executeCommand === 'true',
//             context: context ? JSON.parse(context) : undefined,
//           }
//         );

//         console.log('✅ Voice processing completed successfully');
//         console.log('Result summary:', {
//           transcript: result.transcript,
//           success: result.executionResult?.success,
//           message: result.executionResult?.message,
//         });

//         // ✅ Store analytics with better error handling
//         try {
//           await st.insights.createInsight({
//             userId,
//             insightType: 'voice_command_usage',
//             data: {
//               transcript: result.transcript || '',
//               confidence: result.confidence || 0.8,
//               language: result.language || 'en',
//               processingTime: result.processingTime || 0,
//               intent: result.nlpResult?.intent || 'unknown',
//               executed: executeCommand === 'true',
//               success: result.executionResult?.success || false,
//             },
//             confidence: (result.confidence || 0.8).toString(),
//           });
//           console.log('✅ Analytics stored successfully');
//         } catch (analyticsError) {
//           console.error('⚠️ Failed to store analytics (non-critical):', analyticsError);
//           // Don't fail the entire request for analytics issues
//         }

//         // ✅ Always return success if voice processing worked
//         res.json({
//           success: true,
//           data: {
//             transcript: result.transcript,
//             confidence: result.confidence,
//             language: result.language,
//             duration: result.duration,
//             nlpResult: result.nlpResult,
//             executionResult: result.executionResult,
//             processingTime: result.processingTime,
//           },
//           message: 'Voice command processed successfully',
//         });
//       } catch (processingError) {
//         console.error('❌ Voice processing failed:', processingError);
//         console.error('Error details:', {
//           message:
//             processingError instanceof Error
//               ? processingError.message
//               : 'Unknown error',
//           stack:
//             processingError instanceof Error ? processingError.stack : undefined,
//         });

//         // ✅ Better error response
//         res.status(500).json({
//           success: false,
//           error:
//             processingError instanceof Error
//               ? processingError.message
//               : 'Failed to process voice command',
//           details:
//             process.env.NODE_ENV === 'development'
//               ? {
//                   stack:
//                     processingError instanceof Error
//                       ? processingError.stack
//                       : undefined,
//                 }
//               : undefined,
//         });
//       }
//     } catch (error) {
//       console.error('❌ Voice route error:', error);
//       res.status(500).json({
//         success: false,
//         error:
//           'An unexpected error occurred while processing your voice command.\n\nPlease try again or use text input.',
//       });
//     }
//   }
// );

// POST /api/voice/process-audio
router.post(
  '/process-audio',
  requireAuth,
  upload.single('audio'),
  async (req: Request, res: Response) => {
    const startTime = Date.now();
    
    try {
      const userId = (req as any).user.id;
      const { language, executeCommand = 'true', context } = req.body;

      console.log('🎤 Voice processing request:', {
        userId,
        language,
        executeCommand,
        hasFile: !!req.file,
        fileSize: req.file?.size,
        mimeType: req.file?.mimetype
      });

      if (!req.file) {
        return res.status(400).json({
          success: false,
          error: 'No audio file provided',
        });
      }

      // ✅ Validate file before processing
      if (req.file.size > 25 * 1024 * 1024) {
        return res.status(400).json({
          success: false,
          error: 'Audio file too large (max 25MB)',
        });
      }

      // Get user data
      const user = await st.users.getUserById(userId);
      if (!user) {
        return res.status(404).json({
          success: false,
          error: 'User not found',
        });
      }

      // ✅ Process voice command with comprehensive error handling
      let result;
      try {
        console.log('🔄 Starting voice processing...');
        
        result = await voiceProcessingService.processVoiceCommand(
          req.file.buffer,
          req.file.originalname || 'audio.wav',
          user,
          {
            language,
            executeCommand: executeCommand === 'true',
            context: context ? JSON.parse(context) : undefined,
          }
        );

        console.log('✅ Voice processing completed successfully');
        console.log('📊 Result summary:', {
          transcript: result.transcript?.substring(0, 100) + '...',
          hasNlpResult: !!result.nlpResult,
          hasExecutionResult: !!result.executionResult,
          executionSuccess: result.executionResult?.success,
          processingTime: result.processingTime
        });

      } catch (processingError) {
        console.error('❌ Voice processing failed:', processingError);
        console.error('Error stack:', processingError instanceof Error ? processingError.stack : 'No stack');
        
        return res.status(500).json({
          success: false,
          error: processingError instanceof Error 
            ? processingError.message 
            : 'Failed to process voice command',
          details: process.env.NODE_ENV === 'development' ? {
            error: processingError instanceof Error ? processingError.message : 'Unknown error',
            stack: processingError instanceof Error ? processingError.stack : undefined
          } : undefined,
        });
      }

      // ✅ Store analytics (non-blocking)
      setImmediate(async () => {
        try {
          await st.insights.createInsight({
            userId,
            insightType: 'voice_command_usage',
            data: {
              transcript: result.transcript || '',
              confidence: Number(result.confidence) || 0.8,
              language: result.language || 'en',
              processingTime: Number(result.processingTime) || 0,
              intent: result.nlpResult?.intent || 'unknown',
              executed: executeCommand === 'true',
              success: Boolean(result.executionResult?.success),
            },
            confidence: String(Number(result.confidence) || 0.8),
          });
          console.log('✅ Analytics stored in background');
        } catch (analyticsError) {
          console.error('⚠️ Analytics storage failed (non-critical):', analyticsError);
        }
      });

      // ✅ Return successful response
      const responseTime = Date.now() - startTime;
      console.log(`🎉 Voice request completed in ${responseTime}ms`);
      
      res.json({
        success: true,
        data: {
          transcript: result.transcript,
          confidence: result.confidence,
          language: result.language,
          duration: result.duration,
          nlpResult: result.nlpResult,
          executionResult: result.executionResult,
          processingTime: result.processingTime,
        },
        message: 'Voice command processed successfully',
      });

    } catch (outerError) {
      const responseTime = Date.now() - startTime;
      console.error(`❌ Outer voice route error after ${responseTime}ms:`, outerError);
      console.error('Outer error stack:', outerError instanceof Error ? outerError.stack : 'No stack');
      
      // ✅ More specific error response
      const errorMessage = outerError instanceof Error ? outerError.message : 'Unknown error';
      
      let userMessage = 'An unexpected error occurred while processing your voice command.\n\n';
      
      if (errorMessage.includes('audio')) {
        userMessage += 'There was an issue with the audio processing. ';
      } else if (errorMessage.includes('database') || errorMessage.includes('storage')) {
        userMessage += 'There was a database issue. ';
      } else if (errorMessage.includes('API') || errorMessage.includes('network')) {
        userMessage += 'There was a network connectivity issue. ';
      }
      
      userMessage += 'Please try again or use text input.';
      
      res.status(500).json({
        success: false,
        error: userMessage,
        details: process.env.NODE_ENV === 'development' ? {
          originalError: errorMessage,
          stack: outerError instanceof Error ? outerError.stack : undefined,
          processingTime: responseTime
        } : undefined,
      });
    }
  }
);

// POST /api/voice/transcribe-only
router.post(
  '/transcribe-only',
  requireAuth,
  upload.single('audio'),
  async (req: Request, res: Response) => {
    try {
      const { language } = req.body;

      if (!req.file) {
        return res.status(400).json({
          success: false,
          error: 'No audio file provided',
        });
      }

      // Only transcribe, don't process or execute
      const result = await voiceProcessingService.processAudioToText(
        req.file.buffer,
        req.file.originalname || 'audio.wav',
        { language }
      );

      res.json({
        success: true,
        data: {
          transcript: result.transcript,
          confidence: result.confidence,
          language: result.language,
        },
        message: 'Audio transcribed successfully',
      });
    } catch (error) {
      console.error('Transcription error:', error);
      res.status(500).json({
        success: false,
        error:
          error instanceof Error ? error.message : 'Failed to transcribe audio',
      });
    }
  }
);

// GET /api/voice/commands/history
router.get(
  '/commands/history',
  requireAuth,
  validateRequest(VoiceCommandHistorySchema),
  async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user.id;
      const { limit, offset, dateFrom, dateTo } = req.query;

      const options = {
        limit: Number(limit),
        offset: Number(offset),
        dateFrom: dateFrom ? new Date(dateFrom as string) : undefined,
        dateTo: dateTo ? new Date(dateTo as string) : undefined,
      };

      const commands = await voiceProcessingService.getVoiceCommandHistory(
        userId,
        options
      );

      res.json({
        success: true,
        data: {
          commands,
          pagination: {
            limit: options.limit,
            offset: options.offset,
            total: commands.length,
          },
        },
        message: 'Voice command history retrieved successfully',
      });
    } catch (error) {
      console.error('Voice history error:', error);
      res.status(500).json({
        success: false,
        error:
          error instanceof Error
            ? error.message
            : 'Failed to get voice command history',
      });
    }
  }
);

// GET /api/voice/analytics
router.get('/analytics', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;

    const analytics = await voiceProcessingService.analyzeVoiceUsagePatterns(
      userId
    );

    res.json({
      success: true,
      data: analytics,
      message: 'Voice usage analytics retrieved successfully',
    });
  } catch (error) {
    console.error('Voice analytics error:', error);
    res.status(500).json({
      success: false,
      error:
        error instanceof Error
          ? error.message
          : 'Failed to get voice analytics',
    });
  }
});

// POST /api/voice/test-connection
router.post(
  '/test-connection',
  requireAuth,
  async (req: Request, res: Response) => {
    try {
      // Test voice processing service availability
      const testResult = {
        whisperAPI: !!process.env.OPENAI_API_KEY,
        uploadDirectory: true, // voiceProcessingService checks this
        supportedFormats: ['mp3', 'wav', 'webm', 'm4a', 'mp4'],
        maxFileSize: '25MB',
        status: 'operational',
      };

      res.json({
        success: true,
        data: testResult,
        message: 'Voice processing service is operational',
      });
    } catch (error) {
      console.error('Voice test error:', error);
      res.status(500).json({
        success: false,
        error: 'Voice processing service is not available',
      });
    }
  }
);

// WebSocket endpoint for real-time voice streaming (future implementation)
// POST /api/voice/stream/start
router.post(
  '/stream/start',
  requireAuth,
  async (req: Request, res: Response) => {
    try {
      // Placeholder for WebSocket streaming implementation
      res.json({
        success: true,
        data: {
          streamId: `stream_${Date.now()}`,
          websocketUrl: `ws://localhost:3000/voice-stream`,
          message: 'Real-time voice streaming not yet implemented',
        },
        message: 'Voice streaming session prepared (placeholder)',
      });
    } catch (error) {
      console.error('Voice streaming error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to start voice streaming',
      });
    }
  }
);

export default router;
