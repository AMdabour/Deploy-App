import React, { useState, forwardRef, type InputHTMLAttributes } from 'react';
import { clsx } from 'clsx';

type InputVariant = 'default' | 'search' | 'password' | 'email' | 'name';
type InputSize = 'sm' | 'md' | 'lg';

interface InputProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size'> {
  variant?: InputVariant;
  size?: InputSize;
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  showPasswordToggle?: boolean;
  onClear?: () => void;
  className?: string;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      variant = 'default',
      size = 'md',
      type = 'text',
      label,
      error,
      helperText,
      leftIcon,
      rightIcon,
      showPasswordToggle = true,
      onClear,
      className = '',
      placeholder,
      value,
      disabled,
      ...props
    },
    ref
  ) => {
    const [showPassword, setShowPassword] = useState(false);
    const [isFocused, setIsFocused] = useState(false);

    // Determine input type based on variant and password visibility
    const getInputType = () => {
      if (variant === 'password') {
        return showPassword ? 'text' : 'password';
      }
      if (variant === 'email') return 'email';
      // Use 'text' instead of 'search' to avoid native clear button
      if (variant === 'search') return 'text';
      return type;
    };

    // Size classes
    const sizeClasses = {
      sm: {
        input: 'h-9 text-sm',
        padding: 'px-3',
        icon: 'w-4 h-4',
        leftPadding: 'pl-9',
        rightPadding: 'pr-9',
      },
      md: {
        input: 'h-10 text-base',
        padding: 'px-4',
        icon: 'w-5 h-5',
        leftPadding: 'pl-10',
        rightPadding: 'pr-10',
      },
      lg: {
        input: 'h-12 text-lg',
        padding: 'px-4',
        icon: 'w-6 h-6',
        leftPadding: 'pl-12',
        rightPadding: 'pr-12',
      },
    };

    const currentSize = sizeClasses[size];

    // Has left icon (either custom or search)
    const hasLeftIcon = leftIcon || variant === 'search';

    // Has right icon (password toggle, clear button, or custom)
    const hasRightIcon =
      (variant === 'password' && showPasswordToggle) ||
      (variant === 'search' && value && onClear) ||
      rightIcon;

    // Base input classes with additional CSS to hide native search clear button
    const baseClasses = clsx(
      'w-full bg-background border border-border rounded-lg text-foreground placeholder:text-muted-foreground',
      'focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary',
      'transition-all duration-200 ease-in-out',
      'disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-muted',
      // Hide native search clear button in WebKit browsers
      '[&::-webkit-search-cancel-button]:appearance-none [&::-webkit-search-decoration]:appearance-none',
      currentSize.input,
      currentSize.padding,
      {
        'border-destructive focus:ring-destructive/20 focus:border-destructive':
          error,
        'hover:border-border/80': !error && !isFocused,
        [currentSize.leftPadding]: hasLeftIcon,
        [currentSize.rightPadding]: hasRightIcon,
      },
      className
    );

    // Get placeholder based on variant
    const getPlaceholder = () => {
      if (placeholder) return placeholder;

      switch (variant) {
        case 'email':
          return 'Enter your email address';
        case 'password':
          return 'Enter your password';
        case 'name':
          return 'Enter your name';
        case 'search':
          return 'Search...';
        default:
          return placeholder;
      }
    };

    // Password toggle icon
    const PasswordToggleIcon = () => (
      <button
        type="button"
        onClick={() => setShowPassword(!showPassword)}
        className="absolute right-0 top-0 h-full px-3 flex items-center text-muted-foreground hover:text-foreground transition-colors focus:outline-none focus:text-foreground"
        tabIndex={-1}
        aria-label={showPassword ? 'Hide password' : 'Show password'}
      >
        {showPassword ? (
          <svg
            className={currentSize.icon}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
            />
          </svg>
        ) : (
          <svg
            className={currentSize.icon}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21"
            />
          </svg>
        )}
      </button>
    );

    // Search icon
    const SearchIcon = () => (
      <div className="absolute left-0 top-0 h-full px-3 flex items-center pointer-events-none">
        <svg
          className={clsx(currentSize.icon, 'text-muted-foreground')}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>
      </div>
    );

    // Clear button for search
    const ClearButton = () => (
      <button
        type="button"
        onClick={onClear}
        className="absolute right-0 top-0 h-full px-3 flex items-center text-muted-foreground hover:text-foreground transition-colors focus:outline-none focus:text-foreground group"
        tabIndex={-1}
        aria-label="Clear search"
      >
        <div className="p-0.5 rounded-full group-hover:bg-muted/50">
          <svg
            className={clsx(currentSize.icon)}
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
        </div>
      </button>
    );

    return (
      <div className="w-full">
        {/* Label */}
        {label && (
          <label className="text-sm font-medium text-foreground block mb-2">
            {label}
          </label>
        )}

        {/* Input Container */}
        <div className="relative">
          {/* Left Icon */}
          {leftIcon && (
            <div className="absolute left-0 top-0 h-full px-3 flex items-center pointer-events-none">
              <div className={clsx(currentSize.icon, 'text-muted-foreground')}>
                {leftIcon}
              </div>
            </div>
          )}

          {/* Search Icon (built-in for search variant) */}
          {variant === 'search' && !leftIcon && <SearchIcon />}

          {/* Input Field */}
          <input
            ref={ref}
            type={getInputType()}
            className={baseClasses}
            placeholder={getPlaceholder()}
            value={value}
            disabled={disabled}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            {...props}
          />

          {/* Right Icons */}
          {variant === 'password' && showPasswordToggle && (
            <PasswordToggleIcon />
          )}

          {variant === 'search' && value && onClear && <ClearButton />}

          {rightIcon && variant !== 'password' && variant !== 'search' && (
            <div className="absolute right-0 top-0 h-full px-3 flex items-center pointer-events-none">
              <div className={clsx(currentSize.icon, 'text-muted-foreground')}>
                {rightIcon}
              </div>
            </div>
          )}
        </div>

        {/* Helper Text or Error */}
        {(error || helperText) && (
          <p
            className={clsx(
              'text-sm mt-2',
              error ? 'text-destructive' : 'text-muted-foreground'
            )}
          >
            {error || helperText}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

export default Input;
