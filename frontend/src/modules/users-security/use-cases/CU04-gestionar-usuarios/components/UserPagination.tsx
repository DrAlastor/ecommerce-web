/**
 * @caso-de-uso CU04 — Gestionar usuarios
 * @subsistema Usuarios y Seguridad
 * @capa Boundary — Frontend web
 * @responsabilidad Implementa una parte reutilizable de la interfaz de Frontend web y comunica eventos al controlador de presentación.
 * @secuencia Administrador -> vista de usuarios -> controlador de usuarios -> servicio de usuarios -> Usuario/Rol/Bitácora.
 */
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
