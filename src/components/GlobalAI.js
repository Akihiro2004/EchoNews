import React, { useState, useRef, useEffect } from 'react';
import { Bot, X, Send, Sparkles, ChevronDown, RotateCcw } from 'lucide-react';
import { streamChat } from '../services/aiService';
import { useUI } from '../App';

function MarkdownText({ text }) {
  const parts = text.split(/(\*\*.*?\*\*)/g);
  return (
    <>
      {parts.map((part, i) =>
        part.startsWith('**') && part.endsWith('**')
          ? <strong key={i} style={{ color: 'var(--text-1)', fontWeight: 600 }}>{part.slice(2, -2)}</strong>
          : <span key={i}>{part}</span>
      )}
    </>
  );
}

function Message({ msg }) {
  const isUser = msg.role === 'user';
  return (
    <div style={{
      display: 'flex',
      justifyContent: isUser ? 'flex-end' : 'flex-start',
      marginBottom: 12,
      animation: 'fadeUp 0.25s ease',
    }}>
      {!isUser && (
        <div style={{
          width: 26, height: 26, borderRadius: '50%',
          background: 'var(--primary-gradient)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0, marginRight: 8, marginTop: 2,
        }}>
          <Sparkles size={13} color="#fff" />
        </div>
      )}
      <div style={{
        maxWidth: '82%',
        padding: isUser ? '9px 13px' : '10px 14px',
        borderRadius: isUser ? '16px 16px 4px 16px' : '4px 16px 16px 16px',
        background: isUser ? 'var(--primary-gradient)' : 'var(--surface-2)',
        color: isUser ? '#fff' : 'var(--text-1)',
        fontSize: 13.5,
        lineHeight: 1.6,
        border: isUser ? 'none' : '1px solid var(--border)',
        whiteSpace: 'pre-wrap',
        wordBreak: 'break-word',
      }}>
        {msg.streaming
          ? <><MarkdownText text={msg.content} /><span style={{ animation: 'pulse 1s infinite', display: 'inline-block' }}>▋</span></>
          : <MarkdownText text={msg.content} />
        }
      </div>
    </div>
  );
}

const SUGGESTIONS = [
  "What's happening in tech today?",
  "Explain the latest AI news",
  "Any important political updates?",
  "Summarize today's top stories",
];

