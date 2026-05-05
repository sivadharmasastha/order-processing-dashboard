import React from 'react';
import PropTypes from 'prop-types';

/**
 * SkeletonLoader Component
 * Production-level skeleton loading placeholders
 * Used to show content structure while data is loading
 */
function SkeletonLoader({ 
  type = 'text', 
  width = '100%', 
  height, 
  count = 1,
  className = '' 
}) {
  const getHeightForType = () => {
    if (height) return height;
    
    switch (type) {
      case 'text':
        return '16px';
      case 'title':
        return '28px';
      case 'button':
        return '40px';
      case 'avatar':
        return '48px';
      case 'thumbnail':
        return '120px';
      case 'card':
        return '200px';
      default:
        return '16px';
    }
  };

  const getBorderRadius = () => {
    switch (type) {
      case 'avatar':
        return '50%';
      case 'thumbnail':
      case 'card':
        return '8px';
      case 'button':
        return '6px';
      default:
        return '4px';
    }
  };

  const skeletonStyle = {
    width,
    height: getHeightForType(),
    borderRadius: getBorderRadius()
  };

  const skeletons = Array.from({ length: count }, (_, index) => (
    <div
      key={index}
      className={`skeleton ${className}`}
      style={skeletonStyle}
      aria-hidden="true"
    />
  ));

  return count > 1 ? (
    <div className="skeleton-group">
      {skeletons}
    </div>
  ) : skeletons[0];
}

SkeletonLoader.propTypes = {
  type: PropTypes.oneOf(['text', 'title', 'button', 'avatar', 'thumbnail', 'card']),
  width: PropTypes.string,
  height: PropTypes.string,
  count: PropTypes.number,
  className: PropTypes.string
};

/**
 * TableSkeleton Component
 * Specialized skeleton for table loading
 */
export function TableSkeleton({ rows = 5, columns = 7 }) {
  return (
    <div className="table-skeleton" role="status" aria-label="Loading table data">
      <table className="order-table">
        <thead>
          <tr>
            {Array.from({ length: columns }, (_, i) => (
              <th key={i}>
                <SkeletonLoader width="80%" height="16px" />
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: rows }, (_, rowIndex) => (
            <tr key={rowIndex}>
              {Array.from({ length: columns }, (_, colIndex) => (
                <td key={colIndex}>
                  <SkeletonLoader width="90%" height="14px" />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

TableSkeleton.propTypes = {
  rows: PropTypes.number,
  columns: PropTypes.number
};

/**
 * CardSkeleton Component
 * Specialized skeleton for card loading
 */
export function CardSkeleton() {
  return (
    <div className="card-skeleton" role="status" aria-label="Loading card data">
      <div className="card" style={{ padding: '1.5rem' }}>
        <SkeletonLoader type="title" width="60%" />
        <div style={{ marginTop: '1rem' }}>
          <SkeletonLoader count={3} />
        </div>
        <div style={{ marginTop: '1.5rem', display: 'flex', gap: '0.5rem' }}>
          <SkeletonLoader type="button" width="100px" />
          <SkeletonLoader type="button" width="100px" />
        </div>
      </div>
    </div>
  );
}

/**
 * FormSkeleton Component
 * Specialized skeleton for form loading
 */
export function FormSkeleton({ fields = 5 }) {
  return (
    <div className="form-skeleton" role="status" aria-label="Loading form">
      {Array.from({ length: fields }, (_, index) => (
        <div key={index} className="form-group" style={{ marginBottom: '1rem' }}>
          <SkeletonLoader width="120px" height="20px" />
          <div style={{ marginTop: '0.5rem' }}>
            <SkeletonLoader height="40px" />
          </div>
        </div>
      ))}
      <div style={{ marginTop: '1.5rem' }}>
        <SkeletonLoader type="button" width="150px" />
      </div>
    </div>
  );
}

FormSkeleton.propTypes = {
  fields: PropTypes.number
};

export default SkeletonLoader;
