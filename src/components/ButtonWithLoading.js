import React from 'react';
import PropTypes from 'prop-types';

/**
 * ButtonWithLoading Component
 * Production-level button with integrated loading state
 * Prevents multiple clicks and shows visual feedback during operations
 */
function ButtonWithLoading({
  children,
  onClick,
  loading = false,
  disabled = false,
  loadingText = 'Loading...',
  className = '',
  variant = 'primary',
  type = 'button',
  icon,
  size = 'medium',
  fullWidth = false,
  ...props
}) {
  const isDisabled = disabled || loading;

  const buttonClass = [
    'btn',
    `btn-${variant}`,
    `btn-${size}`,
    fullWidth ? 'btn-full-width' : '',
    loading ? 'btn-loading' : '',
    className
  ].filter(Boolean).join(' ');

  const handleClick = (e) => {
    if (!loading && !disabled && onClick) {
      onClick(e);
    }
  };

  return (
    <button
      type={type}
      className={buttonClass}
      onClick={handleClick}
      disabled={isDisabled}
      aria-busy={loading}
      aria-live="polite"
      {...props}
    >
      {loading && (
        <span className="btn-spinner" aria-hidden="true">
          <svg className="spinner-svg" viewBox="0 0 24 24">
            <circle
              className="spinner-circle-bg"
              cx="12"
              cy="12"
              r="10"
              fill="none"
              strokeWidth="3"
            />
            <circle
              className="spinner-circle-fg"
              cx="12"
              cy="12"
              r="10"
              fill="none"
              strokeWidth="3"
            />
          </svg>
        </span>
      )}
      {!loading && icon && (
        <span className="btn-icon" aria-hidden="true">{icon}</span>
      )}
      <span className="btn-text">
        {loading ? loadingText : children}
      </span>
    </button>
  );
}

ButtonWithLoading.propTypes = {
  children: PropTypes.node.isRequired,
  onClick: PropTypes.func,
  loading: PropTypes.bool,
  disabled: PropTypes.bool,
  loadingText: PropTypes.string,
  className: PropTypes.string,
  variant: PropTypes.oneOf(['primary', 'secondary', 'success', 'danger', 'warning']),
  type: PropTypes.oneOf(['button', 'submit', 'reset']),
  icon: PropTypes.node,
  size: PropTypes.oneOf(['small', 'medium', 'large']),
  fullWidth: PropTypes.bool
};

export default ButtonWithLoading;
