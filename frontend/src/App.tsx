import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './modules/users-security/shared/components/AuthContext';
import { ProtectedRoute } from './modules/users-security/shared/components/ProtectedRoute';
import { ShopProvider } from './context/ShopContext';
import LoginPage from './modules/users-security/use-cases/CU01-iniciar-sesion/pages/LoginPage';
import { HomePage } from './pages/HomePage';
import { CatalogPage } from './modules/catalog/use-cases/CU10-consultar-catalogo-productos/pages/CatalogPage';

function AdminDashboard() {
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
        Panel de Administración
      </h1>
      <p style={{ color: 'var(--text-secondary)', maxWidth: '500px', textAlign: 'center' }}>
        Bienvenido al sistema de gestión de FashionStore Dressly. Aquí se administran usuarios, roles, catálogo, inventario y reportes.
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
              path="/admin/*"
              element={
                <ProtectedRoute allowedRoles={['Administrador', 'Encargado de Sucursal']}>
                  <AdminDashboard />
                </ProtectedRoute>
              }
            />

            {/* Rutas protegidas: Cajero */}
            <Route
              path="/pos"
              element={
                <ProtectedRoute allowedRoles={['Cajero']}>
                  <POSDashboard />
                </ProtectedRoute>
              }
            />

            {/* Placeholder para registro y recuperar contraseña */}
            <Route path="/register" element={<LoginPage />} />
            <Route path="/forgot-password" element={<LoginPage />} />

            {/* Catch-all redirige a la tienda */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </ShopProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
