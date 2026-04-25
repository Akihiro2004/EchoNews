import axios from 'axios';
import { fetchApiNews } from './newsApiService';
import { fetchNeuraFeedRecent } from './neuraFeedService';
import { parseAdvancedQuery, filterArticlesAdvanced } from './searchService';

// API Configuration - Only Guardian API
const NEWS_APIS = {
  guardian: {
    baseURL: 'https://content.guardianapis.com',
    apiKey: process.env.REACT_APP_GUARDIAN_API_KEY,
  }
};

// Normalize article data from Guardian API
const normalizeArticle = (article, source = 'guardian') => {
  return {
    id: article.id,
    title: article.webTitle,
    description: article.fields?.trailText || article.webTitle,
    content: article.fields?.body || article.fields?.bodyText || '',
    contentIsHtml: !!(article.fields?.body),
    url: article.webUrl,
    urlToImage: article.fields?.thumbnail || '/placeholder-news.jpg',
    publishedAt: article.webPublicationDate,
    source: {
      id: 'the-guardian',
      name: 'The Guardian'
    },
    author: article.fields?.byline || 'The Guardian',
    category: article.sectionName,
    apiSource: 'guardian'
  };
};

// Guardian API Service
export const fetchGuardianNews = async (params = {}) => {
  try {
    const {
      query = '',
      category = '',
      pageSize = 20,
      page = 1
    } = params;

    const searchParams = new URLSearchParams({
      'api-key': NEWS_APIS.guardian.apiKey,
      'show-fields': 'thumbnail,trailText,body,byline',
      'page-size': pageSize,
      'page': page,
      'order-by': 'newest'
    });

    if (query) {
      searchParams.append('q', query);
    }

    if (category && category !== 'all') {
      // Improved Guardian Section Mapping
      const guardianSectionMap = {
        business: 'business',
        technology: 'technology',
        entertainment: 'culture',
        health: 'society',
        science: 'science',
        sports: 'sport',
        politics: 'politics',
        world: 'world',
        environmental: 'environment'
      };
      const guardianSection = guardianSectionMap[category] || category;
      searchParams.append('section', guardianSection);
    }

    const response = await axios.get(
      `${NEWS_APIS.guardian.baseURL}/search?${searchParams}`,
      { timeout: 5000 }
    );

    const articles = response.data.response.results.map(article => 
      normalizeArticle(article, 'guardian')
    );

    return {
      articles,
      totalResults: response.data.response.total,
      status: 'ok'
    };
  } catch (error) {
    console.error('Guardian API Error:', error);
    return { articles: [], totalResults: 0, status: 'error', error: error.message };
  }
};

// Cache configuration
const CACHE_TTL = 15 * 60 * 1000; // 15 minutes in milliseconds

const getCacheKey = (params) => {
  return `news_cache_${JSON.stringify(params)}`;
};

const getCachedData = (key) => {
  try {
    const cached = localStorage.getItem(key);
    if (!cached) return null;
    
    const { data, timestamp } = JSON.parse(cached);
    const age = Date.now() - timestamp;
    
    return { data, age, isStale: age > CACHE_TTL };
  } catch (error) {
    return null;
  }
};

const setCachedData = (key, data) => {
  try {
    localStorage.setItem(key, JSON.stringify({
      data,
      timestamp: Date.now()
    }));
  } catch (error) {
    if (error.name === 'QuotaExceededError' || error.code === 22) {
      console.warn('LocalStorage full, clearing news cache and retrying...');
      // Clear all news_cache items
      Object.keys(localStorage).forEach(k => {
        if (k.startsWith('news_cache_')) localStorage.removeItem(k);
      });
      try {
        localStorage.setItem(key, JSON.stringify({
          data,
          timestamp: Date.now()
        }));
      } catch (innerError) {
        console.error('Final cache storage failure:', innerError);
      }
    } else {
      console.error('Cache storage error:', error);
    }
  }
};

