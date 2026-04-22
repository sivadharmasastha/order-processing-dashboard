import axios from 'axios';

// Base API URL - Update this based on your backend configuration
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// Create axios instance with default config
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000, // 30 seconds timeout
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - Add auth token if needed
apiClient.interceptors.request.use(
  (config) => {
    // Add authorization token if available
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor - Handle errors globally
apiClient.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // Handle different error scenarios
    if (error.response) {
      // Server responded with error status
      const { status, data } = error.response;
      
      switch (status) {
        case 401:
          console.error('Unauthorized - Invalid credentials');
          break;
        case 403:
          console.error('Forbidden - Access denied');
          break;
        case 404:
          console.error('Not found');
          break;
        case 500:
          console.error('Server error');
          break;
        default:
          console.error(`Error: ${data.message || 'Unknown error'}`);
      }
      
      throw new Error(data.message || `Request failed with status ${status}`);
    } else if (error.request) {
      // Request made but no response received
      console.error('No response from server');
      throw new Error('Unable to connect to server. Please check your connection.');
    } else {
      // Error in setting up request
      console.error('Request error:', error.message);
      throw new Error(error.message);
    }
  }
);

// ============================================
// Order API Functions
// ============================================

/**
 * Fetch all orders
 * @param {Object} params - Query parameters (page, limit, status, etc.)
 * @returns {Promise<Array>} List of orders
 */
export const fetchOrders = async (params = {}) => {
  try {
    const response = await apiClient.get('/orders', { params });
    return response.data;
  } catch (error) {
    throw error;
  }
};

/**
 * Fetch a single order by ID
 * @param {string} orderId - Order ID
 * @returns {Promise<Object>} Order details
 */
export const fetchOrderById = async (orderId) => {
  try {
    const response = await apiClient.get(`/orders/${orderId}`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

/**
 * Create a new order
 * @param {Object} orderData - Order data
 * @returns {Promise<Object>} Created order
 */
export const createOrder = async (orderData) => {
  try {
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
    const response = await apiClient.put(`/orders/${orderId}`, orderData);
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
    const response = await apiClient.post(`/orders/${orderId}/retry`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

/**
 * Get order statistics
 * @returns {Promise<Object>} Order statistics
 */
export const fetchOrderStats = async () => {
  try {
    const response = await apiClient.get('/orders/stats');
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Export the configured axios instance for custom requests
export default apiClient;
