import React from 'react';
import { Package, ShieldAlert, RefreshCw } from 'lucide-react';
import { useInventory } from '../hooks/useInventory';
import { InventoryStats } from '../components/InventoryStats';
import { InventoryFilters } from '../components/InventoryFilters';
import { InventoryTable } from '../components/InventoryTable';
import { InventoryDetailModal } from '../components/InventoryDetailModal';
import './ManageInventoryPage.css';

export const ManageInventoryPage: React.FC = () => {
  const {
    items,
    metadata,
    stats,
    loading,
    error,
    searchQuery,
    setSearchQuery,
    selectedBranchId,
    setSelectedBranchId,
    selectedSizeId,
    setSelectedSizeId,
    selectedColorId,
    setSelectedColorId,
    selectedStockStatus,
    setSelectedStockStatus,
    currentPage,
    setCurrentPage,
    totalPages,
    totalItems,
    selectedItemForDetail,
    setSelectedItemForDetail,
    handleResetFilters,
    refetch,
  } = useInventory();

  return (
    <div className="manage-inventory-container">
      {/* Cabecera del módulo */}
      <div className="manage-inv-header">
        <div className="inv-header-title-wrapper">
          <div className="inv-header-badge">
            <Package size={14} />
            <span>Módulo 3 — Sucursales e Inventario</span>
          </div>
          <h1 className="inv-header-title">Existencias e Inventario</h1>
          <p className="inv-header-subtitle">
            Monitoreo en tiempo real de unidades disponibles, prendas reservadas y umbrales de seguridad en las sucursales autorizadas.
          </p>
        </div>

        <button
          type="button"
          className="inv-refresh-action-btn"
          onClick={refetch}
          title="Actualizar inventario"
        >
          <RefreshCw size={16} className={loading ? 'spinning' : ''} />
          <span>Actualizar</span>
        </button>
      </div>

      {/* Tarjetas de Estadísticas Globales */}
      <InventoryStats stats={stats} loading={loading} />

      {/* Banner de error si aplica */}
      {error && (
        <div className="inv-error-banner">
          <ShieldAlert size={20} />
          <div>
            <h4>Aviso de Permisos / Conexión</h4>
            <p>{error}</p>
          </div>
        </div>
      )}

      {/* Barra de Filtros */}
      <InventoryFilters
        metadata={metadata}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        selectedBranchId={selectedBranchId}
        onBranchChange={setSelectedBranchId}
        selectedSizeId={selectedSizeId}
        onSizeChange={setSelectedSizeId}
        selectedColorId={selectedColorId}
        onColorChange={setSelectedColorId}
        selectedStockStatus={selectedStockStatus}
        onStockStatusChange={setSelectedStockStatus}
        onResetFilters={handleResetFilters}
      />

      {/* Tabla de Inventario */}
      <InventoryTable
        items={items}
        loading={loading}
        totalItems={totalItems}
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
        onSelectItem={setSelectedItemForDetail}
      />

      {/* Modal de Detalle */}
      <InventoryDetailModal
        item={selectedItemForDetail}
        onClose={() => setSelectedItemForDetail(null)}
      />
    </div>
  );
};

export default ManageInventoryPage;
