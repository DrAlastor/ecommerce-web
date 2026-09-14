import React from 'react';

export const ProductCardSkeleton: React.FC = () => {
  return (
    <div className="product-card-skeleton">
      <div className="skeleton-img skeleton-pulse" />
      <div className="skeleton-body">
        <div className="skeleton-line skeleton-pulse" />
        <div className="skeleton-line short skeleton-pulse" />
        <div className="skeleton-line half skeleton-pulse" />
      </div>
    </div>
  );
};
