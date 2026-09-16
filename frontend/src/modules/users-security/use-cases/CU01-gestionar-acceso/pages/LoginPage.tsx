import React from 'react';
import { useLogin } from '../hooks/useLogin';
import { LoginBrandPanel } from '../components/LoginBrandPanel';
import { LoginForm } from '../components/LoginForm';
import './LoginPage.css';

export const LoginPage: React.FC = () => {
  const {
    email,
    setEmail,
    password,
    setPassword,
    showPassword,
    setShowPassword,
    isSubmitting,
    isFormDisabled,
    emailError,
    passwordError,
    generalError,
    errorType,
    validateEmail,
    validatePassword,
    handleSubmit,
  } = useLogin();

  return (
    <div className="login-page">
      {/* Panel de branding (desktop) */}
      <LoginBrandPanel />

      {/* Panel de formulario interactivo */}
      <LoginForm
        email={email}
        setEmail={setEmail}
        password={password}
        setPassword={setPassword}
        showPassword={showPassword}
        setShowPassword={setShowPassword}
        isSubmitting={isSubmitting}
        isFormDisabled={isFormDisabled}
        emailError={emailError}
        passwordError={passwordError}
        generalError={generalError}
        errorType={errorType}
        validateEmail={validateEmail}
        validatePassword={validatePassword}
        onSubmit={handleSubmit}
      />
    </div>
  );
};

export default LoginPage;
