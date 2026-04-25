import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Heart, Share2, Clock, User, MessageCircle, Sparkles } from 'lucide-react';
import { addToFavorites, removeFromFavorites, isArticleFavorited } from '../services/firebaseService';
import { formatDistanceToNow } from 'date-fns';
import './NewsCard.css';

const NewsCard = ({ article, user, showAIFeatures = false }) => {
  const [isFavorited, setIsFavorited] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user && article.id) {
      checkFavoriteStatus();
    }
  }, [user, article.id]);

  const checkFavoriteStatus = async () => {
    try {
      const favorited = await isArticleFavorited(user.uid, article.id);
      setIsFavorited(favorited);
    } catch (error) {
      console.error('Error checking favorite status:', error);
    }
  };

  const handleFavoriteToggle = async (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (!user) {
      // Redirect to login or show login modal
      alert('Please log in to add favorites');
      return;
    }

    if (!article.id) {
      console.error('Article ID is missing');
      return;
    }

    setLoading(true);
    try {
      if (isFavorited) {
        await removeFromFavorites(user.uid, article.id);
        setIsFavorited(false);
      } else {
        await addToFavorites(user.uid, article);
        setIsFavorited(true);
      }
    } catch (error) {
      console.error('Error toggling favorite:', error);
      alert('Failed to update favorites. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleShare = async (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (navigator.share) {
      try {
        await navigator.share({
          title: article.title,
          text: article.description,
          url: article.url
        });
      } catch (error) {
        console.error('Error sharing:', error);
      }
    } else {
      // Fallback: copy to clipboard
      try {
        await navigator.clipboard.writeText(article.url);
        // You could show a toast notification here
      } catch (error) {
        console.error('Error copying to clipboard:', error);
      }
    }
  };

  const formatDate = (dateString) => {
    try {
      const date = new Date(dateString);
      return formatDistanceToNow(date, { addSuffix: true });
    } catch (error) {
      return 'Recently';
    }
  };

  const getImageSrc = () => {
    if (article.urlToImage && article.urlToImage !== '/placeholder-news.jpg') {
      return article.urlToImage;
    }
    return '/placeholder-news.jpg';
  };

  const handleImageError = (e) => {
    e.target.src = '/placeholder-news.jpg';
  };

  const getArticleId = () => {
    // Use the article's actual ID for navigation
    return article.id || article.url || article.title.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase();
  };

  return (
    <div className="news-card">
      <Link to={`/news/${encodeURIComponent(article.id || getArticleId())}`} className="news-card-link">
        {/* Article Image */}
        <div className="news-image-container">
          <img
            src={getImageSrc()}
            alt={article.title}
            className="news-image"
            onError={handleImageError}
            loading="lazy"
          />
          
          {/* Custom News Badge */}
          {article.isCustom && (
            <div className="custom-badge">
              <User size={14} />
              <span>Echo News</span>
            </div>
          )}

          {/* AI Features Badge */}
          {showAIFeatures && (
            <div className="ai-badge">
              <Sparkles size={14} />
              <span>AI Enhanced</span>
            </div>
          )}
        </div>

        {/* Article Content */}
        <div className="news-content">
          <div className="news-header">
            <h3 className="news-title">{article.title}</h3>
          </div>

          <p className="news-description">
            {article.description && article.description.length > 150
              ? `${article.description.substring(0, 150)}...`
              : article.description || 'No description available'}
          </p>

          {/* Article Meta */}
          <div className="news-meta">
            <div className="meta-left">
              <span className="news-source">{article.source?.name || 'Unknown Source'}</span>
              <div className="meta-divider">•</div>
              <div className="news-date">
                <Clock size={12} />
                <span>{formatDate(article.publishedAt)}</span>
              </div>
            </div>

            <div className="meta-right">
              {article.author && (
                <div className="news-author">
                  <User size={12} />
                  <span>{article.author}</span>
                </div>
              )}
            </div>
          </div>

          {/* Category Tag */}
          {article.category && (
            <div className="category-tag">
              {article.category.charAt(0).toUpperCase() + article.category.slice(1)}
            </div>
          )}
        </div>
      </Link>

      {/* Action Buttons */}
      <div className="news-actions">
        <button
          onClick={handleFavoriteToggle}
          disabled={loading || !user}
          className={`action-btn favorite-btn ${isFavorited ? 'favorited' : ''}`}
          title={isFavorited ? 'Remove from favorites' : 'Add to favorites'}
        >
          <Heart size={16} fill={isFavorited ? 'currentColor' : 'none'} />
        </button>

        <button
          onClick={handleShare}
          className="action-btn share-btn"
          title="Share article"
        >
          <Share2 size={16} />
        </button>

        {showAIFeatures && (
          <Link
            to={`/news/${encodeURIComponent(getArticleId())}?ai=true`}
            className="action-btn ai-btn"
            title="AI Analysis"
            onClick={(e) => e.stopPropagation()}
          >
            <MessageCircle size={16} />
            <span>AI</span>
          </Link>
        )}
      </div>
    </div>
  );
};

export default NewsCard;
