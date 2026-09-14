import React, { useState, useEffect } from 'react';
import type { AdminSizeGuide, CatalogMetadata } from '../../types/catalog-admin.types';

interface SizeGuideModalProps {
  isOpen: boolean;
  guide: AdminSizeGuide | null;
  metadata: CatalogMetadata | null;
  onClose: () => void;
  onSubmit: (data: any) => Promise<void>;
}

export const SizeGuideModal: React.FC<SizeGuideModalProps> = ({
  isOpen,
  guide,
  metadata,
  onClose,
  onSubmit,
}) => {
  const [idCategoria, setIdCategoria] = useState<number | ''>('');
  const [parteCuerpo, setParteCuerpo] = useState('Pecho');
  const [tallaEtiqueta, setTallaEtiqueta] = useState('M');
  const [minCm, setMinCm] = useState<number | ''>(90);
  const [maxCm, setMaxCm] = useState<number | ''>(95);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (guide) {
      setIdCategoria(guide.id_categoria);
      setParteCuerpo(guide.parte_cuerpo);
      setTallaEtiqueta(guide.talla_etiqueta);
      setMinCm(guide.min_cm);
      setMaxCm(guide.max_cm);
    } else {
      setIdCategoria(metadata?.categories[0]?.id_categoria || '');
      setParteCuerpo('Pecho');
      setTallaEtiqueta(metadata?.sizes[0]?.codigo || 'M');
      setMinCm(90);
      setMaxCm(95);
    }
    setError(null);
  }, [guide, metadata, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!idCategoria) {
      setError('Debes seleccionar una categoría.');
      return;
    }
    if (!parteCuerpo.trim() || !tallaEtiqueta.trim()) {
      setError('La zona anatómica y la talla son obligatorias.');
      return;
    }
    if (minCm === '' || maxCm === '' || Number(minCm) >= Number(maxCm)) {
      setError('El valor mínimo en cm debe ser estrictamente menor que el valor máximo.');
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      await onSubmit({
        id_categoria: Number(idCategoria),
        parte_cuerpo: parteCuerpo.trim(),
        talla_etiqueta: tallaEtiqueta.trim(),
        min_cm: Number(minCm),
        max_cm: Number(maxCm),
      });
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al guardar la guía de talla.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="admin-modal-backdrop" onClick={onClose}>
      <div className="admin-modal-box sm" onClick={(e) => e.stopPropagation()}>
        <div className="admin-modal-header">
          <h3>{guide ? 'Editar Medida Anatómica' : 'Nueva Guía de Talla'}</h3>
          <button type="button" className="close-btn" onClick={onClose}>
            ✕
          </button>
        </div>

        {error && <div className="admin-form-alert error">{error}</div>}

        <form onSubmit={handleSubmit} className="admin-form">
          <div className="form-group">
            <label>Categoría de Prenda *</label>
            <select
              className="admin-select"
              value={idCategoria}
              onChange={(e) => setIdCategoria(Number(e.target.value))}
              disabled={Boolean(guide)}
              required
            >
              {metadata?.categories.map((c) => (
                <option key={c.id_categoria} value={c.id_categoria}>
                  {c.nombre}
                </option>
              ))}
            </select>
          </div>

          <div className="form-row-2">
            <div className="form-group">
              <label>Parte del Cuerpo *</label>
              <input
                type="text"
                className="admin-input"
                value={parteCuerpo}
                onChange={(e) => setParteCuerpo(e.target.value)}
                placeholder="Ej. Pecho, Cintura, Cadera, Largo manga..."
                required
              />
            </div>

            <div className="form-group">
              <label>Talla *</label>
              <select
                className="admin-select"
                value={tallaEtiqueta}
                onChange={(e) => setTallaEtiqueta(e.target.value)}
                required
              >
                {metadata?.sizes.map((s) => (
                  <option key={s.id_talla} value={s.codigo}>
                    {s.codigo}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-row-2">
            <div className="form-group">
              <label>Mínimo (cm) *</label>
              <input
                type="number"
                step="0.5"
                min="0"
                className="admin-input"
                value={minCm}
                onChange={(e) => setMinCm(e.target.value === '' ? '' : parseFloat(e.target.value))}
                required
              />
            </div>
            <div className="form-group">
              <label>Máximo (cm) *</label>
              <input
                type="number"
                step="0.5"
                min="0"
                className="admin-input"
                value={maxCm}
                onChange={(e) => setMaxCm(e.target.value === '' ? '' : parseFloat(e.target.value))}
                required
              />
            </div>
          </div>

          <div className="admin-modal-footer">
            <button type="button" className="admin-btn secondary" onClick={onClose} disabled={submitting}>
              Cancelar
            </button>
            <button type="submit" className="admin-btn primary" disabled={submitting}>
              {submitting ? 'Guardando...' : guide ? 'Guardar Cambios' : 'Registrar Medida'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
