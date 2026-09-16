import React, { useEffect, useState } from 'react';
import { X, Building2 } from 'lucide-react';
import type { City, CreateCityPayload } from '../../types/branchesAdmin.types';

interface CityFormModalProps {
  isOpen: boolean;
  cityToEdit: City | null;
  submitting: boolean;
  onClose: () => void;
  onSubmit: (payload: CreateCityPayload) => Promise<void>;
}

export const CityFormModal: React.FC<CityFormModalProps> = ({
  isOpen,
  cityToEdit,
  submitting,
  onClose,
  onSubmit,
}) => {
  const [formData, setFormData] = useState<CreateCityPayload>({
    nombre: '',
    pais: 'Bolivia',
  });

  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (cityToEdit) {
      setFormData({
        nombre: cityToEdit.nombre,
        pais: cityToEdit.pais,
      });
    } else {
      setFormData({
        nombre: '',
        pais: 'Bolivia',
      });
    }
    setFormErrors({});
  }, [cityToEdit, isOpen]);

  if (!isOpen) return null;

  const validate = () => {
    const errors: Record<string, string> = {};

    if (!formData.nombre.trim()) {
      errors.nombre = 'El nombre de la ciudad es obligatorio.';
    } else if (formData.nombre.trim().length < 2) {
      errors.nombre = 'El nombre debe tener al menos 2 caracteres.';
    }

    if (!formData.pais.trim()) {
      errors.pais = 'El país es obligatorio.';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    await onSubmit(formData);
  };

  return (
    <div className="admin-modal-overlay" onClick={onClose}>
      <div
        className="admin-modal-container city-form-modal"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="admin-modal-header">
          <div className="branch-form-header-title">
            <div className="icon-wrapper">
              <Building2 size={20} />
            </div>
            <div>
              <h2 className="admin-modal-title">
                {cityToEdit ? 'Editar Ciudad' : 'Nueva Ciudad Geográfica'}
              </h2>
              <p className="admin-modal-subtitle">
                {cityToEdit
                  ? `Modifica la información de ${cityToEdit.nombre}`
                  : 'Registra una nueva ciudad donde FashionStore puede operar sucursales'}
              </p>
            </div>
          </div>
          <button type="button" className="admin-modal-close" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="admin-form">
          <div className="admin-modal-body">
            <div className="form-group">
              <label htmlFor="city_nombre">
                Nombre de la Ciudad <span className="req">*</span>
              </label>
              <input
                id="city_nombre"
                type="text"
                className={`admin-input ${formErrors.nombre ? 'input-error' : ''}`}
                placeholder="Ej: Tarija, Oruro, Potosí"
                value={formData.nombre}
                onChange={(e) =>
                  setFormData({ ...formData, nombre: e.target.value })
                }
              />
              {formErrors.nombre && (
                <span className="field-error-text">{formErrors.nombre}</span>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="city_pais">
                País <span className="req">*</span>
              </label>
              <input
                id="city_pais"
                type="text"
                className={`admin-input ${formErrors.pais ? 'input-error' : ''}`}
                placeholder="Ej: Bolivia"
                value={formData.pais}
                onChange={(e) =>
                  setFormData({ ...formData, pais: e.target.value })
                }
              />
              {formErrors.pais && (
                <span className="field-error-text">{formErrors.pais}</span>
              )}
            </div>
          </div>

          <div className="admin-modal-footer">
            <button
              type="button"
              className="admin-btn secondary"
              onClick={onClose}
              disabled={submitting}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="admin-btn primary"
              disabled={submitting}
            >
              {submitting ? (
                <>
                  <span className="spinner-border sm" /> Guardando...
                </>
              ) : cityToEdit ? (
                'Actualizar Ciudad'
              ) : (
                'Registrar Ciudad'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
