/**
 * @caso-de-uso CU01 — Gestionar acceso al sistema
 * @subsistema Usuarios y Seguridad
 * @capa Boundary — Frontend web
 * @responsabilidad Representa la pantalla principal de Frontend web; compone la interfaz e inicia las acciones del caso de uso.
 * @secuencia Usuario -> interfaz de acceso -> controlador de autenticación -> servicio de acceso -> Usuario/Rol/Sesión/Bitácora.
 */
import React, { useEffect } from 'react';
import { useParams, useLocation } from 'react-router-dom';
import { useLogin } from '../hooks/useLogin';
import { LoginBrandPanel } from '../components/LoginBrandPanel';
import { LoginForm } from '../components/LoginForm';
import './LoginPage.css';

export const LoginPage: React.FC = () => {
  const params = useParams<{ tenant?: string }>();
  const location = useLocation();

  const rawTenant = params.tenant || 
    (location.pathname.startsWith('/store/') ? location.pathname.split('/')[2] : 
     (localStorage.getItem('tenantKey') || 'urbanly'));

  const currentTenant = rawTenant === 'subversive-urban' || rawTenant === 'subversive'
    ? 'urbanly'
    : (rawTenant === 'aura' ? 'aura-sport' : rawTenant);

  useEffect(() => {
    localStorage.setItem('tenantKey', currentTenant);
  }, [currentTenant]);

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
      <LoginBrandPanel tenant={currentTenant} />

      {/* Panel de formulario interactivo */}
      <LoginForm
        tenant={currentTenant}
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
