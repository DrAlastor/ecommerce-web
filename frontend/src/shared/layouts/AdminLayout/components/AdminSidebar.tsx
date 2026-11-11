import React, { useEffect, useMemo, useState } from 'react';
import api from '../../../../services/api/api';
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
  RotateCcw,
  X,
} from 'lucide-react';

const normalize = (value: string) =>
  value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();

// Casos de uso internos visibles en el panel web para empleados/admin:
// Módulo 1: 04, 05, 06, 07, 08, 09, 10
// Módulo 2: 11, 13, 14, 15
// Módulo 3: 16, 18, 19
// Módulo 4: 22
// Módulo 5: 27, 28
// Módulo 7: 30 (Dashboard), 31 (Predefinidos), 32 (QBE), 33 (Voz) o en catálogos de 32: 29-32
const webPanelUseCaseIds = new Set([
  4, 5, 6, 7, 8, 9, 10,
  11, 13, 14, 15,
  16, 18, 19,
  22,
  27, 28,
  29, 30, 31, 32, 33, 34
]);

const getModuleIcon = (modulo: string) => {
  const norm = normalize(modulo);
  if (norm.includes('usuario') || norm.includes('seguridad')) return <Users size={17} />;
  if (norm.includes('catalogo') || norm.includes('proveedor')) return <Package size={17} />;
  if (norm.includes('inventario') || norm.includes('sucursal')) return <Box size={17} />;
  if (norm.includes('reserva')) return <Calendar size={17} />;
  if (norm.includes('devolucion') || norm.includes('retorno')) return <RotateCcw size={17} />;
  if (norm.includes('venta') || norm.includes('pago') || norm.includes('factura')) return <ShoppingCart size={17} />;
  if (norm.includes('reporte') || norm.includes('dashboard') || norm.includes('inteligencia') || norm.includes('negocio')) return <FileText size={17} />;
  return <LayoutDashboard size={17} />;
};

const getUseCaseRoute = (nombre: string, idFuncion?: number, currentTenant?: string) => {
  const rawTenant = currentTenant || localStorage.getItem('tenantKey') || 'dressly';
  const tenantKey = rawTenant === 'subversive-urban' || rawTenant === 'subversive'
    ? 'urbanly'
    : (rawTenant === 'aura' ? 'aura-sport' : (rawTenant === 'fashionstore' ? 'dressly' : rawTenant));

  // 1. Respaldo prioritario por ID exacto de función
  if (idFuncion === 27) return '/pos';
  if (idFuncion === 28) return '/admin/devoluciones';
  if (idFuncion === 22) return '/admin/reservas';
  if (idFuncion === 18) return '/admin/inventario';
  if (idFuncion === 19) return '/admin/movimientos';
  if (idFuncion === 16) return '/admin/sucursales';
  if (idFuncion === 15) return `/store/${tenantKey}/recommendations`;
  if (idFuncion === 14) return '/admin/proveedores';
  if (idFuncion === 13) return '/admin/catalog?tab=products';
  if (idFuncion === 11) return `/store/${tenantKey}/catalog`;
  if (idFuncion === 10) return '/admin/bitacora';
  if (idFuncion === 9) return '/admin/backups';
  if (idFuncion === 8) return '/admin/apariencia';
  if (idFuncion === 7) return '/admin/empresa';
  if (idFuncion === 6) return '/admin/empleados';
  if (idFuncion === 5) return '/admin/roles';
  if (idFuncion === 4) return '/admin/users';
  if (idFuncion === 34) return '/admin/reportes-ml';
  if (idFuncion === 33 || idFuncion === 32) return '/admin/reportes-voz';
  if (idFuncion === 31) return '/admin/reportes-qbe';
  if (idFuncion === 30) return '/admin/reportes-predefinidos';
  if (idFuncion === 29) return '/admin/dashboard';

  // 2. Mapeo por coincidencia semántica
  const norm = normalize(nombre).replace(/^cu\d+\s*[-—]\s*/i, '');

  if (norm.includes('venta presencial') || norm.includes('punto de venta') || norm.includes('pos') || norm.includes('caja')) return '/pos';
  if (norm.includes('saas') || norm.includes('super admin') || norm.includes('dashboard de super admin')) return '/admin/saas-dashboard';
  if (norm.includes('monitoreo') || norm.includes('telemetria')) return '/admin/saas-monitoring';
  if (norm.includes('devolucion') || norm.includes('retorno')) return '/admin/devoluciones';
  if (norm.includes('usuario')) return '/admin/users';
  if (norm.includes('rol') || norm.includes('permiso')) return '/admin/roles';
  if (norm.includes('empleado')) return '/admin/empleados';
  if (norm.includes('apariencia')) return '/admin/apariencia';
  if (norm.includes('backup') || norm.includes('restore')) return '/admin/backups';
  if (norm.includes('empresa')) return '/admin/empresa';
  if (norm.includes('bitacora')) return '/admin/bitacora';
  if (norm.includes('consultar catalogo') || norm.includes('vitrina') || norm.includes('ver catalogo')) return `/store/${tenantKey}/catalog`;
  if (norm.includes('gestionar catalogo') || norm.includes('catalogo') || norm.includes('producto') || norm.includes('categoria') || norm.includes('variante')) return '/admin/catalog?tab=products';
  if (norm.includes('proveedor')) return '/admin/proveedores';
  if (norm.includes('recomendacion') || /\bia\b/.test(norm) || norm.includes('inteligencia artificial')) return `/store/${tenantKey}/recommendations`;
  if (norm.includes('reserva')) return '/admin/reservas';
  if (norm.includes('sucursal') || norm.includes('ciudad')) return '/admin/sucursales';
  if (norm.includes('movimiento')) return '/admin/movimientos';
  if (norm.includes('inventario')) return '/admin/inventario';
  if (norm.includes('predefinido')) return '/admin/reportes-predefinidos';
  if (norm.includes('dashboard')) return '/admin/dashboard';
  if (norm.includes('qbe')) return '/admin/reportes-qbe';
  if (norm.includes('voz')) return '/admin/reportes-voz';
  if (norm.includes('ml') || norm.includes('neuronal') || norm.includes('decision')) return '/admin/reportes-ml';
  if (norm.includes('reporte')) return '/admin/reportes-predefinidos';

  return '/admin';
};

