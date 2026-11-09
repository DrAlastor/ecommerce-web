/**
 * @caso-de-uso CU19 — Gestionar reserva en sucursal
 * @subsistema Reservas
 * @capa Boundary — Frontend web
 * @responsabilidad Representa la pantalla principal de Frontend web; compone la interfaz e inicia las acciones del caso de uso.
 * @secuencia Encargado o Cajero -> bandeja de reservas -> controlador de atención -> servicio de reservas -> Reserva/DetalleReserva/Inventario/Bitácora.
 */
import React from 'react';
import { Loader2, CalendarClock } from 'lucide-react';
import { useBranchReservations } from '../hooks/useBranchReservations';
import { BranchReservationsMetricsCards } from '../components/BranchReservationsMetrics';
import { BranchReservationsFilters } from '../components/BranchReservationsFilters';
import { BranchReservationRow } from '../components/BranchReservationRow';
import { BranchReservationDetailModal } from '../components/BranchReservationDetailModal';
import { UpdateStatusActionModal } from '../components/UpdateStatusActionModal';
import './ManageBranchReservationsPage.css';

export const ManageBranchReservationsPage: React.FC = () => {
  const {
    branches,
    selectedBranchId,
    setSelectedBranchId,
    selectedStatus,
    setSelectedStatus,
    searchTerm,
    setSearchTerm,
    reservations,
    metrics,
    isLoading,
    isUpdating,
    feedback,
    selectedDetailReservation,
    setSelectedDetailReservation,
    actionModal,
    actionReason,
    setActionReason,
    promptStatusChange,
    closeActionModal,
    confirmStatusChange,
    refresh,
  } = useBranchReservations();

  return (
    <div className="branch-reservations-page">
      <div className="branch-res-container">
        {/* Encabezado */}
        <header className="branch-res-header">
          <div>
            <h1 className="page-title">Gestión de Reservas en Sucursal</h1>
            <p className="page-subtitle">
              Coordina la preparación física de prendas, confirma la llegada de clientes a los
              probadores y actualiza el estado de las reservas de tu tienda física.
            </p>
          </div>
        </header>

        {/* Feedback Alert */}
        {feedback && (
          <div className={`branch-res-feedback ${feedback.type}`}>
            <span>{feedback.type === 'success' ? '✓' : '⚠️'}</span>
            <span>{feedback.message}</span>
          </div>
        )}

        {/* Métricas / Contadores Operativos */}
        <BranchReservationsMetricsCards
          metrics={metrics}
          selectedStatus={selectedStatus}
          onStatusClick={(st) => setSelectedStatus(st)}
        />

        {/* Barra de Filtros y Búsqueda */}
        <BranchReservationsFilters
          branches={branches}
          selectedBranchId={selectedBranchId}
          onBranchChange={setSelectedBranchId}
          selectedStatus={selectedStatus}
          onStatusChange={setSelectedStatus}
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          onRefresh={refresh}
          isLoading={isLoading}
        />

        {/* Listado de Reservas */}
        <main className="branch-res-main">
          {isLoading ? (
            <div className="branch-res-loading">
              <Loader2 size={36} className="spin text-purple-600 mx-auto mb-3" />
              <p>Consultando reservas asignadas...</p>
            </div>
          ) : reservations.length === 0 ? (
            <div className="branch-res-empty">
              <CalendarClock size={48} className="text-gray-400 mx-auto mb-3" />
              <h3>No se encontraron reservas con los filtros aplicados</h3>
              <p>
                No hay reservas pendientes o activas en las sucursales seleccionadas para este
                criterio de búsqueda.
              </p>
            </div>
          ) : (
            <div className="branch-res-list">
              {reservations.map((res) => (
                <BranchReservationRow
                  key={res.id_reserva}
                  reservation={res}
                  onOpenDetail={setSelectedDetailReservation}
                  onPromptStatus={promptStatusChange}
                />
              ))}
            </div>
          )}
        </main>
      </div>

      {/* Modal de Detalle / Inspección de Prendas */}
      <BranchReservationDetailModal
        reservation={selectedDetailReservation}
        onClose={() => setSelectedDetailReservation(null)}
        onPromptStatus={promptStatusChange}
      />

      {/* Modal de Confirmación de Acción / Estado */}
      <UpdateStatusActionModal
        isOpen={actionModal.isOpen}
        reservation={actionModal.reservation}
        targetStatus={actionModal.targetStatus}
        title={actionModal.title}
        description={actionModal.description}
        reason={actionReason}
        onReasonChange={setActionReason}
        isSubmitting={isUpdating}
        onClose={closeActionModal}
        onConfirm={confirmStatusChange}
      />
    </div>
  );
};

export default ManageBranchReservationsPage;
