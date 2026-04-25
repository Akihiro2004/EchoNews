import React, { useState, useEffect, useRef } from 'react';
import { 
  FileText, MessageCircle, Lightbulb, Shield, 
  Send, CheckCircle, 
  User, X
} from 'lucide-react';
import { 
  summarizeArticle, streamArticleSummary, streamAskArticle, 
  getKeyInsights, factCheckArticle 
} from '../services/aiService';
import { getAIAnalysis, saveAIAnalysis } from '../services/firebaseService';
import { Link } from 'react-router-dom';

const TABS = [
  { id: 'summary', label: 'Summary', icon: FileText },
  { id: 'ask', label: 'Analysis', icon: MessageCircle },
  { id: 'insights', label: 'Insights', icon: Lightbulb },
  { id: 'factcheck', label: 'Verify', icon: Shield },
];


function MarkdownContent({ text, isStreaming = false }) {
  if (!text) return null;
  
  const lines = text.split('\n');
  
  const renderInline = (t) => {
    const parts = t.split(/(\*\*.*?\*\*|\*.*?\*)/g);
    return parts.map((p, i) => {
      if (p.startsWith('**') && p.endsWith('**')) {
        return <strong key={i} style={{ color: 'var(--text-1)', fontWeight: 600 }}>{p.slice(2, -2)}</strong>;
      }
      if (p.startsWith('*') && p.endsWith('*')) {
        return <em key={i} style={{ fontStyle: 'italic', color: 'var(--text-2)' }}>{p.slice(1, -1)}</em>;
      }
      return p;
    });
  };

  return (
    <div style={{ fontSize: '14.5px', lineHeight: '1.7', color: 'var(--text-2)' }}>
      {lines.map((line, i) => {
        if (!line.trim() && i < lines.length - 1) return <div key={i} style={{ height: '12px' }} />;
        
        if (line.startsWith('### ')) {
          return <h4 key={i} style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-1)', marginTop: '20px', marginBottom: '8px' }}>{line.slice(4)}</h4>;
        }
        if (line.startsWith('## ')) {
          return <h3 key={i} style={{ fontSize: '18px', fontWeight: 600, color: 'var(--text-1)', marginTop: '24px', marginBottom: '10px' }}>{line.slice(3)}</h3>;
        }
        
        if (line.startsWith('- ') || line.startsWith('• ')) {
          return (
            <div key={i} style={{ display: 'flex', gap: '10px', marginBottom: '6px', paddingLeft: '4px' }}>
              <span style={{ color: 'var(--primary)', flexShrink: 0, marginTop: '2px' }}>•</span>
              <span>{renderInline(line.slice(2))}</span>
            </div>
          );
        }
        
        if (/^\d+\.\s/.test(line)) {
          const num = line.match(/^\d+/)[0];
          return (
            <div key={i} style={{ display: 'flex', gap: '10px', marginBottom: '6px', paddingLeft: '4px' }}>
              <span style={{ color: 'var(--primary)', flexShrink: 0, minWidth: '18px', fontWeight: 600 }}>{num}.</span>
              <span>{renderInline(line.replace(/^\d+\.\s/, ''))}</span>
            </div>
          );
        }
        
        return (
          <p key={i} style={{ marginBottom: '10px' }}>
            {renderInline(line)}
            {isStreaming && i === lines.length - 1 && (
              <span style={{ 
                display: 'inline-block', 
                width: '6px', 
                height: '14px', 
                background: 'var(--primary)', 
                marginLeft: '6px',
                verticalAlign: 'middle',
                animation: 'pulse 0.8s infinite'
              }} />
            )}
          </p>
        );
      })}
    </div>
  );
}

