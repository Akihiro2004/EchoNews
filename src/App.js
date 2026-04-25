import React, { useState, useEffect, createContext, useContext } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from './Firebase';
import { AuthProvider } from './contexts/AuthContext';
import './App.css';

import Sidebar from './components/Sidebar';
import AuthModal from './components/AuthModal';

import Home from './pages/Home';
import NewsDetail from './pages/NewsDetail';
import AdminPanel from './pages/AdminPanel';
import Profile from './pages/Profile';
import Favorites from './pages/Favorites';
import ForYou from './pages/ForYou';

export const UIContext = createContext({
  openAuth: () => {},
  closeAuth: () => {},
  currentArticle: null,
  setCurrentArticle: () => {},
});

export const useUI = () => useContext(UIContext);

function AppContent() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authOpen, setAuthOpen] = useState(false);
  const [authMode, setAuthMode] = useState('signin');
  const [currentArticle, setCurrentArticle] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
    });
    return unsub;
  }, []);

  const openAuth = (mode = 'signin') => {
    setAuthMode(mode);
    setAuthOpen(true);
  };

  if (loading) {
    return (
      <div className="app-loader">
        <div className="app-loader-spinner" />
        <p>Loading Echo News</p>
      </div>
    );
  }

  return (
    <UIContext.Provider value={{ openAuth, closeAuth: () => setAuthOpen(false), currentArticle, setCurrentArticle }}>
      <div className="app-shell">
        {/* Mobile overlay */}
        {sidebarOpen && (
          <div className="sidebar-overlay" onClick={() => setSidebarOpen(false)} />
        )}

        <Sidebar
          user={user}
          onOpenAuth={openAuth}
          mobileOpen={sidebarOpen}
          onMobileClose={() => setSidebarOpen(false)}
          onMobileOpen={() => setSidebarOpen(true)}
        />

        <main className="app-main">
          <Routes>
            <Route path="/" element={<Home user={user} onOpenAuth={openAuth} onMenuOpen={() => setSidebarOpen(true)} />} />
            <Route path="/news/:articleId" element={<NewsDetail user={user} onOpenAuth={openAuth} onMenuOpen={() => setSidebarOpen(true)} />} />
            <Route path="/for-you" element={
              user
                ? <ForYou user={user} onMenuOpen={() => setSidebarOpen(true)} />
                : <Home user={null} onOpenAuth={openAuth} onMenuOpen={() => setSidebarOpen(true)} />
            } />
            <Route path="/favorites" element={
              user
                ? <Favorites user={user} onMenuOpen={() => setSidebarOpen(true)} />
                : <Home user={null} onOpenAuth={openAuth} onMenuOpen={() => setSidebarOpen(true)} />
            } />
            <Route path="/profile" element={
              user ? <Profile user={user} onMenuOpen={() => setSidebarOpen(true)} /> : <Navigate to="/" />
            } />
            <Route path="/admin" element={
              user ? <AdminPanel user={user} onMenuOpen={() => setSidebarOpen(true)} /> : <Navigate to="/" />
            } />
            <Route path="/login" element={<Navigate to="/" />} />
            <Route path="/register" element={<Navigate to="/" />} />
          </Routes>
        </main>

        {authOpen && (
          <AuthModal
            mode={authMode}
            onClose={() => setAuthOpen(false)}
            onModeChange={setAuthMode}
          />
        )}
      </div>
    </UIContext.Provider>
  );
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <AppContent />
      </Router>
    </AuthProvider>
  );
}

export default App;
