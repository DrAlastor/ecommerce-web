import React, { useEffect, useState } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { saasService } from '../../../modules/saas/services/saas.service';
import type { SaasSuperAdminUser } from '../../../modules/saas/types/saas.types';
import {
  Activity,
  Server,
  Building2,
  Clock,
  HardDrive,
  CreditCard,
  LogOut,
  ExternalLink,
  ShieldCheck,
  Menu,
  X,
  Store,
  ChevronRight,
  Globe,
} from 'lucide-react';
import './SaasAdminLayout.css';

export const SaasAdminLayout: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [user, setUser] = useState<SaasSuperAdminUser | null>(saasService.getStoredSuperAdmin());
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    // Verificar sesión Super Admin estricta
    const token = localStorage.getItem('saas_token');
    if (!token) {
      navigate('/saas/login');
      return;
    }

    saasService
      .getSuperAdminProfile()
      .then((profile) => {
        if (profile.rolGlobal !== 'SUPER_ADMIN') {
          saasService.logoutSuperAdmin();
          navigate('/saas/login');
          return;
        }
        setUser(profile);
      })
      .catch(() => {
        saasService.logoutSuperAdmin();
        navigate('/saas/login');
      });
  }, [navigate]);

  const handleLogout = () => {
    saasService.logoutSuperAdmin();
    navigate('/');
  };

  const getPageTitle = () => {
    const path = location.pathname.toLowerCase();
    if (path.includes('dashboard')) return 'Dashboard Analítico Super Admin';
    if (path.includes('monitoring')) return 'Monitoreo de Infraestructura & Tenants';
    if (path.includes('plans')) return 'Planes de Suscripción';
    if (path.includes('tenants')) return 'Gestión de Tenants & Clientes';
    if (path.includes('bitacora')) return 'Bitácora de Auditoría Consolidada';
    if (path.includes('backups')) return 'Gestión de Backups & Restore';
    return 'Consola Super Administrador';
  };

  return (
    <div className="saas-admin-layout">
      {/* Backdrop móvil */}
      {sidebarOpen && (
        <div
          className="saas-sidebar-backdrop"
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Sidebar Izquierda al estilo interno del sistema */}
      <aside className={`saas-admin-sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="saas-sidebar-header">
          <div className="saas-logo" onClick={() => navigate('/saas-admin/dashboard')}>
            <img 
              src="https://fashionstorestorages.blob.core.windows.net/media/logo-fashionstore.png" 
              onError={(e) => { e.currentTarget.src = '/logo-fashionstore.png'; }}
              alt="FashionStore Logo" 
              className="saas-logo-badge-img" 
            />
            <div className="logo-texts">
              <span className="logo-title">FashionStore</span>
              <span className="logo-subtitle">SAAS ADMIN</span>
            </div>
          </div>
          <button
            type="button"
            className="saas-sidebar-close-btn"
            onClick={() => setSidebarOpen(false)}
            aria-label="Cerrar menú"
          >
            <X size={18} />
          </button>
        </div>

        <div className="saas-sidebar-menu">
          <span className="saas-sidebar-label">MENÚ PRINCIPAL</span>
          <nav className="saas-nav-list">
            <NavLink
              to="/saas-admin/dashboard"
              end
              className={({ isActive }) => `saas-nav-item ${isActive ? 'active' : ''}`}
              onClick={() => setSidebarOpen(false)}
            >
              <Activity size={18} className="nav-icon" />
              <span>Dashboard Analítico</span>
            </NavLink>

            <NavLink
              to="/saas-admin/monitoring"
              className={({ isActive }) => `saas-nav-item ${isActive ? 'active' : ''}`}
              onClick={() => setSidebarOpen(false)}
            >
              <Server size={18} className="nav-icon" />
              <span>Monitoreo de Tenants</span>
            </NavLink>

            <NavLink
              to="/saas-admin/plans"
              className={({ isActive }) => `saas-nav-item ${isActive ? 'active' : ''}`}
              onClick={() => setSidebarOpen(false)}
            >
              <CreditCard size={18} className="nav-icon" />
              <span>Planes de Suscripción</span>
            </NavLink>

            <NavLink
              to="/saas-admin/tenants"
              className={({ isActive }) => `saas-nav-item ${isActive ? 'active' : ''}`}
              onClick={() => setSidebarOpen(false)}
            >
              <Building2 size={18} className="nav-icon" />
              <span>Gestión de Tenants</span>
            </NavLink>

            <NavLink
              to="/saas-admin/bitacora"
              className={({ isActive }) => `saas-nav-item ${isActive ? 'active' : ''}`}
              onClick={() => setSidebarOpen(false)}
            >
              <Clock size={18} className="nav-icon" />
              <span>Bitácora de Auditoría</span>
            </NavLink>

            <NavLink
              to="/saas-admin/backups"
              className={({ isActive }) => `saas-nav-item ${isActive ? 'active' : ''}`}
              onClick={() => setSidebarOpen(false)}
            >
              <HardDrive size={18} className="nav-icon" />
              <span>Backups & Restore</span>
            </NavLink>
          </nav>
        </div>

        <div className="saas-sidebar-footer">
          <span className="saas-sidebar-label">SISTEMA & TIENDAS</span>
          <nav className="saas-nav-list">
            <a
              href="/store/dressly"
              target="_blank"
              rel="noreferrer"
              className="saas-nav-item"
              title="Abrir tienda de demostración"
            >
              <Store size={18} className="nav-icon" />
              <span>Ver Tienda Dressly</span>
              <ExternalLink size={13} style={{ marginLeft: 'auto', opacity: 0.5 }} />
            </a>

            <a
              href="/"
              className="saas-nav-item"
              title="Volver a la landing page principal"
            >
              <Globe size={18} className="nav-icon" />
              <span>Landing Page SaaS</span>
            </a>

            <button
              type="button"
              className="saas-nav-item btn-logout"
              onClick={handleLogout}
            >
              <LogOut size={18} className="nav-icon" />
              <span>Cerrar Sesión</span>
            </button>
          </nav>
        </div>
      </aside>

      {/* Contenido Principal con Header Superior */}
      <div className="saas-main-wrapper">
        <header className="saas-top-header">
          <div className="header-left-group">
            <button
              type="button"
              className="btn-menu-trigger"
              onClick={() => setSidebarOpen(!sidebarOpen)}
              aria-label="Alternar menú"
            >
              <Menu size={20} />
            </button>
            <div className="header-breadcrumbs">
              <span className="breadcrumb-root">SaaS Admin</span>
              <ChevronRight size={14} className="breadcrumb-separator" />
              <span className="breadcrumb-current">{getPageTitle()}</span>
            </div>
          </div>

          <div className="header-right-group">
            <div className="azure-pill">
              <span className="azure-dot" />
              <span>PostgreSQL Flexible Server · Activo</span>
            </div>

            <div className="user-badge">
              <div className="user-avatar">
                <ShieldCheck size={16} />
              </div>
              <div className="user-details">
                <span className="user-full-name">
                  {user?.nombre ? `${user.nombre} ${user.apellido}` : 'Super Administrador'}
                </span>
                <span className="user-role">SUPER ADMIN</span>
              </div>
            </div>

            <button
              type="button"
              className="btn-quick-logout"
              onClick={handleLogout}
              title="Cerrar sesión de Super Administrador"
            >
              <LogOut size={16} />
            </button>
          </div>
        </header>

        <main className="saas-main-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
