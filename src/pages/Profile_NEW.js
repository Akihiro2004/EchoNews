import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { getUserProfile, updateUserProfile, updateProfilePicture } from '../services/firebaseService';
import { compressImageToBase64, validateImageFile } from '../utils/imageUtils';
import LoadingOverlay from '../components/LoadingOverlay';
import LLMChatFAB from '../components/LLMChatFAB';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import '../config/fontawesome'; // Import FontAwesome configuration
import './Profile.css';

const Profile = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [imageUploading, setImageUploading] = useState(false);
  const [formData, setFormData] = useState({
    displayName: '',
    bio: '',
    location: '',
    website: '',
    preferences: {
      categories: [],
      theme: 'light'
    },
    social: {
      twitter: '',
      linkedin: '',
      github: ''
    }
  });

  const categories = [
    { id: 'general', name: 'General', icon: 'newspaper' },
    { id: 'business', name: 'Business', icon: 'chart-line' },
    { id: 'technology', name: 'Technology', icon: 'laptop' },
    { id: 'sports', name: 'Sports', icon: 'football-ball' },
    { id: 'science', name: 'Science', icon: 'flask' },
    { id: 'health', name: 'Health', icon: 'heart' },
    { id: 'entertainment', name: 'Entertainment', icon: 'film' }
  ];

  useEffect(() => {
    if (user) {
      loadProfile();
    }
  }, [user]);

  const loadProfile = async () => {
    try {
      setLoading(true);
      const userProfile = await getUserProfile(user.uid);
      if (userProfile) {
        setProfile(userProfile);
        setFormData({
          displayName: userProfile.displayName || '',
          bio: userProfile.bio || '',
          location: userProfile.location || '',
          website: userProfile.website || '',
          preferences: {
            categories: userProfile.preferences?.categories || [],
            theme: userProfile.preferences?.theme || 'light'
          },
          social: {
            twitter: userProfile.social?.twitter || '',
            linkedin: userProfile.social?.linkedin || '',
            github: userProfile.social?.github || ''
          }
        });
      }
    } catch (error) {
      console.error('Error loading profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleCategoryToggle = (categoryId) => {
    setFormData(prev => ({
      ...prev,
      preferences: {
        ...prev.preferences,
        categories: prev.preferences.categories.includes(categoryId)
          ? prev.preferences.categories.filter(id => id !== categoryId)
          : [...prev.preferences.categories, categoryId]
      }
    }));
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const validation = validateImageFile(file);
    if (!validation.valid) {
      alert(validation.error);
      return;
    }

    try {
      setImageUploading(true);
      const base64Image = await compressImageToBase64(file, 100, 0.8);
      await updateProfilePicture(user.uid, base64Image);
      setProfile(prev => ({ ...prev, profileImageBase64: base64Image }));
    } catch (error) {
      console.error('Error uploading image:', error);
      alert('Failed to upload image. Please try again.');
    } finally {
      setImageUploading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      await updateUserProfile(user.uid, formData);
      setProfile(prev => ({ ...prev, ...formData }));
      setIsEditing(false);
    } catch (error) {
      console.error('Error saving profile:', error);
      alert('Failed to save profile. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const getProfileImage = () => {
    if (profile?.profileImageBase64) {
      return profile.profileImageBase64;
    }
    if (profile?.photoURL) {
      return profile.photoURL;
    }
    return null;
  };

  if (loading) {
    return <LoadingOverlay message="Loading profile..." />;
  }

  return (
    <div className="profile-container">
      <div className="profile-content">
        {/* Header Section */}
        <div className="profile-header">
          <div className="profile-header-bg"></div>
          <div className="profile-header-content">
            {/* Profile Picture */}
            <div className="profile-picture-container">
              <div className="profile-picture">
                {getProfileImage() ? (
                  <img 
                    src={getProfileImage()} 
                    alt="Profile" 
                    className="profile-image"
                  />
                ) : (
                  <div className="profile-placeholder">
                    <FontAwesomeIcon icon="user" />
                  </div>
                )}
                {isEditing && (
                  <div className="profile-upload-overlay">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      id="profile-upload"
                      style={{ display: 'none' }}
                    />
                    <label htmlFor="profile-upload" className="upload-btn">
                      {imageUploading ? (
                        <FontAwesomeIcon icon="spinner" spin />
                      ) : (
                        <FontAwesomeIcon icon="camera" />
                      )}
                    </label>
                  </div>
                )}
              </div>
            </div>

            {/* Basic Info */}
            <div className="profile-basic-info">
              <h1 className="profile-name">
                {isEditing ? (
                  <input
                    type="text"
                    name="displayName"
                    value={formData.displayName}
                    onChange={handleInputChange}
                    placeholder="Your display name"
                    className="profile-name-input"
                  />
                ) : (
                  formData.displayName || 'Anonymous User'
                )}
              </h1>
              <p className="profile-email">
                <FontAwesomeIcon icon="envelope" />
                {user?.email}
              </p>
              {(formData.location || isEditing) && (
                <p className="profile-location">
                  <FontAwesomeIcon icon="map-marker-alt" />
                  {isEditing ? (
                    <input
                      type="text"
                      name="location"
                      value={formData.location}
                      onChange={handleInputChange}
                      placeholder="Your location"
                      className="profile-input"
                    />
                  ) : (
                    formData.location
                  )}
                </p>
              )}
            </div>

            {/* Edit Button */}
            <div className="profile-actions">
              {isEditing ? (
                <>
                  <button 
                    onClick={handleSave} 
                    className="btn btn-primary"
                    disabled={saving}
                  >
                    {saving ? (
                      <FontAwesomeIcon icon="spinner" spin />
                    ) : (
                      <>
                        <FontAwesomeIcon icon="save" />
                        Save Changes
                      </>
                    )}
                  </button>
                  <button 
                    onClick={() => setIsEditing(false)} 
                    className="btn btn-secondary"
                  >
                    <FontAwesomeIcon icon="times" />
                    Cancel
                  </button>
                </>
              ) : (
                <button 
                  onClick={() => setIsEditing(true)} 
                  className="btn btn-primary"
                >
                  <FontAwesomeIcon icon="edit" />
                  Edit Profile
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Profile Details */}
        <div className="profile-details">
          {/* Bio Section */}
          <div className="profile-section">
            <h3 className="section-title">
              <FontAwesomeIcon icon="user" />
              About
            </h3>
            <div className="section-content">
              {isEditing ? (
                <textarea
                  name="bio"
                  value={formData.bio}
                  onChange={handleInputChange}
                  placeholder="Tell us about yourself..."
                  className="profile-textarea"
                  rows={4}
                />
              ) : (
                <p className="profile-bio">
                  {formData.bio || 'No bio added yet.'}
                </p>
              )}
            </div>
          </div>

          {/* Preferences Section */}
          <div className="profile-section">
            <h3 className="section-title">
              <FontAwesomeIcon icon="cog" />
              News Preferences
            </h3>
            <div className="section-content">
              <div className="preferences-grid">
                <div className="preference-item">
                  <label className="preference-label">Favorite Categories</label>
                  <div className="categories-grid">
                    {categories.map(category => (
                      <button
                        key={category.id}
                        type="button"
                        className={`category-chip ${
                          formData.preferences.categories.includes(category.id) ? 'active' : ''
                        }`}
                        onClick={() => isEditing && handleCategoryToggle(category.id)}
                        disabled={!isEditing}
                      >
                        <FontAwesomeIcon icon={category.icon} />
                        {category.name}
                      </button>
                    ))}
                  </div>
                </div>
                
                <div className="preference-item">
                  <label className="preference-label">Theme</label>
                  <select
                    name="preferences.theme"
                    value={formData.preferences.theme}
                    onChange={handleInputChange}
                    disabled={!isEditing}
                    className="preference-select"
                  >
                    <option value="light">Light</option>
                    <option value="dark">Dark</option>
                    <option value="auto">Auto</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Contact & Social */}
          <div className="profile-section">
            <h3 className="section-title">
              <FontAwesomeIcon icon="link" />
              Links & Contact
            </h3>
            <div className="section-content">
              <div className="links-grid">
                <div className="link-item">
                  <FontAwesomeIcon icon="globe" />
                  <label>Website</label>
                  {isEditing ? (
                    <input
                      type="url"
                      name="website"
                      value={formData.website}
                      onChange={handleInputChange}
                      placeholder="https://yourwebsite.com"
                      className="profile-input"
                    />
                  ) : (
                    <span className="link-display">
                      {formData.website ? (
                        <a href={formData.website} target="_blank" rel="noopener noreferrer">
                          {formData.website}
                        </a>
                      ) : (
                        'Not provided'
                      )}
                    </span>
                  )}
                </div>

                <div className="link-item">
                  <FontAwesomeIcon icon={['fab', 'twitter']} />
                  <label>Twitter</label>
                  {isEditing ? (
                    <input
                      type="text"
                      name="social.twitter"
                      value={formData.social.twitter}
                      onChange={handleInputChange}
                      placeholder="@username"
                      className="profile-input"
                    />
                  ) : (
                    <span className="link-display">
                      {formData.social.twitter || 'Not provided'}
                    </span>
                  )}
                </div>

                <div className="link-item">
                  <FontAwesomeIcon icon={['fab', 'linkedin']} />
                  <label>LinkedIn</label>
                  {isEditing ? (
                    <input
                      type="text"
                      name="social.linkedin"
                      value={formData.social.linkedin}
                      onChange={handleInputChange}
                      placeholder="linkedin.com/in/username"
                      className="profile-input"
                    />
                  ) : (
                    <span className="link-display">
                      {formData.social.linkedin || 'Not provided'}
                    </span>
                  )}
                </div>

                <div className="link-item">
                  <FontAwesomeIcon icon={['fab', 'github']} />
                  <label>GitHub</label>
                  {isEditing ? (
                    <input
                      type="text"
                      name="social.github"
                      value={formData.social.github}
                      onChange={handleInputChange}
                      placeholder="github.com/username"
                      className="profile-input"
                    />
                  ) : (
                    <span className="link-display">
                      {formData.social.github || 'Not provided'}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Stats Section */}
          <div className="profile-section">
            <h3 className="section-title">
              <FontAwesomeIcon icon="chart-line" />
              Statistics
            </h3>
            <div className="section-content">
              <div className="stats-grid">
                <div className="stat-item">
                  <FontAwesomeIcon icon="newspaper" />
                  <div className="stat-content">
                    <span className="stat-number">{profile?.stats?.articlesRead || 0}</span>
                    <span className="stat-label">Articles Read</span>
                  </div>
                </div>
                <div className="stat-item">
                  <FontAwesomeIcon icon="heart" />
                  <div className="stat-content">
                    <span className="stat-number">{profile?.stats?.favoriteCount || 0}</span>
                    <span className="stat-label">Favorites</span>
                  </div>
                </div>
                <div className="stat-item">
                  <FontAwesomeIcon icon="calendar" />
                  <div className="stat-content">
                    <span className="stat-number">
                      {profile?.createdAt ? new Date(profile.createdAt.seconds * 1000).getFullYear() : '2024'}
                    </span>
                    <span className="stat-label">Member Since</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <LLMChatFAB />
    </div>
  );
};

export default Profile;
