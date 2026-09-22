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
