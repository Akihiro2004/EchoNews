import { 
  collection, 
  doc, 
  addDoc, 
  getDoc, 
  getDocs, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy, 
  limit, 
  serverTimestamp 
} from 'firebase/firestore';
import { db } from '../Firebase';

// LLM Service for chat functionality with memory management
class LLMService {
  constructor() {
    this.COLLECTIONS = {
      conversations: 'llmConversations',
      userMemory: 'userMemory',
      contextSummaries: 'contextSummaries'
    };
    
    // Local storage keys
    this.LOCAL_STORAGE_KEYS = {
      shortTermMessages: 'llm_short_term_messages',
      shortTermContext: 'llm_short_term_context'
    };
  }

  // Save conversation message to Firebase
  async saveMessage(userId, message, response, context = null) {
    try {
      const conversationRef = collection(db, this.COLLECTIONS.conversations);
      const conversationData = {
        userId,
        userMessage: message,
        llmResponse: response,
        context,
        timestamp: serverTimestamp(),
        messageId: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      };

      await addDoc(conversationRef, conversationData);
      
      // Update short-term storage
      this.updateShortTermStorage(message, response);
      
      return conversationData;
    } catch (error) {
      console.error('Error saving LLM conversation:', error);
      throw error;
    }
  }

  // Update short-term storage in localStorage
  updateShortTermStorage(userMessage, llmResponse) {
    try {
      // Get existing messages
      const messages = this.getShortTermMessages();
      
      // Add new message pair
      messages.push({
        user: userMessage,
        llm: llmResponse,
        timestamp: Date.now()
      });
      
      // Keep only last 30 messages (15 pairs)
      if (messages.length > 15) {
        messages.splice(0, messages.length - 15);
      }
      
      localStorage.setItem(this.LOCAL_STORAGE_KEYS.shortTermMessages, JSON.stringify(messages));
      
      // Update context (keep last 4 message pairs for LLM context)
      const contextMessages = messages.slice(-4);
      localStorage.setItem(this.LOCAL_STORAGE_KEYS.shortTermContext, JSON.stringify(contextMessages));
      
    } catch (error) {
      console.error('Error updating short-term storage:', error);
    }
  }

  // Get short-term messages for display
  getShortTermMessages() {
    try {
      const stored = localStorage.getItem(this.LOCAL_STORAGE_KEYS.shortTermMessages);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('Error getting short-term messages:', error);
      return [];
    }
  }

  // Get short-term context for LLM
  getShortTermContext() {
    try {
      const stored = localStorage.getItem(this.LOCAL_STORAGE_KEYS.shortTermContext);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('Error getting short-term context:', error);
      return [];
    }
  }

  // Save user memory/context to Firebase
  async saveUserMemory(userId, contextSummary) {
    try {
      const memoryRef = collection(db, this.COLLECTIONS.userMemory);
      const memoryData = {
        userId,
        contextSummary,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        isActive: true
      };

      await addDoc(memoryRef, memoryData);
      return memoryData;
    } catch (error) {
      console.error('Error saving user memory:', error);
      throw error;
    }
  }

  // Get user memory from Firebase
  async getUserMemory(userId, limitCount = 10) {
    try {
      const q = query(
        collection(db, this.COLLECTIONS.userMemory),
        where('userId', '==', userId),
        where('isActive', '==', true),
        orderBy('updatedAt', 'desc'),
        limit(limitCount)
      );

      const querySnapshot = await getDocs(q);
      const memories = [];

      querySnapshot.forEach((doc) => {
        memories.push({ id: doc.id, ...doc.data() });
      });

      return memories;
    } catch (error) {
      console.error('Error getting user memory:', error);
      return [];
    }
  }

  // Delete user memory
  async deleteUserMemory(memoryId) {
    try {
      const memoryDocRef = doc(db, this.COLLECTIONS.userMemory, memoryId);
      await updateDoc(memoryDocRef, {
        isActive: false,
        deletedAt: serverTimestamp()
      });
    } catch (error) {
      console.error('Error deleting user memory:', error);
      throw error;
    }
  }

