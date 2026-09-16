import React from 'react';
import {
  Calendar,
  Package,
  Store,
  Tag,
  UserCheck,
  X,
} from 'lucide-react';
import type { MovementItem } from '../types/movements.types';

interface MovementDetailModalProps {
  isOpen: boolean;
  item: MovementItem | null;
  onClose: () => void;
}

export const MovementDetailModal: React.FC<MovementDetailModalProps> = ({
  isOpen,
  item,
  onClose,
}) => {
  if (!isOpen || !item) return null;

  const formatFecha = (iso: string) => {
    try {
      const d = new Date(iso);
      return new Intl.DateTimeFormat('es-BO', {
        dateStyle: 'full',
        timeStyle: 'medium',
      }).format(d);
    } catch {
      return iso;
    }
  };

  const isPositive =
    item.tipo_movimiento === 'entrada' || item.tipo_movimiento === 'devolucion';
  const isNegative =
    item.tipo_movimiento === 'salida' || item.tipo_movimiento === 'salida_venta';

  return (
    <div className="movement-modal-backdrop" onClick={onClose}>
      <div
        className="movement-modal-container detail-modal-size"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        <div className="movement-modal-header">
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: 4 }}>
              <span className="movement-id-tag">
                Movimiento #{item.id_movimiento}
              </span>
              <span
                className={`movement-type-badge ${
                  isPositive
                    ? 'badge-type-entrada'
                    : isNegative
                    ? 'badge-type-salida'
                    : 'badge-type-ajuste'
                }`}
              >
                {item.tipo_movimiento.toUpperCase()}
              </span>
            </div>
            <h2 className="modal-title">{item.producto.nombre}</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="btn-modal-close"
            title="Cerrar detalle"
          >
            <X size={20} />
          </button>
        </div>

        <div className="movement-detail-body">
          {/* Card de Cantidad y Fecha */}
          <div className="detail-highlight-card">
            <div className="highlight-qty">
              <span className="highlight-label">Variación de Stock</span>
              <span
                className={`highlight-number ${
                  isPositive
                    ? 'text-emerald'
                    : isNegative
                    ? 'text-rose'
                    : 'text-amber'
                }`}
              >
                {isPositive ? `+${item.cantidad}` : isNegative ? `-${item.cantidad}` : item.cantidad}
                <span className="highlight-unit">unidades</span>
              </span>
            </div>

            <div className="highlight-date">
              <span className="highlight-label">
                <Calendar size={13} style={{ display: 'inline', marginRight: 4 }} />
                Registro cronológico
              </span>
              <span className="highlight-time">{formatFecha(item.fecha)}</span>
            </div>
          </div>

          {/* Información de la Prenda y Variante */}
          <div className="detail-section">
            <h4 className="detail-section-title">
              <Package size={15} />
              Datos de la Variante
            </h4>
            <div className="detail-info-grid">
              <div className="info-item">
                <span className="info-label">SKU de inventario</span>
                <span className="info-value font-mono">{item.variante.sku}</span>
              </div>
              <div className="info-item">
                <span className="info-label">Talla</span>
                <span className="info-value">{item.variante.talla}</span>
              </div>
              <div className="info-item">
                <span className="info-label">Color</span>
                <span className="info-value">
                  {item.variante.color_hex && (
                    <span
                      className="color-swatch-sm"
                      style={{ backgroundColor: item.variante.color_hex }}
                    />
                  )}
                  {item.variante.color}
                </span>
              </div>
              <div className="info-item">
                <span className="info-label">Precio base</span>
                <span className="info-value">Bs {item.producto.precio_base.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Información de la Sucursal */}
          <div className="detail-section">
            <h4 className="detail-section-title">
              <Store size={15} />
              Ubicación Física
            </h4>
            <div className="detail-info-grid">
              <div className="info-item">
                <span className="info-label">Sucursal</span>
                <span className="info-value">{item.sucursal.nombre}</span>
              </div>
              <div className="info-item">
                <span className="info-label">Ciudad</span>
                <span className="info-value">{item.sucursal.ciudad || 'No especificada'}</span>
              </div>
            </div>
          </div>

          {/* Información del Responsable */}
          <div className="detail-section">
            <h4 className="detail-section-title">
              <UserCheck size={15} />
              Auditoría y Responsable
            </h4>
            <div className="detail-info-grid">
              <div className="info-item">
                <span className="info-label">Empleado responsable</span>
                <span className="info-value font-semibold">
                  {item.responsable.nombre_completo}
                </span>
              </div>
              <div className="info-item">
                <span className="info-label">Código de empleado</span>
                <span className="info-value font-mono">{item.responsable.codigo}</span>
              </div>
            </div>
          </div>

          {/* Motivo registrado */}
          <div className="detail-section">
            <h4 className="detail-section-title">
              <Tag size={15} />
              Motivo u Observación
            </h4>
            <div className="detail-motivo-box">
              <p>{item.motivo}</p>
            </div>
          </div>
        </div>

        <div className="modal-actions-footer">
          <button type="button" onClick={onClose} className="btn-close-detail">
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};
