import { useCallback, useRef } from 'react';
import { useError } from '../context/ErrorContext';

/**
 * useErrorHandler Hook
 * Provides utilities for handling errors with automatic retry and recovery
 * Production-level error handling with exponential backoff
 */
function useErrorHandler(context = 'general') {
  const { addError, removeError, clearErrorsByContext } = useError();
  const retryCountRef = useRef(new Map());

  /**
   * Execute an async operation with error handling
   * @param {Function} operation - Async function to execute
   * @param {Object} options - Configuration options
   * @param {number} options.maxRetries - Maximum retry attempts (default: 3)
   * @param {number} options.retryDelay - Base delay between retries in ms (default: 1000)
   * @param {boolean} options.exponentialBackoff - Use exponential backoff (default: true)
   * @param {Function} options.onSuccess - Success callback
   * @param {Function} options.onError - Error callback
   * @param {boolean} options.showError - Show error notification (default: true)
   * @param {number} options.autoHideDuration - Auto-hide error duration in ms
   * @param {string} options.successMessage - Success message to display
   * @returns {Promise<*>} Operation result
   */
  const executeWithErrorHandling = useCallback(async (
    operation,
    options = {}
  ) => {
    const {
      maxRetries = 3,
      retryDelay = 1000,
      exponentialBackoff = true,
      onSuccess = null,
      onError = null,
      showError = true,
      autoHideDuration = 5000,
      successMessage = null
    } = options;

    const operationKey = operation.name || 'anonymous';
    let currentRetry = retryCountRef.current.get(operationKey) || 0;

    /**
     * Execute with retry logic
     */
    const executeWithRetry = async (attemptNumber = 0) => {
      try {
        // Clear any previous errors for this context
        if (attemptNumber === 0) {
          clearErrorsByContext(context);
        }

        // Execute the operation
        const result = await operation();

        // Reset retry count on success
        retryCountRef.current.delete(operationKey);

        // Call success callback
        if (onSuccess) {
          onSuccess(result);
        }

        // Show success message if provided
        if (successMessage) {
          addError(successMessage, {
            context,
            severity: 'info',
            dismissible: true,
            autoHideDuration: 3000
          });
        }

        return result;

      } catch (error) {
        console.error(`Error in ${context} (attempt ${attemptNumber + 1}/${maxRetries + 1}):`, error);

        // Check if we should retry
        const shouldRetry = attemptNumber < maxRetries && isRetryableError(error);

        if (shouldRetry) {
          // Calculate delay with exponential backoff
          const delay = exponentialBackoff
            ? retryDelay * Math.pow(2, attemptNumber)
            : retryDelay;

          console.log(`Retrying in ${delay}ms...`);
          
          // Update retry count
          retryCountRef.current.set(operationKey, attemptNumber + 1);

          // Wait before retrying
          await new Promise(resolve => setTimeout(resolve, delay));

          // Retry the operation
          return executeWithRetry(attemptNumber + 1);

        } else {
          // Reset retry count
          retryCountRef.current.delete(operationKey);

          // Show error notification if enabled
          if (showError) {
            const retryFunction = maxRetries > 0
              ? () => executeWithRetry(0)
              : null;

            addError(error, {
              context,
              retry: retryFunction,
              autoHideDuration: retryFunction ? null : autoHideDuration,
              statusCode: error?.response?.status
            });
          }

          // Call error callback
          if (onError) {
            onError(error);
          }

          throw error;
        }
      }
    };

    return executeWithRetry(currentRetry);
  }, [context, addError, clearErrorsByContext]);

  /**
   * Check if error is retryable
   */
  const isRetryableError = useCallback((error) => {
    const message = error?.message?.toLowerCase() || '';
    const statusCode = error?.response?.status;

    // Network errors are retryable
    if (message.includes('network') || message.includes('timeout') || message.includes('connect')) {
      return true;
    }

    // Specific status codes that are retryable
    const retryableStatusCodes = [408, 429, 500, 502, 503, 504];
    if (statusCode && retryableStatusCodes.includes(statusCode)) {
      return true;
    }

    return false;
  }, []);

  /**
   * Handle error with custom options
   * @param {Error|string} error - Error to handle
   * @param {Object} options - Error options
   */
  const handleError = useCallback((error, options = {}) => {
    addError(error, {
      context,
      ...options
    });
  }, [context, addError]);

  /**
   * Clear all errors for this context
   */
  const clearErrors = useCallback(() => {
    clearErrorsByContext(context);
  }, [context, clearErrorsByContext]);

  /**
   * Create a retry function for manual retry
   * @param {Function} operation - Operation to retry
   * @returns {Function} Retry function
   */
  const createRetryFunction = useCallback((operation) => {
    return async () => {
      try {
        clearErrors();
        const result = await operation();
        return result;
      } catch (error) {
        handleError(error, {
          retry: createRetryFunction(operation)
        });
        throw error;
      }
    };
  }, [clearErrors, handleError]);

  /**
   * Wrap a function with error handling
   * @param {Function} fn - Function to wrap
   * @param {Object} options - Error handling options
   * @returns {Function} Wrapped function
   */
  const withErrorHandling = useCallback((fn, options = {}) => {
    return async (...args) => {
      return executeWithErrorHandling(() => fn(...args), options);
    };
  }, [executeWithErrorHandling]);

  return {
    executeWithErrorHandling,
    handleError,
    clearErrors,
    createRetryFunction,
    withErrorHandling,
    isRetryableError
  };
}

export default useErrorHandler;
