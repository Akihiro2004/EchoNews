import React from 'react';
import { Loader2 } from 'lucide-react';
import './LoadingOverlay.css';

const LoadingOverlay = ({ 
  isVisible, 
  message = 'Loading...', 
  transparent = false, 
  className = '' 
}) => {
  if (!isVisible) return null;

  return (
    <div className={`loading-overlay ${transparent ? 'transparent' : ''} ${className}`}>
      <div className="loading-content">
        <Loader2 className="loading-spinner" size={32} />
        <p className="loading-message">{message}</p>
      </div>
    </div>
  );
};

export default LoadingOverlay;
