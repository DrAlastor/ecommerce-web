import React, { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { AdminSidebar } from './components/AdminSidebar';
import { AdminHeader } from './components/AdminHeader';
import { appearanceService } from '../../../modules/users-security/use-cases/CU08-personalizar-apariencia/services/appearance.service';
import './AdminLayout.css';

export const AdminLayout: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    // Asegurar que la barra lateral conserve su color claro original
    document.documentElement.style.removeProperty('--admin-sidebar-bg');

    const tenantKey = localStorage.getItem('tenantKey') || 'dressly';
    appearanceService.getAppearance(tenantKey).then((data) => {
      if (data) {
        if (data.primary_color) {
          document.documentElement.style.setProperty('--color-primary', data.primary_color);
        }
        if (data.secondary_color) {
          document.documentElement.style.setProperty('--color-secondary', data.secondary_color);
        }
        if (data.font_family) {
          document.documentElement.style.setProperty('--font-display', data.font_family);
        }
      }
    }).catch((err) => console.warn('Usando variables admin predeterminadas:', err));
  }, []);

  return (
    <div className="admin-layout">
      {sidebarOpen && (
        <div 
          className="admin-sidebar-backdrop" 
          onClick={() => setSidebarOpen(false)} 
          aria-hidden="true"
        />
      )}
      <AdminSidebar 
        isOpen={sidebarOpen} 
        onClose={() => setSidebarOpen(false)} 
      />
      <div className="admin-main-wrapper">
        <AdminHeader 
          onToggleSidebar={() => setSidebarOpen(prev => !prev)} 
        />
        <main className="admin-main-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
