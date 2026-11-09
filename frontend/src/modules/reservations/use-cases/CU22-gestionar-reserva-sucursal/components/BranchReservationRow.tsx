/**
 * @caso-de-uso CU19 — Gestionar reserva en sucursal
 * @subsistema Reservas
 * @capa Boundary — Frontend web
 * @responsabilidad Implementa una parte reutilizable de la interfaz de Frontend web y comunica eventos al controlador de presentación.
 * @secuencia Encargado o Cajero -> bandeja de reservas -> controlador de atención -> servicio de reservas -> Reserva/DetalleReserva/Inventario/Bitácora.
 */
import React from 'react';
import {
  Calendar,
  User,
  Package,
  PackageCheck,
  UserCheck,
  CheckCircle2,
  Ban,
  Eye,
  Store,
} from 'lucide-react';
import type {
  BranchReservation,
  BranchReservationStatus,
} from '../types/branch-reservations.types';

interface BranchReservationRowProps {
  reservation: BranchReservation;
  onOpenDetail: (res: BranchReservation) => void;
  onPromptStatus: (res: BranchReservation, status: BranchReservationStatus) => void;
}

export const BranchReservationRow: React.FC<BranchReservationRowProps> = ({
  reservation,
  onOpenDetail,
  onPromptStatus,
}) => {
  const getStatusBadge = (estado: BranchReservationStatus) => {
    switch (estado) {
      case 'Pendiente':
        return <span className="b-badge b-badge-pending">Pendiente</span>;
      case 'Preparada':
        return <span className="b-badge b-badge-prepared">Preparada</span>;
      case 'Atendida':
        return <span className="b-badge b-badge-attended">En Probador</span>;
      case 'Completada':
        return <span className="b-badge b-badge-completed">Vendido / Completado</span>;
      case 'Cancelada':
        return <span className="b-badge b-badge-cancelled">Cancelada</span>;
      case 'Expirada':
        return <span className="b-badge b-badge-expired">Expirada</span>;
      default:
        return <span className="b-badge">{estado}</span>;
    }
  };

  const formatDate = (isoStr: string) => {
    return new Date(isoStr).toLocaleDateString('es-BO', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <article className="branch-res-card">
      <div className="card-top-header">
        <div className="header-meta-group">
          <span className="res-code">{reservation.codigo}</span>
          {getStatusBadge(reservation.estado)}
          <span className="res-store-tag">
            <Store size={13} /> {reservation.sucursal.nombre}
          </span>
        </div>
        <div className="header-time">
          <Calendar size={13} />
          <span>{formatDate(reservation.fecha_reserva)}</span>
        </div>
      </div>

      <div className="card-main-body">
        {/* Información del Cliente */}
        <div className="client-column">
          <div className="client-info-box">
            <div className="client-avatar">
              <User size={18} />
            </div>
            <div>
              <strong className="client-name">{reservation.cliente.nombre_completo}</strong>
              <span className="client-ci">
                CI: {reservation.cliente.ci || 'Sin documento registrado'}
              </span>
            </div>
          </div>
          {reservation.observaciones && (
            <div className="res-note-preview">
              <span className="note-label">Nota:</span> {reservation.observaciones}
            </div>
          )}
        </div>

        {/* Resumen de Prendas */}
        <div className="garments-summary-column">
          <div className="garments-header">
            <Package size={15} />
            <span>
              {reservation.total_prendas} prenda(s) reservada(s) • Total estimado:{' '}
              <strong>Bs {reservation.total_estimado.toFixed(2)}</strong>
            </span>
          </div>
          <div className="garments-preview-list">
            {reservation.items.slice(0, 3).map((item) => (
              <div key={item.id_detalle_reserva} className="garment-mini-chip">
                {item.imagen_url ? (
                  <img src={item.imagen_url} alt={item.producto_nombre} className="mini-thumb" />
                ) : (
                  <div className="mini-thumb-placeholder">👗</div>
                )}
                <div className="mini-desc">
                  <span className="mini-name">{item.producto_nombre}</span>
                  <span className="mini-specs">
                    Talla: {item.talla} • {item.color_nombre} ({item.cantidad} ud.)
                  </span>
                </div>
              </div>
            ))}
            {reservation.items.length > 3 && (
              <span className="more-items-chip">+{reservation.items.length - 3} más</span>
            )}
          </div>
        </div>

        {/* Botones de Acción Operativa */}
        <div className="card-actions-column">
          {reservation.acciones_disponibles.includes('preparar') && (
            <button
              type="button"
              className="btn-action btn-prepare"
              onClick={() => onPromptStatus(reservation, 'Preparada')}
              title="Marcar como prendas preparadas en tienda"
            >
              <PackageCheck size={16} />
              Preparar Prendas
            </button>
          )}

          {reservation.acciones_disponibles.includes('atender') && (
            <button
              type="button"
              className="btn-action btn-attend"
              onClick={() => onPromptStatus(reservation, 'Atendida')}
              title="Registrar llegada del cliente a tienda y entrega en probador"
            >
              <UserCheck size={16} />
              Atender Cliente
            </button>
          )}

          {reservation.acciones_disponibles.includes('completar') && (
            <button
              type="button"
              className="btn-action btn-complete"
              onClick={() => onPromptStatus(reservation, 'Completada')}
              title="Completar venta (descuenta inventario reservado)"
            >
              <CheckCircle2 size={16} />
              Completar Venta
            </button>
          )}

          {reservation.acciones_disponibles.includes('cancelar') && (
            <button
              type="button"
              className="btn-action btn-cancel-res"
              onClick={() => onPromptStatus(reservation, 'Cancelada')}
              title="Cancelar reserva y devolver prendas al inventario disponible"
            >
              <Ban size={15} />
              Liberar / Cancelar
            </button>
          )}

          <button
            type="button"
            className="btn-action btn-inspect"
            onClick={() => onOpenDetail(reservation)}
          >
            <Eye size={15} />
            Ver Prendas
          </button>
        </div>
      </div>
    </article>
  );
};
