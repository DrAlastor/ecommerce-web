import React from 'react';
import {
  Store,
  Users,
  Calendar,
  AlertTriangle,
  Clock,
  ArrowRightLeft,
  CheckCircle,
} from 'lucide-react';
import type { RoleDashboardData } from '../types/reports.types';

interface ManagerDashboardViewProps {
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

export const ManagerDashboardView: React.FC<ManagerDashboardViewProps> = ({ data }) => {
  const manager = data.manager;
  if (!manager) return null;

  const { kpis, charts, tables } = manager;
  const maxSellerTotal = Math.max(...charts.ventasPorVendedor.map((s) => s.total), 1);
  const maxHourTx = Math.max(...charts.ventasPorHoras.map((h) => h.transacciones), 1);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', color: '#1C1510' }}>
      {/* 1. FILA DE 4 KPIS OPERATIVOS DE SUCURSAL */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: '1rem',
        }}
      >
        {/* KPI 1: Ventas Sucursal Hoy */}
        <div style={cardStyle}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.82rem', fontWeight: 600, color: '#736B63' }}>Venta Sucursal Hoy</span>
            <div style={{ backgroundColor: '#DCFCE7', padding: '0.4rem', borderRadius: '8px', color: '#15803D' }}>
              <Store size={17} />
            </div>
          </div>
          <div style={{ fontSize: '1.65rem', fontWeight: 700, color: '#15803D', letterSpacing: '-0.02em' }}>
            {formatBs(kpis.ventasHoy)}
          </div>
          <div style={{ fontSize: '0.76rem', color: '#736B63', marginTop: '0.35rem' }}>
            En {data.branchName || 'esta tienda'}
          </div>
        </div>

        {/* KPI 2: Transacciones del Día */}
        <div style={cardStyle}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.82rem', fontWeight: 600, color: '#736B63' }}>Clientes y Tickets Hoy</span>
            <div style={{ backgroundColor: '#F4ECE1', padding: '0.4rem', borderRadius: '8px', color: '#8C5E35' }}>
              <Users size={17} />
            </div>
          </div>
          <div style={{ fontSize: '1.65rem', fontWeight: 700, color: '#1C1510', letterSpacing: '-0.02em' }}>
            {kpis.transaccionesHoy}
          </div>
          <div style={{ fontSize: '0.76rem', color: '#736B63', marginTop: '0.35rem' }}>
            Comprobantes emitidos en mostrador
          </div>
        </div>

        {/* KPI 3: Reservas Pendientes de Retiro */}
        <div style={cardStyle}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.82rem', fontWeight: 600, color: '#736B63' }}>Reservas por Retirar</span>
            <div style={{ backgroundColor: '#FEF3C7', padding: '0.4rem', borderRadius: '8px', color: '#B45309' }}>
              <Calendar size={17} />
            </div>
          </div>
          <div style={{ fontSize: '1.65rem', fontWeight: 700, color: '#B45309', letterSpacing: '-0.02em' }}>
            {kpis.reservasPendientes}
          </div>
          <div style={{ fontSize: '0.76rem', color: '#736B63', marginTop: '0.35rem' }}>
            Prendas apartadas por clientes
          </div>
        </div>

        {/* KPI 4: Quiebres de Stock */}
        <div style={cardStyle}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.82rem', fontWeight: 600, color: '#736B63' }}>Quiebres de Stock Local</span>
            <div style={{ backgroundColor: '#FEE2E2', padding: '0.4rem', borderRadius: '8px', color: '#DC2626' }}>
              <AlertTriangle size={17} />
            </div>
          </div>
          <div style={{ fontSize: '1.65rem', fontWeight: 700, color: '#DC2626', letterSpacing: '-0.02em' }}>
            {kpis.quiebresStock}
          </div>
          <div style={{ fontSize: '0.76rem', color: '#736B63', marginTop: '0.35rem' }}>
            Prendas agotadas o bajo mínimo
          </div>
        </div>
      </div>

      {/* 2. GRÁFICOS OPERATIVOS DE TIENDA */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(440px, 1fr))', gap: '1.25rem' }}>
        {/* Gráfico 1: Rendimiento por Vendedor/Cajero */}
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
                Ventas por Personal de Tienda
              </h3>
              <p style={{ fontSize: '0.76rem', color: '#736B63', margin: '0.15rem 0 0 0' }}>
                Desempeño del equipo en esta sucursal
              </p>
            </div>
            <Users size={16} color="#736B63" />
          </div>

