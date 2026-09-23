/**
 * @caso-de-uso CU03 — Gestionar contraseña
 * @subsistema Usuarios y Seguridad
 * @capa Fachada del módulo — Frontend web
 * @responsabilidad Expone la API pública del caso de uso y centraliza sus exportaciones para el resto de la aplicación.
 * @secuencia Usuario -> formulario de contraseña -> controlador de credenciales -> servicio de recuperación -> Usuario/Token de recuperación.
 */
export * from './pages/ForgotPasswordPage';
export * from './pages/ResetPasswordPage';
export * from './hooks/useForgotPassword';
export * from './hooks/useResetPassword';
export * from './components/ForgotPasswordForm';
export * from './components/ResetPasswordForm';
