import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Loader from '../components/Loader';
import { CardSkeleton } from '../components/SkeletonLoader';
import ButtonWithLoading from '../components/ButtonWithLoading';
import { InlineError } from '../components/ErrorNotification';
import { fetchOrderById, updateOrder, retryOrder, patchOrder, cancelOrder } from '../services/api';
import useErrorHandler from '../hooks/useErrorHandler';

function OrderDetails() {
  const { orderId } = useParams();
  const navigate = useNavigate();
  
  // Error handling
  const { executeWithErrorHandling, clearErrors } = useErrorHandler('order-details');
  
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [updating, setUpdating] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editedOrder, setEditedOrder] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const [editFormErrors, setEditFormErrors] = useState({});
  const [isEditFormValid, setIsEditFormValid] = useState(true);

  useEffect(() => {
    loadOrderDetails();
  }, [orderId]);

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
   * Load order details with structured response handling
   * Uses useErrorHandler hook for automatic retry and error management
   */
  const loadOrderDetails = async () => {
    try {
      setLoading(true);
      setError(null);
      clearErrors(); // Clear previous errors
      
      // Use executeWithErrorHandling for automatic retry and error management
      const orderData = await executeWithErrorHandling(
        async () => {
          const response = await fetchOrderById(orderId);
          
          // Handle different response structures
          let data = null;
          if (response && typeof response === 'object') {
            if (response.data && typeof response.data === 'object') {
              data = response.data;
            } else if (response.order && typeof response.order === 'object') {
              data = response.order;
            } else if (response.id) {
              data = response;
            }
          }
          
          // Validate order data
          if (!data || !data.id) {
            throw new Error('Invalid order data received from server');
          }
          
          return data;
        },
        {
          maxRetries: 3,
          retryDelay: 1000,
          exponentialBackoff: true,
          showError: true,
          autoHideDuration: 5000
        }
      );
      
      setOrder(orderData);
      setEditedOrder(orderData);
      console.log('✓ Order details loaded:', orderData.id);
      
    } catch (err) {
      console.error('Error loading order details:', err);
      
      // Set local error message for inline display
      let errorMessage = 'Failed to load order details';
      
      if (err.message.includes('Network Error') || err.message.includes('connect')) {
        errorMessage = 'Unable to connect to server. Please check your internet connection.';
      } else if (err.message.includes('404') || err.message.includes('not found')) {
        errorMessage = 'Order not found. It may have been deleted or the ID is incorrect.';
      } else if (err.message.includes('403') || err.message.includes('Forbidden')) {
        errorMessage = 'You do not have permission to view this order.';
      } else if (err.message.includes('401') || err.message.includes('Unauthorized')) {
        errorMessage = 'Session expired. Please log in again.';
      } else if (err.message.includes('500')) {
        errorMessage = 'Server error occurred. Our team has been notified.';
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Handle retry order
   * Uses useErrorHandler for automatic retry and error management
   */
  const handleRetry = async () => {
    if (!window.confirm(`Retry processing order ${orderId}? This will attempt to reprocess the order.`)) {
      return;
    }
    
    try {
      setUpdating(true);
      setError(null);
      clearErrors();
      
      await executeWithErrorHandling(
        async () => await retryOrder(orderId),
        {
          maxRetries: 2,
          retryDelay: 1000,
          exponentialBackoff: true,
          showError: true,
          successMessage: 'Order retry initiated successfully!'
        }
      );
      
      setSuccessMessage('Order retry initiated successfully!');
      
      // Reload order details to get updated status
      await loadOrderDetails();
      
    } catch (err) {
      console.error('Error retrying order:', err);
      setError(err.message || 'Failed to retry order');
    } finally {
      setUpdating(false);
    }
  };

  /**
   * Handle cancel order
   * Uses useErrorHandler for automatic retry and error management
   */
  const handleCancel = async () => {
    const reason = window.prompt('Please provide a reason for cancellation (optional):');
    if (reason === null) return; // User clicked cancel
    
    try {
      setUpdating(true);
      setError(null);
      clearErrors();
      
      await executeWithErrorHandling(
        async () => await cancelOrder(orderId, reason),
        {
          maxRetries: 2,
          retryDelay: 1000,
          exponentialBackoff: true,
          showError: true,
          successMessage: 'Order cancelled successfully!'
        }
      );
      
      setSuccessMessage('Order cancelled successfully!');
      
      // Reload order details to get updated status
      await loadOrderDetails();
      
    } catch (err) {
      console.error('Error cancelling order:', err);
      setError(err.message || 'Failed to cancel order');
    } finally {
      setUpdating(false);
    }
  };

  /**
   * Handle status update
   */
  const handleStatusUpdate = async (newStatus) => {
    if (!window.confirm(`Change order status to "${newStatus}"?`)) {
      return;
    }
    
    try {
      setUpdating(true);
      setError(null);
      
      const updatedOrder = await patchOrder(orderId, { status: newStatus });
      
      // Handle structured response
      const orderData = updatedOrder.data || updatedOrder.order || updatedOrder;
      setOrder(orderData);
      setEditedOrder(orderData);
      
      setSuccessMessage(`Order status updated to "${newStatus}"!`);
      
    } catch (err) {
      console.error('Error updating status:', err);
      setError(err.message || 'Failed to update order status');
    } finally {
      setUpdating(false);
    }
  };

  /**
   * Start editing mode
   */
  const handleEdit = () => {
    setIsEditing(true);
    setEditedOrder({ ...order });
  };

  /**
   * Cancel editing
   */
  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditedOrder({ ...order });
  };

  /**
   * Handle edit form change with validation
   */
  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditedOrder(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Validate field
    validateEditField(name, value);
    
    // Clear general error
    if (error) {
      setError(null);
    }
  };

  /**
   * Validate edit form field
   */
  const validateEditField = (name, value) => {
    let errorMessage = '';
    
    switch (name) {
      case 'customerName':
        if (!value?.trim()) {
          errorMessage = 'Customer name is required';
        } else if (value.trim().length < 2) {
          errorMessage = 'Name must be at least 2 characters';
        }
        break;
      case 'customerEmail':
        if (!value?.trim()) {
          errorMessage = 'Email is required';
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
          errorMessage = 'Please enter a valid email address';
        }
        break;
      case 'productName':
        if (!value?.trim()) {
          errorMessage = 'Product name is required';
        }
        break;
      case 'quantity':
        const qty = parseInt(value);
        if (isNaN(qty) || qty < 1) {
          errorMessage = 'Quantity must be at least 1';
        }
        break;
      case 'unitPrice':
        const price = parseFloat(value);
        if (isNaN(price) || price < 0) {
          errorMessage = 'Unit price must be a positive number';
        }
        break;
      default:
        break;
    }
    
    setEditFormErrors(prev => ({
      ...prev,
      [name]: errorMessage
    }));
    
    // Check overall form validity
    const hasErrors = Object.values({ ...editFormErrors, [name]: errorMessage }).some(err => err);
    const hasRequiredFields = editedOrder?.customerName && editedOrder?.customerEmail && editedOrder?.productName;
    setIsEditFormValid(!hasErrors && hasRequiredFields);
  };

  /**
   * Save edited order with validation
   */
  const handleSaveEdit = async () => {
    // Validate all fields before saving
    const errors = {};
    
    if (!editedOrder.customerName?.trim()) {
      errors.customerName = 'Customer name is required';
    }
    if (!editedOrder.customerEmail?.trim()) {
      errors.customerEmail = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(editedOrder.customerEmail)) {
      errors.customerEmail = 'Please enter a valid email address';
    }
    if (!editedOrder.productName?.trim()) {
      errors.productName = 'Product name is required';
    }
    
    if (Object.keys(errors).length > 0) {
      setEditFormErrors(errors);
      setError('Please correct the errors before saving');
      return;
    }
    
    try {
      setUpdating(true);
      setError(null);
      
      const updatedOrder = await updateOrder(orderId, editedOrder);
      
      // Handle structured response
      const orderData = updatedOrder.data || updatedOrder.order || updatedOrder;
      setOrder(orderData);
      setEditedOrder(orderData);
      
      setIsEditing(false);
      setEditFormErrors({});
      setSuccessMessage('Order updated successfully!');
      
    } catch (err) {
      console.error('Error updating order:', err);
      setError(err.message || 'Failed to update order');
    } finally {
      setUpdating(false);
    }
  };

  /**
   * Get available status transitions based on current status
   */
  const getAvailableStatuses = () => {
    const currentStatus = order?.status?.toLowerCase();
    const allStatuses = ['pending', 'processing', 'completed', 'failed', 'cancelled'];
    
    // Remove current status and provide logical transitions
    switch (currentStatus) {
      case 'pending':
        return ['processing', 'cancelled'];
      case 'processing':
        return ['completed', 'failed', 'cancelled'];
      case 'failed':
        return ['pending', 'cancelled'];
      case 'completed':
        return []; // Completed orders shouldn't change status
      case 'cancelled':
        return []; // Cancelled orders shouldn't change status
      default:
        return allStatuses.filter(s => s !== currentStatus);
    }
  };

  /**
   * Check if order can be edited
   */
  const canEdit = () => {
    const status = order?.status?.toLowerCase();
    return status === 'pending' || status === 'processing';
  };

  /**
   * Check if order can be cancelled
   */
  const canCancel = () => {
    const status = order?.status?.toLowerCase();
    return status === 'pending' || status === 'processing';
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount || 0);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    }).format(date);
  };

  const getStatusClass = (status) => {
    const statusMap = {
      pending: 'status-pending',
      processing: 'status-processing',
      completed: 'status-completed',
      failed: 'status-failed',
      cancelled: 'status-cancelled'
    };
    return statusMap[status?.toLowerCase()] || 'status-default';
  };

  const getPriorityClass = (priority) => {
    const priorityMap = {
      low: 'priority-low',
      medium: 'priority-medium',
      high: 'priority-high'
    };
    return priorityMap[priority?.toLowerCase()] || 'priority-medium';
  };

  const getPriorityIcon = (priority) => {
    const iconMap = {
      low: '🟢',
      medium: '🟡',
      high: '🔴'
    };
    return iconMap[priority?.toLowerCase()] || '🟡';
  };

  if (loading) {
    return (
      <div className="order-details-page">
        <div className="page-header-details">
          <button onClick={() => navigate('/orders')} className="btn-back">
            ← Back to Orders
          </button>
          <div className="header-info">
            <h2>Loading order details...</h2>
          </div>
        </div>
        <div className="order-details-container">
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="order-details-page">
        <div className="error-page">
          <div className="error-icon">⚠️</div>
          <h2>Error Loading Order</h2>
          <p className="error-message">{error}</p>
          <div className="error-actions">
            <button onClick={loadOrderDetails} className="btn btn-primary">
              🔄 Try Again
            </button>
            <button onClick={() => navigate('/orders')} className="btn btn-secondary">
              ← Back to Orders
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="order-details-page">
        <div className="error-page">
          <div className="error-icon">📦</div>
          <h2>Order Not Found</h2>
          <p className="error-message">The order you're looking for doesn't exist or has been removed.</p>
          <button onClick={() => navigate('/orders')} className="btn btn-primary">
            ← Back to Orders
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="order-details-page">
      {/* Page Header */}
      <div className="page-header-details">
        <button onClick={() => navigate('/orders')} className="btn-back">
          ← Back to Orders
        </button>
        <div className="header-info">
          <h2>Order Details: {order.id}</h2>
          <div className="header-badges">
            <span className={`status-badge ${getStatusClass(order.status)}`}>
              {order.status}
            </span>
            <span className={`priority-badge ${getPriorityClass(order.priority)}`}>
              {getPriorityIcon(order.priority)} {order.priority}
            </span>
          </div>
        </div>
      </div>

      {/* Success Message */}
      {successMessage && (
        <div className="success-message">
          <span>✓ {successMessage}</span>
          <button onClick={() => setSuccessMessage(null)}>×</button>
        </div>
      )}

      {/* Error Message */}
      {error && !loading && (
        <div className="error-message">
          <span>⚠ {error}</span>
          <button onClick={() => setError(null)}>×</button>
        </div>
      )}

      {/* Action Bar */}
      <div className="order-actions-bar">
        {!isEditing && (
          <>
            {canEdit() && (
              <ButtonWithLoading
                onClick={handleEdit}
                loading={updating}
                disabled={updating}
                variant="secondary"
                icon="✏️"
              >
                Edit Order
              </ButtonWithLoading>
            )}
            
            {order.status === 'failed' && (
              <ButtonWithLoading
                onClick={handleRetry}
                loading={updating}
                loadingText="Retrying..."
                disabled={updating}
                variant="warning"
                icon="🔄"
              >
                Retry Order
              </ButtonWithLoading>
            )}
            
            {canCancel() && (
              <ButtonWithLoading
                onClick={handleCancel}
                loading={updating}
                loadingText="Cancelling..."
                disabled={updating}
                variant="danger"
                icon="✖️"
              >
                Cancel Order
              </ButtonWithLoading>
            )}
          </>
        )}

        {isEditing && (
          <>
            <ButtonWithLoading
              onClick={handleSaveEdit}
              loading={updating}
              loadingText="Saving..."
              disabled={updating || !isEditFormValid}
              variant="success"
              icon="✓"
              title={!isEditFormValid ? 'Please correct validation errors' : 'Save changes'}
            >
              Save Changes
            </ButtonWithLoading>
            <ButtonWithLoading
              onClick={handleCancelEdit}
              disabled={updating}
              variant="secondary"
              icon="✖️"
            >
              Cancel Edit
            </ButtonWithLoading>
          </>
        )}
      </div>

      <div className="order-details-container">
        {/* Order Information Section */}
        <div className="details-section">
          <div className="section-header">
            <h3>
              <span className="section-icon">📋</span>
              Order Information
            </h3>
          </div>

          <div className="details-grid">
            <div className="detail-item">
              <label>Order ID</label>
              <p className="detail-value order-id">{order.id}</p>
            </div>

            <div className="detail-item">
              <label>Status</label>
              <div className="status-with-actions">
                <span className={`status-badge ${getStatusClass(order.status)}`}>
                  {order.status}
                </span>
                {getAvailableStatuses().length > 0 && !isEditing && (
                  <div className="status-update-dropdown">
                    <select
                      onChange={(e) => handleStatusUpdate(e.target.value)}
                      value=""
                      disabled={updating}
                      className="status-select"
                    >
                      <option value="">Change Status...</option>
                      {getAvailableStatuses().map(status => (
                        <option key={status} value={status}>
                          {status.charAt(0).toUpperCase() + status.slice(1)}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
            </div>

            <div className="detail-item">
              <label>Priority</label>
              {isEditing ? (
                <select
                  name="priority"
                  value={editedOrder.priority}
                  onChange={handleEditChange}
                  className="edit-input"
                >
                  <option value="low">🟢 Low</option>
                  <option value="medium">🟡 Medium</option>
                  <option value="high">🔴 High</option>
                </select>
              ) : (
                <p className={`detail-value ${getPriorityClass(order.priority)}`}>
                  {getPriorityIcon(order.priority)} {order.priority}
                </p>
              )}
            </div>

            <div className="detail-item">
              <label>Payment Method</label>
              {isEditing ? (
                <select
                  name="paymentMethod"
                  value={editedOrder.paymentMethod}
                  onChange={handleEditChange}
                  className="edit-input"
                >
                  <option value="Credit Card">💳 Credit Card</option>
                  <option value="Debit Card">💳 Debit Card</option>
                  <option value="PayPal">🅿️ PayPal</option>
                  <option value="Bank Transfer">🏦 Bank Transfer</option>
                  <option value="Corporate Account">🏢 Corporate Account</option>
                </select>
              ) : (
                <p className="detail-value">{order.paymentMethod}</p>
              )}
            </div>

            <div className="detail-item">
              <label>Created At</label>
              <p className="detail-value date-value">
                📅 {formatDate(order.createdAt)}
              </p>
            </div>

            <div className="detail-item">
              <label>Last Updated</label>
              <p className="detail-value date-value">
                🕒 {formatDate(order.updatedAt)}
              </p>
            </div>
          </div>
        </div>

        {/* Customer Information Section */}
        <div className="details-section">
          <h3>
            <span className="section-icon">👤</span>
            Customer Information
          </h3>
          <div className="details-grid">
            <div className={`detail-item ${editFormErrors.customerName ? 'has-error' : ''}`}>
              <label>Customer Name</label>
              {isEditing ? (
                <>
                  <input
                    type="text"
                    name="customerName"
                    value={editedOrder.customerName}
                    onChange={handleEditChange}
                    className={`edit-input ${editFormErrors.customerName ? 'error' : ''}`}
                    required
                    aria-invalid={editFormErrors.customerName ? 'true' : 'false'}
                  />
                  {editFormErrors.customerName && (
                    <span className="field-error">{editFormErrors.customerName}</span>
                  )}
                </>
              ) : (
                <p className="detail-value">{order.customerName}</p>
              )}
            </div>

            <div className={`detail-item ${editFormErrors.customerEmail ? 'has-error' : ''}`}>
              <label>Email</label>
              {isEditing ? (
                <>
                  <input
                    type="email"
                    name="customerEmail"
                    value={editedOrder.customerEmail}
                    onChange={handleEditChange}
                    className={`edit-input ${editFormErrors.customerEmail ? 'error' : ''}`}
                    required
                    aria-invalid={editFormErrors.customerEmail ? 'true' : 'false'}
                  />
                  {editFormErrors.customerEmail && (
                    <span className="field-error">{editFormErrors.customerEmail}</span>
                  )}
                </>
              ) : (
                <p className="detail-value">
                  <a href={`mailto:${order.customerEmail}`} className="email-link">
                    📧 {order.customerEmail}
                  </a>
                </p>
              )}
            </div>

            <div className="detail-item full-width">
              <label>Shipping Address</label>
              {isEditing ? (
                <input
                  type="text"
                  name="shippingAddress"
                  value={editedOrder.shippingAddress}
                  onChange={handleEditChange}
                  className="edit-input"
                  placeholder="Full shipping address"
                />
              ) : (
                <p className="detail-value address-value">
                  {order.shippingAddress ? (
                    <>📍 {order.shippingAddress}</>
                  ) : (
                    <span className="no-data">No shipping address provided</span>
                  )}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Product Information Section */}
        <div className="details-section">
          <h3>
            <span className="section-icon">📦</span>
            Product & Pricing
          </h3>
          <div className="details-grid">
            <div className={`detail-item ${editFormErrors.productName ? 'has-error' : ''}`}>
              <label>Product Name</label>
              {isEditing ? (
                <>
                  <input
                    type="text"
                    name="productName"
                    value={editedOrder.productName}
                    onChange={handleEditChange}
                    className={`edit-input ${editFormErrors.productName ? 'error' : ''}`}
                    required
                    aria-invalid={editFormErrors.productName ? 'true' : 'false'}
                  />
                  {editFormErrors.productName && (
                    <span className="field-error">{editFormErrors.productName}</span>
                  )}
                </>
              ) : (
                <p className="detail-value product-name">{order.productName}</p>
              )}
            </div>

            <div className="detail-item">
              <label>Quantity</label>
              {isEditing ? (
                <input
                  type="number"
                  name="quantity"
                  value={editedOrder.quantity}
                  onChange={handleEditChange}
                  className="edit-input"
                  min="1"
                  required
                />
              ) : (
                <p className="detail-value quantity-value">
                  ✖️ {order.quantity}
                </p>
              )}
            </div>

            {order.unitPrice !== undefined && (
              <div className="detail-item">
                <label>Unit Price</label>
                <p className="detail-value amount">{formatCurrency(order.unitPrice)}</p>
              </div>
            )}

            <div className="detail-item">
              <label>Total Amount</label>
              <p className="detail-value amount total-amount">
                💰 {formatCurrency(order.totalAmount)}
              </p>
            </div>
          </div>
        </div>

        {/* Notes Section */}
        {(order.notes || isEditing) && (
          <div className="details-section">
            <h3>
              <span className="section-icon">📝</span>
              Additional Notes
            </h3>
            {isEditing ? (
              <textarea
                name="notes"
                value={editedOrder.notes}
                onChange={handleEditChange}
                className="edit-textarea"
                rows="4"
                placeholder="Add any special instructions or notes..."
              />
            ) : (
              <div className="notes-content">
                {order.notes ? (
                  <p>{order.notes}</p>
                ) : (
                  <p className="no-data">No notes available</p>
                )}
              </div>
            )}
          </div>
        )}

        {/* Order Timeline */}
        <div className="details-section">
          <h3>
            <span className="section-icon">📊</span>
            Order Timeline
          </h3>
          <div className="timeline">
            <div className="timeline-item">
              <div className="timeline-marker created"></div>
              <div className="timeline-content">
                <h4>Order Created</h4>
                <p className="timeline-date">{formatDate(order.createdAt)}</p>
                <p className="timeline-desc">Order was placed by {order.customerName}</p>
              </div>
            </div>
            
            {order.updatedAt && order.updatedAt !== order.createdAt && (
              <div className="timeline-item">
                <div className="timeline-marker updated"></div>
                <div className="timeline-content">
                  <h4>Last Updated</h4>
                  <p className="timeline-date">{formatDate(order.updatedAt)}</p>
                  <p className="timeline-desc">Order status: {order.status}</p>
                </div>
              </div>
            )}

            <div className={`timeline-item ${order.status === 'completed' ? 'active' : 'pending'}`}>
              <div className={`timeline-marker ${order.status === 'completed' ? 'completed' : 'pending'}`}></div>
              <div className="timeline-content">
                <h4>{order.status === 'completed' ? 'Completed' : 'Pending Completion'}</h4>
                <p className="timeline-desc">
                  {order.status === 'completed' 
                    ? 'Order has been successfully completed' 
                    : 'Awaiting order completion'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="details-section">
          <h3>
            <span className="section-icon">📈</span>
            Quick Stats
          </h3>
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-icon">⏱️</div>
              <div className="stat-content">
                <label>Processing Time</label>
                <p className="stat-value">
                  {(() => {
                    const created = new Date(order.createdAt);
                    const updated = new Date(order.updatedAt);
                    const diffMs = updated - created;
                    const diffMins = Math.floor(diffMs / 60000);
                    const diffHours = Math.floor(diffMins / 60);
                    const diffDays = Math.floor(diffHours / 24);
                    
                    if (diffDays > 0) return `${diffDays} day${diffDays > 1 ? 's' : ''}`;
                    if (diffHours > 0) return `${diffHours} hour${diffHours > 1 ? 's' : ''}`;
                    if (diffMins > 0) return `${diffMins} min${diffMins > 1 ? 's' : ''}`;
                    return 'Just now';
                  })()}
                </p>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon">💵</div>
              <div className="stat-content">
                <label>Order Value</label>
                <p className="stat-value">{formatCurrency(order.totalAmount)}</p>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon">📦</div>
              <div className="stat-content">
                <label>Items</label>
                <p className="stat-value">{order.quantity}</p>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon">
                {order.status === 'completed' ? '✅' : 
                 order.status === 'failed' ? '❌' : 
                 order.status === 'cancelled' ? '🚫' : '⏳'}
              </div>
              <div className="stat-content">
                <label>Status</label>
                <p className="stat-value">{order.status}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default OrderDetails;
