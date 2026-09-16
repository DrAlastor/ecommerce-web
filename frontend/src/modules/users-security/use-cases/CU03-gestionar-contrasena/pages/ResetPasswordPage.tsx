import React from 'react';
import { useResetPassword } from '../hooks/useResetPassword';
import { ResetPasswordForm } from '../components/ResetPasswordForm';
import '../../CU01-gestionar-acceso/pages/LoginPage.css';

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
    <div className="login-container">
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
