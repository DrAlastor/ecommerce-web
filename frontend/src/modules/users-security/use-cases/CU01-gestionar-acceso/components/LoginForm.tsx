/**
 * @caso-de-uso CU01 — Gestionar acceso al sistema
 * @subsistema Usuarios y Seguridad
 * @capa Boundary — Frontend web
 * @responsabilidad Implementa una parte reutilizable de la interfaz de Frontend web y comunica eventos al controlador de presentación.
 * @secuencia Usuario -> interfaz de acceso -> controlador de autenticación -> servicio de acceso -> Usuario/Rol/Sesión/Bitácora.
 */
import React from 'react';
import { Link } from 'react-router-dom';

function MailIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="4" width="20" height="16" rx="2" />
      <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
    </svg>
  );
}

function LockIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  );
}

function EyeIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function EyeOffIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10.733 5.076a10.744 10.744 0 0 1 11.205 6.575 1 1 0 0 1 0 .696 10.747 10.747 0 0 1-1.444 2.49" />
      <path d="M14.084 14.158a3 3 0 0 1-4.242-4.242" />
      <path d="M17.479 17.499a10.75 10.75 0 0 1-15.417-5.151 1 1 0 0 1 0-.696 10.75 10.75 0 0 1 4.446-5.143" />
      <path d="m2 2 20 20" />
    </svg>
  );
}

function AlertIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <line x1="12" x2="12" y1="8" y2="12" />
      <line x1="12" x2="12.01" y1="16" y2="16" />
    </svg>
  );
}

interface LoginFormProps {
  email: string;
  setEmail: (val: string) => void;
  password: string;
  setPassword: (val: string) => void;
  showPassword: boolean;
  setShowPassword: (val: boolean) => void;
  isSubmitting: boolean;
  isFormDisabled: boolean;
  emailError: string;
  passwordError: string;
  generalError: string;
  errorType: 'error' | 'warning';
  validateEmail: (val: string) => boolean;
  validatePassword: (val: string) => boolean;
  onSubmit: (e: React.FormEvent) => void;
}

export const LoginForm: React.FC<LoginFormProps> = ({
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
  onSubmit,
}) => {
  return (
    <div className="login-form-panel">
      <div className="login-form-container">
        {/* Back button */}
        <div className="login-back-button-wrapper">
          <Link to="/" className="login-back-button">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 12H5M12 19l-7-7 7-7"/>
            </svg>
            <span>Volver al inicio</span>
          </Link>
        </div>

        {/* Logo móvil */}
        <div className="login-mobile-logo">
          <h1>Dressly</h1>
          <span>Fashion Store</span>
        </div>

        {/* Header */}
        <div className="login-header">
          <h2>Bienvenido de vuelta</h2>
          <p>Inicia sesión para continuar con tu experiencia</p>
        </div>

        {/* Alert de error general */}
        {generalError && (
          <div className={`login-alert login-alert-${errorType}`} role="alert">
            <AlertIcon />
            <span>{generalError}</span>
          </div>
        )}

        {/* Form */}
        <form className="login-form" onSubmit={onSubmit} noValidate>
          {/* Email */}
          <div className="input-group">
            <label htmlFor="login-email" className="input-label">
              Correo electrónico
            </label>
            <div className="input-wrapper">
              <span className="input-icon">
                <MailIcon />
              </span>
              <input
                id="login-email"
                type="email"
                className={`input-field ${emailError ? 'input-error' : ''}`}
                placeholder="tu@correo.com"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (emailError) validateEmail(e.target.value);
                }}
                onBlur={() => { if (email) validateEmail(email); }}
                disabled={isFormDisabled}
                autoComplete="email"
                autoFocus
              />
            </div>
            {emailError && (
              <div className="field-error" role="alert">
                <AlertIcon />
                <span>{emailError}</span>
              </div>
            )}
          </div>

          {/* Password */}
          <div className="input-group">
            <label htmlFor="login-password" className="input-label">
              Contraseña
            </label>
            <div className="input-wrapper">
              <span className="input-icon">
                <LockIcon />
              </span>
              <input
                id="login-password"
                type={showPassword ? 'text' : 'password'}
                className={`input-field ${passwordError ? 'input-error' : ''}`}
                placeholder="Ingresa tu contraseña"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (passwordError) validatePassword(e.target.value);
                }}
                onBlur={() => { if (password) validatePassword(password); }}
                disabled={isFormDisabled}
                autoComplete="current-password"
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowPassword(!showPassword)}
                tabIndex={-1}
                aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
              >
                {showPassword ? <EyeOffIcon /> : <EyeIcon />}
              </button>
            </div>
            {passwordError && (
              <div className="field-error" role="alert">
                <AlertIcon />
                <span>{passwordError}</span>
              </div>
            )}
          </div>

          {/* Forgot password */}
          <div className="forgot-password-wrapper">
            <Link to="/forgot-password" className="login-link">
              ¿Olvidaste tu contraseña?
            </Link>
          </div>

          {/* Submit */}
          <button
            id="login-submit"
            type="submit"
            className="login-submit-btn"
            disabled={isFormDisabled}
          >
            {isSubmitting ? (
              <>
                <span className="login-spinner" />
                <span>Iniciando sesión...</span>
              </>
            ) : (
              'Iniciar sesión'
            )}
          </button>
        </form>

        {/* Register link */}
        <div className="login-divider">o</div>

        <p className="login-register-link">
          ¿No tienes una cuenta?
          <Link to="/register">Crear cuenta</Link>
        </p>
      </div>
    </div>
  );
};
