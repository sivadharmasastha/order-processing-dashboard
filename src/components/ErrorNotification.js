import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { useError, ERROR_SEVERITY, ERROR_TYPES } from '../context/ErrorContext';

/**
 * ErrorNotification Component
 * Displays error messages with retry functionality and detailed information
 * Production-level error UI with user-friendly messages
 */
function ErrorNotification({ 
  error, 
  onRetry, 
  onDismiss, 
  showDetails = false,
  inline = false 
}) {
  const [isRetrying, setIsRetrying] = useState(false);
  const [showFullDetails, setShowFullDetails] = useState(false);

  if (!error) return null;

  const { message, severity, type, statusCode, retry, details, timestamp } = error;

  /**
   * Get user-friendly error title
   */
  const getErrorTitle = () => {
    switch (type) {
      case ERROR_TYPES.NETWORK:
        return 'Connection Error';
      case ERROR_TYPES.AUTHENTICATION:
        return 'Authentication Required';
      case ERROR_TYPES.AUTHORIZATION:
        return 'Access Denied';
      case ERROR_TYPES.NOT_FOUND:
        return 'Not Found';
      case ERROR_TYPES.VALIDATION:
        return 'Validation Error';
      case ERROR_TYPES.TIMEOUT:
        return 'Request Timeout';
      case ERROR_TYPES.RATE_LIMIT:
        return 'Rate Limit Exceeded';
      case ERROR_TYPES.SERVER:
        return 'Server Error';
      default:
        return 'Error';
    }
  };

  /**
   * Get error icon
   */
  const getErrorIcon = () => {
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
   * Get helpful suggestions based on error type
   */
  const getSuggestions = () => {
    switch (type) {
      case ERROR_TYPES.NETWORK:
        return [
          'Check your internet connection',
          'Try refreshing the page',
          'Contact support if the issue persists'
        ];
      case ERROR_TYPES.AUTHENTICATION:
        return [
          'Log in again to continue',
          'Clear your browser cache',
          'Contact support if you can\'t access your account'
        ];
      case ERROR_TYPES.AUTHORIZATION:
        return [
          'Contact your administrator for access',
          'Make sure you have the required permissions'
        ];
      case ERROR_TYPES.TIMEOUT:
        return [
          'Try again in a moment',
          'Check your internet connection speed',
          'Contact support if timeouts persist'
        ];
      case ERROR_TYPES.RATE_LIMIT:
        return [
          'Wait a few moments before trying again',
          'Reduce the frequency of your requests'
        ];
      case ERROR_TYPES.SERVER:
        return [
          'Our team has been notified',
          'Try again in a few minutes',
          'Contact support if the issue persists'
        ];
      default:
        return [];
    }
  };

  /**
   * Handle retry with loading state and visual feedback
   */
  const handleRetry = async () => {
    if (!retry || isRetrying) return;
    
    setIsRetrying(true);
    try {
      await onRetry(error.id);
    } catch (err) {
      console.error('Retry failed:', err);
      // Error will be handled by the error context
    } finally {
      setIsRetrying(false);
    }
  };

  /**
   * Format timestamp
   */
  const formatTimestamp = () => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    return date.toLocaleTimeString();
  };

  const containerClass = inline 
    ? `error-notification-inline error-notification-${severity}`
    : `error-notification error-notification-${severity}`;

  const suggestions = getSuggestions();

  return (
    <div className={containerClass} role="alert" aria-live="assertive">
      <div className="error-notification-progress-bar"></div>
      <div className="error-notification-content">
        <div className="error-notification-header">
          <div className="error-notification-icon" aria-hidden="true">{getErrorIcon()}</div>
          <div className="error-notification-title-section">
            <h3 className="error-notification-title">{getErrorTitle()}</h3>
            {statusCode && (
              <span className="error-notification-status">
                HTTP {statusCode}
              </span>
            )}
          </div>
          {onDismiss && (
            <button
              onClick={() => onDismiss(error.id)}
              className="error-notification-close"
              aria-label="Dismiss error"
              title="Dismiss"
            >
              ✕
            </button>
          )}
        </div>

        <div className="error-notification-body">
          <p className="error-notification-message">{message}</p>
          
          {suggestions.length > 0 && (
            <div className="error-notification-suggestions">
              <p className="suggestions-title">What you can do:</p>
              <ul className="suggestions-list">
                {suggestions.map((suggestion, index) => (
                  <li key={index}>{suggestion}</li>
                ))}
              </ul>
            </div>
          )}

          {showDetails && details && (
            <div className="error-notification-details">
              <button
                onClick={() => setShowFullDetails(!showFullDetails)}
                className="error-details-toggle"
              >
                {showFullDetails ? '▼' : '▶'} Technical Details
              </button>
              {showFullDetails && (
                <pre className="error-details-content">
                  {JSON.stringify(details, null, 2)}
                </pre>
              )}
            </div>
          )}
        </div>

        <div className="error-notification-footer">
          <div className="error-notification-meta">
            {timestamp && (
              <span className="error-timestamp">{formatTimestamp()}</span>
            )}
          </div>
          
          <div className="error-notification-actions">
            {retry && (
              <button
                onClick={handleRetry}
                disabled={isRetrying}
                className="btn btn-retry"
              >
                {isRetrying ? (
                  <>
                    <span className="spinner-small"></span>
                    Retrying...
                  </>
                ) : (
                  <>
                    ↻ Retry
                  </>
                )}
              </button>
            )}
            {onDismiss && (
              <button
                onClick={() => onDismiss(error.id)}
                className="btn btn-dismiss"
              >
                Dismiss
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

ErrorNotification.propTypes = {
  error: PropTypes.shape({
    id: PropTypes.string.isRequired,
    message: PropTypes.string.isRequired,
    severity: PropTypes.string.isRequired,
    type: PropTypes.string.isRequired,
    statusCode: PropTypes.number,
    retry: PropTypes.func,
    details: PropTypes.any,
    timestamp: PropTypes.instanceOf(Date)
  }),
  onRetry: PropTypes.func.isRequired,
  onDismiss: PropTypes.func,
  showDetails: PropTypes.bool,
  inline: PropTypes.bool
};

/**
 * GlobalErrorDisplay Component
 * Displays the global error (most critical error) at the top of the page
 */
function GlobalErrorDisplay() {
  const { globalError, removeError, retryError } = useError();

  if (!globalError) return null;

  return (
    <div className="global-error-container">
      <ErrorNotification
        error={globalError}
        onRetry={retryError}
        onDismiss={globalError.dismissible ? removeError : null}
        showDetails={process.env.NODE_ENV !== 'production'}
      />
    </div>
  );
}

/**
 * InlineError Component
 * Displays inline error message within a component/form
 */
function InlineError({ errorMessage, onRetry, onDismiss }) {
  if (!errorMessage) return null;

  return (
    <div className="inline-error" role="alert">
      <span className="inline-error-icon">❌</span>
      <span className="inline-error-message">{errorMessage}</span>
      {onRetry && (
        <button onClick={onRetry} className="inline-error-retry">
          ↻ Retry
        </button>
      )}
      {onDismiss && (
        <button onClick={onDismiss} className="inline-error-dismiss">
          ✕
        </button>
      )}
    </div>
  );
}

InlineError.propTypes = {
  errorMessage: PropTypes.string,
  onRetry: PropTypes.func,
  onDismiss: PropTypes.func
};

export default ErrorNotification;
export { GlobalErrorDisplay, InlineError };
