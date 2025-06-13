import React, { useState, useEffect } from 'react';
import {
  sendTextMessage,
  processVoiceCommand,
  processNaturalLanguageCommand,
} from '@/utils/api';
import ChatHeader from './ChatHeader';
import ChatMessages from './ChatMessages';
import ChatInput from './ChatInput';
import FloatingActionButton from './FloatingActionButton';
import { useVoiceRecording } from '@/hooks/useVoiceRecording';
import { useChatMessages } from '@/hooks/useChatMessages';

interface FloatingAIChatProps {
  isOpen: boolean;
  onToggle: () => void;
}

const FloatingAIChat: React.FC<FloatingAIChatProps> = ({
  isOpen,
  onToggle,
}) => {
  const [isProcessing, setIsProcessing] = useState(false);

  const {
    isRecording,
    audioBlob,
    recordingDuration,
    startRecording,
    stopRecording,
    clearRecording,
    cleanup,
  } = useVoiceRecording();

  const {
    messages,
    conversationHistory,
    hasUserInteraction, // Add this
    addMessage, 
    updateMessage, 
    removeMessage, 
    clearMessages 

  } = useChatMessages();

  // Format duration helper
  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Handle recording start with error handling
  const handleStartRecording = async () => {
    try {
      await startRecording();
    } catch (error) {
      addMessage({
        type: 'system',
        content:
          error instanceof Error
            ? error.message
            : 'Unable to access microphone. Please check your permissions.',
        messageType: 'text',
      });
    }
  };

  // Enhanced command detection - More inclusive
  const isLikelyCommand = (message: string): boolean => {
    const commandKeywords = [
      'add', 'create', 'schedule', 'delete', 'remove', 'cancel',
      'update', 'change', 'modify', 'complete', 'finish', 'make', 'set',
      'plan', 'roadmap', 'strategy', 'journey', 'build', 'generate'
    ];
    
    const entityKeywords = [
      'task', 'meeting', 'appointment', 'reminder', 'todo',
      'goal', 'objective', 'target', 'aim', 'roadmap', 'plan'
    ];
    
    const lowerMessage = message.toLowerCase();
    
    // Check for command + entity combinations
    const hasCommandAndEntity = commandKeywords.some(cmd => 
      lowerMessage.includes(cmd)
    ) && entityKeywords.some(entity => 
      lowerMessage.includes(entity)
    );
    
    // Check for time-based commands
    const timeIndicators = [
      'at', 'on', 'today', 'tomorrow', 'monday', 'tuesday', 
      'wednesday', 'thursday', 'friday', 'saturday', 'sunday',
      ':', 'am', 'pm', 'morning', 'afternoon', 'evening', 
      'this year', 'next year', 'in 2024', 'in 2025', 'this month', 'next month'
    ];
    
    const hasTimeCommand = commandKeywords.some(cmd => 
      lowerMessage.includes(cmd)
    ) && timeIndicators.some(time => 
      lowerMessage.includes(time)
    );

    // Check for standalone roadmap/plan requests
    const isRoadmapRequest = [
      'roadmap', 'plan', 'strategy', 'journey', 'complete plan', 'full plan'
    ].some(keyword => lowerMessage.includes(keyword));

    console.log('Command detection:', {
      message: lowerMessage,
      hasCommandAndEntity,
      hasTimeCommand,
      isRoadmapRequest,
      result: hasCommandAndEntity || hasTimeCommand || isRoadmapRequest
    });

    return hasCommandAndEntity || hasTimeCommand || isRoadmapRequest;
  };

  // UNIFIED result processing function
  const processCommandResult = (result: any): string | null => {
    console.log('Processing command result:', result);

    if (!result.success || !result.data) {
      return result?.message || "Sorry, I couldn't process your request.";
    }

    const commandData = result.data;
    
    // Check both 'execution' and 'result' for backward compatibility
    const executionResult = commandData.execution || commandData.result;
    const parsed = commandData.parsed;

    console.log('Command data:', {
      executionResult,
      parsed,
      confidence: parsed?.confidence
    });

    // Handle successful execution
    if (executionResult?.success) {
      let responseContent = `✅ ${executionResult.message || 'Command executed successfully!'}`;
      
      // Add specific details based on what was created
      const data = executionResult.data;
      
      if (data?.roadmap) {
        // Roadmap creation
        responseContent = `🗺️ **Complete Roadmap Created!**\n\n`;
        responseContent += `**Goal:** ${data.roadmap.goal.title}\n`;
        responseContent += `**Category:** ${data.roadmap.goal.category}\n`;
        responseContent += `**Year:** ${data.roadmap.goal.year}\n\n`;
        responseContent += `📋 **Generated:**\n`;
        responseContent += `• ${data.roadmap.objectives.length} monthly objectives\n`;
        responseContent += `• ${data.roadmap.tasks.length} scheduled tasks\n`;
        responseContent += `• Complete timeline with milestones\n\n`;
        responseContent += `✅ Everything has been created and scheduled for you!`;
      } else if (data?.goal) {
        // Goal creation
        responseContent += `\n\n🎯 **Goal Created:**\n• Title: ${data.goal.title}`;
        responseContent += `\n• Category: ${data.goal.category}`;
        responseContent += `\n• Year: ${data.goal.targetYear}`;
      } else if (data?.objective) {
        // Objective creation
        responseContent += `\n\n📊 **Objective Created:**\n• Title: ${data.objective.title}`;
        responseContent += `\n• Month: ${data.objective.targetMonth}`;
        responseContent += `\n• Year: ${data.objective.targetYear}`;
      } else if (data?.task) {
        // Task creation
        responseContent += `\n\n📋 **Task Created:**\n• Title: ${data.task.title}`;
        if (data.task.scheduledDate) {
          responseContent += `\n• Date: ${new Date(data.task.scheduledDate).toLocaleDateString()}`;
        }
        if (data.task.scheduledTime) {
          responseContent += `\n• Time: ${data.task.scheduledTime}`;
        }
        if (data.task.estimatedDuration) {
          responseContent += `\n• Duration: ${data.task.estimatedDuration} minutes`;
        }
      }
      
      return responseContent;
    }
    
    // Handle low confidence
    if (parsed?.confidence && parsed.confidence < 0.7) {
      return `🤔 I understood you want to "${parsed.intent || 'do something'}", but I'm not completely sure. Could you be more specific?\n\n**For example:**\n• "Create a roadmap to become a senior developer this year"\n• "Plan my fitness journey for 2024"\n• "Add task meeting with John tomorrow at 3pm"\n• "Create a goal to learn Python programming"`;
    }
    
    // Handle execution failure
    const errorMessage = executionResult?.message || commandData.response || parsed?.response;
    return `❌ ${errorMessage || 'I understood your command but couldn\'t execute it. Please try again.'}`;

  };

  // Handle text message sending with simplified logic
  const handleSendTextMessage = async (message: string) => {
    if (!message.trim() || isProcessing) return;

    console.log('=== PROCESSING TEXT MESSAGE ===');
    console.log('Message:', message);

    // Add user message
    const userMessageId = addMessage({
      type: 'user',
      content: message,
      messageType: 'text',
    });

    // Add processing message
    const processingMessageId = addMessage({
      type: 'ai',
      content: 'Processing...',
      isProcessing: true,
      messageType: 'text',
    });

    setIsProcessing(true);

    try {
      let result;
      let isCommand = isLikelyCommand(message);

      console.log('Is likely command:', isCommand);

      if (isCommand) {
        try {
          console.log('Processing as command...');
          result = await processNaturalLanguageCommand(message);
          console.log('Command result:', result);
          
          // Remove processing message
          removeMessage(processingMessageId);
          
          // Process command result
          const responseContent = processCommandResult(result);
          
          addMessage({
            type: 'ai',
            content: responseContent || 'Command processed.',
            messageType: 'text',
            metadata: {
              intent: result?.data?.parsed?.intent
            }
          });
          
          return; // Exit early for commands
          
        } catch (cmdError) {
          console.log('Command processing failed:', cmdError);
          // Don't return here, fall through to conversational AI
        }
      }

      // Try conversational AI if not a command or command failed
      try {
        console.log('Processing as conversational message...');
        result = await sendTextMessage(message, conversationHistory.map(msg => ({
          role: msg.role as "user" | "assistant",
          content: msg.content
        })));
        console.log('Conversational result:', result);
        
        // Remove processing message
        removeMessage(processingMessageId);
        
        if (result?.success && result.data) {
          const conversationData = result.data;
          addMessage({
            type: 'ai',
            content: conversationData.response || 'I received your message but cannot provide a response right now.',
            messageType: 'text',
            metadata: {
              actionItems: conversationData.actionItems?.map((item: any) => 
                typeof item === 'string' ? item : item.description || item.suggestedAction || item.type
              ),
              followUpQuestions: conversationData.followUpQuestions
            },
          });
        } else {
          addMessage({
            type: 'ai',
            content: result?.message || "Sorry, I couldn't process your request. Please try again.",
            messageType: 'text',
          });
        }
        
      } catch (convError) {
        console.error('All processing methods failed:', convError);
        throw convError;
      }

    } catch (error) {
      console.error('Error processing text message:', error);

      removeMessage(processingMessageId);

      let errorMessage = 'Sorry, something went wrong. Please try again.';

      if (error instanceof Error) {
        if (error.message.includes('404')) {
          errorMessage = 'AI service is temporarily unavailable. Please try again later.';
        } else if (error.message.includes('timeout')) {
          errorMessage = 'Request timed out. Please try again with a shorter message.';
        } else if (error.message.includes('429')) {
          errorMessage = 'Too many requests. Please wait a moment and try again.';
        } else {
          errorMessage = `Error: ${error.message}`;
        }
      }
      
      addMessage({
        type: 'ai',
        content: errorMessage,
        messageType: 'text',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  // Handle voice message sending - Simplified
  const handleSendVoiceMessage = async (audioBlob: Blob, duration: number) => {
    if (!audioBlob || isProcessing) return;

    // Add user message with voice indication
    const userMessageId = addMessage({
      type: 'user',
      content: `🎤 Voice message (${formatDuration(duration)})`,
      messageType: 'voice',
      metadata: { duration },
    });

    // Add processing message
    const processingMessageId = addMessage({
      type: 'ai',
      content: 'Processing your voice command...',
      isProcessing: true,
      messageType: 'voice',
    });

    setIsProcessing(true);

    try {
      console.log('=== PROCESSING VOICE MESSAGE ===');
      console.log('Audio blob size:', audioBlob.size);

      const result = await processVoiceCommand(audioBlob, {
        executeCommand: true,
        language: 'en',
      });

      console.log('Voice result:', result);

      // Remove processing message
      removeMessage(processingMessageId);

      if (result.success && result.data) {
        // Update user message with transcript if available
        if (result.data.transcript) {
          updateMessage(userMessageId, {
            content: `"${result.data.transcript}"`,
            metadata: {
              transcript: result.data.transcript,
              confidence: result.data.confidence,
              duration,
            },
          });
        }

        // Add AI response
        let aiResponseContent = '';

        if (result.data.executionResult?.success) {
          aiResponseContent = `✅ ${result.data.executionResult.message || 'Voice command executed successfully!'}`;
          
          // Add details based on what was created
          const data = result.data.executionResult.data;
          if (data?.task) {
            aiResponseContent += `\n\n📋 **Task Created:** ${data.task.title}`;
          } else if (data?.goal) {
            aiResponseContent += `\n\n🎯 **Goal Created:** ${data.goal.title}`;
          } else if (data?.objective) {
            aiResponseContent += `\n\n📊 **Objective Created:** ${data.objective.title}`;
          }
        } else if (result.data.confidence < 0.7) {
          aiResponseContent = `🎤 I heard: "${result.data.transcript}"\n\n🤔 I'm not completely sure what you want me to do. Could you try speaking more clearly or use text input?`;
        } else {
          aiResponseContent = result.data.nlpResult?.response || 
            result.data.executionResult?.message ||
            "I understood your voice command, but I'm not sure how to help with that. Could you try rephrasing your request?";
        }

        addMessage({
          type: 'ai',
          content: aiResponseContent,
          messageType: 'voice',
          metadata: {
            confidence: result.data.confidence,
            transcript: result.data.transcript,
            intent: result.data.nlpResult?.intent,
          },
        });
      } else {
        addMessage({
          type: 'ai',
          content:
            result.message ||
            "Sorry, I couldn't process your voice command. Please try again or use text input.",
          messageType: 'voice',
        });
      }
    } catch (error) {
      console.error('Error processing voice message:', error);

      removeMessage(processingMessageId);
      updateMessage(userMessageId, {
        content: `🎤 Voice message (${formatDuration(
          duration
        )}) - Processing failed`,
      });

      let errorMessage = 'An unexpected error occurred while processing your voice command.';
      
      if (error instanceof Error) {
        if (error.message.includes('404')) {
          errorMessage = 'Voice processing service is temporarily unavailable.';
        } else if (
          error.message.includes('network') ||
          error.message.includes('timeout')
        ) {
          errorMessage = 'Network error during voice processing.';
        } else {
          errorMessage = error.message;
        }
      }

      addMessage({
        type: 'ai',
        content: errorMessage + '\n\nPlease try again or use text input.',
        messageType: 'voice',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return cleanup;
  }, [cleanup]);

  return (
    <>
      {/* Floating Chat Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-end p-4 pointer-events-none">
          <div className="bg-card/98 backdrop-blur-2xl border border-border/50 rounded-3xl shadow-2xl w-[440px] h-[700px] pointer-events-auto animate-in slide-in-from-bottom-4 fade-in-0 duration-300 flex flex-col">
            <ChatHeader 
              onClose={onToggle} 
              onClearChat={clearMessages}
              hasUserInteraction={hasUserInteraction} // Pass this prop
            />
            <ChatMessages messages={messages} />
            <ChatInput
              onSendMessage={handleSendTextMessage}
              onSendVoice={handleSendVoiceMessage}
              isProcessing={isProcessing}
              isRecording={isRecording}
              audioBlob={audioBlob}
              recordingDuration={recordingDuration}
              onStartRecording={handleStartRecording}
              onStopRecording={stopRecording}
              onClearRecording={clearRecording}
              formatDuration={formatDuration}
              placeholder="Ask me anything or give me a command..."
            />
          </div>
        </div>
      )}

      <FloatingActionButton isOpen={isOpen} onToggle={onToggle} />
    </>
  );
};

export default FloatingAIChat;
