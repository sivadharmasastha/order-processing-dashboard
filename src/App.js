import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import OrdersPage from './pages/OrdersPage';
import OrderDetails from './pages/OrderDetails';
import { LoadingProvider } from './context/LoadingContext';
import './styles.css';

function App() {
  return (
    <LoadingProvider>
      <Router>
        <div className="app">
          <header className="app-header">
            <h1>Order Processing Dashboard</h1>
            <p className="subtitle">High-Performance Order Management System</p>
          </header>

          <main className="app-content">
            <Routes>
              <Route path="/" element={<OrdersPage />} />
              <Route path="/orders" element={<OrdersPage />} />
              <Route path="/orders/:orderId" element={<OrderDetails />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </main>

          <footer className="app-footer">
            <p>© 2026 Order Processing System</p>
          </footer>
        </div>
      </Router>
    </LoadingProvider>
  );
}

export default App;
