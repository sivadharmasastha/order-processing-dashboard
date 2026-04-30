import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import CreateOrderForm from '../components/CreateOrderForm';
import OrderTable from '../components/OrderTable';
import Loader from '../components/Loader';
import { fetchOrders, createOrder, deleteOrder } from '../services/api';

// Static mock orders data for development/demo
const STATIC_ORDERS = [
  {
    id: 'ORD-2026-001',
    customerName: 'John Doe',
    customerEmail: 'john.doe@example.com',
    productName: 'Premium Laptop',
    quantity: 2,
    totalAmount: 2499.98,
    status: 'completed',
    priority: 'high',
    shippingAddress: '123 Main St, New York, NY 10001',
    paymentMethod: 'Credit Card',
    createdAt: '2026-04-28T10:30:00Z',
    updatedAt: '2026-04-29T14:20:00Z',
    notes: 'Express shipping requested'
  },
  {
    id: 'ORD-2026-002',
    customerName: 'Jane Smith',
    customerEmail: 'jane.smith@example.com',
    productName: 'Wireless Headphones',
    quantity: 1,
    totalAmount: 199.99,
    status: 'processing',
    priority: 'medium',
    shippingAddress: '456 Oak Ave, Los Angeles, CA 90001',
    paymentMethod: 'PayPal',
    createdAt: '2026-04-29T08:15:00Z',
    updatedAt: '2026-04-30T09:00:00Z',
    notes: 'Gift wrapping included'
  },
  {
    id: 'ORD-2026-003',
    customerName: 'Robert Johnson',
    customerEmail: 'robert.j@example.com',
    productName: 'Smart Watch Pro',
    quantity: 3,
    totalAmount: 899.97,
    status: 'pending',
    priority: 'low',
    shippingAddress: '789 Pine Rd, Chicago, IL 60601',
    paymentMethod: 'Debit Card',
    createdAt: '2026-04-30T06:45:00Z',
    updatedAt: '2026-04-30T06:45:00Z',
    notes: 'Awaiting payment confirmation'
  },
  {
    id: 'ORD-2026-004',
    customerName: 'Emily Davis',
    customerEmail: 'emily.davis@example.com',
    productName: 'Gaming Console',
    quantity: 1,
    totalAmount: 499.99,
    status: 'completed',
    priority: 'high',
    shippingAddress: '321 Elm St, Houston, TX 77001',
    paymentMethod: 'Credit Card',
    createdAt: '2026-04-27T14:20:00Z',
    updatedAt: '2026-04-28T16:30:00Z',
    notes: 'Delivered on time'
  },
  {
    id: 'ORD-2026-005',
    customerName: 'Michael Brown',
    customerEmail: 'michael.b@example.com',
    productName: '4K Monitor',
    quantity: 2,
    totalAmount: 1199.98,
    status: 'failed',
    priority: 'medium',
    shippingAddress: '654 Maple Dr, Phoenix, AZ 85001',
    paymentMethod: 'Bank Transfer',
    createdAt: '2026-04-29T11:00:00Z',
    updatedAt: '2026-04-30T08:15:00Z',
    notes: 'Payment declined - customer notified'
  },
  {
    id: 'ORD-2026-006',
    customerName: 'Sarah Wilson',
    customerEmail: 'sarah.wilson@example.com',
    productName: 'Bluetooth Speaker',
    quantity: 4,
    totalAmount: 399.96,
    status: 'processing',
    priority: 'low',
    shippingAddress: '987 Cedar Ln, Philadelphia, PA 19101',
    paymentMethod: 'Credit Card',
    createdAt: '2026-04-29T15:30:00Z',
    updatedAt: '2026-04-30T10:00:00Z',
    notes: 'Bulk order discount applied'
  },
  {
    id: 'ORD-2026-007',
    customerName: 'David Martinez',
    customerEmail: 'david.m@example.com',
    productName: 'Tablet Device',
    quantity: 1,
    totalAmount: 699.99,
    status: 'cancelled',
    priority: 'low',
    shippingAddress: '147 Birch Way, San Antonio, TX 78201',
    paymentMethod: 'PayPal',
    createdAt: '2026-04-28T09:00:00Z',
    updatedAt: '2026-04-28T12:00:00Z',
    notes: 'Cancelled by customer request'
  },
  {
    id: 'ORD-2026-008',
    customerName: 'Lisa Anderson',
    customerEmail: 'lisa.anderson@example.com',
    productName: 'Mechanical Keyboard',
    quantity: 2,
    totalAmount: 299.98,
    status: 'completed',
    priority: 'medium',
    shippingAddress: '258 Spruce St, San Diego, CA 92101',
    paymentMethod: 'Credit Card',
    createdAt: '2026-04-26T13:45:00Z',
    updatedAt: '2026-04-27T11:20:00Z',
    notes: 'RGB lighting version shipped'
  },
  {
    id: 'ORD-2026-009',
    customerName: 'James Taylor',
    customerEmail: 'james.taylor@example.com',
    productName: 'Webcam HD',
    quantity: 5,
    totalAmount: 749.95,
    status: 'processing',
    priority: 'high',
    shippingAddress: '369 Willow Ct, Dallas, TX 75201',
    paymentMethod: 'Corporate Account',
    createdAt: '2026-04-30T07:30:00Z',
    updatedAt: '2026-04-30T09:45:00Z',
    notes: 'Corporate bulk order'
  },
  {
    id: 'ORD-2026-010',
    customerName: 'Patricia Thomas',
    customerEmail: 'patricia.t@example.com',
    productName: 'External SSD 1TB',
    quantity: 1,
    totalAmount: 149.99,
    status: 'pending',
    priority: 'medium',
    shippingAddress: '741 Ash Blvd, San Jose, CA 95101',
    paymentMethod: 'Debit Card',
    createdAt: '2026-04-30T10:15:00Z',
    updatedAt: '2026-04-30T10:15:00Z',
    notes: 'New order - processing soon'
  },
  {
    id: 'ORD-2026-011',
    customerName: 'Christopher Lee',
    customerEmail: 'chris.lee@example.com',
    productName: 'USB-C Hub',
    quantity: 3,
    totalAmount: 179.97,
    status: 'completed',
    priority: 'low',
    shippingAddress: '852 Pine Valley Rd, Austin, TX 78701',
    paymentMethod: 'Credit Card',
    createdAt: '2026-04-25T16:00:00Z',
    updatedAt: '2026-04-26T10:30:00Z',
    notes: 'Fast delivery completed'
  },
  {
    id: 'ORD-2026-012',
    customerName: 'Amanda White',
    customerEmail: 'amanda.white@example.com',
    productName: 'Laptop Stand',
    quantity: 1,
    totalAmount: 79.99,
    status: 'processing',
    priority: 'low',
    shippingAddress: '963 Oak Hill Dr, Jacksonville, FL 32201',
    paymentMethod: 'PayPal',
    createdAt: '2026-04-29T17:20:00Z',
    updatedAt: '2026-04-30T08:00:00Z',
    notes: 'Standard shipping selected'
  },
  {
    id: 'ORD-2026-013',
    customerName: 'Daniel Harris',
    customerEmail: 'daniel.harris@example.com',
    productName: 'Noise Cancelling Headphones',
    quantity: 1,
    totalAmount: 349.99,
    status: 'failed',
    priority: 'high',
    shippingAddress: '159 Maple Ridge, Fort Worth, TX 76101',
    paymentMethod: 'Credit Card',
    createdAt: '2026-04-29T12:30:00Z',
    updatedAt: '2026-04-30T07:00:00Z',
    notes: 'Card expired - awaiting update'
  },
  {
    id: 'ORD-2026-014',
    customerName: 'Jennifer Clark',
    customerEmail: 'jennifer.clark@example.com',
    productName: 'Portable Charger',
    quantity: 6,
    totalAmount: 299.94,
    status: 'completed',
    priority: 'medium',
    shippingAddress: '357 Elm Grove, Columbus, OH 43201',
    paymentMethod: 'Debit Card',
    createdAt: '2026-04-27T10:00:00Z',
    updatedAt: '2026-04-28T15:45:00Z',
    notes: 'Bulk order fulfilled successfully'
  },
  {
    id: 'ORD-2026-015',
    customerName: 'Matthew Rodriguez',
    customerEmail: 'matt.rodriguez@example.com',
    productName: 'Wireless Mouse',
    quantity: 10,
    totalAmount: 399.90,
    status: 'pending',
    priority: 'medium',
    shippingAddress: '468 Cedar Creek, Charlotte, NC 28201',
    paymentMethod: 'Corporate Account',
    createdAt: '2026-04-30T11:00:00Z',
    updatedAt: '2026-04-30T11:00:00Z',
    notes: 'Office supplies order - verify stock'
  }
];