          {charts.ventasPorVendedor.length === 0 ? (
            <div style={{ padding: '2rem', textAlign: 'center', color: '#736B63', fontSize: '0.82rem' }}>
              Sin registros de ventas por empleado en esta tienda.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              {charts.ventasPorVendedor.map((s, idx) => {
                const widthPct = Math.max(12, Math.round((s.total / maxSellerTotal) * 100));
                return (
                  <div key={idx}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: '0.25rem' }}>
                      <span style={{ fontWeight: 600, color: '#1C1510' }}>{s.vendedor}</span>
                      <span style={{ fontWeight: 700, color: '#8C5E35' }}>
                        {formatBs(s.total)} ({s.transacciones} ops)
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
          )}
        </div>

        {/* Gráfico 2: Curva de Horas Pico */}
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
                Flujo Horario de Clientes
              </h3>
              <p style={{ fontSize: '0.76rem', color: '#736B63', margin: '0.15rem 0 0 0' }}>
                Horas pico para soporte y atención en caja
              </p>
            </div>
            <Clock size={16} color="#736B63" />
          </div>

          {charts.ventasPorHoras.length === 0 ? (
            <div style={{ padding: '2rem', textAlign: 'center', color: '#736B63', fontSize: '0.82rem' }}>
              Sin actividad por hora registrada hoy.
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: '0.45rem', height: '160px', paddingTop: '1rem' }}>
              {charts.ventasPorHoras.map((h, idx) => {
                const pct = Math.max(10, Math.round((h.transacciones / maxHourTx) * 100));
                return (
                  <div
                    key={idx}
                    style={{
                      flex: 1,
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '0.3rem',
                      height: '100%',
                      justifyContent: 'flex-end',
                    }}
                    title={`${h.hora}: ${h.transacciones} transacciones (${formatBs(h.total)})`}
                  >
                    <div
                      style={{
                        width: '100%',
                        maxWidth: '22px',
                        height: `${pct}%`,
                        backgroundColor: '#C4956A',
                        borderRadius: '4px 4px 0 0',
                      }}
                    />
                    <span style={{ fontSize: '0.66rem', color: '#736B63' }}>{h.hora}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* 3. TABLAS DE ACCIÓN INMEDIATA: RESERVAS Y STOCK CRÍTICO */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(440px, 1fr))', gap: '1.25rem' }}>
        {/* Tabla: Reservas para Retiro Hoy */}
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
              Reservas con Retiro Programado
            </h4>
            <span style={{ fontSize: '0.74rem', color: '#736B63' }}>Mostrador de tienda</span>
          </div>

          {tables.reservasHoy.length === 0 ? (
            <div style={{ padding: '1.5rem', textAlign: 'center', color: '#736B63', fontSize: '0.8rem' }}>
              No hay reservas pendientes de retiro en esta sucursal.
            </div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.78rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #EAE6DF', color: '#736B63', textAlign: 'left' }}>
                  <th style={{ padding: '0.4rem 0' }}>Código / Cliente</th>
                  <th style={{ padding: '0.4rem 0' }}>Prendas</th>
                  <th style={{ padding: '0.4rem 0', textAlign: 'right' }}>Total</th>
                  <th style={{ padding: '0.4rem 0', textAlign: 'center' }}>Estado</th>
                </tr>
              </thead>
              <tbody>
                {tables.reservasHoy.map((r) => (
                  <tr key={r.id_reserva} style={{ borderBottom: '1px solid #FAF8F5' }}>
                    <td style={{ padding: '0.5rem 0' }}>
                      <div style={{ fontWeight: 600, color: '#1C1510' }}>{r.cliente}</div>
                      <div style={{ fontSize: '0.7rem', color: '#8C5E35' }}>{r.codigo}</div>
                    </td>
                    <td style={{ padding: '0.5rem 0', color: '#4B433B', maxWidth: '160px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {r.prendas}
                    </td>
                    <td style={{ padding: '0.5rem 0', textAlign: 'right', fontWeight: 700, color: '#1C1510' }}>
                      {formatBs(r.total)}
                    </td>
                    <td style={{ padding: '0.5rem 0', textAlign: 'center' }}>
                      <span
                        style={{
                          backgroundColor: r.estado === 'confirmado' ? '#DCFCE7' : '#FEF3C7',
                          color: r.estado === 'confirmado' ? '#15803D' : '#B45309',
                          padding: '0.15rem 0.45rem',
                          borderRadius: '4px',
                          fontSize: '0.7rem',
                          fontWeight: 600,
                        }}
                      >
                        {r.estado}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Tabla: Quiebres de Stock y Transferencias Sugeridas */}
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
              Quiebres de Stock y Reposición
            </h4>
            <span style={{ fontSize: '0.74rem', color: '#736B63' }}>Transferencias sugeridas</span>
          </div>

          {tables.stockCriticoLocal.length === 0 ? (
            <div style={{ padding: '1.5rem', textAlign: 'center', color: '#15803D', fontSize: '0.8rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem' }}>
              <CheckCircle size={15} />
              <span>Inventario saludable sin quiebres de existencias.</span>
            </div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.78rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #EAE6DF', color: '#736B63', textAlign: 'left' }}>
                  <th style={{ padding: '0.4rem 0' }}>Prenda / Talla</th>
                  <th style={{ padding: '0.4rem 0', textAlign: 'center' }}>Disponible</th>
                  <th style={{ padding: '0.4rem 0' }}>Sugerencia Transferencia</th>
                </tr>
              </thead>
              <tbody>
                {tables.stockCriticoLocal.map((item) => (
                  <tr key={item.id_inventario} style={{ borderBottom: '1px solid #FAF8F5' }}>
                    <td style={{ padding: '0.5rem 0' }}>
                      <div style={{ fontWeight: 600, color: '#1C1510' }}>{item.producto}</div>
                      <div style={{ fontSize: '0.7rem', color: '#736B63' }}>{item.variante}</div>
                    </td>
                    <td style={{ padding: '0.5rem 0', textAlign: 'center' }}>
                      <span
                        style={{
                          backgroundColor: item.stock_disponible === 0 ? '#FEE2E2' : '#FEF3C7',
                          color: item.stock_disponible === 0 ? '#DC2626' : '#B45309',
                          padding: '0.15rem 0.45rem',
                          borderRadius: '4px',
                          fontWeight: 700,
                          fontSize: '0.72rem',
                        }}
                      >
                        {item.stock_disponible} / {item.stock_minimo} min
                      </span>
                    </td>
                    <td style={{ padding: '0.5rem 0' }}>
                      {item.sucursalSugerida ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: '#15803D', fontWeight: 600 }}>
                          <ArrowRightLeft size={13} />
                          <span>Pedir a {item.sucursalSugerida}</span>
                        </div>
                      ) : (
                        <span style={{ color: '#DC2626' }}>Comprar a proveedor</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};

