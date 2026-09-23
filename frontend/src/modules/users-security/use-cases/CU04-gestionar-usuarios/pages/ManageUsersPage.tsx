/**
 * @caso-de-uso CU04 — Gestionar usuarios
 * @subsistema Usuarios y Seguridad
 * @capa Boundary — Frontend web
 * @responsabilidad Representa la pantalla principal de Frontend web; compone la interfaz e inicia las acciones del caso de uso.
 * @secuencia Administrador -> vista de usuarios -> controlador de usuarios -> servicio de usuarios -> Usuario/Rol/Bitácora.
 */
import React from 'react';
import { useUsers } from '../hooks/useUsers';
import { UserFilterBar } from '../components/UserFilterBar';
import { UserTable } from '../components/UserTable';
import { UserPagination } from '../components/UserPagination';
import { UserDetailModal } from '../components/UserDetailModal';
import './ManageUsersPage.css';

export const ManageUsersPage: React.FC = () => {
  const {
    users,
    meta,
    loading,
    params,
    selectedUser,
    setSelectedUser,
    handleSearch,
    handleFilterRole,
    handleFilterStatus,
    handlePageChange,
    openUserDetail,
    handleUpdateStatus,
    handleUpdateAdminData,
  } = useUsers();

  return (
    <div className="manage-users-page">
      <div className="page-header">
        <h1>Gestión de Usuarios</h1>
        <p>Administra las cuentas del sistema, clientes y empleados.</p>
      </div>

      <UserFilterBar
        onSearch={handleSearch}
        onFilterRole={handleFilterRole}
        onFilterStatus={handleFilterStatus}
      />

      <UserTable
        users={users}
        loading={loading}
        onOpenDetail={openUserDetail}
      />

      <UserPagination
        page={params.page || 1}
        totalPages={meta.totalPages}
        total={meta.total}
        onPageChange={handlePageChange}
      />

      {/* Modal de Detalle */}
      {selectedUser && (
        <UserDetailModal
          isOpen={!!selectedUser}
          user={selectedUser}
          onClose={() => setSelectedUser(null)}
          onChangeStatus={handleUpdateStatus}
          onUpdate={handleUpdateAdminData}
        />
      )}
    </div>
  );
};

export default ManageUsersPage;
