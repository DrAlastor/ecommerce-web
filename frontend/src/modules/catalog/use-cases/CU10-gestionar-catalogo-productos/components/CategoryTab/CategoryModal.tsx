import React, { useState, useEffect } from 'react';
import type { AdminCategory } from '../../types/catalog-admin.types';

interface CategoryModalProps {
  isOpen: boolean;
  category: AdminCategory | null;
  allCategories: AdminCategory[];
  onClose: () => void;
  onSubmit: (data: any) => Promise<void>;
}

export const CategoryModal: React.FC<CategoryModalProps> = ({
  isOpen,
  category,
  allCategories,
  onClose,
  onSubmit,
}) => {
  const [nombre, setNombre] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [idCategoriaPadre, setIdCategoriaPadre] = useState<number | ''>('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (category) {
      setNombre(category.nombre);
      setDescripcion(category.descripcion || '');
      setIdCategoriaPadre(category.id_categoria_padre || '');
    } else {
      setNombre('');
      setDescripcion('');
      setIdCategoriaPadre('');
    }
    setError(null);
  }, [category, isOpen]);

  if (!isOpen) return null;

  // Filtrar para no permitir seleccionarse a sí misma como padre
  const availableParents = allCategories.filter(
    (c) => !category || c.id_categoria !== category.id_categoria,
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombre.trim()) {
      setError('El nombre de la categoría es obligatorio.');
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      await onSubmit({
        nombre: nombre.trim(),
        descripcion: descripcion.trim() || undefined,
        id_categoria_padre: idCategoriaPadre !== '' ? Number(idCategoriaPadre) : undefined,
      });
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al guardar la categoría.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="admin-modal-backdrop" onClick={onClose}>
      <div className="admin-modal-box" onClick={(e) => e.stopPropagation()}>
        <div className="admin-modal-header">
          <h3>{category ? 'Editar Categoría' : 'Nueva Categoría'}</h3>
          <button type="button" className="close-btn" onClick={onClose}>
            ✕
          </button>
        </div>

        {error && <div className="admin-form-alert error">{error}</div>}

        <form onSubmit={handleSubmit} className="admin-form">
          <div className="form-group">
            <label>Nombre de la Categoría *</label>
            <input
              type="text"
              className="admin-input"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              placeholder="Ej. Ropa, Calzado, Camisetas..."
              required
            />
          </div>

          <div className="form-group">
            <label>Descripción</label>
            <textarea
              className="admin-textarea"
              rows={3}
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
              placeholder="Breve descripción o alcance de la categoría..."
            />
          </div>

          <div className="form-group">
            <label>Categoría Padre (Para subcategorías jerárquicas)</label>
            <select
              className="admin-select"
              value={idCategoriaPadre}
              onChange={(e) =>
                setIdCategoriaPadre(e.target.value === '' ? '' : Number(e.target.value))
              }
            >
              <option value="">Ninguna (Categoría Principal Raíz)</option>
              {availableParents.map((c) => (
                <option key={c.id_categoria} value={c.id_categoria}>
                  {c.categoria_padre_nombre ? `${c.categoria_padre_nombre} → ` : ''}
                  {c.nombre}
                </option>
              ))}
            </select>
          </div>

          <div className="admin-modal-footer">
            <button type="button" className="admin-btn secondary" onClick={onClose} disabled={submitting}>
              Cancelar
            </button>
            <button type="submit" className="admin-btn primary" disabled={submitting}>
              {submitting ? 'Guardando...' : category ? 'Guardar Cambios' : 'Crear Categoría'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
