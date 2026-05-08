/**
 * API Error Interceptor Setup
 * Integrates API error handling with global ErrorContext
 * Call setupApiErrorHandler(errorContextInstance) after app initialization
 */

let errorHandler = null;

/**
 * Setup global API error handler
 * This should be called once in your App component after ErrorProvider is mounted
 * @param {Object} errorContext - Error context instance from useError hook
 */
export function setupApiErrorHandler(errorContext) {
  errorHandler = errorContext;
  console.log('[API] Global error handler configured');
}

/**
 * Get the error handler instance
 * @returns {Object|null} Error handler instance
 */
export function getApiErrorHandler() {
  return errorHandler;
}

/**
 * Handle API error globally
 * This is called by API interceptors to route errors to the global error system
 * @param {Error} error - Error object
 * @param {Object} options - Additional options
 */
export function handleApiError(error, options = {}) {
  if (!errorHandler) {
    console.warn('[API] Error handler not configured, error not tracked globally');
    return;
  }

  const { context = 'api', retry = null, autoHideDuration = null } = options;

  errorHandler.addError(error, {
    context,
    retry,
    autoHideDuration,
    statusCode: error?.response?.status
  });
}

/**
 * Clear API errors from global error state
 * @param {string} context - Context to clear (default: 'api')
 */
export function clearApiErrors(context = 'api') {
  if (!errorHandler) {
    console.warn('[API] Error handler not configured');
    return;
  }

  errorHandler.clearErrorsByContext(context);
}
