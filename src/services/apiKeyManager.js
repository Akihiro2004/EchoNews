// Google Gemini API Key Rotation Manager
class GeminiAPIManager {
  constructor() {
    // Load all API keys from environment
    this.apiKeys = this.loadAPIKeys();
    this.currentKeyIndex = 0;
    this.keyUsageStats = {};
    this.blacklistedKeys = new Set();
    this.keyRotationLog = [];
    
    // Initialize usage stats for each key
    this.apiKeys.forEach((key, index) => {
      this.keyUsageStats[index] = {
        requests: 0,
        errors: 0,
        lastUsed: null,
        lastError: null,
        isHealthy: true,
        rateLimitHit: false,
        quotaExceeded: false
      };
    });

    console.log(`🔑 Gemini API Manager initialized with ${this.apiKeys.length} keys`);
  }

  // Load API keys from environment variables
  loadAPIKeys() {
    const keys = [];
    
    // Try to load numbered keys first (REACT_APP_GOOGLE_GEMINI_API_KEY_1, _2, etc.)
    for (let i = 1; i <= 10; i++) {
      const key = process.env[`REACT_APP_GOOGLE_GEMINI_API_KEY_${i}`];
      if (key && key !== 'your-google-gemini-api-key-here') {
        keys.push(key);
      }
    }
    
    // Fallback to single key if no numbered keys found
    if (keys.length === 0) {
      const singleKey = process.env.REACT_APP_GOOGLE_GEMINI_API_KEY;
      if (singleKey && singleKey !== 'your-google-gemini-api-key-here') {
        keys.push(singleKey);
      }
    }
    
    if (keys.length === 0) {
      console.error('❌ No valid Gemini API keys found in environment variables');
      throw new Error('No valid Gemini API keys configured');
    }
    
    return keys;
  }

  // Get current active API key
  getCurrentAPIKey() {
    if (this.apiKeys.length === 0) {
      throw new Error('No API keys available');
    }

    // Find next healthy key
    let attempts = 0;
    while (attempts < this.apiKeys.length) {
      const keyIndex = (this.currentKeyIndex + attempts) % this.apiKeys.length;
      const key = this.apiKeys[keyIndex];
      
      if (!this.blacklistedKeys.has(keyIndex) && this.keyUsageStats[keyIndex].isHealthy) {
        this.currentKeyIndex = keyIndex;
        return {
          key,
          index: keyIndex,
          stats: this.keyUsageStats[keyIndex]
        };
      }
      
      attempts++;
    }

    // If all keys are unhealthy, reset health status and try again
    console.warn('⚠️ All API keys marked as unhealthy, resetting health status');
    this.resetHealthStatus();
    
    return {
      key: this.apiKeys[this.currentKeyIndex],
      index: this.currentKeyIndex,
      stats: this.keyUsageStats[this.currentKeyIndex]
    };
  }

  // Record successful API usage
  recordSuccess(keyIndex) {
    if (this.keyUsageStats[keyIndex]) {
      this.keyUsageStats[keyIndex].requests++;
      this.keyUsageStats[keyIndex].lastUsed = new Date();
      this.keyUsageStats[keyIndex].isHealthy = true;
      this.keyUsageStats[keyIndex].rateLimitHit = false;
    }
  }

  // Record API error and handle key rotation
  recordError(keyIndex, error) {
    if (!this.keyUsageStats[keyIndex]) return;

    const stats = this.keyUsageStats[keyIndex];
    stats.errors++;
    stats.lastError = new Date();
    stats.lastErrorMessage = error.message;

    // Check error type and handle accordingly
    if (this.isRateLimitError(error)) {
      console.warn(`⚠️ Rate limit hit for API key ${keyIndex + 1}, rotating...`);
      stats.rateLimitHit = true;
      stats.isHealthy = false;
      this.rotateToNextKey();
      
      // Re-enable after cooldown period
      setTimeout(() => {
        stats.rateLimitHit = false;
        stats.isHealthy = true;
        console.log(`✅ API key ${keyIndex + 1} re-enabled after cooldown`);
      }, 60000); // 1 minute cooldown
      
    } else if (this.isQuotaExceededError(error)) {
      console.error(`❌ Quota exceeded for API key ${keyIndex + 1}, blacklisting...`);
      stats.quotaExceeded = true;
      stats.isHealthy = false;
      this.blacklistedKeys.add(keyIndex);
      this.rotateToNextKey();
      
    } else if (this.isInvalidKeyError(error)) {
      console.error(`❌ Invalid API key ${keyIndex + 1}, blacklisting...`);
      stats.isHealthy = false;
      this.blacklistedKeys.add(keyIndex);
      this.rotateToNextKey();
      
    } else {
      // Generic error - mark as unhealthy temporarily
      stats.isHealthy = false;
      
      // Re-enable after short cooldown for generic errors
      setTimeout(() => {
        stats.isHealthy = true;
        console.log(`✅ API key ${keyIndex + 1} re-enabled after error cooldown`);
      }, 30000); // 30 seconds cooldown
    }

    this.logRotation(keyIndex, error.message);
  }

