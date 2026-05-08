import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import CreateOrderForm from '../components/CreateOrderForm';
import OrderTable from '../components/OrderTable';
import Loader from '../components/Loader';
import ApiStatus from '../components/ApiStatus';
import { TableSkeleton } from '../components/SkeletonLoader';
import ButtonWithLoading from '../components/ButtonWithLoading';
import { InlineError } from '../components/ErrorNotification';
import { fetchOrders, createOrder, deleteOrder } from '../services/api';
import useApiStatus from '../hooks/useApiStatus';
import useErrorHandler from '../hooks/useErrorHandler';

function OrdersPage() {
  // Error handling
  const { executeWithErrorHandling, clearErrors } = useErrorHandler('orders-page');
  
  // API Status
  const { isOnline: apiOnline } = useApiStatus(60000);
  
  // State management
  const [orders, setOrders] = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [successMessage, setSuccessMessage] = useState(null);
  
  // Filter and pagination state
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '');
  const [statusFilter, setStatusFilter] = useState(searchParams.get('status') || 'all');
  const [sortBy, setSortBy] = useState(searchParams.get('sortBy') || 'createdAt');
  const [sortOrder, setSortOrder] = useState(searchParams.get('sortOrder') || 'desc');
  const [currentPage, setCurrentPage] = useState(parseInt(searchParams.get('page') || '1'));
  const [itemsPerPage] = useState(10);
  
  // Auto-refresh settings
  const [autoRefresh, setAutoRefresh] = useState(false);
  const autoRefreshIntervalRef = useRef(null);
  
  const navigate = useNavigate();

  // Load orders on component mount and when filters change
  useEffect(() => {
    loadOrders();
  }, []);

  // Update URL params when filters change
  useEffect(() => {
    const params = {};
    if (searchQuery) params.search = searchQuery;
    if (statusFilter !== 'all') params.status = statusFilter;
    if (sortBy !== 'createdAt') params.sortBy = sortBy;
    if (sortOrder !== 'desc') params.sortOrder = sortOrder;
    if (currentPage !== 1) params.page = currentPage.toString();
    setSearchParams(params);
  }, [searchQuery, statusFilter, sortBy, sortOrder, currentPage, setSearchParams]);

  // Apply filters and sorting
  useEffect(() => {
    applyFilters();
  }, [orders, searchQuery, statusFilter, sortBy, sortOrder]);

  // Auto-refresh effect
  useEffect(() => {
    if (autoRefresh) {
      autoRefreshIntervalRef.current = setInterval(() => {
        loadOrders(true);
      }, 30000); // Refresh every 30 seconds
    } else {
      if (autoRefreshIntervalRef.current) {
        clearInterval(autoRefreshIntervalRef.current);
      }
    }

    return () => {
      if (autoRefreshIntervalRef.current) {
        clearInterval(autoRefreshIntervalRef.current);
      }
    };
  }, [autoRefresh]);

  // Auto-dismiss success messages
  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => {
        setSuccessMessage(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  /**
   * Fetch orders from API with production-level error handling
   * Uses useErrorHandler hook with automatic retry logic
   */
  const loadOrders = useCallback(async (silent = false) => {
    try {
      if (!silent) {
        setLoading(true);
      } else {
        setRefreshing(true);
      }
      setError(null);
      clearErrors(); // Clear previous errors
      
      // Use executeWithErrorHandling for automatic retry and error management
      const data = await executeWithErrorHandling(
        async () => {
          // Build query parameters for API filtering
          const params = {};
          if (statusFilter !== 'all') {
            params.status = statusFilter;
          }
          
          return await fetchOrders(params);
        },
        {
          maxRetries: 3,
          retryDelay: 1000,
          exponentialBackoff: true,
          showError: true,
          autoHideDuration: 5000
        }
      );
      
      // Handle different response formats
      let ordersArray = [];
      if (Array.isArray(data)) {
        ordersArray = data;
      } else if (data && typeof data === 'object') {
        ordersArray = data.orders || data.data || [];
      }
      
      // Validate order data structure
      ordersArray = ordersArray.filter(order => 
        order && order.id && order.customerName
      );
      
      setOrders(ordersArray);
      console.log(`✓ Successfully loaded ${ordersArray.length} orders from API`);
      
    } catch (err) {
      console.error('Error loading orders:', err);
      
      // Set local error message for inline display
      let errorMessage = 'Failed to load orders';
      
      if (err.message.includes('Network Error') || err.message.includes('connect')) {
        errorMessage = 'Unable to connect to server. Please check your internet connection.';
      } else if (err.message.includes('timeout')) {
        errorMessage = 'Request timed out. Please try again.';
      } else if (err.message.includes('401')) {
        errorMessage = 'Session expired. Please log in again.';
      } else if (err.message.includes('403')) {
        errorMessage = 'You do not have permission to view orders.';
      } else if (err.message.includes('500')) {
        errorMessage = 'Server error. Our team has been notified.';
      } else {
        errorMessage = err.message || 'An unexpected error occurred.';
      }
      
      setError(errorMessage);
      
      // Keep existing orders on silent refresh failure
      if (!silent) {
        setOrders([]);
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [statusFilter, executeWithErrorHandling, clearErrors]);

  /**
   * Apply client-side filters and sorting
   */
  const applyFilters = useCallback(() => {
    let filtered = [...orders];

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(order => 
        order.id?.toLowerCase().includes(query) ||
        order.customerName?.toLowerCase().includes(query) ||
        order.status?.toLowerCase().includes(query) ||
        order.productName?.toLowerCase().includes(query)
      );
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(order => 
        order.status?.toLowerCase() === statusFilter.toLowerCase()
      );
    }

    // Sorting
    filtered.sort((a, b) => {
      let aValue = a[sortBy];
      let bValue = b[sortBy];

      // Handle date sorting
      if (sortBy === 'createdAt' || sortBy === 'updatedAt') {
        aValue = new Date(aValue).getTime();
        bValue = new Date(bValue).getTime();
      }

      // Handle string sorting
      if (typeof aValue === 'string') {
        aValue = aValue.toLowerCase();
        bValue = bValue?.toLowerCase() || '';
      }

      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    setFilteredOrders(filtered);
    
    // Reset to page 1 if current page is out of bounds
    const totalPages = Math.ceil(filtered.length / itemsPerPage);
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(1);
    }
  }, [orders, searchQuery, statusFilter, sortBy, sortOrder, currentPage, itemsPerPage]);

  /**
   * Handle order creation with API integration
   */
  const handleCreateOrder = async (orderData) => {
    // Validate order data before sending
    if (!orderData.customerName || !orderData.customerEmail || !orderData.productName) {
      throw new Error('Missing required fields');
    }
    
    try {
      // Use executeWithErrorHandling for automatic retry and error management
      const newOrder = await executeWithErrorHandling(
        async () => await createOrder(orderData),
        {
          maxRetries: 2,
          retryDelay: 1000,
          exponentialBackoff: true,
          showError: true,
          successMessage: `Order created successfully!`
        }
      );
      
      // Update local state optimistically
      setOrders(prevOrders => [newOrder, ...prevOrders]);
      setShowCreateForm(false);
      setSuccessMessage(`Order ${newOrder.id || 'created'} successfully!`);
      
      console.log('✓ Order created:', newOrder.id);
      
      return newOrder;
    } catch (err) {
      console.error('Error creating order:', err);
      throw err;
    }
  };

  /**
   * Handle order deletion with API integration
   */
  const handleDeleteOrder = async (orderId) => {
    if (!window.confirm(`Are you sure you want to delete order ${orderId}? This action cannot be undone.`)) {
      return;
    }

    // Store original orders for rollback
    const originalOrders = [...orders];
    
    try {
      // Optimistic update - remove from UI immediately
      setOrders(prevOrders => prevOrders.filter(order => order.id !== orderId));
      
      // Use executeWithErrorHandling for automatic retry and error management
      await executeWithErrorHandling(
        async () => await deleteOrder(orderId),
        {
          maxRetries: 2,
          retryDelay: 1000,
          exponentialBackoff: true,
          showError: true,
          successMessage: `Order ${orderId} deleted successfully!`
        }
      );
      
      setSuccessMessage(`Order ${orderId} deleted successfully!`);
      console.log('✓ Order deleted:', orderId);
      
    } catch (err) {
      console.error('Error deleting order:', err);
      
      // Rollback on failure
      setOrders(originalOrders);
      setError('Failed to delete order. Please try again.');
    }
  };

  /**
   * Navigate to order details
   */
  const handleOrderClick = (orderId) => {
    navigate(`/orders/${orderId}`);
  };

  /**
   * Handle search input change
   */
  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
    setCurrentPage(1);
  };

  /**
   * Handle status filter change
   */
  const handleStatusFilterChange = (e) => {
    setStatusFilter(e.target.value);
    setCurrentPage(1);
  };

  /**
   * Handle sort change
   */
  const handleSortChange = (field) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
  };

  /**
   * Pagination calculations
   */
  const totalPages = Math.ceil(filteredOrders.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentOrders = filteredOrders.slice(startIndex, endIndex);

  /**
   * Render pagination controls
   */
  const renderPagination = () => {
    if (totalPages <= 1) return null;

    const pages = [];
    const maxVisiblePages = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

    if (endPage - startPage < maxVisiblePages - 1) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }

    return (
      <div className="pagination">
        <button
          onClick={() => setCurrentPage(1)}
          disabled={currentPage === 1}
          className="pagination-btn"
        >
          First
        </button>
        <button
          onClick={() => setCurrentPage(currentPage - 1)}
          disabled={currentPage === 1}
          className="pagination-btn"
        >
          Previous
        </button>
        
        {startPage > 1 && (
          <>
            <button onClick={() => setCurrentPage(1)} className="pagination-btn">1</button>
            {startPage > 2 && <span className="pagination-ellipsis">...</span>}
          </>
        )}
        
        {pages.map(page => (
          <button
            key={page}
            onClick={() => setCurrentPage(page)}
            className={`pagination-btn ${currentPage === page ? 'active' : ''}`}
          >
            {page}
          </button>
        ))}
        
        {endPage < totalPages && (
          <>
            {endPage < totalPages - 1 && <span className="pagination-ellipsis">...</span>}
            <button onClick={() => setCurrentPage(totalPages)} className="pagination-btn">
              {totalPages}
            </button>
          </>
        )}
        
        <button
          onClick={() => setCurrentPage(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="pagination-btn"
        >
          Next
        </button>
        <button
          onClick={() => setCurrentPage(totalPages)}
          disabled={currentPage === totalPages}
          className="pagination-btn"
        >
          Last
        </button>
      </div>
    );
  };

  // Show skeleton loader on initial load
  if (loading && !orders.length) {
    return (
      <div className="orders-page">
        <div className="page-header">
          <div>
            <h2>Orders Management</h2>
          </div>
        </div>
        <div className="orders-controls">
          <div className="skeleton-search-bar" style={{ height: '40px', borderRadius: '6px' }} />
        </div>
        <div className="orders-section">
          <div className="section-header">
            <h3>Loading orders...</h3>
          </div>
          <TableSkeleton rows={10} columns={8} />
        </div>
      </div>
    );
  }

  return (
    <div className="orders-page">
      {/* Refreshing Indicator */}
      {refreshing && (
        <div className="refreshing-indicator">
          <span className="spinner-small"></span>
          <span>Refreshing data...</span>
        </div>
      )}

      {/* API Connection Banner */}
      {!apiOnline && (
        <div className="connection-banner">
          <span>⚠️ API Connection Lost - Working in offline mode</span>
        </div>
      )}

      <div className="page-header">
        <div>
          <h2>Orders Management</h2>
          <div className="page-header-status">
            <ApiStatus compact={true} showDetails={false} />
          </div>
        </div>
        <button 
          className="btn btn-primary"
          onClick={() => setShowCreateForm(!showCreateForm)}
        >
          {showCreateForm ? 'Cancel' : '+ Create New Order'}
        </button>
      </div>

      {/* Success Message */}
      {successMessage && (
        <div className="success-message">
          <p>✓ {successMessage}</p>
          <button onClick={() => setSuccessMessage(null)}>×</button>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="error-message">
          <p>⚠ {error}</p>
          <button onClick={() => loadOrders()}>Retry</button>
          <button onClick={() => setError(null)}>×</button>
        </div>
      )}

      {/* Create Order Form */}
      {showCreateForm && (
        <div className="create-order-section">
          <CreateOrderForm 
            onSubmit={handleCreateOrder}
            onCancel={() => setShowCreateForm(false)}
          />
        </div>
      )}

      {/* Filters and Controls */}
      <div className="orders-controls">
        <div className="search-bar">
          <input
            type="text"
            placeholder="Search by ID, customer, status, or product..."
            value={searchQuery}
            onChange={handleSearchChange}
            className="search-input"
          />
          {searchQuery && (
            <button 
              className="clear-search"
              onClick={() => setSearchQuery('')}
            >
              ×
            </button>
          )}
        </div>

        <div className="filters">
          <select 
            value={statusFilter} 
            onChange={handleStatusFilterChange}
            className="filter-select"
          >
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="processing">Processing</option>
            <option value="completed">Completed</option>
            <option value="failed">Failed</option>
            <option value="cancelled">Cancelled</option>
          </select>

          <label className="auto-refresh-toggle">
            <input
              type="checkbox"
              checked={autoRefresh}
              onChange={(e) => setAutoRefresh(e.target.checked)}
            />
            Auto-refresh (30s)
          </label>

          <ButtonWithLoading
            variant="secondary"
            onClick={() => loadOrders()}
            loading={refreshing}
            loadingText="Refreshing..."
            icon="↻"
          >
            Refresh
          </ButtonWithLoading>
        </div>
      </div>

      {/* Orders Section */}
      <div className="orders-section">
        <div className="section-header">
          <h3>
            {filteredOrders.length} {filteredOrders.length === 1 ? 'Order' : 'Orders'}
            {searchQuery && ` matching "${searchQuery}"`}
            {statusFilter !== 'all' && ` (${statusFilter})`}
          </h3>
          <div className="results-info">
            {filteredOrders.length > 0 && (
              <span>
                Showing {startIndex + 1}-{Math.min(endIndex, filteredOrders.length)} of {filteredOrders.length}
              </span>
            )}
          </div>
        </div>

        {filteredOrders.length === 0 ? (
          <div className="empty-state">
            {orders.length === 0 ? (
              <>
                <p>No orders found. Create your first order to get started!</p>
                <button 
                  className="btn btn-primary"
                  onClick={() => setShowCreateForm(true)}
                >
                  Create Order
                </button>
              </>
            ) : (
              <>
                <p>No orders match your filters.</p>
                <button 
                  className="btn btn-secondary"
                  onClick={() => {
                    setSearchQuery('');
                    setStatusFilter('all');
                  }}
                >
                  Clear Filters
                </button>
              </>
            )}
          </div>
        ) : (
          <>
            <OrderTable 
              orders={currentOrders}
              onOrderClick={handleOrderClick}
              onDeleteOrder={handleDeleteOrder}
              sortBy={sortBy}
              sortOrder={sortOrder}
              onSortChange={handleSortChange}
            />
            {renderPagination()}
          </>
        )}
      </div>
    </div>
  );
}

export default OrdersPage;
