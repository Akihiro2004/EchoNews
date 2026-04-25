/**
 * Advanced Search Parser
 * Parses queries like "source:BBC", "cat:tech", "tag:ai", or regular text.
 */
export const parseAdvancedQuery = (query) => {
  const result = {
    original: query,
    text: '',
    source: null,
    category: null,
    tag: null,
  };

  if (!query) return result;

  // Split by whitespace but respect quoted strings if we wanted to be even more advanced
  // For now, simple split is enough for "source:Name"
  const tokens = query.split(/\s+/);
  const textParts = [];

  tokens.forEach(token => {
    if (token.includes(':')) {
      const [key, value] = token.split(':');
      const k = key.toLowerCase();
      const v = value.replace(/_/g, ' '); // Allow "source:The_Guardian"

      if (k === 'source' || k === 'src') result.source = v;
      else if (k === 'category' || k === 'cat') result.category = v;
      else if (k === 'tag' || k === 't') result.tag = v;
      else textParts.push(token); // Unknown prefix, treat as text
    } else {
      textParts.push(token);
    }
  });

  result.text = textParts.join(' ').trim();
  return result;
};

/**
 * Filter articles locally based on advanced search criteria
 */
export const filterArticlesAdvanced = (articles, parsedQuery) => {
  if (!parsedQuery.source && !parsedQuery.category && !parsedQuery.tag) return articles;

  return articles.filter(article => {
    let match = true;

    if (parsedQuery.source) {
      const sourceName = (article.source?.name || '').toLowerCase();
      if (!sourceName.includes(parsedQuery.source.toLowerCase())) match = false;
    }

    if (parsedQuery.category && match) {
      const cat = (article.category || '').toLowerCase();
      if (!cat.includes(parsedQuery.category.toLowerCase())) match = false;
    }

    if (parsedQuery.tag && match) {
      const tags = (article.tags || []).map(t => t.toLowerCase());
      if (!tags.some(t => t.includes(parsedQuery.tag.toLowerCase()))) match = false;
    }

    return match;
  });
};
