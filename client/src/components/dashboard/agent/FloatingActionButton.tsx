import React from 'react';
import { MessageCircle, X, Bot } from 'lucide-react';
import Button from '@/components/ui/Button';

interface FloatingActionButtonProps {
  isOpen: boolean;
  onToggle: () => void;
}

const FloatingActionButton: React.FC<FloatingActionButtonProps> = ({
  isOpen,
  onToggle,
}) => {
  return (
    <div className="fixed bottom-6 right-6 z-40">
      <div className="relative">
        <Button
          variant="gradient"
          size="lg"
          onClick={onToggle}
          className="w-16 h-16 rounded-full shadow-2xl hover:shadow-3xl hover:scale-110 transition-all duration-300 group relative overflow-hidden"
        >
          {/* Background animation */}
          <div className="absolute inset-0 bg-gradient-to-r from-primary via-accent to-success opacity-0 group-hover:opacity-20 transition-opacity duration-500 animate-pulse"></div>

          {isOpen ? (
            <X className="w-7 h-7 group-hover:rotate-90 transition-transform duration-300 relative z-10" />
          ) : (
            <MessageCircle className="w-7 h-7 group-hover:scale-110 transition-transform duration-300 relative z-10" />
          )}
        </Button>
      </div>
    </div>
  );
};

export default FloatingActionButton;
