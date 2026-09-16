import { useState, useEffect, useCallback } from 'react';
import { usersService, type UserListParams } from '../services/users.service';

export function useUsers() {
  const [users, setUsers] = useState<any[]>([]);
  const [meta, setMeta] = useState({ total: 0, page: 1, limit: 10, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [params, setParams] = useState<UserListParams>({ page: 1, limit: 10 });
  const [selectedUser, setSelectedUser] = useState<any>(null);

  const fetchUsers = useCallback(async () => {
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
  }, [params]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleSearch = (searchVal: string) => {
    setParams((prev) => ({ ...prev, search: searchVal.trim() || undefined, page: 1 }));
  };

  const handleFilterRole = (roleVal: string) => {
    const roleId = roleVal ? Number(roleVal) : undefined;
    setParams((prev) => ({ ...prev, role: roleId, page: 1 }));
  };

  const handleFilterStatus = (statusVal: string) => {
    setParams((prev) => ({ ...prev, status: statusVal || undefined, page: 1 }));
  };

  const handlePageChange = (newPage: number) => {
    setParams((prev) => ({ ...prev, page: newPage }));
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

  return {
    users,
    meta,
    loading,
    params,
    selectedUser,
    setSelectedUser,
    fetchUsers,
    handleSearch,
    handleFilterRole,
    handleFilterStatus,
    handlePageChange,
    openUserDetail,
    handleUpdateStatus,
    handleUpdateAdminData,
  };
}
