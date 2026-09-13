import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  empleadosService,
  type EmployeeItem,
  type BranchItem,
  type EmployeeRoleItem,
  type QueryEmployeesParams,
} from '../services/empleados.service';
import { EmployeeModal } from '../components/EmployeeModal';
import { EmployeeDetailModal } from '../components/EmployeeDetailModal';
import {
  Users,
  UserPlus,
  Search,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Eye,
  Edit2,
  Store,
  Shield,
  Briefcase,
  ChevronLeft,
  ChevronRight,
  CreditCard,
  Phone,
  Radio,
} from 'lucide-react';
import './ManageEmployeesPage.css';

export const ManageEmployeesPage: React.FC = () => {
  const [employees, setEmployees] = useState<EmployeeItem[]>([]);
  const [branches, setBranches] = useState<BranchItem[]>([]);
  const [roles, setRoles] = useState<EmployeeRoleItem[]>([]);
  const [meta, setMeta] = useState({ total: 0, page: 1, limit: 10, totalPages: 1 });

  // Filters state
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRole, setSelectedRole] = useState<number | ''>('');
  const [selectedBranch, setSelectedBranch] = useState<number | ''>('');
  const [selectedStatus, setSelectedStatus] = useState<'activo' | 'inactivo' | ''>('');

  // UI state
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Modals state
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [employeeToEdit, setEmployeeToEdit] = useState<EmployeeItem | null>(null);

  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [employeeToView, setEmployeeToView] = useState<EmployeeItem | null>(null);

  // Cargar sucursales y roles una sola vez al inicio
  useEffect(() => {
    const loadCatalogs = async () => {
      try {
        const [branchesData, rolesData] = await Promise.all([
          empleadosService.getBranches(),
          empleadosService.getEmployeeRoles(),
        ]);
        setBranches(branchesData);
        setRoles(rolesData);
      } catch (err) {
        console.error('Error al cargar catálogos de empleados:', err);
      }
    };
    loadCatalogs();
  }, []);

  // Cargar empleados
  const fetchEmployees = useCallback(
    async (pageToLoad = meta.page) => {
      setLoading(true);
      try {
        const params: QueryEmployeesParams = {
          page: pageToLoad,
          limit: meta.limit,
          search: searchTerm.trim() || undefined,
          rol: selectedRole !== '' ? Number(selectedRole) : undefined,
          sucursal: selectedBranch !== '' ? Number(selectedBranch) : undefined,
          estado: selectedStatus !== '' ? selectedStatus : undefined,
        };

        const res = await empleadosService.getEmployees(params);
        setEmployees(res.data);
        setMeta(res.meta);
      } catch (err: any) {
        console.error('Error al consultar empleados:', err);
        setFeedback({
          type: 'error',
          message: 'No se pudo cargar la lista de empleados.',
        });
      } finally {
        setLoading(false);
      }
    },
    [meta.page, meta.limit, searchTerm, selectedRole, selectedBranch, selectedStatus],
  );

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchEmployees(1);
    }, 350);
    return () => clearTimeout(timer);
  }, [searchTerm, selectedRole, selectedBranch, selectedStatus]);

  // Cambiar estado rápido
  const handleToggleStatus = async (employee: EmployeeItem) => {
    const newStatus = employee.estado === 'activo' ? 'inactivo' : 'activo';
    const actionText = newStatus === 'activo' ? 'activar' : 'desactivar';

    if (!window.confirm(`¿Estás seguro de ${actionText} al empleado ${employee.nombre_completo}?`)) {
      return;
    }

    try {
      await empleadosService.updateEmployeeStatus(employee.id_empleado, newStatus);
      setFeedback({
        type: 'success',
        message: `Estado del empleado "${employee.nombre_completo}" cambiado a ${newStatus}.`,
      });
      setTimeout(() => setFeedback(null), 3000);
      fetchEmployees();
    } catch (err: any) {
      console.error('Error al cambiar estado:', err);
      setFeedback({
        type: 'error',
        message: err.response?.data?.message || 'Error al actualizar estado del empleado.',
      });
    }
  };

  const handleOpenCreate = () => {
    setEmployeeToEdit(null);
    setIsFormModalOpen(true);
  };

  const handleOpenEdit = (emp: EmployeeItem) => {
    setEmployeeToEdit(emp);
    setIsFormModalOpen(true);
  };

  const handleOpenDetail = (emp: EmployeeItem) => {
    setEmployeeToView(emp);
    setIsDetailModalOpen(true);
  };

  const handleFormSuccess = () => {
    setFeedback({
      type: 'success',
      message: employeeToEdit
        ? '¡Empleado actualizado correctamente!'
        : '¡Nuevo empleado registrado exitosamente!',
    });
    setTimeout(() => setFeedback(null), 4000);
    fetchEmployees();
  };

  const handleClearFilters = () => {
    setSearchTerm('');
    setSelectedRole('');
    setSelectedBranch('');
    setSelectedStatus('');
  };

  // Resumen métrico
  const metrics = useMemo(() => {
    const total = meta.total;
    const activos = employees.filter((e) => e.estado === 'activo').length;
    const conectados = employees.filter((e) => e.conectado).length;
    const administradores = employees.filter((e) => e.id_rol === 1).length;
    const encargados = employees.filter((e) => e.id_rol === 3).length;
    const cajeros = employees.filter((e) => e.id_rol === 4).length;
    return { total, activos, conectados, administradores, encargados, cajeros };
  }, [meta.total, employees]);

  return (
    <div className="employees-page">
      {/* Encabezado */}
      <div className="employees-header">
        <div className="employees-header-title">
          <div className="employees-badge-header">
            <Briefcase size={16} />
            <span>Gestión de Personal & Recursos Humanos</span>
          </div>
          <h1>Gestión de Empleados</h1>
          <p>
            Administra el personal interno de FashionStore, controla sus cuentas de acceso,
            asigna sus roles operativos y vincula sus puestos a sucursales físicas.
          </p>
        </div>

        <div className="employees-header-actions">
          <button
            className="btn-refresh"
            onClick={() => fetchEmployees()}
            disabled={loading}
            title="Recargar datos"
          >
            <RefreshCw size={16} className={loading ? 'spin' : ''} />
            <span>Actualizar</span>
          </button>

          <button className="btn-new-employee" onClick={handleOpenCreate}>
            <UserPlus size={18} />
            <span>Nuevo Empleado</span>
          </button>
        </div>
      </div>

      {/* Alerta de Feedback */}
      {feedback && (
        <div className={`employees-feedback-alert ${feedback.type}`}>
          {feedback.type === 'success' ? (
            <CheckCircle2 size={20} />
          ) : (
            <AlertCircle size={20} />
          )}
          <span>{feedback.message}</span>
        </div>
      )}

      {/* Barra de Métricas */}
      <div className="employees-metrics-bar">
        <div className="emp-metric-card">
          <span className="metric-label">Total Empleados</span>
          <span className="metric-value">{meta.total}</span>
        </div>
        <div className="emp-metric-card online">
          <span className="metric-label">
            <Radio size={14} /> En Línea (Conectados)
          </span>
          <span className="metric-value">{metrics.conectados}</span>
        </div>
        <div className="emp-metric-card admin">
          <span className="metric-label">
            <Shield size={14} /> Administradores
          </span>
          <span className="metric-value">{metrics.administradores}</span>
        </div>
        <div className="emp-metric-card manager">
          <span className="metric-label">
            <Briefcase size={14} /> Encargados de Sucursal
          </span>
          <span className="metric-value">{metrics.encargados}</span>
        </div>
        <div className="emp-metric-card cashier">
          <span className="metric-label">
            <Store size={14} /> Cajeros
          </span>
          <span className="metric-value">{metrics.cajeros}</span>
        </div>
      </div>

      {/* Barra de Filtros */}
      <div className="employees-filters-card">
        <div className="search-box">
          <Search size={18} className="search-icon" />
          <input
            type="text"
            placeholder="Buscar por código, nombre, CI o correo..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="filter-select-group">
          <select
            value={selectedRole}
            onChange={(e) => setSelectedRole(e.target.value ? Number(e.target.value) : '')}
          >
            <option value="">Todos los Roles</option>
            {roles.map((r) => (
              <option key={r.id_rol} value={r.id_rol}>
                {r.nombre}
              </option>
            ))}
          </select>

          <select
            value={selectedBranch}
            onChange={(e) => setSelectedBranch(e.target.value ? Number(e.target.value) : '')}
          >
            <option value="">Todas las Sucursales</option>
            {branches.map((b) => (
              <option key={b.id_sucursal} value={b.id_sucursal}>
                {b.nombre} ({b.ciudad || 'Bolivia'})
              </option>
            ))}
          </select>

          <select
            value={selectedStatus}
            onChange={(e) =>
              setSelectedStatus(e.target.value as 'activo' | 'inactivo' | '')
            }
          >
            <option value="">Todos los Estados</option>
            <option value="activo">Activo</option>
            <option value="inactivo">Inactivo</option>
          </select>

          {(searchTerm || selectedRole !== '' || selectedBranch !== '' || selectedStatus !== '') && (
            <button
              type="button"
              className="btn-clear-filters"
              onClick={handleClearFilters}
              title="Limpiar filtros"
            >
              Limpiar
            </button>
          )}
        </div>
      </div>

      {/* Tabla de Empleados */}
      <div className="employees-table-container">
        {loading ? (
          <div className="employees-loading-state">
            <RefreshCw size={36} className="spin" />
            <p>Cargando información del personal...</p>
          </div>
        ) : employees.length === 0 ? (
          <div className="employees-empty-state">
            <Users size={48} />
            <h3>No se encontraron empleados</h3>
            <p>Intenta ajustar los filtros de búsqueda o registra un nuevo empleado.</p>
            <button className="btn-new-employee small" onClick={handleOpenCreate}>
              <UserPlus size={16} />
              <span>Registrar Empleado</span>
            </button>
          </div>
        ) : (
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
                        onClick={() => handleToggleStatus(emp)}
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
                          onClick={() => handleOpenDetail(emp)}
                          title="Ver ficha completa"
                        >
                          <Eye size={16} />
                        </button>
                        <button
                          type="button"
                          className="btn-action-icon edit"
                          onClick={() => handleOpenEdit(emp)}
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
        )}

        {/* Paginación */}
        {meta.totalPages > 1 && (
          <div className="employees-pagination">
            <span className="pagination-info">
              Mostrando {employees.length} de {meta.total} empleados
            </span>
            <div className="pagination-buttons">
              <button
                type="button"
                className="btn-page"
                disabled={meta.page <= 1}
                onClick={() => fetchEmployees(meta.page - 1)}
              >
                <ChevronLeft size={16} />
                <span>Anterior</span>
              </button>
              <span className="page-number-indicator">
                Página {meta.page} de {meta.totalPages}
              </span>
              <button
                type="button"
                className="btn-page"
                disabled={meta.page >= meta.totalPages}
                onClick={() => fetchEmployees(meta.page + 1)}
              >
                <span>Siguiente</span>
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modal de Creación / Edición */}
      <EmployeeModal
        isOpen={isFormModalOpen}
        onClose={() => setIsFormModalOpen(false)}
        onSuccess={handleFormSuccess}
        employeeToEdit={employeeToEdit}
        branches={branches}
        roles={roles}
      />

      {/* Modal de Detalle */}
      <EmployeeDetailModal
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        employee={employeeToView}
        onEdit={(emp) => handleOpenEdit(emp)}
      />
    </div>
  );
};
export default ManageEmployeesPage;
