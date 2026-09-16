import React, { useState, useEffect } from 'react';
import {
  empleadosService,
  type EmployeeItem,
  type BranchItem,
  type EmployeeRoleItem,
  type CreateEmployeePayload,
  type UpdateEmployeePayload,
} from '../services/empleados.service';
import {
  X,
  User,
  Mail,
  Lock,
  Phone,
  Calendar,
  Shield,
  Store,
  CreditCard,
  AlertCircle,
  Save,
  RefreshCw,
} from 'lucide-react';

interface EmployeeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  employeeToEdit?: EmployeeItem | null;
  branches: BranchItem[];
  roles: EmployeeRoleItem[];
}

export const EmployeeModal: React.FC<EmployeeModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  employeeToEdit,
  branches,
  roles,
}) => {
  const isEditing = Boolean(employeeToEdit);

  const [formData, setFormData] = useState({
    nombre: '',
    apellido: '',
    email: '',
    password: '',
    codigo_empleado: '',
    ci: '',
    telefono: '',
    fecha_contratacion: new Date().toISOString().split('T')[0],
    id_rol: roles.length > 0 ? roles[0].id_rol : 4,
    estado: 'activo' as 'activo' | 'inactivo',
    sucursales: [] as number[],
  });

  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (employeeToEdit) {
      const rawDate = employeeToEdit.fecha_contratacion
        ? new Date(employeeToEdit.fecha_contratacion).toISOString().split('T')[0]
        : '';
      setFormData({
        nombre: employeeToEdit.nombre,
        apellido: employeeToEdit.apellido,
        email: employeeToEdit.email,
        password: '',
        codigo_empleado: employeeToEdit.codigo_empleado,
        ci: employeeToEdit.ci,
        telefono: employeeToEdit.telefono || '',
        fecha_contratacion: rawDate,
        id_rol: employeeToEdit.id_rol,
        estado: employeeToEdit.estado,
        sucursales: employeeToEdit.sucursales.map((s) => s.id_sucursal),
      });
    } else {
      setFormData({
        nombre: '',
        apellido: '',
        email: '',
        password: '',
        codigo_empleado: '',
        ci: '',
        telefono: '',
        fecha_contratacion: new Date().toISOString().split('T')[0],
        id_rol: roles.length > 0 ? roles[0].id_rol : 4,
        estado: 'activo',
        sucursales: [],
      });
    }
    setErrorMessage(null);
  }, [employeeToEdit, roles, isOpen]);

  if (!isOpen) return null;

  const toggleBranchSelection = (branchId: number) => {
    setFormData((prev) => {
      const exists = prev.sucursales.includes(branchId);
      const nextSucursales = exists
        ? prev.sucursales.filter((id) => id !== branchId)
        : [...prev.sucursales, branchId];
      return { ...prev, sucursales: nextSucursales };
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setErrorMessage(null);

    try {
      if (isEditing && employeeToEdit) {
        const payload: UpdateEmployeePayload = {
          nombre: formData.nombre.trim(),
          apellido: formData.apellido.trim(),
          ci: formData.ci.trim(),
          telefono: formData.telefono ? formData.telefono.trim() : '',
          fecha_contratacion: formData.fecha_contratacion,
          id_rol: Number(formData.id_rol),
          email: formData.email.trim().toLowerCase(),
          sucursales: formData.sucursales,
          estado: formData.estado,
        };

        if (formData.password.trim() !== '') {
          payload.password = formData.password.trim();
        }

        await empleadosService.updateEmployee(employeeToEdit.id_empleado, payload);
      } else {
        const payload: CreateEmployeePayload = {
          nombre: formData.nombre.trim(),
          apellido: formData.apellido.trim(),
          codigo_empleado: formData.codigo_empleado.trim().toUpperCase(),
          ci: formData.ci.trim(),
          telefono: formData.telefono ? formData.telefono.trim() : undefined,
          fecha_contratacion: formData.fecha_contratacion,
          id_rol: Number(formData.id_rol),
          email: formData.email.trim().toLowerCase(),
          password: formData.password.trim() || undefined,
          sucursales: formData.sucursales,
          estado: formData.estado,
        };

        await empleadosService.createEmployee(payload);
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      console.error('Error al guardar empleado:', err);
      const msg = err.response?.data?.message || 'Error al procesar la solicitud del empleado.';
      setErrorMessage(Array.isArray(msg) ? msg.join(', ') : msg);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="employee-modal-overlay" onClick={onClose}>
      <div className="employee-modal-content" onClick={(e) => e.stopPropagation()}>
        {/* Cabecera del Modal */}
        <div className="employee-modal-header">
          <div className="modal-title-wrap">
            <span className="modal-badge-tag">
              {isEditing ? 'Edición Laboral' : 'Nuevo Registro'}
            </span>
            <h3>{isEditing ? `Editar Empleado — ${formData.codigo_empleado}` : 'Registrar Nuevo Empleado'}</h3>
          </div>
          <button type="button" className="btn-close-modal" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        {/* Alerta de Error */}
        {errorMessage && (
          <div className="modal-error-alert">
            <AlertCircle size={18} />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="employee-form">
          <div className="form-grid-layout">
            {/* SECCIÓN 1: Datos Personales e Identificación */}
            <div className="form-section-card">
              <h4 className="form-section-title">
                <User size={16} /> Identificación y Datos Personales
              </h4>

              <div className="form-row-two">
                <div className="form-group">
                  <label htmlFor="emp-nombre">Nombre *</label>
                  <input
                    id="emp-nombre"
                    type="text"
                    required
                    placeholder="Ej. Carlos"
                    value={formData.nombre}
                    onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="emp-apellido">Apellido *</label>
                  <input
                    id="emp-apellido"
                    type="text"
                    required
                    placeholder="Ej. Gómez"
                    value={formData.apellido}
                    onChange={(e) => setFormData({ ...formData, apellido: e.target.value })}
                  />
                </div>
              </div>

              <div className="form-row-two">
                <div className="form-group">
                  <label htmlFor="emp-codigo">
                    Código de Empleado * {!isEditing && <small>(Único)</small>}
                  </label>
                  <input
                    id="emp-codigo"
                    type="text"
                    required
                    disabled={isEditing}
                    placeholder="Ej. CAJ-SC-002"
                    value={formData.codigo_empleado}
                    onChange={(e) =>
                      setFormData({ ...formData, codigo_empleado: e.target.value.toUpperCase() })
                    }
                    className={isEditing ? 'input-readonly' : ''}
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="emp-ci">
                    Cédula de Identidad (CI) *
                  </label>
                  <div className="input-with-icon">
                    <CreditCard size={16} />
                    <input
                      id="emp-ci"
                      type="text"
                      required
                      placeholder="Ej. 6543210"
                      value={formData.ci}
                      onChange={(e) => setFormData({ ...formData, ci: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              <div className="form-row-two">
                <div className="form-group">
                  <label htmlFor="emp-tel">Teléfono</label>
                  <div className="input-with-icon">
                    <Phone size={16} />
                    <input
                      id="emp-tel"
                      type="tel"
                      placeholder="Ej. 70012345"
                      value={formData.telefono}
                      onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="emp-fecha">Fecha de Contratación *</label>
                  <div className="input-with-icon">
                    <Calendar size={16} />
                    <input
                      id="emp-fecha"
                      type="date"
                      required
                      value={formData.fecha_contratacion}
                      onChange={(e) =>
                        setFormData({ ...formData, fecha_contratacion: e.target.value })
                      }
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* SECCIÓN 2: Cuenta de Acceso y Rol */}
            <div className="form-section-card">
              <h4 className="form-section-title">
                <Shield size={16} /> Cuenta de Acceso y Perfil
              </h4>

              <div className="form-group">
                <label htmlFor="emp-email">Correo Electrónico (Login) *</label>
                <div className="input-with-icon">
                  <Mail size={16} />
                  <input
                    id="emp-email"
                    type="email"
                    required
                    placeholder="empleado@fashionstore.bo"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  />
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="emp-password">
                  {isEditing ? 'Nueva Contraseña (dejar en blanco para no cambiar)' : 'Contraseña Inicial (opcional)'}
                </label>
                <div className="input-with-icon">
                  <Lock size={16} />
                  <input
                    id="emp-password"
                    type="password"
                    minLength={6}
                    placeholder={isEditing ? '••••••••' : 'Por defecto: Password123!'}
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  />
                </div>
                {!isEditing && (
                  <span className="field-hint">Si se deja en blanco, la clave inicial será <code>Password123!</code></span>
                )}
              </div>

              <div className="form-row-two">
                <div className="form-group">
                  <label htmlFor="emp-rol">Rol en FashionStore *</label>
                  <select
                    id="emp-rol"
                    value={formData.id_rol}
                    onChange={(e) => setFormData({ ...formData, id_rol: Number(e.target.value) })}
                    required
                  >
                    {roles.map((r) => (
                      <option key={r.id_rol} value={r.id_rol}>
                        {r.nombre}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor="emp-estado">Estado del Empleado *</label>
                  <select
                    id="emp-estado"
                    value={formData.estado}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        estado: e.target.value as 'activo' | 'inactivo',
                      })
                    }
                  >
                    <option value="activo">Activo (Habilitado)</option>
                    <option value="inactivo">Inactivo (Suspendido)</option>
                  </select>
                </div>
              </div>
            </div>

            {/* SECCIÓN 3: Sucursales Asignadas */}
            <div className="form-section-card full-width">
              <div className="branches-section-head">
                <h4 className="form-section-title">
                  <Store size={16} /> Asignación de Sucursales Físicas
                </h4>
                <span className="selected-branches-count">
                  {formData.sucursales.length}{' '}
                  {formData.sucursales.length === 1 ? 'sucursal asignada' : 'sucursales asignadas'}
                </span>
              </div>

              <p className="branches-instruction">
                Selecciona las sucursales donde este empleado estará habilitado para operar (ventas, inventario o administración):
              </p>

              <div className="branches-selection-grid">
                {branches.map((b) => {
                  const isChecked = formData.sucursales.includes(b.id_sucursal);
                  return (
                    <div
                      key={b.id_sucursal}
                      className={`branch-select-card ${isChecked ? 'selected' : ''}`}
                      onClick={() => toggleBranchSelection(b.id_sucursal)}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => {}}
                        className="branch-checkbox"
                      />
                      <div className="branch-card-info">
                        <strong className="branch-name">{b.nombre}</strong>
                        <span className="branch-city">{b.ciudad || 'Bolivia'}</span>
                        <span className="branch-address">{b.direccion}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Botones del Modal */}
          <div className="employee-modal-footer">
            <button
              type="button"
              className="btn-cancel"
              onClick={onClose}
              disabled={saving}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="btn-save-employee"
              disabled={saving}
            >
              {saving ? (
                <>
                  <RefreshCw size={16} className="spin" />
                  <span>Guardando...</span>
                </>
              ) : (
                <>
                  <Save size={16} />
                  <span>{isEditing ? 'Actualizar Empleado' : 'Registrar Empleado'}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
