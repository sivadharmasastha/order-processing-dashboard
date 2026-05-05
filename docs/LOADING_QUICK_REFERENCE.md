# Loading States - Quick Reference Guide

## 📦 Available Components

### 1. SkeletonLoader
```jsx
import SkeletonLoader, { TableSkeleton, CardSkeleton, FormSkeleton } from './components/SkeletonLoader';

// Basic usage
<SkeletonLoader type="text" width="200px" />
<SkeletonLoader type="title" width="60%" />
<SkeletonLoader type="button" width="120px" />

// Multiple skeletons
<SkeletonLoader type="text" count={5} />

// Specialized skeletons
<TableSkeleton rows={10} columns={7} />
<CardSkeleton />
<FormSkeleton fields={6} />
```

### 2. ButtonWithLoading
```jsx
import ButtonWithLoading from './components/ButtonWithLoading';

<ButtonWithLoading
  onClick={handleSubmit}
  loading={isSubmitting}
  loadingText="Saving..."
  variant="primary"  // primary, secondary, success, danger, warning
  size="medium"      // small, medium, large
  icon="✓"
  fullWidth={false}
>
  Save Changes
</ButtonWithLoading>
```

### 3. Enhanced Loader
```jsx
import Loader from './components/Loader';

<Loader 
  message="Loading data..." 
  size="medium"          // small, medium, large
  variant="fullscreen"   // fullscreen, overlay, inline, minimal, card
  showProgress={false}
  progress={0}
  backdrop={true}
/>
```

### 4. LoadingContext
```jsx
import { useLoading } from './context/LoadingContext';

function MyComponent() {
  const { 
    startLoading, 
    stopLoading, 
    isLoading, 
    withLoading 
  } = useLoading();

  // Method 1: Manual control
  const handleAction = async () => {
    startLoading('operation1', 'Processing...');
    try {
      await api.fetchData();
    } finally {
      stopLoading('operation1');
    }
  };

  // Method 2: Using withLoading
  const handleAction2 = async () => {
    await withLoading('operation2', async () => {
      await api.fetchData();
    }, 'Processing...');
  };

  // Check loading state
  if (isLoading('operation1')) {
    return <Loader variant="inline" />;
  }
}
```

---

## 🎯 Common Use Cases

### Page Initial Load
```jsx
if (loading && !data.length) {
  return <TableSkeleton rows={10} columns={7} />;
}
```

### Form Submission
```jsx
<ButtonWithLoading
  type="submit"
  loading={isSubmitting}
  loadingText="Creating Order..."
  variant="primary"
>
  Create Order
</ButtonWithLoading>
```

### Data Refresh
```jsx
{refreshing && (
  <div className="refreshing-indicator">
    <span className="spinner-small"></span>
    <span>Refreshing data...</span>
  </div>
)}
```

### Inline Action Loading
```jsx
{isDeleting ? (
  <span className="action-loading">
    <span className="spinner-tiny"></span>
    Deleting...
  </span>
) : (
  <button onClick={handleDelete}>Delete</button>
)}
```

### Progress Tracking
```jsx
<Loader 
  message="Uploading files..." 
  showProgress={true} 
  progress={uploadProgress} 
/>
```

---

## 🎨 CSS Classes Available

### Spinners
```css
.spinner-small    /* 16px spinner */
.spinner-tiny     /* 12px spinner */
```

### Loading States
```css
.btn-loading      /* Button in loading state */
.row-deleting     /* Table row being deleted */
.action-loading   /* Inline action loading */
```

### Animations
```css
.skeleton         /* Shimmer animation */
.shimmer          /* Alternative shimmer */
.pulse            /* Pulsing effect */
```

### Layout
```css
.refreshing-indicator  /* Fixed position refresh indicator */
.connection-banner     /* API connection banner */
```

---

## ⚡ Performance Tips

1. **Use Skeleton for Initial Loads**: Better perceived performance
2. **Use Inline Spinners for Quick Actions**: < 3 seconds
3. **Use Progress Bars for Long Operations**: > 3 seconds
4. **Optimize Animations**: Already GPU-accelerated, but avoid nesting
5. **Debounce Search/Filter Operations**: Use 300-500ms delay

---

## ♿ Accessibility Checklist

- ✅ All loaders have aria-busy="true"
- ✅ Loading messages have aria-live="polite"
- ✅ Buttons have descriptive aria-labels
- ✅ Respects prefers-reduced-motion
- ✅ Keyboard navigation supported
- ✅ Screen reader announcements

---

## 🐛 Troubleshooting

### Issue: Skeleton not showing
**Solution**: Check if loading state is true and data array is empty

### Issue: Button still clickable during loading
**Solution**: Ensure you're using ButtonWithLoading, not regular button

### Issue: Animations not smooth
**Solution**: Check for too many concurrent animations or large DOM

### Issue: Loading never stops
**Solution**: Ensure stopLoading() is called in finally block

---

## 📋 Code Snippets

### Optimistic Update Pattern
```jsx
const handleDelete = async (id) => {
  const backup = [...items];
  
  // Optimistic update
  setItems(items.filter(item => item.id !== id));
  
  try {
    await api.deleteItem(id);
  } catch (error) {
    // Rollback on error
    setItems(backup);
    showError('Failed to delete');
  }
};
```

### Retry Logic Pattern
```jsx
const fetchWithRetry = async (retryCount = 0) => {
  const MAX_RETRIES = 2;
  
  try {
    setLoading(true);
    const data = await api.fetch();
    setData(data);
  } catch (error) {
    if (retryCount < MAX_RETRIES) {
      await delay(1000 * (retryCount + 1));
      return fetchWithRetry(retryCount + 1);
    }
    setError(error.message);
  } finally {
    setLoading(false);
  }
};
```

### Debounced Search
```jsx
import { useCallback } from 'react';
import { debounce } from 'lodash';

const debouncedSearch = useCallback(
  debounce((query) => {
    performSearch(query);
  }, 300),
  []
);
```

---

## 🔗 Related Documentation

- [Main Loading States Documentation](./LOADING_STATES.md)

---

**Last Updated**: May 5, 2026
