/**
 * @caso-de-uso Módulo heredado — Gestión de devoluciones
 * @subsistema Ventas, Pagos y Compras
 * @capa Fachada del módulo — Frontend web
 * @responsabilidad Expone la API pública del caso de uso y centraliza sus exportaciones para el resto de la aplicación.
 * @secuencia Usuario autorizado -> vista de devoluciones -> controlador -> servicio de devoluciones -> Devolución/DetalleDevolución/Venta/Inventario.
 * Nota: módulo heredado; su numeración no corresponde al catálogo oficial de CU del informe.
 */
export * from './types/returns.types';
export * from './services/returns.api';
export * from './components/RequestReturnModal';
export * from './pages/ManageReturnsPage';
