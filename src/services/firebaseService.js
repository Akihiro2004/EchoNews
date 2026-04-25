import {
  collection,
  doc,
  addDoc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  arrayUnion,
  arrayRemove,
  serverTimestamp,
  increment
} from 'firebase/firestore';
import { db } from '../Firebase';

// Collections
const COLLECTIONS = {
  users: 'users',
  customNews: 'customNews',
  favorites: 'favorites',
  readingHistory: 'readingHistory',
  userPreferences: 'userPreferences',
  aiAnalysis: 'aiAnalysis'
};

// User Profile Management
export const createUserProfile = async (user, additionalData = {}) => {
  try {
    const userDocRef = doc(db, COLLECTIONS.users, user.uid);
    const userData = {
      uid: user.uid,
      displayName: user.displayName || '',
      email: user.email,
      photoURL: user.photoURL || null,
      profileImageBase64: null, // For base64 profile images
      createdAt: serverTimestamp(),
      lastLoginAt: serverTimestamp(),
      preferences: {
        categories: ['general', 'technology', 'business'],
        sources: [],
        language: 'en',
        country: 'us',
        articlesPerPage: 20,
        theme: 'light'
      },
      stats: {
        articlesRead: 0,
        favoriteCount: 0,
        customNewsCount: 0
      },
      bio: '',
      location: '',
      website: '',
      social: {
        twitter: '',
        linkedin: '',
        github: ''
      },
      ...additionalData
    };

    await updateDoc(userDocRef, userData);
    return userData;
  } catch (error) {
    console.error('Error creating user profile:', error);
    throw error;
  }
};

export const getUserProfile = async (userId) => {
  try {
    const userDocRef = doc(db, COLLECTIONS.users, userId);
    const userDoc = await getDoc(userDocRef);
    
    if (userDoc.exists()) {
      return { id: userDoc.id, ...userDoc.data() };
    } else {
      return null;
    }
  } catch (error) {
    console.error('Error getting user profile:', error);
    throw error;
  }
};

// Update profile with base64 image support
export const updateUserProfile = async (userId, updates) => {
  try {
    const userDocRef = doc(db, COLLECTIONS.users, userId);
    const updateData = {
      ...updates,
      updatedAt: serverTimestamp()
    };
    
    await setDoc(userDocRef, updateData, { merge: true });
    return updateData;
  } catch (error) {
    console.error('Error updating user profile:', error);
    throw error;
  }
};

export const updateProfilePicture = async (userId, imageUrl) => {
  try {
    const userDocRef = doc(db, COLLECTIONS.users, userId);
    await setDoc(userDocRef, {
      profileImageUrl: imageUrl,
      updatedAt: serverTimestamp()
    }, { merge: true });
    return { success: true };
  } catch (error) {
    console.error('Error updating profile picture:', error);
    throw error;
  }
};

export const updateLastLogin = async (userId) => {
  try {
    const userDocRef = doc(db, COLLECTIONS.users, userId);
    await updateDoc(userDocRef, {
      lastLoginAt: serverTimestamp()
    });
  } catch (error) {
    console.error('Error updating last login:', error);
  }
};

// Custom News Management
export const createCustomNews = async (userId, newsData) => {
  try {
    const customNewsRef = collection(db, COLLECTIONS.customNews);
    const newsArticle = {
      ...newsData,
      authorId: userId,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      status: 'published',
      views: 0,
      likes: 0,
      comments: [],
      tags: newsData.tags || []
    };

    const docRef = await addDoc(customNewsRef, newsArticle);
    
    // Update user's custom news count
    const userDocRef = doc(db, COLLECTIONS.users, userId);
    await updateDoc(userDocRef, {
      'stats.customNewsCount': increment(1)
    });

    return { id: docRef.id, ...newsArticle };
  } catch (error) {
    console.error('Error creating custom news:', error);
    throw error;
  }
};