// Fetch news from Guardian API and News APIs
export const fetchCombinedNews = async (params = {}) => {
  const cacheKey = getCacheKey(params);
  const cached = getCachedData(cacheKey);

  // If we have a fresh cache, return it immediately
  if (cached && !cached.isStale) {
    console.log('Returning fresh news from cache');
    return cached.data;
  }

  // If we have stale cache, we could return it and fetch in background
  // but for simplicity in this React app, we'll just fetch if it's stale or missing
  // unless the user wants a more complex 'stale-while-revalidate' hook.
  
  try {
    console.log('Fetching fresh news from APIs...');
    const parsed = parseAdvancedQuery(params.query);
    // Only send the 'text' part of the query to the APIs, not the 'source:' or 'cat:' commands
    const searchParams = { ...params, query: parsed.text };

    const [guardianResult, apiResult, neuraResult] = await Promise.all([
      fetchGuardianNews(searchParams).catch(() => ({ articles: [], totalResults: 0 })),
      fetchApiNews(searchParams).catch(() => ({ articles: [], totalResults: 0 })),
      (params.category === 'all' || params.category === 'technology' || 
       parsed.source?.toLowerCase().includes('neura') || 
       params.query?.toLowerCase().includes('neura')) 
        ? fetchNeuraFeedRecent(15).catch(() => []) 
        : Promise.resolve([])
    ]);
    
    const neuraArticles = Array.isArray(neuraResult) ? neuraResult : [];
    
    // Combine articles
    let combinedArticles = [...neuraArticles, ...guardianResult.articles, ...apiResult.articles];
    
    // Apply Advanced Filtering
    combinedArticles = filterArticlesAdvanced(combinedArticles, parsed);
    
    combinedArticles = removeDuplicateArticles(combinedArticles);
    
    // Sort by newest
    combinedArticles.sort((a, b) => {
      const dateA = new Date(a.publishedAt).getTime();
      const dateB = new Date(b.publishedAt).getTime();
      return dateB - dateA;
    });
    
    // Return a healthy mix
    if (params.pageSize && combinedArticles.length > params.pageSize) {
      combinedArticles = combinedArticles.slice(0, Math.max(params.pageSize, 30));
    }
    
    const result = {
      articles: combinedArticles,
      totalResults: guardianResult.totalResults + apiResult.totalResults,
      status: 'ok',
      fromCache: false
    };

    // Cache the successful result
    setCachedData(cacheKey, result);
    
    return result;
  } catch (error) {
    console.error('Error fetching combined news:', error);
    
    // If API fails but we have a stale cache, return the stale cache as fallback
    if (cached) {
      console.log('API failed, returning stale cache as fallback');
      return { ...cached.data, fromCache: true, isStale: true };
    }
    
    return { articles: [], totalResults: 0, status: 'error', error: error.message };
  }
};

// Remove duplicate articles and those without titles
const removeDuplicateArticles = (articles) => {
  const seen = new Set();
  return articles.filter(article => {
    if (!article || !article.title) return false;
    const normalizedTitle = article.title.toLowerCase().replace(/[^\w\s]/g, '').trim();
    if (normalizedTitle.length < 10) return true; // Don't dedupe very short titles
    if (seen.has(normalizedTitle)) {
      return false;
    }
    seen.add(normalizedTitle);
    return true;
  });
};

// Get news categories
export const getNewsCategories = () => [
  { id: 'all', name: 'All News', icon: '📰' },
  { id: 'general', name: 'General', icon: '📰' },
  { id: 'business', name: 'Business', icon: '💼' },
  { id: 'technology', name: 'Technology', icon: '💻' },
  { id: 'entertainment', name: 'Entertainment', icon: '🎬' },
  { id: 'health', name: 'Health', icon: '🏥' },
  { id: 'environmental', name: 'Environmental', icon: '🌱' },
  { id: 'science', name: 'Science', icon: '🔬' },
  { id: 'sports', name: 'Sports', icon: '⚽' },
  { id: 'politics', name: 'Politics', icon: '🏛️' },
  { id: 'world', name: 'World', icon: '🌍' }
];

// Get trending topics (mock implementation - you can enhance this)
export const getTrendingTopics = async () => {
  const trendingKeywords = [
    'artificial intelligence',
    'climate change',
    'cryptocurrency',
    'space exploration',
    'renewable energy',
    'cybersecurity',
    'electric vehicles',
    'quantum computing'
  ];

  return trendingKeywords.map(keyword => ({
    id: keyword.replace(' ', '-'),
    name: keyword,
    searchCount: Math.floor(Math.random() * 10000) + 1000
  }));
};
