import React from 'react';
import { useRolePermissions } from '../hooks/useRolePermissions';
import { RoleSidebar } from '../components/RoleSidebar';
import { RoleOverviewBanner } from '../components/RoleOverviewBanner';
import { ModuleAccordionItem } from '../components/ModuleAccordionItem';
import { PermissionsActionBar } from '../components/PermissionsActionBar';
import {
  Shield,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
} from 'lucide-react';
import './ManageRolesPage.css';

export const ManageRolesPage: React.FC = () => {
  const {
    roles,
    modulesTree,
    selectedRoleId,
    roleDetail,
    permissionsState,
    loadingRoles,
    loadingDetail,
    saving,
    feedback,
    collapsedModules,
    hasChanges,
    currentMetrics,
    isSuperAdmin,
    loadInitialData,
    loadRoleDetail,
    handleSelectRole,
    toggleFunctionEnabled,
    setAccessLevel,
    handleBatchModule,
    handleReset,
    handleSave,
    toggleCollapseModule,
  } = useRolePermissions();

  return (
    <div className="roles-page">
      {/* Encabezado principal */}
      <div className="roles-header">
        <div className="roles-header-title">
          <div className="roles-badge-header">
            <Shield size={16} />
            <span>Seguridad & Control de Acceso</span>
          </div>
          <h1>Gestión de Roles y Permisos</h1>
          <p>
            Administra los roles del sistema y determina con precisión las funciones y niveles de
            acceso (Lectura / Edición) correspondientes a cada perfil.
          </p>
        </div>

        <button
          className="btn-refresh"
          onClick={() => {
            loadInitialData();
            if (selectedRoleId) loadRoleDetail(selectedRoleId);
          }}
          disabled={loadingRoles || loadingDetail}
          title="Actualizar datos"
        >
          <RefreshCw size={16} className={loadingRoles || loadingDetail ? 'spin' : ''} />
          <span>Actualizar</span>
        </button>
      </div>

      {/* Alertas y notificaciones */}
      {feedback && (
        <div className={`roles-feedback-alert ${feedback.type}`}>
          {feedback.type === 'success' ? (
            <CheckCircle2 size={20} />
          ) : (
            <AlertCircle size={20} />
          )}
          <span>{feedback.message}</span>
        </div>
      )}

      {/* Disposición en 2 columnas */}
      <div className="roles-layout-grid">
        {/* COLUMNA IZQUIERDA: Lista de Roles */}
        <RoleSidebar
          roles={roles}
          selectedRoleId={selectedRoleId}
          loadingRoles={loadingRoles}
          onSelectRole={handleSelectRole}
        />

        {/* COLUMNA DERECHA: Matriz de Permisos */}
        <main className="roles-content-panel">
          {loadingDetail || !roleDetail ? (
            <div className="roles-detail-loading">
              <RefreshCw size={32} className="spin" />
              <p>Cargando configuración de permisos del rol...</p>
            </div>
          ) : (
            <>
              {/* Tarjeta de Resumen del Rol Seleccionado */}
              <RoleOverviewBanner
                roleDetail={roleDetail}
                isSuperAdmin={isSuperAdmin}
                currentMetrics={currentMetrics}
              />

              {/* Módulos y Funciones */}
              <div className="modules-permissions-container">
                {modulesTree.map((modulo) => (
                  <ModuleAccordionItem
                    key={modulo.id_modulo}
                    modulo={modulo}
                    isCollapsed={collapsedModules[modulo.id_modulo] ?? false}
                    isSuperAdmin={isSuperAdmin}
                    permissionsState={permissionsState}
                    onToggleCollapse={toggleCollapseModule}
                    onBatchModule={handleBatchModule}
                    onToggleFunction={toggleFunctionEnabled}
                    onSetAccessLevel={setAccessLevel}
                  />
                ))}
              </div>

              {/* Barra de Guardado Flotante / Sticky */}
              <PermissionsActionBar
                hasChanges={hasChanges}
                saving={saving}
                onReset={handleReset}
                onSave={handleSave}
              />
            </>
          )}
        </main>
      </div>
    </div>
  );
};

export default ManageRolesPage;
