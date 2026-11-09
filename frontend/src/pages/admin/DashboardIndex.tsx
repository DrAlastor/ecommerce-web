import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../modules/users-security/shared/components/AuthContext';
import {
  Package,
  Users,
  ShieldCheck,
  ShoppingBag,
  ArrowRight,
  Lock,
  Clock,
  Building2,
  Calendar,
  Sparkles,
  BarChart3,
  KeyRound,
  ChevronDown,
  ChevronUp,
  ArrowLeftRight,
  RotateCcw,
  RefreshCw,
  Store,
  UserCheck,
} from 'lucide-react';
import { reportsService } from '../../modules/reports-dashboard/use-cases/CU29-consultar-dashboard-reportes/services/reports.service';
import type { DashboardMetrics } from '../../modules/reports-dashboard/use-cases/CU29-consultar-dashboard-reportes/types/reports.types';
import { AdminDashboardView } from '../../modules/reports-dashboard/use-cases/CU29-consultar-dashboard-reportes/components/AdminDashboardView';
import { ManagerDashboardView } from '../../modules/reports-dashboard/use-cases/CU29-consultar-dashboard-reportes/components/ManagerDashboardView';
import { CashierDashboardView } from '../../modules/reports-dashboard/use-cases/CU29-consultar-dashboard-reportes/components/CashierDashboardView';
import { CustomerDashboardView } from '../../modules/reports-dashboard/use-cases/CU29-consultar-dashboard-reportes/components/CustomerDashboardView';
import './DashboardIndex.css';

