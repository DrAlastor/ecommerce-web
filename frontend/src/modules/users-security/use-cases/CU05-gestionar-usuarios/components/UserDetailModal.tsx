import React, { useState } from 'react';
import './UserDetailModal.css';

interface UserDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: any;
  onUpdate: (id: number, data: { email?: string; id_rol?: number }) => Promise<void>;
  onChangeStatus: (id: number, status: string) => Promise<void>;
}

export function UserDetailModal({ isOpen, onClose, user, onUpdate, onChangeStatus }: UserDetailModalProps) {
  const [email, setEmail] = useState(user?.email || '');
  const [roleId, setRoleId] = useState(user?.id_rol || '');
  const [isUpdating, setIsUpdating] = useState(false);

  if (!isOpen || !user) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUpdating(true);
    await onUpdate(user.id_usuario, { email, id_rol: Number(roleId) });
    setIsUpdating(false);
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="modal-header">
          <h2>Detalles de Usuario</h2>
          <button className="close-button" onClick={onClose}>×</button>
        </div>
        
        <div className="modal-body">
          <div className="user-profile-info">
            <div className="info-group">
              <label>Perfil de Empleado/Cliente</label>
              <p>{user.tipo === 'empleado' ? 'Empleado' : (user.tipo === 'cliente' ? 'Cliente' : 'Sin perfil')}</p>
            </div>
            <div className="info-group">
              <label>Estado de Sesión / Conexión</label>
              <p>
                <span className={`connection-pill small ${user.conectado ? 'online' : 'offline'}`}>
                  <span className="connection-dot" />
                  {user.conectado ? 'Conectado (En línea)' : 'Desconectado'}
                </span>
              </p>
            </div>
            {user.perfil && (
              <>
                <div className="info-group">
                  <label>Nombre</label>
                  <p>{user.perfil.nombre} {user.perfil.apellido}</p>
                </div>
                <div className="info-group">
                  <label>CI / Documento</label>
                  <p>{user.perfil.ci || 'N/A'}</p>
                </div>
              </>
            )}
          </div>

          <form onSubmit={handleSubmit} className="user-edit-form">
            <h3>Información Administrativa</h3>
            <div className="form-group">
              <label>Correo Electrónico</label>
              <input 
                type="email" 
                value={email} 
                onChange={e => setEmail(e.target.value)} 
                required 
              />
            </div>
            <div className="form-group">
              <label>Rol del Sistema</label>
              <select value={roleId} onChange={e => setRoleId(e.target.value)} required>
                <option value="1">Administrador</option>
                <option value="2">Encargado de Sucursal</option>
                <option value="3">Cajero</option>
                <option value="4">Cliente</option>
              </select>
            </div>
            <div className="modal-actions">
              <button 
                type="button" 
                className={`btn-status ${user.estado === 'activo' ? 'btn-danger' : 'btn-success'}`}
                onClick={() => onChangeStatus(user.id_usuario, user.estado === 'activo' ? 'inactivo' : 'activo')}
              >
                {user.estado === 'activo' ? 'Desactivar Cuenta' : 'Activar Cuenta'}
              </button>
              <button type="submit" className="btn-primary" disabled={isUpdating}>
                {isUpdating ? 'Guardando...' : 'Guardar Cambios'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
