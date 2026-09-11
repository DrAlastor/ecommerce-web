import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import type { ReactNode } from 'react';
import { authService } from '../services/auth.service';
import type {
  AuthState,
  LoginRequest,
} from '../types/auth.types';

interface AuthContextType extends AuthState {
  login: (credentials: LoginRequest) => Promise<void>;
  logout: () => Promise<void>;
  hasPermission: (functionName: string) => boolean;
  getAccessLevel: (functionName: string) => string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const initialState: AuthState = {
  isAuthenticated: false,
  isLoading: true,
  user: null,
  rol: null,
  funciones: [],
  accessToken: null,
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>(initialState);

  // Restaurar sesión al montar
  useEffect(() => {
    const restoreSession = () => {
      const stored = authService.getStoredAuth();
      const token = localStorage.getItem('accessToken');

      if (stored && token) {
        setState({
          isAuthenticated: true,
          isLoading: false,
          user: stored.user,
          rol: stored.rol,
          funciones: stored.funciones,
          accessToken: token,
        });
      } else {
        setState((prev) => ({ ...prev, isLoading: false }));
      }
    };

    restoreSession();
  }, []);

  const login = useCallback(async (credentials: LoginRequest) => {
    setState((prev) => ({ ...prev, isLoading: true }));

    try {
      const response = await authService.login(credentials);
      authService.saveAuth(response);

      setState({
        isAuthenticated: true,
        isLoading: false,
        user: response.user,
        rol: response.rol,
        funciones: response.funciones,
        accessToken: response.accessToken,
      });
    } catch (error) {
      setState((prev) => ({ ...prev, isLoading: false }));
      throw error;
    }
  }, []);

  const logout = useCallback(async () => {
    setState((prev) => ({ ...prev, isLoading: true }));
    await authService.logout();
    setState({
      ...initialState,
      isLoading: false,
    });
  }, []);

  const hasPermission = useCallback(
    (functionName: string) => {
      return state.funciones.some((f) => f.nombre === functionName);
    },
    [state.funciones],
  );

  const getAccessLevel = useCallback(
    (functionName: string): string | null => {
      const found = state.funciones.find((f) => f.nombre === functionName);
      return found ? found.nivel_acceso : null;
    },
    [state.funciones],
  );

  const value = useMemo(
    () => ({
      ...state,
      login,
      logout,
      hasPermission,
      getAccessLevel,
    }),
    [state, login, logout, hasPermission, getAccessLevel],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe usarse dentro de un AuthProvider');
  }
  return context;
}