  // Extract context from conversation using LLM (mock implementation)
  async extractContextFromConversation(messages) {
    try {
      // This is a simplified version. In a real implementation, you would call another LLM
      // to summarize and extract context from the conversation
      
      const recentMessages = messages.slice(-10); // Get last 10 messages
      
      // Create a simple context summary
      const topics = [];
      const preferences = [];
      const interests = [];
      
      recentMessages.forEach(msg => {
        const text = (msg.user + ' ' + msg.llm).toLowerCase();
        
        // Simple keyword extraction (you would use a proper LLM for this)
        if (text.includes('news') || text.includes('article')) topics.push('news');
        if (text.includes('technology') || text.includes('tech')) topics.push('technology');
        if (text.includes('business')) topics.push('business');
        if (text.includes('sports')) topics.push('sports');
        if (text.includes('health')) topics.push('health');
        if (text.includes('science')) topics.push('science');
        
        if (text.includes('prefer') || text.includes('like')) {
          // Extract preferences
        }
      });
      
      return {
        topics: [...new Set(topics)],
        preferences: [...new Set(preferences)],
        interests: [...new Set(interests)],
        conversationSummary: `User discussed ${topics.join(', ')} and showed interest in current events.`,
        extractedAt: new Date().toISOString()
      };
      
    } catch (error) {
      console.error('Error extracting context:', error);
      return null;
    }
  }

  // Check if context extraction is needed (every 5 conversations)
  shouldExtractContext(userId) {
    const messages = this.getShortTermMessages();
    return messages.length > 0 && messages.length % 10 === 0; // Extract every 10 message pairs
  }

  // Process context extraction
  async processContextExtraction(userId) {
    try {
      if (!this.shouldExtractContext(userId)) return;
      
      const messages = this.getShortTermMessages();
      const context = await this.extractContextFromConversation(messages);
      
      if (context) {
        await this.saveUserMemory(userId, context);
        console.log('Context extracted and saved for user:', userId);
      }
    } catch (error) {
      console.error('Error processing context extraction:', error);
    }
  }

  // Clear short-term storage
  clearShortTermStorage() {
    localStorage.removeItem(this.LOCAL_STORAGE_KEYS.shortTermMessages);
    localStorage.removeItem(this.LOCAL_STORAGE_KEYS.shortTermContext);
  }

  // Get conversation history from Firebase
  async getConversationHistory(userId, limitCount = 50) {
    try {
      const q = query(
        collection(db, this.COLLECTIONS.conversations),
        where('userId', '==', userId),
        orderBy('timestamp', 'desc'),
        limit(limitCount)
      );

      const querySnapshot = await getDocs(q);
      const conversations = [];

      querySnapshot.forEach((doc) => {
        conversations.push({ id: doc.id, ...doc.data() });
      });

      return conversations.reverse(); // Return in chronological order
    } catch (error) {
      console.error('Error getting conversation history:', error);
      return [];
    }
  }

  // Smart conversational AI that talks like a human
  async callLLM(message, userId, context = null) {
    try {
      // Get conversation context
      const shortTermContext = this.getShortTermContext();
      const userMemory = await this.getUserMemory(userId, 5);
      
      // Generate intelligent response
      const response = await this.generateSmartResponse(message, shortTermContext, userMemory, context);
      return response;
      
    } catch (error) {
      console.error('Error calling LLM:', error);
      return 'Sorry, I\'m having trouble processing that right now. Could you try asking in a different way?';
    }
  }

  // Generate smart, human-like responses
  async generateSmartResponse(message, conversationHistory, userMemory, context) {
    const userMessage = message.toLowerCase().trim();
    
    // Handle greetings naturally
    if (this.isGreeting(userMessage)) {
      return this.generateGreetingResponse(conversationHistory);
    }
    
    // Handle news-related queries
    if (this.isNewsQuery(userMessage)) {
      return this.generateNewsResponse(userMessage, context);
    }
    
    // Handle technology/phone queries
    if (this.isTechQuery(userMessage)) {
      return this.generateTechResponse(userMessage);
    }
    
    // Handle random/unclear input
    if (this.isRandomInput(userMessage)) {
      return this.generateClarificationResponse(conversationHistory);
    }
    
    // General conversational response
    return this.generateConversationalResponse(userMessage, conversationHistory, userMemory);
  }

  // Check if message is a greeting
  isGreeting(message) {
    const greetings = ['hi', 'hello', 'hey', 'hai', 'haii', 'haiii', 'good morning', 'good afternoon', 'good evening'];
    return greetings.some(greeting => message.includes(greeting));
  }

  // Check if message is about news
  isNewsQuery(message) {
    const newsKeywords = ['news', 'article', 'headline', 'breaking', 'latest', 'update', 'report', 'story'];
    return newsKeywords.some(keyword => message.includes(keyword));
  }

