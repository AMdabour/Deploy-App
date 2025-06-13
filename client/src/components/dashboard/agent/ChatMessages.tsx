import React, { useRef, useEffect } from 'react';
import { Bot } from 'lucide-react';
import ChatMessage from './ChatMessage';

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
    processingTime?: number;
    actionItems?: Array<{
      type: string;
      description: string;
      suggestedAction: string;
    }>;
    followUpQuestions?: string[];
  };
}

interface ChatMessagesProps {
  messages: ChatMessage[];
}

const ChatMessages: React.FC<ChatMessagesProps> = ({ messages }) => {
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  return (
    <div className="flex-1 p-4 space-y-4 overflow-y-auto bg-gradient-to-br from-background/50 to-muted/20 scroll-smooth">
      {messages.length === 0 && (
        <div className="flex items-center justify-center h-full text-muted-foreground">
          <div className="text-center">
            <Bot className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p className="text-sm">Start a conversation...</p>
          </div>
        </div>
      )}
      
      {messages.map((message) => (
        <ChatMessage
          key={message.id}
          id={message.id}
          type={message.type}
          content={message.content}
          timestamp={message.timestamp}
          isProcessing={message.isProcessing}
          messageType={message.messageType}
          metadata={message.metadata}
        />
      ))}
      
      <div ref={chatEndRef} />
    </div>
  );
};

export default ChatMessages;
