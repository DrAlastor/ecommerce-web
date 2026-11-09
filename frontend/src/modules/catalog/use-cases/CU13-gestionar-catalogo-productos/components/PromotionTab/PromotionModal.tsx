/**
 * @caso-de-uso CU10 — Gestionar catálogo de productos
 * @subsistema Catálogo y Proveedores
 * @capa Boundary — Frontend web
 * @responsabilidad Implementa una parte reutilizable de la interfaz de Frontend web y comunica eventos al controlador de presentación.
 * @secuencia Administrador -> administración de catálogo -> controlador de productos -> servicio de catálogo -> Producto/Variante/Categoría/Colección/Promoción.
 */
import React, { useState, useEffect } from 'react';
import type { AdminPromotion, AdminProduct } from '../../types/catalog-admin.types';

interface PromotionModalProps {
  isOpen: boolean;
  promotion: AdminPromotion | null;
  products: AdminProduct[];
  onClose: () => void;
  onSubmit: (data: any) => Promise<void>;
}

export const PromotionModal: React.FC<PromotionModalProps> = ({
  isOpen,
  promotion,
  products,
  onClose,
  onSubmit,
}) => {
  const [nombre, setNombre] = useState('');
  const [tipoDescuento, setTipoDescuento] = useState<'porcentaje' | 'monto_fijo'>('porcentaje');
  const [valorDescuento, setValorDescuento] = useState<number | ''>(15);
  const [fechaInicio, setFechaInicio] = useState('');
  const [fechaFin, setFechaFin] = useState('');
  const [limiteUsos, setLimiteUsos] = useState<number | ''>('');
  const [estado, setEstado] = useState('activo');
  const [selectedProductIds, setSelectedProductIds] = useState<number[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (promotion) {
      setNombre(promotion.nombre);
      setTipoDescuento(promotion.tipo_descuento);
      setValorDescuento(promotion.valor_descuento);
      setFechaInicio(promotion.fecha_inicio.substring(0, 10));
      setFechaFin(promotion.fecha_fin.substring(0, 10));
      setLimiteUsos(promotion.limite_usos || '');
      setEstado(promotion.estado);
      setSelectedProductIds(promotion.productos_asociados?.map((p) => p.id_producto) || []);
    } else {
      setNombre('');
      setTipoDescuento('porcentaje');
      setValorDescuento(15);
      setFechaInicio(new Date().toISOString().substring(0, 10));
      setFechaFin(new Date(Date.now() + 30 * 86400000).toISOString().substring(0, 10));
      setLimiteUsos('');
      setEstado('activo');
      setSelectedProductIds([]);
    }
    setError(null);
  }, [promotion, isOpen]);

  if (!isOpen) return null;

  const toggleProductSelection = (id: number) => {
    setSelectedProductIds((prev) =>
      prev.includes(id) ? prev.filter((pId) => pId !== id) : [...prev, id],
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombre.trim()) {
      setError('El nombre de la promoción es obligatorio.');
      return;
    }
    if (valorDescuento === '' || Number(valorDescuento) <= 0) {
      setError('El valor de descuento debe ser mayor a 0.');
      return;
    }
    if (tipoDescuento === 'porcentaje' && Number(valorDescuento) > 100) {
      setError('El descuento en porcentaje no puede superar el 100%.');
      return;
    }
    if (!fechaInicio || !fechaFin || new Date(fechaInicio) > new Date(fechaFin)) {
      setError('Las fechas de vigencia son inválidas.');
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      await onSubmit({
        nombre: nombre.trim(),
        tipo_descuento: tipoDescuento,
        valor_descuento: Number(valorDescuento),
        fecha_inicio: fechaInicio,
        fecha_fin: fechaFin,
        limite_usos: limiteUsos !== '' ? Number(limiteUsos) : undefined,
        estado,
        product_ids: selectedProductIds,
      });
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al guardar la promoción.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="admin-modal-backdrop" onClick={onClose}>
      <div className="admin-modal-box large" onClick={(e) => e.stopPropagation()}>
        <div className="admin-modal-header">
          <h3>{promotion ? 'Editar Promoción' : 'Nueva Promoción Comercial'}</h3>
          <button type="button" className="close-btn" onClick={onClose}>
            ✕
          </button>
        </div>

        {error && <div className="admin-form-alert error">{error}</div>}

        <form onSubmit={handleSubmit} className="admin-form">
          <div className="form-group">
            <label>Nombre de la Promoción *</label>
            <input
              type="text"
              className="admin-input"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              placeholder="Ej. Descuento de Temporada, Cyber Fashion 2026..."
              required
            />
          </div>

          <div className="form-row-2">
            <div className="form-group">
              <label>Tipo de Descuento *</label>
              <select
                className="admin-select"
                value={tipoDescuento}
                onChange={(e) => setTipoDescuento(e.target.value as any)}
              >
                <option value="porcentaje">Porcentaje (%)</option>
                <option value="monto_fijo">Monto Fijo (Bs)</option>
              </select>
            </div>

            <div className="form-group">
              <label>
                Valor del Descuento ({tipoDescuento === 'porcentaje' ? '%' : 'Bs'}) *
              </label>
              <input
                type="number"
                step="0.01"
                min="0.01"
                max={tipoDescuento === 'porcentaje' ? 100 : undefined}
                className="admin-input"
                value={valorDescuento}
                onChange={(e) =>
                  setValorDescuento(e.target.value === '' ? '' : parseFloat(e.target.value))
                }
                required
              />
            </div>
          </div>

          <div className="form-row-2">
            <div className="form-group">
              <label>Fecha de Inicio *</label>
              <input
                type="date"
                className="admin-input"
                value={fechaInicio}
                onChange={(e) => setFechaInicio(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label>Fecha de Finalización *</label>
              <input
                type="date"
                className="admin-input"
                value={fechaFin}
                onChange={(e) => setFechaFin(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="form-row-2">
            <div className="form-group">
              <label>Límite de Usos (Opcional)</label>
              <input
                type="number"
                min="1"
                className="admin-input"
                value={limiteUsos}
                onChange={(e) => setLimiteUsos(e.target.value === '' ? '' : parseInt(e.target.value, 10))}
                placeholder="Sin límite si se deja vacío"
              />
            </div>

            <div className="form-group">
              <label>Estado</label>
              <select
                className="admin-select"
                value={estado}
                onChange={(e) => setEstado(e.target.value)}
              >
                <option value="activo">Activa</option>
                <option value="inactivo">Inactiva</option>
              </select>
            </div>
          </div>

          {/* Selector de Prendas Asociadas */}
          <div className="form-group">
            <label>
              Prendas que aplican a la promoción ({selectedProductIds.length} seleccionadas)
            </label>
            <div className="promo-products-selector">
              {products.map((p) => {
                const isSelected = selectedProductIds.includes(p.id_producto);
                return (
                  <button
                    key={p.id_producto}
                    type="button"
                    className={`product-select-chip ${isSelected ? 'selected' : ''}`}
                    onClick={() => toggleProductSelection(p.id_producto)}
                  >
                    <span className="check-box">{isSelected ? '✓' : '+'}</span>
                    <span className="chip-name">{p.nombre}</span>
                    <span className="chip-price">Bs {p.precio_base.toFixed(2)}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="admin-modal-footer">
            <button type="button" className="admin-btn secondary" onClick={onClose} disabled={submitting}>
              Cancelar
            </button>
            <button type="submit" className="admin-btn primary" disabled={submitting}>
              {submitting ? 'Guardando...' : promotion ? 'Guardar Cambios' : 'Crear Promoción'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
