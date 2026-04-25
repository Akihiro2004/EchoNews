import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useLocation, useNavigate, Link } from 'react-router-dom';
import { addToFavorites, removeFromFavorites, isArticleFavorited, addToReadingHistory } from '../services/firebaseService';
import { fetchArticleById } from '../services/newsService';
import AIPanel from '../components/AIPanel';
import { useUI } from '../App';
import {
  ArrowLeft, Bookmark, BookmarkCheck, ExternalLink, Share2,
  MessageCircle, Shield, Lightbulb, ChevronRight,
  Send, Bot, X, AlertCircle, CheckCircle, Info, Eye,
  TrendingUp, Clock, FileText
} from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';



export default function NewsDetail({ user, onOpenAuth, onMenuOpen }) {
  const { articleId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const [article, setArticle] = useState(location.state?.article || null);
  const [loading, setLoading] = useState(!article);
  const [favorited, setFavorited] = useState(false);
  const [aiOpen, setAiOpen] = useState(false);
  const { setCurrentArticle } = useUI();

  useEffect(() => {
    (async () => {
      if (!article) {
        setLoading(true);
        // 1. Try local cache
        const cached = JSON.parse(localStorage.getItem('newsArticles') || '[]');
        const customCached = JSON.parse(localStorage.getItem('customNews') || '[]');
        const all = [...cached, ...customCached];
        const found = all.find(a => a.id === decodeURIComponent(articleId));
        
        if (found) {
          setArticle(found);
          setLoading(false);
        } else {
          // 2. Fetch from API
          try {
            const fetched = await fetchArticleById(decodeURIComponent(articleId));
            if (fetched) setArticle(fetched);
          } catch (err) {
            console.error('Failed to fetch article:', err);
          } finally {
            setLoading(false);
          }
        }
      }
    })();
  }, [articleId, article]);

  useEffect(() => {
    if (article) {
      setCurrentArticle(article);
      if (user) {
        addToReadingHistory(user.uid, article).catch(() => {});
        isArticleFavorited(user.uid, article.id).then(setFavorited).catch(() => {});
      }
    }
    return () => setCurrentArticle(null);
  }, [article, user]);

  const handleFavorite = async () => {
    if (!user) { onOpenAuth('signin'); return; }
    const was = favorited;
    setFavorited(!was);
    try {
      if (was) await removeFromFavorites(user.uid, article.id);
      else await addToFavorites(user.uid, article);
    } catch { setFavorited(was); }
  };

  const handleShare = async () => {
    try {
      await navigator.share({ title: article.title, url: window.location.href });
    } catch {
      navigator.clipboard.writeText(window.location.href).catch(() => {});
    }
  };

  if (loading) {
    return (
      <div style={{ padding: '80px 40px', maxWidth: 860, margin: '0 auto' }}>
        <div className="skeleton" style={{ height: 20, width: 120, marginBottom: 32 }} />
        <div className="skeleton" style={{ height: 360, borderRadius: 'var(--radius-xl)', marginBottom: 28 }} />
        <div className="skeleton" style={{ height: 40, marginBottom: 12 }} />
        <div className="skeleton" style={{ height: 40, width: '80%', marginBottom: 24 }} />
        {[1,2,3,4].map(i => <div key={i} className="skeleton" style={{ height: 18, marginBottom: 10, width: i % 2 === 0 ? '90%' : '100%' }} />)}
      </div>
    );
  }

  if (!article) {
    return (
      <div style={{ textAlign: 'center', padding: '120px 32px' }}>
        <h2 style={{ fontFamily: 'Instrument Serif, serif', fontSize: 28, fontWeight: 400, color: 'var(--text-1)', marginBottom: 12 }}>Article not found</h2>
        <p style={{ color: 'var(--text-2)', marginBottom: 24 }}>This article may have been removed or is no longer available.</p>
        <button onClick={() => navigate('/')} style={{ padding: '10px 24px', borderRadius: 'var(--radius-full)', background: 'var(--primary-gradient)', color: '#fff', fontSize: 14, fontWeight: 500 }}>
          Back to Home
        </button>
      </div>
    );
  }

  const publishDate = article.publishedAt ? format(new Date(article.publishedAt), 'MMMM d, yyyy') : '';
  const timeAgo = article.publishedAt ? formatDistanceToNow(new Date(article.publishedAt), { addSuffix: true }) : '';

  return (
    <div style={{ minHeight: '100vh', display: 'flex', background: 'var(--bg)' }}>
      {/* Article */}
      <article style={{ 
        flex: 1, 
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        overflowX: 'hidden'
      }}>
        <div style={{ maxWidth: 860, margin: '0 auto', padding: '28px 40px 64px' }}>
          {/* Nav row */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28 }}>
            <button onClick={() => navigate(-1)} style={{
              display: 'flex', alignItems: 'center', gap: 7, color: 'var(--text-2)', fontSize: 14,
              padding: '7px 12px', borderRadius: 'var(--radius)', background: 'var(--surface)',
              border: '1px solid var(--border)', transition: 'all 0.15s',
            }}
              onMouseEnter={e => { e.currentTarget.style.background = 'var(--surface-2)'; e.currentTarget.style.color = 'var(--text-1)'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'var(--surface)'; e.currentTarget.style.color = 'var(--text-2)'; }}
            >
              <ArrowLeft size={14} /> Back
            </button>

            <div style={{ display: 'flex', gap: 8 }}>
              <ActionBtn icon={favorited ? BookmarkCheck : Bookmark} onClick={handleFavorite} active={favorited} activeColor="var(--accent-warm)" title={favorited ? 'Unsave' : 'Save'} />
              {article.url && <a href={article.url} target="_blank" rel="noopener noreferrer"><ActionBtn icon={ExternalLink} title="Open original" /></a>}
              <ActionBtn icon={Share2} onClick={handleShare} title="Share" />
              <button
                onClick={() => setAiOpen(!aiOpen)}
                title="AI Analysis"
                style={{
                  display: 'flex', alignItems: 'center', gap: 6, padding: '7px 12px',
                  borderRadius: 'var(--radius)', cursor: 'pointer', fontSize: 13, fontWeight: 500,
                  background: aiOpen ? 'var(--primary-gradient)' : 'var(--primary-subtle)',
                  border: '1px solid var(--primary-border)', color: aiOpen ? '#fff' : 'var(--primary)',
                  transition: 'all 0.15s',
                }}
              >
                <Bot size={14} />
                <span className="ai-btn-label">AI Analysis</span>
              </button>
            </div>
          </div>

          {/* Category + source */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
            {article.category && (
              <span style={{
                fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase',
                color: 'var(--primary)', background: 'var(--primary-subtle)',
                padding: '4px 10px', borderRadius: 'var(--radius-full)', border: '1px solid var(--primary-border)',
              }}>
                {article.category}
              </span>
            )}
            <span style={{ fontSize: 12, color: 'var(--text-3)' }}>
              {article.source?.name || 'The Guardian'}
            </span>
            {timeAgo && <span style={{ fontSize: 12, color: 'var(--text-3)' }}>· {timeAgo}</span>}
          </div>

          {/* Title */}
          <h1 style={{
            fontFamily: 'Instrument Serif, serif',
            fontSize: 36,
            fontWeight: 400,
            lineHeight: 1.25,
            color: 'var(--text-1)',
            marginBottom: 18,
            letterSpacing: '-0.5px',
          }}>
            {article.title}
          </h1>

          {/* Meta */}
          {(article.author || publishDate) && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24, paddingBottom: 18, borderBottom: '1px solid var(--border)' }}>
              {article.author && (
                <span style={{ fontSize: 13, color: 'var(--text-2)', fontWeight: 500 }}>
                  By {article.author}
                </span>
              )}
              {publishDate && (
                <span style={{ fontSize: 13, color: 'var(--text-3)', display: 'flex', alignItems: 'center', gap: 4 }}>
                  <Clock size={12} /> {publishDate}
                </span>
              )}
            </div>
          )}

          {/* Hero Image */}
          {article.urlToImage && (
            <div style={{ borderRadius: 'var(--radius-xl)', overflow: 'hidden', marginBottom: 28, maxHeight: 440 }}>
              <img src={article.urlToImage} alt={article.title}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                onError={e => e.currentTarget.parentElement.style.display = 'none'} />
            </div>
          )}

          {/* Description / Lead */}
          {article.description && (
            <p style={{
              fontSize: 19, lineHeight: 1.6, color: 'var(--text-2)', marginBottom: 24,
              fontFamily: 'Instrument Serif, serif', fontStyle: 'italic',
              borderLeft: '3px solid var(--primary)', paddingLeft: 18,
            }}>
              {article.description}
            </p>
          )}

          {/* Why It Matters (NeuraFeed specific) */}
          {article.whyItMatters && (
            <div style={{
              padding: '20px 24px', 
              background: 'var(--surface-2)', 
              borderRadius: 'var(--radius)', 
              border: '1px solid var(--primary-border)',
              marginBottom: 32,
              boxShadow: '0 4px 20px rgba(0,0,0,0.1)'
            }}>
              <h4 style={{ 
                fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', 
                letterSpacing: '0.1em', color: 'var(--primary)', marginBottom: '12px',
                display: 'flex', alignItems: 'center', gap: '8px'
              }}>
                <TrendingUp size={14} /> Why It Matters
              </h4>
              <p style={{ fontSize: '15px', lineHeight: '1.6', color: 'var(--text-1)', margin: 0 }}>
                {article.whyItMatters}
              </p>
            </div>
          )}

          {/* Body */}
          {article.content ? (
            article.contentIsHtml ? (
              <>
                <div
                  className="article-body"
                  dangerouslySetInnerHTML={{ __html: article.content }}
                />
                <style>{`
                  .article-body {
                    font-size: 18px;
                    line-height: 1.85;
                    color: var(--text-2);
                    letter-spacing: -0.003em;
                  }
                  .article-body p {
                    margin-bottom: 24px;
                  }
                  .article-body h2 {
                    font-family: 'Instrument Serif', Georgia, serif;
                    font-size: 28px;
                    font-weight: 400;
                    color: var(--text-1);
                    margin: 40px 0 16px;
                    line-height: 1.25;
                    letter-spacing: -0.5px;
                  }
                  .article-body h3 {
                    font-family: 'Instrument Serif', Georgia, serif;
                    font-size: 22px;
                    font-weight: 400;
                    color: var(--text-1);
                    margin: 32px 0 14px;
                    line-height: 1.3;
                  }
                  .article-body a {
                    color: var(--primary);
                    text-decoration: none;
                    border-bottom: 1px solid var(--primary-border);
                    padding-bottom: 1px;
                    transition: all 0.2s;
                  }
                  .article-body a:hover { 
                    color: var(--primary-dark);
                    border-bottom-color: var(--primary);
                  }
                  .article-body strong, .article-body b {
                    color: var(--text-1);
                    font-weight: 600;
                  }
                  .article-body em, .article-body i {
                    font-style: italic;
                    color: var(--text-1);
                  }
                  .article-body ul, .article-body ol {
                    padding-left: 28px;
                    margin-bottom: 24px;
                    color: var(--text-2);
                  }
                  .article-body li {
                    margin-bottom: 12px;
                    line-height: 1.7;
                  }
                  .article-body blockquote {
                    border-left: 4px solid var(--primary);
                    margin: 32px 0;
                    padding: 8px 0 8px 24px;
                    font-family: 'Instrument Serif', Georgia, serif;
                    font-size: 22px;
                    font-style: italic;
                    color: var(--text-1);
                    line-height: 1.5;
                    background: var(--primary-subtle);
                    border-top-right-radius: var(--radius);
                    border-bottom-right-radius: var(--radius);
                  }
                  .article-body figure {
                    margin: 32px 0;
                  }
                  .article-body figure img {
                    width: 100%;
                    border-radius: var(--radius-xl);
                    object-fit: cover;
                    box-shadow: var(--shadow-lg);
                  }
                  .article-body figcaption {
                    font-size: 13px;
                    color: var(--text-3);
                    margin-top: 12px;
                    text-align: center;
                    font-style: italic;
                  }
                  .article-body hr {
                    border: none;
                    border-top: 1px solid var(--border);
                    margin: 40px 0;
                  }
                  .article-body aside, .article-body .element-rich-link,
                  .article-body .element-tweet, .article-body .element-interactive {
                    display: none;
                  }
                `}</style>
              </>
            ) : (
              <div style={{ fontSize: 17, lineHeight: 1.8, color: 'var(--text-2)', letterSpacing: '0.01em' }}>
                {article.content.split('\n').map((p, i) => (
                  p.trim() ? <p key={i} style={{ marginBottom: 20 }}>{p}</p> : <div key={i} style={{ height: 8 }} />
                ))}
              </div>
            )
          ) : (
            <div style={{ textAlign: 'center', padding: '32px', background: 'var(--surface-2)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)' }}>
              <p style={{ color: 'var(--text-2)', fontSize: 15, marginBottom: 14 }}>
                Full article available at the original source.
              </p>
              {article.url && (
                <a href={article.url} target="_blank" rel="noopener noreferrer"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 7, padding: '9px 20px', borderRadius: 'var(--radius-full)', background: 'var(--primary-gradient)', color: '#fff', fontSize: 14, fontWeight: 500 }}>
                  Read full article <ExternalLink size={13} />
                </a>
              )}
            </div>
          )}

          {/* NeuraFeed Sources */}
          {article.sources && article.sources.length > 0 && (
            <div style={{ marginTop: 48, paddingTop: 32, borderTop: '1px solid var(--border)' }}>
              <h4 style={{ 
                fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', 
                letterSpacing: '0.1em', color: 'var(--text-3)', marginBottom: '20px',
                display: 'flex', alignItems: 'center', gap: '8px'
              }}>
                <FileText size={14} /> References & Sources
              </h4>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '14px' }}>
                {article.sources.map((src, i) => (
                  <li key={i} style={{ fontSize: '14px', color: 'var(--text-2)', display: 'flex', gap: '10px', lineHeight: '1.5' }}>
                    <span style={{ color: 'var(--primary)', fontWeight: 600, minWidth: '24px', fontFamily: 'monospace' }}>
                      {src.num ? `[${src.num}]` : '•'}
                    </span>
                    {src.url ? (
                      <a href={src.url} target="_blank" rel="noopener noreferrer" 
                        style={{ color: 'var(--text-1)', textDecoration: 'none', borderBottom: '1px solid rgba(217, 119, 87, 0.2)', transition: 'all 0.2s' }}
                        onMouseEnter={e => { e.currentTarget.style.color = 'var(--primary)'; e.currentTarget.style.borderBottomColor = 'var(--primary)'; }}
                        onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-1)'; e.currentTarget.style.borderBottomColor = 'rgba(217, 119, 87, 0.2)'; }}>
                        {src.name}
                      </a>
                    ) : (
                      <span>{src.name}</span>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )}
          <div style={{ marginTop: 32, display: 'flex', justifyContent: 'center' }} className="mobile-ai-btn">
            <button onClick={() => setAiOpen(true)}
              style={{
                display: 'flex', alignItems: 'center', gap: 8, padding: '12px 24px',
                borderRadius: 'var(--radius-full)', background: 'var(--primary-gradient)',
                color: '#fff', fontSize: 14, fontWeight: 500, boxShadow: 'var(--shadow-primary)',
              }}>
              <Bot size={16} /> Analyze with AI
            </button>
          </div>
        </div>
      </article>

      {/* AI Sidebar */}
      {aiOpen && (
        <aside style={{
          width: 440,
          maxWidth: '40vw',
          flexShrink: 0,
          position: 'sticky',
          top: 0,
          height: '100vh',
          zIndex: 100,
          background: 'var(--surface)',
          animation: 'slideInRight 0.35s cubic-bezier(0.16, 1, 0.3, 1)',
          borderLeft: '1px solid var(--border)'
        }} className="ai-sidebar">
          <AIPanel 
            article={article} 
            user={user} 
            onClose={() => setAiOpen(false)} 
          />
        </aside>
      )}

      <style>{`
        @keyframes slideInRight { 
          from { transform: translateX(100%); opacity: 0; } 
          to { transform: translateX(0); opacity: 1; } 
        }
        @media (max-width: 1024px) {
          .ai-sidebar {
            position: fixed;
            right: 0;
            top: 0;
            bottom: 0;
            width: 85vw;
            max-width: 400px;
            box-shadow: -10px 0 30px rgba(0,0,0,0.5);
          }
        }
        @media (max-width: 900px) {
          .ai-btn-label { display: none; }
        }
      `}</style>
    </div>
  );
}

function ActionBtn({ icon: Icon, onClick, active, activeColor, title }) {
  return (
    <button onClick={onClick} title={title}
      style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        width: 36, height: 36, borderRadius: 'var(--radius)', cursor: 'pointer',
        background: active ? `${activeColor}15` || 'var(--surface-2)' : 'var(--surface)',
        border: `1px solid ${active ? activeColor || 'var(--border)' : 'var(--border)'}44`,
        color: active ? activeColor || 'var(--text-1)' : 'var(--text-2)',
        transition: 'all 0.15s',
      }}
      onMouseEnter={e => { e.currentTarget.style.background = 'var(--surface-2)'; e.currentTarget.style.color = 'var(--text-1)'; }}
      onMouseLeave={e => {
        e.currentTarget.style.background = active ? `${activeColor}15` : 'var(--surface)';
        e.currentTarget.style.color = active ? activeColor || 'var(--text-1)' : 'var(--text-2)';
      }}
    >
      <Icon size={15} />
    </button>
  );
}
