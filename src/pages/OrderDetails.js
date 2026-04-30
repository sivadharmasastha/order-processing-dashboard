import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Loader from '../components/Loader';
import { fetchOrderById, updateOrder, retryOrder } from '../services/api';

function OrderDetails() {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    loadOrderDetails();
  }, [orderId]);

  const loadOrderDetails = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Simulate API call - replace with actual API call
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Mock data for now - in production, use: const data = await fetchOrderById(orderId);
      const mockOrder = {
        id: orderId,
        customerName: 'John Doe',
        customerEmail: 'john.doe@example.com',
        productName: 'Premium Laptop',
        quantity: 2,
        totalAmount: 2499.98,
        status: 'completed',
        priority: 'high',
        shippingAddress: '123 Main St, New York, NY 10001',
        paymentMethod: 'Credit Card',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        notes: 'Express shipping requested'
      };
      
      setOrder(mockOrder);
    } catch (err) {
      setError(err.message || 'Failed to load order details');
    } finally {
      setLoading(false);
    }
  };

  const handleRetry = async () => {
    if (!window.confirm('Retry this order?')) return;
    
    try {
      setUpdating(true);
      await retryOrder(orderId);
      await loadOrderDetails();
    } catch (err) {
      setError(err.message || 'Failed to retry order');
    } finally {
      setUpdating(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const formatDate = (dateString) => {
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

  if (loading) {
    return <Loader message="Loading order details..." />;
  }

  if (error) {
    return (
      <div className="error-page">
        <h2>Error Loading Order</h2>
        <p>{error}</p>
        <button onClick={() => navigate('/orders')} className="btn btn-primary">
          Back to Orders
        </button>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="error-page">
        <h2>Order Not Found</h2>
        <p>The order you're looking for doesn't exist.</p>
        <button onClick={() => navigate('/orders')} className="btn btn-primary">
          Back to Orders
        </button>
      </div>
    );
  }

  return (
    <div className="order-details-page">
      <div className="page-header">
        <button onClick={() => navigate('/orders')} className="btn-back">
          ← Back to Orders
        </button>
        <h2>Order Details</h2>
      </div>

      <div className="order-details-container">
        <div className="details-section">
          <div className="section-header">
            <h3>Order Information</h3>
            <span className={`status-badge ${getStatusClass(order.status)}`}>
              {order.status}
            </span>
          </div>

          <div className="details-grid">
            <div className="detail-item">
              <label>Order ID</label>
              <p className="detail-value">{order.id}</p>
            </div>

            <div className="detail-item">
              <label>Priority</label>
              <p className="detail-value">{order.priority}</p>
            </div>

            <div className="detail-item">
              <label>Created At</label>
              <p className="detail-value">{formatDate(order.createdAt)}</p>
            </div>

            <div className="detail-item">
              <label>Last Updated</label>
              <p className="detail-value">{formatDate(order.updatedAt)}</p>
            </div>
          </div>
        </div>

        <div className="details-section">
          <h3>Customer Information</h3>
          <div className="details-grid">
            <div className="detail-item">
              <label>Customer Name</label>
              <p className="detail-value">{order.customerName}</p>
            </div>

            <div className="detail-item">
              <label>Email</label>
              <p className="detail-value">{order.customerEmail}</p>
            </div>

            <div className="detail-item full-width">
              <label>Shipping Address</label>
              <p className="detail-value">{order.shippingAddress}</p>
            </div>
          </div>
        </div>

        <div className="details-section">
          <h3>Product Information</h3>
          <div className="details-grid">
            <div className="detail-item">
              <label>Product Name</label>
              <p className="detail-value">{order.productName}</p>
            </div>

            <div className="detail-item">
              <label>Quantity</label>
              <p className="detail-value">{order.quantity}</p>
            </div>

            <div className="detail-item">
              <label>Total Amount</label>
              <p className="detail-value amount">{formatCurrency(order.totalAmount)}</p>
            </div>

            <div className="detail-item">
              <label>Payment Method</label>
              <p className="detail-value">{order.paymentMethod}</p>
            </div>
          </div>
        </div>

        {order.notes && (
          <div className="details-section">
            <h3>Notes</h3>
            <p className="notes-content">{order.notes}</p>
          </div>
        )}

        <div className="details-actions">
          {order.status === 'failed' && (
            <button
              onClick={handleRetry}
              disabled={updating}
              className="btn btn-warning"
            >
              {updating ? 'Retrying...' : 'Retry Order'}
            </button>
          )}
          <button
            onClick={() => navigate('/orders')}
            className="btn btn-secondary"
          >
            Back to List
          </button>
        </div>
      </div>
    </div>
  );
}

export default OrderDetails;