export const getCustomNews = async (options = {}) => {
  try {
    const {
      authorId = null,
      limit: limitCount = 20,
      startAfterDoc = null,
      orderByField = 'createdAt',
      orderDirection = 'desc'
    } = options;

    let q = query(
      collection(db, COLLECTIONS.customNews),
      where('isPublished', '==', true), // Only get published articles for public access
      orderBy(orderByField, orderDirection),
      limit(limitCount)
    );

    if (authorId) {
      q = query(
        collection(db, COLLECTIONS.customNews),
        where('authorId', '==', authorId),
        orderBy(orderByField, orderDirection),
        limit(limitCount)
      );
    }

    if (startAfterDoc) {
      q = query(q, startAfter(startAfterDoc));
    }

    const querySnapshot = await getDocs(q);
    const articles = [];

    querySnapshot.forEach((doc) => {
      articles.push({ id: doc.id, ...doc.data() });
    });

    return articles;
  } catch (error) {
    console.error('Error getting custom news:', error);
    // Return empty array instead of throwing error for permission issues
    if (error.code === 'permission-denied') {
      console.warn('Permission denied for custom news, returning empty array');
      return [];
    }
    throw error;
  }
};

export const getCustomNewsById = async (newsId) => {
  try {
    const newsDocRef = doc(db, COLLECTIONS.customNews, newsId);
    const newsDoc = await getDoc(newsDocRef);
    
    if (newsDoc.exists()) {
      // Increment view count
      await updateDoc(newsDocRef, {
        views: increment(1)
      });
      
      return { id: newsDoc.id, ...newsDoc.data() };
    } else {
      return null;
    }
  } catch (error) {
    console.error('Error getting custom news by ID:', error);
    throw error;
  }
};