  // Rotate to next available key
  rotateToNextKey() {
    const oldIndex = this.currentKeyIndex;
    this.currentKeyIndex = (this.currentKeyIndex + 1) % this.apiKeys.length;
    
    console.log(`🔄 Rotated from API key ${oldIndex + 1} to ${this.currentKeyIndex + 1}`);
    return this.getCurrentAPIKey();
  }

  // Check if error is rate limit related
  isRateLimitError(error) {
    const errorMessage = error.message.toLowerCase();
    return errorMessage.includes('rate limit') || 
           errorMessage.includes('too many requests') ||
           errorMessage.includes('429') ||
           error.status === 429;
  }

  // Check if error is quota exceeded
  isQuotaExceededError(error) {
    const errorMessage = error.message.toLowerCase();
    return errorMessage.includes('quota exceeded') ||
           errorMessage.includes('billing') ||
           errorMessage.includes('payment') ||
           error.status === 403;
  }

  // Check if error is invalid API key
  isInvalidKeyError(error) {
    const errorMessage = error.message.toLowerCase();
    return errorMessage.includes('invalid api key') ||
           errorMessage.includes('unauthorized') ||
           errorMessage.includes('forbidden') ||
           error.status === 401;
  }

  // Reset health status for all keys
  resetHealthStatus() {
    Object.keys(this.keyUsageStats).forEach(keyIndex => {
      if (!this.blacklistedKeys.has(parseInt(keyIndex))) {
        this.keyUsageStats[keyIndex].isHealthy = true;
        this.keyUsageStats[keyIndex].rateLimitHit = false;
      }
    });
  }

  // Log rotation event
  logRotation(keyIndex, reason) {
    const logEntry = {
      timestamp: new Date(),
      fromKey: keyIndex + 1,
      toKey: this.currentKeyIndex + 1,
      reason: reason,
      totalRequests: this.keyUsageStats[keyIndex].requests
    };
    
    this.keyRotationLog.push(logEntry);
    
    // Keep only last 50 rotation events
    if (this.keyRotationLog.length > 50) {
      this.keyRotationLog = this.keyRotationLog.slice(-50);
    }
  }

  // Get usage statistics
  getUsageStats() {
    const totalRequests = Object.values(this.keyUsageStats)
      .reduce((sum, stats) => sum + stats.requests, 0);
    
    const healthyKeys = Object.values(this.keyUsageStats)
      .filter(stats => stats.isHealthy).length;
    
    const blacklistedCount = this.blacklistedKeys.size;
    
    return {
      totalKeys: this.apiKeys.length,
      healthyKeys: healthyKeys,
      blacklistedKeys: blacklistedCount,
      currentKeyIndex: this.currentKeyIndex + 1,
      totalRequests: totalRequests,
      keyStats: this.keyUsageStats,
      rotationLog: this.keyRotationLog.slice(-10), // Last 10 rotations
      lastRotation: this.keyRotationLog[this.keyRotationLog.length - 1]
    };
  }

  // Test all API keys health
  async testAllKeys() {
    console.log('🧪 Testing all Gemini API keys...');
    const results = [];
    
    for (let i = 0; i < this.apiKeys.length; i++) {
      try {
        // Simple test request to each key
        const testResult = await this.testSingleKey(this.apiKeys[i], i);
        results.push({
          keyIndex: i + 1,
          status: 'healthy',
          ...testResult
        });
        
        this.keyUsageStats[i].isHealthy = true;
        this.blacklistedKeys.delete(i);
        
      } catch (error) {
        results.push({
          keyIndex: i + 1,
          status: 'error',
          error: error.message
        });
        
        this.recordError(i, error);
      }
    }
    
    console.log('📊 API Key Test Results:', results);
    return results;
  }

  // Test single key (implement based on your needs)
  async testSingleKey(apiKey, keyIndex) {
    // This would make a simple test request to Gemini API
    // For now, returning a mock result
    return {
      responseTime: Math.random() * 1000,
      tested: true
    };
  }

  // Get next rotation recommendation
  getRotationRecommendation() {
    const currentStats = this.keyUsageStats[this.currentKeyIndex];
    
    if (!currentStats.isHealthy) {
      return { shouldRotate: true, reason: 'Current key is unhealthy' };
    }
    
    if (currentStats.rateLimitHit) {
      return { shouldRotate: true, reason: 'Rate limit hit' };
    }
    
    if (currentStats.requests > 1000) { // Rotate after 1000 requests
      return { shouldRotate: true, reason: 'High usage, preventive rotation' };
    }
    
    return { shouldRotate: false, reason: 'Current key is healthy' };
  }

  // Manual key rotation for testing
  forceRotation(reason = 'Manual rotation') {
    const oldIndex = this.currentKeyIndex;
    this.rotateToNextKey();
    this.logRotation(oldIndex, reason);
    return this.getCurrentAPIKey();
  }
}

// Create singleton instance
const geminiAPIManager = new GeminiAPIManager();

// Export for use in aiService
export default geminiAPIManager;

// Export utility functions
export const {
  getCurrentAPIKey: getCurrentGeminiKey,
  recordSuccess: recordGeminiSuccess,
  recordError: recordGeminiError,
  getUsageStats: getGeminiUsageStats,
  testAllKeys: testAllGeminiKeys,
  forceRotation: forceGeminiRotation
} = geminiAPIManager;
