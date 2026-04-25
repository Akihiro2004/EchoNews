// Environment configuration and validation
const requiredEnvVars = {
  // Firebase Configuration
  REACT_APP_FIREBASE_API_KEY: 'Firebase API Key',
  REACT_APP_FIREBASE_AUTH_DOMAIN: 'Firebase Auth Domain',
  REACT_APP_FIREBASE_PROJECT_ID: 'Firebase Project ID',
  REACT_APP_FIREBASE_STORAGE_BUCKET: 'Firebase Storage Bucket',
  REACT_APP_FIREBASE_MESSAGING_SENDER_ID: 'Firebase Messaging Sender ID',
  REACT_APP_FIREBASE_APP_ID: 'Firebase App ID',
  
  // AI Configuration
  REACT_APP_GOOGLE_GEMINI_API_KEY: 'Google Gemini API Key',
  
  // News API Configuration
  REACT_APP_GUARDIAN_API_KEY: 'Guardian API Key',
  REACT_APP_NEWS_API_KEY: 'NewsAPI.org API Key',
  REACT_APP_NEWSDATA_API_KEY: 'NewsData.io API Key'
};

const optionalEnvVars = {
  REACT_APP_APP_NAME: 'Echo News',
  REACT_APP_APP_VERSION: '1.0.0',
  REACT_APP_BASE_URL: 'http://localhost:3000',
  REACT_APP_ENVIRONMENT: 'development',
  REACT_APP_DEBUG_MODE: 'false'
};

// Validate environment variables
export const validateEnvironment = () => {
  const missingVars = [];
  const invalidVars = [];

  // Check required variables
  Object.entries(requiredEnvVars).forEach(([key, description]) => {
    const value = process.env[key];
    if (!value || value === `your-${key.toLowerCase().replace('react_app_', '').replace(/_/g, '-')}-here`) {
      missingVars.push({ key, description });
    }
  });

  // Check for placeholder values
  Object.entries(requiredEnvVars).forEach(([key, description]) => {
    const value = process.env[key];
    if (value && (
      value.includes('your-') || 
      value.includes('placeholder') || 
      value.includes('replace-with') ||
      value === 'your-project-id' ||
      value === 'your-project-id.firebaseapp.com' ||
      value === 'your-project-id.appspot.com'
    )) {
      invalidVars.push({ key, description, value });
    }
  });

  return {
    isValid: missingVars.length === 0 && invalidVars.length === 0,
    missingVars,
    invalidVars
  };
};

// Get configuration with defaults
export const getConfig = () => {
  const validation = validateEnvironment();
  
  if (!validation.isValid) {
    console.warn('⚠️ Echo News Configuration Issues:');
    
    if (validation.missingVars.length > 0) {
      console.warn('\n📋 Missing Environment Variables:');
      validation.missingVars.forEach(({ key, description }) => {
        console.warn(`  - ${key}: ${description}`);
      });
    }
    
    if (validation.invalidVars.length > 0) {
      console.warn('\n🔧 Invalid Environment Variables (still using placeholder values):');
      validation.invalidVars.forEach(({ key, description }) => {
        console.warn(`  - ${key}: ${description}`);
      });
    }
    
    console.warn('\n💡 Please update your .env file with valid API keys.');
    console.warn('📖 See .env.example for reference and API key setup instructions.');
  }

  return {
    // Firebase
    firebase: {
      apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
      authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
      projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
      storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
      messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
      appId: process.env.REACT_APP_FIREBASE_APP_ID
    },
    
    // AI
    ai: {
      geminiApiKey: process.env.REACT_APP_GOOGLE_GEMINI_API_KEY
    },
    
    // News APIs
    news: {
      guardianApiKey: process.env.REACT_APP_GUARDIAN_API_KEY,
      newsApiKey: process.env.REACT_APP_NEWS_API_KEY,
      newsDataApiKey: process.env.REACT_APP_NEWSDATA_API_KEY
    },
    
    // App Configuration
    app: {
      name: process.env.REACT_APP_APP_NAME || optionalEnvVars.REACT_APP_APP_NAME,
      version: process.env.REACT_APP_APP_VERSION || optionalEnvVars.REACT_APP_APP_VERSION,
      baseUrl: process.env.REACT_APP_BASE_URL || optionalEnvVars.REACT_APP_BASE_URL,
      environment: process.env.REACT_APP_ENVIRONMENT || optionalEnvVars.REACT_APP_ENVIRONMENT,
      debugMode: process.env.REACT_APP_DEBUG_MODE === 'true'
    },
    
    // Validation result
    validation
  };
};

// API Key setup instructions
export const getAPIKeyInstructions = () => {
  return {
    firebase: {
      title: 'Firebase Setup',
      instructions: [
        '1. Go to https://console.firebase.google.com/',
        '2. Create a new project or select existing project',
        '3. Go to Project Settings > General',
        '4. Scroll down to "Your apps" section',
        '5. Click "Add app" and select Web app',
        '6. Copy the config values to your .env file',
        '7. Enable Authentication and Firestore in Firebase console'
      ],
      docs: 'https://firebase.google.com/docs/web/setup'
    },
    
    gemini: {
      title: 'Google Gemini AI Setup',
      instructions: [
        '1. Go to https://makersuite.google.com/app/apikey',
        '2. Sign in with your Google account',
        '3. Click "Create API key"',
        '4. Copy the API key to REACT_APP_GOOGLE_GEMINI_API_KEY in .env'
      ],
      docs: 'https://ai.google.dev/tutorials/setup'
    },
    
    guardian: {
      title: 'Guardian API Setup',
      instructions: [
        '1. Go to https://open-platform.theguardian.com/access/',
        '2. Register for a developer key',
        '3. Copy the API key to REACT_APP_GUARDIAN_API_KEY in .env'
      ],
      docs: 'https://open-platform.theguardian.com/documentation/'
    },
    
    newsapi: {
      title: 'NewsAPI.org Setup',
      instructions: [
        '1. Go to https://newsapi.org/',
        '2. Sign up for a free account',
        '3. Get your API key from the dashboard',
        '4. Copy the API key to REACT_APP_NEWS_API_KEY in .env'
      ],
      docs: 'https://newsapi.org/docs'
    },
    
    newsdata: {
      title: 'NewsData.io Setup',
      instructions: [
        '1. Go to https://newsdata.io/',
        '2. Sign up for a free account',
        '3. Get your API key from the dashboard',
        '4. Copy the API key to REACT_APP_NEWSDATA_API_KEY in .env'
      ],
      docs: 'https://newsdata.io/docs'
    }
  };
};

// Development helper to show configuration status
export const showConfigStatus = () => {
  if (process.env.REACT_APP_DEBUG_MODE === 'true') {
    const config = getConfig();
    console.log('🔧 Echo News Configuration Status:', config.validation);
  }
};

export default {
  validateEnvironment,
  getConfig,
  getAPIKeyInstructions,
  showConfigStatus
};
