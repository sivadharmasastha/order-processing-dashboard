import axios from 'axios';

// ============================================
// API Configuration
// ============================================

// Base API URL - Configured via environment variables
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
const API_TIMEOUT = parseInt(process.env.REACT_APP_API_TIMEOUT || '30000', 10);
const ENABLE_LOGS = process.env.REACT_APP_ENABLE_API_LOGS === 'true';

// Log configuration in development
if (ENABLE_LOGS) {
  console.log('API Configuration:', {
    baseURL: API_BASE_URL,
    timeout: API_TIMEOUT,
    environment: process.env.REACT_APP_ENV || 'development'
  });
}

// ============================================
// Axios Instance Configuration
// ============================================

// Create axios instance with default config
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: API_TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request ID generator for tracking
let requestIdCounter = 0;
const generateRequestId = () => `req_${Date.now()}_${++requestIdCounter}`;

// ============================================
// Request Interceptor
// ============================================

apiClient.interceptors.request.use(
  (config) => {
    // Generate unique request ID for tracking
    config.metadata = { requestId: generateRequestId(), startTime: Date.now() };
    
    // Add authorization token if available
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // Add custom headers if needed
    config.headers['X-Client-Version'] = process.env.REACT_APP_VERSION || '1.0.0';
    config.headers['X-Request-ID'] = config.metadata.requestId;
    
    // Log request in development
    if (ENABLE_LOGS) {
      console.log(`→ ${config.method.toUpperCase()} ${config.url}`, {
        requestId: config.metadata.requestId,
        params: config.params,
        data: config.data
      });
    }
    
    return config;
  },
  (error) => {
    console.error('Request setup error:', error);
    return Promise.reject(error);
  }
);

// ============================================
// Response Interceptor
// ============================================

apiClient.interceptors.response.use(
  (response) => {
    // Calculate request duration
    const duration = Date.now() - response.config.metadata.startTime;
    
    // Log successful response in development
    if (ENABLE_LOGS) {
      console.log(`← ${response.config.method.toUpperCase()} ${response.config.url}`, {
        requestId: response.config.metadata.requestId,
        status: response.status,
        duration: `${duration}ms`,
        dataSize: JSON.stringify(response.data).length
      });
    }
    
    return response;
  },
  (error) => {
    // Extract request metadata if available
    const metadata = error.config?.metadata || {};
    const duration = metadata.startTime ? Date.now() - metadata.startTime : 0;
    
    // Log error in development
    if (ENABLE_LOGS) {
      console.error(`✖ ${error.config?.method?.toUpperCase() || 'REQUEST'} ${error.config?.url || 'UNKNOWN'}`, {
        requestId: metadata.requestId,
        duration: `${duration}ms`,
        error: error.message
      });
    }
    
    // Handle different error scenarios
    if (error.response) {
      // Server responded with error status
      const { status, data } = error.response;
      
      // Handle specific HTTP status codes
      switch (status) {
        case 400:
          console.error('Bad Request - Invalid data:', data);
          throw new Error(data.message || 'Invalid request data');
          
        case 401:
          console.error('Unauthorized - Authentication required');
          // Clear auth token and redirect to login if needed
          localStorage.removeItem('authToken');
          // window.location.href = '/login'; // Uncomment if you have authentication
          throw new Error('Session expired. Please log in again.');
          
        case 403:
          console.error('Forbidden - Access denied');
          throw new Error(data.message || 'You do not have permission to perform this action');
          
        case 404:
          console.error('Not Found:', error.config.url);
          throw new Error(data.message || 'Resource not found');
          
        case 409:
          console.error('Conflict:', data);
          throw new Error(data.message || 'Resource conflict detected');
          
        case 422:
          console.error('Validation Error:', data);
          throw new Error(data.message || 'Validation failed');
          
        case 429:
          console.error('Rate Limited');
          throw new Error('Too many requests. Please try again later.');
          
        case 500:
          console.error('Server Error:', data);
          throw new Error('Server error. Please try again later.');
          
        case 503:
          console.error('Service Unavailable');
          throw new Error('Service temporarily unavailable. Please try again.');
          
        default:
          console.error(`HTTP Error ${status}:`, data);
          throw new Error(data.message || `Request failed with status ${status}`);
      }
      
    } else if (error.request) {
      // Request made but no response received
      console.error('No response from server:', {
        url: error.config?.url,
        timeout: error.code === 'ECONNABORTED'
      });
      
      if (error.code === 'ECONNABORTED') {
        throw new Error('Request timeout. Please check your connection and try again.');
      }
      
      throw new Error('Unable to connect to server. Please check your internet connection.');
      
    } else {
      // Error in setting up request
      console.error('Request error:', error.message);
      throw new Error(error.message || 'An unexpected error occurred');
    }
  }
);

