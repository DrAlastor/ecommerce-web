/**
 * @caso-de-uso Módulo heredado — Gestión de devoluciones
 * @subsistema Ventas, Pagos y Compras
 * @capa Boundary — Frontend web
 * @responsabilidad Implementa una parte reutilizable de la interfaz de Frontend web y comunica eventos al controlador de presentación.
 * @secuencia Usuario autorizado -> vista de devoluciones -> controlador -> servicio de devoluciones -> Devolución/DetalleDevolución/Venta/Inventario.
 * Nota: módulo heredado; su numeración no corresponde al catálogo oficial de CU del informe.
 */
import React, { useState } from 'react';
import {
  RotateCcw,
  X,
  AlertCircle,
  CheckCircle2,
  Package,
  ShieldAlert,
  Loader2,
} from 'lucide-react';
import { returnsApi } from '../services/returns.api';
import './RequestReturnModal.css';

interface PurchaseItem {
  id_detalle_venta: number;
  cantidad: number;
  precio_unitario: number;
  subtotal: number;
  nombre_producto: string;
  sku: string;
  color?: string;
  talla?: string;
  imagen_url?: string | null;
}

interface RequestReturnModalProps {
  idVenta: number;
  codigoFactura: string;
  items: PurchaseItem[];
  onClose: () => void;
  onSuccess: () => void;
}

const MOTIVOS_COMUNES = [
  'Talla no adecuada',
  'Defecto de confección o fábrica',
  'El color o textura no coincide con la foto',
  'Cambio de preferencia',
  'Recibí un producto incorrecto',
  'Otro motivo',
];

