/**
 * @caso-de-uso CU06 — Gestionar empleados
 * @subsistema Usuarios y Seguridad
 * @capa Fachada del módulo — Frontend web
 * @responsabilidad Expone la API pública del caso de uso y centraliza sus exportaciones para el resto de la aplicación.
 * @secuencia Administrador -> formulario de empleados -> controlador de empleados -> servicio de empleados -> Usuario/Empleado/Rol/Sucursal.
 */
export * from './pages/ManageEmployeesPage';
export * from './hooks/useEmployees';
export * from './components/EmployeeMetricsHeader';
export * from './components/EmployeeFilterToolbar';
export * from './components/EmployeeTable';
export * from './components/EmployeePagination';
export * from './components/EmployeeModal';
export * from './components/EmployeeDetailModal';
export * from './services/empleados.service';
