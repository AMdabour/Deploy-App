import React from 'react';
import { Bot, User, Zap, Loader2, Mic, Type, Clock, CheckCircle } from 'lucide-react';

interface ChatMessageProps {
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

const ChatMessage: React.FC<ChatMessageProps> = ({
  type,
  content,
  timestamp,
  isProcessing,
  messageType = 'text',
  metadata,
}) => {
  return (
    <div
      className={`flex gap-3 animate-in slide-in-from-bottom-2 fade-in-0 duration-200 ${
        type === 'user' ? 'justify-end' : 'justify-start'
      }`}
    >
      {/* Avatar */}
      {type !== 'user' && (
        <div
          className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
            type === 'ai'
              ? 'bg-gradient-to-br from-accent to-info'
              : 'bg-gradient-to-br from-muted to-muted-foreground/20'
          }`}
        >
          {type === 'ai' ? (
            <Bot className="w-4 h-4 text-white" />
          ) : (
            <Zap className="w-4 h-4 text-white" />
          )}
        </div>
      )}

      {/* Message Bubble */}
      <div
        className={`max-w-[320px] rounded-2xl px-4 py-3 shadow-sm border ${
          type === 'user'
            ? 'bg-gradient-to-br from-primary to-primary/80 text-white border-primary/30 rounded-br-md'
            : type === 'ai'
            ? 'bg-gradient-to-br from-card to-card/80 text-foreground border-border/50 rounded-bl-md'
            : 'bg-gradient-to-br from-muted/50 to-muted/30 text-muted-foreground border-muted/30 rounded-bl-md'
        }`}
      >
        {/* Message Type Indicator */}
        {messageType && type !== 'system' && (
          <div className="flex items-center gap-2 mb-2 opacity-70">
            {messageType === 'voice' ? (
              <Mic className="w-3 h-3" />
            ) : (
              <Type className="w-3 h-3" />
            )}
            <span className="text-xs capitalize">{messageType}</span>
            {metadata?.duration && (
              <span className="text-xs">
                • {Math.round(metadata.duration)}s
              </span>
            )}
            {metadata?.confidence && (
              <span className="text-xs">
                • {Math.round(metadata.confidence * 100)}% confidence
              </span>
            )}
          </div>
        )}

        <div className="flex items-start justify-between gap-2">
          <p
            className={`text-sm leading-relaxed whitespace-pre-line ${
              isProcessing ? 'flex items-center gap-2' : ''
            }`}
          >
            {isProcessing && (
              <Loader2 className="w-4 h-4 animate-spin flex-shrink-0" />
            )}
            {content}
          </p>
        </div>

        {/* Action Items */}
        {metadata?.actionItems && metadata.actionItems.length > 0 && (
          <div className="mt-3 pt-3 border-t border-border/20">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle className="w-3 h-3" />
              <span className="text-xs font-medium">Actions</span>
            </div>
            {metadata.actionItems.map((action, index) => (
              <div key={index} className="text-xs mb-1 opacity-80">
                • {action.description}
              </div>
            ))}
          </div>
        )}

        {/* Follow-up Questions */}
        {metadata?.followUpQuestions && metadata.followUpQuestions.length > 0 && (
          <div className="mt-3 pt-3 border-t border-border/20">
            <div className="text-xs font-medium mb-2">You might also ask:</div>
            {metadata.followUpQuestions.slice(0, 2).map((question, index) => (
              <div key={index} className="text-xs mb-1 opacity-80">
                • {question}
              </div>
            ))}
          </div>
        )}

        {/* Timestamp and metadata */}
        <div className="flex items-center justify-between mt-2">
          <div
            className={`text-xs opacity-70 ${
              type === 'user' ? 'text-white/70' : 'text-muted-foreground'
            }`}
          >
            {timestamp.toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
            })}
          </div>
          
          {metadata?.processingTime && (
            <div className="flex items-center gap-1 text-xs opacity-50">
              <Clock className="w-3 h-3" />
              {metadata.processingTime}ms
            </div>
          )}
        </div>
      </div>

      {/* User Avatar */}
      {type === 'user' && (
        <div className="w-8 h-8 bg-gradient-to-br from-primary to-accent rounded-full flex items-center justify-center flex-shrink-0">
          <User className="w-4 h-4 text-white" />
        </div>
      )}
    </div>
  );
};

export default ChatMessage;
