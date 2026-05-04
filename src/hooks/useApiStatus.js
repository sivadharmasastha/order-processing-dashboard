import { useState, useEffect, useCallback } from 'react';
import { checkHealth } from '../services/api';

/**
 * Custom hook to monitor API connection status
 * @param {number} checkInterval - Interval in milliseconds to check API health (default: 30000)
 * @returns {Object} API status object
 */
function useApiStatus(checkInterval = 30000) {
  const [isOnline, setIsOnline] = useState(true);
  const [isChecking, setIsChecking] = useState(false);
  const [lastChecked, setLastChecked] = useState(null);
  const [apiInfo, setApiInfo] = useState(null);
  const [error, setError] = useState(null);

  /**
   * Check API health
   */
  const checkApiHealth = useCallback(async (silent = false) => {
    if (!silent) {
      setIsChecking(true);
    }
    setError(null);

    try {
      const healthData = await checkHealth();
      setIsOnline(true);
      setApiInfo(healthData);
      setLastChecked(new Date());
      return true;
    } catch (err) {
      console.error('API health check failed:', err);
      setIsOnline(false);
      setApiInfo(null);
      setError(err.message || 'API unavailable');
      setLastChecked(new Date());
      return false;
    } finally {
      if (!silent) {
        setIsChecking(false);
      }
    }
  }, []);

  /**
   * Initial check and periodic health checks
   */
  useEffect(() => {
    // Initial check
    checkApiHealth(true);

    // Set up periodic checking if interval is provided
    if (checkInterval > 0) {
      const intervalId = setInterval(() => {
        checkApiHealth(true);
      }, checkInterval);

      return () => clearInterval(intervalId);
    }
  }, [checkInterval, checkApiHealth]);

  /**
   * Listen to online/offline events
   */
  useEffect(() => {
    const handleOnline = () => {
      console.log('Browser is online, checking API...');
      checkApiHealth(true);
    };

    const handleOffline = () => {
      console.log('Browser is offline');
      setIsOnline(false);
      setError('No internet connection');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [checkApiHealth]);

  return {
    isOnline,
    isChecking,
    lastChecked,
    apiInfo,
    error,
    checkApiHealth,
  };
}

export default useApiStatus;
