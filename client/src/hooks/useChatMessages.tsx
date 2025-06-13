import { useState, useCallback } from 'react';

interface ChatMessage {
  id: string;
  type: 'user' | 'ai' | 'system';
  content: string;
  timestamp: Date;
  isProcessing?: boolean;
  messageType?: 'text' | 'voice';
  metadata?: {
    transcript?: string;
    confidence?: number;
    duration?: number;
    intent?: string;
    actionItems?: Array<{
      type: string;
      description: string;
      suggestedAction: string;
    }>;
    followUpQuestions?: string[];
  };
}

interface UseChatMessagesReturn {
  messages: ChatMessage[];
  conversationHistory: Array<{ role: 'user' | 'assistant'; content: string }>;
  addMessage: (message: Omit<ChatMessage, 'id' | 'timestamp'>) => string;
  updateMessage: (id: string, updates: Partial<ChatMessage>) => void;
  removeMessage: (id: string) => void;
  clearMessages: () => void;
  getConversationHistory: () => Array<{ role: 'user' | 'assistant'; content: string }>;
}

export const useChatMessages = (): UseChatMessagesReturn => {
  const [messageIdCounter, setMessageIdCounter] = useState(0);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'initial',
      type: 'system',
      content:
        "Hi! I'm your AI assistant. You can chat with me using text or voice commands to manage your tasks, goals, and schedule. How can I help you today?",
      timestamp: new Date(),
      messageType: 'text',
    },
  ]);

  const generateMessageId = useCallback(() => {
    const newId = `msg_${Date.now()}_${messageIdCounter}`;
    setMessageIdCounter((prev) => prev + 1);
    return newId;
  }, [messageIdCounter]);

  const addMessage = useCallback(
    (message: Omit<ChatMessage, 'id' | 'timestamp'>) => {
      const newMessage: ChatMessage = {
        ...message,
        id: generateMessageId(),
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, newMessage]);
      return newMessage.id;
    },
    [generateMessageId]
  );

  const updateMessage = useCallback(
    (id: string, updates: Partial<ChatMessage>) => {
      setMessages((prev) =>
        prev.map((msg) => (msg.id === id ? { ...msg, ...updates } : msg))
      );
    },
    []
  );

  const removeMessage = useCallback((id: string) => {
    setMessages((prev) => prev.filter((msg) => msg.id !== id));
  }, []);

  const clearMessages = useCallback(() => {
    setMessages([
      {
        id: generateMessageId(),
        type: 'system',
        content: 'Chat cleared. How can I help you today?',
        timestamp: new Date(),
        messageType: 'text',
      },
    ]);
  }, [generateMessageId]);

  const getConversationHistory = useCallback(() => {
    return messages
      .filter(msg => msg.type === 'user' || msg.type === 'ai')
      .slice(-10) // Keep last 10 messages for context
      .map(msg => ({
        role: msg.type === 'user' ? 'user' as const : 'assistant' as const,
        content: msg.content
      }));
  }, [messages]);

  const conversationHistory = getConversationHistory();

  return {
    messages,
    conversationHistory,
    addMessage,
    updateMessage,
    removeMessage,
    clearMessages,
    getConversationHistory,
  };
};
