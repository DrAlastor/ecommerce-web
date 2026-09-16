import React from 'react';
import { Loader2, RefreshCw } from 'lucide-react';
import { useMyReservations } from '../hooks/useMyReservations';
import { ReservationFilterTabs } from '../components/ReservationFilterTabs';
import { ReservationCard } from '../components/ReservationCard';
import { CancelReservationModal } from '../components/CancelReservationModal';
import { ReservationEmptyState } from '../components/ReservationEmptyState';
import { ReservationReceiptModal } from '../../CU17-realizar-reserva-prendas/components/ReservationReceiptModal';
import './MyReservationsPage.css';

export const MyReservationsPage: React.FC = () => {
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
        {/* Header */}
        <header className="my-reservations-header">
          <div className="header-title-wrap">
            <span className="section-badge">Módulo 4 — Reservas de Prendas</span>
            <h1 className="page-title">Mis Reservas en Tienda</h1>
            <p className="page-description">
              Gestiona tus prendas apartadas en sucursales físicas, consulta el código de
              comprobante y cancela reservas activas si ya no puedes asistir.
            </p>
          </div>
          <button
            type="button"
            className="btn-refresh"
            onClick={refresh}
            disabled={isLoading}
            title="Actualizar listado"
          >
            <RefreshCw size={16} className={isLoading ? 'spin' : ''} />
            Actualizar
          </button>
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
