/**
 * @caso-de-uso CU18 — Consultar y cancelar reserva
 * @subsistema Reservas
 * @capa Boundary — Frontend web
 * @responsabilidad Implementa una parte reutilizable de la interfaz de Frontend web y comunica eventos al controlador de presentación.
 * @secuencia Cliente -> listado de reservas -> controlador de reservas -> servicio de cancelación -> Reserva/DetalleReserva/Inventario.
 */
import React from 'react';
import {
  Calendar,
  Clock,
  Store,
  MapPin,
  Ban,
  FileText,
} from 'lucide-react';
import type { MyReservationListItem } from '../types/my-reservations.types';

interface ReservationCardProps {
  reservation: MyReservationListItem;
  onOpenReceipt: (res: MyReservationListItem) => void;
  onOpenCancel: (res: MyReservationListItem) => void;
}

export const ReservationCard: React.FC<ReservationCardProps> = ({
  reservation,
  onOpenReceipt,
  onOpenCancel,
}) => {
  const getStatusBadge = (estado: string) => {
    switch (estado) {
      case 'Pendiente':
        return <span className="status-badge badge-pendiente">Pendiente</span>;
      case 'Confirmada':
        return <span className="status-badge badge-confirmada">Confirmada</span>;
      case 'Atendida':
        return <span className="status-badge badge-atendida">En Tienda</span>;
      case 'Completada':
        return <span className="status-badge badge-completada">Comprada</span>;
      case 'Cancelada':
        return <span className="status-badge badge-cancelada">Cancelada</span>;
      case 'Expirada':
        return <span className="status-badge badge-expirada">Expirada</span>;
      default:
        return <span className="status-badge">{estado}</span>;
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('es-BO', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <article className="reservation-card">
      <div className="res-card-header">
        <div className="res-card-id-block">
          <span className="res-code-label">Código</span>
          <span className="res-code-val">{reservation.codigo}</span>
          {getStatusBadge(reservation.estado)}
        </div>
        <div className="res-card-actions">
          <button
            type="button"
            className="res-btn-view-voucher"
            onClick={() => onOpenReceipt(reservation)}
          >
            <FileText size={15} />
            Ver Comprobante
          </button>
          {reservation.es_cancelable && (
            <button
              type="button"
              className="res-btn-cancel"
              onClick={() => onOpenCancel(reservation)}
            >
              <Ban size={15} />
              Cancelar
            </button>
          )}
        </div>
      </div>

      <div className="res-card-info-grid">
        <div className="res-info-col">
          <div className="info-item">
            <Store size={15} className="info-icon" />
            <div>
              <strong>{reservation.sucursal.nombre}</strong>
              <p className="subtext">
                <MapPin size={12} /> {reservation.sucursal.direccion} ({reservation.sucursal.ciudad})
              </p>
            </div>
          </div>
        </div>

        <div className="res-info-col">
          <div className="info-item">
            <Calendar size={15} className="info-icon" />
            <div>
              <span>Creada: {formatDate(reservation.fecha_reserva)}</span>
              <p className="subtext warning">
                <Clock size={12} /> Límite para recoger: {formatDate(reservation.fecha_limite)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {reservation.observaciones && (
        <div className="res-notes-callout">
          <strong>Notas:</strong> {reservation.observaciones}
        </div>
      )}

      {/* Lista de prendas reservadas */}
      <div className="res-items-table-wrapper">
        <table className="res-items-table">
          <thead>
            <tr>
              <th>Prenda</th>
              <th>Talla</th>
              <th>Color</th>
              <th>Cantidad</th>
              <th>Total Estimado</th>
            </tr>
          </thead>
          <tbody>
            {reservation.items.map((item) => (
              <tr key={item.id_detalle_reserva}>
                <td>
                  <div className="product-summary-cell">
                    {item.imagen_url ? (
                      <img src={item.imagen_url} alt={item.producto_nombre} className="thumb" />
                    ) : (
                      <div className="thumb-placeholder">👗</div>
                    )}
                    <div className="product-info-text">
                      <span className="name">{item.producto_nombre}</span>
                      <span className="sku">SKU: {item.sku}</span>
                    </div>
                  </div>
                </td>
                <td>
                  <span className="pill-talla">{item.talla}</span>
                </td>
                <td>
                  <div className="color-indicator-cell">
                    <span
                      className="color-dot"
                      style={{ backgroundColor: item.color_hex || '#CCC' }}
                    />
                    <span>{item.color_nombre}</span>
                  </div>
                </td>
                <td>{item.cantidad} ud.</td>
                <td className="price-cell">Bs {item.subtotal_estimado.toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="res-card-footer">
        <div className="footer-meta">
          <span>{reservation.total_prendas} prenda(s) apartada(s)</span>
        </div>
        <div className="footer-total">
          <span>Importe Estimado a Pagar en Tienda:</span>
          <strong>Bs {reservation.total_estimado.toFixed(2)}</strong>
        </div>
      </div>
    </article>
  );
};
