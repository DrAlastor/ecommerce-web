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
  Package,
  User,
  Store,
  Calendar,
  Clock,
  PackageCheck,
  UserCheck,
  CheckCircle2,
  Ban,
} from 'lucide-react';
import type {
  BranchReservation,
  BranchReservationStatus,
} from '../types/branch-reservations.types';

interface BranchReservationDetailModalProps {
  reservation: BranchReservation | null;
  onClose: () => void;
  onPromptStatus: (res: BranchReservation, status: BranchReservationStatus) => void;
}

export const BranchReservationDetailModal: React.FC<BranchReservationDetailModalProps> = ({
  reservation,
  onClose,
  onPromptStatus,
}) => {
  if (!reservation) return null;

  const formatDate = (isoStr: string) => {
    return new Date(isoStr).toLocaleDateString('es-BO', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="b-modal-overlay">
      <div className="b-modal-container">
        {/* Modal Header */}
        <div className="b-modal-header">
          <div className="b-modal-title-group">
            <span className="b-badge-detail">{reservation.estado}</span>
            <h2>Reserva {reservation.codigo}</h2>
          </div>
          <button type="button" className="b-btn-close" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="b-modal-body">
          {/* Ficha Resumen */}
          <div className="detail-meta-grid">
            <div className="meta-card">
              <div className="meta-card-icon">
                <User size={18} />
              </div>
              <div className="meta-card-data">
                <span className="meta-label">Cliente</span>
                <strong>{reservation.cliente.nombre_completo}</strong>
                <span className="meta-sub">CI: {reservation.cliente.ci || 'N/A'}</span>
              </div>
            </div>

            <div className="meta-card">
              <div className="meta-card-icon">
                <Store size={18} />
              </div>
              <div className="meta-card-data">
                <span className="meta-label">Sucursal de Retiro</span>
                <strong>{reservation.sucursal.nombre}</strong>
                <span className="meta-sub">
                  {reservation.sucursal.direccion} ({reservation.sucursal.ciudad})
                </span>
              </div>
            </div>

            <div className="meta-card">
              <div className="meta-card-icon">
                <Calendar size={18} />
              </div>
              <div className="meta-card-data">
                <span className="meta-label">Fecha de Reserva</span>
                <strong>{formatDate(reservation.fecha_reserva)}</strong>
                {reservation.horario_estimado && (
                  <span className="meta-sub">
                    <Clock size={12} /> Visita: {formatDate(reservation.horario_estimado)}
                  </span>
                )}
              </div>
            </div>
          </div>

          {reservation.observaciones && (
            <div className="detail-notes-box">
              <strong>Observaciones registradas:</strong>
              <p>{reservation.observaciones}</p>
            </div>
          )}

          {/* Tabla de prendas para preparación */}
          <div className="garments-detail-section">
            <div className="section-heading">
              <Package size={18} />
              <h3>Prendas para Preparación en Tienda ({reservation.total_prendas} unidades)</h3>
            </div>

            <table className="garments-table">
              <thead>
                <tr>
                  <th>Prenda</th>
                  <th>SKU Inventario</th>
                  <th>Talla</th>
                  <th>Color</th>
                  <th>Cantidad</th>
                  <th>Precio Unitario</th>
                  <th>Subtotal</th>
                </tr>
              </thead>
              <tbody>
                {reservation.items.map((item) => (
                  <tr key={item.id_detalle_reserva}>
                    <td>
                      <div className="product-table-cell">
                        {item.imagen_url ? (
                          <img
                            src={item.imagen_url}
                            alt={item.producto_nombre}
                            className="garment-img"
                          />
                        ) : (
                          <div className="garment-img-placeholder">👗</div>
                        )}
                        <div>
                          <strong className="garment-title">{item.producto_nombre}</strong>
                          <span className="garment-state-tag">{item.estado}</span>
                        </div>
                      </div>
                    </td>
                    <td>
                      <code className="sku-code">{item.sku}</code>
                    </td>
                    <td>
                      <span className="pill-size">{item.talla}</span>
                    </td>
                    <td>
                      <div className="color-tag">
                        <span
                          className="color-circle"
                          style={{ backgroundColor: item.color_hex || '#888' }}
                        />
                        <span>{item.color_nombre}</span>
                      </div>
                    </td>
                    <td>
                      <strong>{item.cantidad} ud.</strong>
                    </td>
                    <td>Bs {item.precio_estimado.toFixed(2)}</td>
                    <td className="price-bold">Bs {item.subtotal_estimado.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="table-footer-total">
              <span>Total Estimado a Cobrar en Caja:</span>
              <strong className="grand-total">Bs {reservation.total_estimado.toFixed(2)}</strong>
            </div>
          </div>
        </div>

        {/* Modal Footer con Acciones Rápidas */}
        <div className="b-modal-footer">
          <div className="footer-actions">
            {reservation.acciones_disponibles.includes('preparar') && (
              <button
                type="button"
                className="btn-modal-action btn-prepare"
                onClick={() => onPromptStatus(reservation, 'Preparada')}
              >
                <PackageCheck size={16} />
                Marcar como Preparada
              </button>
            )}

            {reservation.acciones_disponibles.includes('atender') && (
              <button
                type="button"
                className="btn-modal-action btn-attend"
                onClick={() => onPromptStatus(reservation, 'Atendida')}
              >
                <UserCheck size={16} />
                Confirmar Atención en Probador
              </button>
            )}

            {reservation.acciones_disponibles.includes('completar') && (
              <button
                type="button"
                className="btn-modal-action btn-complete"
                onClick={() => onPromptStatus(reservation, 'Completada')}
              >
                <CheckCircle2 size={16} />
                Completar Venta
              </button>
            )}

            {reservation.acciones_disponibles.includes('cancelar') && (
              <button
                type="button"
                className="btn-modal-action btn-cancel"
                onClick={() => onPromptStatus(reservation, 'Cancelada')}
              >
                <Ban size={15} />
                Cancelar y Liberar Prendas
              </button>
            )}

            <button type="button" className="btn-modal-close" onClick={onClose}>
              Cerrar Detalle
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
