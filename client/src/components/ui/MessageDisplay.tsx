import React from 'react';

interface MessageProps {
  message: string;
  type: 'success' | 'error' | 'warning' | 'info';
  dismissible?: boolean;
  onDismiss?: () => void;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  showIcon?: boolean;
  autoHide?: boolean;
  autoHideDelay?: number;
}

const MessageDisplay: React.FC<MessageProps> = ({
  message,
  type,
  dismissible = false,
  onDismiss,
  size = 'md',
  className = '',
  showIcon = true,
  autoHide = false,
  autoHideDelay = 5000,
}) => {
  const [isVisible, setIsVisible] = React.useState(true);

  React.useEffect(() => {
    if (autoHide && autoHideDelay > 0) {
      const timer = setTimeout(() => {
        handleDismiss();
      }, autoHideDelay);
      return () => clearTimeout(timer);
    }
  }, [autoHide, autoHideDelay]);

  const handleDismiss = () => {
    setIsVisible(false);
    onDismiss?.();
  };

  if (!isVisible) return null;

  const getTypeStyles = () => {
    switch (type) {
      case 'success':
        return {
          bgColor: 'bg-gradient-to-r from-success/15 to-success/5',
          borderColor: 'border-success/25',
          textColor: 'text-success',
          iconBg: 'bg-success/20',
          iconColor: 'text-success',
          icon: (
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M5 13l4 4L19 7"
            />
          ),
        };
      case 'error':
        return {
          bgColor: 'bg-gradient-to-r from-destructive/15 to-destructive/5',
          borderColor: 'border-destructive/25',
          textColor: 'text-destructive',
          iconBg: 'bg-destructive/20',
          iconColor: 'text-destructive',
          icon: (
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          ),
        };
      case 'warning':
        return {
          bgColor: 'bg-gradient-to-r from-warning/15 to-warning/5',
          borderColor: 'border-warning/25',
          textColor: 'text-warning',
          iconBg: 'bg-warning/20',
          iconColor: 'text-warning',
          icon: (
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.99-.833-2.748 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
            />
          ),
        };
      case 'info':
        return {
          bgColor: 'bg-gradient-to-r from-info/15 to-info/5',
          borderColor: 'border-info/25',
          textColor: 'text-info',
          iconBg: 'bg-info/20',
          iconColor: 'text-info',
          icon: (
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          ),
        };
      default:
        return {
          bgColor: 'bg-gradient-to-r from-muted/15 to-muted/5',
          borderColor: 'border-border/25',
          textColor: 'text-foreground',
          iconBg: 'bg-muted/20',
          iconColor: 'text-muted-foreground',
          icon: null,
        };
    }
  };

  const getSizeStyles = () => {
    switch (size) {
      case 'sm':
        return {
          padding: 'p-3',
          iconSize: 'w-4 h-4',
          iconContainer: 'w-6 h-6',
          textSize: 'text-sm',
          spacing: 'space-x-2',
        };
      case 'lg':
        return {
          padding: 'p-6',
          iconSize: 'w-6 h-6',
          iconContainer: 'w-10 h-10',
          textSize: 'text-base',
          spacing: 'space-x-4',
        };
      default:
        return {
          padding: 'p-4',
          iconSize: 'w-5 h-5',
          iconContainer: 'w-8 h-8',
          textSize: 'text-sm',
          spacing: 'space-x-3',
        };
    }
  };

  const typeStyles = getTypeStyles();
  const sizeStyles = getSizeStyles();

  return (
    <div
      className={`mb-4 ${typeStyles.bgColor} border ${typeStyles.borderColor} rounded-xl ${sizeStyles.padding} animate-slide-up transition-all duration-200 hover:shadow-md ${className}`}
      role="alert"
      aria-live="polite"
    >
      <div className="flex items-center justify-between">
        <div className={`flex items-center ${sizeStyles.spacing}`}>
          {showIcon && (
            <div
              className={`${sizeStyles.iconContainer} ${typeStyles.iconBg} ${typeStyles.iconColor} rounded-lg flex items-center justify-center flex-shrink-0 transition-transform duration-200 hover:scale-105`}
            >
              <svg
                className={`${sizeStyles.iconSize}`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                {typeStyles.icon}
              </svg>
            </div>
          )}
          <p
            className={`${typeStyles.textColor} ${sizeStyles.textSize} leading-relaxed font-medium`}
          >
            {message}
          </p>
        </div>

        {dismissible && (
          <button
            onClick={handleDismiss}
            className={`${typeStyles.textColor} hover:opacity-75 transition-all duration-200 flex-shrink-0 ml-3 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-transparent rounded-lg p-1 hover:bg-background/50`}
            aria-label="Dismiss message"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        )}
      </div>

      {/* Auto-hide progress bar */}
      {autoHide && autoHideDelay > 0 && (
        <div className="mt-3 w-full bg-background/30 rounded-full h-1 overflow-hidden">
          <div
            className={`h-1 ${typeStyles.iconBg} rounded-full animate-shrink-width`}
            style={{
              animation: `shrinkWidth ${autoHideDelay}ms linear forwards`,
            }}
          />
        </div>
      )}
    </div>
  );
};

export default MessageDisplay;
