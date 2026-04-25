import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getUserProfile, getUserReadingHistory } from '../services/firebaseService';
import { fetchCombinedNews } from '../services/newsService';
import { getPersonalizedRecommendations, generateNewsSummary } from '../services/aiService';
import { TrendingUp, BookOpen, RefreshCw, Clock, Newspaper } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

function SkeletonCard() {
  return (
    <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}>
      <div className="skeleton" style={{ height: 160, borderRadius: 0 }} />
      <div style={{ padding: 16 }}>
        <div className="skeleton" style={{ height: 11, width: '30%', marginBottom: 10 }} />
        <div className="skeleton" style={{ height: 17, marginBottom: 8 }} />
        <div className="skeleton" style={{ height: 17, width: '75%' }} />
      </div>
    </div>
  );
}

function ArticleCard({ article, index }) {
  const [imgError, setImgError] = useState(false);
  const timeAgo = article.publishedAt ? formatDistanceToNow(new Date(article.publishedAt), { addSuffix: true }) : '';

  return (
    <Link to={`/news/${encodeURIComponent(article.id)}`} state={{ article }} style={{ display: 'block' }}>
      <div style={{
        background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)',
        overflow: 'hidden', cursor: 'pointer', transition: 'all 0.2s ease',
        animation: `fadeUp 0.4s ease ${Math.min(index, 8) * 0.05}s both`,
        display: 'flex', flexDirection: 'column',
      }}
        onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.borderColor = 'var(--primary-border)'; e.currentTarget.style.boxShadow = '0 8px 30px rgba(0,0,0,0.4)'; }}
        onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.boxShadow = 'none'; }}
      >
        <div style={{ height: 160, overflow: 'hidden', flexShrink: 0 }}>
          {!imgError && article.urlToImage ? (
            <img src={article.urlToImage} alt={article.title} onError={() => setImgError(true)}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          ) : (
            <div style={{ width: '100%', height: '100%', background: 'var(--surface-2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Newspaper size={24} style={{ color: 'var(--text-3)', opacity: 0.3 }} />
            </div>
          )}
        </div>
        <div style={{ padding: '14px 15px 15px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 7 }}>
            <span style={{ fontSize: 10.5, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--primary)' }}>
              {article.category || article.source?.name || ''}
            </span>
            {timeAgo && <span style={{ fontSize: 11, color: 'var(--text-3)', display: 'flex', alignItems: 'center', gap: 2 }}>
              <span style={{ opacity: 0.4 }}>·</span><Clock size={9} />{timeAgo}
            </span>}
          </div>
          <h3 style={{
            fontFamily: 'Instrument Serif, serif', fontSize: 16, fontWeight: 400, lineHeight: 1.4,
            color: 'var(--text-1)', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden',
          }}>
            {article.title}
          </h3>
        </div>
      </div>
    </Link>
  );
}

export default function ForYou({ user, onMenuOpen }) {
  const [profile, setProfile] = useState(null);
  const [recommendations, setRecommendations] = useState([]);
  const [articles, setArticles] = useState([]);
  const [trendSummary, setTrendSummary] = useState('');
  const [loading, setLoading] = useState(true);
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const load = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      const [prof, history] = await Promise.all([
        getUserProfile(user.uid).catch(() => null),
        getUserReadingHistory(user.uid, 20).catch(() => []),
      ]);
      setProfile(prof);

      const cats = prof?.preferences?.categories;
      const primaryCat = cats?.length > 0 ? cats[0] : 'general';
      const prefs = cats?.length > 0
        ? prof.preferences
        : { categories: ['general', 'technology', 'business'] };

      const newsResult = await fetchCombinedNews({ category: primaryCat, pageSize: 12 }).catch(() => ({ articles: [] }));
      const fetchedArticles = newsResult.articles || [];
      setArticles(fetchedArticles);

      getPersonalizedRecommendations(prefs, history)
        .then(recs => setRecommendations(recs || []))
        .catch(() => setRecommendations([]));

      if (fetchedArticles.length > 0) {
        setSummaryLoading(true);
        generateNewsSummary(fetchedArticles.slice(0, 6))
          .then(s => setTrendSummary(s))
          .catch(() => {})
          .finally(() => setSummaryLoading(false));
      }

    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { load(); }, [user.uid]);

  return (
    <div style={{ minHeight: '100vh' }}>
      {/* Header */}
      <div style={{ padding: '28px 32px 0', borderBottom: '1px solid var(--border)', background: 'linear-gradient(180deg, var(--surface) 0%, transparent 100%)' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 20 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
              <TrendingUp size={14} style={{ color: 'var(--primary)' }} />
              <span style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.09em', textTransform: 'uppercase', color: 'var(--primary)' }}>Personalized</span>
            </div>
            <h1 style={{ fontFamily: 'Instrument Serif, serif', fontSize: 34, fontWeight: 400, color: 'var(--text-1)', letterSpacing: '-0.4px' }}>
              For You
            </h1>
            <p style={{ fontSize: 14, color: 'var(--text-2)', marginTop: 4 }}>
              Curated for {profile?.displayName || user.displayName || 'you'}
            </p>
          </div>
          <button onClick={() => load(true)} disabled={refreshing}
            style={{
              display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px',
              borderRadius: 'var(--radius)', background: 'var(--surface-2)', border: '1px solid var(--border)',
              color: 'var(--text-2)', fontSize: 13, cursor: refreshing ? 'not-allowed' : 'pointer',
            }}>
            <RefreshCw size={13} style={{ animation: refreshing ? 'spin 0.8s linear infinite' : 'none' }} />
            Refresh
          </button>
        </div>
      </div>

      <div style={{ padding: '24px 32px 48px', display: 'grid', gridTemplateColumns: '1fr 300px', gap: 28 }} className="for-you-grid">
        {/* Main */}
        <div>
          {/* AI Brief */}
          {(summaryLoading || trendSummary) && (
            <div style={{
              padding: '18px 20px', background: 'var(--surface)', border: '1px solid var(--primary-border)',
              borderRadius: 'var(--radius-lg)', marginBottom: 24,
              background: 'linear-gradient(135deg, rgba(217,119,87,0.07), rgba(191,99,64,0.04))',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                <BookOpen size={13} style={{ color: 'var(--primary)' }} />
                <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase', color: 'var(--primary)' }}>AI Brief</span>
              </div>
              {summaryLoading ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {[1,2,3].map(i => <div key={i} className="skeleton" style={{ height: 14 }} />)}
                </div>
              ) : (
                <p style={{ fontSize: 14, lineHeight: 1.7, color: 'var(--text-2)' }}>
                  {trendSummary.split('\n')[0]}
                </p>
              )}
            </div>
          )}

          {/* Articles */}
          {loading ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 16 }}>
              {[1,2,3,4,5,6].map(i => <SkeletonCard key={i} />)}
            </div>
          ) : (
            <>
              <h2 style={{ fontFamily: 'Instrument Serif, serif', fontSize: 20, fontWeight: 400, color: 'var(--text-1)', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                <TrendingUp size={16} style={{ color: 'var(--primary)' }} />
                Your Feed
              </h2>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 16 }}>
                {articles.map((a, i) => <ArticleCard key={a.id || i} article={a} index={i} />)}
              </div>
            </>
          )}
        </div>

        {/* Sidebar */}
        <div>
          {/* Explore Topics */}
          {recommendations.length > 0 && (
            <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '18px', marginBottom: 20 }}>
              <h3 style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-1)', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 7 }}>
                <BookOpen size={14} style={{ color: 'var(--primary)' }} /> Explore
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {recommendations.map((rec, i) => (
                  <Link key={i} to={`/?q=${encodeURIComponent(rec.topic)}`} style={{
                    padding: '10px 12px', background: 'var(--surface-2)', borderRadius: 'var(--radius)',
                    border: '1px solid var(--border)', display: 'block', transition: 'all 0.15s',
                  }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--primary-border)'; e.currentTarget.style.background = 'var(--surface-3)'; }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.background = 'var(--surface-2)'; }}
                  >
                    <p style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-1)', marginBottom: 2 }}>{rec.topic}</p>
                    {rec.reason && <p style={{ fontSize: 11, color: 'var(--text-3)' }}>{rec.reason}</p>}
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Preferences */}
          {profile?.preferences?.categories?.length > 0 && (
            <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '18px' }}>
              <h3 style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-1)', marginBottom: 12 }}>Your interests</h3>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}>
                {profile.preferences.categories.map(cat => (
                  <Link key={cat} to={`/?cat=${cat}`} style={{
                    padding: '5px 12px', borderRadius: 'var(--radius-full)', background: 'var(--primary-subtle)',
                    border: '1px solid var(--primary-border)', color: 'var(--primary)', fontSize: 12, fontWeight: 500,
                  }}>
                    {cat}
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <style>{`
        @media (max-width: 900px) {
          .for-you-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
}