interface AdminSidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export const AdminSidebar: React.FC<AdminSidebarProps> = ({ isOpen, onClose }) => {
  const { funciones } = useAuth();
  const [openModules, setOpenModules] = useState<Record<string, boolean>>({});

  const rawTenant = localStorage.getItem('tenantKey') || 'dressly';
  const tenantKey = rawTenant === 'subversive-urban' || rawTenant === 'subversive'
    ? 'urbanly'
    : (rawTenant === 'aura' ? 'aura-sport' : (rawTenant === 'fashionstore' ? 'dressly' : rawTenant));

  const [currentPlanId, setCurrentPlanId] = useState('PRUEBA');
  useEffect(() => {
    let active = true;
    api.get('/users-security/company/public/' + encodeURIComponent(tenantKey)).then(res => {
      if (active) setCurrentPlanId(res.data.plan_id || 'PRUEBA');
    }).catch(() => { if (active) setCurrentPlanId('PRUEBA'); });
    return () => { active = false; };
  }, [tenantKey]);

  const toggleModule = (modulo: string) => {
    setOpenModules((prev) => ({ ...prev, [modulo]: !prev[modulo] }));
  };

  const handleNavClick = () => {
    if (onClose) onClose();
  };

  const modulesWithFunctions = useMemo(() => {
    const map = new Map<string, typeof funciones>();
    const allowedFunciones = funciones.filter((funcion) => {
      const access = normalize(funcion.nivel_acceso || '');
      return (
        webPanelUseCaseIds.has(funcion.id_funcion) &&
        access !== 'ninguno' &&
        access !== ''
      );
    });

    allowedFunciones.forEach((funcion) => {
      if (!funcion.modulo || !funcion.nombre) return;
      const normMod = normalize(funcion.modulo);
      // Filtrar y excluir expresamente el módulo de Experiencia Móvil de la versión web
      if (
        normMod.includes('movil') ||
        normMod.includes('mobile') ||
        normMod.includes('experiencia') ||
        normMod.includes('interactiva')
      ) {
        return;
      }

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

  const tenantBrandMap: Record<string, { name: string; logo: string }> = {
    'dressly': { name: 'Dressly', logo: 'https://fashionstorestorages.blob.core.windows.net/media/logo-dressly.jpg' },
    'urbanly': { name: 'Urbanly', logo: 'https://fashionstorestorages.blob.core.windows.net/media/logo-urbanly.png' },
    'aura-sport': { name: 'Aura Sport', logo: 'https://fashionstorestorages.blob.core.windows.net/media/logo-aura.jpg' },
  };
  const activeTenantBrand = tenantBrandMap[tenantKey] || tenantBrandMap['dressly'];

  return (
    <aside className={`admin-sidebar ${isOpen ? 'open' : ''}`}>
      <div className="admin-sidebar-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
          <img
            src={activeTenantBrand.logo}
            alt={activeTenantBrand.name}
            style={{ width: '34px', height: '34px', borderRadius: '8px', objectFit: 'cover' }}
          />
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <h2 className="admin-logo" style={{ margin: 0, lineHeight: 1.15 }}>
              {activeTenantBrand.name}<span>Admin</span>
            </h2>
            {(() => {
              const getPlanBadgeInfo = (id: string) => {
                if (id === 'plan-unlimited' || id === 'EMPRESARIAL') return { label: 'Plan Empresarial', color: '#D97706' };
                if (id === 'plan-corporate' || id === 'CORPORATIVO') return { label: 'Plan Corporativo', color: '#059669' };
                if (id === 'plan-enterprise' || id === 'PREMIUM' || id === 'plan-pro') return { label: 'Plan Premium', color: '#7C3AED' };
                if (id === 'plan-trial' || id === 'PRUEBA') return { label: 'Plan Prueba', color: '#64748B' };
                return { label: 'Plan Básico', color: '#2563EB' };
              };
              const badge = getPlanBadgeInfo(currentPlanId);
              return (
                <span style={{
                  fontSize: '0.65rem',
                  fontWeight: 700,
                  padding: '1px 7px',
                  borderRadius: '999px',
                  background: badge.color,
                  color: '#FFFFFF',
                  marginTop: '3px',
                  width: 'fit-content',
                  textTransform: 'uppercase',
                  letterSpacing: '0.04em',
                }}>
                  {badge.label}
                </span>
              );
            })()}
          </div>
        </div>
        {onClose && (
          <button
            type="button"
            className="admin-sidebar-close-btn"
            onClick={onClose}
            aria-label="Cerrar menú"
          >
            <X size={18} />
          </button>
        )}
      </div>

      <div className="admin-sidebar-menu">
        <span className="admin-sidebar-label">MENÚ PRINCIPAL</span>
        <nav>
          <NavLink
            to="/admin"
            end
            onClick={handleNavClick}
            className={({ isActive }) => `admin-nav-item ${isActive ? 'active' : ''}`}
          >
            <LayoutDashboard size={17} />
            <span>Dashboard</span>
          </NavLink>

          {modulesWithFunctions.map(([modulo, funcs]) => (
            <div key={modulo} className="admin-module-group">
              <div
                className="admin-nav-item admin-module-toggle"
                onClick={() => toggleModule(modulo)}
              >
                <div className="admin-module-title-wrapper">
                  <span className="admin-module-icon">
                    {getModuleIcon(modulo)}
                  </span>
                  <span className="admin-module-text">{modulo.replace('Gestión de ', '')}</span>
                </div>
                {openModules[modulo] ? <ChevronDown size={14} className="admin-module-chevron" /> : <ChevronRight size={14} className="admin-module-chevron" />}
              </div>

              {openModules[modulo] && (
                <div className="admin-sub-menu">
                  {funcs.map((funcion) => (
                    <NavLink
                      key={funcion.id_funcion}
                      to={getUseCaseRoute(funcion.nombre, funcion.id_funcion, tenantKey)}
                      end
                      onClick={handleNavClick}
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
            to="/admin/empresa"
            end
            onClick={handleNavClick}
            className={({ isActive }) => `admin-nav-item ${isActive ? 'active' : ''}`}
          >
            <Settings size={17} />
            <span>Configuración</span>
          </NavLink>
          <a href={`/store/${tenantKey}`} className="admin-nav-item" onClick={handleNavClick}>
            <Store size={17} />
            <span>Volver a la Tienda</span>
          </a>
        </nav>
      </div>
    </aside>
  );
};
