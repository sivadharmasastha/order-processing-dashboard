import React from 'react';
import PropTypes from 'prop-types';

/**
 * Loader Component
 * Displays a loading spinner with optional message
 * Supports multiple variants: fullscreen, overlay, and inline
 */
function Loader({ 
  message = 'Loading...', 
  size = 'medium',
  variant = 'fullscreen',
  overlay = false 
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
    inline: 'loader-inline'
  };

  const loaderClass = `loader-container ${variantClasses[variant] || variantClasses.fullscreen}`;
  const spinnerClass = `loader-spinner ${sizeClasses[size] || sizeClasses.medium}`;

  return (
    <div className={loaderClass} role="status" aria-live="polite">
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
      </div>
    </div>
  );
}

// PropTypes for type checking
Loader.propTypes = {
  message: PropTypes.string,
  size: PropTypes.oneOf(['small', 'medium', 'large']),
  variant: PropTypes.oneOf(['fullscreen', 'overlay', 'inline']),
  overlay: PropTypes.bool
};

// Default props
Loader.defaultProps = {
  message: 'Loading...',
  size: 'medium',
  variant: 'fullscreen',
  overlay: false
};

export default Loader;
