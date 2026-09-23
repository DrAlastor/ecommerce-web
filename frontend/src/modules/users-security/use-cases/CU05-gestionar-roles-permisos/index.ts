/**
 * @caso-de-uso CU05 — Gestionar roles y permisos
 * @subsistema Usuarios y Seguridad
 * @capa Fachada del módulo — Frontend web
 * @responsabilidad Expone la API pública del caso de uso y centraliza sus exportaciones para el resto de la aplicación.
 * @secuencia Administrador -> vista de roles -> controlador de autorización -> servicio de roles -> Rol/Función/Acción/Permisos.
 */
export * from './pages/ManageRolesPage';
export * from './hooks/useRolePermissions';
export * from './components/RoleSidebar';
export * from './components/RoleOverviewBanner';
export * from './components/ModuleAccordionItem';
export * from './components/PermissionsActionBar';
export * from './services/roles.service';
