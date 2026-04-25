import axios from 'axios';

const NEWSDATA_API_KEY = process.env.REACT_APP_NEWSDATA_API_KEY;
const NEWS_API_KEY = process.env.REACT_APP_NEWS_API_KEY;

// Map our app categories to NewsData.io categories
const NEWSDATA_CATEGORY_MAP = {
  all: 'top',
  general: 'top',
  business: 'business',
  technology: 'technology',
  entertainment: 'entertainment',
  health: 'health',
  science: 'science',
  sports: 'sports',
  politics: 'politics',
  world: 'world',
  environmental: 'environment'
};

// Map our app categories to NewsAPI.org categories
const NEWSAPI_CATEGORY_MAP = {
  all: 'general',
  general: 'general',
  business: 'business',
  technology: 'technology',
  entertainment: 'entertainment',
  health: 'health',
  science: 'science',
  sports: 'sports',
  politics: 'politics',
  world: 'general',
  environmental: 'science' // NewsAPI doesn't have environment
};

export const fetchApiNews = async (params = {}) => {
  const { category = 'all', query = '', pageSize = 20 } = params;

  // Try NewsData.io first as it has better global coverage and provides more content
  if (NEWSDATA_API_KEY) {
    try {
      const newsDataCategory = NEWSDATA_CATEGORY_MAP[category] || 'top';
      const url = `https://newsdata.io/api/1/news?apikey=${NEWSDATA_API_KEY}&category=${newsDataCategory}${query ? `&q=${encodeURIComponent(query)}` : ''}&language=en`;
      
      const response = await axios.get(url, { timeout: 8000 });
      
      if (response.data && response.data.status === 'success') {
        const articles = response.data.results.map(article => ({
          id: article.article_id || article.link,
          title: article.title,
          description: article.description || article.title,
          content: article.content || article.description || '',
          contentIsHtml: false,
          url: article.link,
          urlToImage: article.image_url || '/placeholder-news.jpg',
          publishedAt: article.pubDate,
          source: { 
            id: article.source_id, 
            name: article.source_id ? article.source_id.charAt(0).toUpperCase() + article.source_id.slice(1) : 'News Source' 
          },
          author: article.creator ? article.creator.join(', ') : 'Unknown',
          category: category,
          apiSource: 'newsdata'
        }));

        return {
          articles,
          totalResults: response.data.totalResults,
          status: 'ok'
        };
      }
    } catch (error) {
      console.error('NewsData.io Error:', error);
      // Fall through to NewsAPI.org if NewsData fails
    }
  }

  // Try NewsAPI.org as fallback
  if (NEWS_API_KEY) {
    try {
      const newsApiCategory = NEWSAPI_CATEGORY_MAP[category] || 'general';
      const url = query 
        ? `https://newsapi.org/v2/everything?q=${encodeURIComponent(query)}&apiKey=${NEWS_API_KEY}&pageSize=${pageSize}&language=en`
        : `https://newsapi.org/v2/top-headlines?category=${newsApiCategory}&apiKey=${NEWS_API_KEY}&pageSize=${pageSize}&country=us`;
      
      const response = await axios.get(url, { timeout: 8000 });
      
      if (response.data && response.data.status === 'ok') {
        const articles = response.data.articles.map(article => ({
          id: article.url,
          title: article.title,
          description: article.description || article.title,
          content: article.content || article.description || '',
          contentIsHtml: false,
          url: article.url,
          urlToImage: article.urlToImage || '/placeholder-news.jpg',
          publishedAt: article.publishedAt,
          source: article.source,
          author: article.author || article.source.name,
          category: category,
          apiSource: 'newsapi'
        }));

        return {
          articles,
          totalResults: response.data.totalResults,
          status: 'ok'
        };
      }
    } catch (error) {
      console.error('NewsAPI.org Error:', error);
    }
  }

  return { articles: [], totalResults: 0, status: 'error', error: 'No API keys available or requests failed' };
};
