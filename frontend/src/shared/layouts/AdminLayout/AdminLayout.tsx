import React from 'react';
import { Outlet } from 'react-router-dom';
import { AdminSidebar } from './components/AdminSidebar';
import { AdminHeader } from './components/AdminHeader';
import './AdminLayout.css';

export const AdminLayout: React.FC = () => {
  return (
    <div className="admin-layout">
      <AdminSidebar />
      <div className="admin-main-wrapper">
        <AdminHeader />
        <main className="admin-main-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
