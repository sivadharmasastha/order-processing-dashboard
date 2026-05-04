import React from 'react';
import useApiStatus from '../hooks/useApiStatus';

/**
 * API Connection Status Component
 * Displays the current API connection status with visual indicators
 */
function ApiStatus({ compact = false, showDetails = true }) {
  const { isOnline, isChecking, lastChecked, apiInfo, error, checkApiHealth } = useApiStatus(60000);

  /**
   * Format last checked time
   */
  const formatLastChecked = () => {
    if (!lastChecked) return 'Never';
    
    const now = new Date();
    const diff = Math.floor((now - lastChecked) / 1000); // seconds
    
    if (diff < 60) return `${diff}s ago`;
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    return `${Math.floor(diff / 3600)}h ago`;
  };

  /**
   * Get status color and icon
   */
  const getStatusInfo = () => {
    if (isChecking) {
      return {
        className: 'api-status-checking',
        icon: '🔄',
        text: 'Checking...',
        color: 'var(--info-color)'
      };
    }
    
    if (isOnline) {
      return {
        className: 'api-status-online',
        icon: '🟢',
        text: 'Connected',
        color: 'var(--success-color)'
      };
    }
    
    return {
      className: 'api-status-offline',
      icon: '🔴',
      text: 'Disconnected',
      color: 'var(--error-color)'
    };
  };

  const statusInfo = getStatusInfo();

  /**
   * Handle manual refresh
   */
  const handleRefresh = async (e) => {
    e.preventDefault();
    await checkApiHealth();
  };

  if (compact) {
    return (
      <div className={`api-status-compact ${statusInfo.className}`}>
        <span className="status-indicator" title={statusInfo.text}>
          {statusInfo.icon}
        </span>
        <span className="status-text">{statusInfo.text}</span>
      </div>
    );
  }

  return (
    <div className={`api-status-card ${statusInfo.className}`}>
      <div className="api-status-header">
        <div className="status-main">
          <span className="status-icon">{statusInfo.icon}</span>
          <div className="status-info">
            <h4 className="status-title">API Status: {statusInfo.text}</h4>
            {lastChecked && (
              <p className="status-subtitle">Last checked: {formatLastChecked()}</p>
            )}
          </div>
        </div>
        <button
          onClick={handleRefresh}
          disabled={isChecking}
          className="btn-refresh-status"
          aria-label="Refresh API status"
        >
          {isChecking ? '⏳' : '↻'}
        </button>
      </div>

      {showDetails && (
        <>
          {error && (
            <div className="api-status-error">
              <span className="error-icon">⚠️</span>
              <span>{error}</span>
            </div>
          )}

          {isOnline && apiInfo && (
            <div className="api-status-details">
              {apiInfo.version && (
                <div className="detail-item">
                  <span className="detail-label">Version:</span>
                  <span className="detail-value">{apiInfo.version}</span>
                </div>
              )}
              {apiInfo.environment && (
                <div className="detail-item">
                  <span className="detail-label">Environment:</span>
                  <span className="detail-value">{apiInfo.environment}</span>
                </div>
              )}
              {apiInfo.uptime && (
                <div className="detail-item">
                  <span className="detail-label">Uptime:</span>
                  <span className="detail-value">{apiInfo.uptime}</span>
                </div>
              )}
            </div>
          )}

          {!isOnline && (
            <div className="api-status-actions">
              <button
                onClick={handleRefresh}
                disabled={isChecking}
                className="btn btn-primary btn-small"
              >
                {isChecking ? 'Reconnecting...' : 'Retry Connection'}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default ApiStatus;
