import React, { createContext, useContext, useState, useCallback } from 'react';
import PropTypes from 'prop-types';

/**
 * LoadingContext
 * Global loading state management for production-level applications
 * Manages multiple concurrent loading operations with unique identifiers
 */
const LoadingContext = createContext();

export function LoadingProvider({ children }) {
  const [loadingStates, setLoadingStates] = useState({});

  /**
   * Start a loading operation
   * @param {string} key - Unique identifier for the operation
   * @param {string} message - Optional message to display
   */
  const startLoading = useCallback((key, message = 'Loading...') => {
    setLoadingStates(prev => ({
      ...prev,
      [key]: { loading: true, message, startTime: Date.now() }
    }));
  }, []);

  /**
   * Stop a loading operation
   * @param {string} key - Unique identifier for the operation
   */
  const stopLoading = useCallback((key) => {
    setLoadingStates(prev => {
      const newState = { ...prev };
      delete newState[key];
      return newState;
    });
  }, []);

  /**
   * Check if a specific operation is loading
   * @param {string} key - Unique identifier for the operation
   * @returns {boolean}
   */
  const isLoading = useCallback((key) => {
    return loadingStates[key]?.loading || false;
  }, [loadingStates]);

  /**
   * Check if any operation is loading
   * @returns {boolean}
   */
  const isAnyLoading = useCallback(() => {
    return Object.keys(loadingStates).length > 0;
  }, [loadingStates]);

  /**
   * Get loading message for a specific operation
   * @param {string} key - Unique identifier for the operation
   * @returns {string|null}
   */
  const getLoadingMessage = useCallback((key) => {
    return loadingStates[key]?.message || null;
  }, [loadingStates]);

  /**
   * Wrap an async operation with loading state
   * @param {string} key - Unique identifier for the operation
   * @param {Function} operation - Async function to execute
   * @param {string} message - Optional loading message
   * @returns {Promise}
   */
  const withLoading = useCallback(async (key, operation, message = 'Loading...') => {
    try {
      startLoading(key, message);
      const result = await operation();
      return result;
    } finally {
      stopLoading(key);
    }
  }, [startLoading, stopLoading]);

  const value = {
    loadingStates,
    startLoading,
    stopLoading,
    isLoading,
    isAnyLoading,
    getLoadingMessage,
    withLoading
  };

  return (
    <LoadingContext.Provider value={value}>
      {children}
    </LoadingContext.Provider>
  );
}

LoadingProvider.propTypes = {
  children: PropTypes.node.isRequired
};

/**
 * Hook to use loading context
 * @returns {Object} Loading context value
 */
export function useLoading() {
  const context = useContext(LoadingContext);
  if (!context) {
    throw new Error('useLoading must be used within a LoadingProvider');
  }
  return context;
}

export default LoadingContext;
