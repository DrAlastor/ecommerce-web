/**
 * @caso-de-uso CU04 — Gestionar usuarios
 * @subsistema Usuarios y Seguridad
 * @capa Boundary — Frontend web
 * @responsabilidad Implementa una parte reutilizable de la interfaz de Frontend web y comunica eventos al controlador de presentación.
 * @secuencia Administrador -> vista de usuarios -> controlador de usuarios -> servicio de usuarios -> Usuario/Rol/Bitácora.
 */
import React from 'react';

interface UserTableProps {
  users: any[];
  loading: boolean;
  onOpenDetail: (id: number) => void;
}

export const UserTable: React.FC<UserTableProps> = ({ users, loading, onOpenDetail }) => {
  if (loading) {
    return <div className="loading-state">Cargando usuarios...</div>;
  }

  return (
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
            users.map((u) => (
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
                  <button className="btn-action" onClick={() => onOpenDetail(u.id_usuario)}>
                    Gestionar
                  </button>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
};
