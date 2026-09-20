import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './modules/users-security/shared/components/AuthContext';
import { ProtectedRoute } from './modules/users-security/shared/components/ProtectedRoute';
import { ShopProvider } from './context/ShopContext';
import LoginPage from './modules/users-security/use-cases/CU01-gestionar-acceso/pages/LoginPage';
import { HomePage } from './pages/HomePage';
import { CatalogPage } from './modules/catalog/use-cases/CU08-consultar-catalogo-productos/pages/CatalogPage';
import { ProductDetailPage } from './modules/catalog/use-cases/CU09-consultar-detalle-disponibilidad/pages/ProductDetailPage';
import RegisterPage from './modules/users-security/use-cases/CU02-gestionar-perfil/pages/RegisterPage';
import ProfilePage from './modules/users-security/use-cases/CU02-gestionar-perfil/pages/ProfilePage';
import ForgotPasswordPage from './modules/users-security/use-cases/CU03-gestionar-contrasena/pages/ForgotPasswordPage';
import ResetPasswordPage from './modules/users-security/use-cases/CU03-gestionar-contrasena/pages/ResetPasswordPage';
import { AdminLayout } from './shared/layouts/AdminLayout/AdminLayout';
import DashboardIndex from './pages/admin/DashboardIndex';
import { ManageUsersPage } from './modules/users-security/use-cases/CU04-gestionar-usuarios/pages/ManageUsersPage';
import { BitacoraPage } from './modules/users-security/use-cases/CU07-consultar-bitacora/pages/BitacoraPage';
import { ManageRolesPage } from './modules/users-security/use-cases/CU05-gestionar-roles-permisos/pages/ManageRolesPage';
import { ManageEmployeesPage } from './modules/users-security/use-cases/CU06-gestionar-empleados/pages/ManageEmployeesPage';
import { ManageCatalogPage } from './modules/catalog/use-cases/CU10-gestionar-catalogo-productos/pages/ManageCatalogPage';
import { ManageSuppliersPage } from './modules/catalog/use-cases/CU11-gestionar-proveedores/pages/ManageSuppliersPage';
import { RecommendationsPage } from './modules/catalog/use-cases/CU12-obtener-recomendaciones-ia/pages/RecommendationsPage';
import { ManageBranchesPage } from './modules/branches-inventory/use-cases/CU13-gestionar-ciudades-sucursales/pages/ManageBranchesPage';
import { BranchesPage } from './modules/branches-inventory/use-cases/CU14-consultar-sucursales/pages/BranchesPage';
import { ManageInventoryPage } from './modules/branches-inventory/use-cases/CU15-consultar-inventario/pages/ManageInventoryPage';
import { ManageMovementsPage } from './modules/branches-inventory/use-cases/CU16-gestionar-movimientos-inventario/pages/ManageMovementsPage';
import { MyReservationsPage } from './modules/reservations/use-cases/CU18-consultar-cancelar-reserva';
import { ManageBranchReservationsPage } from './modules/reservations/use-cases/CU19-gestionar-reserva-sucursal';
import { CartPage } from './modules/sales-billing/use-cases/CU20-gestionar-carrito-compras/pages/CartPage';
import { CheckoutPage } from './modules/sales-billing/use-cases/CU21-realizar-compra-digital/pages/CheckoutPage';
import { MyPurchasesPage } from './modules/sales-billing/use-cases/CU22-consultar-historial-compras/pages/MyPurchasesPage';
import POSPage from './modules/sales-billing/use-cases/CU23-procesar-pagos-facturacion/pages/POSPage';
import { ReportsDashboardPage } from './modules/reports-dashboard/use-cases/CU27-consultar-dashboard-reportes/pages/ReportsDashboardPage';
import { VirtualFittingPage } from './modules/mobile-experience/use-cases/CU25-utilizar-vestidor-virtual';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ShopProvider>
          <Routes>
            {/* Página Principal / Tienda Pública (Accesible para todos) */}
            <Route path="/" element={<HomePage />} />
            <Route path="/catalog" element={<CatalogPage />} />
            <Route path="/product/:id" element={<ProductDetailPage />} />
            {/* Vestidor Virtual 3D / RA (CU25) */}
            <Route path="/virtual-fitting/:productId" element={<VirtualFittingPage />} />
            <Route path="/vestidor/:productId" element={<VirtualFittingPage />} />
            {/* Carrito de Compras (CU20) */}
            <Route path="/cart" element={<CartPage />} />
            <Route path="/bolsa" element={<CartPage />} />

            {/* Proceso de Compra Digital (CU21) */}
            <Route
              path="/checkout"
              element={
                <ProtectedRoute>
                  <CheckoutPage />
                </ProtectedRoute>
              }
            />

            {/* Historial de Compras (CU22) */}
            <Route
              path="/mis-compras"
              element={
                <ProtectedRoute>
                  <MyPurchasesPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/purchases"
              element={<Navigate to="/mis-compras" replace />}
            />


            <Route path="/sucursales" element={<BranchesPage />} />
            <Route path="/branches" element={<BranchesPage />} />
            <Route
              path="/recommendations"
              element={
                <ProtectedRoute allowedRoles={['Cliente']}>
                  <RecommendationsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/mis-reservas"
              element={
                <ProtectedRoute allowedRoles={['Cliente', 'Administrador']}>
                  <MyReservationsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/reservations"
              element={<Navigate to="/mis-reservas" replace />}
            />

            {/* Ruta pública: Login */}
            <Route path="/login" element={<LoginPage />} />

            {/* Rutas protegidas del Panel Interno: Cualquier empleado o administrador */}
            <Route
              path="/admin"
              element={
                <ProtectedRoute requireStaff>
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
              {/* Módulo 2 — Catálogo Comercial (CU12) */}
              <Route path="catalog" element={<ManageCatalogPage />} />
              <Route path="gestionar-productos" element={<ManageCatalogPage />} />
              <Route path="gestionar-categorias" element={<ManageCatalogPage />} />
              <Route path="gestionar-variantes" element={<ManageCatalogPage />} />
              <Route path="productos" element={<ManageCatalogPage />} />
              {/* Modulo 2 - Proveedores y ordenes de compra (CU13) */}
              <Route path="proveedores" element={<ManageSuppliersPage />} />
              <Route path="gestionar-proveedores" element={<ManageSuppliersPage />} />
              {/* Módulo 3 — Sucursales e Inventario (CU08) */}
              <Route path="sucursales" element={<ManageBranchesPage />} />
              <Route path="gestionar-sucursales" element={<ManageBranchesPage />} />
              <Route path="ciudades" element={<ManageBranchesPage />} />
              <Route path="branches" element={<ManageBranchesPage />} />
              <Route path="inventario" element={<ManageInventoryPage />} />
              <Route path="gestionar-inventario" element={<ManageInventoryPage />} />
              <Route path="consultar-inventario" element={<ManageInventoryPage />} />
              <Route path="inventory" element={<ManageInventoryPage />} />
              {/* Módulo 3 — Movimientos de Inventario (CU16) */}
              <Route path="movimientos" element={<ManageMovementsPage />} />
              <Route path="gestionar-movimientos" element={<ManageMovementsPage />} />
              <Route path="movements" element={<ManageMovementsPage />} />
              {/* Módulo 4 — Gestión de Reservas en Sucursal (CU19) */}
              <Route path="reservas" element={<ManageBranchReservationsPage />} />
              <Route path="gestionar-reservas" element={<ManageBranchReservationsPage />} />
              {/* Módulo 7 — Reportes y Dashboard (CU27) */}
              <Route path="reports" element={<ReportsDashboardPage />} />
              <Route path="reportes" element={<ReportsDashboardPage />} />
              <Route path="dashboard" element={<ReportsDashboardPage />} />
              <Route path="*" element={<DashboardIndex />} />
            </Route>

            {/* Rutas protegidas: Punto de Venta / Caja (CU23 & CU24) */}
            <Route
              path="/pos"
              element={
                <ProtectedRoute requireStaff>
                  <POSPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/ventas"
              element={
                <ProtectedRoute requireStaff>
                  <POSPage />
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
                <ProtectedRoute>
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
