import React, { useState, useRef, KeyboardEvent, useEffect } from 'react';
import {
  Send,
  Mic,
  MicOff,
  Type,
  Loader2,
  X,
  Volume2,
  History,
} from 'lucide-react';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';

interface ChatInputProps {
  onSendMessage: (message: string) => void;
  onSendVoice: (audioBlob: Blob, duration: number) => void;
  isProcessing: boolean;
  disabled?: boolean;
  placeholder?: string;
  isRecording: boolean;
  audioBlob: Blob | null;
  recordingDuration: number;
  onStartRecording: () => Promise<void>;
  onStopRecording: () => void;
  onClearRecording: () => void;
  formatDuration: (seconds: number) => string;
  showVoiceHistory?: boolean;
  onViewVoiceHistory?: () => void;
  voiceLanguage?: string;
  onLanguageChange?: (language: string) => void;
}

const ChatInput: React.FC<ChatInputProps> = ({
  onSendMessage,
  onSendVoice,
  isProcessing,
  disabled = false,
  placeholder = 'Type your message...',
  isRecording,
  audioBlob,
  recordingDuration,
  onStartRecording,
  onStopRecording,
  onClearRecording,
  formatDuration,
  showVoiceHistory,
  onViewVoiceHistory,
  voiceLanguage,
  onLanguageChange,
}) => {
  const [message, setMessage] = useState('');
  const [inputMode, setInputMode] = useState<'text' | 'voice'>('text');
  const [isTransitioning, setIsTransitioning] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Auto-focus on mount and mode switch
  useEffect(() => {
    if (inputRef.current && inputMode === 'text' && !isTransitioning) {
      inputRef.current.focus();
    }
  }, [inputMode, isTransitioning]);

  const handleSendText = () => {
    if (message.trim() && !isProcessing && !disabled) {
      onSendMessage(message.trim());
      setMessage('');
    }
  };

  const handleSendVoice = () => {
    if (audioBlob && !isProcessing && !disabled) {
      onSendVoice(audioBlob, recordingDuration);
      onClearRecording();
    }
  };

  const handleKeyPress = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendText();
    }
  };

  const switchToText = () => {
    if (isTransitioning) return;

    setIsTransitioning(true);
    if (isRecording) {
      onStopRecording();
    }

    setInputMode('text');

    setTimeout(() => {
      setIsTransitioning(false);
      setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
    }, 200);
  };

  const switchToVoice = () => {
    if (isTransitioning) return;

    setIsTransitioning(true);
    if (inputRef.current) {
      inputRef.current.blur();
    }

    setInputMode('voice');

    setTimeout(() => {
      setIsTransitioning(false);
    }, 200);
  };

  return (
    <div className="p-4 bg-gradient-to-r from-background/98 to-muted/5 border-t border-border/20">
      <div className="max-w-full mx-auto space-y-3">
        {/* Main Input Container */}
        <div
          ref={containerRef}
          className={`relative bg-background/90 backdrop-blur-sm border-2 rounded-2xl transition-all duration-300 shadow-lg hover:shadow-xl ${
            isRecording
              ? 'border-primary/60 shadow-xl shadow-primary/20'
              : 'border-border/50'
          } ${disabled ? 'opacity-50' : ''} ${
            isTransitioning ? 'opacity-75' : ''
          }`}
        >
          {/* Input Mode Switcher */}
          <div className="flex items-center justify-between px-6 py-3 border-b border-border/30 bg-muted/30">
            <div className="flex items-center gap-2">
              <button
                onClick={switchToText}
                disabled={isProcessing || disabled || isTransitioning}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                  inputMode === 'text'
                    ? 'bg-primary text-primary-foreground shadow-md border border-primary/30'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted/80 border border-transparent'
                }`}
              >
                <Type className="w-4 h-4" />
                Text
              </button>

              <button
                onClick={switchToVoice}
                disabled={isProcessing || disabled || isTransitioning}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                  inputMode === 'voice'
                    ? 'bg-accent text-accent-foreground shadow-md border border-accent/30'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted/80 border border-transparent'
                }`}
              >
                <Mic className="w-4 h-4" />
                Voice
              </button>
            </div>

            <div className="flex items-center gap-3">
              {/* Character Count for Text Mode */}
              {inputMode === 'text' && message.length > 0 && (
                <div
                  className={`text-sm font-mono ${
                    message.length > 1800
                      ? 'text-orange-500'
                      : 'text-muted-foreground'
                  } ${message.length > 2000 ? 'text-red-500' : ''}`}
                >
                  {message.length}/2000
                </div>
              )}

              {/* Processing Indicator */}
              {isProcessing && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Processing...</span>
                </div>
              )}
            </div>
          </div>

          {/* Text Input Mode */}
          {inputMode === 'text' && (
            <div className="relative p-4">
              <div className="flex items-center gap-3">
                <div className="flex-1">
                  <Input
                    ref={inputRef}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    onKeyDown={handleKeyPress}
                    placeholder={placeholder}
                    disabled={disabled || isProcessing || isTransitioning}
                    size="lg"
                    className="w-full border-0 shadow-none bg-muted/30 focus:bg-background/80"
                  />
                </div>

                <Button
                  variant="gradient"
                  size="lg"
                  onClick={handleSendText}
                  disabled={
                    !message.trim() ||
                    isProcessing ||
                    disabled ||
                    isTransitioning
                  }
                  className="h-12 px-6 rounded-xl shadow-md hover:shadow-lg transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50"
                  title="Send message (Enter)"
                  fullWidth={false}
                >
                  {isProcessing ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <>
                      <Send className="w-5 h-5" />
                      <span className="hidden sm:inline">Send</span>
                    </>
                  )}
                </Button>
              </div>

              {/* Character Limit Warning */}
              {message.length > 1800 && (
                <div
                  className={`mt-3 flex items-center justify-between text-sm ${
                    message.length > 2000 ? 'text-red-500' : 'text-orange-500'
                  }`}
                >
                  <span>Character limit: {message.length}/2000</span>
                  {message.length > 2000 && (
                    <span className="text-red-500 font-medium">
                      Limit exceeded
                    </span>
                  )}
                </div>
              )}

              {/* Keyboard Shortcuts */}
              {message.length === 0 && (
                <div className="mt-3 flex items-center gap-4 text-sm text-muted-foreground">
                  <span className="flex items-center gap-2">
                    <kbd className="px-2 py-1 bg-muted rounded text-xs font-mono">
                      Enter
                    </kbd>
                    to send
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Voice Input Mode */}
          {inputMode === 'voice' && (
            <div className="p-6">
              <div className="space-y-6">
                {/* Language Selection */}
                {onLanguageChange && (
                  <div className="flex items-center justify-between p-4 bg-muted/30 rounded-xl border border-border/30">
                    <span className="text-sm font-medium text-foreground">
                      Voice Language:
                    </span>
                    <select
                      value={voiceLanguage || 'en'}
                      onChange={(e) => onLanguageChange?.(e.target.value)}
                      className="text-sm bg-background border border-border/50 rounded-lg px-3 py-2 min-w-[140px] focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50"
                      disabled={isRecording || isProcessing || isTransitioning}
                    >
                      <option value="en">English</option>
                      <option value="es">Spanish</option>
                      <option value="fr">French</option>
                      <option value="de">German</option>
                      <option value="it">Italian</option>
                      <option value="pt">Portuguese</option>
                      <option value="ru">Russian</option>
                      <option value="ja">Japanese</option>
                      <option value="ko">Korean</option>
                      <option value="zh">Chinese</option>
                    </select>
                  </div>
                )}

                {/* Recording Status */}
                {isRecording && (
                  <div className="flex flex-col items-center justify-center gap-4 p-8 bg-gradient-to-br from-red-50 to-red-100 dark:from-red-950/20 dark:to-red-900/20 rounded-2xl border-2 border-red-200 dark:border-red-800">
                    <div className="relative">
                      <div className="w-20 h-20 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center">
                        <div className="w-10 h-10 bg-red-500 rounded-full animate-pulse"></div>
                      </div>
                    </div>
                    <div className="text-center space-y-2">
                      <div className="text-xl font-bold text-red-600 dark:text-red-400">
                        Recording in progress
                      </div>
                      <div className="text-lg text-red-500 font-mono">
                        {formatDuration(recordingDuration)}
                      </div>
                      {recordingDuration > 60 && (
                        <div className="text-sm text-orange-600">
                          Long recordings may take more time to process
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Audio Ready State */}
                {audioBlob && !isRecording && (
                  <div className="flex flex-col items-center justify-center gap-4 p-8 bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950/20 dark:to-green-900/20 rounded-2xl border-2 border-green-200 dark:border-green-800">
                    <div className="w-20 h-20 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
                      <Volume2 className="w-10 h-10 text-green-600 dark:text-green-400" />
                    </div>
                    <div className="text-center space-y-2">
                      <div className="text-xl font-bold text-green-600 dark:text-green-400">
                        Recording ready to send
                      </div>
                      <div className="flex items-center gap-4 text-sm text-green-600 dark:text-green-400">
                        <span>
                          Duration: {formatDuration(recordingDuration)}
                        </span>
                        <span>•</span>
                        <span>
                          Size: {(audioBlob.size / 1024).toFixed(1)} KB
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Voice Controls */}
                <div className="flex flex-col gap-4">
                  {!isRecording && !audioBlob && (
                    <>
                      <Button
                        variant="gradient"
                        size="lg"
                        onClick={onStartRecording}
                        disabled={isProcessing || disabled || isTransitioning}
                        className="w-full h-16 text-lg font-semibold rounded-2xl shadow-lg hover:shadow-xl flex items-center justify-center gap-3 transition-all duration-200"
                      >
                        <Mic className="w-6 h-6" />
                        <span>Start Voice Recording</span>
                      </Button>

                      <div className="text-center text-sm text-muted-foreground space-y-1">
                        <p>Speak clearly for best transcription quality</p>
                        <p>Optimal recording: 5-30 seconds</p>
                      </div>

                      {showVoiceHistory && onViewVoiceHistory && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={onViewVoiceHistory}
                          className="w-full text-sm border-dashed"
                          disabled={isTransitioning}
                        >
                          <History className="w-4 h-4 mr-2" />
                          View Voice Message History
                        </Button>
                      )}
                    </>
                  )}

                  {isRecording && (
                    <Button
                      variant="destructive"
                      size="lg"
                      onClick={onStopRecording}
                      className="w-full h-16 text-lg font-semibold rounded-2xl shadow-lg hover:shadow-xl flex items-center justify-center gap-3 transition-all duration-200 animate-pulse"
                    >
                      <MicOff className="w-6 h-6" />
                      <span>Stop Recording</span>
                    </Button>
                  )}

                  {audioBlob && !isRecording && (
                    <div className="space-y-4">
                      {/* Main Send Button - Full Width */}
                      <Button
                        variant="gradient"
                        size="lg"
                        onClick={handleSendVoice}
                        disabled={isProcessing || disabled || isTransitioning}
                        className="w-full h-16 text-lg font-semibold rounded-2xl shadow-lg hover:shadow-xl transition-all duration-200 relative overflow-hidden"
                      >
                        {isProcessing ? (
                          <>
                            <Loader2 className="w-6 h-6 mr-3 animate-spin" />
                            <span>Processing Audio...</span>
                          </>
                        ) : (
                          <>
                            <Send className="w-6 h-6 mr-3" />
                            <span>Send Voice Message</span>
                          </>
                        )}
                      </Button>

                      {/* Clear Button - Subtle and Secondary */}
                      <div className="flex justify-center">
                        <button
                          onClick={onClearRecording}
                          disabled={isProcessing || isTransitioning}
                          className="cursor-pointer group flex items-center gap-2 px-4 py-2 text-sm text-muted-foreground hover:text-foreground transition-all duration-200 hover:bg-muted/50 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                          title="Clear recording and start over"
                        >
                          <X className="w-4 h-4 group-hover:text-red-500 transition-colors" />
                          <span className="font-medium">Clear Recording</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ChatInput;
