/**
 * @caso-de-uso CU07 — Consultar bitácora
 * @subsistema Usuarios y Seguridad
 * @capa Fachada del módulo — Frontend web
 * @responsabilidad Expone la API pública del caso de uso y centraliza sus exportaciones para el resto de la aplicación.
 * @secuencia Administrador -> vista de bitácora -> controlador de auditoría -> servicio de bitácora -> Bitácora/Usuario.
 */
export * from './pages/BitacoraPage';
export * from './hooks/useBitacora';
export * from './components/BitacoraStats';
export * from './components/BitacoraTable';
export * from './components/BitacoraPagination';
export * from './services/bitacora.service';
