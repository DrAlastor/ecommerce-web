import React from 'react';
import type { RoleItem } from '../services/roles.service';
import { Shield, ShieldCheck, Users, Sliders } from 'lucide-react';

interface RoleSidebarProps {
  roles: RoleItem[];
  selectedRoleId: number | null;
  loadingRoles: boolean;
  onSelectRole: (roleId: number) => void;
}

export const RoleSidebar: React.FC<RoleSidebarProps> = ({
  roles,
  selectedRoleId,
  loadingRoles,
  onSelectRole,
}) => {
  return (
    <aside className="roles-sidebar-panel">
      <div className="roles-sidebar-header">
        <h3>Roles del Sistema</h3>
        <span className="roles-count-tag">{roles.length} roles</span>
      </div>

      <div className="roles-list-cards">
        {loadingRoles ? (
          <div className="roles-loading-skeleton">
            <div className="skeleton-card" />
            <div className="skeleton-card" />
            <div className="skeleton-card" />
          </div>
        ) : (
          roles.map((r) => {
            const isSelected = r.id_rol === selectedRoleId;
            return (
              <div
                key={r.id_rol}
                className={`role-item-card ${isSelected ? 'selected' : ''}`}
                onClick={() => onSelectRole(r.id_rol)}
              >
                <div className="role-card-top">
                  <div className="role-card-icon">
                    {r.id_rol === 1 ? (
                      <ShieldCheck size={20} />
                    ) : r.nombre.toLowerCase().includes('cliente') ? (
                      <Users size={20} />
                    ) : (
                      <Shield size={20} />
                    )}
                  </div>
                  <span className="role-card-id">Rol #{r.id_rol}</span>
                </div>

                <h4 className="role-card-name">{r.nombre}</h4>
                <p className="role-card-desc">
                  {r.permiso || 'Permisos configurados por función y módulo'}
                </p>

                <div className="role-card-footer">
                  <span className="role-metric-item">
                    <Users size={14} />
                    {r.total_usuarios} {r.total_usuarios === 1 ? 'usuario' : 'usuarios'}
                  </span>
                  <span className="role-metric-item">
                    <Sliders size={14} />
                    {r.total_funciones} funciones
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>
    </aside>
  );
};
