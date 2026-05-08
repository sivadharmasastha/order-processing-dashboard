import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import OrdersPage from './pages/OrdersPage';
import OrderDetails from './pages/OrderDetails';
import { LoadingProvider } from './context/LoadingContext';
import { ErrorProvider, useError } from './context/ErrorContext';
import ErrorBoundary from './components/ErrorBoundary';
import ToastContainer from './components/Toast';
import { GlobalErrorDisplay } from './components/ErrorNotification';
import { setupApiErrorHandler } from './services/apiErrorHandler';
import './styles.css';

/**
 * AppContent Component
 * Inner component that has access to error context
 */
function AppContent() {
  const errorContext = useError();

  // Setup global API error handler
  useEffect(() => {
    setupApiErrorHandler(errorContext);
    console.log('[App] Global error handling initialized');
  }, [errorContext]);

  return (
    <Router>
      <div className="app">
        {/* Global Error Display */}
        <GlobalErrorDisplay />

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

        {/* Toast Notifications */}
        <ToastContainer position="top-right" maxToasts={5} />
      </div>
    </Router>
  );
}

/**
 * Main App Component
 * Wraps application with error boundary and providers
 */
function App() {
  return (
    <ErrorBoundary>
      <ErrorProvider>
        <LoadingProvider>
          <AppContent />
        </LoadingProvider>
      </ErrorProvider>
    </ErrorBoundary>
  );
}

export default App;
