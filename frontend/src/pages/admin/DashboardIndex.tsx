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
  ArrowLeftRight
} from 'lucide-react';

export default function DashboardIndex() {
  const { user, rol, funciones } = useAuth();
  const navigate = useNavigate();
  const [openModules, setOpenModules] = useState<Record<string, boolean>>({});

  const toggleModule = (modulo: string) => {
    setOpenModules(prev => ({ ...prev, [modulo]: !prev[modulo] }));
  };

  const normalize = (value: string) =>
  value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();

  // Casos de uso internos visibles en el panel web para empleados/admin: 04, 05, 06, 07, 10, 11, 13, 15, 16, 19, 24, 27
  const webPanelUseCaseIds = new Set([4, 5, 6, 7, 10, 11, 13, 15, 16, 19, 24, 27]);

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
    const norm = normalize(nombre).replace(/^cu\d+\s*[-—]\s*/i, '');
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
    <div style={{ padding: '2rem', maxWidth: '1400px', margin: '0 auto' }}>
      {/* Cabecera de bienvenida personalizada */}
      <div style={{
        background: 'linear-gradient(135deg, #1C1510 0%, #2E221A 100%)',
        color: '#FFFFFF',
        borderRadius: '16px',
        padding: '2.5rem',
        marginBottom: '2rem',
        boxShadow: '0 10px 30px rgba(0, 0, 0, 0.15)',
        position: 'relative',
        overflow: 'hidden',
        border: '1px solid rgba(196, 149, 106, 0.3)'
      }}>
        <div style={{ position: 'relative', zIndex: 2 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(196, 149, 106, 0.25)', padding: '0.35rem 0.85rem', borderRadius: '9999px', fontSize: '0.8rem', fontWeight: 600, color: '#EBD5BE', marginBottom: '1rem' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#10B981' }}></span>
            Sesión Activa: {rol?.nombre || 'Personal Interno'}
          </div>
          <h1 style={{ fontSize: '2.3rem', fontFamily: 'var(--font-display, Georgia, serif)', margin: '0 0 0.5rem 0', letterSpacing: '-0.02em', color: '#FFFFFF', fontWeight: 700 }}>
            Bienvenido, {user?.empleado?.nombre ? `${user.empleado.nombre} ${user.empleado.apellido || ''}` : user?.email}
          </h1>
          <p style={{ color: '#F3EAE2', maxWidth: '680px', fontSize: '1.02rem', lineHeight: 1.6, margin: 0 }}>
            {isSuperAdmin
              ? 'Tienes privilegios completos de Administrador sobre todos los módulos y funciones del sistema.'
              : `Has iniciado sesión con el rol de ${rol?.nombre}. En este panel dispones de acceso exclusivo a los módulos y herramientas que tienes asignados.`}
          </p>

        </div>
      </div>

      {/* Métricas / Resumen del perfil del colaborador */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
        gap: '1.25rem',
        marginBottom: '2.5rem'
      }}>
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
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
          <div>
            <h2 style={{ fontSize: '1.35rem', fontWeight: 700, color: '#1A1A1A', margin: '0 0 0.25rem 0' }}>
              Tus Módulos y Accesos Directos
            </h2>
            <p style={{ color: '#736B63', fontSize: '0.9rem', margin: 0 }}>
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
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
            gap: '1.5rem'
          }}>
            {Array.from(modulesMap.entries()).map(([modulo, funcs]) => {
              const isOpen = !!openModules[modulo];
              return (
                <div key={modulo} style={{
                  backgroundColor: '#FFFFFF',
                  borderRadius: '14px',
                  border: isOpen ? '1px solid #C4956A' : '1px solid #EAE6DF',
                  padding: '1.25rem 1.5rem',
                  boxShadow: isOpen ? '0 4px 14px rgba(196,149,106,0.12)' : '0 2px 10px rgba(0,0,0,0.03)',
                  transition: 'all 0.2s ease'
                }}>
                  <div
                    onClick={() => toggleModule(modulo)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      cursor: 'pointer',
                      userSelect: 'none'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <div style={{
                        backgroundColor: isOpen ? '#8C5E35' : '#FAF8F5',
                        border: '1px solid #EAE4DC',
                        padding: '0.6rem',
                        borderRadius: '10px',
                        color: isOpen ? '#FFFFFF' : '#8C5E35',
                        transition: 'all 0.2s ease'
                      }}>
                        <ShieldCheck size={20} />
                      </div>
                      <div>
                        <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#1A1A1A', margin: 0 }}>
                          {modulo.replace('Gestión de ', '')}
                        </h3>
                        <span style={{ fontSize: '0.78rem', color: '#8C827A' }}>
                          {funcs.length} {funcs.length === 1 ? 'función asignada' : 'funciones asignadas'}
                        </span>
                      </div>
                    </div>

                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.4rem',
                      fontSize: '0.82rem',
                      fontWeight: 600,
                      color: isOpen ? '#8C5E35' : '#736B63',
                      backgroundColor: isOpen ? '#F4ECE1' : '#F5F5F5',
                      padding: '0.4rem 0.75rem',
                      borderRadius: '8px'
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
                          onClick={() => navigate(getUseCaseRoute(f.nombre, f.id_funcion))}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            padding: '0.75rem 1rem',
                            borderRadius: '8px',
                            border: '1px solid #F0ECE6',
                            backgroundColor: '#FAF8F5',
                            cursor: 'pointer',
                            textAlign: 'left',
                            transition: 'all 0.2s ease',
                            color: '#2E2722'
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = '#F2EDE4';
                            e.currentTarget.style.borderColor = '#C4956A';
                            e.currentTarget.style.transform = 'translateX(4px)';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = '#FAF8F5';
                            e.currentTarget.style.borderColor = '#F0ECE6';
                            e.currentTarget.style.transform = 'translateX(0)';
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                            <span style={{ color: '#8C5E35' }}>{getFunctionIcon(f.nombre)}</span>
                            <span style={{ fontSize: '0.9rem', fontWeight: 600 }}>{f.nombre.replace(/^CU\d+\s*[-—]\s*/i, '')}</span>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
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
