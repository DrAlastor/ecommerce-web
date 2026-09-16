import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../shared/components/AuthContext';

export function useLogout() {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);

  const handleConfirmLogout = useCallback(async () => {
    setIsLoggingOut(true);
    try {
      await logout();
      navigate('/login', { replace: true });
    } catch (error) {
      console.error('Error durante el cierre de sesión:', error);
      navigate('/login', { replace: true });
    } finally {
      setIsLoggingOut(false);
      setIsConfirmOpen(false);
    }
  }, [logout, navigate]);

  return {
    isLoggingOut,
    isConfirmOpen,
    setIsConfirmOpen,
    handleConfirmLogout,
  };
}
