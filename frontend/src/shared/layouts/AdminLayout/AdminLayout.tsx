import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { AdminSidebar } from './components/AdminSidebar';
import { AdminHeader } from './components/AdminHeader';
import './AdminLayout.css';

export const AdminLayout: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

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