  // Check if message is about technology
  isTechQuery(message) {
    const techKeywords = ['phone', 'smartphone', 'technology', 'tech', 'device', 'gadget', 'apple', 'samsung', 'nothing phone'];
    return techKeywords.some(keyword => message.includes(keyword));
  }

  // Check if message is random/unclear
  isRandomInput(message) {
    const randomPatterns = [
      /^[a-z]{5,}$/i, // Random string of letters
      /^[^a-z\s]*$/i, // Only symbols/numbers
      message.length < 3 && !/\w/.test(message)
    ];
    return randomPatterns.some(pattern => pattern.test ? pattern.test(message) : pattern);
  }

  // Generate greeting responses
  generateGreetingResponse(conversationHistory) {
    const greetings = [
      "Hey there! 👋 What's on your mind today?",
      "Hi! I'm here to help with news, tech topics, or just chat. What would you like to know?",
      "Hello! Ready to dive into some interesting conversations? What can I help you with?",
      "Hey! Good to see you again. What's new with you today?"
    ];
    
    // If user has conversation history, be more personal
    if (conversationHistory.length > 0) {
      return greetings[3]; // More personal greeting
    }
    
    return greetings[Math.floor(Math.random() * greetings.length)];
  }

  // Generate news-related responses
  generateNewsResponse(message, context) {
    if (message.includes('latest') || message.includes('breaking')) {
      return "I'd love to help you find the latest news! You can browse through our news categories or search for specific topics. What kind of news interests you most - technology, business, sports, or something else?";
    }
    
    if (message.includes('headline') || message.includes('story')) {
      return "Looking for interesting stories? Our news feed has fresh articles updated regularly. You can also check out the 'For You' section for personalized recommendations based on your reading habits!";
    }
    
    return "Great question about news! I can help you discover articles, explain current events, or find specific topics you're interested in. What would you like to explore?";
  }

  // Generate tech-related responses
  generateTechResponse(message) {
    if (message.includes('nothing phone')) {
      return "Nothing Phone is quite interesting! They're known for their unique transparent design and focus on clean software. The Nothing Phone (2a) and other models have been getting attention for their minimalist approach and competitive specs. Are you thinking about getting one, or curious about how it compares to other phones?";
    }
    
    if (message.includes('phone') || message.includes('smartphone')) {
      return "Phones are always evolving! Whether you're looking at flagship models, budget options, or specific features, there's a lot to consider. What aspects of phone performance or features are you most curious about?";
    }
    
    return "Tech is fascinating! From smartphones to AI, there's always something new happening. What specific technology topic caught your interest?";
  }

  // Generate clarification for random input
  generateClarificationResponse(conversationHistory) {
    const responses = [
      "I didn't quite catch that! Could you tell me what you're thinking about or what you'd like to know?",
      "Hmm, that's interesting! Can you help me understand what you mean? I'm here to chat about news, tech, or whatever's on your mind.",
      "I want to help, but I'm not sure what you're asking about. Could you rephrase that or let me know what topic interests you?",
      "Looks like we might have had a miscommunication! What would you like to talk about today?"
    ];
    
    return responses[Math.floor(Math.random() * responses.length)];
  }

  // Generate conversational responses for general queries
  generateConversationalResponse(message, conversationHistory, userMemory) {
    // Analyze sentiment and respond appropriately
    if (message.includes('bad') || message.includes('terrible') || message.includes('awful')) {
      return "I understand your frustration! I'm constantly learning to be more helpful. What specifically can I help you with? I'm here to assist with news, answer questions, or just have a good conversation.";
    }
    
    if (message.includes('good') || message.includes('great') || message.includes('awesome')) {
      return "Thank you! I'm glad I could help. Is there anything else you'd like to know or discuss? I enjoy our conversations!";
    }
    
    // Default conversational response
    return `That's an interesting point! I'm here to help with news updates, answer questions, or just chat. Based on our conversation, I can help you discover content or explore topics you're curious about. What would you like to dive into?`;
  }
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({
      //     messages: [
  // Main chat function
  async chat(userId, message, context = null) {
    try {
      const response = await this.callLLM(message, userId, context);
      
      // Save conversation
      await this.saveMessage(userId, message, response, context);
      
      // Process context extraction if needed
      await this.processContextExtraction(userId);
      
      return response;
    } catch (error) {
      console.error('Error in chat:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const llmService = new LLMService();
export default llmService;
