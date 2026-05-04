# API Integration Documentation

## Overview

The Order Processing Dashboard is now fully integrated with a RESTful API backend. This document explains the integration architecture, features, and usage.

## API Configuration

### Environment Variables

The application uses environment variables for API configuration. These are defined in `.env` files:

```env
REACT_APP_API_URL=http://localhost:5000/api
REACT_APP_API_TIMEOUT=30000
REACT_APP_ENABLE_API_LOGS=true
REACT_APP_ENV=development
REACT_APP_VERSION=1.0.0
```

### Configuration Files

- **`.env`** - Active environment configuration (git-ignored)
- **`.env.development`** - Development environment defaults
- **`.env.production`** - Production environment settings
- **`.env.example`** - Template for environment configuration

## Architecture

### API Service Layer (`src/services/api.js`)

The API service provides a centralized, production-ready interface for all backend communications:

#### Features:
- ✅ **Axios instance** with custom configuration
- ✅ **Request/Response interceptors** for logging and error handling
- ✅ **Request cancellation support** for duplicate requests
- ✅ **Automatic retry logic** for transient failures
- ✅ **Comprehensive error handling** with user-friendly messages
- ✅ **Request tracking** with unique IDs
- ✅ **Timeout configuration**
- ✅ **Authentication token management**

#### Available API Functions:

**Order Management:**
```javascript
fetchOrders(params)          // Get all orders with filtering
fetchOrderById(orderId)       // Get single order details
createOrder(orderData)        // Create new order
updateOrder(orderId, data)    // Update entire order
patchOrder(orderId, updates)  // Partial order update
deleteOrder(orderId)          // Delete order
retryOrder(orderId)           // Retry failed order
cancelOrder(orderId, reason)  // Cancel order
```

**Bulk Operations:**
```javascript
bulkDeleteOrders(orderIds)            // Delete multiple orders
bulkUpdateOrderStatus(orderIds, status) // Update status for multiple orders
```

**Analytics:**
```javascript
fetchOrderStats(params)  // Get order statistics
exportOrders(params)     // Export orders to CSV
```

**Health & Monitoring:**
```javascript
checkHealth()            // Check API health status
getApiVersion()          // Get API version information
```

## Integration Features

### 1. Real-time API Status Monitoring

#### `useApiStatus` Hook
Custom React hook for monitoring API connection status:

```javascript
const { 
  isOnline,      // Boolean: API connection status
  isChecking,    // Boolean: Currently checking
  lastChecked,   // Date: Last check timestamp
  apiInfo,       // Object: API information
  error,         // String: Error message
  checkApiHealth // Function: Manual health check
} = useApiStatus(checkInterval);
```

Features:
- Automatic periodic health checks (configurable interval)
- Browser online/offline event handling
- Manual refresh capability
- Detailed API information display

#### `ApiStatus` Component
Visual indicator for API connection status:

```jsx
// Compact mode (in header)
<ApiStatus compact={true} showDetails={false} />

// Full card mode
<ApiStatus compact={false} showDetails={true} />
```

Displays:
- ✅ Connection status (Online/Offline/Checking)
- ✅ Last checked timestamp
- ✅ API version and environment
- ✅ Uptime information
- ✅ Manual refresh button

### 2. Orders Page Integration

#### Data Fetching
```javascript
// Automatic fetch on mount
useEffect(() => {
  loadOrders();
}, []);

// Load with retry logic
const loadOrders = async (silent = false, retryCount = 0) => {
  try {
    const data = await fetchOrders(params);
    setOrders(data);
  } catch (error) {
    // Automatic retry for network errors
    if (retryCount < MAX_RETRIES) {
      return loadOrders(silent, retryCount + 1);
    }
    setError(error.message);
  }
};
```

#### Order Creation
```javascript
const handleCreateOrder = async (orderData) => {
  try {
    const newOrder = await createOrder(orderData);
    setOrders([newOrder, ...orders]); // Optimistic update
    setSuccessMessage('Order created successfully!');
  } catch (error) {
    // Handle and display error
  }
};
```

#### Order Deletion
```javascript
const handleDeleteOrder = async (orderId) => {
  // Optimistic update with rollback on failure
  const originalOrders = [...orders];
  setOrders(orders.filter(o => o.id !== orderId));
  
  try {
    await deleteOrder(orderId);
    setSuccessMessage('Order deleted!');
  } catch (error) {
    setOrders(originalOrders); // Rollback
    setError(error.message);
  }
};
```

### 3. Error Handling

#### Client-Side Validation
```javascript
// Pre-submission validation
if (!orderData.customerName || !orderData.customerEmail) {
  throw new Error('Missing required fields');
}

// Email format validation
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
if (!emailRegex.test(email)) {
  throw new Error('Invalid email format');
}
```

#### API Error Handling
The service automatically handles:
- **400 Bad Request** - Invalid data
- **401 Unauthorized** - Authentication required
- **403 Forbidden** - Permission denied
- **404 Not Found** - Resource not found
- **409 Conflict** - Resource conflict
- **422 Validation Error** - Data validation failed
- **429 Rate Limited** - Too many requests
- **500 Server Error** - Internal server error
- **503 Service Unavailable** - Temporary outage
- **Network Errors** - Connection failures
- **Timeout Errors** - Request timeout

### 4. Performance Optimizations

#### Request Cancellation
```javascript
// Automatic cancellation of duplicate requests
export const fetchOrders = async (params, requestKey = 'fetchOrders') => {
  cancelRequest(requestKey); // Cancel previous request
  const source = axios.CancelToken.source();
  // ... make request with cancellation token
};
```

#### Optimistic Updates
```javascript
// Update UI immediately, rollback on failure
setOrders(newOrders);  // Optimistic
try {
  await deleteOrder(id);
} catch (error) {
  setOrders(originalOrders);  // Rollback
}
```

