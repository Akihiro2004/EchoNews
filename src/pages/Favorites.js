import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getUserFavorites, removeFromFavorites } from '../services/firebaseService';
import { Bookmark, BookmarkX, Clock, Trash2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

function FavoriteCard({ item, onRemove, index }) {
  const [imgError, setImgError] = useState(false);
  const [removing, setRemoving] = useState(false);
  const timeAgo = item.addedAt?.toDate
    ? formatDistanceToNow(item.addedAt.toDate(), { addSuffix: true })
    : '';

  const handleRemove = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    setRemoving(true);
    await onRemove(item);
  };

  const article = {
    id: item.articleId,
    title: item.title,
    description: item.description,
    urlToImage: item.urlToImage,
    url: item.url,
    source: item.source,
    publishedAt: item.publishedAt,
  };

  return (
    <Link to={`/news/${encodeURIComponent(item.articleId)}`} state={{ article }} style={{ display: 'block', opacity: removing ? 0.4 : 1, transition: 'opacity 0.2s' }}>
      <div style={{
        background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)',
        overflow: 'hidden', transition: 'all 0.2s ease', display: 'flex', flexDirection: 'column',
        animation: `fadeUp 0.4s ease ${Math.min(index, 8) * 0.05}s both`,
      }}
        onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--primary-border)'; e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 6px 24px rgba(0,0,0,0.3)'; }}
        onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; }}
      >
        <div style={{ height: 160, overflow: 'hidden', flexShrink: 0 }}>
          {!imgError && item.urlToImage ? (
            <img src={item.urlToImage} alt={item.title} onError={() => setImgError(true)}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          ) : (
            <div style={{ width: '100%', height: '100%', background: 'var(--surface-2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Bookmark size={28} style={{ color: 'var(--text-3)', opacity: 0.3 }} />
            </div>
          )}
        </div>
        <div style={{ padding: '14px 15px 15px', flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
            <span style={{ fontSize: 11.5, color: 'var(--text-3)', fontWeight: 500 }}>
              {item.source?.name || 'Unknown'}
            </span>
            {timeAgo && <span style={{ fontSize: 11, color: 'var(--text-3)', display: 'flex', alignItems: 'center', gap: 3 }}>
              <Clock size={9} /> {timeAgo}
            </span>}
          </div>
          <h3 style={{
            fontFamily: 'Instrument Serif, serif', fontSize: 16, fontWeight: 400, lineHeight: 1.4,
            color: 'var(--text-1)', marginBottom: 12,
            display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden',
          }}>
            {item.title}
          </h3>
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button onClick={handleRemove} disabled={removing}
              style={{
                display: 'flex', alignItems: 'center', gap: 5, padding: '5px 10px',
                borderRadius: 'var(--radius-sm)', border: '1px solid rgba(255,107,107,0.2)',
                background: 'rgba(255,107,107,0.05)', color: 'var(--text-3)', fontSize: 11.5,
                cursor: removing ? 'not-allowed' : 'pointer', transition: 'all 0.15s',
              }}
              onMouseEnter={e => { e.currentTarget.style.color = 'var(--accent)'; e.currentTarget.style.borderColor = 'var(--accent)'; e.currentTarget.style.background = 'rgba(255,107,107,0.1)'; }}
              onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-3)'; e.currentTarget.style.borderColor = 'rgba(255,107,107,0.2)'; e.currentTarget.style.background = 'rgba(255,107,107,0.05)'; }}
            >
              <Trash2 size={11} /> Remove
            </button>
          </div>
        </div>
      </div>
    </Link>
  );
}

export default function Favorites({ user, onMenuOpen }) {
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const favs = await getUserFavorites(user.uid, 50);
        setFavorites(favs);
      } catch { }
      setLoading(false);
    })();
  }, [user.uid]);

  const handleRemove = async (item) => {
    setFavorites(prev => prev.filter(f => f.id !== item.id));
    try {
      await removeFromFavorites(user.uid, item.articleId);
    } catch {
      setFavorites(prev => [...prev, item]);
    }
  };

  return (
    <div style={{ minHeight: '100vh' }}>
      <div style={{ padding: '28px 32px 0', borderBottom: '1px solid var(--border)', background: 'linear-gradient(180deg, var(--surface) 0%, transparent 100%)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
          <Bookmark size={14} style={{ color: 'var(--primary)' }} />
          <span style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.09em', textTransform: 'uppercase', color: 'var(--primary)' }}>Saved</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, marginBottom: 20, paddingBottom: 20 }}>
          <h1 style={{ fontFamily: 'Instrument Serif, serif', fontSize: 34, fontWeight: 400, color: 'var(--text-1)', letterSpacing: '-0.4px' }}>Saved Articles</h1>
          {!loading && favorites.length > 0 && (
            <span style={{ fontSize: 13, color: 'var(--text-3)', fontWeight: 500 }}>{favorites.length} saved</span>
          )}
        </div>
      </div>

      <div style={{ padding: '24px 32px 48px' }}>
        {loading ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 18 }}>
            {[1,2,3,4,5,6].map(i => (
              <div key={i} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}>
                <div className="skeleton" style={{ height: 160, borderRadius: 0 }} />
                <div style={{ padding: 16 }}>
                  <div className="skeleton" style={{ height: 12, width: '40%', marginBottom: 10 }} />
                  <div className="skeleton" style={{ height: 16, marginBottom: 8 }} />
                  <div className="skeleton" style={{ height: 16, width: '70%' }} />
                </div>
              </div>
            ))}
          </div>
        ) : favorites.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '80px 20px' }}>
            <div style={{
              width: 64, height: 64, borderRadius: '50%', background: 'var(--surface-2)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px',
            }}>
              <Bookmark size={28} style={{ color: 'var(--text-3)' }} />
            </div>
            <h3 style={{ fontFamily: 'Instrument Serif, serif', fontSize: 22, fontWeight: 400, color: 'var(--text-1)', marginBottom: 8 }}>No saved articles yet</h3>
            <p style={{ color: 'var(--text-2)', fontSize: 14, marginBottom: 24 }}>Save articles from the home feed to read them later.</p>
            <Link to="/" style={{
              display: 'inline-flex', alignItems: 'center', gap: 7, padding: '10px 22px',
              borderRadius: 'var(--radius-full)', background: 'var(--primary-gradient)',
              color: '#fff', fontSize: 14, fontWeight: 500,
            }}>
              Browse News
            </Link>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 18 }}>
            {favorites.map((item, i) => (
              <FavoriteCard key={item.id} item={item} onRemove={handleRemove} index={i} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
