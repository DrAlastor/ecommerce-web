import React from 'react';
import type { EmployeeItem } from '../services/empleados.service';
import {
  X,
  User,
  Mail,
  Phone,
  Calendar,
  Shield,
  Store,
  CreditCard,
  Edit2,
  CheckCircle2,
  XCircle,
} from 'lucide-react';

interface EmployeeDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  employee: EmployeeItem | null;
  onEdit: (employee: EmployeeItem) => void;
}

export const EmployeeDetailModal: React.FC<EmployeeDetailModalProps> = ({
  isOpen,
  onClose,
  employee,
  onEdit,
}) => {
  if (!isOpen || !employee) return null;

  const initials = `${employee.nombre[0] || ''}${employee.apellido[0] || ''}`.toUpperCase();

  const formattedDate = employee.fecha_contratacion
    ? new Date(employee.fecha_contratacion).toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : 'No especificada';

  return (
    <div className="employee-modal-overlay" onClick={onClose}>
      <div className="employee-modal-content detail-view" onClick={(e) => e.stopPropagation()}>
        {/* Cabecera */}
        <div className="employee-modal-header">
          <div className="modal-title-wrap">
            <span className="modal-badge-tag">Ficha del Empleado</span>
            <h3>Detalle de Empleado</h3>
          </div>
          <button type="button" className="btn-close-modal" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        {/* Perfil Header */}
        <div className="detail-hero-card">
          <div className="detail-avatar">{initials}</div>
          <div className="detail-hero-info">
            <div className="detail-name-line">
              <h2>{employee.nombre_completo}</h2>
              <span className={`status-pill ${employee.estado}`}>
                {employee.estado === 'activo' ? (
                  <>
                    <CheckCircle2 size={13} /> Activo
                  </>
                ) : (
                  <>
                    <XCircle size={13} /> Inactivo
                  </>
                )}
              </span>
              <span className={`connection-pill ${employee.conectado ? 'online' : 'offline'}`}>
                <span className="connection-dot" />
                {employee.conectado ? 'Conectado' : 'Desconectado'}
              </span>
            </div>
            <span className="detail-emp-code">Código: {employee.codigo_empleado}</span>
          </div>
        </div>

        {/* Secciones de Información */}
        <div className="detail-sections-grid">
          {/* Tarjeta 1: Información de Contacto e Identificación */}
          <div className="detail-info-block">
            <h4>
              <User size={15} /> Identificación y Contacto
            </h4>
            <div className="detail-info-row">
              <span className="label">Cédula de Identidad (CI):</span>
              <span className="value">
                <CreditCard size={14} /> {employee.ci}
              </span>
            </div>
            <div className="detail-info-row">
              <span className="label">Correo Electrónico:</span>
              <span className="value">
                <Mail size={14} /> {employee.email}
              </span>
            </div>
            <div className="detail-info-row">
              <span className="label">Teléfono:</span>
              <span className="value">
                <Phone size={14} /> {employee.telefono || 'No registrado'}
              </span>
            </div>
          </div>

          {/* Tarjeta 2: Perfil Laboral */}
          <div className="detail-info-block">
            <h4>
              <Shield size={15} /> Información Laboral
            </h4>
            <div className="detail-info-row">
              <span className="label">Rol Asignado:</span>
              <span className="value">
                <span className={`role-pill role-${employee.id_rol}`}>
                  {employee.rol}
                </span>
              </span>
            </div>
            <div className="detail-info-row">
              <span className="label">Fecha de Contratación:</span>
              <span className="value">
                <Calendar size={14} /> {formattedDate}
              </span>
            </div>
            <div className="detail-info-row">
              <span className="label">Estado de Conexión:</span>
              <span className="value">
                <span className={`connection-pill ${employee.conectado ? 'online' : 'offline'}`}>
                  <span className="connection-dot" />
                  {employee.conectado ? 'Conectado (En línea)' : 'Desconectado'}
                </span>
              </span>
            </div>
            <div className="detail-info-row">
              <span className="label">ID de Cuenta:</span>
              <span className="value">Usuario #{employee.id_empleado}</span>
            </div>
          </div>
        </div>

        {/* Sucursales Asignadas */}
        <div className="detail-branches-block">
          <h4>
            <Store size={15} /> Sucursales Asignadas ({employee.sucursales.length})
          </h4>
          {employee.sucursales.length === 0 ? (
            <p className="no-branches-text">
              Este empleado actualmente no tiene sucursales asignadas.
            </p>
          ) : (
            <div className="detail-branches-list">
              {employee.sucursales.map((s) => (
                <div key={s.id_sucursal} className="detail-branch-card">
                  <div className="branch-icon-box">
                    <Store size={16} />
                  </div>
                  <div>
                    <strong>{s.nombre}</strong>
                    <span className="branch-location">
                      {s.ciudad ? `${s.ciudad} — ` : ''}
                      {s.direccion}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="employee-modal-footer">
          <button type="button" className="btn-cancel" onClick={onClose}>
            Cerrar
          </button>
          <button
            type="button"
            className="btn-save-employee"
            onClick={() => {
              onClose();
              onEdit(employee);
            }}
          >
            <Edit2 size={16} />
            <span>Editar Empleado</span>
          </button>
        </div>
      </div>
    </div>
  );
};
