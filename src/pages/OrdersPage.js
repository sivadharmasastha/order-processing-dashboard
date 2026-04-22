import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import CreateOrderForm from '../components/CreateOrderForm';
import OrderTable from '../components/OrderTable';
import Loader from '../components/Loader';
import { fetchOrders, createOrder } from '../services/api';

function OrdersPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const navigate = useNavigate();

  // Fetch orders on component mount
  useEffect(() => {
    loadOrders();
  }, []);

  const loadOrders = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchOrders();
      setOrders(data);
    } catch (err) {
      setError(err.message || 'Failed to load orders');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateOrder = async (orderData) => {
    try {
      const newOrder = await createOrder(orderData);
      setOrders([newOrder, ...orders]);
      setShowCreateForm(false);
      return newOrder;
    } catch (err) {
      throw err;
    }
  };

  const handleOrderClick = (orderId) => {
    navigate(`/orders/${orderId}`);
  };

  if (loading) {
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
          {showCreateForm ? 'Cancel' : 'Create New Order'}
        </button>
      </div>

      {error && (
        <div className="error-message">
          <p>{error}</p>
          <button onClick={loadOrders}>Retry</button>
        </div>
      )}

      {showCreateForm && (
        <div className="create-order-section">
          <CreateOrderForm 
            onSubmit={handleCreateOrder}
            onCancel={() => setShowCreateForm(false)}
          />
        </div>
      )}

      <div className="orders-section">
        <div className="section-header">
          <h3>All Orders ({orders.length})</h3>
          <button 
            className="btn btn-secondary"
            onClick={loadOrders}
            disabled={loading}
          >
            Refresh
          </button>
        </div>

        {orders.length === 0 ? (
          <div className="empty-state">
            <p>No orders found. Create your first order to get started!</p>
          </div>
        ) : (
          <OrderTable 
            orders={orders}
            onOrderClick={handleOrderClick}
          />
        )}
      </div>
    </div>
  );
}

export default OrdersPage;
