import React, { useState } from 'react';
import { MessageCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import LLMChat from './LLMChat';
import './LLMChat.css';

const LLMChatFAB = ({ context = null, className = '' }) => {
  const { user } = useAuth();
  const [isChatOpen, setIsChatOpen] = useState(false);

  if (!user) return null;

  const toggleChat = () => {
    setIsChatOpen(!isChatOpen);
  };

  return (
    <>
      {!isChatOpen && (
        <button
          onClick={toggleChat}
          className={`llm-chat-fab ${className}`}
          title="Open AI Assistant"
        >
          <MessageCircle size={24} />
        </button>
      )}
      
      <LLMChat
        isOpen={isChatOpen}
        onClose={() => setIsChatOpen(false)}
        context={context}
      />
    </>
  );
};

export default LLMChatFAB;
