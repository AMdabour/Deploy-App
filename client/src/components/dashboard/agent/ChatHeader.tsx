import React, { useState } from 'react';
import { X, Trash2, Bot, Sparkles, MessageCircle, Mic } from 'lucide-react';
import Button from '@/components/ui/Button';

interface ChatHeaderProps {
  onClose: () => void;
  onClearChat: () => void;
  hasUserInteraction?: boolean; // Optional prop to know if there are user messages
}

const ChatHeader: React.FC<ChatHeaderProps> = ({ 
  onClose, 
  onClearChat,
  hasUserInteraction = false 
}) => {
  const [showClearConfirmation, setShowClearConfirmation] = useState(false);

  const handleClearClick = () => {
    if (hasUserInteraction) {
      setShowClearConfirmation(true);
    } else {
      onClearChat();
    }
  };

  const handleConfirmClear = () => {
    onClearChat();
    setShowClearConfirmation(false);
  };

  const handleCancelClear = () => {
    setShowClearConfirmation(false);
  };

  return (
    <div className="flex items-center justify-between p-6 border-b border-border/30 bg-gradient-to-r from-primary/5 via-accent/5 to-success/5 rounded-t-3xl">
      <div className="flex items-center gap-3">
        <div className="relative">
          <div className="w-12 h-12 bg-gradient-to-br from-primary to-accent rounded-2xl flex items-center justify-center shadow-lg">
            <Bot className="w-6 h-6 text-white" />
          </div>
          <div className="absolute -top-1 -right-1 w-4 h-4 bg-success rounded-full border-2 border-white flex items-center justify-center">
            <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
          </div>
        </div>
        <div>
          <h3 className="font-bold text-foreground flex items-center gap-2">
            AI Assistant
            <Sparkles className="w-4 h-4 text-accent" />
          </h3>
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <div className="flex items-center gap-1">
              <MessageCircle className="w-3 h-3" />
              <span>Text & Voice enabled</span>
            </div>
            <div className="flex items-center gap-1">
              <Mic className="w-3 h-3" />
              <span>Commands ready</span>
            </div>
          </div>
        </div>
      </div>
      
      <div className="flex gap-2">
        {/* Clear Chat Button with Confirmation */}
        {!showClearConfirmation ? (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClearClick}
            title="Clear chat history"
            className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
            disabled={!hasUserInteraction}
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        ) : (
          <div className="flex gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleConfirmClear}
              title="Confirm clear chat"
              className="text-destructive hover:bg-destructive hover:text-white text-xs px-2"
            >
              Clear
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleCancelClear}
              title="Cancel clear"
              className="text-muted-foreground hover:text-foreground text-xs px-2"
            >
              Cancel
            </Button>
          </div>
        )}

        {/* Close Chat Button */}
        <Button
          variant="ghost"
          size="sm"
          onClick={onClose}
          title="Close chat"
          className="text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
        >
          <X className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
};

export default ChatHeader;