// ============================================
// Request Cancellation Support
// ============================================

// Store active request cancellation tokens
const pendingRequests = new Map();

/**
 * Cancel a pending request by key
 * @param {string} key - Request identifier
 */
export const cancelRequest = (key) => {
  if (pendingRequests.has(key)) {
    pendingRequests.get(key).cancel('Request cancelled by user');
    pendingRequests.delete(key);
  }
};

/**
 * Cancel all pending requests
 */
export const cancelAllRequests = () => {
  pendingRequests.forEach((source, key) => {
    source.cancel('All requests cancelled');
  });
  pendingRequests.clear();
};

// ============================================
// Order API Functions
// ============================================

/**
 * Fetch all orders with optional filtering and pagination
 * @param {Object} params - Query parameters
 * @param {string} params.status - Filter by status (pending, processing, completed, failed, cancelled)
 * @param {number} params.page - Page number for pagination
 * @param {number} params.limit - Items per page
 * @param {string} params.sortBy - Field to sort by
 * @param {string} params.sortOrder - Sort order (asc, desc)
 * @param {string} params.search - Search query
 * @param {string} requestKey - Unique key for request cancellation
 * @returns {Promise<Array|Object>} List of orders or paginated response
 */
export const fetchOrders = async (params = {}, requestKey = 'fetchOrders') => {
  try {
    // Cancel any existing request with the same key
    cancelRequest(requestKey);
    
    // Create new cancellation token
    const source = axios.CancelToken.source();
    pendingRequests.set(requestKey, source);
    
    const response = await apiClient.get('/orders', { 
      params,
      cancelToken: source.token 
    });
    
    // Remove from pending requests
    pendingRequests.delete(requestKey);
    
    return response.data;
  } catch (error) {
    pendingRequests.delete(requestKey);
    
    if (axios.isCancel(error)) {
      console.log('Request cancelled:', error.message);
      throw new Error('Request cancelled');
    }
    
    throw error;
  }
};

/**
 * Fetch a single order by ID
 * @param {string} orderId - Order ID
 * @param {string} requestKey - Unique key for request cancellation
 * @returns {Promise<Object>} Order details
 */
export const fetchOrderById = async (orderId, requestKey = `fetchOrder_${orderId}`) => {
  try {
    if (!orderId) {
      throw new Error('Order ID is required');
    }
    
    // Cancel any existing request with the same key
    cancelRequest(requestKey);
    
    // Create new cancellation token
    const source = axios.CancelToken.source();
    pendingRequests.set(requestKey, source);
    
    const response = await apiClient.get(`/orders/${orderId}`, {
      cancelToken: source.token
    });
    
    // Remove from pending requests
    pendingRequests.delete(requestKey);
    
    return response.data;
  } catch (error) {
    pendingRequests.delete(requestKey);
    
    if (axios.isCancel(error)) {
      console.log('Request cancelled:', error.message);
      throw new Error('Request cancelled');
    }
    
    throw error;
  }
};

/**
 * Create a new order
 * @param {Object} orderData - Order data
 * @param {string} orderData.customerName - Customer name (required)
 * @param {string} orderData.customerEmail - Customer email (required)
 * @param {string} orderData.productName - Product name (required)
 * @param {number} orderData.quantity - Quantity (required, min: 1)
 * @param {number} orderData.totalAmount - Total amount (required, min: 0)
 * @param {string} orderData.priority - Priority (low, medium, high)
 * @param {string} orderData.shippingAddress - Shipping address
 * @param {string} orderData.paymentMethod - Payment method
 * @param {string} orderData.notes - Additional notes
 * @returns {Promise<Object>} Created order
 */
export const createOrder = async (orderData) => {
  try {
    // Validate required fields
    const requiredFields = ['customerName', 'customerEmail', 'productName', 'quantity', 'totalAmount'];
    const missingFields = requiredFields.filter(field => !orderData[field]);
    
    if (missingFields.length > 0) {
      throw new Error(`Missing required fields: ${missingFields.join(', ')}`);
    }
    
    // Validate data types and ranges
    if (typeof orderData.quantity !== 'number' || orderData.quantity < 1) {
      throw new Error('Quantity must be a number greater than 0');
    }
    
    if (typeof orderData.totalAmount !== 'number' || orderData.totalAmount < 0) {
      throw new Error('Total amount must be a non-negative number');
    }
    
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(orderData.customerEmail)) {
      throw new Error('Invalid email format');
    }
    
    const response = await apiClient.post('/orders', orderData);
    
    return response.data;
  } catch (error) {
    throw error;
  }
};

