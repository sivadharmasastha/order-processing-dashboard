import React from 'react';
import PropTypes from 'prop-types';
import { useError, ERROR_SEVERITY } from '../context/ErrorContext';

/**
 * Toast Component
 * Displays individual toast notification
 */
function Toast({ error, onClose, onRetry }) {
  const { message, severity, type, retry, dismissible, context } = error;

  /**
   * Get toast icon based on severity
   */
  const getIcon = () => {
    switch (severity) {
      case ERROR_SEVERITY.INFO:
        return '💡';
      case ERROR_SEVERITY.WARNING:
        return '⚠️';
      case ERROR_SEVERITY.ERROR:
        return '❌';
      case ERROR_SEVERITY.CRITICAL:
        return '🚨';
      default:
        return '❌';
    }
  };

  /**
   * Get toast class based on severity
   */
  const getToastClass = () => {
    return `toast toast-${severity} toast-${type}`;
  };

  /**
   * Handle retry action
   */
  const handleRetry = async () => {
    if (retry) {
      await onRetry(error.id);
    }
  };

  return (
    <div className={getToastClass()} role="alert">
      <div className="toast-content">
        <div className="toast-icon">{getIcon()}</div>
        <div className="toast-body">
          <div className="toast-message">{message}</div>
          {context && context !== 'general' && (
            <div className="toast-context">Context: {context}</div>
          )}
        </div>
      </div>
      
      <div className="toast-actions">
        {retry && (
          <button 
            onClick={handleRetry} 
            className="toast-btn toast-btn-retry"
            aria-label="Retry action"
          >
            ↻ Retry
          </button>
        )}
        {dismissible && (
          <button 
            onClick={() => onClose(error.id)} 
            className="toast-btn toast-btn-close"
            aria-label="Close notification"
          >
            ✕
          </button>
        )}
      </div>
    </div>
  );
}

Toast.propTypes = {
  error: PropTypes.shape({
    id: PropTypes.string.isRequired,
    message: PropTypes.string.isRequired,
    severity: PropTypes.string.isRequired,
    type: PropTypes.string.isRequired,
    retry: PropTypes.func,
    dismissible: PropTypes.bool,
    context: PropTypes.string
  }).isRequired,
  onClose: PropTypes.func.isRequired,
  onRetry: PropTypes.func.isRequired
};

/**
 * ToastContainer Component
 * Manages and displays multiple toast notifications
 */
function ToastContainer({ position = 'top-right', maxToasts = 5 }) {
  const { errors, removeError, retryError } = useError();

  /**
   * Get container position class
   */
  const getPositionClass = () => {
    return `toast-container toast-${position}`;
  };

  /**
   * Get visible toasts (limit to maxToasts)
   */
  const visibleToasts = errors.slice(-maxToasts);

  if (visibleToasts.length === 0) {
    return null;
  }

  return (
    <div className={getPositionClass()} aria-live="polite" aria-atomic="true">
      {visibleToasts.map(error => (
        <Toast
          key={error.id}
          error={error}
          onClose={removeError}
          onRetry={retryError}
        />
      ))}
    </div>
  );
}

ToastContainer.propTypes = {
  position: PropTypes.oneOf([
    'top-left',
    'top-center',
    'top-right',
    'bottom-left',
    'bottom-center',
    'bottom-right'
  ]),
  maxToasts: PropTypes.number
};

export default ToastContainer;
export { Toast };
