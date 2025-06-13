import React, { useEffect } from 'react';
import { X } from 'lucide-react';

// Base Modal Props
interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  className?: string;
  children: React.ReactNode;
  closeOnOverlayClick?: boolean;
  closeOnEscape?: boolean;
}

// Modal Header Props
interface ModalHeaderProps {
  title?: string;
  subtitle?: string;
  icon?: React.ReactNode;
  onClose?: () => void;
  showCloseButton?: boolean;
  className?: string;
  children?: React.ReactNode;
}

// Modal Body Props
interface ModalBodyProps {
  className?: string;
  children: React.ReactNode;
}

// Modal Footer Props
interface ModalFooterProps {
  className?: string;
  children: React.ReactNode;
}

// Main Modal Component
const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  size = 'md',
  className = '',
  children,
  closeOnOverlayClick = true,
  closeOnEscape = true,
}) => {
  // Handle escape key
  useEffect(() => {
    if (!closeOnEscape) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose, closeOnEscape]);

  // Size configurations
  const sizeClasses = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
    full: 'max-w-full mx-4',
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/80 backdrop-blur-sm animate-in fade-in duration-300"
        onClick={closeOnOverlayClick ? onClose : undefined}
      />

      {/* Modal Container */}
      <div
        className={`relative w-full ${sizeClasses[size]} max-h-[90vh] overflow-hidden`}
      >
        <div
          className={`
            bg-card/95 backdrop-blur-lg border border-border/50 rounded-3xl shadow-2xl 
            animate-in zoom-in-95 slide-in-from-bottom-4 duration-300 flex flex-col
            ${className}
          `}
        >
          {children}
        </div>
      </div>
    </div>
  );
};

// Modal Header Component
export const ModalHeader: React.FC<ModalHeaderProps> = ({
  title,
  subtitle,
  icon,
  onClose,
  showCloseButton = true,
  className = '',
  children,
}) => {
  return (
    <div
      className={`flex items-center justify-between p-6 pb-4 flex-shrink-0 ${className}`}
    >
      <div className="flex items-center gap-4 flex-1 min-w-0">
        {icon && (
          <div className="w-12 h-12 bg-gradient-to-br from-primary to-accent rounded-2xl flex items-center justify-center shadow-lg flex-shrink-0">
            {icon}
          </div>
        )}

        {(title || subtitle) && (
          <div className="flex-1 min-w-0">
            {title && (
              <h2 className="text-2xl lg:text-3xl font-bold text-foreground truncate">
                {title}
              </h2>
            )}
            {subtitle && (
              <p className="text-muted-foreground mt-1 text-sm lg:text-base">
                {subtitle}
              </p>
            )}
          </div>
        )}

        {children && !title && !subtitle && (
          <div className="flex-1 min-w-0">{children}</div>
        )}
      </div>

      {showCloseButton && onClose && (
        <button
          onClick={onClose}
          className="p-2 text-muted-foreground hover:text-foreground hover:bg-muted/50 rounded-xl transition-all duration-200 group flex-shrink-0 ml-4 cursor-pointer"
          aria-label="Close modal"
        >
          <X className="w-5 h-5 group-hover:scale-110 transition-transform" />
        </button>
      )}
    </div>
  );
};

// Modal Body Component
export const ModalBody: React.FC<ModalBodyProps> = ({
  className = '',
  children,
}) => {
  return (
    <div className={`px-6 overflow-y-auto flex-1 min-h-0 ${className}`}>
      {children}
    </div>
  );
};

// Modal Footer Component
export const ModalFooter: React.FC<ModalFooterProps> = ({
  className = '',
  children,
}) => {
  return (
    <div
      className={`p-6 pt-4 border-t border-border/50 flex-shrink-0 ${className}`}
    >
      {children}
    </div>
  );
};

// Default export
export default Modal;
