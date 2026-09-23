/**
 * @caso-de-uso CU03 — Gestionar contraseña
 * @subsistema Usuarios y Seguridad
 * @capa Boundary — Frontend web
 * @responsabilidad Representa la pantalla principal de Frontend web; compone la interfaz e inicia las acciones del caso de uso.
 * @secuencia Usuario -> formulario de contraseña -> controlador de credenciales -> servicio de recuperación -> Usuario/Token de recuperación.
 */
import React from 'react';
import { useForgotPassword } from '../hooks/useForgotPassword';
import { ForgotPasswordForm } from '../components/ForgotPasswordForm';
import './PasswordManagement.css';

export const ForgotPasswordPage: React.FC = () => {
  const { email, setEmail, loading, error, success, handleSubmit } = useForgotPassword();

  return (
    <div className="password-page-wrapper">
      <ForgotPasswordForm
        email={email}
        loading={loading}
        error={error}
        success={success}
        onEmailChange={setEmail}
        onSubmit={handleSubmit}
      />
    </div>
  );
};

export default ForgotPasswordPage;