export const updateCustomNews = async (newsId, updates) => {
  try {
    const newsDocRef = doc(db, COLLECTIONS.customNews, newsId);
    await updateDoc(newsDocRef, {
      ...updates,
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    console.error('Error updating custom news:', error);
    throw error;
  }
};

export const deleteCustomNews = async (newsId, userId) => {
  try {
    const newsDocRef = doc(db, COLLECTIONS.customNews, newsId);
    const newsDoc = await getDoc(newsDocRef);
    
    if (newsDoc.exists() && newsDoc.data().authorId === userId) {
      await deleteDoc(newsDocRef);
      
      // Update user's custom news count
      const userDocRef = doc(db, COLLECTIONS.users, userId);
      await updateDoc(userDocRef, {
        'stats.customNewsCount': increment(-1)
      });
      
      return true;
    } else {
      throw new Error('Unauthorized or news not found');
    }
  } catch (error) {
    console.error('Error deleting custom news:', error);
    throw error;
  }
};

// Favorites Management
export const addToFavorites = async (userId, article) => {
  try {
    const userFavoritesRef = collection(db, COLLECTIONS.users, userId, 'favorites');
    const favoriteData = {
      articleId: article.id,
      title: article.title,
      description: article.description,
      url: article.url,
      urlToImage: article.urlToImage,
      source: article.source,
      publishedAt: article.publishedAt,
      addedAt: serverTimestamp()
    };

    await addDoc(userFavoritesRef, favoriteData);
    
    // Update user's favorite count
    const userDocRef = doc(db, COLLECTIONS.users, userId);
    await updateDoc(userDocRef, {
      'stats.favoriteCount': increment(1)
    });
  } catch (error) {
    console.error('Error adding to favorites:', error);
    throw error;
  }
};

export const removeFromFavorites = async (userId, articleId) => {
  try {
    const userFavoritesRef = collection(db, COLLECTIONS.users, userId, 'favorites');
    const q = query(
      userFavoritesRef,
      where('articleId', '==', articleId)
    );

    const querySnapshot = await getDocs(q);
    querySnapshot.forEach(async (doc) => {
      await deleteDoc(doc.ref);
    });

    // Update user's favorite count
    const userDocRef = doc(db, COLLECTIONS.users, userId);
    await updateDoc(userDocRef, {
      'stats.favoriteCount': increment(-1)
    });
  } catch (error) {
    console.error('Error removing from favorites:', error);
    throw error;
  }
};

export const getUserFavorites = async (userId, limitCount = 20) => {
  try {
    const userFavoritesRef = collection(db, COLLECTIONS.users, userId, 'favorites');
    const q = query(
      userFavoritesRef,
      orderBy('addedAt', 'desc'),
      limit(limitCount)
    );

    const querySnapshot = await getDocs(q);
    const favorites = [];

    querySnapshot.forEach((doc) => {
      favorites.push({ id: doc.id, ...doc.data() });
    });

    return favorites;
  } catch (error) {
    console.error('Error getting user favorites:', error);
    throw error;
  }
};

export const isArticleFavorited = async (userId, articleId) => {
  try {
    const userFavoritesRef = collection(db, COLLECTIONS.users, userId, 'favorites');
    const q = query(
      userFavoritesRef,
      where('articleId', '==', articleId)
    );

    const querySnapshot = await getDocs(q);
    return !querySnapshot.empty;
  } catch (error) {
    console.error('Error checking if article is favorited:', error);
    return false;
  }
};

// Reading History Management
export const addToReadingHistory = async (userId, article) => {
  try {
    const userHistoryRef = collection(db, COLLECTIONS.users, userId, 'readingHistory');
    const historyData = {
      articleId: article.id,
      title: article.title,
      category: article.category || 'general',
      source: article.source,
      readAt: serverTimestamp()
    };

    await addDoc(userHistoryRef, historyData);
    
    // Update user's articles read count
    const userDocRef = doc(db, COLLECTIONS.users, userId);
    await updateDoc(userDocRef, {
      'stats.articlesRead': increment(1)
    });
  } catch (error) {
    console.error('Error adding to reading history:', error);
  }
};

export const getUserReadingHistory = async (userId, limitCount = 50) => {
  try {
    const userHistoryRef = collection(db, COLLECTIONS.users, userId, 'readingHistory');
    const q = query(
      userHistoryRef,
      orderBy('readAt', 'desc'),
      limit(limitCount)
    );

    const querySnapshot = await getDocs(q);
    const history = [];

    querySnapshot.forEach((doc) => {
      history.push({ id: doc.id, ...doc.data() });
    });

    return history;
  } catch (error) {
    console.error('Error getting reading history:', error);
    throw error;
  }
};

// User Preferences Management
export const updateUserPreferences = async (userId, preferences) => {
  try {
    const userDocRef = doc(db, COLLECTIONS.users, userId);
    await updateDoc(userDocRef, {
      preferences: {
        ...preferences
      },
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    console.error('Error updating user preferences:', error);
    throw error;
  }
};

export const getUserPreferences = async (userId) => {
  try {
    const userProfile = await getUserProfile(userId);
    return userProfile?.preferences || {
      categories: ['general'],
      sources: [],
      language: 'en',
      country: 'us',
      articlesPerPage: 20
    };
  } catch (error) {
    console.error('Error getting user preferences:', error);
    return {
      categories: ['general'],
      sources: [],
      language: 'en',
      country: 'us',
      articlesPerPage: 20
    };
  }
};

// Analytics and Recommendations
export const getUserAnalytics = async (userId) => {
  try {
    const readingHistory = await getUserReadingHistory(userId, 100);
    const categories = {};
    const sources = {};
    
    readingHistory.forEach(item => {
      // Count categories
      const category = item.category || 'general';
      categories[category] = (categories[category] || 0) + 1;
      
      // Count sources
      const sourceName = item.source?.name || 'Unknown';
      sources[sourceName] = (sources[sourceName] || 0) + 1;
    });

    return {
      totalArticlesRead: readingHistory.length,
      topCategories: Object.entries(categories)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 5)
        .map(([category, count]) => ({ category, count })),
      topSources: Object.entries(sources)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 5)
        .map(([source, count]) => ({ source, count })),
      readingHistory
    };
  } catch (error) {
    console.error('Error getting user analytics:', error);
    throw error;
  }
};
// AI Analysis Caching
export const saveAIAnalysis = async (articleId, type, data) => {
  try {
    const cleanId = articleId.replace(/[^a-zA-Z0-9]/g, '_').substring(0, 500);
    const aiDocRef = doc(db, COLLECTIONS.aiAnalysis, cleanId);
    
    const updateData = {
      [type]: data,
      lastUpdated: serverTimestamp()
    };
    
    await setDoc(aiDocRef, updateData, { merge: true });
    return true;
  } catch (error) {
    console.error(`Error saving AI ${type}:`, error);
    return false;
  }
};

export const getAIAnalysis = async (articleId) => {
  try {
    const cleanId = articleId.replace(/[^a-zA-Z0-9]/g, '_').substring(0, 500);
    const aiDocRef = doc(db, COLLECTIONS.aiAnalysis, cleanId);
    const aiDoc = await getDoc(aiDocRef);
    
    if (aiDoc.exists()) {
      return aiDoc.data();
    }
    return null;
  } catch (error) {
    console.error('Error getting AI analysis:', error);
    return null;
  }
};
