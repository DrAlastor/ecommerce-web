import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from './AuthContext';
import type { ReactNode } from 'react';

interface ProtectedRouteProps {
  children: ReactNode;
  allowedRoles?: string[];
  requireStaff?: boolean;
}

/**
 * Componente que protege rutas privadas.
 * Redirige a /login si no hay sesión.
 * Opcionalmente filtra por roles permitidos o por pertenencia a personal de la empresa.
 */
export function ProtectedRoute({ children, allowedRoles, requireStaff }: ProtectedRouteProps) {
  const { isAuthenticated, isLoading, user, rol } = useAuth();
  const location = useLocation();

  // Mostrar loading mientras se restaura la sesión
  if (isLoading) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        background: 'var(--bg-secondary)',
      }}>
        <div style={{
          width: 40,
          height: 40,
          border: '3px solid var(--border-light)',
          borderTopColor: 'var(--color-primary)',
          borderRadius: '50%',
          animation: 'spin 0.8s linear infinite',
        }} />
      </div>
    );
  }

  // Redirigir a login si no está autenticado
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Si se requiere ser personal interno (empleado / no cliente puro)
  if (requireStaff) {
    const isClient = (rol?.nombre || '').toLowerCase().trim() === 'cliente';
    const isEmployee = Boolean(user?.empleado) || (!isClient && !!rol);
    if (!isEmployee) {
      return <Navigate to="/" replace />;
    }
  }

  // Verificar rol si se especificaron roles permitidos (insensible a mayúsculas/minúsculas)
  if (allowedRoles && rol) {
    const userRoleNorm = (rol.nombre || '').toLowerCase().trim();
    const hasRole = allowedRoles.some(r => r.toLowerCase().trim() === userRoleNorm);
    if (!hasRole) {
      return <Navigate to="/" replace />;
    }
  }

  return <>{children}</>;
}
