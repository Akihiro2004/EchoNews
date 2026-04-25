import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { signOut } from 'firebase/auth';
import { auth } from '../Firebase';
import { getUserProfile } from '../services/firebaseService';
import { Search, Menu, X, User, Heart, Home, Settings, LogOut } from 'lucide-react';
import './Navbar.css';

const Navbar = ({ user }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [userProfile, setUserProfile] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      loadUserProfile();
    }
  }, [user]);

  const loadUserProfile = async () => {
    try {
      const profile = await getUserProfile(user.uid);
      setUserProfile(profile);
    } catch (error) {
      console.error('Error loading user profile:', error);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate('/');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/?search=${encodeURIComponent(searchQuery)}`);
      setSearchQuery('');
    }
  };

  return (
    <nav className="navbar">
      <div className="navbar-container">
        {/* Logo */}
        <Link to="/" className="navbar-logo">
          <div className="logo-container">
            <span className="logo-text">Echo</span>
            <span className="logo-accent">News</span>
          </div>
        </Link>

        {/* Search Bar */}
        <form className="search-container" onSubmit={handleSearch}>
          <div className="search-wrapper">
            <Search className="search-icon" size={20} />
            <input
              type="text"
              placeholder="Search news..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="search-input"
            />
          </div>
        </form>

        {/* Desktop Navigation */}
        <div className="navbar-menu">
          <Link to="/" className="navbar-link">
            <Home size={18} />
            <span>Home</span>
          </Link>
          
          {user && (
            <>
              <Link to="/for-you" className="navbar-link">
                <Settings size={18} />
                <span>For You</span>
              </Link>
              <Link to="/favorites" className="navbar-link">
                <Heart size={18} />
                <span>Favorites</span>
              </Link>
              {userProfile?.isAdmin && (
                <Link to="/admin" className="navbar-link">
                  <Settings size={18} />
                  <span>Admin</span>
                </Link>
              )}
            </>
          )}
        </div>

        {/* User Menu */}
        <div className="navbar-user">
          {user ? (
            <div className="user-menu">
              <div className="user-avatar" onClick={toggleMenu}>
                {user.photoURL ? (
                  <img src={user.photoURL} alt="Avatar" className="avatar-image" />
                ) : (
                  <User size={20} />
                )}
              </div>
              
              {isMenuOpen && (
                <div className="dropdown-menu">
                  <div className="dropdown-header">
                    <p className="user-name">{user.displayName || user.email}</p>
                    <p className="user-email">{user.email}</p>
                  </div>
                  <div className="dropdown-divider"></div>
                  <Link to="/profile" className="dropdown-item" onClick={() => setIsMenuOpen(false)}>
                    <User size={16} />
                    <span>Profile</span>
                  </Link>
                  <Link to="/favorites" className="dropdown-item" onClick={() => setIsMenuOpen(false)}>
                    <Heart size={16} />
                    <span>Favorites</span>
                  </Link>
                  <Link to="/for-you" className="dropdown-item" onClick={() => setIsMenuOpen(false)}>
                    <Settings size={16} />
                    <span>For You</span>
                  </Link>
                  {userProfile?.isAdmin && (
                    <Link to="/admin" className="dropdown-item" onClick={() => setIsMenuOpen(false)}>
                      <Settings size={16} />
                      <span>Admin Panel</span>
                    </Link>
                  )}
                  <div className="dropdown-divider"></div>
                  <button className="dropdown-item logout-btn" onClick={handleLogout}>
                    <LogOut size={16} />
                    <span>Logout</span>
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="auth-buttons">
              <Link to="/login" className="btn btn-secondary">Login</Link>
              <Link to="/register" className="btn btn-primary">Register</Link>
            </div>
          )}
        </div>

        {/* Mobile Menu Button */}
        <button className="mobile-menu-btn" onClick={toggleMenu}>
          {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className="mobile-menu">
          <Link to="/" className="mobile-link" onClick={() => setIsMenuOpen(false)}>
            <Home size={18} />
            <span>Home</span>
          </Link>
          
          {user ? (
            <>
              <Link to="/for-you" className="mobile-link" onClick={() => setIsMenuOpen(false)}>
                <Settings size={18} />
                <span>For You</span>
              </Link>
              <Link to="/favorites" className="mobile-link" onClick={() => setIsMenuOpen(false)}>
                <Heart size={18} />
                <span>Favorites</span>
              </Link>
              <Link to="/profile" className="mobile-link" onClick={() => setIsMenuOpen(false)}>
                <User size={18} />
                <span>Profile</span>
              </Link>
              {userProfile?.isAdmin && (
                <Link to="/admin" className="mobile-link" onClick={() => setIsMenuOpen(false)}>
                  <Settings size={18} />
                  <span>Admin Panel</span>
                </Link>
              )}
              <button className="mobile-link logout-btn" onClick={handleLogout}>
                <LogOut size={18} />
                <span>Logout</span>
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="mobile-link" onClick={() => setIsMenuOpen(false)}>
                <User size={18} />
                <span>Login</span>
              </Link>
              <Link to="/register" className="mobile-link" onClick={() => setIsMenuOpen(false)}>
                <User size={18} />
                <span>Register</span>
              </Link>
            </>
          )}
        </div>
      )}
    </nav>
  );
};

export default Navbar;
