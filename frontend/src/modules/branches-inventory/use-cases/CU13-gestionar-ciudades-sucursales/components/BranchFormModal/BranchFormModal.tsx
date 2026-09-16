import React, { useEffect, useState } from 'react';
import { X, Store, Clock } from 'lucide-react';
import type { Branch, City, CreateBranchPayload } from '../../types/branchesAdmin.types';

interface BranchFormModalProps {
  isOpen: boolean;
  branchToEdit: Branch | null;
  cities: City[];
  submitting: boolean;
  onClose: () => void;
  onSubmit: (payload: CreateBranchPayload) => Promise<void>;
}

export const BranchFormModal: React.FC<BranchFormModalProps> = ({
  isOpen,
  branchToEdit,
  cities,
  submitting,
  onClose,
  onSubmit,
}) => {
  const [formData, setFormData] = useState<CreateBranchPayload>({
    nombre: '',
    id_ciudad: 0,
    direccion: '',
    telefono: '',
    hora_apertura: '09:00',
    hora_cierre: '21:00',
    estado: 'activo',
  });

  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (branchToEdit) {
      setFormData({
        nombre: branchToEdit.nombre,
        id_ciudad: branchToEdit.id_ciudad,
        direccion: branchToEdit.direccion,
        telefono: branchToEdit.telefono || '',
        hora_apertura: branchToEdit.hora_apertura || '09:00',
        hora_cierre: branchToEdit.hora_cierre || '21:00',
        estado: branchToEdit.estado,
      });
    } else {
      setFormData({
        nombre: '',
        id_ciudad: cities.length > 0 ? cities[0].id_ciudad : 0,
        direccion: '',
        telefono: '',
        hora_apertura: '09:00',
        hora_cierre: '21:00',
        estado: 'activo',
      });
    }
    setFormErrors({});
  }, [branchToEdit, cities, isOpen]);

  if (!isOpen) return null;

  const validate = () => {
    const errors: Record<string, string> = {};

    if (!formData.nombre.trim()) {
      errors.nombre = 'El nombre de la sucursal es obligatorio.';
    } else if (formData.nombre.trim().length < 2) {
      errors.nombre = 'El nombre debe tener al menos 2 caracteres.';
    }

    if (!formData.id_ciudad || formData.id_ciudad <= 0) {
      errors.id_ciudad = 'Debe seleccionar una ciudad válida.';
    }

    if (!formData.direccion.trim()) {
      errors.direccion = 'La dirección es obligatoria.';
    } else if (formData.direccion.trim().length < 4) {
      errors.direccion = 'La dirección debe ser descriptiva (mínimo 4 caracteres).';
    }

    if (formData.hora_apertura && formData.hora_cierre) {
      if (formData.hora_apertura >= formData.hora_cierre) {
        errors.hora_cierre = 'La hora de cierre debe ser posterior a la hora de apertura.';
      }
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
        className="admin-modal-container branch-form-modal"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="admin-modal-header">
          <div className="branch-form-header-title">
            <div className="icon-wrapper">
              <Store size={20} />
            </div>
            <div>
              <h2 className="admin-modal-title">
                {branchToEdit ? 'Editar Sucursal' : 'Nueva Sucursal Física'}
              </h2>
              <p className="admin-modal-subtitle">
                {branchToEdit
                  ? `Modifica los datos operativos de "${branchToEdit.nombre}"`
                  : 'Registra un nuevo establecimiento para control de inventario y ventas'}
              </p>
            </div>
          </div>
          <button type="button" className="admin-modal-close" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="admin-form">
          <div className="admin-modal-body">
            {/* Nombre y Ciudad */}
            <div className="form-row-2">
              <div className="form-group">
                <label htmlFor="nombre">
                  Nombre de la Sucursal <span className="req">*</span>
                </label>
                <div className="input-with-icon">
                  <input
                    id="nombre"
                    type="text"
                    className={`admin-input ${formErrors.nombre ? 'input-error' : ''}`}
                    placeholder="Ej: FashionStore Equipetrol"
                    value={formData.nombre}
                    onChange={(e) =>
                      setFormData({ ...formData, nombre: e.target.value })
                    }
                  />
                </div>
                {formErrors.nombre && (
                  <span className="field-error-text">{formErrors.nombre}</span>
                )}
              </div>

              <div className="form-group">
                <label htmlFor="id_ciudad">
                  Ciudad Asociada <span className="req">*</span>
                </label>
                <div className="select-with-icon">
                  <select
                    id="id_ciudad"
                    className={`admin-select ${formErrors.id_ciudad ? 'input-error' : ''}`}
                    value={formData.id_ciudad}
                    onChange={(e) =>
                      setFormData({ ...formData, id_ciudad: Number(e.target.value) })
                    }
                  >
                    <option value={0} disabled>
                      Selecciona una ciudad...
                    </option>
                    {cities.map((c) => (
                      <option key={c.id_ciudad} value={c.id_ciudad}>
                        {c.nombre} ({c.pais})
                      </option>
                    ))}
                  </select>
                </div>
                {formErrors.id_ciudad && (
                  <span className="field-error-text">{formErrors.id_ciudad}</span>
                )}
              </div>
            </div>

            {/* Dirección */}
            <div className="form-group">
              <label htmlFor="direccion">
                Dirección Física <span className="req">*</span>
              </label>
              <div className="input-with-icon">
                <input
                  id="direccion"
                  type="text"
                  className={`admin-input ${formErrors.direccion ? 'input-error' : ''}`}
                  placeholder="Ej: Av. San Martín #1700, Barrio Equipetrol"
                  value={formData.direccion}
                  onChange={(e) =>
                    setFormData({ ...formData, direccion: e.target.value })
                  }
                />
              </div>
              {formErrors.direccion && (
                <span className="field-error-text">{formErrors.direccion}</span>
              )}
            </div>

            {/* Teléfono y Estado */}
            <div className="form-row-2">
              <div className="form-group">
                <label htmlFor="telefono">Teléfono / Celular de Contacto</label>
                <input
                  id="telefono"
                  type="text"
                  className="admin-input"
                  placeholder="Ej: 33610001 ó 70012345"
                  value={formData.telefono}
                  onChange={(e) =>
                    setFormData({ ...formData, telefono: e.target.value })
                  }
                />
              </div>

              <div className="form-group">
                <label htmlFor="estado">Estado Operativo</label>
                <select
                  id="estado"
                  className="admin-select"
                  value={formData.estado}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      estado: e.target.value as 'activo' | 'inactivo',
                    })
                  }
                >
                  <option value="activo">Activo (Disponible para operaciones)</option>
                  <option value="inactivo">Inactivo (Temporalmente suspendida)</option>
                </select>
              </div>
            </div>

            {/* Horarios de Atención */}
            <div className="form-schedule-group">
              <label className="group-label">
                <Clock size={16} />
                <span>Horario Habitual de Atención</span>
              </label>
              <div className="form-row-2">
                <div className="form-group">
                  <label htmlFor="hora_apertura">Hora Apertura</label>
                  <input
                    id="hora_apertura"
                    type="time"
                    className="admin-input"
                    value={formData.hora_apertura}
                    onChange={(e) =>
                      setFormData({ ...formData, hora_apertura: e.target.value })
                    }
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="hora_cierre">Hora Cierre</label>
                  <input
                    id="hora_cierre"
                    type="time"
                    className={`admin-input ${formErrors.hora_cierre ? 'input-error' : ''}`}
                    value={formData.hora_cierre}
                    onChange={(e) =>
                      setFormData({ ...formData, hora_cierre: e.target.value })
                    }
                  />
                  {formErrors.hora_cierre && (
                    <span className="field-error-text">{formErrors.hora_cierre}</span>
                  )}
                </div>
              </div>
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
              ) : branchToEdit ? (
                'Actualizar Sucursal'
              ) : (
                'Registrar Sucursal'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
