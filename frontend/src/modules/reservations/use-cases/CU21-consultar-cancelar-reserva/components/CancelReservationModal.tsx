/**
 * @caso-de-uso CU18 — Consultar y cancelar reserva
 * @subsistema Reservas
 * @capa Boundary — Frontend web
 * @responsabilidad Implementa una parte reutilizable de la interfaz de Frontend web y comunica eventos al controlador de presentación.
 * @secuencia Cliente -> listado de reservas -> controlador de reservas -> servicio de cancelación -> Reserva/DetalleReserva/Inventario.
 */
import React from 'react';
import { AlertTriangle, Ban, Loader2, X } from 'lucide-react';
import type { MyReservationListItem } from '../types/my-reservations.types';

interface CancelReservationModalProps {
  reservation: MyReservationListItem | null;
  cancelReason: string;
  onReasonChange: (reason: string) => void;
  isSubmitting: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export const CancelReservationModal: React.FC<CancelReservationModalProps> = ({
  reservation,
  cancelReason,
  onReasonChange,
  isSubmitting,
  onClose,
  onConfirm,
}) => {
  if (!reservation) return null;

  return (
    <div className="res-modal-overlay">
      <div className="res-modal-dialog">
        <div className="res-modal-header">
          <div className="header-badge-danger">
            <AlertTriangle size={20} />
          </div>
          <h3>¿Cancelar Reserva {reservation.codigo}?</h3>
          <button type="button" className="close-btn" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <div className="res-modal-body">
          <p className="confirm-p">
            Al cancelar esta reserva, las prendas apartadas en{' '}
            <strong>{reservation.sucursal.nombre}</strong> serán devueltas inmediatamente al
            inventario físico disponible para que otros clientes puedan comprarlas o reservarlas.
          </p>

          <div className="cancel-form-group">
            <label htmlFor="cancel-reason">Motivo de cancelación (opcional):</label>
            <textarea
              id="cancel-reason"
              value={cancelReason}
              onChange={(e) => onReasonChange(e.target.value)}
              placeholder="Ej. Cambio de planes, encontré otra prenda, no podré acudir..."
              rows={3}
              maxLength={250}
            />
          </div>
        </div>

        <div className="res-modal-footer">
          <button
            type="button"
            className="btn-secondary"
            onClick={onClose}
            disabled={isSubmitting}
          >
            Volver
          </button>
          <button
            type="button"
            className="btn-danger"
            onClick={onConfirm}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <Loader2 size={16} className="spin" />
                Cancelando...
              </>
            ) : (
              <>
                <Ban size={16} />
                Confirmar Cancelación
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
