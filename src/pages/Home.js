import React, { useState, useEffect, useCallback } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { fetchCombinedNews, getNewsCategories } from '../services/newsService';
import { getCustomNews, addToFavorites, removeFromFavorites, isArticleFavorited } from '../services/firebaseService';
import { Search, Bookmark, BookmarkCheck, ExternalLink, RefreshCw, TrendingUp, Clock, Newspaper } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

const CATEGORIES = getNewsCategories();

function stripHtml(html) {
  if (!html) return '';
  const doc = new DOMParser().parseFromString(html, 'text/html');
  return doc.body.textContent || '';
}

function SkeletonCard({ featured = false }) {
  return (
    <div style={{
      background: 'var(--surface)', border: '1px solid var(--border)',
      borderRadius: 'var(--radius-lg)', overflow: 'hidden',
    }}>
      <div className="skeleton" style={{ height: featured ? 280 : 180, borderRadius: 0 }} />
      <div style={{ padding: 20 }}>
        <div className="skeleton" style={{ height: 11, width: '30%', marginBottom: 12 }} />
        <div className="skeleton" style={{ height: featured ? 26 : 18, marginBottom: 8 }} />
        <div className="skeleton" style={{ height: featured ? 26 : 18, width: '85%', marginBottom: 12 }} />
        <div className="skeleton" style={{ height: 13, marginBottom: 6 }} />
        <div className="skeleton" style={{ height: 13, width: '60%' }} />
      </div>
    </div>
  );
}

