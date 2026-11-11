import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './modules/users-security/shared/components/AuthContext';
import { ProtectedRoute } from './modules/users-security/shared/components/ProtectedRoute';
import { ShopProvider } from './context/ShopContext';
import LoginPage from './modules/users-security/use-cases/CU01-gestionar-acceso/pages/LoginPage';
import { HomePage } from './pages/HomePage';
import { SaasLandingPage } from './pages/SaasLandingPage';
import { CatalogPage } from './modules/catalog/use-cases/CU11-consultar-catalogo-productos/pages/CatalogPage';
import { ProductDetailPage } from './modules/catalog/use-cases/CU12-consultar-detalle-disponibilidad/pages/ProductDetailPage';
import RegisterPage from './modules/users-security/use-cases/CU02-gestionar-perfil/pages/RegisterPage';
import ProfilePage from './modules/users-security/use-cases/CU02-gestionar-perfil/pages/ProfilePage';
import ForgotPasswordPage from './modules/users-security/use-cases/CU03-gestionar-contrasena/pages/ForgotPasswordPage';
import ResetPasswordPage from './modules/users-security/use-cases/CU03-gestionar-contrasena/pages/ResetPasswordPage';
import { AdminLayout } from './shared/layouts/AdminLayout/AdminLayout';
import DashboardIndex from './pages/admin/DashboardIndex';
import { ManageUsersPage } from './modules/users-security/use-cases/CU04-gestionar-usuarios/pages/ManageUsersPage';
import { BitacoraPage } from './modules/users-security/use-cases/CU10-consultar-bitacora/pages/BitacoraPage';
import { ManageRolesPage } from './modules/users-security/use-cases/CU05-gestionar-roles-permisos/pages/ManageRolesPage';
import { ManageEmployeesPage } from './modules/users-security/use-cases/CU06-gestionar-empleados/pages/ManageEmployeesPage';
import { ManageCompanyPage } from './modules/users-security/use-cases/CU07-gestionar-empresas/pages/ManageCompanyPage';
import { ManageAppearancePage } from './modules/users-security/use-cases/CU08-personalizar-apariencia/pages/ManageAppearancePage';
import { ManageBackupsPage } from './modules/users-security/use-cases/CU09-gestionar-backups-restore/pages/ManageBackupsPage';
import { ManageCatalogPage } from './modules/catalog/use-cases/CU13-gestionar-catalogo-productos/pages/ManageCatalogPage';
import { ManageSuppliersPage } from './modules/catalog/use-cases/CU14-gestionar-proveedores/pages/ManageSuppliersPage';
import { RecommendationsPage } from './modules/catalog/use-cases/CU15-obtener-recomendaciones-ia/pages/RecommendationsPage';
import { ManageBranchesPage } from './modules/branches-inventory/use-cases/CU16-gestionar-ciudades-sucursales/pages/ManageBranchesPage';
import { BranchesPage } from './modules/branches-inventory/use-cases/CU17-consultar-sucursales/pages/BranchesPage';
import { ManageInventoryPage } from './modules/branches-inventory/use-cases/CU18-consultar-inventario/pages/ManageInventoryPage';
import { ManageMovementsPage } from './modules/branches-inventory/use-cases/CU19-gestionar-movimientos-inventario/pages/ManageMovementsPage';
import { MyReservationsPage } from './modules/reservations/use-cases/CU21-consultar-cancelar-reserva';
import { ManageBranchReservationsPage } from './modules/reservations/use-cases/CU22-gestionar-reserva-sucursal';
import { CartPage } from './modules/sales-billing/use-cases/CU23-gestionar-carrito-compras/pages/CartPage';
import { CheckoutPage } from './modules/sales-billing/use-cases/CU24-realizar-compra-digital/pages/CheckoutPage';
import { MyPurchasesPage } from './modules/sales-billing/use-cases/CU25-consultar-historial-compras/pages/MyPurchasesPage';
import POSPage from './modules/sales-billing/use-cases/CU26-procesar-pagos-facturacion/pages/POSPage';
import { ReportsDashboardPage } from './modules/reports-dashboard/use-cases/CU29-consultar-dashboard-reportes/pages/ReportsDashboardPage';
import { SaasDashboardPage } from './modules/saas/use-cases/CU04-gestionar-dashboard-superadmin/pages/SaasDashboardPage';
import { SaasMonitoringPage } from './modules/saas/use-cases/CU05-gestionar-monitoreo-tenant/pages/SaasMonitoringPage';
import { SaasLoginPage } from './pages/saas/SaasLoginPage';
import { SaasAdminLayout } from './shared/layouts/SaasAdminLayout/SaasAdminLayout';
import { SaasTenantsPage } from './modules/saas/pages/SaasTenantsPage';
import { SaasBitacoraPage } from './modules/saas/pages/SaasBitacoraPage';
import { SaasBackupsPage } from './modules/saas/pages/SaasBackupsPage';
import { SaasPlansPage } from './modules/saas/pages/SaasPlansPage';
import { VirtualFittingPage } from './modules/mobile-experience/use-cases/CU33-utilizar-vestidor-virtual';
import { ManageReturnsPage } from './modules/sales-billing/use-cases/CU28-gestionar-devoluciones';
import { ConfirmProvider } from './shared/components/ConfirmModal';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ShopProvider>
          <ConfirmProvider>
            <Routes>
              {/* Landing Page Corporativa del SaaS FashionStore (Venta de Planes y Precios) */}
              <Route path="/" element={<SaasLandingPage />} />

              {/* Autenticación & Acceso al Panel de Super Admin (Fuera del sistema de tiendas) */}
              <Route path="/saas/login" element={<SaasLoginPage />} />
              <Route path="/saas-login" element={<Navigate to="/saas/login" replace />} />
              <Route path="/super-admin/login" element={<Navigate to="/saas/login" replace />} />

              {/* Portal Exclusivo de Super Admin de la Plataforma SaaS FashionStore */}
              <Route path="/saas-admin" element={<SaasAdminLayout />}>
                <Route index element={<Navigate to="/saas-admin/dashboard" replace />} />
                <Route path="dashboard" element={<SaasDashboardPage />} />
                <Route path="monitoring" element={<SaasMonitoringPage />} />
                <Route path="plans" element={<SaasPlansPage />} />
                <Route path="tenants" element={<SaasTenantsPage />} />
                <Route path="bitacora" element={<SaasBitacoraPage />} />
                <Route path="backups" element={<SaasBackupsPage />} />
              </Route>

              {/* Vitrina / Tienda y rutas completas por Tenant (Urbanly, Dressly, Aura Sport) */}
              <Route path="/store/:tenant" element={<HomePage />} />
              <Route path="/store/:tenant/catalog" element={<CatalogPage />} />
              <Route path="/store/:tenant/product/:id" element={<ProductDetailPage />} />
              <Route path="/store/:tenant/virtual-fitting/:productId" element={<VirtualFittingPage />} />
              <Route path="/store/:tenant/cart" element={<CartPage />} />
              <Route
                path="/store/:tenant/checkout"
                element={
                  <ProtectedRoute>
                    <CheckoutPage />
                  </ProtectedRoute>
                }
              />
              <Route path="/store/:tenant/sucursales" element={<BranchesPage />} />
              <Route
                path="/store/:tenant/recommendations"
                element={
                  <ProtectedRoute allowedRoles={['Cliente']}>
                    <RecommendationsPage />
                  </ProtectedRoute>
                }
              />
              <Route path="/store/:tenant/login" element={<LoginPage />} />
              <Route path="/store/:tenant/register" element={<RegisterPage />} />
              <Route path="/store/:tenant/forgot-password" element={<ForgotPasswordPage />} />
              <Route path="/store/:tenant/reset-password" element={<ResetPasswordPage />} />

              {/* Redirecciones y alias directos por Tenant */}
              <Route path="/urbanly" element={<Navigate to="/store/urbanly" replace />} />
              <Route path="/urbanly/catalog" element={<Navigate to="/store/urbanly/catalog" replace />} />
              <Route path="/urbanly/login" element={<Navigate to="/store/urbanly/login" replace />} />
              <Route path="/subversive-urban" element={<Navigate to="/store/urbanly" replace />} />
              <Route path="/subversive" element={<Navigate to="/store/urbanly" replace />} />
              <Route path="/aura-sport" element={<Navigate to="/store/aura-sport" replace />} />
              <Route path="/aura-sport/catalog" element={<Navigate to="/store/aura-sport/catalog" replace />} />
              <Route path="/aura-sport/login" element={<Navigate to="/store/aura-sport/login" replace />} />
              <Route path="/aura" element={<Navigate to="/store/aura-sport" replace />} />
              <Route path="/dressly" element={<Navigate to="/store/dressly" replace />} />
              <Route path="/dressly/catalog" element={<Navigate to="/store/dressly/catalog" replace />} />
              <Route path="/dressly/login" element={<Navigate to="/store/dressly/login" replace />} />
              <Route path="/home" element={<Navigate to="/store/dressly" replace />} />
              <Route path="/catalog" element={<Navigate to="/store/dressly/catalog" replace />} />
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
                {/* Módulo 1 — Configuración SaaS (CU07, CU08, CU09) con rutas independientes */}
                <Route path="settings" element={<Navigate to="/admin/empresa" replace />} />
                <Route path="empresa" element={<ManageCompanyPage />} />
                <Route path="gestionar-empresa" element={<ManageCompanyPage />} />
                <Route path="apariencia" element={<ManageAppearancePage />} />
                <Route path="personalizar-apariencia" element={<ManageAppearancePage />} />
                <Route path="backups" element={<ManageBackupsPage />} />
                <Route path="gestionar-backups" element={<ManageBackupsPage />} />
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
                {/* Módulo 6 — Inteligencia de Negocios y Reportes (CU29 al CU32) con rutas propias */}
                <Route path="dashboard" element={<ReportsDashboardPage defaultTab="dashboard" />} />
                <Route path="consultar-dashboard" element={<ReportsDashboardPage defaultTab="dashboard" />} />
                <Route path="reports" element={<ReportsDashboardPage defaultTab="dashboard" />} />
                <Route path="reportes" element={<ReportsDashboardPage defaultTab="reports" />} />
                <Route path="reportes-predefinidos" element={<ReportsDashboardPage defaultTab="reports" />} />
                <Route path="gestionar-reportes-predefinidos" element={<ReportsDashboardPage defaultTab="reports" />} />
                <Route path="reportes-qbe" element={<ReportsDashboardPage defaultTab="qbe" />} />
                <Route path="gestionar-reportes-qbe" element={<ReportsDashboardPage defaultTab="qbe" />} />
                <Route path="reportes-voz" element={<ReportsDashboardPage defaultTab="voz" />} />
                <Route path="gestionar-reportes-voz" element={<ReportsDashboardPage defaultTab="voz" />} />
                <Route path="reportes-ml" element={<ReportsDashboardPage defaultTab="ml" />} />
                <Route path="gestionar-reportes-ml" element={<ReportsDashboardPage defaultTab="ml" />} />
                <Route path="decisiones-ml" element={<ReportsDashboardPage defaultTab="ml" />} />
                {/* Módulo 5 — Ventas y Devoluciones (CU26) */}
                <Route path="devoluciones" element={<ManageReturnsPage />} />
                <Route path="gestionar-devoluciones" element={<ManageReturnsPage />} />
                <Route path="returns" element={<ManageReturnsPage />} />
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

              {/* Catch-all redirige al home o tienda */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </ConfirmProvider>
        </ShopProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
