import React from 'react';

interface UserPaginationProps {
  page: number;
  totalPages: number;
  total: number;
  onPageChange: (newPage: number) => void;
}

export const UserPagination: React.FC<UserPaginationProps> = ({
  page,
  totalPages,
  total,
  onPageChange,
}) => {
  return (
    <div className="pagination-controls">
      <button 
        disabled={page === 1} 
        onClick={() => onPageChange(page - 1)}
      >
        Anterior
      </button>
      <span>Página {page} de {totalPages} (Total: {total})</span>
      <button 
        disabled={page === totalPages} 
        onClick={() => onPageChange(page + 1)}
      >
        Siguiente
      </button>
    </div>
  );
};