#### Auto-refresh
```javascript
// Optional automatic data refresh
<input
  type="checkbox"
  checked={autoRefresh}
  onChange={(e) => setAutoRefresh(e.target.checked)}
/>
// Refreshes every 30 seconds when enabled
```

## Usage Examples

### Basic Order Fetching

```javascript
import { fetchOrders } from '../services/api';

// Fetch all orders
const orders = await fetchOrders();

// Fetch with filters
const filteredOrders = await fetchOrders({
  status: 'pending',
  page: 1,
  limit: 10,
  sortBy: 'createdAt',
  sortOrder: 'desc'
});
```

### Creating an Order

```javascript
import { createOrder } from '../services/api';

const orderData = {
  customerName: 'John Doe',
  customerEmail: 'john@example.com',
  productName: 'Premium Laptop',
  quantity: 2,
  unitPrice: 1200,
  totalAmount: 2400,
  priority: 'high',
  shippingAddress: '123 Main St, City, State 12345',
  paymentMethod: 'Credit Card',
  notes: 'Express shipping requested'
};

try {
  const newOrder = await createOrder(orderData);
  console.log('Order created:', newOrder.id);
} catch (error) {
  console.error('Failed to create order:', error.message);
}
```

### Error Handling Pattern

```javascript
try {
  const order = await fetchOrderById(orderId);
  // Process order
} catch (error) {
  if (error.message.includes('404')) {
    // Order not found
  } else if (error.message.includes('Network')) {
    // Network error - retry
  } else {
    // Other error
  }
}
```

## Backend API Requirements

The frontend expects the following API endpoints:

### Orders Endpoints

```
GET    /api/orders              - List all orders
GET    /api/orders/:id          - Get order by ID
POST   /api/orders              - Create new order
PUT    /api/orders/:id          - Update order
PATCH  /api/orders/:id          - Partial update
DELETE /api/orders/:id          - Delete order
POST   /api/orders/:id/retry    - Retry failed order
POST   /api/orders/:id/cancel   - Cancel order
GET    /api/orders/stats        - Get statistics
POST   /api/orders/bulk-delete  - Bulk delete
POST   /api/orders/bulk-update-status - Bulk status update
GET    /api/orders/export       - Export to CSV
```

### Health Endpoints

```
GET    /api/health              - Health check
GET    /api/version             - Version information
```

### Expected Response Format

**Success Response:**
```json
{
  "id": "ORD-001",
  "customerName": "John Doe",
  "customerEmail": "john@example.com",
  "productName": "Product Name",
  "quantity": 2,
  "totalAmount": 100.00,
  "status": "pending",
  "createdAt": "2026-05-04T10:00:00Z",
  "updatedAt": "2026-05-04T10:00:00Z"
}
```

**Error Response:**
```json
{
  "error": true,
  "message": "Error description",
  "code": "ERROR_CODE",
  "details": {}
}
```

## Testing the Integration

### 1. Start the Backend API
```bash
# Ensure your backend is running on http://localhost:5000
# Or update REACT_APP_API_URL in .env to point to your API
```

### 2. Start the Frontend
```bash
npm start
```

### 3. Monitor the Integration
- Check the browser console for API logs (when `REACT_APP_ENABLE_API_LOGS=true`)
- Watch the API status indicator in the page header
- Test CRUD operations through the UI
- Verify error handling by stopping the backend

### 4. Test Scenarios

✅ **Normal Operation:**
- Create orders
- View order list
- Update orders
- Delete orders

✅ **Error Scenarios:**
- Stop backend → Should show offline banner
- Invalid data → Should show validation errors
- Network timeout → Should show timeout message
- Restart backend → Should auto-reconnect

✅ **Performance:**
- Auto-refresh functionality
- Request cancellation
- Optimistic updates
- Loading states

## Production Deployment

### Environment Setup

1. **Create `.env.production`:**
```env
REACT_APP_API_URL=https://api.yourproduction.com/api
REACT_APP_API_TIMEOUT=30000
REACT_APP_ENABLE_API_LOGS=false
REACT_APP_ENV=production
```

2. **Build the application:**
```bash
npm run build
```

3. **Deploy to hosting platform:**
- The build output in `/build` directory can be deployed to any static hosting
- Ensure CORS is configured on your backend API
- Configure environment variables in your hosting platform

### Security Considerations

- ✅ Never commit `.env` files with secrets to git
- ✅ Use HTTPS in production
- ✅ Implement proper authentication/authorization
- ✅ Enable rate limiting on the API
- ✅ Validate all input data
- ✅ Sanitize error messages in production
- ✅ Implement CORS properly
- ✅ Use secure token storage

## Troubleshooting

### API Not Connecting

1. Check `.env` file has correct `REACT_APP_API_URL`
2. Verify backend is running
3. Check browser console for CORS errors
4. Ensure firewall allows the connection

### Orders Not Loading

1. Check API health status indicator
2. Open browser DevTools → Network tab
3. Look for failed API requests
4. Check backend logs for errors

### Performance Issues

1. Check `REACT_APP_API_TIMEOUT` setting
2. Monitor API response times
3. Consider implementing pagination
4. Optimize backend queries

## Future Enhancements

- [ ] WebSocket integration for real-time updates
- [ ] Offline mode with local storage
- [ ] Request queue for offline operations
- [ ] Advanced caching strategies
- [ ] GraphQL integration option
- [ ] API request/response mocking for tests
- [ ] Service worker for background sync

## Support

For issues or questions about the API integration:
1. Check this documentation
2. Review browser console errors
3. Check backend API logs
4. Verify environment configuration
5. Test API endpoints directly using tools like Postman

---

**Last Updated:** May 4, 2026
**Version:** 1.0.0
