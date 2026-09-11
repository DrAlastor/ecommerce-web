import { useState, useCallback, type FormEvent } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../../shared/components/AuthContext';

import type { AxiosError } from 'axios';
import './LoginPage.css';

// ---- Inline SVG Icons ----
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

function ShieldIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  );
}

function TruckIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2" />
      <path d="M15 18H9" />
      <path d="M19 18h2a1 1 0 0 0 1-1v-3.65a1 1 0 0 0-.22-.624l-3.48-4.35A1 1 0 0 0 17.52 8H14" />
      <circle cx="17" cy="18" r="2" />
      <circle cx="7" cy="18" r="2" />
    </svg>
  );
}

function HeartIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
    </svg>
  );
}

// ---- Helpers ----
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function getRoleRedirectPath(roleName: string): string {
  const normalized = roleName.toLowerCase();
  switch (normalized) {
    case 'administrador':
      return '/admin';
    case 'encargado de sucursal':
    case 'encargado':
      return '/admin/branches';
    case 'cajero':
      return '/pos';
    case 'cliente':
    default:
      return '/';
  }
}

// ---- Component ----
export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, isLoading: authLoading } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Error states
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [generalError, setGeneralError] = useState('');
  const [errorType, setErrorType] = useState<'error' | 'warning'>('error');

  // Validación en tiempo real
  const validateEmail = useCallback((value: string) => {
    if (!value.trim()) {
      setEmailError('El correo electrónico es obligatorio');
      return false;
    }
    if (!EMAIL_REGEX.test(value.trim())) {
      setEmailError('El formato del correo electrónico no es válido');
      return false;
    }
    setEmailError('');
    return true;
  }, []);

  const validatePassword = useCallback((value: string) => {
    if (!value) {
      setPasswordError('La contraseña es obligatoria');
      return false;
    }
    if (value.length < 6) {
      setPasswordError('La contraseña debe tener al menos 6 caracteres');
      return false;
    }
    setPasswordError('');
    return true;
  }, []);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setGeneralError('');

    const isEmailValid = validateEmail(email);
    const isPasswordValid = validatePassword(password);

    if (!isEmailValid || !isPasswordValid) return;

    setIsSubmitting(true);

    try {
      await login({ email: email.trim().toLowerCase(), password });

      // Redirigir a la página anterior o según el rol
      const from = (location.state as { from?: { pathname: string } })?.from?.pathname;

      // Obtener el rol del localStorage para redirección
      const stored = localStorage.getItem('authUser');
      if (stored) {
        const { rol } = JSON.parse(stored);
        const redirectPath = from || getRoleRedirectPath(rol.nombre);
        navigate(redirectPath, { replace: true });
      } else {
        navigate('/', { replace: true });
      }
    } catch (err: unknown) {
      const axiosError = err as AxiosError<{ message?: string; statusCode?: number }>;

      if (axiosError.response) {
        const { status, data } = axiosError.response;

        if (status === 403) {
          setErrorType('warning');
          setGeneralError(data?.message || 'La cuenta se encuentra desactivada');
        } else if (status === 401) {
          setErrorType('error');
          setGeneralError('Credenciales inválidas. Verifica tu correo y contraseña.');
        } else if (status === 400) {
          setErrorType('error');
          const message = Array.isArray(data?.message)
            ? data.message[0]
            : data?.message || 'Datos incompletos o inválidos';
          setGeneralError(message);
        } else {
          setErrorType('error');
          setGeneralError('Error interno del servidor. Inténtalo más tarde.');
        }
      } else if (axiosError.request) {
        setErrorType('error');
        setGeneralError('Error de conexión. Verifica tu conexión a internet.');
      } else {
        setErrorType('error');
        setGeneralError('Ocurrió un error inesperado. Inténtalo de nuevo.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const isFormDisabled = isSubmitting || authLoading;

  return (
    <div className="login-page">
      {/* Panel de branding (desktop) */}
      <div className="login-brand-panel">
        <div className="brand-content">
          <div className="brand-logo">Dressly</div>
          <div className="brand-tagline">Fashion Store</div>

          <div className="brand-decorative-line" />

          <h1 className="brand-headline">
            Elevate Your<br />
            Everyday Style
          </h1>

          <p className="brand-description">
            Descubre piezas atemporales diseñadas con confort,
            pensadas con elegancia, creadas para ti.
          </p>

          <div className="brand-features">
            <div className="brand-feature">
              <div className="brand-feature-icon">
                <TruckIcon />
              </div>
              <span>Envío gratis</span>
            </div>
            <div className="brand-feature">
              <div className="brand-feature-icon">
                <ShieldIcon />
              </div>
              <span>Pago seguro</span>
            </div>
            <div className="brand-feature">
              <div className="brand-feature-icon">
                <HeartIcon />
              </div>
              <span>Estilo premium</span>
            </div>
          </div>
        </div>
      </div>

      {/* Panel de formulario */}
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
          <form className="login-form" onSubmit={handleSubmit} noValidate>
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
              <Link to="/forgot-password" className="forgot-password-link">
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
    </div>
  );
}
