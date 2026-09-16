import React from 'react';
import type { EmployeeItem } from '../services/empleados.service';
import {
  Users,
  UserPlus,
  RefreshCw,
  Eye,
  Edit2,
  Store,
  Shield,
  CreditCard,
  Phone,
} from 'lucide-react';

interface EmployeeTableProps {
  employees: EmployeeItem[];
  loading: boolean;
  onOpenCreate: () => void;
  onOpenDetail: (emp: EmployeeItem) => void;
  onOpenEdit: (emp: EmployeeItem) => void;
  onToggleStatus: (emp: EmployeeItem) => void;
}

export const EmployeeTable: React.FC<EmployeeTableProps> = ({
  employees,
  loading,
  onOpenCreate,
  onOpenDetail,
  onOpenEdit,
  onToggleStatus,
}) => {
  if (loading) {
    return (
      <div className="employees-loading-state">
        <RefreshCw size={36} className="spin" />
        <p>Cargando información del personal...</p>
      </div>
    );
  }

  if (employees.length === 0) {
    return (
      <div className="employees-empty-state">
        <Users size={48} />
        <h3>No se encontraron empleados</h3>
        <p>Intenta ajustar los filtros de búsqueda o registra un nuevo empleado.</p>
        <button className="btn-new-employee small" onClick={onOpenCreate}>
          <UserPlus size={16} />
          <span>Registrar Empleado</span>
        </button>
      </div>
    );
  }

  return (
    <table className="employees-data-table">
      <thead>
        <tr>
          <th>Código</th>
          <th>Empleado / Contacto</th>
          <th>C.I. / Teléfono</th>
          <th>Rol</th>
          <th>Sucursales Asignadas</th>
          <th>Estado</th>
          <th style={{ textAlign: 'right' }}>Acciones</th>
        </tr>
      </thead>
      <tbody>
        {employees.map((emp) => {
          const initials = `${emp.nombre[0] || ''}${emp.apellido[0] || ''}`.toUpperCase();

          return (
            <tr key={emp.id_empleado} className="employee-row">
              {/* Código */}
              <td>
                <span className="emp-code-badge">{emp.codigo_empleado}</span>
              </td>

              {/* Empleado y Email */}
              <td>
                <div className="emp-identity-cell">
                  <div className="emp-avatar-wrapper">
                    <div className="emp-avatar-circle">{initials}</div>
                    <span
                      className={`avatar-status-dot ${emp.conectado ? 'online' : 'offline'}`}
                      title={emp.conectado ? 'Sesión activa: Conectado' : 'Sin sesión activa: Desconectado'}
                    />
                  </div>
                  <div className="emp-identity-text">
                    <div className="emp-name-line">
                      <strong className="emp-name-text">{emp.nombre_completo}</strong>
                      <span className={`connection-pill small ${emp.conectado ? 'online' : 'offline'}`}>
                        <span className="connection-dot" />
                        {emp.conectado ? 'Conectado' : 'Desconectado'}
                      </span>
                    </div>
                    <span className="emp-email-text">{emp.email}</span>
                  </div>
                </div>
              </td>

              {/* CI y Teléfono */}
              <td>
                <div className="emp-id-cell">
                  <span className="emp-ci-value">
                    <CreditCard size={13} /> {emp.ci}
                  </span>
                  <span className="emp-tel-value">
                    <Phone size={13} /> {emp.telefono || 'Sin teléfono'}
                  </span>
                </div>
              </td>

              {/* Rol */}
              <td>
                <span className={`emp-role-tag role-${emp.id_rol}`}>
                  <Shield size={12} />
                  <span>{emp.rol}</span>
                </span>
              </td>

              {/* Sucursales */}
              <td>
                <div className="emp-branches-chips">
                  {emp.sucursales.length === 0 ? (
                    <span className="no-branch-tag">Sin sucursal</span>
                  ) : (
                    emp.sucursales.map((s) => (
                      <span key={s.id_sucursal} className="branch-chip-tag" title={s.direccion}>
                        <Store size={12} />
                        <span>{s.nombre}</span>
                      </span>
                    ))
                  )}
                </div>
              </td>

              {/* Estado con toggle rápido */}
              <td>
                <button
                  type="button"
                  className={`status-toggle-btn ${emp.estado}`}
                  onClick={() => onToggleStatus(emp)}
                  title={`Click para ${emp.estado === 'activo' ? 'desactivar' : 'activar'}`}
                >
                  <span className="status-dot" />
                  <span>{emp.estado === 'activo' ? 'Activo' : 'Inactivo'}</span>
                </button>
              </td>

              {/* Acciones */}
              <td style={{ textAlign: 'right' }}>
                <div className="emp-actions-group">
                  <button
                    type="button"
                    className="btn-action-icon view"
                    onClick={() => onOpenDetail(emp)}
                    title="Ver ficha completa"
                  >
                    <Eye size={16} />
                  </button>
                  <button
                    type="button"
                    className="btn-action-icon edit"
                    onClick={() => onOpenEdit(emp)}
                    title="Editar empleado"
                  >
                    <Edit2 size={16} />
                  </button>
                </div>
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
};
