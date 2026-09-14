import React, { useState, useEffect } from 'react';
import type { AdminSeason } from '../../types/catalog-admin.types';

interface SeasonModalProps {
  isOpen: boolean;
  season: AdminSeason | null;
  onClose: () => void;
  onSubmit: (data: any) => Promise<void>;
}

export const SeasonModal: React.FC<SeasonModalProps> = ({ isOpen, season, onClose, onSubmit }) => {
  const [nombre, setNombre] = useState('');
  const [fechaInicio, setFechaInicio] = useState('');
  const [fechaFin, setFechaFin] = useState('');
  const [estado, setEstado] = useState('activo');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (season) {
      setNombre(season.nombre);
      setFechaInicio(season.fecha_inicio.substring(0, 10));
      setFechaFin(season.fecha_fin.substring(0, 10));
      setEstado(season.estado);
    } else {
      setNombre('');
      setFechaInicio(new Date().toISOString().substring(0, 10));
      setFechaFin(new Date(Date.now() + 90 * 86400000).toISOString().substring(0, 10));
      setEstado('activo');
    }
    setError(null);
  }, [season, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombre.trim()) {
      setError('El nombre de la temporada es obligatorio.');
      return;
    }
    if (!fechaInicio || !fechaFin) {
      setError('Las fechas de inicio y fin son obligatorias.');
      return;
    }
    if (new Date(fechaInicio) > new Date(fechaFin)) {
      setError('La fecha de inicio no puede ser posterior a la fecha de fin.');
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      await onSubmit({
        nombre: nombre.trim(),
        fecha_inicio: fechaInicio,
        fecha_fin: fechaFin,
        estado,
      });
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al guardar la temporada.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="admin-modal-backdrop" onClick={onClose}>
      <div className="admin-modal-box sm" onClick={(e) => e.stopPropagation()}>
        <div className="admin-modal-header">
          <h3>{season ? 'Editar Temporada' : 'Nueva Temporada'}</h3>
          <button type="button" className="close-btn" onClick={onClose}>
            ✕
          </button>
        </div>

        {error && <div className="admin-form-alert error">{error}</div>}

        <form onSubmit={handleSubmit} className="admin-form">
          <div className="form-group">
            <label>Nombre de la Temporada *</label>
            <input
              type="text"
              className="admin-input"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              placeholder="Ej. Primavera-Verano 2026, Black Friday 2026..."
              required
            />
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
              <label>Fecha de Fin *</label>
              <input
                type="date"
                className="admin-input"
                value={fechaFin}
                onChange={(e) => setFechaFin(e.target.value)}
                required
              />
            </div>
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

          <div className="admin-modal-footer">
            <button type="button" className="admin-btn secondary" onClick={onClose} disabled={submitting}>
              Cancelar
            </button>
            <button type="submit" className="admin-btn primary" disabled={submitting}>
              {submitting ? 'Guardando...' : season ? 'Guardar Cambios' : 'Crear Temporada'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
