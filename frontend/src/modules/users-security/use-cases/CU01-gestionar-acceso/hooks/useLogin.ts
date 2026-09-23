/**
 * @caso-de-uso CU01 — Gestionar acceso al sistema
 * @subsistema Usuarios y Seguridad
 * @capa Control (presentación) — Frontend web
 * @responsabilidad Coordina estado, validaciones y acciones de la interfaz antes de delegar la operación al servicio o API.
 * @secuencia Usuario -> interfaz de acceso -> controlador de autenticación -> servicio de acceso -> Usuario/Rol/Sesión/Bitácora.
 */
import { useState, useCallback, type FormEvent } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../../shared/components/AuthContext';
import type { AxiosError } from 'axios';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function getRoleRedirectPath(roleName?: string, isEmpleado?: boolean): string {
  if (isEmpleado) return '/admin';
  const normalized = (roleName || '').toLowerCase().trim();
  if (normalized && normalized !== 'cliente') {
    return '/admin';
  }
  return '/';
}

function canUseRequestedRedirect(path: string | undefined, roleName?: string, isEmpleado?: boolean): path is string {
  if (!path) return false;

  const normalizedRole = (roleName || '').toLowerCase().trim();
  const isClient = normalizedRole === 'cliente';

  if (path.startsWith('/admin')) {
    return Boolean(isEmpleado) || Boolean(normalizedRole && !isClient);
  }

  if (path.startsWith('/pos')) {
    return normalizedRole === 'cajero' || normalizedRole === 'administrador' || normalizedRole.includes('encargado') || Boolean(isEmpleado);
  }

  if (path.startsWith('/recommendations')) {
    return isClient;
  }

  return true;
}

export function useLogin() {
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

  // Real-time validations
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

      const searchParams = new URLSearchParams(location.search);
      const redirectQuery = searchParams.get('redirect');
      const from =
        (location.state as { from?: { pathname: string } })?.from?.pathname ||
        redirectQuery ||
        undefined;
      const stored = localStorage.getItem('authUser');
      if (stored) {
        const parsed = JSON.parse(stored);
        const roleName = parsed.rol?.nombre;
        const isEmpleado = Boolean(parsed.user?.empleado);
        const redirectPath = canUseRequestedRedirect(from, roleName, isEmpleado)
          ? from
          : getRoleRedirectPath(roleName, isEmpleado);
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

  return {
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
  };
}
