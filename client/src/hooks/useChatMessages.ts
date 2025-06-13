import { useState, useCallback, useMemo } from 'react';

export interface ChatMessage {
  id: string;
  type: 'user' | 'ai' | 'system';
  content: string;
  timestamp: Date;
  messageType: 'text' | 'voice';
  isProcessing?: boolean;
  metadata?: {
    confidence?: number;
    transcript?: string;
    intent?: string;
    actionItems?: string[];
    followUpQuestions?: string[];
    duration?: number;
    commandType?: string;
    executedAt?: string;
  };
}

const WELCOME_MESSAGE: ChatMessage = {
  id: 'welcome-message',
  type: 'ai',
  content: `👋 **Welcome to your AI Assistant!**

I can help you with:
• 📋 **Task management** - Add, schedule, modify tasks
• 🎯 **Goal setting** - Create yearly goals and track progress  
• 📊 **Objective planning** - Break goals into monthly objectives
• 🗺️ **Roadmap creation** - Generate complete year-long plans
• 🎤 **Voice commands** - Speak naturally to get things done

**Try saying:**
• "Create a roadmap to become a senior developer"
• "Add task meeting with John tomorrow at 3pm"
• "Create goal learn Spanish this year"
• "Schedule workout for today evening"

What would you like to accomplish today?`,
  timestamp: new Date(),
  messageType: 'text',
};

export const useChatMessages = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([WELCOME_MESSAGE]);

  // Generate unique ID for messages
  const generateId = useCallback(() => {
    return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }, []);

  // Add a new message
  const addMessage = useCallback((message: Omit<ChatMessage, 'id' | 'timestamp'>) => {
    const newMessage: ChatMessage = {
      ...message,
      id: generateId(),
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, newMessage]);
    return newMessage.id;
  }, [generateId]);

  // Update an existing message
  const updateMessage = useCallback((id: string, updates: Partial<ChatMessage>) => {
    setMessages(prev => 
      prev.map(msg => 
        msg.id === id 
          ? { ...msg, ...updates, timestamp: new Date() }
          : msg
      )
    );
  }, []);

  // Remove a specific message
  const removeMessage = useCallback((id: string) => {
    setMessages(prev => prev.filter(msg => msg.id !== id));
  }, []);

  // Clear all messages and reset to welcome message
  const clearMessages = useCallback(() => {
    console.log('Clearing all chat messages...');
    setMessages([WELCOME_MESSAGE]);
  }, []);

  // Clear all messages completely (including welcome message)
  const clearAllMessages = useCallback(() => {
    console.log('Clearing all chat messages completely...');
    setMessages([]);
  }, []);

  // Reset to welcome message only
  const resetToWelcome = useCallback(() => {
    console.log('Resetting to welcome message...');
    setMessages([WELCOME_MESSAGE]);
  }, []);

  // Get conversation history for AI context (excluding system messages and welcome)
  const conversationHistory = useMemo(() => {
    return messages
      .filter(msg => 
        msg.type !== 'system' && 
        msg.id !== 'welcome-message' &&
        !msg.isProcessing
      )
      .map(msg => ({
        role: msg.type === 'user' ? 'user' : 'assistant',
        content: msg.content,
        timestamp: msg.timestamp,
      }));
  }, [messages]);

  // Get user messages count (excluding welcome and system)
  const userMessageCount = useMemo(() => {
    return messages.filter(msg => 
      msg.type === 'user' && 
      msg.id !== 'welcome-message'
    ).length;
  }, [messages]);

  // Check if chat has any user interaction
  const hasUserInteraction = useMemo(() => {
    return userMessageCount > 0;
  }, [userMessageCount]);

  return {
    messages,
    conversationHistory,
    userMessageCount,
    hasUserInteraction,
    addMessage,
    updateMessage,
    removeMessage,
    clearMessages,        // Clears all and resets to welcome
    clearAllMessages,     // Clears everything including welcome
    resetToWelcome,       // Resets to welcome message only
  };
};