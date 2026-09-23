/**
 * @caso-de-uso CU16 — Gestionar movimientos de inventario
 * @subsistema Sucursales e Inventario
 * @capa Boundary — Frontend web
 * @responsabilidad Implementa una parte reutilizable de la interfaz de Frontend web y comunica eventos al controlador de presentación.
 * @secuencia Administrador o Encargado -> formulario de movimiento -> controlador de inventario -> servicio transaccional -> MovimientoInventario/Inventario/Variante/Sucursal.
 */
import React, { useMemo, useState } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  Package,
  Store,
  X,
} from 'lucide-react';
import type {
  CreateMovementPayload,
  MovementMetadata,
  VariantStockInfo,
} from '../types/movements.types';

interface CreateMovementModalProps {
  isOpen: boolean;
  metadata: MovementMetadata;
  submitting: boolean;
  onClose: () => void;
  onSubmit: (payload: CreateMovementPayload) => Promise<{ success: boolean; message: string }>;
}

export const CreateMovementModal: React.FC<CreateMovementModalProps> = ({
  isOpen,
  metadata,
  submitting,
  onClose,
  onSubmit,
}) => {
  const [idSucursal, setIdSucursal] = useState<number>(
    metadata.sucursales[0]?.id_sucursal || 1,
  );
  const [variantSearch, setVariantSearch] = useState<string>('');
  const [selectedVariantId, setSelectedVariantId] = useState<number | ''>('');
  const [tipoMovimiento, setTipoMovimiento] = useState<
    'entrada' | 'salida' | 'ajuste' | 'devolucion'
  >('entrada');
  const [cantidad, setCantidad] = useState<number>(1);
  const [motivo, setMotivo] = useState<string>('');
  const [formError, setFormError] = useState<string | null>(null);

  // Filtrar variantes por búsqueda de texto
  const filteredVariants = useMemo(() => {
    if (!variantSearch.trim()) return metadata.variantes.slice(0, 30);
    const s = variantSearch.toLowerCase().trim();
    return metadata.variantes
      .filter(
        (v) =>
          v.producto_nombre.toLowerCase().includes(s) ||
          v.sku.toLowerCase().includes(s) ||
          v.talla.toLowerCase().includes(s) ||
          v.color.toLowerCase().includes(s),
      )
      .slice(0, 30);
  }, [metadata.variantes, variantSearch]);

  // Obtener información de la variante actualmente seleccionada
  const selectedVariant: VariantStockInfo | undefined = useMemo(() => {
    if (!selectedVariantId) return undefined;
    return metadata.variantes.find(
      (v) => v.id_producto_variante === Number(selectedVariantId),
    );
  }, [metadata.variantes, selectedVariantId]);

  // Stock actual en la sucursal seleccionada
  const currentStockInfo = useMemo(() => {
    if (!selectedVariant || !idSucursal) {
      return { stock_disponible: 0, stock_reservado: 0, stock_minimo: 0 };
    }
    return (
      selectedVariant.stocks_por_sucursal[idSucursal] || {
        stock_disponible: 0,
        stock_reservado: 0,
        stock_minimo: 0,
      }
    );
  }, [selectedVariant, idSucursal]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!selectedVariantId) {
      setFormError('Debes seleccionar una variante de producto.');
      return;
    }

    if (!idSucursal) {
      setFormError('Debes seleccionar una sucursal.');
      return;
    }

    if (cantidad <= 0) {
      setFormError('La cantidad debe ser mayor a 0.');
      return;
    }

    if (
      tipoMovimiento === 'salida' &&
      cantidad > currentStockInfo.stock_disponible
    ) {
      setFormError(
        `Stock insuficiente: solo hay ${currentStockInfo.stock_disponible} unidad(es) disponibles para salida.`,
      );
      return;
    }

    if (!motivo.trim() || motivo.trim().length < 3) {
      setFormError('El motivo debe tener al menos 3 caracteres descriptivos.');
      return;
    }

    const res = await onSubmit({
      tipo_movimiento: tipoMovimiento,
      cantidad: Number(cantidad),
      id_producto_variante: Number(selectedVariantId),
      id_sucursal: Number(idSucursal),
      motivo: motivo.trim(),
    });

    if (!res.success) {
      setFormError(res.message);
    }
  };

  const quickReasons: Record<string, string[]> = {
    entrada: [
      'Reposición regular de mercadería',
      'Ingreso por compra directa a proveedor',
      'Transferencia física recibida',
    ],
    salida: [
      'Baja por prenda con defecto o manchada',
      'Merma en tienda física',
      'Retiro para muestra comercial',
    ],
    ajuste: [
      'Ajuste por conteo físico periódico',
      'Corrección de descuadre de inventario',
      'Regularización de existencias',
    ],
    devolucion: [
      'Devolución de cliente en boutique',
      'Cambio de prenda por modelo',
      'Reingreso de prenda apta para la venta',
    ],
  };

  return (
    <div className="movement-modal-backdrop" onClick={onClose}>
      <div
        className="movement-modal-container"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        <div className="movement-modal-header">
          <div>
            <h2 className="modal-title">Registrar Movimiento de Inventario</h2>
            <p className="modal-subtitle">
              Los cambios actualizarán inmediatamente las existencias disponibles de la sucursal.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="btn-modal-close"
            title="Cerrar ventana"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="movement-form">
          {formError && (
            <div className="form-alert-error">
              <AlertCircle size={18} />
              <span>{formError}</span>
            </div>
          )}

          <div className="form-row-two-cols">
            {/* 1. Sucursal */}
            <div className="form-field-group">
              <label htmlFor="modal-sucursal">
                <Store size={15} style={{ display: 'inline', marginRight: 4 }} />
                Sucursal destino
              </label>
              <select
                id="modal-sucursal"
                value={idSucursal}
                onChange={(e) => setIdSucursal(Number(e.target.value))}
                required
              >
                {metadata.sucursales.map((s) => (
                  <option key={s.id_sucursal} value={s.id_sucursal}>
                    {s.nombre} {s.ciudad ? `(${s.ciudad})` : ''}
                  </option>
                ))}
              </select>
            </div>

            {/* 2. Tipo de Movimiento */}
            <div className="form-field-group">
              <label htmlFor="modal-tipo">Tipo de Movimiento</label>
              <select
                id="modal-tipo"
                value={tipoMovimiento}
                onChange={(e: any) => setTipoMovimiento(e.target.value)}
                required
              >
                <option value="entrada">🟢 Entrada (Ingreso de existencias)</option>
                <option value="salida">🔴 Salida (Baja o retiro físico)</option>
                <option value="ajuste">🟠 Ajuste (Conteo o regularización)</option>
                <option value="devolucion">🔵 Devolución (Reingreso de prenda)</option>
              </select>
            </div>
          </div>

          {/* 3. Selección de Variante */}
          <div className="form-field-group">
            <label htmlFor="modal-variante-search">
              <Package size={15} style={{ display: 'inline', marginRight: 4 }} />
              Prenda y Variante
            </label>
            <input
              id="modal-variante-search"
              type="text"
              placeholder="Escribe para buscar prenda por nombre o SKU..."
              value={variantSearch}
              onChange={(e) => setVariantSearch(e.target.value)}
              className="variant-search-input"
            />

            <select
              id="modal-variante-select"
              value={selectedVariantId}
              onChange={(e) => setSelectedVariantId(Number(e.target.value))}
              required
              className="variant-dropdown-select"
            >
              <option value="">-- Selecciona una prenda/variante ({filteredVariants.length} opciones) --</option>
              {filteredVariants.map((v) => (
                <option key={v.id_producto_variante} value={v.id_producto_variante}>
                  {v.producto_nombre} — Talla: {v.talla} | Color: {v.color} (SKU: {v.sku})
                </option>
              ))}
            </select>
          </div>

          {/* Callout de Stock en Vivo */}
          {selectedVariant && (
            <div className="live-stock-preview">
              <div className="preview-header">
                <span className="preview-product-title">
                  {selectedVariant.producto_nombre}
                </span>
                <span className="preview-sku">SKU: {selectedVariant.sku}</span>
              </div>

              <div className="stock-badges-row">
                <div className="stock-metric-pill pill-available">
                  <span className="pill-label">Stock Disponible Actual</span>
                  <span className="pill-val">{currentStockInfo.stock_disponible}</span>
                </div>
                <div className="stock-metric-pill pill-reserved">
                  <span className="pill-label">Reservado</span>
                  <span className="pill-val">{currentStockInfo.stock_reservado}</span>
                </div>
                <div className="stock-metric-pill pill-min">
                  <span className="pill-label">Stock Mínimo</span>
                  <span className="pill-val">{currentStockInfo.stock_minimo}</span>
                </div>
              </div>
            </div>
          )}

          {/* 4. Cantidad */}
          <div className="form-row-two-cols">
            <div className="form-field-group">
              <label htmlFor="modal-cantidad">Cantidad a mover</label>
              <input
                id="modal-cantidad"
                type="number"
                min="1"
                step="1"
                value={cantidad}
                onChange={(e) => setCantidad(Math.max(1, parseInt(e.target.value, 10) || 1))}
                required
              />
              {tipoMovimiento === 'salida' && selectedVariant && (
                <span
                  className={`field-hint ${
                    cantidad > currentStockInfo.stock_disponible
                      ? 'hint-danger'
                      : 'hint-ok'
                  }`}
                >
                  {cantidad > currentStockInfo.stock_disponible
                    ? `⚠️ Excede el disponible (${currentStockInfo.stock_disponible})`
                    : `Quedarán ${currentStockInfo.stock_disponible - cantidad} unidades.`}
                </span>
              )}
            </div>

            {/* Sugerencias Rápidas de Motivo */}
            <div className="form-field-group">
              <label>Sugerencias de motivo</label>
              <div className="quick-reasons-list">
                {quickReasons[tipoMovimiento]?.map((r, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setMotivo(r)}
                    className="btn-quick-reason"
                  >
                    {r}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* 5. Motivo detallado */}
          <div className="form-field-group">
            <label htmlFor="modal-motivo">Motivo u observación del movimiento</label>
            <textarea
              id="modal-motivo"
              rows={2}
              placeholder="Explica la razón del movimiento para el registro de auditoría..."
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
              required
            />
          </div>

          {/* Botones de acción */}
          <div className="modal-actions-footer">
            <button
              type="button"
              onClick={onClose}
              className="btn-cancel-action"
              disabled={submitting}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="btn-submit-action"
              disabled={submitting}
            >
              {submitting ? (
                <>
                  <div className="spinner-loader-sm" />
                  <span>Procesando...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 size={16} />
                  <span>Confirmar Movimiento</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
