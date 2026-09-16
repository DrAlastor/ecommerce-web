import React from 'react';

interface BitacoraPaginationProps {
  currentCount: number;
  total: number;
  page: number;
  totalPages: number;
  loading: boolean;
  onPrevPage: () => void;
  onNextPage: () => void;
}

export const BitacoraPagination: React.FC<BitacoraPaginationProps> = ({
  currentCount,
  total,
  page,
  totalPages,
  loading,
  onPrevPage,
  onNextPage,
}) => {
  return (
    <div className="pagination-bar">
      <span>Mostrando {currentCount} de {total} eventos registrados</span>
      <div className="pagination-buttons">
        <button
          disabled={page <= 1 || loading}
          onClick={onPrevPage}
        >
          ← Anterior
        </button>
        <span style={{ display: 'flex', alignItems: 'center', padding: '0 0.5rem', fontWeight: 500 }}>
          {page} de {totalPages}
        </span>
        <button
          disabled={page >= totalPages || loading}
          onClick={onNextPage}
        >
          Siguiente →
        </button>
      </div>
    </div>
  );
};
