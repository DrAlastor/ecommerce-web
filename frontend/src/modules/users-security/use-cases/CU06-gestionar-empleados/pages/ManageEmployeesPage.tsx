import React from 'react';
import { useEmployees } from '../hooks/useEmployees';
import { EmployeeMetricsHeader } from '../components/EmployeeMetricsHeader';
import { EmployeeFilterToolbar } from '../components/EmployeeFilterToolbar';
import { EmployeeTable } from '../components/EmployeeTable';
import { EmployeePagination } from '../components/EmployeePagination';
import { EmployeeModal } from '../components/EmployeeModal';
import { EmployeeDetailModal } from '../components/EmployeeDetailModal';
import {
  Briefcase,
  UserPlus,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import './ManageEmployeesPage.css';

export const ManageEmployeesPage: React.FC = () => {
  const {
    employees,
    branches,
    roles,
    meta,
    searchTerm,
    setSearchTerm,
    selectedRole,
    setSelectedRole,
    selectedBranch,
    setSelectedBranch,
    selectedStatus,
    setSelectedStatus,
    loading,
    feedback,
    isFormModalOpen,
    setIsFormModalOpen,
    employeeToEdit,
    isDetailModalOpen,
    setIsDetailModalOpen,
    employeeToView,
    metrics,
    fetchEmployees,
    handleToggleStatus,
    handleOpenCreate,
    handleOpenEdit,
    handleOpenDetail,
    handleFormSuccess,
    handleClearFilters,
  } = useEmployees();

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
      <EmployeeMetricsHeader total={meta.total} metrics={metrics} />

      {/* Barra de Filtros */}
      <EmployeeFilterToolbar
        searchTerm={searchTerm}
        selectedRole={selectedRole}
        selectedBranch={selectedBranch}
        selectedStatus={selectedStatus}
        roles={roles}
        branches={branches}
        onSearchChange={setSearchTerm}
        onRoleChange={setSelectedRole}
        onBranchChange={setSelectedBranch}
        onStatusChange={setSelectedStatus}
        onClearFilters={handleClearFilters}
      />

      {/* Tabla de Empleados */}
      <div className="employees-table-container">
        <EmployeeTable
          employees={employees}
          loading={loading}
          onOpenCreate={handleOpenCreate}
          onOpenDetail={handleOpenDetail}
          onOpenEdit={handleOpenEdit}
          onToggleStatus={handleToggleStatus}
        />

        {/* Paginación */}
        <EmployeePagination
          page={meta.page}
          totalPages={meta.totalPages}
          totalItems={meta.total}
          currentCount={employees.length}
          onPageChange={fetchEmployees}
        />
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
