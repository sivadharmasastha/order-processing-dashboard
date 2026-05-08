import React, { createContext, useContext, useState, useCallback, useRef } from 'react';
import PropTypes from 'prop-types';

/**
 * ErrorContext
 * Global error state management for production-level applications
 * Handles API errors, validation errors, and runtime errors with retry functionality
 */
const ErrorContext = createContext();

// Error severity levels
export const ERROR_SEVERITY = {
  INFO: 'info',
  WARNING: 'warning',
  ERROR: 'error',
  CRITICAL: 'critical'
};

// Error types for categorization
export const ERROR_TYPES = {
  NETWORK: 'network',
  VALIDATION: 'validation',
  AUTHENTICATION: 'authentication',
  AUTHORIZATION: 'authorization',
  NOT_FOUND: 'not_found',
  SERVER: 'server',
  TIMEOUT: 'timeout',
  RATE_LIMIT: 'rate_limit',
  UNKNOWN: 'unknown'
};

export function ErrorProvider({ children }) {
  const [errors, setErrors] = useState([]);
  const [globalError, setGlobalError] = useState(null);
  const errorIdCounter = useRef(0);

  /**
   * Generate unique error ID
   */
  const generateErrorId = useCallback(() => {
    return `error_${Date.now()}_${++errorIdCounter.current}`;
  }, []);

  /**
   * Classify error based on message and status code
   */
  const classifyError = useCallback((error, statusCode) => {
    const message = error?.message?.toLowerCase() || '';
    
    if (statusCode === 401 || message.includes('unauthorized') || message.includes('session expired')) {
      return ERROR_TYPES.AUTHENTICATION;
    }
    
    if (statusCode === 403 || message.includes('forbidden') || message.includes('permission')) {
      return ERROR_TYPES.AUTHORIZATION;
    }
    
    if (statusCode === 404 || message.includes('not found')) {
      return ERROR_TYPES.NOT_FOUND;
    }
    
    if (statusCode === 422 || message.includes('validation') || message.includes('invalid')) {
      return ERROR_TYPES.VALIDATION;
    }
    
    if (statusCode === 429 || message.includes('rate limit') || message.includes('too many requests')) {
      return ERROR_TYPES.RATE_LIMIT;
    }
    
    if (statusCode === 408 || message.includes('timeout') || message.includes('timed out')) {
      return ERROR_TYPES.TIMEOUT;
    }
    
    if (message.includes('network') || message.includes('connect') || message.includes('connection')) {
      return ERROR_TYPES.NETWORK;
    }
    
    if (statusCode >= 500 || message.includes('server error')) {
      return ERROR_TYPES.SERVER;
    }
    
    return ERROR_TYPES.UNKNOWN;
  }, []);

  /**
   * Determine error severity
   */
  const determineSeverity = useCallback((errorType) => {
    switch (errorType) {
      case ERROR_TYPES.AUTHENTICATION:
      case ERROR_TYPES.AUTHORIZATION:
      case ERROR_TYPES.SERVER:
        return ERROR_SEVERITY.CRITICAL;
      
      case ERROR_TYPES.NETWORK:
      case ERROR_TYPES.TIMEOUT:
      case ERROR_TYPES.RATE_LIMIT:
        return ERROR_SEVERITY.ERROR;
      
      case ERROR_TYPES.NOT_FOUND:
      case ERROR_TYPES.VALIDATION:
        return ERROR_SEVERITY.WARNING;
      
      default:
        return ERROR_SEVERITY.ERROR;
    }
  }, []);

  /**
   * Add an error to the error list
   * @param {Object|string} error - Error object or message
   * @param {Object} options - Additional options
   * @param {string} options.context - Context where error occurred
   * @param {Function} options.retry - Retry function
   * @param {number} options.statusCode - HTTP status code
   * @param {string} options.severity - Error severity override
   * @param {boolean} options.dismissible - Can error be dismissed
   * @param {number} options.autoHideDuration - Auto-hide duration in ms
   */
  const addError = useCallback((error, options = {}) => {
    const errorMessage = typeof error === 'string' ? error : (error?.message || 'An error occurred');
    const statusCode = options.statusCode || error?.statusCode || error?.response?.status;
    const errorType = classifyError(error, statusCode);
    const severity = options.severity || determineSeverity(errorType);
    
    const errorObj = {
      id: generateErrorId(),
      message: errorMessage,
      type: errorType,
      severity,
      context: options.context || 'general',
      timestamp: new Date(),
      statusCode,
      retry: options.retry || null,
      dismissible: options.dismissible !== false,
      autoHideDuration: options.autoHideDuration || null,
      details: error?.response?.data || error?.details || null,
      stack: error?.stack || null
    };
    
    // Log error for monitoring (in production, send to error tracking service)
    console.error('[ErrorContext] Error added:', {
      id: errorObj.id,
      type: errorObj.type,
      severity: errorObj.severity,
      message: errorObj.message,
      context: errorObj.context
    });
    
    setErrors(prev => [...prev, errorObj]);
    
    // Set as global error if critical or if no global error exists
    if (severity === ERROR_SEVERITY.CRITICAL || !globalError) {
      setGlobalError(errorObj);
    }
    
    // Auto-hide if duration specified
    if (errorObj.autoHideDuration) {
      setTimeout(() => {
        removeError(errorObj.id);
      }, errorObj.autoHideDuration);
    }
    
    return errorObj.id;
  }, [classifyError, determineSeverity, generateErrorId, globalError]);

  /**
   * Remove an error from the list
   * @param {string} errorId - Error ID
   */
  const removeError = useCallback((errorId) => {
    setErrors(prev => prev.filter(err => err.id !== errorId));
    
    // Clear global error if it's being removed
    setGlobalError(prev => (prev?.id === errorId ? null : prev));
  }, []);

  /**
   * Clear all errors
   */
  const clearErrors = useCallback(() => {
    setErrors([]);
    setGlobalError(null);
  }, []);

  /**
   * Clear errors by context
   * @param {string} context - Context to clear
   */
  const clearErrorsByContext = useCallback((context) => {
    setErrors(prev => prev.filter(err => err.context !== context));
    
    // Clear global error if it matches context
    setGlobalError(prev => (prev?.context === context ? null : prev));
  }, []);

  /**
   * Clear errors by type
   * @param {string} type - Error type to clear
   */
  const clearErrorsByType = useCallback((type) => {
    setErrors(prev => prev.filter(err => err.type !== type));
    
    // Clear global error if it matches type
    setGlobalError(prev => (prev?.type === type ? null : prev));
  }, []);

  /**
   * Get errors by context
   * @param {string} context - Context to filter
   * @returns {Array} Filtered errors
   */
  const getErrorsByContext = useCallback((context) => {
    return errors.filter(err => err.context === context);
  }, [errors]);

  /**
   * Get errors by type
   * @param {string} type - Error type to filter
   * @returns {Array} Filtered errors
   */
  const getErrorsByType = useCallback((type) => {
    return errors.filter(err => err.type === type);
  }, [errors]);

  /**
   * Retry an error if retry function exists
   * @param {string} errorId - Error ID
   */
  const retryError = useCallback(async (errorId) => {
    const error = errors.find(err => err.id === errorId);
    
    if (!error) {
      console.warn(`[ErrorContext] Cannot retry: Error ${errorId} not found`);
      return;
    }
    
    if (!error.retry) {
      console.warn(`[ErrorContext] Cannot retry: No retry function for error ${errorId}`);
      return;
    }
    
    console.log(`[ErrorContext] Retrying error ${errorId}...`);
    
    try {
      // Remove the error before retrying
      removeError(errorId);
      
      // Execute retry function
      await error.retry();
      
      console.log(`[ErrorContext] Retry successful for error ${errorId}`);
    } catch (retryError) {
      console.error(`[ErrorContext] Retry failed for error ${errorId}:`, retryError);
      
      // Add new error for failed retry
      addError(retryError, {
        context: error.context,
        retry: error.retry,
        statusCode: retryError?.response?.status
      });
    }
  }, [errors, removeError, addError]);

  /**
   * Check if there are any critical errors
   * @returns {boolean}
   */
  const hasCriticalErrors = useCallback(() => {
    return errors.some(err => err.severity === ERROR_SEVERITY.CRITICAL);
  }, [errors]);

  /**
   * Get the most recent error
   * @returns {Object|null}
   */
  const getLatestError = useCallback(() => {
    return errors.length > 0 ? errors[errors.length - 1] : null;
  }, [errors]);

  const value = {
    errors,
    globalError,
    addError,
    removeError,
    clearErrors,
    clearErrorsByContext,
    clearErrorsByType,
    getErrorsByContext,
    getErrorsByType,
    retryError,
    hasCriticalErrors,
    getLatestError,
    ERROR_SEVERITY,
    ERROR_TYPES
  };

  return (
    <ErrorContext.Provider value={value}>
      {children}
    </ErrorContext.Provider>
  );
}

ErrorProvider.propTypes = {
  children: PropTypes.node.isRequired
};

/**
 * Hook to use error context
 * @returns {Object} Error context value
 */
export function useError() {
  const context = useContext(ErrorContext);
  
  if (!context) {
    throw new Error('useError must be used within ErrorProvider');
  }
  
  return context;
}

export default ErrorContext;
