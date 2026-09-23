/**
 * @caso-de-uso CU10 — Gestionar catálogo de productos
 * @subsistema Catálogo y Proveedores
 * @capa Boundary — Frontend web
 * @responsabilidad Implementa una parte reutilizable de la interfaz de Frontend web y comunica eventos al controlador de presentación.
 * @secuencia Administrador -> administración de catálogo -> controlador de productos -> servicio de catálogo -> Producto/Variante/Categoría/Colección/Promoción.
 */
import React, { useState, useEffect } from 'react';
import type { AdminColor } from '../../types/catalog-admin.types';

interface ColorModalProps {
  isOpen: boolean;
  color: AdminColor | null;
  onClose: () => void;
  onSubmit: (data: { nombre: string; codigo_hex?: string }) => Promise<void>;
}

export const ColorModal: React.FC<ColorModalProps> = ({ isOpen, color, onClose, onSubmit }) => {
  const [nombre, setNombre] = useState('');
  const [codigoHex, setCodigoHex] = useState('#000000');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (color) {
      setNombre(color.nombre);
      setCodigoHex(color.codigo_hex || '#000000');
    } else {
      setNombre('');
      setCodigoHex('#000000');
    }
    setError(null);
  }, [color, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombre.trim()) {
      setError('El nombre del color es obligatorio.');
      return;
    }
    if (codigoHex && !/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(codigoHex)) {
      setError('El código HEX debe tener formato #RRGGBB válido.');
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      await onSubmit({
        nombre: nombre.trim(),
        codigo_hex: codigoHex.toUpperCase(),
      });
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al guardar el color.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="admin-modal-backdrop" onClick={onClose}>
      <div className="admin-modal-box sm" onClick={(e) => e.stopPropagation()}>
        <div className="admin-modal-header">
          <h3>{color ? 'Editar Color' : 'Nuevo Color de Prenda'}</h3>
          <button type="button" className="close-btn" onClick={onClose}>
            ✕
          </button>
        </div>

        {error && <div className="admin-form-alert error">{error}</div>}

        <form onSubmit={handleSubmit} className="admin-form">
          <div className="form-group">
            <label>Nombre del Color *</label>
            <input
              type="text"
              className="admin-input"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              placeholder="Ej. Azul Marino, Terracota, Verde Oliva..."
              required
            />
          </div>

          <div className="form-group">
            <label>Muestra de Color (Selector e Input HEX) *</label>
            <div className="color-picker-row">
              <input
                type="color"
                className="color-native-input"
                value={codigoHex}
                onChange={(e) => setCodigoHex(e.target.value)}
              />
              <input
                type="text"
                className="admin-input font-mono"
                value={codigoHex}
                onChange={(e) => setCodigoHex(e.target.value)}
                placeholder="#000000"
                maxLength={7}
                required
              />
              <div className="color-preview-circle" style={{ backgroundColor: codigoHex }} />
            </div>
          </div>

          <div className="admin-modal-footer">
            <button type="button" className="admin-btn secondary" onClick={onClose} disabled={submitting}>
              Cancelar
            </button>
            <button type="submit" className="admin-btn primary" disabled={submitting}>
              {submitting ? 'Guardando...' : color ? 'Guardar Cambios' : 'Crear Color'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
