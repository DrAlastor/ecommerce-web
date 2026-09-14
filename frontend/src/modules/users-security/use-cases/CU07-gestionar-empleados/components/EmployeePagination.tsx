import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface EmployeePaginationProps {
  page: number;
  totalPages: number;
  totalItems: number;
  currentCount: number;
  onPageChange: (newPage: number) => void;
}

export const EmployeePagination: React.FC<EmployeePaginationProps> = ({
  page,
  totalPages,
  totalItems,
  currentCount,
  onPageChange,
}) => {
  if (totalPages <= 1) return null;

  return (
    <div className="employees-pagination">
      <span className="pagination-info">
        Mostrando {currentCount} de {totalItems} empleados
      </span>
      <div className="pagination-buttons">
        <button
          type="button"
          className="btn-page"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
        >
          <ChevronLeft size={16} />
          <span>Anterior</span>
        </button>
        <span className="page-number-indicator">
          Página {page} de {totalPages}
        </span>
        <button
          type="button"
          className="btn-page"
          disabled={page >= totalPages}
          onClick={() => onPageChange(page + 1)}
        >
          <span>Siguiente</span>
          <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );
};
