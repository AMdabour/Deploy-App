import React, { type ButtonHTMLAttributes } from 'react';
import { clsx } from 'clsx';

type ButtonVariant =
  | 'primary'
  | 'secondary'
  | 'danger'
  | 'outline'
  | 'subtle'
  | 'success'
  | 'warning'
  | 'info'
  | 'gradient'
  | 'ghost'
  | 'default'
  | 'destructive'

type ButtonSize = 'sm' | 'md' | 'lg' | 'xl';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
  loading?: boolean;
  className?: string;
  onClick?: () => void;
}

const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  fullWidth = true,
  loading = false,
  className = '',
  onClick,
  ...props
}) => {
  // Base classes for all buttons
  const baseClasses =
    'font-semibold rounded-lg border-b-4 transform hover:translate-y-0.5 transition-all duration-200 cursor-pointer focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-background active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none';

  // Size classes
  const sizeClasses = {
    sm: 'py-1 px-3 text-sm',
    md: 'py-2 px-4 text-base',
    lg: 'py-3 px-6 text-lg',
    xl: 'py-4 px-8 text-xl',
  };

  // Variant classes using the new color theme
  const variantClasses = {
    primary:
      'bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary/80 text-primary-foreground border-primary/80 hover:border-primary/70 focus:ring-primary shadow-lg hover:shadow-xl',
    secondary:
      'bg-gradient-to-r from-secondary to-secondary/90 hover:from-secondary/90 hover:to-secondary/80 text-secondary-foreground border-secondary/80 hover:border-secondary/70 focus:ring-secondary',
    danger:
      'bg-gradient-to-r from-destructive to-destructive/90 hover:from-destructive/90 hover:to-destructive/80 text-destructive-foreground border-destructive/80 hover:border-destructive/70 focus:ring-destructive shadow-lg hover:shadow-xl',
    success:
      'bg-gradient-to-r from-success to-success/90 hover:from-success/90 hover:to-success/80 text-success-foreground border-success/80 hover:border-success/70 focus:ring-success shadow-lg hover:shadow-xl',
    warning:
      'bg-gradient-to-r from-warning to-warning/90 hover:from-warning/90 hover:to-warning/80 text-warning-foreground border-warning/80 hover:border-warning/70 focus:ring-warning shadow-lg hover:shadow-xl',
    info: 'bg-gradient-to-r from-info to-info/90 hover:from-info/90 hover:to-info/80 text-info-foreground border-info/80 hover:border-info/70 focus:ring-info shadow-lg hover:shadow-xl',
    outline:
      'bg-transparent hover:bg-muted text-foreground border-border hover:border-border/80 focus:ring-ring',
    subtle:
      'bg-muted hover:bg-muted/80 text-muted-foreground border-muted/60 hover:border-muted/50 focus:ring-ring',
    gradient:
      'bg-gradient-to-r from-gradient-start to-gradient-end hover:from-gradient-start/90 hover:to-gradient-end/90 text-primary-foreground border-gradient-start/80 hover:border-gradient-start/70 focus:ring-gradient-start shadow-lg hover:shadow-xl',
  };

  const classes = clsx(
    baseClasses,
    sizeClasses[size],
    variantClasses[variant],
    {
      'w-full': fullWidth,
      'cursor-wait': loading,
    },
    className
  );

  return (
    <button
      className={classes}
      onClick={onClick}
      disabled={loading || props.disabled}
      {...props}
    >
      {loading ? (
        <div className="flex items-center justify-center space-x-2">
          <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
          <span>Loading...</span>
        </div>
      ) : (
        children
      )}
    </button>
  );
};

export default Button;