export default function AIPanel({ article, user, onClose }) {
  const [activeTab, setActiveTab] = useState('summary');
  const [summaryData, setSummaryData] = useState(null);
  const [summaryText, setSummaryText] = useState('');
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [insightsData, setInsightsData] = useState(null);
  const [insightsLoading, setInsightsLoading] = useState(false);
  const [factData, setFactData] = useState(null);
  const [factLoading, setFactLoading] = useState(false);
  const [askMessages, setAskMessages] = useState([]);
  const [askInput, setAskInput] = useState('');
  const [askStreaming, setAskStreaming] = useState(false);
  
  const askEndRef = useRef(null);
  const askInputRef = useRef(null);

  useEffect(() => {
    if (activeTab === 'summary' && !summaryData && !summaryLoading) loadSummary();
    if (activeTab === 'insights' && !insightsData && !insightsLoading) loadInsights();
    if (activeTab === 'factcheck' && !factData && !factLoading) loadFactCheck();
  }, [activeTab]);

  useEffect(() => {
    askEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [askMessages]);

  const loadSummary = async () => {
    setSummaryLoading(true);
    try {
      // 1. Check Cache
      const cached = await getAIAnalysis(article.id);
      if (cached?.summary) {
        setSummaryData(cached.summary);
        setSummaryText(cached.summary.fullText || '');
        setSummaryLoading(false);
        return;
      }

      // 2. Generate if not cached
      const data = await summarizeArticle(article);
      setSummaryData(data);
      setSummaryText('');
      
      let fullText = '';
      await streamArticleSummary(article,
        (chunk) => {
          fullText += chunk;
          setSummaryText(prev => prev + chunk);
        },
        async () => {
          setSummaryLoading(false);
          // 3. Save to Cache
          await saveAIAnalysis(article.id, 'summary', { ...data, fullText });
        },
        () => setSummaryLoading(false)
      );
    } catch (err) {
      console.error('Summary error:', err);
      setSummaryLoading(false);
    }
  };

  const loadInsights = async () => {
    setInsightsLoading(true);
    try {
      // 1. Check Cache
      const cached = await getAIAnalysis(article.id);
      if (cached?.insights) {
        setInsightsData(cached.insights);
        setInsightsLoading(false);
        return;
      }

      // 2. Generate
      const data = await getKeyInsights(article);
      setInsightsData(data);
      
      // 3. Save
      await saveAIAnalysis(article.id, 'insights', data);
    } catch { } finally {
      setInsightsLoading(false);
    }
  };

  const loadFactCheck = async () => {
    setFactLoading(true);
    try {
      // 1. Check Cache
      const cached = await getAIAnalysis(article.id);
      if (cached?.factcheck) {
        setFactData(cached.factcheck);
        setFactLoading(false);
        return;
      }

      // 2. Generate
      const data = await factCheckArticle(article);
      setFactData(data);
      
      // 3. Save
      await saveAIAnalysis(article.id, 'factcheck', data);
    } catch { } finally {
      setFactLoading(false);
    }
  };

  const handleAsk = async () => {
    const q = askInput.trim();
    if (!q || askStreaming) return;
    
    setAskInput('');
    const userMsg = { role: 'user', content: q, id: Date.now() };
    setAskMessages(prev => [...prev, userMsg]);
    
    const aiId = Date.now() + 1;
    setAskMessages(prev => [...prev, { role: 'assistant', content: '', id: aiId, streaming: true }]);
    setAskStreaming(true);

    try {
      await streamAskArticle(
        article, q, askMessages.slice(-6),
        (chunk) => setAskMessages(prev => prev.map(m => m.id === aiId ? { ...m, content: m.content + chunk } : m)),
        () => {
          setAskMessages(prev => prev.map(m => m.id === aiId ? { ...m, streaming: false } : m));
          setAskStreaming(false);
        },
        () => {
          setAskMessages(prev => prev.map(m => m.id === aiId ? { ...m, content: 'Error generating response.', streaming: false } : m));
          setAskStreaming(false);
        }
      );
    } catch (err) {
      setAskStreaming(false);
    }
  };

  return (
    <div style={{
      width: '100%',
      height: '100%',
      background: 'var(--surface)',
      display: 'flex',
      flexDirection: 'column',
      position: 'relative',
      borderLeft: '1px solid var(--border)',
    }}>
      {/* Header */}
      <div style={{
        padding: '24px',
        borderBottom: '1px solid var(--border)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        background: 'var(--surface)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <div>
            <h2 style={{ fontSize: '18px', fontFamily: 'Instrument Serif, serif', fontWeight: 400, color: 'var(--text-1)', margin: 0, letterSpacing: '0.01em' }}>Echo AI</h2>
            <p style={{ fontSize: '11px', color: 'var(--text-3)', margin: 0 }}>Analysis & Context</p>
          </div>
        </div>
        <button onClick={onClose} style={{ 
          padding: '6px', borderRadius: '6px', border: 'none', background: 'transparent', 
          color: 'var(--text-3)', cursor: 'pointer', transition: 'all 0.2s' 
        }}
        onMouseEnter={e => e.currentTarget.style.color = 'var(--text-1)'}>
          <X size={18} />
        </button>
      </div>

      {/* Tabs */}
      <div style={{ 
        display: 'flex', 
        padding: '0 8px',
        borderBottom: '1px solid var(--border)',
        background: 'var(--surface)',
      }}>
        {TABS.map(({ id, label, icon: Icon }) => (
          <button 
            key={id} 
            onClick={() => setActiveTab(id)} 
            style={{
              flex: 1,
              padding: '14px 4px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '4px',
              border: 'none',
              background: 'transparent',
              fontSize: '10.5px',
              fontWeight: activeTab === id ? 600 : 500,
              color: activeTab === id ? 'var(--primary)' : 'var(--text-3)',
              position: 'relative',
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
          >
            <Icon size={14} />
            {label}
            {activeTab === id && (
              <div style={{ 
                position: 'absolute', bottom: 0, left: '12px', right: '12px', 
                height: '2px', background: 'var(--primary)', borderRadius: '2px 2px 0 0' 
              }} />
            )}
          </button>
        ))}
      </div>

      {/* Content Area */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px' }}>
        {/* Summary Tab */}
        {activeTab === 'summary' && (
          <div style={{ animation: 'fadeIn 0.3s ease' }}>
            {summaryLoading && !summaryData ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div className="skeleton" style={{ height: '70px' }} />
                <div className="skeleton" style={{ height: '180px' }} />
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                {summaryData && (
                  <div style={{ 
                    padding: '18px 20px', 
                    background: 'rgba(217, 119, 87, 0.06)', 
                    borderRadius: 'var(--radius)', 
                    border: '1px solid rgba(217, 119, 87, 0.2)',
                    marginBottom: '28px' 
                  }}>
                    <h5 style={{ fontSize: '10px', fontWeight: 700, color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '8px' }}>TL;DR</h5>
                    <p style={{ 
                      fontSize: '16px', lineHeight: '1.6', color: 'var(--text-1)', 
                      margin: 0, fontWeight: 450, letterSpacing: '0.01em'
                    }}>
                      {summaryData.tldr}
                    </p>
                  </div>
                )}

                {summaryData?.bullets && (
                  <div>
                    <h5 style={{ fontSize: '10px', fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '14px' }}>Key Takeaways</h5>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      {summaryData.bullets.map((b, i) => (
                        <div key={i} style={{ 
                          display: 'flex', gap: '12px', padding: '12px 14px', 
                          background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 'var(--radius)'
                        }}>
                          <span style={{ color: 'var(--primary)', fontWeight: 600, fontSize: '14px', marginTop: '1px' }}>→</span>
                          <span style={{ fontSize: '13.5px', color: 'var(--text-1)', lineHeight: '1.6' }}>{b}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {(summaryText || summaryLoading) && (
                  <div>
                    <h5 style={{ fontSize: '10px', fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '14px' }}>AI Analysis</h5>
                    <MarkdownContent text={summaryText} isStreaming={summaryLoading} />
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Ask/Analysis Tab */}
        {activeTab === 'ask' && (
          <div style={{ display: 'flex', flexDirection: 'column', height: '100%', animation: 'fadeIn 0.3s ease' }}>
            <div style={{ flex: 1, marginBottom: '16px' }}>
              {askMessages.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '32px 0' }}>
                  <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'var(--surface-2)', border: '1px solid var(--border)', margin: '0 auto 14px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <MessageCircle size={20} color="var(--text-3)" />
                  </div>
                  <h3 style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-1)', marginBottom: '6px' }}>Article Analysis</h3>
                  <p style={{ fontSize: '13px', color: 'var(--text-3)', marginBottom: '20px' }}>Ask about context or implications.</p>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {['Explain the context', 'What happens next?', 'Who is involved?'].map(q => (
                      <button 
                        key={q} 
                        onClick={() => { setAskInput(q); }}
                        style={{ 
                          padding: '10px 14px', textAlign: 'left', borderRadius: 'var(--radius)', 
                          border: '1px solid var(--border)', background: 'var(--surface-2)', color: 'var(--text-2)',
                          fontSize: '12.5px', cursor: 'pointer', transition: 'all 0.2s'
                        }}
                        onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--primary-border)'; e.currentTarget.style.color = 'var(--text-1)'; }}
                        onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text-2)'; }}
                      >
                        {q}
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
                  {askMessages.map((msg, i) => (
                    <div key={msg.id} style={{ 
                      display: 'flex', 
                      flexDirection: 'column',
                      gap: '6px',
                      alignItems: msg.role === 'user' ? 'flex-end' : 'flex-start'
                    }}>
                      <div style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: '6px',
                        marginBottom: '2px'
                      }}>
                        {msg.role === 'assistant' ? (
                          <>
                            <span style={{ fontSize: '10px', fontWeight: 700, color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Echo AI</span>
                          </>
                        ) : (
                          <>
                            <span style={{ fontSize: '10px', fontWeight: 600, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>User</span>
                            <User size={10} color="var(--text-2)" />
                          </>
                        )}
                      </div>
                      <div style={{ 
                        maxWidth: '92%',
                        padding: msg.role === 'user' ? '10px 14px' : '0',
                        background: msg.role === 'user' ? 'var(--surface-3)' : 'transparent',
                        borderRadius: 'var(--radius)',
                        fontSize: '14px',
                        lineHeight: '1.6',
                        color: 'var(--text-2)',
                        border: msg.role === 'user' ? '1px solid var(--border-strong)' : 'none'
                      }}>
                        {msg.role === 'assistant' ? (
                          <MarkdownContent text={msg.content} isStreaming={msg.streaming} />
                        ) : (
                          msg.content
                        )}
                      </div>
                    </div>
                  ))}
                  <div ref={askEndRef} />
                </div>
              )}
            </div>
            
            {/* Input area */}
            <div style={{ 
              position: 'sticky', bottom: '0', background: 'var(--surface)', padding: '10px 0 0',
              borderTop: '1px solid var(--border)'
            }}>
              <div style={{ 
                display: 'flex', gap: '8px', padding: '6px', 
                background: 'var(--surface-2)', border: '1px solid var(--border-strong)', borderRadius: 'var(--radius)',
                boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.1)'
              }}>
                <textarea 
                  ref={askInputRef}
                  value={askInput} 
                  onChange={e => {
                    setAskInput(e.target.value);
                    e.target.style.height = 'auto';
                    e.target.style.height = Math.min(e.target.scrollHeight, 150) + 'px';
                  }}
                  onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleAsk(); } }}
                  placeholder="Ask a question..."
                  disabled={askStreaming}
                  rows={1}
                  style={{ 
                    flex: 1, background: 'transparent', border: 'none', outline: 'none', 
                    color: 'var(--text-1)', fontSize: '13.5px', resize: 'none', padding: '8px 6px',
                    fontFamily: 'inherit', maxHeight: '150px'
                  }} 
                />
                <button 
                  onClick={handleAsk} 
                  disabled={!askInput.trim() || askStreaming}
                  style={{ 
                    width: '32px', height: '32px', borderRadius: '6px', 
                    background: askInput.trim() && !askStreaming ? 'var(--primary-gradient)' : 'var(--surface-3)',
                    border: 'none', color: '#fff', display: 'flex', alignItems: 'center', 
                    justifyContent: 'center', cursor: askInput.trim() && !askStreaming ? 'pointer' : 'not-allowed',
                    transition: 'all 0.2s', flexShrink: 0
                  }}
                >
                  <Send size={15} />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Insights Tab */}
        {activeTab === 'insights' && (
          <div style={{ animation: 'fadeIn 0.3s ease' }}>
            {insightsLoading ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {[1,2,3,4].map(i => <div key={i} className="skeleton" style={{ height: '44px' }} />)}
              </div>
            ) : insightsData ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
                <InsightSection title="Key Entities">
                  {insightsData.keyPeople?.map((p, i) => (
                    <div key={i} style={{ 
                      padding: '10px 14px', background: 'var(--surface-2)', border: '1px solid var(--border)', 
                      borderRadius: 'var(--radius)', display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                    }}>
                      <span style={{ fontSize: '13.5px', fontWeight: 600, color: 'var(--text-1)' }}>{p.name}</span>
                      <span style={{ fontSize: '11.5px', color: 'var(--text-3)' }}>{p.role}</span>
                    </div>
                  ))}
                </InsightSection>
                
                <InsightSection title="Verified Facts">
                  {insightsData.keyFacts?.map((f, i) => (
                    <div key={i} style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
                      <CheckCircle size={14} color="var(--accent-green)" style={{ flexShrink: 0, marginTop: '2px' }} />
                      <span style={{ fontSize: '13.5px', color: 'var(--text-2)', lineHeight: '1.5' }}>{f}</span>
                    </div>
                  ))}
                </InsightSection>

                <InsightSection title="Related Topics">
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '7px' }}>
                    {insightsData.relatedTopics?.map((t, i) => (
                      <Link key={i} to={`/?q=${encodeURIComponent(t)}`} style={{ 
                        padding: '5px 12px', borderRadius: 'var(--radius-full)', background: 'var(--surface-2)', 
                        border: '1px solid var(--border)', color: 'var(--text-2)', fontSize: '11.5px',
                        textDecoration: 'none', transition: 'all 0.2s'
                      }}
                      onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--primary)'; e.currentTarget.style.color = 'var(--text-1)'; }}
                      onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text-2)'; }}>
                        {t}
                      </Link>
                    ))}
                  </div>
                </InsightSection>
              </div>
            ) : null}
          </div>
        )}

        {/* Verify/FactCheck Tab */}
        {activeTab === 'factcheck' && (
          <div style={{ animation: 'fadeIn 0.3s ease' }}>
            {factLoading ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div className="skeleton" style={{ height: '90px' }} />
                <div className="skeleton" style={{ height: '140px' }} />
              </div>
            ) : factData ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
                <div style={{ 
                  padding: '16px', 
                  background: 'var(--surface-2)',
                  border: '1px solid',
                  borderColor: factData.overallAssessment === 'high' ? 'var(--accent-green)' : 'var(--accent-warm)',
                  borderWidth: '0 0 0 3px',
                  borderRadius: 'var(--radius)'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                    <Shield size={14} color={factData.overallAssessment === 'high' ? 'var(--accent-green)' : 'var(--accent-warm)'} />
                    <span style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-1)' }}>
                      {factData.overallAssessment} Confidence
                    </span>
                  </div>
                  <p style={{ fontSize: '13.5px', color: 'var(--text-2)', lineHeight: '1.5', margin: 0 }}>
                    {factData.assessmentNote}
                  </p>
                </div>

                <div>
                  <h5 style={{ fontSize: '10px', fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '14px' }}>Claims Breakdown</h5>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {factData.claims?.map((c, i) => (
                      <div key={i} style={{ 
                        padding: '14px', background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 'var(--radius)' 
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                          <span style={{ 
                            fontSize: '9px', fontWeight: 700, textTransform: 'uppercase', 
                            color: c.status === 'verifiable' ? 'var(--accent-green)' : 'var(--accent-warm)',
                            background: 'rgba(255,255,255,0.03)', padding: '2px 6px', borderRadius: '4px'
                          }}>
                            {c.status}
                          </span>
                        </div>
                        <p style={{ fontSize: '13.5px', color: 'var(--text-1)', fontWeight: 500, marginBottom: '4px', lineHeight: '1.4' }}>"{c.claim}"</p>
                        <p style={{ fontSize: '12px', color: 'var(--text-3)', margin: 0, lineHeight: '1.4' }}>{c.note}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : null}
          </div>
        )}
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(4px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.3; }
        }
        .skeleton {
          background: linear-gradient(90deg, var(--surface-2) 25%, var(--surface-3) 50%, var(--surface-2) 75%);
          background-size: 200% 100%;
          animation: skeleton-loading 1.5s infinite;
          border-radius: var(--radius);
        }
        @keyframes skeleton-loading {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
      `}</style>
    </div>
  );
}

function InsightSection({ title, children }) {
  return (
    <div>
      <h5 style={{ fontSize: '10px', fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '14px' }}>{title}</h5>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {children}
      </div>
    </div>
  );
}
