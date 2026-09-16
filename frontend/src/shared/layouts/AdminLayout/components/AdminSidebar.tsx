import React, { useMemo, useState } from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../../../modules/users-security/shared/components/AuthContext';
import {
  LayoutDashboard,
  Users,
  Package,
  ShoppingCart,
  Settings,
  Store,
  Calendar,
  Box,
  FileText,
  ChevronDown,
  ChevronRight,
  Sparkles,
} from 'lucide-react';

const normalize = (value: string) =>
  value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();

// Casos de uso internos visibles en el panel web para empleados/admin: 04, 05, 06, 07, 10, 11, 13, 15, 16, 19, 24, 27
const webPanelUseCaseIds = new Set([4, 5, 6, 7, 10, 11, 13, 15, 16, 19, 24, 27]);

const getModuleIcon = (modulo: string) => {
  const norm = normalize(modulo);
  if (norm.includes('usuario') || norm.includes('seguridad')) return <Users size={20} />;
  if (norm.includes('catalogo') || norm.includes('proveedor')) return <Package size={20} />;
  if (norm.includes('inventario') || norm.includes('sucursal')) return <Box size={20} />;
  if (norm.includes('reserva')) return <Calendar size={20} />;
  if (norm.includes('venta') || norm.includes('pago') || norm.includes('factura')) return <ShoppingCart size={20} />;
  if (norm.includes('ia') || norm.includes('realidad')) return <Sparkles size={20} />;
  if (norm.includes('reporte') || norm.includes('dashboard')) return <FileText size={20} />;
  return <LayoutDashboard size={20} />;
};

const getUseCaseRoute = (nombre: string) => {
  const norm = normalize(nombre).replace(/^cu\d+\s*[-—]\s*/i, '');
  if (norm.includes('usuario')) return '/admin/users';
  if (norm.includes('rol')) return '/admin/roles';
  if (norm.includes('empleado')) return '/admin/empleados';
  if (norm.includes('bitacora')) return '/admin/bitacora';
  if (norm.includes('catalogo') || norm.includes('producto') || norm.includes('categoria') || norm.includes('variante')) return '/admin/catalog?tab=products';
  if (norm.includes('proveedor')) return '/admin/proveedores';
  if (norm.includes('recomendacion') || norm.includes('ia')) return '/recommendations';
  if (norm.includes('reserva')) return '/admin/reservas';
  if (norm.includes('sucursal') || norm.includes('ciudad')) return '/admin/sucursales';
  if (norm.includes('movimiento')) return '/admin/movimientos';
  if (norm.includes('inventario')) return '/admin/inventario';
  if (norm.includes('venta') || norm.includes('pos')) return '/pos';
  if (norm.includes('dashboard') || norm.includes('reporte')) return '/admin';
  return '/admin';
};

export const AdminSidebar: React.FC = () => {
  const { funciones } = useAuth();
  const [openModules, setOpenModules] = useState<Record<string, boolean>>({});

  const toggleModule = (modulo: string) => {
    setOpenModules((prev) => ({ ...prev, [modulo]: !prev[modulo] }));
  };

  const modulesWithFunctions = useMemo(() => {
    const map = new Map<string, typeof funciones>();
    const allowedFunciones = funciones.filter((funcion) => {
      const access = normalize(funcion.nivel_acceso || '');
      const isMobileExclusive = normalize(funcion.modulo || '').includes('movil');
      return (
        webPanelUseCaseIds.has(funcion.id_funcion) &&
        !isMobileExclusive &&
        access !== 'ninguno' &&
        access !== ''
      );
    });

    allowedFunciones.forEach((funcion) => {
      if (!funcion.modulo || !funcion.nombre) return;
      if (!map.has(funcion.modulo)) map.set(funcion.modulo, []);
      const list = map.get(funcion.modulo)!;
      if (!list.some((item) => normalize(item.nombre) === normalize(funcion.nombre))) {
        list.push(funcion);
      }
    });

    for (const list of map.values()) {
      list.sort((a, b) => a.id_funcion - b.id_funcion);
    }

    return Array.from(map.entries()).sort(([, funcsA], [, funcsB]) => {
      const firstA = Math.min(...funcsA.map((funcion) => funcion.id_funcion));
      const firstB = Math.min(...funcsB.map((funcion) => funcion.id_funcion));
      return firstA - firstB;
    });
  }, [funciones]);

  return (
    <aside className="admin-sidebar">
      <div className="admin-sidebar-header">
        <h2 className="admin-logo">
          Dressly<span>Admin</span>
        </h2>
      </div>

      <div className="admin-sidebar-menu">
        <span className="admin-sidebar-label">MENÚ PRINCIPAL</span>
        <nav>
          <NavLink
            to="/admin"
            end
            className={({ isActive }) => `admin-nav-item ${isActive ? 'active' : ''}`}
          >
            <LayoutDashboard size={20} />
            <span>Dashboard</span>
          </NavLink>

          {modulesWithFunctions.map(([modulo, funcs]) => (
            <div key={modulo} className="admin-module-group">
              <div
                className="admin-nav-item admin-module-toggle"
                onClick={() => toggleModule(modulo)}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  {getModuleIcon(modulo)}
                  <span>{modulo.replace('Gestión de ', '')}</span>
                </div>
                {openModules[modulo] ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
              </div>

              {openModules[modulo] && (
                <div className="admin-sub-menu">
                  {funcs.map((funcion) => (
                    <NavLink
                      key={funcion.id_funcion}
                      to={getUseCaseRoute(funcion.nombre)}
                      className={({ isActive }) => `admin-nav-subitem ${isActive ? 'active' : ''}`}
                    >
                      {funcion.nombre.replace(/^CU\d+\s*[-—]\s*/i, '')}
                    </NavLink>
                  ))}
                </div>
              )}
            </div>
          ))}
        </nav>
      </div>

      <div className="admin-sidebar-footer">
        <span className="admin-sidebar-label">SISTEMA</span>
        <nav>
          <NavLink
            to="/admin/settings"
            className={({ isActive }) => `admin-nav-item ${isActive ? 'active' : ''}`}
          >
            <Settings size={20} />
            <span>Configuración</span>
          </NavLink>
          <a href="/" className="admin-nav-item">
            <Store size={20} />
            <span>Volver a la Tienda</span>
          </a>
        </nav>
      </div>
    </aside>
  );
};
