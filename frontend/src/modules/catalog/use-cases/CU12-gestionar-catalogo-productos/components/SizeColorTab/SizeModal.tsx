import React, { useState } from 'react';

interface SizeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (codigo: string) => Promise<void>;
}

export const SizeModal: React.FC<SizeModalProps> = ({ isOpen, onClose, onSubmit }) => {
  const [codigo, setCodigo] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!codigo.trim()) {
      setError('El código de la talla es obligatorio.');
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await onSubmit(codigo.trim().toUpperCase());
      setCodigo('');
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al crear la talla.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="admin-modal-backdrop" onClick={onClose}>
      <div className="admin-modal-box sm" onClick={(e) => e.stopPropagation()}>
        <div className="admin-modal-header">
          <h3>Nueva Talla Comercial</h3>
          <button type="button" className="close-btn" onClick={onClose}>
            ✕
          </button>
        </div>

        {error && <div className="admin-form-alert error">{error}</div>}

        <form onSubmit={handleSubmit} className="admin-form">
          <div className="form-group">
            <label>Código de Talla *</label>
            <input
              type="text"
              className="admin-input font-mono"
              value={codigo}
              onChange={(e) => setCodigo(e.target.value.toUpperCase())}
              placeholder="Ej. XS, S, M, L, XL, 38, 40..."
              required
            />
          </div>

          <div className="admin-modal-footer">
            <button type="button" className="admin-btn secondary" onClick={onClose} disabled={submitting}>
              Cancelar
            </button>
            <button type="submit" className="admin-btn primary" disabled={submitting}>
              {submitting ? 'Guardando...' : 'Crear Talla'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
