import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Boxes,
  Plus,
  RefreshCw,
} from 'lucide-react';
import { CreateMovementModal } from '../components/CreateMovementModal';
import { MovementDetailModal } from '../components/MovementDetailModal';
import { MovementsFilters } from '../components/MovementsFilters';
import { MovementsStats } from '../components/MovementsStats';
import { MovementsTable } from '../components/MovementsTable';
import { useMovements } from '../hooks/useMovements';
import './ManageMovementsPage.css';

export const ManageMovementsPage: React.FC = () => {
  const {
    loading,
    submitting,
    error,
    metadata,
    items,
    pagination,
    stats,
    filters,
    selectedMovement,
    isCreateModalOpen,
    isDetailModalOpen,
    updateFilters,
    handleCreateMovement,
    handleOpenDetail,
    setIsCreateModalOpen,
    setIsDetailModalOpen,
    refetch,
  } = useMovements();

  const [toastMessage, setToastMessage] = useState<{
    text: string;
    type: 'success' | 'error';
  } | null>(null);

  const showToast = (text: string, type: 'success' | 'error') => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 4000);
  };

  const onRegisterMovement = async (payload: any) => {
    const res = await handleCreateMovement(payload);
    if (res.success) {
      showToast(res.message, 'success');
    }
    return res;
  };

  return (
    <div className="manage-movements-container">
      {/* Toast de notificación */}
      {toastMessage && (
        <div className={`movements-toast toast-${toastMessage.type}`}>
          <span>{toastMessage.text}</span>
        </div>
      )}

      {/* Header Principal */}
      <header className="movements-page-header">
        <div className="header-titles">
          <div className="header-badge">
            <Boxes size={14} />
            <span>MÓDULO 3 — SUCURSALES E INVENTARIO</span>
          </div>
          <h1 className="header-title">Gestión de Movimientos de Inventario</h1>
          <p className="header-description">
            Supervisa la trazabilidad completa de existencias: entradas, salidas, devoluciones y
            ajustes de stock en tiempo real por sucursal.
          </p>
        </div>

        <div className="header-actions">
          <Link to="/admin/inventario" className="btn-secondary-link">
            <Boxes size={16} />
            <span>Consultar Inventario</span>
          </Link>

          <button
            type="button"
            onClick={() => refetch()}
            className="btn-refresh-header"
            title="Actualizar datos"
          >
            <RefreshCw size={16} />
          </button>

          <button
            type="button"
            onClick={() => setIsCreateModalOpen(true)}
            className="btn-primary-create"
          >
            <Plus size={18} />
            <span>Registrar Movimiento</span>
          </button>
        </div>
      </header>

      {/* Error de consulta si existiese */}
      {error && (
        <div className="movements-error-banner">
          <span>{error}</span>
          <button type="button" onClick={() => refetch()}>
            Reintentar
          </button>
        </div>
      )}

      {/* Métricas y KPIs */}
      <MovementsStats stats={stats} />

      {/* Filtros de consulta */}
      <MovementsFilters
        filters={filters}
        sucursales={metadata.sucursales}
        onFilterChange={updateFilters}
        onReset={() =>
          updateFilters({
            search: '',
            id_sucursal: undefined,
            tipo_movimiento: 'todos',
            fecha_desde: '',
            fecha_hasta: '',
          })
        }
      />

      {/* Tabla del Historial */}
      <MovementsTable
        items={items}
        pagination={pagination}
        loading={loading}
        onPageChange={(p) => updateFilters({ page: p })}
        onSelectDetail={handleOpenDetail}
      />

      {/* Modal para Registrar Movimiento */}
      <CreateMovementModal
        isOpen={isCreateModalOpen}
        metadata={metadata}
        submitting={submitting}
        onClose={() => setIsCreateModalOpen(false)}
        onSubmit={onRegisterMovement}
      />

      {/* Modal para Ver Detalle */}
      <MovementDetailModal
        isOpen={isDetailModalOpen}
        item={selectedMovement}
        onClose={() => setIsDetailModalOpen(false)}
      />
    </div>
  );
};

export default ManageMovementsPage;
