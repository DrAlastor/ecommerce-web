/**
 * @caso-de-uso CU18 — Consultar y cancelar reserva
 * @subsistema Reservas
 * @capa Boundary — Frontend web
 * @responsabilidad Representa la pantalla principal de Frontend web; compone la interfaz e inicia las acciones del caso de uso.
 * @secuencia Cliente -> listado de reservas -> controlador de reservas -> servicio de cancelación -> Reserva/DetalleReserva/Inventario.
 */
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2, RefreshCw, ArrowLeft } from 'lucide-react';
import { useMyReservations } from '../hooks/useMyReservations';
import { ReservationFilterTabs } from '../components/ReservationFilterTabs';
import { ReservationCard } from '../components/ReservationCard';
import { CancelReservationModal } from '../components/CancelReservationModal';
import { ReservationEmptyState } from '../components/ReservationEmptyState';
import { ReservationReceiptModal } from '../../CU17-realizar-reserva-prendas/components/ReservationReceiptModal';
import './MyReservationsPage.css';

export const MyReservationsPage: React.FC = () => {
  const navigate = useNavigate();
  const {
    activeTab,
    handleTabChange,
    reservations,
    isLoading,
    errorMessage,
    feedbackMessage,
    cancelingReservation,
    cancelReason,
    setCancelReason,
    isSubmittingCancel,
    openCancelModal,
    closeCancelModal,
    handleConfirmCancel,
    receiptModalData,
    openReceiptModal,
    closeReceiptModal,
    refresh,
  } = useMyReservations();

  return (
    <div className="my-reservations-page">
      <div className="my-reservations-container">
        {/* Header con botón para volver a catálogo */}
        <header className="my-reservations-header">
          <div className="header-top-bar">
            <button
              type="button"
              className="btn-back-catalog"
              onClick={() => navigate('/catalog')}
              title="Volver al Catálogo de Productos"
            >
              <ArrowLeft size={16} />
              <span>Volver al Catálogo</span>
            </button>
            <button
              type="button"
              className="btn-refresh"
              onClick={refresh}
              disabled={isLoading}
              title="Actualizar listado de reservas"
            >
              <RefreshCw size={15} className={isLoading ? 'spin' : ''} />
              <span>Actualizar</span>
            </button>
          </div>

          <div className="header-title-wrap">
            <h1 className="page-title">Mis Reservas en Tienda</h1>
            <p className="page-description">
              Gestiona tus prendas apartadas en sucursales físicas, consulta el código de
              comprobante y cancela reservas activas si ya no puedes asistir.
            </p>
          </div>
        </header>

        {/* Feedback Alert */}
        {feedbackMessage && (
          <div className={`reservations-feedback-banner ${feedbackMessage.type}`}>
            <span>{feedbackMessage.type === 'success' ? '✓' : '⚠️'}</span>
            <span>{feedbackMessage.message}</span>
          </div>
        )}

        {/* Error Alert */}
        {errorMessage && (
          <div className="reservations-feedback-banner error">
            <span>⚠️</span>
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Pestañas de Filtrado Activas / Histórico */}
        <ReservationFilterTabs activeTab={activeTab} onTabChange={handleTabChange} />

        {/* Contenido Principal */}
        <main className="reservations-list-section">
          {isLoading ? (
            <div className="reservations-loading-state">
              <Loader2 size={36} className="spin text-accent" />
              <p>Cargando tus reservas...</p>
            </div>
          ) : reservations.length === 0 ? (
            <ReservationEmptyState activeTab={activeTab} />
          ) : (
            <div className="reservations-grid">
              {reservations.map((res) => (
                <ReservationCard
                  key={res.id_reserva}
                  reservation={res}
                  onOpenReceipt={openReceiptModal}
                  onOpenCancel={openCancelModal}
                />
              ))}
            </div>
          )}
        </main>
      </div>

      {/* Modal de Cancelación */}
      <CancelReservationModal
        reservation={cancelingReservation}
        cancelReason={cancelReason}
        onReasonChange={setCancelReason}
        isSubmitting={isSubmittingCancel}
        onClose={closeCancelModal}
        onConfirm={handleConfirmCancel}
      />

      {/* Modal de Comprobante / Ticket Reutilizado de CU17 */}
      {receiptModalData && (
        <ReservationReceiptModal receipt={receiptModalData} onClose={closeReceiptModal} />
      )}
    </div>
  );
};

export default MyReservationsPage;
