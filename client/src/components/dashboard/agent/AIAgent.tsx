import React, { useState } from 'react';
import FloatingAIChat from './FloatingAIChat';

const AIAgent: React.FC = () => {
  const [isChatOpen, setIsChatOpen] = useState(false);

  const handleToggleChat = () => {
    setIsChatOpen(!isChatOpen);
  };

  return <FloatingAIChat isOpen={isChatOpen} onToggle={handleToggleChat} />;
};

export default AIAgent;
