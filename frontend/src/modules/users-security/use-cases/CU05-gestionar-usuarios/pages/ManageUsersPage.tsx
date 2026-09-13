import React, { useEffect, useState } from 'react';
import { usersService, type UserListParams } from '../services/users.service';
import { UserDetailModal } from '../components/UserDetailModal';
import './ManageUsersPage.css';

export function ManageUsersPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [meta, setMeta] = useState({ total: 0, page: 1, limit: 10, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [params, setParams] = useState<UserListParams>({ page: 1, limit: 10 });
  const [selectedUser, setSelectedUser] = useState<any>(null);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const response = await usersService.getUsers(params);
      setUsers(response.data);
      setMeta(response.meta);
    } catch (error) {
      console.error('Error loading users:', error);
      alert('Error cargando los usuarios.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [params]);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setParams({ ...params, search: e.target.value, page: 1 });
  };

  const handleFilterRole = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const roleId = e.target.value ? Number(e.target.value) : undefined;
    setParams({ ...params, role: roleId, page: 1 });
  };

  const handleFilterStatus = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setParams({ ...params, status: e.target.value || undefined, page: 1 });
  };

  const openUserDetail = async (id: number) => {
    try {
      const detail = await usersService.getUser(id);
      setSelectedUser(detail);
    } catch (error) {
      console.error(error);
      alert('No se pudo obtener el detalle del usuario');
    }
  };

  const handleUpdateStatus = async (id: number, status: string) => {
    if (!confirm(`¿Estás seguro de ${status === 'activo' ? 'activar' : 'desactivar'} esta cuenta?`)) return;
    try {
      await usersService.updateStatus(id, status);
      alert(`La cuenta ha sido cambiada a estado ${status}`);
      setSelectedUser(null);
      fetchUsers();
    } catch (error: any) {
      alert(error.response?.data?.message || 'Error al cambiar estado');
    }
  };

  const handleUpdateAdminData = async (id: number, data: { email?: string; id_rol?: number }) => {
    try {
      await usersService.updateUserAdminData(id, data);
      alert('Datos administrativos actualizados correctamente');
      setSelectedUser(null);
      fetchUsers();
    } catch (error: any) {
      alert(error.response?.data?.message || 'Error al actualizar usuario');
    }
  };

  return (
    <div className="manage-users-page">
      <div className="page-header">
        <h1>Gestión de Usuarios</h1>
        <p>Administra las cuentas del sistema, clientes y empleados.</p>
      </div>

      <div className="filters-bar">
        <input 
          type="text" 
          placeholder="Buscar por email, nombre o CI..." 
          onChange={handleSearch}
          className="search-input"
        />
        <select onChange={handleFilterRole} className="filter-select">
          <option value="">Todos los Roles</option>
          <option value="1">Administrador</option>
          <option value="2">Encargado de Sucursal</option>
          <option value="3">Cajero</option>
          <option value="4">Cliente</option>
        </select>
        <select onChange={handleFilterStatus} className="filter-select">
          <option value="">Todos los Estados</option>
          <option value="activo">Activos</option>
          <option value="inactivo">Inactivos</option>
        </select>
      </div>

      {loading ? (
        <div className="loading-state">Cargando usuarios...</div>
      ) : (
        <div className="table-container">
          <table className="users-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Email</th>
                <th>Perfil</th>
                <th>Rol</th>
                <th>Estado</th>
                <th>Sesión</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {users.length === 0 ? (
                <tr>
                  <td colSpan={7} className="empty-state">No se encontraron usuarios.</td>
                </tr>
              ) : (
                users.map(u => (
                  <tr key={u.id_usuario}>
                    <td>#{u.id_usuario}</td>
                    <td>{u.email}</td>
                    <td>{u.perfil ? `${u.perfil.nombre} ${u.perfil.apellido}` : 'Sin perfil'} ({u.tipo})</td>
                    <td><span className={`role-badge role-${u.id_rol}`}>{u.rol}</span></td>
                    <td><span className={`status-badge status-${u.estado}`}>{u.estado}</span></td>
                    <td>
                      <span className={`connection-pill small ${u.conectado ? 'online' : 'offline'}`}>
                        <span className="connection-dot" />
                        {u.conectado ? 'Conectado' : 'Desconectado'}
                      </span>
                    </td>
                    <td>
                      <button className="btn-action" onClick={() => openUserDetail(u.id_usuario)}>
                        Gestionar
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      <div className="pagination-controls">
        <button 
          disabled={params.page === 1} 
          onClick={() => setParams({ ...params, page: (params.page || 1) - 1 })}
        >
          Anterior
        </button>
        <span>Página {meta.page} de {meta.totalPages} (Total: {meta.total})</span>
        <button 
          disabled={params.page === meta.totalPages} 
          onClick={() => setParams({ ...params, page: (params.page || 1) + 1 })}
        >
          Siguiente
        </button>
      </div>

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
}