export default function GlobalAI({ user, onOpenAuth }) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [streaming, setStreaming] = useState(false);
  const { currentArticle } = useUI();
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    if (open && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, open]);

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 100);
      if (messages.length === 0) {
        setMessages([{
          role: 'assistant',
          content: currentArticle
            ? `I can see you're reading **"${currentArticle.title}"**. What would you like to know about it, or anything else in the news?`
            : "Hi! I'm your Echo News AI. Ask me about any news topic, request a summary, or explore current events.",
          id: Date.now(),
        }]);
      }
    }
  }, [open]);

  const send = async (text) => {
    const msg = text || input.trim();
    if (!msg || streaming) return;
    setInput('');

    const userMsg = { role: 'user', content: msg, id: Date.now() };
    setMessages(prev => [...prev, userMsg]);

    const aiMsgId = Date.now() + 1;
    setMessages(prev => [...prev, { role: 'assistant', content: '', id: aiMsgId, streaming: true }]);
    setStreaming(true);

    const history = messages.slice(-8).filter(m => !m.streaming);

    try {
      await streamChat(
        msg,
        history,
        { article: currentArticle },
        (chunk) => {
          setMessages(prev => prev.map(m =>
            m.id === aiMsgId ? { ...m, content: m.content + chunk } : m
          ));
        },
        () => {
          setMessages(prev => prev.map(m =>
            m.id === aiMsgId ? { ...m, streaming: false } : m
          ));
          setStreaming(false);
        },
        (err) => {
          setMessages(prev => prev.map(m =>
            m.id === aiMsgId
              ? { ...m, content: 'Sorry, I encountered an error. Please try again.', streaming: false }
              : m
          ));
          setStreaming(false);
        }
      );
    } catch {
      setStreaming(false);
    }
  };

  const handleKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  };

  const clearChat = () => {
    setMessages([{
      role: 'assistant',
      content: "Chat cleared. What would you like to explore?",
      id: Date.now(),
    }]);
  };

  return (
    <>
      {/* Panel */}
      {open && (
        <div style={{
          position: 'fixed',
          bottom: 88,
          right: 24,
          width: 380,
          maxHeight: 560,
          background: 'var(--surface)',
          border: '1px solid var(--border-strong)',
          borderRadius: 'var(--radius-xl)',
          boxShadow: 'var(--shadow-lg)',
          display: 'flex',
          flexDirection: 'column',
          zIndex: 150,
          animation: 'fadeUp 0.25s var(--ease-spring)',
          overflow: 'hidden',
        }}>
          {/* Header */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 10,
            padding: '14px 16px', borderBottom: '1px solid var(--border)',
            flexShrink: 0,
          }}>
            <div style={{
              width: 30, height: 30, borderRadius: '50%',
              background: 'var(--primary-gradient)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Sparkles size={14} color="#fff" />
            </div>
            <div>
              <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-1)' }}>Echo AI</p>
              <p style={{ fontSize: 11, color: 'var(--text-3)' }}>
                {currentArticle ? `Context: ${currentArticle.title.substring(0, 30)}…` : 'News assistant'}
              </p>
            </div>
            <div style={{ marginLeft: 'auto', display: 'flex', gap: 4 }}>
              <button
                onClick={clearChat}
                title="Clear chat"
                style={{ color: 'var(--text-3)', padding: 5, borderRadius: 6, display: 'flex' }}
                onMouseEnter={e => e.currentTarget.style.color = 'var(--text-2)'}
                onMouseLeave={e => e.currentTarget.style.color = 'var(--text-3)'}
              >
                <RotateCcw size={14} />
              </button>
              <button
                onClick={() => setOpen(false)}
                style={{ color: 'var(--text-3)', padding: 5, borderRadius: 6, display: 'flex' }}
                onMouseEnter={e => e.currentTarget.style.color = 'var(--text-1)'}
                onMouseLeave={e => e.currentTarget.style.color = 'var(--text-3)'}
              >
                <ChevronDown size={15} />
              </button>
            </div>
          </div>

          {/* Messages */}
          <div style={{
            flex: 1, overflowY: 'auto', padding: '16px 14px',
            display: 'flex', flexDirection: 'column',
          }}>
            {messages.length === 1 && messages[0].role === 'assistant' && (
              <div style={{ marginBottom: 12 }}>
                <p style={{ fontSize: 11, color: 'var(--text-3)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Try asking
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {SUGGESTIONS.map(s => (
                    <button
                      key={s}
                      onClick={() => send(s)}
                      style={{
                        textAlign: 'left', padding: '8px 12px',
                        borderRadius: 'var(--radius)', background: 'var(--surface-2)',
                        border: '1px solid var(--border)', color: 'var(--text-2)',
                        fontSize: 12.5, transition: 'all 0.15s',
                      }}
                      onMouseEnter={e => { e.currentTarget.style.background = 'var(--surface-3)'; e.currentTarget.style.color = 'var(--text-1)'; }}
                      onMouseLeave={e => { e.currentTarget.style.background = 'var(--surface-2)'; e.currentTarget.style.color = 'var(--text-2)'; }}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}
            {messages.map(msg => <Message key={msg.id} msg={msg} />)}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div style={{
            padding: '12px 12px', borderTop: '1px solid var(--border)', flexShrink: 0,
          }}>
            <div style={{
              display: 'flex', alignItems: 'flex-end', gap: 8,
              background: 'var(--surface-2)', border: '1px solid var(--border-strong)',
              borderRadius: 'var(--radius-lg)', padding: '6px 6px 6px 12px',
              transition: 'border-color 0.15s',
            }}
              onFocusCapture={e => e.currentTarget.style.borderColor = 'var(--border-focus)'}
              onBlurCapture={e => e.currentTarget.style.borderColor = 'var(--border-strong)'}
            >
              <textarea
                ref={inputRef}
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={handleKey}
                placeholder="Ask anything…"
                rows={1}
                disabled={streaming}
                style={{
                  flex: 1, background: 'transparent', border: 'none', outline: 'none',
                  color: 'var(--text-1)', fontSize: 13.5, resize: 'none', lineHeight: 1.5,
                  maxHeight: 100, overflowY: 'auto', padding: '3px 0',
                }}
                onInput={e => {
                  e.target.style.height = 'auto';
                  e.target.style.height = Math.min(e.target.scrollHeight, 100) + 'px';
                }}
              />
              <button
                onClick={() => send()}
                disabled={!input.trim() || streaming}
                style={{
                  width: 30, height: 30, borderRadius: '50%',
                  background: input.trim() && !streaming ? 'var(--primary-gradient)' : 'var(--surface-3)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  transition: 'all 0.15s', flexShrink: 0,
                  cursor: input.trim() && !streaming ? 'pointer' : 'not-allowed',
                }}
              >
                <Send size={13} color={input.trim() && !streaming ? '#fff' : 'var(--text-3)'} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* FAB */}
      <button
        onClick={() => setOpen(!open)}
        title="Echo AI Assistant"
        style={{
          position: 'fixed',
          bottom: 24,
          right: 24,
          width: 52,
          height: 52,
          borderRadius: '50%',
          background: open ? 'var(--surface-3)' : 'var(--primary-gradient)',
          boxShadow: open ? 'var(--shadow)' : 'var(--shadow-primary)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 150,
          transition: 'all 0.2s var(--ease-spring)',
          transform: open ? 'scale(0.92)' : 'scale(1)',
          border: open ? '1px solid var(--border-strong)' : 'none',
        }}
        onMouseEnter={e => { if (!open) e.currentTarget.style.transform = 'scale(1.08)'; }}
        onMouseLeave={e => e.currentTarget.style.transform = open ? 'scale(0.92)' : 'scale(1)'}
      >
        {open
          ? <X size={20} color="var(--text-2)" />
          : <Bot size={22} color="#fff" />
        }
      </button>

      <style>{`
        @media (max-width: 768px) {
          /* AI panel and FAB shift up on mobile due to bottom nav */
          [data-global-ai] { bottom: 80px !important; }
        }
      `}</style>
    </>
  );
}
