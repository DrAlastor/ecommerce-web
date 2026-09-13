import React, { useState } from 'react';
import { useAuth } from '../../../../modules/users-security/shared/components/AuthContext';
import { LogOut, User, ChevronDown } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const AdminHeader: React.FC = () => {
  const { user, rol, logout } = useAuth();
  const navigate = useNavigate();
  const [showDropdown, setShowDropdown] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="admin-header">
      <div className="admin-header-search">
        {/* Aquí iría un buscador global si fuera necesario */}
      </div>

      <div className="admin-header-actions">
        <div 
          className="admin-user-profile" 
          onClick={() => setShowDropdown(!showDropdown)}
        >
          <div className="admin-avatar">
            <User size={20} color="#666" />
          </div>
          <div className="admin-user-info">
            <span className="admin-user-name">{user?.empleado?.nombre || user?.email}</span>
            <span className="admin-user-role">{rol?.nombre}</span>
          </div>
          <ChevronDown size={16} color="#666" />

          {showDropdown && (
            <div className="admin-dropdown">
              <div className="admin-dropdown-item" onClick={() => navigate('/profile')}>
                <User size={16} />
                <span>Mi Perfil</span>
              </div>
              <div className="admin-dropdown-divider" />
              <div className="admin-dropdown-item text-danger" onClick={handleLogout}>
                <LogOut size={16} />
                <span>Cerrar Sesión</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
