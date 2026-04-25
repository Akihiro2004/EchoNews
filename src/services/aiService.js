import { GoogleGenAI } from '@google/genai';
import geminiAPIManager from './apiKeyManager.js';

const DEFAULT_MODEL = 'gemini-2.5-flash';

const getClient = () => {
  const { key, index } = geminiAPIManager.getCurrentAPIKey();
  return { client: new GoogleGenAI({ apiKey: key }), keyIndex: index };
};

const withRetry = async (fn, maxAttempts = 3) => {
  let attempts = 0;
  while (attempts < maxAttempts) {
    try {
      const { client, keyIndex } = getClient();
      const result = await fn(client);
      geminiAPIManager.recordSuccess(keyIndex);
      return result;
    } catch (error) {
      attempts++;
      const { keyIndex } = geminiAPIManager.getCurrentAPIKey();
      geminiAPIManager.recordError(keyIndex, error);
      if (attempts >= maxAttempts) throw new Error(`AI request failed: ${error.message}`);
      const delay = 1000 * attempts;
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
};

const SYSTEM_PERSONA = `You are Echo News AI, an intelligent and thoughtful news assistant built into a premium news application.
Your personality: insightful, clear, and direct. You explain complex topics accessibly without dumbing them down.
You present balanced perspectives and clearly flag when something is opinion vs fact.
CRITICAL: NEVER use emdashes (—). Use colons, commas, or parentheses instead.
Format responses with clean markdown when helpful (bullets, bold for key terms). Keep answers concise unless depth is requested.`;

// --- Article Intelligence ---

export const summarizeArticle = async (article) => {
  const prompt = `${SYSTEM_PERSONA}

Summarize this news article concisely for a smart reader. Return a JSON object with:
- "tldr": One sentence summary (max 25 words)
- "bullets": Array of 3-4 key points (each max 15 words, start with action verb)
- "sentiment": "positive" | "negative" | "neutral" | "mixed"
- "sentimentNote": Brief note on tone (max 10 words)
- "readTime": Estimated read time in minutes (number)
- "complexity": "basic" | "intermediate" | "advanced"

Article:
Title: ${article.title}
Source: ${article.source?.name || 'Unknown'}
Published: ${article.publishedAt || ''}
Description: ${article.description || ''}
Content: ${(article.content || article.description || '').substring(0, 3000)}

Respond ONLY with valid JSON, no markdown fences.`;

  return withRetry(async (client) => {
    const response = await client.models.generateContent({
      model: DEFAULT_MODEL,
      contents: [{ role: 'user', parts: [{ text: prompt }] }]
    });
    const text = response.text.trim();
    try {
      const cleaned = text.replace(/```json\n?|\n?```/g, '').trim();
      return JSON.parse(cleaned);
    } catch {
      return {
        tldr: 'Unable to summarize at this time.',
        bullets: [],
        sentiment: 'neutral',
        sentimentNote: '',
        readTime: 3,
        complexity: 'intermediate',
      };
    }
  });
};

export const streamArticleSummary = async (article, onChunk, onDone, onError) => {
  const prompt = `${SYSTEM_PERSONA}

Give an insightful analysis of this article in 3-4 paragraphs. Cover: the core story, why it matters, broader context, and what to watch next. Write for an intelligent general audience. Use markdown sparingly (bold key terms only).

Title: ${article.title}
Source: ${article.source?.name || 'Unknown'}
Content: ${(article.content || article.description || '').substring(0, 4000)}`;

  try {
    const { client, keyIndex } = getClient();
    const stream = await client.models.generateContentStream({
      model: DEFAULT_MODEL,
      contents: [{ role: 'user', parts: [{ text: prompt }] }]
    });
    
    for await (const chunk of stream) {
      if (chunk.text) onChunk(chunk.text);
    }
    
    geminiAPIManager.recordSuccess(keyIndex);
    onDone?.();
  } catch (error) {
    onError?.(error.message);
  }
};

export const askAboutArticle = async (article, question, history = []) => {
  const historyText = history.slice(-6).map(m => `${m.role === 'user' ? 'User' : 'AI'}: ${m.content}`).join('\n');

  const prompt = `${SYSTEM_PERSONA}

You're answering questions about a specific news article. Use the article content as your primary source. If the question goes beyond the article, supplement with your general knowledge and say so.

Article:
Title: ${article.title}
Source: ${article.source?.name || ''}
Content: ${(article.content || article.description || '').substring(0, 3000)}

${historyText ? `Previous conversation:\n${historyText}\n` : ''}
User question: ${question}

Answer directly and concisely. Use markdown formatting where it helps clarity.`;

  return withRetry(async (client) => {
    const response = await client.models.generateContent({
      model: DEFAULT_MODEL,
      contents: [{ role: 'user', parts: [{ text: prompt }] }]
    });
    return response.text;
  });
};

export const streamAskArticle = async (article, question, history, onChunk, onDone, onError) => {
  const historyText = history.slice(-6).map(m => `${m.role === 'user' ? 'User' : 'AI'}: ${m.content}`).join('\n');

  const prompt = `${SYSTEM_PERSONA}

You're answering questions about a specific news article. Use the article content as primary source.

Article:
Title: ${article.title}
Source: ${article.source?.name || ''}
Content: ${(article.content || article.description || '').substring(0, 3000)}

${historyText ? `Previous conversation:\n${historyText}\n` : ''}
User: ${question}

Be direct, insightful, and concise.`;

  try {
    const { client, keyIndex } = getClient();
    const stream = await client.models.generateContentStream({
      model: DEFAULT_MODEL,
      contents: [{ role: 'user', parts: [{ text: prompt }] }]
    });

    for await (const chunk of stream) {
      if (chunk.text) onChunk(chunk.text);
    }

    geminiAPIManager.recordSuccess(keyIndex);
    onDone?.();
  } catch (error) {
    onError?.(error.message);
  }
};

export const getKeyInsights = async (article) => {
  const prompt = `${SYSTEM_PERSONA}

Analyze this article and return JSON with:
- "keyPeople": Array of {name, role} for up to 3 key people/organizations mentioned
- "keyFacts": Array of up to 4 verifiable factual claims from the article (strings)
- "relatedTopics": Array of 4-5 related topics the reader might want to explore (strings)
- "biasIndicators": Array of any bias indicators noticed (strings, can be empty)
- "credibilitySignals": Array of credibility signals (strings, e.g. "cites official data", "multiple sources")

Article:
Title: ${article.title}
Source: ${article.source?.name || ''}
Content: ${(article.content || article.description || '').substring(0, 2500)}

Respond ONLY with valid JSON.`;

  return withRetry(async (client) => {
    const response = await client.models.generateContent({
      model: DEFAULT_MODEL,
      contents: [{ role: 'user', parts: [{ text: prompt }] }]
    });
    const text = response.text.trim().replace(/```json\n?|\n?```/g, '').trim();
    try {
      return JSON.parse(text);
    } catch {
      return { keyPeople: [], keyFacts: [], relatedTopics: [], biasIndicators: [], credibilitySignals: [] };
    }
  });
};

export const factCheckArticle = async (article) => {
  const prompt = `${SYSTEM_PERSONA}

Assess the factual reliability of this article. Return JSON with:
- "overallAssessment": "high" | "medium" | "low" | "uncertain"
- "assessmentNote": One sentence explaining the rating (max 20 words)
- "claims": Array of up to 4 objects: {claim: string, status: "verifiable" | "opinion" | "unverified" | "misleading", note: string}
- "suggestion": One actionable tip for further verification

Article:
Title: ${article.title}
Source: ${article.source?.name || ''}
Content: ${(article.content || article.description || '').substring(0, 2500)}

Respond ONLY with valid JSON.`;

  return withRetry(async (client) => {
    const response = await client.models.generateContent({
      model: DEFAULT_MODEL,
      contents: [{ role: 'user', parts: [{ text: prompt }] }]
    });
    const text = response.text.trim().replace(/```json\n?|\n?```/g, '').trim();
    try {
      return JSON.parse(text);
    } catch {
      return {
        overallAssessment: 'uncertain',
        assessmentNote: 'Unable to assess at this time.',
        claims: [],
        suggestion: 'Verify with primary sources.',
      };
    }
  });
};

// --- Global AI Chat ---

export const streamChat = async (message, history, context, onChunk, onDone, onError) => {
  const contextNote = context?.article
    ? `The user is currently reading: "${context.article.title}" from ${context.article.source?.name || 'Unknown'}.`
    : 'The user is browsing news.';

  const historyText = history.slice(-8).map(m => `${m.role === 'user' ? 'User' : 'AI'}: ${m.content}`).join('\n');

  const prompt = `${SYSTEM_PERSONA}

Context: ${contextNote}

${historyText ? `Conversation so far:\n${historyText}\n` : ''}
User: ${message}

Respond helpfully and concisely. If relevant to the article they're reading, reference it naturally. Use markdown sparingly.`;

  try {
    const { client, keyIndex } = getClient();
    const stream = await client.models.generateContentStream({
      model: DEFAULT_MODEL,
      contents: [{ role: 'user', parts: [{ text: prompt }] }]
    });

    for await (const chunk of stream) {
      if (chunk.text) onChunk(chunk.text);
    }

    geminiAPIManager.recordSuccess(keyIndex);
    onDone?.();
  } catch (error) {
    onError?.(error.message);
  }
};

// --- Feed Intelligence ---

export const getPersonalizedRecommendations = async (preferences, history = []) => {
  const prompt = `${SYSTEM_PERSONA}

Based on user preferences and reading history, suggest 6 specific news search topics.

Preferences: ${JSON.stringify(preferences)}
Recent reads: ${history.slice(0, 8).map(a => a.title).join(', ')}

Return JSON array of 6 objects: [{topic: string, reason: string (max 8 words), category: string}]
Respond ONLY with valid JSON array.`;

  return withRetry(async (client) => {
    const response = await client.models.generateContent({
      model: DEFAULT_MODEL,
      contents: [{ role: 'user', parts: [{ text: prompt }] }]
    });
    const text = response.text.trim().replace(/```json\n?|\n?```/g, '').trim();
    try {
      return JSON.parse(text);
    } catch {
      return [];
    }
  });
};

export const generateNewsSummary = async (articles, topic = '') => {
  const articlesText = articles.slice(0, 8).map(a => `- ${a.title}: ${a.description}`).join('\n');
  const prompt = `${SYSTEM_PERSONA}

Summarize the current news landscape${topic ? ` on "${topic}"` : ''}. Write 2-3 concise paragraphs covering main developments, key themes, and what matters most right now. Be editorial and insightful.

Articles:
${articlesText}`;

  return withRetry(async (client) => {
    const response = await client.models.generateContent({
      model: DEFAULT_MODEL,
      contents: [{ role: 'user', parts: [{ text: prompt }] }]
    });
    return response.text;
  });
};

export const explainTopic = async (topic) => {
  const prompt = `${SYSTEM_PERSONA}

Explain "${topic}" clearly for a general audience in 2-3 paragraphs. Cover: what it is, why it's in the news, and what to know. Be accessible but not condescending.`;

  return withRetry(async (client) => {
    const response = await client.models.generateContent({
      model: DEFAULT_MODEL,
      contents: [{ role: 'user', parts: [{ text: prompt }] }]
    });
    return response.text;
  });
};

export {
  getCurrentGeminiKey,
  getGeminiUsageStats,
  testAllGeminiKeys,
  forceGeminiRotation
} from './apiKeyManager.js';

const aiService = {
  summarizeArticle,
  streamArticleSummary,
  askAboutArticle,
  streamAskArticle,
  getKeyInsights,
  factCheckArticle,
  streamChat,
  getPersonalizedRecommendations,
  generateNewsSummary,
  explainTopic,
};

export default aiService;