function OrdersPage() {
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
   * Fetch orders from API or use static data
   * Set USE_STATIC_DATA to false to enable API calls
   */
  const loadOrders = useCallback(async (silent = false) => {
    const USE_STATIC_DATA = true; // Toggle this to switch between static and API data
    
    try {
      if (!silent) {
        setLoading(true);
      } else {
        setRefreshing(true);
      }
      setError(null);
      
      let ordersArray = [];
      
      if (USE_STATIC_DATA) {
        // Simulate network delay for realistic behavior
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Use static orders data
        ordersArray = [...STATIC_ORDERS];
        console.log('Loaded static orders:', ordersArray.length);
      } else {
        // Fetch from API
        const params = {};
        // You can add API-level filtering here if backend supports it
        // if (statusFilter !== 'all') params.status = statusFilter;
        
        const data = await fetchOrders(params);
        
        // Ensure data is an array
        ordersArray = Array.isArray(data) ? data : data.orders || [];
      }
      
      setOrders(ordersArray);
      
    } catch (err) {
      console.error('Error loading orders:', err);
      
      // Fallback to static data if API fails
      if (!silent) {
        console.warn('API failed, falling back to static data');
        setOrders([...STATIC_ORDERS]);
        setError('Using demo data - API unavailable');
      } else {
        setError(err.message || 'Failed to load orders');
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [statusFilter]);

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
   * Handle order creation
   */
  const handleCreateOrder = async (orderData) => {
    const USE_STATIC_DATA = true; // Should match loadOrders setting
    
    try {
      let newOrder;
      
      if (USE_STATIC_DATA) {
        // Create mock order for static mode
        await new Promise(resolve => setTimeout(resolve, 300)); // Simulate API delay
        
        const orderNumber = orders.length + 1;
        newOrder = {
          id: `ORD-2026-${String(orderNumber).padStart(3, '0')}`,
          ...orderData,
          status: 'pending',
          priority: orderData.priority || 'medium',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          notes: orderData.notes || 'New order created'
        };
        
        console.log('Created static order:', newOrder);
      } else {
        // Use API
        newOrder = await createOrder(orderData);
      }
      
      setOrders([newOrder, ...orders]);
      setShowCreateForm(false);
      setSuccessMessage('Order created successfully!');
      return newOrder;
    } catch (err) {
      throw err;
    }
  };

  /**
   * Handle order deletion
   */
  const handleDeleteOrder = async (orderId) => {
    if (!window.confirm('Are you sure you want to delete this order?')) {
      return;
    }

    const USE_STATIC_DATA = true; // Should match loadOrders setting

    try {
      if (USE_STATIC_DATA) {
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 300));
        console.log('Deleted static order:', orderId);
      } else {
        // Use API
        await deleteOrder(orderId);
      }
      
      setOrders(orders.filter(order => order.id !== orderId));
      setSuccessMessage('Order deleted successfully!');
    } catch (err) {
      setError(err.message || 'Failed to delete order');
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

  // Show loader on initial load
  if (loading && !orders.length) {
    return <Loader />;
  }

  return (
    <div className="orders-page">
      <div className="page-header">
        <h2>Orders Management</h2>
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

          <button 
            className="btn btn-secondary"
            onClick={() => loadOrders()}
            disabled={refreshing}
          >
            {refreshing ? 'Refreshing...' : '↻ Refresh'}
          </button>
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
