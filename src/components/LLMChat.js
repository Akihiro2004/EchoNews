import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import llmService from '../services/llmService';
import { 
  MessageCircle, 
  Send, 
  Loader2, 
  Bot, 
  User,
  X,
  Minimize2,
  Maximize2,
  Trash2,
  Clock
} from 'lucide-react';
import './LLMChat.css';

const LLMChat = ({ isOpen, onClose, context = null, className = '' }) => {
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [showMemoryLog, setShowMemoryLog] = useState(false);
  const [userMemory, setUserMemory] = useState([]);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (isOpen && user) {
      loadShortTermMessages();
      loadUserMemory();
    }
  }, [isOpen, user]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadShortTermMessages = () => {
    const shortTermMessages = llmService.getShortTermMessages();
    const formattedMessages = shortTermMessages.map(msg => [
      { type: 'user', content: msg.user, timestamp: msg.timestamp },
      { type: 'assistant', content: msg.llm, timestamp: msg.timestamp }
    ]).flat();
    setMessages(formattedMessages);
  };

  const loadUserMemory = async () => {
    try {
      const memory = await llmService.getUserMemory(user.uid);
      setUserMemory(memory);
    } catch (error) {
      console.error('Error loading user memory:', error);
    }
  };

  const handleSendMessage = async () => {
    if (!input.trim() || loading || !user) return;

    const userMessage = input.trim();
    setInput('');
    setLoading(true);

    // Add user message to UI immediately
    const newUserMessage = {
      type: 'user',
      content: userMessage,
      timestamp: Date.now()
    };
    setMessages(prev => [...prev, newUserMessage]);

    try {
      const response = await llmService.chat(user.uid, userMessage, context);
      
      // Add assistant response
      const assistantMessage = {
        type: 'assistant',
        content: response,
        timestamp: Date.now()
      };
      setMessages(prev => [...prev, assistantMessage]);
      
      // Reload memory in case it was updated
      await loadUserMemory();
      
    } catch (error) {
      console.error('Error sending message:', error);
      const errorMessage = {
        type: 'assistant',
        content: 'Sorry, I encountered an error. Please try again.',
        timestamp: Date.now(),
        isError: true
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const clearChat = () => {
    if (window.confirm('Are you sure you want to clear the chat history?')) {
      llmService.clearShortTermStorage();
      setMessages([]);
    }
  };

  const deleteMemory = async (memoryId) => {
    if (window.confirm('Are you sure you want to delete this memory?')) {
      try {
        await llmService.deleteUserMemory(memoryId);
        await loadUserMemory();
      } catch (error) {
        console.error('Error deleting memory:', error);
      }
    }
  };

  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  if (!isOpen) return null;

  return (
    <div className={`llm-chat-overlay ${className}`}>
      <div className={`llm-chat-container ${isMinimized ? 'minimized' : ''}`}>
        {/* Header */}
        <div className="llm-chat-header">
          <div className="header-left">
            <Bot className="bot-icon" size={20} />
            <span className="chat-title">AI Assistant</span>
            {context && (
              <span className="context-badge">{context}</span>
            )}
          </div>
          <div className="header-actions">
            <button
              onClick={() => setShowMemoryLog(!showMemoryLog)}
              className="header-btn"
              title="Memory Log"
            >
              <Clock size={16} />
            </button>
            <button
              onClick={clearChat}
              className="header-btn"
              title="Clear Chat"
            >
              <Trash2 size={16} />
            </button>
            <button
              onClick={() => setIsMinimized(!isMinimized)}
              className="header-btn"
              title={isMinimized ? 'Maximize' : 'Minimize'}
            >
              {isMinimized ? <Maximize2 size={16} /> : <Minimize2 size={16} />}
            </button>
            <button
              onClick={onClose}
              className="header-btn close-btn"
              title="Close"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {!isMinimized && (
          <>
            {/* Memory Log */}
            {showMemoryLog && (
              <div className="memory-log">
                <h4>Memory Log</h4>
                {userMemory.length === 0 ? (
                  <p className="no-memory">No memory entries yet</p>
                ) : (
                  <div className="memory-list">
                    {userMemory.map((memory) => (
                      <div key={memory.id} className="memory-item">
                        <div className="memory-content">
                          <p className="memory-summary">
                            {memory.contextSummary?.conversationSummary || 'Context summary'}
                          </p>
                          <div className="memory-meta">
                            <span className="memory-date">
                              {memory.createdAt?.toDate?.()?.toLocaleDateString() || 'Recent'}
                            </span>
                            {memory.contextSummary?.topics && (
                              <div className="memory-topics">
                                {memory.contextSummary.topics.map(topic => (
                                  <span key={topic} className="topic-tag">{topic}</span>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                        <button
                          onClick={() => deleteMemory(memory.id)}
                          className="delete-memory-btn"
                          title="Delete Memory"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Messages */}
            <div className="llm-chat-messages">
              {messages.length === 0 ? (
                <div className="welcome-message">
                  <Bot size={32} />
                  <p>Hello! I'm your AI assistant. How can I help you with the news today?</p>
                </div>
              ) : (
                messages.map((message, index) => (
                  <div
                    key={index}
                    className={`message ${message.type} ${message.isError ? 'error' : ''}`}
                  >
                    <div className="message-icon">
                      {message.type === 'user' ? <User size={16} /> : <Bot size={16} />}
                    </div>
                    <div className="message-content">
                      <p>{message.content}</p>
                      <span className="message-time">
                        {formatTimestamp(message.timestamp)}
                      </span>
                    </div>
                  </div>
                ))
              )}
              {loading && (
                <div className="message assistant loading">
                  <div className="message-icon">
                    <Bot size={16} />
                  </div>
                  <div className="message-content">
                    <div className="loading-dots">
                      <Loader2 size={16} className="spinner" />
                      <span>Thinking...</span>
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="llm-chat-input">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Ask me anything about the news..."
                disabled={loading || !user}
                rows={1}
                className="chat-textarea"
              />
              <button
                onClick={handleSendMessage}
                disabled={!input.trim() || loading || !user}
                className="send-btn"
                title="Send message"
              >
                {loading ? <Loader2 size={16} className="spinner" /> : <Send size={16} />}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default LLMChat;
