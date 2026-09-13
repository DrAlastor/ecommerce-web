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
  Sparkles
} from 'lucide-react';

const getModuleIcon = (modulo: string) => {
  const norm = modulo.toLowerCase();
  if (norm.includes('usuario') || norm.includes('seguridad')) return <Users size={20} />;
  if (norm.includes('catálogo') || norm.includes('catalogo')) return <Package size={20} />;
  if (norm.includes('inventario') || norm.includes('sucursal') || norm.includes('proveedor')) return <Box size={20} />;
  if (norm.includes('reserva')) return <Calendar size={20} />;
  if (norm.includes('venta') || norm.includes('pago') || norm.includes('factura')) return <ShoppingCart size={20} />;
  if (norm.includes('ia') || norm.includes('realidad')) return <Sparkles size={20} />;
  if (norm.includes('reporte') || norm.includes('dashboard')) return <FileText size={20} />;
  return <LayoutDashboard size={20} />;
};

const getUseCaseRoute = (nombre: string) => {
  const norm = nombre.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
  if (norm === 'gestionar usuarios') return '/admin/users';
  if (norm === 'gestionar roles') return '/admin/roles';
  if (norm === 'gestionar empleados') return '/admin/empleados';
  if (norm === 'consultar bitacora') return '/admin/bitacora';
  const slug = norm.replace(/[^a-z0-9]+/g, '-');
  return `/admin/${slug}`;
};

export const AdminSidebar: React.FC = () => {
  const { funciones, rol } = useAuth();
  const [openModules, setOpenModules] = useState<Record<string, boolean>>({
    'Usuarios y Seguridad': true,
    'Gestión de Usuarios y Seguridad': true,
  });

  const toggleModule = (modulo: string) => {
    setOpenModules(prev => ({ ...prev, [modulo]: !prev[modulo] }));
  };

  const modulesWithFunctions = useMemo(() => {
    const map = new Map<string, any[]>();
    funciones.forEach((f) => {
      if (f.modulo && f.nombre) {
        if (!map.has(f.modulo)) map.set(f.modulo, []);
        if (!map.get(f.modulo)!.some(fn => fn.nombre === f.nombre)) {
          map.get(f.modulo)!.push(f);
        }
      }
    });

    // Garantizar que la función "Gestionar empleados" siempre esté en el módulo "Usuarios y Seguridad" para Administrador
    const isSuperAdmin = rol?.id_rol === 1 || rol?.nombre?.toLowerCase() === 'administrador';
    if (isSuperAdmin) {
      let targetModuleKey = Array.from(map.keys()).find(k =>
        k.toLowerCase().includes('usuario') && k.toLowerCase().includes('seguridad')
      );
      if (!targetModuleKey) {
        targetModuleKey = 'Usuarios y Seguridad';
        map.set(targetModuleKey, []);
      }
      const list = map.get(targetModuleKey)!;
      if (!list.some(fn => fn.nombre.toLowerCase() === 'gestionar empleados')) {
        list.push({
          id_funcion: 21,
          nombre: 'Gestionar empleados',
          modulo: targetModuleKey,
          nivel_acceso: 'Edicion',
        });
      }

      // Ordenar las funciones del módulo
      const order = ['gestionar usuarios', 'gestionar roles', 'gestionar empleados', 'consultar bitacora'];
      list.sort((a, b) => {
        const idxA = order.indexOf(a.nombre.toLowerCase());
        const idxB = order.indexOf(b.nombre.toLowerCase());
        if (idxA !== -1 && idxB !== -1) return idxA - idxB;
        if (idxA !== -1) return -1;
        if (idxB !== -1) return 1;
        return a.nombre.localeCompare(b.nombre);
      });
    }

    return Array.from(map.entries()).sort(([a], [b]) => a.localeCompare(b));
  }, [funciones, rol]);

  return (
    <aside className="admin-sidebar">
      <div className="admin-sidebar-header">
        <h2 className="admin-logo">Dressly<span>Admin</span></h2>
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
                  {funcs.map(f => (
                    <NavLink 
                      key={f.nombre}
                      to={getUseCaseRoute(f.nombre)}
                      className={({ isActive }) => `admin-nav-subitem ${isActive ? 'active' : ''}`}
                    >
                      {f.nombre}
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
