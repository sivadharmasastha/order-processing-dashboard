import React, { useState, useEffect } from 'react';

function CreateOrderForm({ onSubmit, onCancel }) {
  const [formData, setFormData] = useState({
    customerName: '',
    customerEmail: '',
    productName: '',
    quantity: 1,
    unitPrice: 0,
    totalAmount: 0,
    priority: 'medium',
    shippingAddress: '',
    paymentMethod: 'Credit Card',
    notes: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [fieldErrors, setFieldErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [success, setSuccess] = useState(false);

  // Auto-calculate total amount when quantity or unit price changes
  useEffect(() => {
    const calculatedTotal = (formData.quantity * formData.unitPrice).toFixed(2);
    if (formData.totalAmount !== parseFloat(calculatedTotal)) {
      setFormData(prev => ({
        ...prev,
        totalAmount: parseFloat(calculatedTotal)
      }));
    }
  }, [formData.quantity, formData.unitPrice]);

  // Validation functions
  const validateField = (name, value) => {
    switch (name) {
      case 'customerName':
        if (!value.trim()) return 'Customer name is required';
        if (value.trim().length < 2) return 'Name must be at least 2 characters';
        if (value.trim().length > 100) return 'Name must not exceed 100 characters';
        if (!/^[a-zA-Z\s'-]+$/.test(value)) return 'Name can only contain letters, spaces, hyphens, and apostrophes';
        return '';
      
      case 'customerEmail':
        if (!value.trim()) return 'Email is required';
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(value)) return 'Please enter a valid email address';
        if (value.length > 254) return 'Email must not exceed 254 characters';
        return '';
      
      case 'productName':
        if (!value.trim()) return 'Product name is required';
        if (value.trim().length < 2) return 'Product name must be at least 2 characters';
        if (value.trim().length > 200) return 'Product name must not exceed 200 characters';
        return '';
      
      case 'quantity':
        const qty = parseInt(value);
        if (isNaN(qty)) return 'Quantity must be a number';
        if (qty < 1) return 'Quantity must be at least 1';
        if (qty > 10000) return 'Quantity cannot exceed 10,000';
        return '';
      
      case 'unitPrice':
        const price = parseFloat(value);
        if (isNaN(price)) return 'Unit price must be a number';
        if (price < 0) return 'Unit price cannot be negative';
        if (price > 1000000) return 'Unit price cannot exceed $1,000,000';
        return '';
      
      case 'shippingAddress':
        if (value && value.length > 500) return 'Shipping address must not exceed 500 characters';
        return '';
      
      case 'notes':
        if (value && value.length > 1000) return 'Notes must not exceed 1000 characters';
        return '';
      
      default:
        return '';
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    // Update form data
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // Validate field if it has been touched
    if (touched[name]) {
      const errorMessage = validateField(name, value);
      setFieldErrors(prev => ({
        ...prev,
        [name]: errorMessage
      }));
    }
  };

  const handleBlur = (e) => {
    const { name, value } = e.target;
    
    // Mark field as touched
    setTouched(prev => ({
      ...prev,
      [name]: true
    }));

    // Validate field on blur
    const errorMessage = validateField(name, value);
    setFieldErrors(prev => ({
      ...prev,
      [name]: errorMessage
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);
    
    // Validate all fields
    const errors = {};
    Object.keys(formData).forEach(key => {
      const errorMessage = validateField(key, formData[key]);
      if (errorMessage) {
        errors[key] = errorMessage;
      }
    });

    // Mark all fields as touched
    const allTouched = {};
    Object.keys(formData).forEach(key => {
      allTouched[key] = true;
    });
    setTouched(allTouched);

    // If there are errors, set them and prevent submission
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      setError('Please correct the errors in the form before submitting');
      // Scroll to first error
      const firstErrorField = document.querySelector('.form-group.has-error');
      if (firstErrorField) {
        firstErrorField.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      return;
    }

    // Additional validation
    if (!formData.customerName || !formData.customerEmail || !formData.productName) {
      setError('Please fill in all required fields');
      return;
    }

    if (formData.quantity < 1) {
      setError('Quantity must be at least 1');
      return;
    }

    if (formData.totalAmount <= 0) {
      setError('Total amount must be greater than 0');
      return;
    }

    setLoading(true);
    
    try {
      await onSubmit(formData);
      
      // Show success message
      setSuccess(true);
      
      // Reset form on success
      setFormData({
        customerName: '',
        customerEmail: '',
        productName: '',
        quantity: 1,
        unitPrice: 0,
        totalAmount: 0,
        priority: 'medium',
        shippingAddress: '',
        paymentMethod: 'Credit Card',
        notes: ''
      });
      setFieldErrors({});
      setTouched({});

      // Auto-hide success message after 3 seconds
      setTimeout(() => {
        setSuccess(false);
      }, 3000);
    } catch (err) {
      setError(err.message || 'Failed to create order. Please try again.');
      console.error('Order creation error:', err);
    } finally {
      setLoading(false);
    }
  };

  // Format currency for display
  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value || 0);
  };

  return (
    <div className="create-order-form">
      <div className="form-header">
        <h3>
          <span className="form-icon">📝</span>
          Create New Order
        </h3>
        <p className="form-subtitle">Fill in the details below to create a new order</p>
      </div>
      
      {error && (
        <div className="form-error" role="alert">
          <span className="error-icon">⚠️</span>
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="form-success" role="alert">
          <span className="success-icon">✅</span>
          <span>Order created successfully!</span>
        </div>
      )}

      <form onSubmit={handleSubmit} noValidate>
        {/* Customer Information Section */}
        <div className="form-section">
          <h4 className="section-title">
            <span className="section-icon">👤</span>
            Customer Information
          </h4>
          
          <div className="form-row">
            <div className={`form-group ${fieldErrors.customerName ? 'has-error' : ''} ${touched.customerName && !fieldErrors.customerName ? 'has-success' : ''}`}>
              <label htmlFor="customerName">
                Customer Name <span className="required">*</span>
              </label>
              <input
                type="text"
                id="customerName"
                name="customerName"
                value={formData.customerName}
                onChange={handleChange}
                onBlur={handleBlur}
                required
                placeholder="e.g., John Doe"
                aria-required="true"
                aria-invalid={fieldErrors.customerName ? 'true' : 'false'}
                aria-describedby={fieldErrors.customerName ? 'customerName-error' : undefined}
                disabled={loading}
              />
              {fieldErrors.customerName && (
                <span className="field-error" id="customerName-error" role="alert">
                  {fieldErrors.customerName}
                </span>
              )}
            </div>

            <div className={`form-group ${fieldErrors.customerEmail ? 'has-error' : ''} ${touched.customerEmail && !fieldErrors.customerEmail ? 'has-success' : ''}`}>
              <label htmlFor="customerEmail">
                Customer Email <span className="required">*</span>
              </label>
              <input
                type="email"
                id="customerEmail"
                name="customerEmail"
                value={formData.customerEmail}
                onChange={handleChange}
                onBlur={handleBlur}
                required
                placeholder="e.g., john@example.com"
                aria-required="true"
                aria-invalid={fieldErrors.customerEmail ? 'true' : 'false'}
                aria-describedby={fieldErrors.customerEmail ? 'customerEmail-error' : undefined}
                disabled={loading}
              />
              {fieldErrors.customerEmail && (
                <span className="field-error" id="customerEmail-error" role="alert">
                  {fieldErrors.customerEmail}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Product Information Section */}
        <div className="form-section">
          <h4 className="section-title">
            <span className="section-icon">📦</span>
            Product Information
          </h4>
          
          <div className="form-row">
            <div className={`form-group ${fieldErrors.productName ? 'has-error' : ''} ${touched.productName && !fieldErrors.productName ? 'has-success' : ''}`}>
              <label htmlFor="productName">
                Product Name <span className="required">*</span>
              </label>
              <input
                type="text"
                id="productName"
                name="productName"
                value={formData.productName}
                onChange={handleChange}
                onBlur={handleBlur}
                required
                placeholder="e.g., Premium Laptop"
                aria-required="true"
                aria-invalid={fieldErrors.productName ? 'true' : 'false'}
                aria-describedby={fieldErrors.productName ? 'productName-error' : undefined}
                disabled={loading}
              />
              {fieldErrors.productName && (
                <span className="field-error" id="productName-error" role="alert">
                  {fieldErrors.productName}
                </span>
              )}
            </div>

            <div className={`form-group ${fieldErrors.quantity ? 'has-error' : ''} ${touched.quantity && !fieldErrors.quantity ? 'has-success' : ''}`}>
              <label htmlFor="quantity">
                Quantity <span className="required">*</span>
              </label>
              <input
                type="number"
                id="quantity"
                name="quantity"
                value={formData.quantity}
                onChange={handleChange}
                onBlur={handleBlur}
                required
                min="1"
                max="10000"
                aria-required="true"
                aria-invalid={fieldErrors.quantity ? 'true' : 'false'}
                aria-describedby={fieldErrors.quantity ? 'quantity-error' : undefined}
                disabled={loading}
              />
              {fieldErrors.quantity && (
                <span className="field-error" id="quantity-error" role="alert">
                  {fieldErrors.quantity}
                </span>
              )}
            </div>
          </div>

          <div className="form-row">
            <div className={`form-group ${fieldErrors.unitPrice ? 'has-error' : ''} ${touched.unitPrice && !fieldErrors.unitPrice ? 'has-success' : ''}`}>
              <label htmlFor="unitPrice">
                Unit Price ($) <span className="required">*</span>
              </label>
              <div className="input-with-icon">
                <span className="input-icon">$</span>
                <input
                  type="number"
                  id="unitPrice"
                  name="unitPrice"
                  value={formData.unitPrice}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  required
                  min="0"
                  step="0.01"
                  placeholder="0.00"
                  className="input-with-icon-field"
                  aria-required="true"
                  aria-invalid={fieldErrors.unitPrice ? 'true' : 'false'}
                  aria-describedby={fieldErrors.unitPrice ? 'unitPrice-error' : undefined}
                  disabled={loading}
                />
              </div>
              {fieldErrors.unitPrice && (
                <span className="field-error" id="unitPrice-error" role="alert">
                  {fieldErrors.unitPrice}
                </span>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="totalAmount">
                Total Amount
              </label>
              <div className="calculated-field">
                <span className="calculated-icon">🧮</span>
                <input
                  type="text"
                  id="totalAmount"
                  name="totalAmount"
                  value={formatCurrency(formData.totalAmount)}
                  readOnly
                  disabled
                  className="calculated-input"
                  aria-label="Total amount (calculated automatically)"
                />
              </div>
              <small className="field-hint">Automatically calculated</small>
            </div>
          </div>
        </div>

        {/* Order Details Section */}
        <div className="form-section">
          <h4 className="section-title">
            <span className="section-icon">⚙️</span>
            Order Details
          </h4>
          
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="priority">
                Priority
              </label>
              <select
                id="priority"
                name="priority"
                value={formData.priority}
                onChange={handleChange}
                disabled={loading}
              >
                <option value="low">🟢 Low</option>
                <option value="medium">🟡 Medium</option>
                <option value="high">🔴 High</option>
              </select>
              <small className="field-hint">Set the order priority level</small>
            </div>

            <div className="form-group">
              <label htmlFor="paymentMethod">
                Payment Method
              </label>
              <select
                id="paymentMethod"
                name="paymentMethod"
                value={formData.paymentMethod}
                onChange={handleChange}
                disabled={loading}
              >
                <option value="Credit Card">💳 Credit Card</option>
                <option value="Debit Card">💳 Debit Card</option>
                <option value="PayPal">🅿️ PayPal</option>
                <option value="Bank Transfer">🏦 Bank Transfer</option>
                <option value="Corporate Account">🏢 Corporate Account</option>
              </select>
            </div>
          </div>

          <div className={`form-group ${fieldErrors.shippingAddress ? 'has-error' : ''}`}>
            <label htmlFor="shippingAddress">
              Shipping Address
            </label>
            <input
              type="text"
              id="shippingAddress"
              name="shippingAddress"
              value={formData.shippingAddress}
              onChange={handleChange}
              onBlur={handleBlur}
              placeholder="e.g., 123 Main St, City, State, ZIP"
              aria-invalid={fieldErrors.shippingAddress ? 'true' : 'false'}
              aria-describedby={fieldErrors.shippingAddress ? 'shippingAddress-error' : undefined}
              disabled={loading}
            />
            {fieldErrors.shippingAddress && (
              <span className="field-error" id="shippingAddress-error" role="alert">
                {fieldErrors.shippingAddress}
              </span>
            )}
            <small className="field-hint">Full shipping address including ZIP code</small>
          </div>

          <div className={`form-group ${fieldErrors.notes ? 'has-error' : ''}`}>
            <label htmlFor="notes">
              Additional Notes
            </label>
            <textarea
              id="notes"
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              onBlur={handleBlur}
              rows="4"
              placeholder="Add any special instructions or notes for this order..."
              maxLength="1000"
              aria-invalid={fieldErrors.notes ? 'true' : 'false'}
              aria-describedby={fieldErrors.notes ? 'notes-error notes-counter' : 'notes-counter'}
              disabled={loading}
            />
            {fieldErrors.notes && (
              <span className="field-error" id="notes-error" role="alert">
                {fieldErrors.notes}
              </span>
            )}
            <div className="field-meta">
              <span className="char-counter" id="notes-counter">
                {formData.notes.length} / 1000 characters
              </span>
            </div>
          </div>
        </div>

        <div className="form-actions">
          <button
            type="button"
            onClick={onCancel}
            className="btn btn-secondary"
            disabled={loading}
            aria-label="Cancel order creation"
          >
            <span>✖️</span>
            Cancel
          </button>
          <button
            type="submit"
            className="btn btn-primary"
            disabled={loading}
            aria-label={loading ? 'Creating order' : 'Submit order'}
          >
            {loading ? (
              <>
                <span className="spinner-small"></span>
                Creating Order...
              </>
            ) : (
              <>
                <span>✓</span>
                Create Order
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}

export default CreateOrderForm;
