/**
 * @caso-de-uso CU15 — Consultar inventario
 * @subsistema Sucursales e Inventario
 * @capa Boundary — Frontend web
 * @responsabilidad Implementa una parte reutilizable de la interfaz de Frontend web y comunica eventos al controlador de presentación.
 * @secuencia Administrador o Encargado -> vista de inventario -> controlador de inventario -> servicio de existencias -> Inventario/Variante/Sucursal.
 */
import React, { useEffect } from 'react';
import { X, Building2, Package, Tag, Palette, Calendar, AlertCircle } from 'lucide-react';
import type { InventoryItem } from '../types/inventory.types';

interface InventoryDetailModalProps {
  item: InventoryItem | null;
  onClose: () => void;
}

export const InventoryDetailModal: React.FC<InventoryDetailModalProps> = React.memo(({
  item,
  onClose,
}) => {
  useEffect(() => {
    if (item) {
      const prev = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = prev;
      };
    }
  }, [item]);

  if (!item) return null;

  const { variante, sucursal } = item;
  const isLow = item.estado_stock === 'bajo';
  const isOut = item.estado_stock === 'agotado';

  const formattedDate = item.ultima_actualizacion
    ? new Date(item.ultima_actualizacion).toLocaleString('es-BO', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    : 'No registrada';

  return (
    <div className="inv-modal-overlay" onClick={onClose}>
      <div className="inv-modal-content" onClick={(e) => e.stopPropagation()}>
        <button
          type="button"
          className="inv-modal-close-btn"
          onClick={onClose}
          aria-label="Cerrar modal"
        >
          <X size={20} />
        </button>

        {/* Cabecera del modal */}
        <div className="inv-modal-header">
          <div className="inv-modal-branch-badge">
            <Building2 size={13} />
            <span>{sucursal.nombre} ({sucursal.ciudad})</span>
          </div>
          <h2 className="inv-modal-title">{variante.producto_nombre}</h2>
          <span className="inv-modal-sku">SKU: {variante.sku}</span>
        </div>

        {/* Cuerpo del modal */}
        <div className="inv-modal-body">
          {/* Tarjeta de atributos de la variante */}
          <div className="inv-detail-card">
            <h4>Detalle de la Variante</h4>
            <div className="inv-detail-grid">
              <div className="inv-detail-field">
                <Tag size={15} />
                <span>Talla:</span>
                <strong>{variante.talla}</strong>
              </div>
              <div className="inv-detail-field">
                <Palette size={15} />
                <span>Color:</span>
                <strong>{variante.color.nombre}</strong>
                {variante.color.codigo_hex && (
                  <span
                    className="inv-modal-swatch"
                    style={{ backgroundColor: variante.color.codigo_hex }}
                  />
                )}
              </div>
              <div className="inv-detail-field">
                <Package size={15} />
                <span>Categoría:</span>
                <strong>{variante.categoria}</strong>
              </div>
              <div className="inv-detail-field">
                <span>Precio Venta:</span>
                <strong className="inv-price-tag">Bs {variante.precio.toFixed(2)}</strong>
              </div>
            </div>
          </div>

          {/* Desglose de existencias */}
          <div className="inv-detail-card highlight">
            <h4>Balance Físico de Existencias</h4>
            <div className="inv-balance-grid">
              <div className="inv-balance-box available">
                <span className="inv-balance-label">Stock Disponible</span>
                <span className="inv-balance-num">{item.stock_disponible}</span>
                <span className="inv-balance-desc">Para venta y reservas</span>
              </div>
              <div className="inv-balance-box reserved">
                <span className="inv-balance-label">Stock Reservado</span>
                <span className="inv-balance-num">{item.stock_reservado}</span>
                <span className="inv-balance-desc">Apartado para retiro</span>
              </div>
              <div className="inv-balance-box total">
                <span className="inv-balance-label">Stock Físico Total</span>
                <span className="inv-balance-num">{item.stock_total}</span>
                <span className="inv-balance-desc">Unidades en tienda</span>
              </div>
            </div>
          </div>

          {/* Alertas y Seguridad */}
          <div className="inv-detail-card">
            <h4>Control de Reposición</h4>
            <div className="inv-safety-row">
              <div>
                <span className="inv-safety-label">Umbral de Stock Mínimo:</span>
                <strong>{item.stock_minimo} unidades</strong>
              </div>
              <div>
                <span className="inv-safety-label">Estado de Abastecimiento:</span>
                {isOut ? (
                  <span className="inv-status-pill out">🔴 Agotado</span>
                ) : isLow ? (
                  <span className="inv-status-pill low">🟡 Bajo Stock — Solicitar compra</span>
                ) : (
                  <span className="inv-status-pill ok">🟢 Abastecimiento Normal</span>
                )}
              </div>
            </div>

            {isLow && (
              <div className="inv-warning-box">
                <AlertCircle size={16} />
                <span>
                  El stock disponible ({item.stock_disponible}) es menor o igual al stock mínimo de seguridad ({item.stock_minimo}). Se recomienda generar una Orden de Compra o Movimiento de Inventario.
                </span>
              </div>
            )}
          </div>

          {/* Fecha de actualización */}
          <div className="inv-modal-footer-info">
            <Calendar size={14} />
            <span>Último movimiento registrado: {formattedDate}</span>
          </div>
        </div>
      </div>
    </div>
  );
});

InventoryDetailModal.displayName = 'InventoryDetailModal';
