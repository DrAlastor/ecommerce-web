import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from './AuthContext';
import type { ReactNode } from 'react';

interface ProtectedRouteProps {
  children: ReactNode;
  allowedRoles?: string[];
}

/**
 * Componente que protege rutas privadas.
 * Redirige a /login si no hay sesión.
 * Opcionalmente filtra por roles permitidos.
 */
export function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const { isAuthenticated, isLoading, rol } = useAuth();
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

  // Verificar rol si se especificaron roles permitidos
  if (allowedRoles && rol && !allowedRoles.includes(rol.nombre)) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}
