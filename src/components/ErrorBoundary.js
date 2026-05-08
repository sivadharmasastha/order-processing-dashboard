import React, { Component } from 'react';
import PropTypes from 'prop-types';

/**
 * ErrorBoundary Component
 * Catches JavaScript errors anywhere in the child component tree
 * Production-level error boundary with fallback UI and error reporting
 */
class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorCount: 0
    };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    // Log error to console in development
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    
    // Update state with error details
    this.setState(prevState => ({
      error,
      errorInfo,
      errorCount: prevState.errorCount + 1
    }));
    
    // Report error to monitoring service (e.g., Sentry, LogRocket)
    this.reportError(error, errorInfo);
    
    // Call custom error handler if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  /**
   * Report error to monitoring service
   * In production, integrate with services like Sentry, Rollbar, etc.
   */
  reportError = (error, errorInfo) => {
    // Production error reporting
    if (process.env.NODE_ENV === 'production') {
      // Example: Send to error tracking service
      // Sentry.captureException(error, { contexts: { react: errorInfo } });
      
      console.error('Error reported to monitoring service:', {
        error: error.toString(),
        componentStack: errorInfo.componentStack,
        timestamp: new Date().toISOString()
      });
    }
  };

  /**
   * Reset error boundary state
   */
  resetError = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null
    });
    
    // Call custom reset handler if provided
    if (this.props.onReset) {
      this.props.onReset();
    }
  };

  /**
   * Reload the page
   */
  reloadPage = () => {
    window.location.reload();
  };

  render() {
    const { hasError, error, errorInfo, errorCount } = this.state;
    const { fallback, children, showDetails } = this.props;

    if (hasError) {
      // Use custom fallback if provided
      if (fallback) {
        return typeof fallback === 'function' 
          ? fallback({ error, errorInfo, resetError: this.resetError, reloadPage: this.reloadPage })
          : fallback;
      }

      // Default fallback UI
      return (
        <div className="error-boundary">
          <div className="error-boundary-content">
            <div className="error-icon">⚠️</div>
            <h1 className="error-title">Something went wrong</h1>
            <p className="error-message">
              We're sorry, but something unexpected happened. 
              The error has been logged and we'll look into it.
            </p>
            
            {errorCount > 3 && (
              <div className="error-warning">
                <strong>Multiple errors detected.</strong> There might be a persistent issue.
                Please try refreshing the page or contact support if the problem continues.
              </div>
            )}
            
            <div className="error-actions">
              <button 
                onClick={this.resetError} 
                className="btn btn-primary"
              >
                Try Again
              </button>
              <button 
                onClick={this.reloadPage} 
                className="btn btn-secondary"
              >
                Reload Page
              </button>
            </div>
            
            {showDetails && error && (
              <details className="error-details">
                <summary>Error Details (for developers)</summary>
                <div className="error-details-content">
                  <div className="error-section">
                    <h3>Error Message:</h3>
                    <pre>{error.toString()}</pre>
                  </div>
                  
                  {errorInfo && (
                    <div className="error-section">
                      <h3>Component Stack:</h3>
                      <pre>{errorInfo.componentStack}</pre>
                    </div>
                  )}
                  
                  {error.stack && (
                    <div className="error-section">
                      <h3>Error Stack:</h3>
                      <pre>{error.stack}</pre>
                    </div>
                  )}
                </div>
              </details>
            )}
            
            <p className="error-footer">
              Error ID: {Date.now().toString(36)}
            </p>
          </div>
        </div>
      );
    }

    return children;
  }
}

ErrorBoundary.propTypes = {
  children: PropTypes.node.isRequired,
  fallback: PropTypes.oneOfType([PropTypes.node, PropTypes.func]),
  onError: PropTypes.func,
  onReset: PropTypes.func,
  showDetails: PropTypes.bool
};

ErrorBoundary.defaultProps = {
  fallback: null,
  onError: null,
  onReset: null,
  showDetails: process.env.NODE_ENV !== 'production'
};

export default ErrorBoundary;
