import React from 'react';

function OrderTable({ orders, onOrderClick, onDeleteOrder, sortBy, sortOrder, onSortChange }) {
  /**
   * Format currency
   */
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  /**
   * Format date
   */
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  /**
   * Get status badge class
   */
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

  /**
   * Render sort indicator
   */
  const renderSortIcon = (field) => {
    if (sortBy !== field) return <span className="sort-icon">↕</span>;
    return sortOrder === 'asc' ? <span className="sort-icon active">↑</span> : <span className="sort-icon active">↓</span>;
  };

  return (
    <div className="order-table-container">
      <table className="order-table">
        <thead>
          <tr>
            <th onClick={() => onSortChange('id')} className="sortable">
              Order ID {renderSortIcon('id')}
            </th>
            <th onClick={() => onSortChange('customerName')} className="sortable">
              Customer {renderSortIcon('customerName')}
            </th>
            <th onClick={() => onSortChange('productName')} className="sortable">
              Product {renderSortIcon('productName')}
            </th>
            <th onClick={() => onSortChange('quantity')} className="sortable">
              Qty {renderSortIcon('quantity')}
            </th>
            <th onClick={() => onSortChange('totalAmount')} className="sortable">
              Amount {renderSortIcon('totalAmount')}
            </th>
            <th onClick={() => onSortChange('status')} className="sortable">
              Status {renderSortIcon('status')}
            </th>
            <th onClick={() => onSortChange('createdAt')} className="sortable">
              Created {renderSortIcon('createdAt')}
            </th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {orders.map((order) => (
            <tr key={order.id} className="order-row">
              <td className="order-id">
                <button 
                  onClick={() => onOrderClick(order.id)}
                  className="link-button"
                >
                  {order.id}
                </button>
              </td>
              <td>{order.customerName}</td>
              <td>{order.productName}</td>
              <td className="text-center">{order.quantity}</td>
              <td className="text-right">{formatCurrency(order.totalAmount)}</td>
              <td>
                <span className={`status-badge ${getStatusClass(order.status)}`}>
                  {order.status}
                </span>
              </td>
              <td className="date-cell">{formatDate(order.createdAt)}</td>
              <td className="actions-cell">
                <button
                  onClick={() => onOrderClick(order.id)}
                  className="btn-action btn-view"
                  title="View Details"
                >
                  👁
                </button>
                <button
                  onClick={() => onDeleteOrder(order.id)}
                  className="btn-action btn-delete"
                  title="Delete Order"
                >
                  🗑
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default OrderTable;
