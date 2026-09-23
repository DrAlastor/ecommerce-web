/**
 * @caso-de-uso CU03 — Gestionar contraseña
 * @subsistema Usuarios y Seguridad
 * @capa Boundary — Frontend web
 * @responsabilidad Representa la pantalla principal de Frontend web; compone la interfaz e inicia las acciones del caso de uso.
 * @secuencia Usuario -> formulario de contraseña -> controlador de credenciales -> servicio de recuperación -> Usuario/Token de recuperación.
 */
import React from 'react';
import { useResetPassword } from '../hooks/useResetPassword';
import { ResetPasswordForm } from '../components/ResetPasswordForm';
import './PasswordManagement.css';

export const ResetPasswordPage: React.FC = () => {
  const {
    token,
    setToken,
    emailParam,
    newPassword,
    setNewPassword,
    confirmPassword,
    setConfirmPassword,
    loading,
    error,
    success,
    handleSubmit,
  } = useResetPassword();

  return (
    <div className="password-page-wrapper">
      <ResetPasswordForm
        token={token}
        emailParam={emailParam}
        newPassword={newPassword}
        confirmPassword={confirmPassword}
        loading={loading}
        error={error}
        success={success}
        onTokenChange={setToken}
        onNewPasswordChange={setNewPassword}
        onConfirmPasswordChange={setConfirmPassword}
        onSubmit={handleSubmit}
      />
    </div>
  );
};

export default ResetPasswordPage;
