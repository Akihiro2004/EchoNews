const NEURAFEED_ORIGIN = 'https://feed.neuraspheres.com';
const NEURAFEED_API_PATH = '/api';

/**
 * Maps NeuraFeed's broad topics/tags to Echo News specific categories.
 */
const categorizeArticle = (article) => {
  const topic = (article.topic || '').toLowerCase();
  const tags = (article.tags || []).map(t => t.toLowerCase());
  const text = `${topic} ${tags.join(' ')}`;

  if (text.includes('business') || text.includes('economy') || text.includes('startup') || text.includes('market')) return 'business';
  if (text.includes('environment') || text.includes('climate') || text.includes('sustainability') || text.includes('green')) return 'environmental';
  if (text.includes('science') || text.includes('research') || text.includes('biology') || text.includes('space')) return 'science';
  if (text.includes('health') || text.includes('medical') || text.includes('biotech')) return 'health';
  if (text.includes('entertainment') || text.includes('culture') || text.includes('gaming')) return 'entertainment';
  if (text.includes('policy') || text.includes('regulation') || text.includes('government')) return 'politics';
  
  return 'technology'; // Default for NeuraFeed
};

/**
 * Parses NeuraFeed's raw source format: "[1] name: url"
 */
const parseSource = (rawSource) => {
  if (!rawSource) return null;
  const urlMatch = rawSource.match(/^\[(\d+)\]\s+(.+?):\s*(https?:\/\/\S+)/);
  if (urlMatch) {
    return { num: urlMatch[1], name: urlMatch[2], url: urlMatch[3] };
  }
  if (rawSource.startsWith("http")) {
    return { num: null, name: rawSource, url: rawSource };
  }
  return { num: null, name: rawSource, url: null };
};

/**
 * Fetch with multi-stage fallback
 */
const fetchWithFallback = async (endpoint) => {
  // Endpoints like '/recent-news?limit=15'
  const isLocal = window.location.hostname === 'localhost';
  
  try {
    // If on localhost, use the package.json proxy for a clean experience
    const url = isLocal ? NEURAFEED_API_PATH + endpoint : NEURAFEED_ORIGIN + NEURAFEED_API_PATH + endpoint;
    const res = await fetch(url);
    if (res.ok) return await res.json();
    throw new Error('Initial fetch failed');
  } catch (err) {
    const fullUrl = NEURAFEED_ORIGIN + NEURAFEED_API_PATH + endpoint;
    console.warn('Initial fetch failed, trying AllOrigins Raw...', err);
    try {
      const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(fullUrl)}`;
      const res = await fetch(proxyUrl);
      if (res.ok) return await res.json();
      throw new Error('AllOrigins Raw failed');
    } catch (err2) {
      console.warn('AllOrigins failed, trying Codetabs...', err2);
      try {
        const proxyUrl = `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(fullUrl)}`;
        const res = await fetch(proxyUrl);
        if (res.ok) return await res.json();
        throw new Error('Codetabs failed');
      } catch (err3) {
        console.warn('Codetabs failed, trying CorsProxy.io...', err3);
        const proxyUrl = `https://corsproxy.io/?${encodeURIComponent(fullUrl)}`;
        const res = await fetch(proxyUrl);
        if (res.ok) return await res.json();
        throw new Error('All proxies failed');
      }
    }
  }
};

/**
 * Fetch recent news from NeuraFeed.
 */
export const fetchNeuraFeedRecent = async (limit = 10) => {
  try {
    const data = await fetchWithFallback(`/recent-news?limit=${limit}`);
    
    if (!data.success || !data.articles) {
      console.warn('NeuraFeed API success was false or no articles returned', data);
      return [];
    }

    return data.articles.map(article => ({
      id: article.id || `neura-${Date.now()}-${Math.random()}`,
      title: article.title,
      description: article.summary,
      content: article.article,
      contentIsHtml: true,
      url: `https://feed.neuraspheres.com/news/${article.id}`,
      urlToImage: null, // NeuraFeed JSON doesn't provide hero image at top level
      publishedAt: article.createdAt,
      source: { name: 'NeuraFeed' },
      category: categorizeArticle(article),
      apiSource: 'neurafeed',
      tags: article.tags || [],
      whyItMatters: article.whyItMatters,
      sources: (article.sources || []).map(parseSource).filter(Boolean)
    }));
  } catch (error) {
    console.error('Error fetching NeuraFeed:', error);
    return [];
  }
};

export const fetchNeuraFeedLatest = async () => {
  try {
    const data = await fetchWithFallback('/latest-news');
    
    if (!data.success || !data.article) return null;

    const article = data.article;
    return {
      id: article.id,
      title: article.title,
      description: article.summary,
      content: article.article,
      contentIsHtml: true,
      url: `https://feed.neuraspheres.com/news/${article.id}`,
      urlToImage: null,
      publishedAt: article.createdAt,
      source: { name: 'NeuraFeed' },
      category: categorizeArticle(article),
      apiSource: 'neurafeed',
      tags: article.tags || [],
      whyItMatters: article.whyItMatters,
      sources: (article.sources || []).map(parseSource).filter(Boolean)
    };
  } catch (error) {
    console.error('Error fetching NeuraFeed Latest:', error);
    return null;
  }
};

/**
 * Fetch a single article by ID from NeuraFeed.
 */
export const fetchNeuraFeedArticleById = async (id) => {
  try {
    const data = await fetchWithFallback(`/get-article?id=${id}`);
    
    if (!data.success || !data.article) {
      console.warn('NeuraFeed Article fetch failed or not found', id);
      return null;
    }

    const article = data.article;
    return {
      id: article.id,
      title: article.title,
      description: article.summary,
      content: article.article,
      contentIsHtml: true,
      url: `https://feed.neuraspheres.com/news/${article.id}`,
      urlToImage: null,
      publishedAt: article.createdAt,
      source: { name: 'NeuraFeed' },
      category: categorizeArticle(article),
      apiSource: 'neurafeed',
      tags: article.tags || [],
      whyItMatters: article.whyItMatters,
      sources: (article.sources || []).map(parseSource).filter(Boolean)
    };
  } catch (error) {
    console.error('Error fetching NeuraFeed Article by ID:', error);
    return null;
  }
};
