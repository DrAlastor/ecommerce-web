/**
 * @caso-de-uso CU19 — Gestionar reserva en sucursal
 * @subsistema Reservas
 * @capa Boundary — Frontend web
 * @responsabilidad Implementa una parte reutilizable de la interfaz de Frontend web y comunica eventos al controlador de presentación.
 * @secuencia Encargado o Cajero -> bandeja de reservas -> controlador de atención -> servicio de reservas -> Reserva/DetalleReserva/Inventario/Bitácora.
 */
import React from 'react';
import {
  X,
  AlertTriangle,
  PackageCheck,
  UserCheck,
  CheckCircle2,
  Ban,
  Loader2,
} from 'lucide-react';
import type {
  BranchReservation,
  BranchReservationStatus,
} from '../types/branch-reservations.types';

interface UpdateStatusActionModalProps {
  isOpen: boolean;
  reservation: BranchReservation | null;
  targetStatus: BranchReservationStatus | null;
  title: string;
  description: string;
  reason: string;
  onReasonChange: (reason: string) => void;
  isSubmitting: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export const UpdateStatusActionModal: React.FC<UpdateStatusActionModalProps> = ({
  isOpen,
  reservation,
  targetStatus,
  title,
  description,
  reason,
  onReasonChange,
  isSubmitting,
  onClose,
  onConfirm,
}) => {
  if (!isOpen || !reservation || !targetStatus) return null;

  const getActionIcon = () => {
    switch (targetStatus) {
      case 'Preparada':
        return <PackageCheck size={22} className="text-blue-500" />;
      case 'Atendida':
        return <UserCheck size={22} className="text-purple-500" />;
      case 'Completada':
        return <CheckCircle2 size={22} className="text-green-500" />;
      case 'Cancelada':
        return <Ban size={22} className="text-red-500" />;
      default:
        return <AlertTriangle size={22} />;
    }
  };

  const getConfirmButtonClass = () => {
    switch (targetStatus) {
      case 'Preparada':
        return 'btn-confirm-blue';
      case 'Atendida':
        return 'btn-confirm-purple';
      case 'Completada':
        return 'btn-confirm-green';
      case 'Cancelada':
        return 'btn-confirm-red';
      default:
        return 'btn-confirm-primary';
    }
  };

  return (
    <div className="action-modal-overlay">
      <div className="action-modal-dialog">
        <div className="action-modal-header">
          <div className="action-icon-circle">{getActionIcon()}</div>
          <div className="action-header-text">
            <h3>{title}</h3>
            <span className="action-code-sub">Código: {reservation.codigo}</span>
          </div>
          <button
            type="button"
            className="action-close-btn"
            onClick={onClose}
            disabled={isSubmitting}
          >
            <X size={18} />
          </button>
        </div>

        <div className="action-modal-body">
          <p className="action-description-text">{description}</p>

          <div className="action-summary-box">
            <div className="summary-line">
              <span>Cliente:</span>
              <strong>{reservation.cliente.nombre_completo}</strong>
            </div>
            <div className="summary-line">
              <span>Prendas involucradas:</span>
              <strong>{reservation.total_prendas} unidades</strong>
            </div>
            <div className="summary-line">
              <span>Sucursal:</span>
              <strong>{reservation.sucursal.nombre}</strong>
            </div>
          </div>

          <div className="action-input-group">
            <label htmlFor="action-reason">
              Nota u observación operativa {targetStatus === 'Cancelada' ? '(recomendado)' : '(opcional)'}:
            </label>
            <textarea
              id="action-reason"
              rows={3}
              placeholder={
                targetStatus === 'Cancelada'
                  ? 'Indica el motivo de cancelación (ej. cliente desistió, talla no adecuada, no asistió)...'
                  : 'Añadir nota interna para la bitácora...'
              }
              value={reason}
              onChange={(e) => onReasonChange(e.target.value)}
              disabled={isSubmitting}
              maxLength={250}
            />
          </div>
        </div>

        <div className="action-modal-footer">
          <button
            type="button"
            className="btn-cancel-action"
            onClick={onClose}
            disabled={isSubmitting}
          >
            Volver
          </button>
          <button
            type="button"
            className={`btn-confirm-action ${getConfirmButtonClass()}`}
            onClick={onConfirm}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <Loader2 size={16} className="spin" />
                Actualizando...
              </>
            ) : (
              `Confirmar ${targetStatus}`
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
