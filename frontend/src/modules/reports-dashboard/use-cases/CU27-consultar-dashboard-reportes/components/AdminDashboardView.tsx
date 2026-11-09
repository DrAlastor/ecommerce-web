import React from 'react';
import {
  TrendingUp,
  DollarSign,
  CreditCard,
  Package,
  Building2,
  AlertTriangle,
  ShieldAlert,
} from 'lucide-react';
import type { RoleDashboardData } from '../types/reports.types';

interface AdminDashboardViewProps {
  data: RoleDashboardData;
}

const cardStyle: React.CSSProperties = {
  backgroundColor: '#FFFFFF',
  borderRadius: '12px',
  padding: '1.25rem',
  border: '1px solid #EAE6DF',
  boxShadow: '0 2px 8px rgba(0,0,0,0.02)',
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'space-between',
};

const formatBs = (val: number): string =>
  `Bs. ${Number(val || 0).toLocaleString('es-BO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export const AdminDashboardView: React.FC<AdminDashboardViewProps> = ({ data }) => {
  const admin = data.admin;
  if (!admin) return null;

  const { kpis, charts, executiveAlerts } = admin;
  const maxRevenue = Math.max(...charts.evolucionIngresos.map((d) => d.total), 1);
  const maxBranchVal = Math.max(...charts.rankingSucursales.map((b) => b.total), 1);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', color: '#1C1510' }}>
      {/* 1. FILA DE 4 KPIS EJECUTIVOS ESENCIALES */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: '1rem',
        }}
      >
        {/* KPI 1: Ingresos Netos */}
        <div style={cardStyle}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.82rem', fontWeight: 600, color: '#736B63' }}>Ingresos Netos Consolidados</span>
            <div style={{ backgroundColor: '#DCFCE7', padding: '0.4rem', borderRadius: '8px', color: '#15803D' }}>
              <DollarSign size={17} />
            </div>
          </div>
          <div style={{ fontSize: '1.65rem', fontWeight: 700, color: '#15803D', letterSpacing: '-0.02em' }}>
            {formatBs(kpis.totalIngresosNetos)}
          </div>
          <div style={{ fontSize: '0.76rem', color: '#736B63', marginTop: '0.35rem' }}>
            Facturado neto en el período
          </div>
        </div>

        {/* KPI 2: Margen Bruto */}
        <div style={cardStyle}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.82rem', fontWeight: 600, color: '#736B63' }}>Margen Bruto Estimado</span>
            <div style={{ backgroundColor: '#F4ECE1', padding: '0.4rem', borderRadius: '8px', color: '#8C5E35' }}>
              <TrendingUp size={17} />
            </div>
          </div>
          <div style={{ fontSize: '1.65rem', fontWeight: 700, color: '#8C5E35', letterSpacing: '-0.02em' }}>
            {formatBs(kpis.margenBrutoEstimado)}
          </div>
          <div style={{ fontSize: '0.76rem', color: '#736B63', marginTop: '0.35rem' }}>
            42% margen sobre ventas netas
          </div>
        </div>

        {/* KPI 3: Ticket Promedio Nacional */}
        <div style={cardStyle}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.82rem', fontWeight: 600, color: '#736B63' }}>Ticket Promedio Nacional</span>
            <div style={{ backgroundColor: '#FEF3C7', padding: '0.4rem', borderRadius: '8px', color: '#B45309' }}>
              <CreditCard size={17} />
            </div>
          </div>
          <div style={{ fontSize: '1.65rem', fontWeight: 700, color: '#1C1510', letterSpacing: '-0.02em' }}>
            {formatBs(kpis.ticketPromedioNacional)}
          </div>
          <div style={{ fontSize: '0.76rem', color: '#736B63', marginTop: '0.35rem' }}>
            Promedio por comprobante
          </div>
        </div>

        {/* KPI 4: Inventario Valorizado */}
        <div style={cardStyle}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.82rem', fontWeight: 600, color: '#736B63' }}>Stock Valorizado en Red</span>
            <div style={{ backgroundColor: '#E0E7FF', padding: '0.4rem', borderRadius: '8px', color: '#4338CA' }}>
              <Package size={17} />
            </div>
          </div>
          <div style={{ fontSize: '1.65rem', fontWeight: 700, color: '#1C1510', letterSpacing: '-0.02em' }}>
            {formatBs(kpis.inventarioValorizado)}
          </div>
          <div style={{ fontSize: '0.76rem', color: '#736B63', marginTop: '0.35rem' }}>
            Capital activo disponible en tiendas
          </div>
        </div>
      </div>

      {/* 2. GRÁFICOS ESTRATÉGICOS GEMELOS (MÁXIMO 2) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(440px, 1fr))', gap: '1.25rem' }}>
        {/* Gráfico 1: Evolución Temporal */}
        <div
          style={{
            backgroundColor: '#FFFFFF',
            borderRadius: '12px',
            border: '1px solid #EAE6DF',
            padding: '1.25rem 1.5rem',
            boxShadow: '0 2px 8px rgba(0,0,0,0.02)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
            <div>
              <h3 style={{ fontSize: '0.98rem', fontWeight: 700, margin: 0, color: '#1C1510' }}>
                Evolución de Ingresos
              </h3>
              <p style={{ fontSize: '0.76rem', color: '#736B63', margin: '0.15rem 0 0 0' }}>
                Ventas diarias netas en el período
              </p>
            </div>
            <span style={{ fontSize: '0.76rem', fontWeight: 600, color: '#8C5E35' }}>
              {charts.evolucionIngresos.length} días registrados
            </span>
          </div>

          {charts.evolucionIngresos.length === 0 ? (
            <div style={{ padding: '2rem', textAlign: 'center', color: '#736B63', fontSize: '0.82rem' }}>
              No se registraron ventas en el rango de fechas seleccionado.
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: '0.5rem', height: '180px', paddingTop: '1rem' }}>
              {charts.evolucionIngresos.slice(-14).map((item, idx) => {
                const pct = Math.max(8, Math.round((item.total / maxRevenue) * 100));
                return (
                  <div
                    key={idx}
                    style={{
                      flex: 1,
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '0.35rem',
                      height: '100%',
                      justifyContent: 'flex-end',
                    }}
                    title={`${item.fecha}: ${formatBs(item.total)} (${item.ventas} ventas)`}
                  >
                    <div
                      style={{
                        width: '100%',
                        maxWidth: '24px',
                        height: `${pct}%`,
                        backgroundColor: '#8C5E35',
                        borderRadius: '4px 4px 0 0',
                        transition: 'height 0.3s ease',
                      }}
                    />
                    <span style={{ fontSize: '0.68rem', color: '#736B63', whiteSpace: 'nowrap' }}>
                      {item.fecha.slice(5)}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Gráfico 2: Ranking por Sucursal */}
        <div
          style={{
            backgroundColor: '#FFFFFF',
            borderRadius: '12px',
            border: '1px solid #EAE6DF',
            padding: '1.25rem 1.5rem',
            boxShadow: '0 2px 8px rgba(0,0,0,0.02)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
            <div>
              <h3 style={{ fontSize: '0.98rem', fontWeight: 700, margin: 0, color: '#1C1510' }}>
                Rendimiento por Sucursal
              </h3>
              <p style={{ fontSize: '0.76rem', color: '#736B63', margin: '0.15rem 0 0 0' }}>
                Participación porcentual y ventas por tienda
              </p>
            </div>
            <Building2 size={16} color="#736B63" />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            {charts.rankingSucursales.map((b, idx) => {
              const widthPct = Math.max(10, Math.round((b.total / maxBranchVal) * 100));
              return (
                <div key={idx}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: '0.25rem' }}>
                    <span style={{ fontWeight: 600, color: '#1C1510' }}>{b.sucursal}</span>
                    <span style={{ fontWeight: 700, color: '#8C5E35' }}>
                      {formatBs(b.total)} ({b.porcentaje}%)
                    </span>
                  </div>
                  <div style={{ backgroundColor: '#F0ECE4', height: '9px', borderRadius: '5px', overflow: 'hidden' }}>
                    <div
                      style={{
                        width: `${widthPct}%`,
                        backgroundColor: idx === 0 ? '#15803D' : '#8C5E35',
                        height: '100%',
                        borderRadius: '5px',
                        transition: 'width 0.4s ease',
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* 3. BLOQUE INFERIOR: TOP CATEGORÍAS Y ALERTAS EJECUTIVAS */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '1.25rem' }}>
        {/* Top Categorías */}
        <div
          style={{
            backgroundColor: '#FFFFFF',
            borderRadius: '12px',
            border: '1px solid #EAE6DF',
            padding: '1.25rem',
            boxShadow: '0 2px 8px rgba(0,0,0,0.02)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.85rem' }}>
            <h4 style={{ fontSize: '0.9rem', fontWeight: 700, margin: 0, color: '#1C1510' }}>
              Top Líneas Textiles Más Rentables
            </h4>
            <span style={{ fontSize: '0.74rem', color: '#736B63' }}>Por recaudación neta</span>
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #EAE6DF', color: '#736B63', textAlign: 'left' }}>
                <th style={{ padding: '0.4rem 0' }}>Categoría</th>
                <th style={{ padding: '0.4rem 0', textAlign: 'center' }}>Prendas</th>
                <th style={{ padding: '0.4rem 0', textAlign: 'right' }}>Total</th>
              </tr>
            </thead>
            <tbody>
              {charts.topCategorias.map((c, idx) => (
                <tr key={idx} style={{ borderBottom: '1px solid #FAF8F5' }}>
                  <td style={{ padding: '0.45rem 0', fontWeight: 500 }}>{c.categoria}</td>
                  <td style={{ padding: '0.45rem 0', textAlign: 'center', color: '#736B63' }}>{c.unidades} uds</td>
                  <td style={{ padding: '0.45rem 0', textAlign: 'right', fontWeight: 700, color: '#1C1510' }}>
                    {formatBs(c.total)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Alertas Ejecutivas */}
        <div
          style={{
            backgroundColor: '#FFFFFF',
            borderRadius: '12px',
            border: '1px solid #EAE6DF',
            padding: '1.25rem',
            boxShadow: '0 2px 8px rgba(0,0,0,0.02)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', marginBottom: '0.85rem' }}>
            <ShieldAlert size={16} color="#B91C1C" />
            <h4 style={{ fontSize: '0.9rem', fontWeight: 700, margin: 0, color: '#1C1510' }}>
              Alertas y Riesgos Operativos
            </h4>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.55rem' }}>
            {executiveAlerts.length === 0 ? (
              <div style={{ padding: '1rem', textAlign: 'center', color: '#15803D', fontSize: '0.8rem' }}>
                No se registran alertas operativas críticas en este período.
              </div>
            ) : (
              executiveAlerts.map((alt, idx) => (
                <div
                  key={idx}
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '0.55rem',
                    backgroundColor: alt.tipo === 'stock' ? '#FEF2F2' : alt.tipo === 'devoluciones' ? '#FFFBEB' : '#FAF8F5',
                    border: `1px solid ${alt.tipo === 'stock' ? '#FECACA' : alt.tipo === 'devoluciones' ? '#FDE68A' : '#EAE6DF'}`,
                    padding: '0.65rem 0.85rem',
                    borderRadius: '8px',
                    fontSize: '0.78rem',
                  }}
                >
                  <AlertTriangle
                    size={14}
                    color={alt.tipo === 'stock' ? '#DC2626' : alt.tipo === 'devoluciones' ? '#D97706' : '#8C5E35'}
                    style={{ flexShrink: 0, marginTop: '2px' }}
                  />
                  <div style={{ color: '#1C1510' }}>{alt.mensaje}</div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
