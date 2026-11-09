/**
 * @caso-de-uso CU27 — Consultar dashboard y reportes
 * @subsistema Reportes y Dashboard
 * @capa Fachada del módulo — Frontend web
 * @responsabilidad Expone la API pública del caso de uso y centraliza sus exportaciones para el resto de la aplicación.
 * @secuencia Administrador o Encargado -> dashboard -> controlador de reportes -> servicio de agregación/exportación -> Ventas/Pagos/Inventario/Reservas/Compras.
 */
export * from './pages/ReportsDashboardPage';
export * from './hooks/useReportsDashboard';
export * from './components/DashboardMetricsGrid';
export * from './components/DashboardCharts';
export * from './components/DashboardQuickTables';
export * from './components/ReportSelectorGrid';
export * from './components/ReportFiltersBar';
export * from './components/ReportPreviewTable';
export * from './services/reports.service';
export * from './types/reports.types';
