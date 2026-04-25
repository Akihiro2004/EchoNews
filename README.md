# 🗞️ Echo News - Modern News Application

A modern, AI-powered news application built with React, Firebase, and multiple news APIs. Features personalized recommendations, AI-driven article analysis, and a beautiful modern UI.

## ✨ Features

- **Multi-source News Aggregation**: Guardian, NewsAPI.org, and NewsData.io
- **AI-Powered Features**: Article analysis, summaries, and Q&A using Google Gemini 2.5 Flash
- **User Authentication**: Email/password and Google OAuth
- **Personalization**: Favorites, reading history, and personalized recommendations
- **Custom News Creation**: Rich text editor for creating your own news articles
- **Modern UI**: Glassmorphism design with responsive layout
- **Real-time Updates**: Firebase integration for user data and custom content

## 🚀 Quick Start

### Prerequisites

- Node.js 14+ and npm
- Firebase project
- API keys for news services and Google Gemini

### Installation

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd echo-news
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables**
   ```bash
   cp .env.example .env
   ```
   Then edit `.env` with your actual API keys (see API Setup section below).

4. **Start the development server**
   ```bash
   npm start
   ```

## 🔑 API Setup Guide

### 1. Firebase Configuration

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a new project or select existing project
3. Go to **Project Settings > General**
4. Scroll down to "Your apps" section
5. Click **"Add app"** and select **Web app**
6. Copy the config values to your `.env` file:
   ```env
   REACT_APP_FIREBASE_API_KEY=your-api-key
   REACT_APP_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
   REACT_APP_FIREBASE_PROJECT_ID=your-project-id
   REACT_APP_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
   REACT_APP_FIREBASE_MESSAGING_SENDER_ID=123456789
   REACT_APP_FIREBASE_APP_ID=1:123:web:abc123
   ```

7. **Enable Firebase services:**
   - **Authentication**: Go to Authentication > Sign-in method
     - Enable Email/Password
     - Enable Google sign-in
   - **Firestore**: Go to Firestore Database > Create database
     - Start in test mode (configure security rules later)

### 2. Google Gemini AI Setup

1. Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Sign in with your Google account
3. Click **"Create API key"**
4. Copy the API key to your `.env`:
   ```env
   REACT_APP_GOOGLE_GEMINI_API_KEY=your-gemini-api-key
   ```

### 3. Guardian API Setup

1. Go to [Guardian Open Platform](https://open-platform.theguardian.com/access/)
2. Register for a developer key
3. Copy the API key to your `.env`:
   ```env
   REACT_APP_GUARDIAN_API_KEY=your-guardian-api-key
   ```

### 4. NewsAPI.org Setup

1. Go to [NewsAPI.org](https://newsapi.org/)
2. Sign up for a free account
3. Get your API key from the dashboard
4. Copy the API key to your `.env`:
   ```env
   REACT_APP_NEWS_API_KEY=your-newsapi-key
   ```

### 5. NewsData.io Setup

1. Go to [NewsData.io](https://newsdata.io/)
2. Sign up for a free account
3. Get your API key from the dashboard
4. Copy the API key to your `.env`:
   ```env
   REACT_APP_NEWSDATA_API_KEY=your-newsdata-key
   ```

## 📁 Project Structure

```
echo-news/
├── public/
├── src/
│   ├── components/          # Reusable UI components
│   │   ├── Auth.css
│   │   ├── CategoryFilter.js
│   │   ├── LoadingSpinner.js
│   │   ├── Login.js
│   │   ├── Navbar.js
│   │   ├── NewsCard.js
│   │   ├── ProtectedRoute.js
│   │   └── Register.js
│   ├── config/              # Configuration utilities
│   │   └── environment.js
│   ├── pages/               # Main application pages
│   │   ├── AdminPanel.js
│   │   ├── Favorites.js
│   │   ├── ForYou.js
│   │   ├── Home.js
│   │   ├── NewsDetail.js
│   │   └── Profile.js
│   ├── services/            # API and business logic
│   │   ├── aiService.js
│   │   ├── firebaseService.js
│   │   └── newsService.js
│   ├── App.js
│   ├── App.css
│   ├── Firebase.js
│   └── index.js
├── .env.example
├── .env
└── package.json
```

## 🎨 UI Features

- **Modern Design**: Glassmorphism effects with gradient backgrounds
- **Responsive**: Mobile-first design that works on all devices
- **Dark Mode Ready**: Easy to extend with dark mode support
- **Animations**: Smooth transitions and hover effects
- **Accessibility**: ARIA labels and keyboard navigation

## 🤖 AI Features

- **Article Analysis**: Get insights and summaries of news articles
- **Interactive Q&A**: Ask questions about specific articles
- **Personalized Recommendations**: AI-powered content suggestions
- **Fact Checking**: Context and verification assistance
- **Discussion Questions**: Generate engaging discussion points

## 🔒 Security

- **Environment Variables**: All API keys stored securely
- **Firebase Security Rules**: Configure Firestore access rules
- **Input Validation**: Form validation and sanitization
- **Authentication**: Secure user sessions and protected routes

## 📱 Mobile Support

- Fully responsive design
- Touch-friendly interface
- Progressive Web App ready
- Optimized for mobile performance

## 🛠️ Development

### Available Scripts

- `npm start` - Start development server
- `npm build` - Build for production
- `npm test` - Run tests
- `npm eject` - Eject from Create React App

### Environment Validation

The app automatically validates your environment configuration on startup. Check the browser console for any missing or invalid API keys.

## 🚀 Deployment

### Firebase Hosting

1. Install Firebase CLI: `npm install -g firebase-tools`
2. Login: `firebase login`
3. Initialize: `firebase init hosting`
4. Build: `npm run build`
5. Deploy: `firebase deploy`

### Vercel

1. Install Vercel CLI: `npm install -g vercel`
2. Run: `vercel`
3. Follow the prompts

## 📄 License

This project is licensed under the MIT License.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📞 Support

If you have any questions or need help setting up the application, please create an issue on GitHub.

---

**Built with ❤️ using React, Firebase, and modern web technologies.**

### Code Splitting

This section has moved here: [https://facebook.github.io/create-react-app/docs/code-splitting](https://facebook.github.io/create-react-app/docs/code-splitting)

### Analyzing the Bundle Size

This section has moved here: [https://facebook.github.io/create-react-app/docs/analyzing-the-bundle-size](https://facebook.github.io/create-react-app/docs/analyzing-the-bundle-size)

### Making a Progressive Web App

This section has moved here: [https://facebook.github.io/create-react-app/docs/making-a-progressive-web-app](https://facebook.github.io/create-react-app/docs/making-a-progressive-web-app)

### Advanced Configuration

This section has moved here: [https://facebook.github.io/create-react-app/docs/advanced-configuration](https://facebook.github.io/create-react-app/docs/advanced-configuration)

### Deployment

This section has moved here: [https://facebook.github.io/create-react-app/docs/deployment](https://facebook.github.io/create-react-app/docs/deployment)

### `npm run build` fails to minify

This section has moved here: [https://facebook.github.io/create-react-app/docs/troubleshooting#npm-run-build-fails-to-minify](https://facebook.github.io/create-react-app/docs/troubleshooting#npm-run-build-fails-to-minify)
