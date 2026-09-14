import React, { useState, useEffect } from 'react';
import type { AdminCollection, AdminSeason } from '../../types/catalog-admin.types';

interface CollectionModalProps {
  isOpen: boolean;
  collection: AdminCollection | null;
  seasons: AdminSeason[];
  onClose: () => void;
  onSubmit: (data: any) => Promise<void>;
}

export const CollectionModal: React.FC<CollectionModalProps> = ({
  isOpen,
  collection,
  seasons,
  onClose,
  onSubmit,
}) => {
  const [nombre, setNombre] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [idTemporada, setIdTemporada] = useState<number | ''>('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (collection) {
      setNombre(collection.nombre);
      setDescripcion(collection.descripcion || '');
      setIdTemporada(collection.id_temporada || '');
    } else {
      setNombre('');
      setDescripcion('');
      setIdTemporada(seasons[0]?.id_temporada || '');
    }
    setError(null);
  }, [collection, seasons, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombre.trim()) {
      setError('El nombre de la colección es obligatorio.');
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      await onSubmit({
        nombre: nombre.trim(),
        descripcion: descripcion.trim() || undefined,
        id_temporada: idTemporada !== '' ? Number(idTemporada) : undefined,
      });
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al guardar la colección.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="admin-modal-backdrop" onClick={onClose}>
      <div className="admin-modal-box sm" onClick={(e) => e.stopPropagation()}>
        <div className="admin-modal-header">
          <h3>{collection ? 'Editar Colección' : 'Nueva Colección'}</h3>
          <button type="button" className="close-btn" onClick={onClose}>
            ✕
          </button>
        </div>

        {error && <div className="admin-form-alert error">{error}</div>}

        <form onSubmit={handleSubmit} className="admin-form">
          <div className="form-group">
            <label>Nombre de la Colección *</label>
            <input
              type="text"
              className="admin-input"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              placeholder="Ej. Minimalist Linen, Urban Denim..."
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
              placeholder="Inspiración, tejidos, concepto..."
            />
          </div>

          <div className="form-group">
            <label>Temporada Asociada</label>
            <select
              className="admin-select"
              value={idTemporada}
              onChange={(e) =>
                setIdTemporada(e.target.value === '' ? '' : Number(e.target.value))
              }
            >
              <option value="">Sin temporada asignada</option>
              {seasons.map((s) => (
                <option key={s.id_temporada} value={s.id_temporada}>
                  {s.nombre}
                </option>
              ))}
            </select>
          </div>

          <div className="admin-modal-footer">
            <button type="button" className="admin-btn secondary" onClick={onClose} disabled={submitting}>
              Cancelar
            </button>
            <button type="submit" className="admin-btn primary" disabled={submitting}>
              {submitting ? 'Guardando...' : collection ? 'Guardar Cambios' : 'Crear Colección'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
