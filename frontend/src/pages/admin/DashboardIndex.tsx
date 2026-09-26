import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../modules/users-security/shared/components/AuthContext';
import {
  Package,
  Users,
  ShieldCheck,
  ShoppingBag,
  ArrowRight,
  Lock,
  CheckCircle2,
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
} from 'lucide-react';
import './DashboardIndex.css';

export default function DashboardIndex() {
  const { user, rol, funciones } = useAuth();
  const navigate = useNavigate();
  const [openModules, setOpenModules] = useState<Record<string, boolean>>({});

  const toggleModule = (modulo: string) => {
    setOpenModules(prev => ({ ...prev, [modulo]: !prev[modulo] }));
  };

  const normalize = (value: string) =>
  value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();

  // Casos de uso internos visibles en el panel web para empleados/admin: 04, 05, 06, 07, 10, 11, 13, 15, 16, 19, 24, 26, 27
  const webPanelUseCaseIds = new Set([4, 5, 6, 7, 10, 11, 13, 15, 16, 19, 24, 26, 27]);

  // Filtrar funciones activas (acceso distinto a Ninguno) excluyendo el módulo 6 móvil
  const allowedFunciones = funciones.filter(f => {
    const access = normalize(f.nivel_acceso || '');
    const isMobileExclusive = normalize(f.modulo || '').includes('movil');
    return (
      webPanelUseCaseIds.has(f.id_funcion) &&
      !isMobileExclusive &&
      access !== 'ninguno' &&
      access !== ''
    );
  });

  const getUseCaseRoute = (nombre: string, idFuncion?: number) => {
    if (idFuncion === 24) return '/pos';
    if (idFuncion === 26) return '/admin/devoluciones';
    const norm = normalize(nombre).replace(/^cu\d+\s*[-—]\s*/i, '');
    if (norm.includes('devolucion') || norm.includes('retorno')) return '/admin/devoluciones';
    if (norm.includes('usuario')) return '/admin/users';
    if (norm.includes('rol')) return '/admin/roles';
    if (norm.includes('empleado')) return '/admin/empleados';
    if (norm.includes('bitacora')) return '/admin/bitacora';
    if (norm.includes('catalogo') || norm.includes('producto') || norm.includes('categoria') || norm.includes('variante')) return '/admin/catalog?tab=products';
    if (norm.includes('proveedor')) return '/admin/proveedores';
    if (norm.includes('recomendacion') || norm.includes('ia')) return '/recommendations';
    if (norm.includes('sucursal') || norm.includes('ciudad')) return '/admin/sucursales';
    if (norm.includes('movimiento')) return '/admin/movimientos';
    if (norm.includes('inventario')) return '/admin/inventario';
    if (norm.includes('reserva')) return '/admin/reservas';
    if (norm.includes('venta') || norm.includes('pos') || norm.includes('presencial')) return '/pos';
    if (norm.includes('dashboard') || norm.includes('reporte')) return '/admin/reports';
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

  const isSuperAdmin = rol?.id_rol === 1 || rol?.nombre?.toLowerCase() === 'administrador';

  return (
    <div className="dashboard-index-container">
      {/* Cabecera de bienvenida personalizada */}
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
              ? 'Tienes privilegios completos de Administrador sobre todos los módulos y funciones del sistema.'
              : `Has iniciado sesión con el rol de ${rol?.nombre}. En este panel dispones de acceso exclusivo a los módulos y herramientas que tienes asignados.`}
          </p>
        </div>
      </div>

      {/* Métricas / Resumen del perfil del colaborador */}
      <div className="dashboard-metrics-grid">
        <div style={metricCardStyle}>
          <div style={iconWrapperStyle('#F4ECE1', '#8C5E35')}><KeyRound size={22} color="#8C5E35" /></div>
          <div>
            <span style={metricLabel}>Rol Asignado</span>
            <p style={metricValue}>{rol?.nombre || 'Colaborador'}</p>
          </div>
        </div>

        <div style={metricCardStyle}>
          <div style={iconWrapperStyle('#E0F2FE', '#0284C7')}><ShieldCheck size={22} color="#0284C7" /></div>
          <div>
            <span style={metricLabel}>Módulos Habilitados</span>
            <p style={metricValue}>{modulesMap.size} Módulos</p>
          </div>
        </div>

        <div style={metricCardStyle}>
          <div style={iconWrapperStyle('#DCFCE7', '#16A34A')}><CheckCircle2 size={22} color="#16A34A" /></div>
          <div>
            <span style={metricLabel}>Funciones Asignadas</span>
            <p style={metricValue}>{allowedFunciones.length} Operaciones</p>
          </div>
        </div>

        {user?.empleado?.codigo_empleado && (
          <div style={metricCardStyle}>
            <div style={iconWrapperStyle('#FEF08A', '#A16207')}><Building2 size={22} color="#A16207" /></div>
            <div>
              <span style={metricLabel}>Código de Empleado</span>
              <p style={metricValue}>{user.empleado.codigo_empleado}</p>
            </div>
          </div>
        )}
      </div>

      {/* Módulos y Funciones Habilitados para el Empleado */}
      <div style={{ marginBottom: '2rem' }}>
        <div className="dashboard-section-header">
          <div>
            <h2 className="dashboard-section-title">
              Tus Módulos y Accesos Directos
            </h2>
            <p className="dashboard-section-subtitle">
              Selecciona cualquier función autorizada para comenzar a operar en el sistema.
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

const metricCardStyle: React.CSSProperties = {
  backgroundColor: '#FFFFFF',
  padding: '1.25rem 1.5rem',
  borderRadius: '12px',
  border: '1px solid #EAE6DF',
  display: 'flex',
  alignItems: 'center',
  gap: '1rem',
  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.02)'
};

const iconWrapperStyle = (bgColor: string, color: string): React.CSSProperties => ({
  backgroundColor: bgColor,
  color: color,
  padding: '0.75rem',
  borderRadius: '10px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  flexShrink: 0
});

const metricLabel: React.CSSProperties = {
  fontSize: '0.78rem',
  color: '#8C827A',
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
  fontWeight: 600,
  display: 'block',
  marginBottom: '0.2rem'
};

const metricValue: React.CSSProperties = {
  fontSize: '1.25rem',
  fontWeight: 700,
  color: '#1A1A1A',
  margin: 0
};