/**
 * Update an existing order
 * @param {string} orderId - Order ID
 * @param {Object} orderData - Updated order data
 * @returns {Promise<Object>} Updated order
 */
export const updateOrder = async (orderId, orderData) => {
  try {
    if (!orderId) {
      throw new Error('Order ID is required');
    }
    
    const response = await apiClient.put(`/orders/${orderId}`, orderData);
    
    return response.data;
  } catch (error) {
    throw error;
  }
};

/**
 * Partially update an order (PATCH)
 * @param {string} orderId - Order ID
 * @param {Object} updates - Partial order updates
 * @returns {Promise<Object>} Updated order
 */
export const patchOrder = async (orderId, updates) => {
  try {
    if (!orderId) {
      throw new Error('Order ID is required');
    }
    
    const response = await apiClient.patch(`/orders/${orderId}`, updates);
    
    return response.data;
  } catch (error) {
    throw error;
  }
};

/**
 * Delete an order
 * @param {string} orderId - Order ID
 * @returns {Promise<Object>} Deletion confirmation
 */
export const deleteOrder = async (orderId) => {
  try {
    if (!orderId) {
      throw new Error('Order ID is required');
    }
    
    const response = await apiClient.delete(`/orders/${orderId}`);
    
    return response.data;
  } catch (error) {
    throw error;
  }
};

/**
 * Retry a failed order
 * @param {string} orderId - Order ID
 * @returns {Promise<Object>} Retry result
 */
export const retryOrder = async (orderId) => {
  try {
    if (!orderId) {
      throw new Error('Order ID is required');
    }
    
    const response = await apiClient.post(`/orders/${orderId}/retry`);
    
    return response.data;
  } catch (error) {
    throw error;
  }
};

/**
 * Cancel an order
 * @param {string} orderId - Order ID
 * @param {string} reason - Cancellation reason
 * @returns {Promise<Object>} Cancellation result
 */
export const cancelOrder = async (orderId, reason = '') => {
  try {
    if (!orderId) {
      throw new Error('Order ID is required');
    }
    
    const response = await apiClient.post(`/orders/${orderId}/cancel`, { reason });
    
    return response.data;
  } catch (error) {
    throw error;
  }
};

/**
 * Get order statistics
 * @param {Object} params - Query parameters for filtering stats
 * @returns {Promise<Object>} Order statistics
 */
export const fetchOrderStats = async (params = {}) => {
  try {
    const response = await apiClient.get('/orders/stats', { params });
    
    return response.data;
  } catch (error) {
    throw error;
  }
};

/**
 * Bulk delete orders
 * @param {Array<string>} orderIds - Array of order IDs to delete
 * @returns {Promise<Object>} Bulk delete result
 */
export const bulkDeleteOrders = async (orderIds) => {
  try {
    if (!Array.isArray(orderIds) || orderIds.length === 0) {
      throw new Error('Order IDs array is required');
    }
    
    const response = await apiClient.post('/orders/bulk-delete', { orderIds });
    
    return response.data;
  } catch (error) {
    throw error;
  }
};

/**
 * Bulk update orders status
 * @param {Array<string>} orderIds - Array of order IDs
 * @param {string} status - New status
 * @returns {Promise<Object>} Bulk update result
 */
export const bulkUpdateOrderStatus = async (orderIds, status) => {
  try {
    if (!Array.isArray(orderIds) || orderIds.length === 0) {
      throw new Error('Order IDs array is required');
    }
    
    if (!status) {
      throw new Error('Status is required');
    }
    
    const response = await apiClient.post('/orders/bulk-update-status', { 
      orderIds, 
      status 
    });
    
    return response.data;
  } catch (error) {
    throw error;
  }
};

/**
 * Export orders to CSV
 * @param {Object} params - Export parameters (filters, columns, etc.)
 * @returns {Promise<Blob>} CSV file blob
 */
export const exportOrders = async (params = {}) => {
  try {
    const response = await apiClient.get('/orders/export', { 
      params,
      responseType: 'blob' 
    });
    
    return response.data;
  } catch (error) {
    throw error;
  }
};

// ============================================
// Health Check & Utility Functions
// ============================================

/**
 * Check API health status
 * @returns {Promise<Object>} Health status
 */
export const checkHealth = async () => {
  try {
    const response = await apiClient.get('/health');
    return response.data;
  } catch (error) {
    throw error;
  }
};

/**
 * Get API version information
 * @returns {Promise<Object>} Version info
 */
export const getApiVersion = async () => {
  try {
    const response = await apiClient.get('/version');
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Export the configured axios instance for custom requests
export default apiClient;