export default function DashboardIndex() {
  const { user, rol, funciones } = useAuth();
  const navigate = useNavigate();
  const [openModules, setOpenModules] = useState<Record<string, boolean>>({});

  // Estado del Dashboard Especializado por Rol
  const [dashboardData, setDashboardData] = useState<DashboardMetrics | null>(null);
  const [loadingDashboard, setLoadingDashboard] = useState<boolean>(false);
  const [dashBranch, setDashBranch] = useState<string>('');
  const [dashDatePreset, setDashDatePreset] = useState<string>('30d');
  const [roleView, setRoleView] = useState<string>('');
  const [branches, setBranches] = useState<{ id_sucursal: number; nombre: string }[]>([]);

  const isSuperAdmin = rol?.id_rol === 1 || rol?.nombre?.toLowerCase().includes('admin');

  // Función para calcular rango según presets
  const calculatePresetRange = useCallback((preset: string) => {
    const today = new Date();
    const endStr = today.toISOString().split('T')[0];
    let startStr = '';

    if (preset === 'today') {
      startStr = endStr;
    } else if (preset === '7d') {
      const d = new Date();
      d.setDate(today.getDate() - 7);
      startStr = d.toISOString().split('T')[0];
    } else if (preset === '30d') {
      const d = new Date();
      d.setDate(today.getDate() - 30);
      startStr = d.toISOString().split('T')[0];
    } else if (preset === 'this_month') {
      const d = new Date(today.getFullYear(), today.getMonth(), 1);
      startStr = d.toISOString().split('T')[0];
    } else if (preset === 'this_year') {
      const d = new Date(today.getFullYear(), 0, 1);
      startStr = d.toISOString().split('T')[0];
    } else if (preset === 'all') {
      startStr = '';
    }

    return { startStr, endStr: preset === 'all' ? '' : endStr };
  }, []);

  // Cargar metadatos de sucursales
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const branchRes = await reportsService.getAuthorizedBranches();
        if (mounted) {
          setBranches(branchRes.branches);
          if (!branchRes.isAdmin && branchRes.branches.length > 0) {
            setDashBranch(String(branchRes.branches[0].id_sucursal));
          }
        }
      } catch (err) {
        console.error('Error al cargar sucursales en DashboardIndex:', err);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  // Cargar métricas del dashboard en vivo
  const loadDashboardData = useCallback(async (forceRefresh = false) => {
    const { startStr, endStr } = calculatePresetRange(dashDatePreset);
    const params = {
      fecha_inicio: startStr || undefined,
      fecha_fin: endStr || undefined,
      id_sucursal: dashBranch ? Number(dashBranch) : undefined,
      role_view: roleView || undefined,
    };

    const cached = reportsService.getCachedDashboard(params);
    if (cached && !forceRefresh) {
      setDashboardData(cached);
      return;
    }

    setLoadingDashboard(true);
    try {
      const data = await reportsService.getDashboard(params, forceRefresh);
      setDashboardData(data);
    } catch (err) {
      console.error('Error al cargar métricas en DashboardIndex:', err);
    } finally {
      setLoadingDashboard(false);
    }
  }, [dashBranch, dashDatePreset, roleView, calculatePresetRange]);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  const toggleModule = (modulo: string) => {
    setOpenModules(prev => ({ ...prev, [modulo]: !prev[modulo] }));
  };

  const normalize = (value: string) =>
    value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();

  // Casos de uso internos visibles en el panel web para empleados/admin:
  const webPanelUseCaseIds = new Set([
    4, 5, 6, 7, 8, 9, 10,
    11, 13, 14, 15,
    16, 18, 19,
    22,
    27, 28,
    29,
    30, 31, 32, 33
  ]);

  const allowedFunciones = funciones.filter(f => {
    const access = normalize(f.nivel_acceso || '');
    return (
      webPanelUseCaseIds.has(f.id_funcion) &&
      access !== 'ninguno' &&
      access !== ''
    );
  });

  const getUseCaseRoute = (nombre: string, idFuncion?: number) => {
    if (idFuncion === 27) return '/pos';
    if (idFuncion === 28) return '/admin/devoluciones';
    if (idFuncion === 22) return '/admin/reservas';
    if (idFuncion === 18) return '/admin/inventario';
    if (idFuncion === 19) return '/admin/movimientos';
    if (idFuncion === 16) return '/admin/sucursales';
    if (idFuncion === 14) return '/admin/proveedores';
    if (idFuncion === 13) return '/admin/catalog?tab=products';
    if (idFuncion === 11) return '/catalog';
    if (idFuncion === 10) return '/admin/bitacora';
    if (idFuncion === 7 || idFuncion === 8 || idFuncion === 9) return '/admin/settings';
    if (idFuncion === 6) return '/admin/empleados';
    if (idFuncion === 5) return '/admin/roles';
    if (idFuncion === 4) return '/admin/users';
    if (idFuncion === 29) return '/virtual-fitting/1';
    if (idFuncion === 30) return '/admin';
    if (idFuncion === 31) return '/admin/reports';
    if (idFuncion === 32 || idFuncion === 33) return '/admin/reports?tab=qbe';

    const norm = normalize(nombre).replace(/^cu\d+\s*[-—]\s*/i, '');
    if (norm.includes('devolucion') || norm.includes('retorno')) return '/admin/devoluciones';
    if (norm.includes('usuario')) return '/admin/users';
    if (norm.includes('rol')) return '/admin/roles';
    if (norm.includes('empleado')) return '/admin/empleados';
    if (norm.includes('empresa') || norm.includes('apariencia') || norm.includes('backup')) return '/admin/settings';
    if (norm.includes('bitacora')) return '/admin/bitacora';
    if (norm.includes('catalogo') || norm.includes('producto') || norm.includes('categoria') || norm.includes('variante')) return '/admin/catalog?tab=products';
    if (norm.includes('proveedor')) return '/admin/proveedores';
    if (norm.includes('recomendacion') || norm.includes('ia')) return '/recommendations';
    if (norm.includes('sucursal') || norm.includes('ciudad')) return '/admin/sucursales';
    if (norm.includes('movimiento')) return '/admin/movimientos';
    if (norm.includes('inventario')) return '/admin/inventario';
    if (norm.includes('reserva')) return '/admin/reservas';
    if (norm.includes('venta') || norm.includes('pos') || norm.includes('presencial')) return '/pos';
    if (norm.includes('vestidor') || norm.includes('movil')) return '/virtual-fitting/1';
    if (norm.includes('qbe') || norm.includes('dinamico')) return '/admin/reports?tab=qbe';
    if (norm.includes('dashboard')) return '/admin';
    if (norm.includes('reporte') || norm.includes('inteligencia') || norm.includes('negocio') || norm.includes('voz')) return '/admin/reports';
    return '/admin';
  };

  const getFunctionIcon = (nombre: string) => {
    const norm = normalize(nombre);
    if (norm.includes('devolucion') || norm.includes('retorno')) return <RotateCcw size={18} />;
    if (norm.includes('usuario')) return <Users size={18} />;
    if (norm.includes('rol')) return <KeyRound size={18} />;
    if (norm.includes('empleado')) return <Building2 size={18} />;
    if (norm.includes('bitacora')) return <Clock size={18} />;
    if (norm.includes('movimiento')) return <ArrowLeftRight size={18} />;
    if (norm.includes('producto') || norm.includes('catalogo')) return <Package size={18} />;
    if (norm.includes('reserva')) return <Calendar size={18} />;
    if (norm.includes('venta') || norm.includes('pago')) return <ShoppingBag size={18} />;
    if (norm.includes('ia')) return <Sparkles size={18} />;
    if (norm.includes('reporte') || norm.includes('dashboard')) return <BarChart3 size={18} />;
    return <ShieldCheck size={18} />;
  };

  // Agrupar funciones por módulo
  const modulesMap = new Map<string, typeof allowedFunciones>();
  allowedFunciones.forEach(f => {
    if (!modulesMap.has(f.modulo)) modulesMap.set(f.modulo, []);
    modulesMap.get(f.modulo)!.push(f);
  });

  return (
    <div className="dashboard-index-container">
      {/* 1. Cabecera de bienvenida personalizada */}
      <div className="dashboard-hero-card">
        <div style={{ position: 'relative', zIndex: 2 }}>
          <div className="dashboard-hero-badge">
            <span className="dashboard-hero-dot"></span>
            Sesión Activa: {rol?.nombre || 'Personal Interno'}
          </div>
          <h1 className="dashboard-hero-title">
            Bienvenido, {user?.empleado?.nombre ? `${user.empleado.nombre} ${user.empleado.apellido || ''}` : user?.email}
          </h1>
          <p className="dashboard-hero-subtitle">
            {isSuperAdmin
              ? 'Panel ejecutivo con visibilidad global de la red comercial, rentabilidad y operaciones.'
              : `Has iniciado sesión como ${rol?.nombre}. A continuación dispones de la información clave y herramientas de tu rol.`}
          </p>
        </div>
      </div>

      {/* 2. Barra de Filtros del Dashboard de Inicio */}
      <div
        style={{
          backgroundColor: '#FFFFFF',
          borderRadius: '14px',
          border: '1px solid #EAE6DF',
          padding: '1.25rem 1.5rem',
          marginBottom: '1.75rem',
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '1rem',
          boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
        }}
      >
        {/* Presets de Período */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#736B63', marginRight: '0.25rem' }}>
            Período:
          </span>
          {[
            { id: 'today', label: 'Hoy' },
            { id: '7d', label: '7 Días' },
            { id: '30d', label: '30 Días' },
            { id: 'this_month', label: 'Este Mes' },
            { id: 'this_year', label: 'Año Actual' },
            { id: 'all', label: 'Histórico' },
          ].map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => setDashDatePreset(p.id)}
              style={{
                padding: '0.4rem 0.85rem',
                borderRadius: '8px',
                border: dashDatePreset === p.id ? '1px solid #C4956A' : '1px solid #E5E0D8',
                backgroundColor: dashDatePreset === p.id ? '#F4ECE1' : '#FFFFFF',
                color: dashDatePreset === p.id ? '#8C5E35' : '#4B433B',
                fontWeight: 600,
                fontSize: '0.82rem',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              {p.label}
            </button>
          ))}
        </div>

        {/* Selector de Rol (para Administrador), Sucursal y Actualizar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
          {isSuperAdmin && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', backgroundColor: '#FAF8F5', padding: '0.2rem 0.6rem', borderRadius: '8px', border: '1px solid #D1C9BE' }}>
              <UserCheck size={15} color="#8C5E35" />
              <span style={{ fontSize: '0.78rem', fontWeight: 600, color: '#736B63' }}>Rol:</span>
              <select
                value={roleView}
                onChange={(e) => setRoleView(e.target.value)}
                style={{
                  border: 'none',
                  backgroundColor: 'transparent',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  color: '#1C1510',
                  cursor: 'pointer',
                  outline: 'none',
                }}
              >
                <option value="">Administrador</option>
                <option value="manager">Encargado de Sucursal</option>
                <option value="cashier">Cajero (POS)</option>
                <option value="customer">Cliente (Ecommerce)</option>
              </select>
            </div>
          )}

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Store size={18} color="#8C5E35" />
            <select
              value={dashBranch}
              onChange={(e) => setDashBranch(e.target.value)}
              style={{
                padding: '0.45rem 0.85rem',
                borderRadius: '8px',
                border: '1px solid #D1C9BE',
                backgroundColor: '#FFFFFF',
                fontSize: '0.85rem',
                fontWeight: 600,
                color: '#2E2722',
                cursor: 'pointer',
                outline: 'none',
              }}
            >
              {isSuperAdmin && <option value="">Consolidado Nacional (Todas)</option>}
              {branches.map((b) => (
                <option key={b.id_sucursal} value={b.id_sucursal}>
                  {b.nombre}
                </option>
              ))}
            </select>
          </div>

          <button
            type="button"
            onClick={() => loadDashboardData(true)}
            disabled={loadingDashboard}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              padding: '0.45rem 0.85rem',
              borderRadius: '8px',
              border: '1px solid #D1C9BE',
              backgroundColor: '#FAF8F5',
              color: '#4B433B',
              fontSize: '0.82rem',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            <RefreshCw size={14} className={loadingDashboard ? 'spin' : ''} />
            Actualizar
          </button>
        </div>
      </div>

      {/* 3. Renderizado del Dashboard Especializado por Rol */}
      <div style={{ marginBottom: '2.5rem' }}>
        {loadingDashboard && !dashboardData ? (
          <div style={{ padding: '4rem', textAlign: 'center', color: '#8C5E35' }}>
            <RefreshCw size={36} className="spin" style={{ margin: '0 auto 1rem auto' }} />
            <p style={{ fontWeight: 600 }}>Cargando indicadores de tu rol en tiempo real...</p>
          </div>
        ) : dashboardData?.roleDashboard ? (
          <>
            {dashboardData.roleDashboard.role === 'admin' && (
              <AdminDashboardView data={dashboardData.roleDashboard} />
            )}
            {dashboardData.roleDashboard.role === 'manager' && (
              <ManagerDashboardView data={dashboardData.roleDashboard} />
            )}
            {dashboardData.roleDashboard.role === 'cashier' && (
              <CashierDashboardView data={dashboardData.roleDashboard} />
            )}
            {dashboardData.roleDashboard.role === 'customer' && (
              <CustomerDashboardView data={dashboardData.roleDashboard} />
            )}
          </>
        ) : null}
      </div>

      {/* 4. Módulos y Funciones Habilitados para el Empleado */}
      <div style={{ marginBottom: '2rem' }}>
        <div className="dashboard-section-header">
          <div>
            <h2 className="dashboard-section-title">
              Tus Módulos y Accesos Directos
            </h2>
            <p className="dashboard-section-subtitle">
              Accede a las herramientas y operaciones autorizadas para tu perfil.
            </p>
          </div>
        </div>

        {modulesMap.size === 0 ? (
          <div style={{
            backgroundColor: '#FFFFFF',
            borderRadius: '12px',
            padding: '3rem',
            textAlign: 'center',
            border: '1px solid #EAEAEA'
          }}>
            <Lock size={40} color="#8C827A" style={{ marginBottom: '1rem' }} />
            <h3 style={{ fontSize: '1.15rem', color: '#1A1A1A', marginBottom: '0.5rem' }}>No tienes funciones asignadas actualmente</h3>
            <p style={{ color: '#666', maxWidth: '500px', margin: '0 auto' }}>
              Contacta a un Administrador del sistema para que configure los permisos correspondientes a tu rol.
            </p>
          </div>
        ) : (
          <div className="dashboard-modules-grid">
            {Array.from(modulesMap.entries()).map(([modulo, funcs]) => {
              const isOpen = !!openModules[modulo];
              return (
                <div key={modulo} className={`dashboard-module-card ${isOpen ? 'is-open' : ''}`}>
                  <div
                    onClick={() => toggleModule(modulo)}
                    className="dashboard-module-header"
                  >
                    <div className="dashboard-module-info">
                      <div className="dashboard-module-icon-wrap" style={{
                        backgroundColor: isOpen ? '#8C5E35' : '#FAF8F5',
                        color: isOpen ? '#FFFFFF' : '#8C5E35'
                      }}>
                        <ShieldCheck size={20} />
                      </div>
                      <div>
                        <h3 className="dashboard-module-title">
                          {modulo.replace('Gestión de ', '')}
                        </h3>
                        <span className="dashboard-module-count">
                          {funcs.length} {funcs.length === 1 ? 'función asignada' : 'funciones asignadas'}
                        </span>
                      </div>
                    </div>

                    <div className="dashboard-module-toggle-pill" style={{
                      color: isOpen ? '#8C5E35' : '#736B63',
                      backgroundColor: isOpen ? '#F4ECE1' : '#F5F5F5'
                    }}>
                      <span>{isOpen ? 'Ocultar' : 'Abrir'}</span>
                      {isOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    </div>
                  </div>

                  {isOpen && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '1.25rem', paddingTop: '1rem', borderTop: '1px solid #F0ECE6' }}>
                      {funcs.map(f => (
                        <button
                          key={f.nombre}
                          type="button"
                          className="dashboard-function-btn"
                          onClick={() => navigate(getUseCaseRoute(f.nombre, f.id_funcion))}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                            <span style={{ color: '#8C5E35', display: 'flex' }}>{getFunctionIcon(f.nombre)}</span>
                            <span style={{ fontSize: '0.9rem', fontWeight: 600 }}>{f.nombre.replace(/^CU\d+\s*[-—]\s*/i, '')}</span>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', alignSelf: 'flex-end' }}>
                            <span style={{
                              fontSize: '0.72rem',
                              fontWeight: 700,
                              textTransform: 'uppercase',
                              letterSpacing: '0.04em',
                              padding: '0.2rem 0.5rem',
                              borderRadius: '9999px',
                              backgroundColor: f.nivel_acceso?.toLowerCase() === 'edicion' ? '#DCFCE7' : '#E0F2FE',
                              color: f.nivel_acceso?.toLowerCase() === 'edicion' ? '#15803D' : '#0369A1'
                            }}>
                              {f.nivel_acceso || 'Lectura'}
                            </span>
                            <ArrowRight size={14} color="#8C827A" />
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
