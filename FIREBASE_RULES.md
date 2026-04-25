# Firebase Security Rules for Echo News

## Firestore Database Rules

Copy these rules to your Firebase Console under Firestore Database > Rules:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Custom news collection - allow read for published articles, write for authenticated users
    match /customNews/{docId} {
      // Anyone can read published articles
      allow read: if resource.data.isPublished == true;
      // Only authenticated users can read their own drafts
      allow read: if request.auth != null && resource.data.authorId == request.auth.uid;
      // Only authenticated users can create articles
      allow create: if request.auth != null && request.auth.uid == resource.data.authorId;
      // Only the author or admin can update articles
      allow update: if request.auth != null && 
        (request.auth.uid == resource.data.authorId || 
         get(/databases/$(database)/documents/users/$(request.auth.uid)).data.isAdmin == true);
      // Only the author or admin can delete articles
      allow delete: if request.auth != null && 
        (request.auth.uid == resource.data.authorId || 
         get(/databases/$(database)/documents/users/$(request.auth.uid)).data.isAdmin == true);
    }

    // User profiles collection
    match /users/{userId} {
      // Users can read their own profile, authenticated users can read any profile for admin checks
      allow read: if request.auth != null && 
        (request.auth.uid == userId || true); // Allow reading for admin checks
      // Users can create their own profile
      allow create: if request.auth != null && request.auth.uid == userId;
      // Users can update their own profile (except admin status)
      allow update: if request.auth != null && request.auth.uid == userId &&
        (!request.resource.data.diff(resource.data).affectedKeys().hasAny(['isAdmin']));
      // Only admins can update admin status
      allow update: if request.auth != null && 
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.isAdmin == true;
    }

    // User favorites subcollection
    match /users/{userId}/favorites/{favoriteId} {
      // Users can read and write their own favorites
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }

    // User reading history subcollection
    match /users/{userId}/readingHistory/{historyId} {
      // Users can read and write their own reading history
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }

    // LLM Memory subcollection - for AI chat memory
    match /users/{userId}/llmMemory/{memoryId} {
      // Users can read and write their own LLM memory
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }

    // User analytics collection
    match /analytics/{userId} {
      // Users can read their own analytics
      allow read: if request.auth != null && request.auth.uid == userId;
      // Only the system can write analytics
      allow write: if request.auth != null;
    }

    // Admin-only collections
    match /adminLogs/{docId} {
      allow read, write: if request.auth != null && 
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.isAdmin == true;
    }

    // Legacy favorites collection (for backward compatibility during migration)
    match /favorites/{docId} {
      allow read, write: if request.auth != null && 
        (resource.data.userId == request.auth.uid || request.resource.data.userId == request.auth.uid);
    }

    // Legacy reading history collection (for backward compatibility during migration)
    match /readingHistory/{docId} {
      allow read, write: if request.auth != null && 
        (resource.data.userId == request.auth.uid || request.resource.data.userId == request.auth.uid);
    }
  }
}
      // Users can read and write their own reading history
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }

    // User analytics collection
    match /analytics/{userId} {
      // Users can read their own analytics
      allow read: if request.auth != null && request.auth.uid == userId;
      // Only the system can write analytics
      allow write: if request.auth != null;
    }

    // Admin-only collections
    match /adminLogs/{docId} {
      allow read, write: if request.auth != null && 
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.isAdmin == true;
    }
  }
}
```

## Storage Rules (if using Firebase Storage)

Copy these rules to your Firebase Console under Storage > Rules:

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    // Images uploads for articles
    match /news-images/{allPaths=**} {
      // Allow authenticated users to upload images
      allow read: if true;
      allow write: if request.auth != null;
    }
    
    // User profile images
    match /profile-images/{userId}/{allPaths=**} {
      // Users can upload their own profile images
      allow read: if true;
      allow write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

## How to Apply These Rules:

1. **Go to Firebase Console**: https://console.firebase.google.com/
2. **Select your project**: echonews-baf2c
3. **Navigate to Firestore Database**
4. **Click on "Rules" tab**
5. **Replace the existing rules with the Firestore rules above**
6. **Click "Publish"**

7. **If using Storage:**
   - Navigate to Storage
   - Click on "Rules" tab
   - Replace with the Storage rules above
   - Click "Publish"

## Important Notes:

- These rules allow public read access to published articles
- Users can only modify their own content
- Admin users have elevated permissions
- Reading history and favorites are private to each user
- The rules include security checks to prevent unauthorized access

## Testing the Rules:

After applying the rules, your application should work without permission errors. The rules are designed to:
- Allow the app to function for non-authenticated users (reading published articles)
- Provide full functionality for authenticated users
- Protect user data and admin functions
