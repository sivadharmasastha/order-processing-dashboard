# Quick Start Guide - API Integration Testing

## Prerequisites

- Node.js installed (v14 or higher)
- Backend API running (or mock server)
- Basic understanding of React and REST APIs

## Step 1: Clone and Install

```bash
cd order-processing-dashboard
npm install
```

## Step 2: Configure Environment

The `.env` file is already configured with development defaults:

```env
REACT_APP_API_URL=http://localhost:5000/api
REACT_APP_API_TIMEOUT=30000
REACT_APP_ENABLE_API_LOGS=true
REACT_APP_ENV=development
REACT_APP_VERSION=1.0.0
```

**To use a different API endpoint:**
Edit `.env` and change `REACT_APP_API_URL` to your backend URL.

## Step 3: Start the Application

```bash
npm start
```

The application will open at `http://localhost:3000`

## Step 4: Verify Integration

### Visual Indicators

1. **API Status Badge** (Top right of page header)
   - 🟢 Green = Connected
   - 🔴 Red = Disconnected
   - 🔵 Blue = Checking

2. **Connection Banner**
   - Appears at top when API is offline
   - Shows warning message

### Test Features

#### ✅ View Orders List
- Orders automatically load from API on page load
- Check browser console for API request logs
- Loading spinner appears during fetch

#### ✅ Create New Order
1. Click "Create New Order" button
2. Fill in the form with valid data
3. Click "Create Order"
4. New order appears in the list
5. Success message displays

#### ✅ Delete Order
1. Click delete button on any order row
2. Confirm deletion
3. Order disappears from list
4. Success message displays

#### ✅ Search and Filter
- Use search box to filter orders
- Select status filter dropdown
- Results update instantly

#### ✅ Auto-refresh
- Enable "Auto-refresh (30s)" checkbox
- Orders list refreshes automatically every 30 seconds

## Step 5: Monitor API Calls

### Browser DevTools

**Console Tab:**
```
API Configuration: {baseURL: "http://localhost:5000/api", ...}
→ GET /api/orders
← GET /api/orders [200 OK] 45ms
✓ Successfully loaded 5 orders from API
```

**Network Tab:**
- Filter by "Fetch/XHR"
- See all API requests
- Inspect request/response data

### API Logs

When `REACT_APP_ENABLE_API_LOGS=true`, you'll see detailed logs:

```
Request:
→ GET /orders {requestId: "req_1234567890_1", params: {...}}

Response:
← GET /orders {requestId: "req_1234567890_1", status: 200, duration: "45ms"}
```

## Step 6: Test Error Scenarios

### Offline API Test

1. Stop your backend API server
2. Refresh the page
3. You should see:
   - ❌ Red API status badge showing "Disconnected"
   - ⚠️ Yellow banner: "API Connection Lost - Working in offline mode"
   - Error message: "Unable to connect to server"

### Invalid Data Test

1. Try to create an order with invalid email
2. You should see:
   - Field-level error: "Please enter a valid email address"
   - Form cannot be submitted until fixed

### Network Timeout Test

1. Set `REACT_APP_API_TIMEOUT=1` in `.env`
2. Restart application
3. You should see timeout errors for slow APIs

## Common Issues & Solutions

### Issue: "Unable to connect to server"

**Cause:** Backend API is not running or URL is incorrect

**Solution:**
1. Verify backend is running
2. Check `REACT_APP_API_URL` in `.env`
3. Test backend directly: `curl http://localhost:5000/api/health`

### Issue: CORS Error in Console

**Cause:** Backend not configured for CORS

**Solution:**
Backend must include CORS headers:
```javascript
// Example for Express.js
app.use(cors({
  origin: 'http://localhost:3000',
  credentials: true
}));
```

### Issue: Orders Not Showing

**Cause:** API response format doesn't match expected format

**Solution:**
Check API response in Network tab. Should return:
```json
[
  {
    "id": "ORD-001",
    "customerName": "John Doe",
    ...
  }
]
```

### Issue: API Logs Not Showing

**Cause:** `REACT_APP_ENABLE_API_LOGS` not set

**Solution:**
1. Check `.env` file has `REACT_APP_ENABLE_API_LOGS=true`
2. Restart the application (environment changes require restart)

## Testing Checklist

Use this checklist to verify complete integration:

- [ ] Application starts without errors
- [ ] API status badge shows correct status
- [ ] Orders list loads from API
- [ ] Loading spinner appears during data fetch
- [ ] Create order form works
- [ ] New orders appear in list after creation
- [ ] Delete order works with confirmation
- [ ] Search/filter functionality works
- [ ] Sorting by columns works
- [ ] Pagination works (if applicable)
- [ ] Auto-refresh works when enabled
- [ ] Error messages display correctly
- [ ] Offline mode banner appears when API down
- [ ] API reconnects automatically when backend restarts
- [ ] Browser console shows API logs (in dev mode)
- [ ] Network tab shows API requests

## Mock Backend Setup (Optional)

If you don't have a backend API ready, use JSON Server:

### Install JSON Server
```bash
npm install -g json-server
```

### Create Mock Data
Create `db.json` in project root:

```json
{
  "orders": [
    {
      "id": "ORD-001",
      "customerName": "John Doe",
      "customerEmail": "john@example.com",
      "productName": "Premium Laptop",
      "quantity": 2,
      "totalAmount": 2400,
      "status": "pending",
      "priority": "high",
      "shippingAddress": "123 Main St",
      "paymentMethod": "Credit Card",
      "notes": "",
      "createdAt": "2026-05-04T10:00:00Z",
      "updatedAt": "2026-05-04T10:00:00Z"
    }
  ]
}
```

### Start JSON Server
```bash
json-server --watch db.json --port 5000 --routes routes.json
```

Create `routes.json`:
```json
{
  "/api/*": "/$1"
}
```

### Test Mock API
```bash
curl http://localhost:5000/api/orders
```

## Next Steps

1. **Review Full Documentation:** See `docs/API_INTEGRATION.md`
2. **Explore API Service:** Check `src/services/api.js`
3. **Customize UI:** Modify components in `src/components/`
4. **Add Features:** Extend API functions as needed
5. **Deploy:** Build and deploy to production

## Support

For detailed documentation, see:
- `docs/API_INTEGRATION.md` - Complete API integration guide
- `README.md` - Project overview
- Browser console - Real-time API logs

---

**Ready to test? Start with Step 1! 🚀**
