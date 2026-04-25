import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../Firebase';

// Test function to verify Firestore setup
export const testFirestoreSetup = async () => {
  try {
    console.log('🧪 Testing Firestore setup...');
    
    // Test writing to a test collection
    const testDocRef = doc(db, 'test', 'connection');
    await setDoc(testDocRef, {
      message: 'Firestore connection successful!',
      timestamp: serverTimestamp(),
      testPassed: true
    });
    
    console.log('✅ Firestore connection test passed!');
    console.log('📋 Collections will be created automatically when first used.');
    return true;
    
  } catch (error) {
    console.error('❌ Firestore connection test failed:', error);
    console.log('💡 Make sure your Firebase config is correct in .env');
    return false;
  }
};

// Call this in development to test
if (process.env.NODE_ENV === 'development') {
  // Uncomment to run test
  // testFirestoreSetup();
}

export default testFirestoreSetup;
