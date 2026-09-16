import React, { useState, useEffect } from 'react';
import type { AdminProduct, CatalogMetadata } from '../../types/catalog-admin.types';

interface ProductModalProps {
  isOpen: boolean;
  product: AdminProduct | null;
  metadata: CatalogMetadata | null;
  onClose: () => void;
  onSubmit: (data: any) => Promise<void>;
}

export const ProductModal: React.FC<ProductModalProps> = ({
  isOpen,
  product,
  metadata,
  onClose,
  onSubmit,
}) => {
  const [nombre, setNombre] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [precioBase, setPrecioBase] = useState<number | ''>('');
  const [genero, setGenero] = useState('Unisex');
  const [idCategoria, setIdCategoria] = useState<number | ''>('');
  const [idColeccion, setIdColeccion] = useState<number | ''>('');
  const [estado, setEstado] = useState('activo');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (product) {
      setNombre(product.nombre);
      setDescripcion(product.descripcion || '');
      setPrecioBase(product.precio_base);
      setGenero(product.genero || 'Unisex');
      setIdCategoria(product.categoria.id_categoria);
      setIdColeccion(product.coleccion?.id_coleccion || '');
      setEstado(product.estado);
    } else {
      setNombre('');
      setDescripcion('');
      setPrecioBase('');
      setGenero('Unisex');
      setIdCategoria(metadata?.categories[0]?.id_categoria || '');
      setIdColeccion('');
      setEstado('activo');
    }
    setError(null);
  }, [product, metadata, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombre.trim()) {
      setError('El nombre de la prenda es obligatorio.');
      return;
    }
    if (precioBase === '' || Number(precioBase) < 0) {
      setError('El precio base debe ser un número válido mayor o igual a 0.');
      return;
    }
    if (!idCategoria) {
      setError('Debes seleccionar una categoría.');
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      await onSubmit({
        nombre: nombre.trim(),
        descripcion: descripcion.trim() || undefined,
        precio_base: Number(precioBase),
        genero,
        id_categoria: Number(idCategoria),
        id_coleccion: idColeccion !== '' ? Number(idColeccion) : undefined,
        estado,
      });
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al guardar la prenda.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="admin-modal-backdrop" onClick={onClose}>
      <div className="admin-modal-box" onClick={(e) => e.stopPropagation()}>
        <div className="admin-modal-header">
          <h3>{product ? 'Editar Prenda' : 'Nueva Prenda de Catálogo'}</h3>
          <button type="button" className="close-btn" onClick={onClose}>
            ✕
          </button>
        </div>

        {error && <div className="admin-form-alert error">{error}</div>}

        <form onSubmit={handleSubmit} className="admin-form">
          <div className="form-group">
            <label>Nombre de la prenda *</label>
            <input
              type="text"
              className="admin-input"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              placeholder="Ej. Camiseta Básica Slim Fit"
              required
            />
          </div>

          <div className="form-group">
            <label>Descripción comercial</label>
            <textarea
              className="admin-textarea"
              rows={3}
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
              placeholder="Detalles sobre materiales, corte, estilo..."
            />
          </div>

          <div className="form-row-2">
            <div className="form-group">
              <label>Precio base (Bs) *</label>
              <input
                type="number"
                step="0.01"
                min="0"
                className="admin-input"
                value={precioBase}
                onChange={(e) => setPrecioBase(e.target.value === '' ? '' : parseFloat(e.target.value))}
                placeholder="0.00"
                required
              />
            </div>
            <div className="form-group">
              <label>Género / Público</label>
              <select
                className="admin-select"
                value={genero}
                onChange={(e) => setGenero(e.target.value)}
              >
                <option value="Hombre">Hombre</option>
                <option value="Mujer">Mujer</option>
                <option value="Unisex">Unisex</option>
                <option value="Niños">Niños</option>
              </select>
            </div>
          </div>

          <div className="form-row-2">
            <div className="form-group">
              <label>Categoría *</label>
              <select
                className="admin-select"
                value={idCategoria}
                onChange={(e) => setIdCategoria(Number(e.target.value))}
                required
              >
                <option value="" disabled>
                  Selecciona una categoría...
                </option>
                {metadata?.categories.map((c) => (
                  <option key={c.id_categoria} value={c.id_categoria}>
                    {c.nombre}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>Colección (Opcional)</label>
              <select
                className="admin-select"
                value={idColeccion}
                onChange={(e) => setIdColeccion(e.target.value === '' ? '' : Number(e.target.value))}
              >
                <option value="">Sin colección asignada</option>
                {metadata?.collections.map((col) => (
                  <option key={col.id_coleccion} value={col.id_coleccion}>
                    {col.nombre} {col.temporada?.nombre ? `(${col.temporada.nombre})` : ''}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-group">
            <label>Estado de publicación</label>
            <select
              className="admin-select"
              value={estado}
              onChange={(e) => setEstado(e.target.value)}
            >
              <option value="activo">Activo (Visible en catálogo comercial)</option>
              <option value="inactivo">Inactivo (Oculto del público)</option>
            </select>
          </div>

          <div className="admin-modal-footer">
            <button type="button" className="admin-btn secondary" onClick={onClose} disabled={submitting}>
              Cancelar
            </button>
            <button type="submit" className="admin-btn primary" disabled={submitting}>
              {submitting ? 'Guardando...' : product ? 'Guardar Cambios' : 'Crear Prenda'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
