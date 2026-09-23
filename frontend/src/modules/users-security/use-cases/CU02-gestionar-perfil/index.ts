/**
 * @caso-de-uso CU02 — Registrar y gestionar perfil de cliente
 * @subsistema Usuarios y Seguridad
 * @capa Fachada del módulo — Frontend web
 * @responsabilidad Expone la API pública del caso de uso y centraliza sus exportaciones para el resto de la aplicación.
 * @secuencia Cliente -> formulario de perfil -> controlador de perfil -> servicio de clientes -> Usuario/Cliente/Rol.
 */
export * from './pages/ProfilePage';
export * from './pages/RegisterPage';
export * from './hooks/useProfile';
export * from './hooks/useRegister';
export * from './components/ProfileForm';
export * from './components/ChangePasswordCard';
export * from './components/RegisterForm';
