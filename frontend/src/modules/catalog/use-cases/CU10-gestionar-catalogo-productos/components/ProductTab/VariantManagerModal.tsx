/**
 * @caso-de-uso CU10 — Gestionar catálogo de productos
 * @subsistema Catálogo y Proveedores
 * @capa Boundary — Frontend web
 * @responsabilidad Implementa una parte reutilizable de la interfaz de Frontend web y comunica eventos al controlador de presentación.
 * @secuencia Administrador -> administración de catálogo -> controlador de productos -> servicio de catálogo -> Producto/Variante/Categoría/Colección/Promoción.
 */
import React, { useState, useEffect } from 'react';
import { useVariantAdmin } from '../../hooks/useVariantAdmin';
import type { AdminProduct, CatalogMetadata } from '../../types/catalog-admin.types';

interface VariantManagerModalProps {
  isOpen: boolean;
  product: AdminProduct | null;
  metadata: CatalogMetadata | null;
  onClose: () => void;
  onFeedback: (type: 'success' | 'error', message: string) => void;
  onProductUpdated?: () => void;
}

export const VariantManagerModal: React.FC<VariantManagerModalProps> = ({
  isOpen,
  product,
  metadata,
  onClose,
  onFeedback,
}) => {
  const {
    variants,
    loading,
    editingVariant,
    setEditingVariant,
    handleSaveVariant,
    handleToggleStatus,
  } = useVariantAdmin(product?.id_producto || null, onFeedback);

  const [sku, setSku] = useState('');
  const [idTalla, setIdTalla] = useState<number | ''>('');
  const [idColor, setIdColor] = useState<number | ''>('');
  const [precioAdicional, setPrecioAdicional] = useState<number | ''>(0);
  const [modelo3dUrl, setModelo3dUrl] = useState('');
  const [imagenUrl, setImagenUrl] = useState('');
  const [estado, setEstado] = useState('activo');
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    if (editingVariant) {
      setSku(editingVariant.sku);
      setIdTalla(editingVariant.talla.id_talla);
      setIdColor(editingVariant.color.id_color);
      setPrecioAdicional(editingVariant.precio_adicional);
      setModelo3dUrl(editingVariant.modelo_3d_url || '');
      setImagenUrl(editingVariant.imagen_url || '');
      setEstado(editingVariant.estado);
    } else {
      // Auto-generar sugerencia de SKU si es nueva variante
      if (product) {
        const randomCode = Math.floor(100 + Math.random() * 900);
        setSku(`${product.nombre.substring(0, 3).toUpperCase()}-${randomCode}`);
      } else {
        setSku('');
      }
      setIdTalla(metadata?.sizes[0]?.id_talla || '');
      setIdColor(metadata?.colors[0]?.id_color || '');
      setPrecioAdicional(0);
      setModelo3dUrl('');
      setImagenUrl('');
      setEstado('activo');
    }
    setFormError(null);
  }, [editingVariant, product, metadata]);

  if (!isOpen || !product) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sku.trim()) {
      setFormError('El código SKU es obligatorio.');
      return;
    }
    if (!idTalla || !idColor) {
      setFormError('Debes seleccionar tanto la talla como el color.');
      return;
    }

    setSubmitting(true);
    setFormError(null);
    try {
      await handleSaveVariant({
        sku: sku.trim(),
        id_talla: Number(idTalla),
        id_color: Number(idColor),
        precio_adicional: precioAdicional === '' ? 0 : Number(precioAdicional),
        modelo_3d_url: modelo3dUrl.trim() || undefined,
        imagen_url: imagenUrl.trim() || undefined,
        estado,
      });
      // resetear formulario a modo creación
      setEditingVariant(null);
    } catch (err: any) {
      setFormError(err.response?.data?.message || 'Error al guardar la variante.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="admin-modal-backdrop" onClick={onClose}>
      <div className="admin-modal-box large" onClick={(e) => e.stopPropagation()}>
        <div className="admin-modal-header">
          <div>
            <h3>Gestión de Variantes</h3>
            <p className="modal-subtitle">
              Prenda: <strong>{product.nombre}</strong> (Precio Base: Bs {product.precio_base.toFixed(2)})
            </p>
          </div>
          <button type="button" className="close-btn" onClick={onClose}>
            ✕
          </button>
        </div>

        <div className="variant-manager-layout">
          {/* Listado de Variantes Existentes */}
          <div className="variant-list-pane">
            <div className="pane-header">
              <h4>Variantes registradas ({variants.length})</h4>
              {editingVariant && (
                <button
                  type="button"
                  className="admin-btn sm text"
                  onClick={() => setEditingVariant(null)}
                >
                  + Nueva variante
                </button>
              )}
            </div>

            {loading ? (
              <div className="pane-loading">Cargando variantes...</div>
            ) : variants.length === 0 ? (
              <div className="pane-empty">
                No hay variantes registradas. Configura combinaciones de talla y color en el formulario lateral.
              </div>
            ) : (
              <div className="variants-table-wrap">
                <table className="admin-table mini">
                  <thead>
                    <tr>
                      <th>Variante</th>
                      <th>SKU</th>
                      <th>Precio Final</th>
                      <th>Stock</th>
                      <th>Estado</th>
                      <th>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {variants.map((v) => {
                      const finalPrice = product.precio_base + v.precio_adicional;
                      const isEditing = editingVariant?.id_producto_variante === v.id_producto_variante;

                      return (
                        <tr key={v.id_producto_variante} className={isEditing ? 'row-active' : ''}>
                          <td>
                            <div className="variant-label-cell">
                              <span
                                className="color-indicator-dot"
                                style={{ backgroundColor: v.color.codigo_hex || '#000000' }}
                                title={v.color.nombre}
                              />
                              <span className="size-badge-pill">{v.talla.codigo}</span>
                              <span className="color-name-text">{v.color.nombre}</span>
                              {v.modelo_3d_url && <span className="badge-3d-mini">3D</span>}
                            </div>
                          </td>
                          <td className="font-mono">{v.sku}</td>
                          <td>
                            <strong>Bs {finalPrice.toFixed(2)}</strong>
                            {v.precio_adicional > 0 && (
                              <span className="diff-price"> (+{v.precio_adicional.toFixed(2)})</span>
                            )}
                          </td>
                          <td>
                            <span className={`stock-indicator ${(v.total_stock || 0) > 0 ? 'in-stock' : 'out-stock'}`}>
                              {v.total_stock || 0} u.
                            </span>
                          </td>
                          <td>
                            <button
                              type="button"
                              className={`status-pill-btn ${v.estado}`}
                              onClick={() => handleToggleStatus(v.id_producto_variante, v.estado)}
                            >
                              {v.estado}
                            </button>
                          </td>
                          <td>
                            <button
                              type="button"
                              className="admin-btn sm secondary"
                              onClick={() => setEditingVariant(v)}
                            >
                              Editar
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Formulario Lateral de Creación / Edición */}
          <div className="variant-form-pane">
            <h4>{editingVariant ? 'Editar Variante' : 'Agregar Variante'}</h4>
            {formError && <div className="admin-form-alert error">{formError}</div>}

            <form onSubmit={handleSubmit} className="admin-form">
              <div className="form-group">
                <label>SKU (Identificador Comercial Único) *</label>
                <input
                  type="text"
                  className="admin-input font-mono"
                  value={sku}
                  onChange={(e) => setSku(e.target.value.toUpperCase())}
                  placeholder="Ej. CAM-NEG-M-01"
                  required
                />
              </div>

              <div className="form-row-2">
                <div className="form-group">
                  <label>Talla *</label>
                  <select
                    className="admin-select"
                    value={idTalla}
                    onChange={(e) => setIdTalla(Number(e.target.value))}
                    required
                  >
                    {metadata?.sizes.map((s) => (
                      <option key={s.id_talla} value={s.id_talla}>
                        {s.codigo}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label>Color *</label>
                  <select
                    className="admin-select"
                    value={idColor}
                    onChange={(e) => setIdColor(Number(e.target.value))}
                    required
                  >
                    {metadata?.colors.map((c) => (
                      <option key={c.id_color} value={c.id_color}>
                        {c.nombre}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label>Precio Adicional de la Variante (Bs)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  className="admin-input"
                  value={precioAdicional}
                  onChange={(e) => setPrecioAdicional(e.target.value === '' ? '' : parseFloat(e.target.value))}
                  placeholder="0.00"
                />
                <span className="field-hint">
                  Precio total de la prenda: Bs{' '}
                  {(product.precio_base + (precioAdicional === '' ? 0 : Number(precioAdicional))).toFixed(2)}
                </span>
              </div>

              <div className="form-group">
                <label>URL de Imagen Específica (Opcional)</label>
                <input
                  type="url"
                  className="admin-input"
                  value={imagenUrl}
                  onChange={(e) => setImagenUrl(e.target.value)}
                  placeholder="https://..."
                />
              </div>

              <div className="form-group">
                <label>URL Modelo 3D / GLB (Vestidor Virtual CU24)</label>
                <input
                  type="url"
                  className="admin-input"
                  value={modelo3dUrl}
                  onChange={(e) => setModelo3dUrl(e.target.value)}
                  placeholder="https://.../modelo.glb"
                />
              </div>

              <div className="form-group">
                <label>Estado</label>
                <select
                  className="admin-select"
                  value={estado}
                  onChange={(e) => setEstado(e.target.value)}
                >
                  <option value="activo">Activo</option>
                  <option value="inactivo">Inactivo</option>
                </select>
              </div>

              <div className="form-actions-inline">
                {editingVariant && (
                  <button
                    type="button"
                    className="admin-btn secondary"
                    onClick={() => setEditingVariant(null)}
                  >
                    Cancelar
                  </button>
                )}
                <button type="submit" className="admin-btn primary" disabled={submitting}>
                  {submitting ? 'Guardando...' : editingVariant ? 'Actualizar' : 'Registrar Variante'}
                </button>
              </div>
            </form>
          </div>
        </div>

        <div className="admin-modal-footer">
          <button type="button" className="admin-btn secondary" onClick={onClose}>
            Listo / Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};
