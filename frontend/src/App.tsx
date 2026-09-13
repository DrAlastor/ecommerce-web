import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './modules/users-security/shared/components/AuthContext';
import { ProtectedRoute } from './modules/users-security/shared/components/ProtectedRoute';
import { ShopProvider } from './context/ShopContext';
import LoginPage from './modules/users-security/use-cases/CU01-iniciar-sesion/pages/LoginPage';
import { HomePage } from './pages/HomePage';
import { CatalogPage } from './modules/catalog/use-cases/CU10-consultar-catalogo-productos/pages/CatalogPage';
import RegisterPage from './modules/users-security/use-cases/CU03-gestionar-perfil/pages/RegisterPage';
import ProfilePage from './modules/users-security/use-cases/CU03-gestionar-perfil/pages/ProfilePage';
import ForgotPasswordPage from './modules/users-security/use-cases/CU04-gestionar-contrasena/pages/ForgotPasswordPage';
import ResetPasswordPage from './modules/users-security/use-cases/CU04-gestionar-contrasena/pages/ResetPasswordPage';
import { AdminLayout } from './shared/layouts/AdminLayout/AdminLayout';
import DashboardIndex from './pages/admin/DashboardIndex';
import { ManageUsersPage } from './modules/users-security/use-cases/CU05-gestionar-usuarios/pages/ManageUsersPage';
import { BitacoraPage } from './modules/users-security/use-cases/CU08-consultar-bitacora/pages/BitacoraPage';
import { ManageRolesPage } from './modules/users-security/use-cases/CU06-gestionar-roles-permisos/pages/ManageRolesPage';
import { ManageEmployeesPage } from './modules/users-security/use-cases/CU07-gestionar-empleados/pages/ManageEmployeesPage';

function POSDashboard() {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      fontFamily: 'var(--font-sans)',
      background: 'var(--bg-secondary)',
      gap: '1.25rem',
      padding: '2rem',
    }}>
      <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '2.5rem', color: 'var(--text-primary)' }}>
        Punto de Venta (POS)
      </h1>
      <p style={{ color: 'var(--text-secondary)', maxWidth: '500px', textAlign: 'center' }}>
        Módulo de Caja y Ventas Presenciales para sucursales físicas.
      </p>
      <a
        href="/"
        style={{
          backgroundColor: '#1A1A1A',
          color: '#FFFFFF',
          padding: '0.75rem 1.5rem',
          borderRadius: '9999px',
          textDecoration: 'none',
          fontSize: '0.9rem',
          fontWeight: 600,
        }}
      >
        ← Volver a la Tienda Pública
      </a>
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ShopProvider>
          <Routes>
            {/* Página Principal / Tienda Pública (Accesible para todos) */}
            <Route path="/" element={<HomePage />} />
            <Route path="/catalog" element={<CatalogPage />} />

            {/* Ruta pública: Login */}
            <Route path="/login" element={<LoginPage />} />

            {/* Rutas protegidas: Administrador / Encargado */}
            <Route
              path="/admin"
              element={
                <ProtectedRoute allowedRoles={['Administrador', 'Encargado de Sucursal']}>
                  <AdminLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<DashboardIndex />} />
              <Route path="users" element={<ManageUsersPage />} />
              <Route path="bitacora" element={<BitacoraPage />} />
              <Route path="consultar-bitacora" element={<BitacoraPage />} />
              <Route path="roles" element={<ManageRolesPage />} />
              <Route path="gestionar-roles" element={<ManageRolesPage />} />
              <Route path="empleados" element={<ManageEmployeesPage />} />
              <Route path="employees" element={<ManageEmployeesPage />} />
              <Route path="gestionar-empleados" element={<ManageEmployeesPage />} />
              {/* Rutas futuras de los módulos se agregarán aquí como hijos */}
              <Route path="*" element={<DashboardIndex />} />
            </Route>

            {/* Rutas protegidas: Cajero */}
            <Route
              path="/pos"
              element={
                <ProtectedRoute allowedRoles={['Cajero']}>
                  <POSDashboard />
                </ProtectedRoute>
              }
            />

            {/* Rutas de perfil, registro y recuperación */}
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
            <Route path="/reset-password" element={<ResetPasswordPage />} />
            <Route
              path="/profile"
              element={
                <ProtectedRoute allowedRoles={['Cliente', 'Administrador', 'Encargado de Sucursal', 'Cajero']}>
                  <ProfilePage />
                </ProtectedRoute>
              }
            />

            {/* Catch-all redirige a la tienda */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </ShopProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