export const RequestReturnModal: React.FC<RequestReturnModalProps> = ({
  idVenta,
  codigoFactura,
  items,
  onClose,
  onSuccess,
}) => {
  const [selectedItems, setSelectedItems] = useState<
    Record<number, { selected: boolean; cantidad: number; motivo: string }>
  >(() => {
    const initial: Record<number, { selected: boolean; cantidad: number; motivo: string }> = {};
    items.forEach((item) => {
      initial[item.id_detalle_venta] = {
        selected: false,
        cantidad: 1,
        motivo: 'Talla no adecuada',
      };
    });
    return initial;
  });

  const [motivoGeneral, setMotivoGeneral] = useState<string>('Talla no adecuada');
  const [observacion, setObservacion] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleToggleSelect = (idDetalle: number) => {
    setSelectedItems((prev) => ({
      ...prev,
      [idDetalle]: {
        ...prev[idDetalle],
        selected: !prev[idDetalle]?.selected,
      },
    }));
  };

  const handleQuantityChange = (idDetalle: number, maxQty: number, val: number) => {
    const clamped = Math.max(1, Math.min(maxQty, val));
    setSelectedItems((prev) => ({
      ...prev,
      [idDetalle]: {
        ...prev[idDetalle],
        cantidad: clamped,
      },
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const itemsToReturn = items
      .filter((it) => selectedItems[it.id_detalle_venta]?.selected)
      .map((it) => ({
        id_detalle_venta: it.id_detalle_venta,
        cantidad: selectedItems[it.id_detalle_venta].cantidad,
        motivo: selectedItems[it.id_detalle_venta].motivo || motivoGeneral,
      }));

    if (itemsToReturn.length === 0) {
      setErrorMsg('Selecciona al menos una prenda para solicitar su devolución.');
      return;
    }

    setIsSubmitting(true);

    try {
      await returnsApi.createReturn({
        id_venta: idVenta,
        motivo: motivoGeneral,
        observacion: observacion.trim() || undefined,
        items: itemsToReturn,
      });

      setSuccessMsg('Tu solicitud de devolución ha sido registrada con éxito.');
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 1500);
    } catch (err: any) {
      console.error('Error creating return request:', err);
      setErrorMsg(
        err.response?.data?.message ||
          'No se pudo registrar la solicitud de devolución. Inténtalo nuevamente.',
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="return-modal-backdrop" onClick={onClose}>
      <div className="return-modal-card" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="return-modal-header">
          <div className="return-header-badge">
            <RotateCcw size={16} />
            <span>Devolución de Compra</span>
          </div>
          <button type="button" className="btn-return-close" onClick={onClose} title="Cerrar">
            <X size={20} />
          </button>
        </div>

        <div className="return-modal-subheader">
          <h2>Solicitar Devolución</h2>
          <p>
            Venta <strong>{codigoFactura}</strong>. Selecciona las prendas que deseas devolver y el
            motivo correspondiente.
          </p>
        </div>

        {errorMsg && (
          <div className="return-alert-error">
            <AlertCircle size={18} />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="return-alert-success">
            <CheckCircle2 size={18} />
            <span>{successMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="return-modal-form">
          {/* Motivo Principal */}
          <div className="return-form-group">
            <label className="return-field-label">Motivo principal de devolución</label>
            <select
              className="return-select-input"
              value={motivoGeneral}
              onChange={(e) => setMotivoGeneral(e.target.value)}
            >
              {MOTIVOS_COMUNES.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </div>

          {/* Lista de productos */}
          <div className="return-items-selection-group">
            <label className="return-field-label">
              Prendas de la compra ({items.length})
            </label>
            <div className="return-items-list">
              {items.map((item) => {
                const isChecked = !!selectedItems[item.id_detalle_venta]?.selected;
                const qty = selectedItems[item.id_detalle_venta]?.cantidad || 1;

                return (
                  <div
                    key={item.id_detalle_venta}
                    className={`return-item-row ${isChecked ? 'selected' : ''}`}
                    onClick={() => handleToggleSelect(item.id_detalle_venta)}
                  >
                    <div className="return-item-checkbox">
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => {}} // Manejado por onClick de fila
                      />
                    </div>

                    <div className="return-item-thumb">
                      {item.imagen_url ? (
                        <img src={item.imagen_url} alt={item.nombre_producto} />
                      ) : (
                        <Package size={20} className="thumb-fallback" />
                      )}
                    </div>

                    <div className="return-item-info">
                      <h4 className="return-item-title">{item.nombre_producto}</h4>
                      <div className="return-item-tags">
                        {item.talla && <span className="item-tag">Talla: {item.talla}</span>}
                        {item.color && <span className="item-tag">Color: {item.color}</span>}
                        <span className="item-tag sku">SKU: {item.sku}</span>
                      </div>
                      <span className="return-item-price">
                        Bs. {Number(item.precio_unitario).toFixed(2)} c/u (Compradas: {item.cantidad})
                      </span>
                    </div>

                    {isChecked && (
                      <div
                        className="return-item-qty-picker"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <label>Cant. a devolver:</label>
                        <div className="qty-controls">
                          <button
                            type="button"
                            className="btn-qty"
                            disabled={qty <= 1}
                            onClick={() =>
                              handleQuantityChange(item.id_detalle_venta, item.cantidad, qty - 1)
                            }
                          >
                            -
                          </button>
                          <span className="qty-value">{qty}</span>
                          <button
                            type="button"
                            className="btn-qty"
                            disabled={qty >= item.cantidad}
                            onClick={() =>
                              handleQuantityChange(item.id_detalle_venta, item.cantidad, qty + 1)
                            }
                          >
                            +
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Observaciones */}
          <div className="return-form-group">
            <label className="return-field-label">Comentarios u observaciones adicionales</label>
            <textarea
              className="return-textarea-input"
              rows={3}
              placeholder="Explica brevemente el estado de la prenda o el motivo del cambio..."
              value={observacion}
              onChange={(e) => setObservacion(e.target.value)}
            />
          </div>

          {/* Aviso de Política */}
          <div className="return-policy-notice">
            <ShieldAlert size={18} />
            <p>
              Las devoluciones se reciben sin costo en cualquiera de nuestras boutiques Dressly. Las
              prendas deben conservar sus etiquetas originales y no presentar signos de uso.
            </p>
          </div>

          {/* Acciones */}
          <div className="return-modal-actions">
            <button
              type="button"
              className="btn-return-cancel"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="btn-return-submit"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  <span>Enviando solicitud...</span>
                </>
              ) : (
                <span>Confirmar Solicitud de Devolución</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