function CategoryPill({ category, active, onClick }) {
  return (
    <button onClick={onClick} style={{
      padding: '7px 16px', borderRadius: 'var(--radius-full)',
      border: active ? '1px solid var(--primary)' : '1px solid var(--border)',
      background: active ? 'var(--primary-subtle)' : 'transparent',
      color: active ? 'var(--primary)' : 'var(--text-2)',
      fontSize: 13, fontWeight: active ? 600 : 400,
      cursor: 'pointer', transition: 'all 0.15s ease', whiteSpace: 'nowrap', flexShrink: 0,
    }}
      onMouseEnter={e => { if (!active) { e.currentTarget.style.background = 'var(--surface-hover)'; e.currentTarget.style.color = 'var(--text-1)'; } }}
      onMouseLeave={e => { if (!active) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-2)'; } }}
    >
      {category.name}
    </button>
  );
}

function FeaturedCard({ article, user, onFavoriteToggle, favorited }) {
  const [imgError, setImgError] = useState(false);
  const timeAgo = article.publishedAt ? formatDistanceToNow(new Date(article.publishedAt), { addSuffix: true }) : '';

  return (
    <div style={{
      position: 'relative', borderRadius: 'var(--radius-xl)', overflow: 'hidden',
      height: 460, background: 'var(--surface)', border: '1px solid var(--border)',
      transition: 'transform 0.3s ease, box-shadow 0.3s ease',
      display: 'flex', flexDirection: 'column', justifyContent: 'flex-end',
    }}
      onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = '0 20px 60px rgba(0,0,0,0.6)'; }}
      onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; }}
    >
      <Link to={`/news/${encodeURIComponent(article.id)}`} state={{ article }} style={{ position: 'absolute', inset: 0, zIndex: 1 }} />
      
      {!imgError && article.urlToImage && (
        <img src={article.urlToImage} alt={article.title} onError={() => setImgError(true)}
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
      )}
      {(imgError || !article.urlToImage) && (
        <div style={{
          position: 'absolute', inset: 0,
          background: 'linear-gradient(135deg, var(--surface-2), var(--surface-3))',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Newspaper size={64} style={{ color: 'var(--primary)', opacity: 0.2 }} />
        </div>
      )}
      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(7,10,20,0.97) 30%, rgba(7,10,20,0.2) 70%, transparent 100%)', pointerEvents: 'none' }} />
      
      <div style={{ position: 'relative', padding: '24px 28px 28px', zIndex: 2, pointerEvents: 'none' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
          <span style={{
            fontSize: 11, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase',
            color: 'var(--primary)', background: 'var(--primary-subtle)', padding: '3px 8px',
            borderRadius: 'var(--radius-full)', border: '1px solid var(--primary-border)',
          }}>
            {article.category || article.source?.name || 'News'}
          </span>
          {timeAgo && <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)' }}>· {timeAgo}</span>}
        </div>
        <h2 style={{
          fontFamily: 'Instrument Serif, serif', fontSize: 36, fontWeight: 400,
          lineHeight: 1.15, color: '#fff', marginBottom: 14, letterSpacing: '-0.6px',
        }}>
          {article.title}
        </h2>
        {article.description && (
          <p style={{
            fontSize: 15, color: 'rgba(255,255,255,0.7)', lineHeight: 1.6, marginBottom: 20,
            display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
            fontFamily: 'Plus Jakarta Sans, sans-serif'
          }}>
            {stripHtml(article.description)}
          </p>
        )}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', pointerEvents: 'auto' }}>
          <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)', fontWeight: 500 }}>
            {article.source?.name || 'The Guardian'}
          </span>
          {user && (
            <button onClick={e => { e.preventDefault(); e.stopPropagation(); onFavoriteToggle(article); }}
              style={{
                color: favorited ? 'var(--accent-warm)' : 'rgba(255,255,255,0.4)',
                padding: 6, borderRadius: 8, display: 'flex',
                background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.1)',
                cursor: 'pointer'
              }}>
              {favorited ? <BookmarkCheck size={15} /> : <Bookmark size={15} />}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function NewsCard({ article, user, onFavoriteToggle, favorited, index }) {
  const [imgError, setImgError] = useState(false);
  const timeAgo = article.publishedAt ? formatDistanceToNow(new Date(article.publishedAt), { addSuffix: true }) : '';

  const isInternal = article.apiSource === 'guardian' || article.isCustom;
  const cardUrl = isInternal ? `/news/${encodeURIComponent(article.id)}` : article.url;

  return (
    <div style={{
      background: 'var(--surface)', border: '1px solid var(--border)',
      borderRadius: 'var(--radius-lg)', overflow: 'hidden',
      transition: 'all 0.2s ease', animation: `fadeUp 0.4s ease ${Math.min(index, 8) * 0.04}s both`,
      height: '100%', display: 'flex', flexDirection: 'column',
    }}
      onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.borderColor = 'var(--primary-border)'; e.currentTarget.style.boxShadow = '0 8px 30px rgba(0,0,0,0.4)'; }}
      onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.boxShadow = 'none'; }}
    >
      {isInternal ? (
        <Link to={cardUrl} state={{ article }} style={{ display: 'block', textDecoration: 'none', color: 'inherit', flex: 1, display: 'flex', flexDirection: 'column' }}>
          <div style={{ height: 180, overflow: 'hidden', flexShrink: 0, position: 'relative' }}>
            {!imgError && article.urlToImage ? (
              <img src={article.urlToImage} alt={article.title} onError={() => setImgError(true)}
                style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.4s ease' }}
                onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.05)'}
                onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'} />
            ) : (
              <div style={{ width: '100%', height: '100%', background: 'var(--surface-2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Newspaper size={28} style={{ color: 'var(--text-3)', opacity: 0.3 }} />
              </div>
            )}
            {article.isCustom && (
              <div style={{
                position: 'absolute', top: 10, left: 10, fontSize: 10, fontWeight: 700,
                letterSpacing: '0.08em', textTransform: 'uppercase', color: '#fff',
                background: 'var(--primary-gradient)', padding: '3px 8px', borderRadius: 'var(--radius-full)',
              }}>Custom</div>
            )}
            {article.apiSource === 'neurafeed' && (
              <div style={{
                position: 'absolute', top: 10, left: 10, fontSize: 10, fontWeight: 700,
                letterSpacing: '0.08em', textTransform: 'uppercase', color: '#fff',
                background: 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)', padding: '3px 8px', borderRadius: 'var(--radius-full)',
                boxShadow: '0 2px 10px rgba(99, 102, 241, 0.4)'
              }}>NeuraFeed</div>
            )}
          </div>

          <div style={{ padding: '15px 16px 16px', display: 'flex', flexDirection: 'column', flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
              <span style={{ fontSize: 10.5, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--primary)' }}>
                {article.source?.name || article.category || ''}
              </span>
              {timeAgo && (
                <span style={{ fontSize: 11, color: 'var(--text-3)', display: 'flex', alignItems: 'center', gap: 3 }}>
                  <span style={{ opacity: 0.5 }}>·</span><Clock size={10} />{timeAgo}
                </span>
              )}
            </div>

            <h3 style={{
              fontFamily: 'Instrument Serif, serif', fontSize: 20, fontWeight: 400,
              lineHeight: 1.35, color: 'var(--text-1)', marginBottom: 10, letterSpacing: '-0.2px',
              display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden', flex: 1,
            }}>
              {article.title}
            </h3>

            {article.description && (
              <p style={{
                fontSize: 13.5, color: 'var(--text-2)', lineHeight: 1.55, marginBottom: 12,
                display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
              }}>
                {stripHtml(article.description)}
              </p>
            )}
          </div>
        </Link>
      ) : (
        <a href={cardUrl} target="_blank" rel="noopener noreferrer" style={{ display: 'block', textDecoration: 'none', color: 'inherit', flex: 1, display: 'flex', flexDirection: 'column' }}>
          <div style={{ height: 180, overflow: 'hidden', flexShrink: 0, position: 'relative' }}>
            {!imgError && article.urlToImage ? (
              <img src={article.urlToImage} alt={article.title} onError={() => setImgError(true)}
                style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.4s ease' }}
                onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.05)'}
                onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'} />
            ) : (
              <div style={{ width: '100%', height: '100%', background: 'var(--surface-2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Newspaper size={28} style={{ color: 'var(--text-3)', opacity: 0.3 }} />
              </div>
            )}
            <div style={{
              position: 'absolute', top: 10, right: 10, fontSize: 10, fontWeight: 700,
              letterSpacing: '0.08em', textTransform: 'uppercase', color: '#fff',
              background: 'rgba(0,0,0,0.5)', padding: '3px 8px', borderRadius: 'var(--radius-full)',
              backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', gap: 4
            }}>
              <ExternalLink size={10} />
              Source
            </div>
          </div>

          <div style={{ padding: '15px 16px 16px', display: 'flex', flexDirection: 'column', flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
              <span style={{ fontSize: 10.5, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--primary)' }}>
                {article.source?.name || article.category || ''}
              </span>
              {timeAgo && (
                <span style={{ fontSize: 11, color: 'var(--text-3)', display: 'flex', alignItems: 'center', gap: 3 }}>
                  <span style={{ opacity: 0.5 }}>·</span><Clock size={10} />{timeAgo}
                </span>
              )}
            </div>

            <h3 style={{
              fontFamily: 'Instrument Serif, serif', fontSize: 20, fontWeight: 400,
              lineHeight: 1.35, color: 'var(--text-1)', marginBottom: 10, letterSpacing: '-0.2px',
              display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden', flex: 1,
            }}>
              {article.title}
            </h3>

            {article.description && (
              <p style={{
                fontSize: 13.5, color: 'var(--text-2)', lineHeight: 1.55, marginBottom: 12,
                display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
              }}>
                {stripHtml(article.description)}
              </p>
            )}
          </div>
        </a>
      )}

      <div style={{ padding: '0 16px 16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: 10, borderTop: '1px solid var(--border)' }}>
          <span style={{ fontSize: 11.5, color: 'var(--text-3)', fontWeight: 500 }}>
            {article.source?.name || 'The Guardian'}
          </span>
          <div style={{ display: 'flex', gap: 4 }}>
            {user && (
              <button onClick={e => { e.preventDefault(); e.stopPropagation(); onFavoriteToggle(article); }}
                style={{ color: favorited ? 'var(--accent-warm)' : 'var(--text-3)', padding: 5, borderRadius: 6, display: 'flex', transition: 'color 0.15s', background: 'transparent', border: 'none', cursor: 'pointer' }}
                onMouseEnter={e => { if (!favorited) e.currentTarget.style.color = 'var(--text-1)'; }}
                onMouseLeave={e => { if (!favorited) e.currentTarget.style.color = 'var(--text-3)'; }}
              >
                {favorited ? <BookmarkCheck size={14} /> : <Bookmark size={14} />}
              </button>
            )}
            {article.url && (
              <a href={article.url} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()}
                style={{ color: 'var(--text-3)', padding: 5, borderRadius: 6, display: 'flex', transition: 'color 0.15s' }}
                onMouseEnter={e => e.currentTarget.style.color = 'var(--text-1)'}
                onMouseLeave={e => e.currentTarget.style.color = 'var(--text-3)'}
              >
                <ExternalLink size={12} />
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Home({ user, onOpenAuth, onMenuOpen }) {
  const [searchParams, setSearchParams] = useSearchParams();
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState('');
  const [query, setQuery] = useState(searchParams.get('q') || '');
  const [inputVal, setInputVal] = useState(searchParams.get('q') || '');
  const [category, setCategory] = useState(searchParams.get('cat') || 'all');
  const [favorites, setFavorites] = useState({});

  const loadArticles = useCallback(async (reset = false, pg = 1) => {
    reset ? setLoading(true) : setLoadingMore(true);
    setError('');
    try {
      const [newsResult, customRaw] = await Promise.all([
        fetchCombinedNews({ query, category, pageSize: 18, page: pg }),
        pg === 1 ? getCustomNews().catch(() => []) : Promise.resolve([]),
      ]);
      const custom = (customRaw || []).map(a => ({
        ...a, urlToImage: a.imageUrl || a.urlToImage || null,
        source: { name: a.source || 'Echo News' }, isCustom: true,
      }));
      const fresh = newsResult.articles || [];
      const combined = pg === 1 ? [...custom, ...fresh] : fresh;
      setArticles(prev => pg === 1 ? combined : [...prev, ...combined]);
      setHasMore(fresh.length >= 18);
      setPage(pg + 1);
    } catch {
      setError('Failed to load news. Please try again.');
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [query, category]);

  useEffect(() => { loadArticles(true, 1); }, [query, category]);

  useEffect(() => {
    if (!user || !articles.length) return;
    (async () => {
      const fids = {};
      for (const a of articles.slice(0, 30)) {
        try { if (await isArticleFavorited(user.uid, a.id)) fids[a.id] = true; } catch { }
      }
      setFavorites(fids);
    })();
  }, [user, articles.length]);

  const handleSearch = e => {
    e.preventDefault();
    const q = inputVal.trim();
    setQuery(q);
    setSearchParams({ q, cat: category });
  };

  const handleCategory = cat => {
    setCategory(cat);
    setSearchParams({ q: query, cat });
  };

  const handleFavorite = async (article) => {
    if (!user) { onOpenAuth('signin'); return; }
    const was = favorites[article.id];
    setFavorites(p => ({ ...p, [article.id]: !was }));
    try {
      if (was) await removeFromFavorites(user.uid, article.id);
      else await addToFavorites(user.uid, article);
    } catch {
      setFavorites(p => ({ ...p, [article.id]: was }));
    }
  };

  const [featured, ...rest] = articles;

  return (
    <div style={{ minHeight: '100vh' }}>
      {/* Top section */}
      <div style={{
        padding: '28px 32px 0',
        background: 'linear-gradient(180deg, var(--surface) 0%, transparent 100%)',
        borderBottom: '1px solid var(--border)',
      }}>
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 20, marginBottom: 20, flexWrap: 'wrap' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
              <TrendingUp size={14} style={{ color: 'var(--primary)' }} />
              <span style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.09em', textTransform: 'uppercase', color: 'var(--primary)' }}>
                {category === 'all' ? 'Top Stories' : CATEGORIES.find(c => c.id === category)?.name || category}
              </span>
            </div>
            <h1 style={{
              fontFamily: 'Instrument Serif, serif', fontSize: 36,
              fontWeight: 400, color: 'var(--text-1)', letterSpacing: '-0.5px', lineHeight: 1.15,
            }}>
              {query ? `"${query}"` : "Today's News"}
            </h1>
          </div>

          <form onSubmit={handleSearch} style={{ flexShrink: 0 }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 8,
            background: 'var(--surface-2)', border: '1px solid var(--border-strong)',
            borderRadius: 'var(--radius-full)', padding: '7px 7px 7px 14px', transition: 'border-color 0.15s',
            minWidth: 280,
          }}
            onFocusCapture={e => e.currentTarget.style.borderColor = 'var(--border-focus)'}
            onBlurCapture={e => e.currentTarget.style.borderColor = 'var(--border-strong)'}
          >
            <Search size={15} style={{ color: 'var(--text-3)', flexShrink: 0 }} />
            <input value={inputVal} onChange={e => setInputVal(e.target.value)}
              placeholder='Try "AI" or "source:BBC" or "cat:tech"'
              style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', color: 'var(--text-1)', fontSize: 14, minWidth: 0 }} />
            {inputVal && <button type="button" onClick={() => { setInputVal(''); setQuery(''); setSearchParams({ cat: category }); }}
              style={{ fontSize: 11, color: 'var(--text-3)', padding: '3px 8px' }}>Clear</button>}
            <button type="submit" style={{
              padding: '6px 14px', borderRadius: 'var(--radius-full)',
              background: 'var(--primary-gradient)', color: '#fff', fontSize: 13, fontWeight: 500, flexShrink: 0,
            }}>Search</button>
          </div>
          </form>
        </div>

        <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 14, scrollbarWidth: 'none' }}>
          {CATEGORIES.map(cat => (
            <CategoryPill key={cat.id} category={cat} active={category === cat.id} onClick={() => handleCategory(cat.id)} />
          ))}
        </div>
      </div>

      {/* Articles */}
      <div style={{ padding: '24px 32px 48px' }}>
        {error && (
          <div style={{
            padding: '12px 16px', borderRadius: 'var(--radius)', marginBottom: 20,
            background: 'rgba(255,107,107,0.08)', border: '1px solid rgba(255,107,107,0.2)',
            color: 'var(--accent)', fontSize: 14, display: 'flex', alignItems: 'center', gap: 10,
          }}>
            {error}
            <button onClick={() => loadArticles(true, 1)} style={{ marginLeft: 'auto', display: 'flex', gap: 6, alignItems: 'center', fontSize: 13, color: 'var(--accent)' }}>
              <RefreshCw size={12} /> Retry
            </button>
          </div>
        )}

        {loading ? (
          <div>
            <SkeletonCard featured />
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(290px, 1fr))', gap: 18, marginTop: 20 }}>
              {[1,2,3,4,5,6].map(i => <SkeletonCard key={i} />)}
            </div>
          </div>
        ) : articles.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '80px 20px' }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>🔍</div>
            <h3 style={{ fontFamily: 'Instrument Serif, serif', fontSize: 24, fontWeight: 400, color: 'var(--text-1)', marginBottom: 8 }}>No results found</h3>
            <p style={{ color: 'var(--text-2)', fontSize: 15 }}>Try a different search or category.</p>
          </div>
        ) : (
          <>
            {featured && (
              <div style={{ marginBottom: 24 }}>
                <FeaturedCard article={featured} user={user} onFavoriteToggle={handleFavorite} favorited={!!favorites[featured.id]} />
              </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(290px, 1fr))', gap: 18 }}>
              {rest.map((a, i) => (
                <NewsCard key={`${a.id}-${a.source?.name || 'news'}-${i}`} article={a} user={user} onFavoriteToggle={handleFavorite} favorited={!!favorites[a.id]} index={i} />
              ))}
            </div>

            {hasMore && (
              <div style={{ display: 'flex', justifyContent: 'center', marginTop: 36 }}>
                <button onClick={() => loadArticles(false, page)} disabled={loadingMore}
                  style={{
                    padding: '11px 28px', borderRadius: 'var(--radius-full)',
                    background: 'var(--surface-2)', border: '1px solid var(--border-strong)',
                    color: 'var(--text-1)', fontSize: 14, fontWeight: 500,
                    cursor: loadingMore ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: 8,
                  }}
                  onMouseEnter={e => { if (!loadingMore) e.currentTarget.style.background = 'var(--surface-3)'; }}
                  onMouseLeave={e => e.currentTarget.style.background = 'var(--surface-2)'}
                >
                  {loadingMore ? (
                    <><div style={{ width: 13, height: 13, border: '2px solid var(--text-3)', borderTopColor: 'var(--primary)', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />Loading…</>
                  ) : 'Load more stories'}
                </button>
              </div>
            )}
          </>
        )}
      </div>

      <style>{`
        @media (max-width: 768px) {
          [data-page="home"] { padding-top: 56px; }
        }
      `}</style>
    </div>
  );
}
