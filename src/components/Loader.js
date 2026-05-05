import React from 'react';
import PropTypes from 'prop-types';

/**
 * Loader Component - Production Level
 * Displays a loading spinner with optional message
 * Supports multiple variants: fullscreen, overlay, inline, and minimal
 * Includes accessibility features and customization options
 */
function Loader({ 
  message = 'Loading...', 
  size = 'medium',
  variant = 'fullscreen',
  overlay = false,
  showProgress = false,
  progress = 0,
  backdrop = true,
  className = ''
}) {
  // Size classes for the spinner
  const sizeClasses = {
    small: 'loader-small',
    medium: 'loader-medium',
    large: 'loader-large'
  };

  // Variant classes for positioning
  const variantClasses = {
    fullscreen: 'loader-fullscreen',
    overlay: 'loader-overlay',
    inline: 'loader-inline',
    minimal: 'loader-minimal',
    card: 'loader-card'
  };

  const loaderClass = [
    'loader-container',
    variantClasses[variant] || variantClasses.fullscreen,
    backdrop ? 'with-backdrop' : '',
    className
  ].filter(Boolean).join(' ');
  
  const spinnerClass = `loader-spinner ${sizeClasses[size] || sizeClasses.medium}`;

  return (
    <div className={loaderClass} role="status" aria-live="polite" aria-busy="true">
      <div className="loader-content">
        <div className={spinnerClass} aria-hidden="true">
          <div className="spinner-circle"></div>
          <div className="spinner-circle spinner-circle-2"></div>
          <div className="spinner-circle spinner-circle-3"></div>
        </div>
        {message && (
          <p className="loader-message" aria-label={message}>
            {message}
          </p>
        )}
        {showProgress && (
          <div className="loader-progress">
            <div className="progress-bar">
              <div 
                className="progress-fill" 
                style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
                role="progressbar"
                aria-valuenow={progress}
                aria-valuemin="0"
                aria-valuemax="100"
              />
            </div>
            <span className="progress-text">{Math.round(progress)}%</span>
          </div>
        )}
      </div>
    </div>
  );
}

// PropTypes for type checking
Loader.propTypes = {
  message: PropTypes.string,
  size: PropTypes.oneOf(['small', 'medium', 'large']),
  variant: PropTypes.oneOf(['fullscreen', 'overlay', 'inline', 'minimal', 'card']),
  overlay: PropTypes.bool,
  showProgress: PropTypes.bool,
  progress: PropTypes.number,
  backdrop: PropTypes.bool,
  className: PropTypes.string
};

// Default props
Loader.defaultProps = {
  message: 'Loading...',
  size: 'medium',
  variant: 'fullscreen',
  overlay: false,
  showProgress: false,
  progress: 0,
  backdrop: true,
  className: ''
};

export default Loader;
