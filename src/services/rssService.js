import axios from 'axios';

const RSS_FEEDS = {
  general: [
    { url: 'http://feeds.bbci.co.uk/news/rss.xml', name: 'BBC News' },
    { url: 'https://rss.nytimes.com/services/xml/rss/nyt/HomePage.xml', name: 'NY Times' }
  ],
  business: [
    { url: 'http://feeds.bbci.co.uk/news/business/rss.xml', name: 'BBC Business' },
    { url: 'https://search.cnbc.com/rs/search/combinedcms/view.xml?partnerId=wrss01&id=10000664', name: 'CNBC Finance' }
  ],
  technology: [
    { url: 'https://techcrunch.com/feed/', name: 'TechCrunch' },
    { url: 'https://www.theverge.com/rss/index.xml', name: 'The Verge' },
    { url: 'https://www.wired.com/feed/rss', name: 'Wired' }
  ],
  entertainment: [
    { url: 'https://www.hollywoodreporter.com/feed/', name: 'Hollywood Reporter' },
    { url: 'https://deadline.com/feed/', name: 'Deadline' }
  ],
  health: [
    { url: 'https://tools.cdc.gov/api/v2/resources/media/316308.rss', name: 'CDC Health' },
    { url: 'https://www.nih.gov/news-events/news-releases/rss.xml', name: 'NIH News' },
    { url: 'http://feeds.bbci.co.uk/news/health/rss.xml', name: 'BBC Health' },
    { url: 'https://medicalxpress.com/rss-feed/health-news/', name: 'Medical Xpress' }
  ],
  science: [
    { url: 'https://www.sciencedaily.com/rss/all.xml', name: 'Science Daily' },
    { url: 'https://www.space.com/feeds/all', name: 'Space.com' }
  ],
  sports: [
    { url: 'http://feeds.bbci.co.uk/sport/rss.xml', name: 'BBC Sport' },
    { url: 'https://sports.yahoo.com/rss/', name: 'Yahoo Sports' }
  ],
  politics: [
    { url: 'https://rss.politico.com/politics-news.xml', name: 'Politico' }
  ],
  world: [
    { url: 'http://feeds.bbci.co.uk/news/world/rss.xml', name: 'BBC World' },
    { url: 'https://www.aljazeera.com/xml/rss/all.xml', name: 'Al Jazeera' }
  ],
  environmental: [
    { url: 'https://www.sciencedaily.com/rss/earth_climate/environmental_issues.xml', name: 'Science Daily' },
    { url: 'https://e360.yale.edu/feed', name: 'Yale E360' },
    { url: 'https://www.epa.gov/newsreleases/search/rss', name: 'EPA News' }
  ]
};

const parseRssXml = (xml, sourceName, category) => {
  const parser = new DOMParser();
  const xmlDoc = parser.parseFromString(xml, "text/xml");
  const items = Array.from(xmlDoc.getElementsByTagName("item"));
  
  return items.map(item => {
    const getTagText = (tagName) => {
      const elements = item.getElementsByTagName(tagName);
      if (elements && elements.length > 0) {
        return elements[0].textContent || '';
      }
      return '';
    };

    const title = getTagText("title");
    const link = getTagText("link");
    const description = getTagText("description");
    const pubDate = getTagText("pubDate") || new Date().toISOString();
    
    // Try to get image
    let imageUrl = '/placeholder-news.jpg';
    const mediaContent = item.getElementsByTagName("media:content")[0];
    const mediaThumbnail = item.getElementsByTagName("media:thumbnail")[0];
    const enclosure = item.getElementsByTagName("enclosure")[0];
    
    if (mediaContent && mediaContent.getAttribute("url")) {
      imageUrl = mediaContent.getAttribute("url");
    } else if (mediaThumbnail && mediaThumbnail.getAttribute("url")) {
      imageUrl = mediaThumbnail.getAttribute("url");
    } else if (enclosure && enclosure.getAttribute("type")?.startsWith('image/')) {
      imageUrl = enclosure.getAttribute("url");
    } else {
      const imgMatch = description.match(/<img[^>]+src="([^">]+)"/);
      if (imgMatch) imageUrl = imgMatch[1];
    }

    const tmp = document.createElement("DIV");
    tmp.innerHTML = description;
    const textDesc = (tmp.textContent || tmp.innerText || "").trim().substring(0, 200) + '...';

    // Get author safely without querySelector
    let author = getTagText("author");
    if (!author) {
      const dcCreator = item.getElementsByTagName("dc:creator");
      if (dcCreator && dcCreator.length > 0) {
        author = dcCreator[0].textContent;
      }
    }
    if (!author) author = sourceName;

    return {
      id: link || Math.random().toString(36).substring(7),
      title: title,
      description: textDesc,
      content: description,
      contentIsHtml: true,
      url: link,
      urlToImage: imageUrl,
      publishedAt: pubDate,
      source: { id: sourceName.toLowerCase().replace(/\s+/g, '-'), name: sourceName },
      author: author,
      category: category,
      apiSource: 'rss'
    };
  });
};

export const fetchRssNews = async (params = {}) => {
  try {
    const { category = 'all', pageSize = 20 } = params;
    let targetFeeds = [];
    
    if (category && category !== 'all' && RSS_FEEDS[category]) {
      targetFeeds = RSS_FEEDS[category].map(feed => ({ ...feed, category }));
    } else {
      Object.keys(RSS_FEEDS).forEach(cat => {
        targetFeeds = [...targetFeeds, ...RSS_FEEDS[cat].map(feed => ({ ...feed, category: cat }))];
      });
      // Select random feeds but prioritize having some content
      targetFeeds = targetFeeds.sort(() => 0.5 - Math.random()).slice(0, 6);
    }

    let allArticles = [];
    
    // Fetch all targeted feeds in parallel
    await Promise.all(targetFeeds.map(async (feed) => {
      try {
        const proxyUrl = `https://api.codetabs.com/v1/proxy?quest=${feed.url}`;
        const response = await axios.get(proxyUrl, { timeout: 8000 });
        const xml = response.data;
        if (xml && typeof xml === 'string') {
          const articles = parseRssXml(xml, feed.name, feed.category);
          allArticles = [...allArticles, ...articles];
        }
      } catch (err) {
        console.error(`Error fetching RSS feed ${feed.name}:`, err);
      }
    }));

    // Sort by newest
    allArticles.sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());
    
    // Limit to page size
    allArticles = allArticles.slice(0, pageSize);

    return {
      articles: allArticles,
      totalResults: allArticles.length,
      status: 'ok'
    };
  } catch (error) {
    console.error('RSS API Error:', error);
    return { articles: [], totalResults: 0, status: 'error', error: error.message };
  }
};
