import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  DollarSign,
  Coins,
  QrCode,
  FileCheck2,
  ShoppingCart,
  RotateCcw,
  CalendarCheck,
} from 'lucide-react';
import type { RoleDashboardData } from '../types/reports.types';

interface CashierDashboardViewProps {
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

export const CashierDashboardView: React.FC<CashierDashboardViewProps> = ({ data }) => {
  const cashier = data.cashier;
  const navigate = useNavigate();

  if (!cashier) return null;

  const { kpis, charts, tables } = cashier;
  const totalPagos = charts.metodosPagoTurno.reduce((acc, m) => acc + m.total, 0) || 1;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', color: '#1C1510' }}>
      {/* 1. FILA DE 4 KPIS DE TURNO EN CAJA */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: '1rem',
        }}
      >
        {/* KPI 1: Total Cobrado en Turno */}
        <div style={cardStyle}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.82rem', fontWeight: 600, color: '#736B63' }}>Total Cobrado en Turno</span>
            <div style={{ backgroundColor: '#DCFCE7', padding: '0.4rem', borderRadius: '8px', color: '#15803D' }}>
              <DollarSign size={17} />
            </div>
          </div>
          <div style={{ fontSize: '1.65rem', fontWeight: 700, color: '#15803D', letterSpacing: '-0.02em' }}>
            {formatBs(kpis.totalCobradoTurno)}
          </div>
          <div style={{ fontSize: '0.76rem', color: '#736B63', marginTop: '0.35rem' }}>
            Total acumulado en la sesión
          </div>
        </div>

        {/* KPI 2: Efectivo en Gaveta */}
        <div style={cardStyle}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.82rem', fontWeight: 600, color: '#736B63' }}>Efectivo en Gaveta</span>
            <div style={{ backgroundColor: '#FEF3C7', padding: '0.4rem', borderRadius: '8px', color: '#B45309' }}>
              <Coins size={17} />
            </div>
          </div>
          <div style={{ fontSize: '1.65rem', fontWeight: 700, color: '#B45309', letterSpacing: '-0.02em' }}>
            {formatBs(kpis.efectivoGaveta)}
          </div>
          <div style={{ fontSize: '0.76rem', color: '#736B63', marginTop: '0.35rem' }}>
            Billetes y monedas para arqueo
          </div>
        </div>

        {/* KPI 3: Cobros Digitales */}
        <div style={cardStyle}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.82rem', fontWeight: 600, color: '#736B63' }}>Cobros Digitales (QR/Tarjetas)</span>
            <div style={{ backgroundColor: '#E0E7FF', padding: '0.4rem', borderRadius: '8px', color: '#4338CA' }}>
              <QrCode size={17} />
            </div>
          </div>
          <div style={{ fontSize: '1.65rem', fontWeight: 700, color: '#4338CA', letterSpacing: '-0.02em' }}>
            {formatBs(kpis.cobrosDigitales)}
          </div>
          <div style={{ fontSize: '0.76rem', color: '#736B63', marginTop: '0.35rem' }}>
            Transacciones verificadas
          </div>
        </div>

        {/* KPI 4: Comprobantes Emitidos */}
        <div style={cardStyle}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.82rem', fontWeight: 600, color: '#736B63' }}>Tickets Emitidos</span>
            <div style={{ backgroundColor: '#F4ECE1', padding: '0.4rem', borderRadius: '8px', color: '#8C5E35' }}>
              <FileCheck2 size={17} />
            </div>
          </div>
          <div style={{ fontSize: '1.65rem', fontWeight: 700, color: '#1C1510', letterSpacing: '-0.02em' }}>
            {kpis.comprobantesEmitidos}
          </div>
          <div style={{ fontSize: '0.76rem', color: '#736B63', marginTop: '0.35rem' }}>
            Facturas y recibos de venta
          </div>
        </div>
      </div>

      {/* 2. BOTONES DE ACCESO RÁPIDO PARA ATENCIÓN EN CAJA */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '0.75rem',
        }}
      >
        <button
          type="button"
          onClick={() => navigate('/pos')}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.6rem',
            backgroundColor: '#1C1510',
            color: '#FFFFFF',
            border: 'none',
            borderRadius: '10px',
            padding: '0.85rem 1.25rem',
            fontWeight: 700,
            fontSize: '0.88rem',
            cursor: 'pointer',
            boxShadow: '0 2px 6px rgba(0,0,0,0.1)',
            transition: 'all 0.15s ease',
          }}
        >
          <ShoppingCart size={17} />
          <span>Nueva Venta POS</span>
        </button>

        <button
          type="button"
          onClick={() => navigate('/admin/reservas')}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.6rem',
            backgroundColor: '#FFFFFF',
            color: '#8C5E35',
            border: '1px solid #D1C9BE',
            borderRadius: '10px',
            padding: '0.85rem 1.25rem',
            fontWeight: 600,
            fontSize: '0.85rem',
            cursor: 'pointer',
          }}
        >
          <CalendarCheck size={17} />
          <span>Cobrar Reserva de Cliente</span>
        </button>

        <button
          type="button"
          onClick={() => navigate('/admin/devoluciones')}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.6rem',
            backgroundColor: '#FFFFFF',
            color: '#736B63',
            border: '1px solid #D1C9BE',
            borderRadius: '10px',
            padding: '0.85rem 1.25rem',
            fontWeight: 600,
            fontSize: '0.85rem',
            cursor: 'pointer',
          }}
        >
          <RotateCcw size={17} />
          <span>Registrar Devolución</span>
        </button>
      </div>

      {/* 3. GRÁFICO DE MÉTODOS DE PAGO Y RESERVAS PENDIENTES */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(440px, 1fr))', gap: '1.25rem' }}>
        {/* Gráfico / Desglose de Métodos de Pago */}
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
                Desglose por Método de Pago
              </h3>
              <p style={{ fontSize: '0.76rem', color: '#736B63', margin: '0.15rem 0 0 0' }}>
                Distribución en caja para arqueo de turno
              </p>
            </div>
            <Coins size={16} color="#736B63" />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {charts.metodosPagoTurno.map((m, idx) => {
              const pct = Math.min(100, Math.round((m.total / totalPagos) * 100));
              const color = idx === 0 ? '#15803D' : idx === 1 ? '#4338CA' : '#8C5E35';
              return (
                <div key={idx}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: '0.25rem' }}>
                    <span style={{ fontWeight: 600, color: '#1C1510' }}>{m.metodo}</span>
                    <span style={{ fontWeight: 700, color: '#1C1510' }}>
                      {formatBs(m.total)} ({pct}%)
                    </span>
                  </div>
                  <div style={{ backgroundColor: '#F0ECE4', height: '8px', borderRadius: '4px', overflow: 'hidden' }}>
                    <div
                      style={{
                        width: `${pct}%`,
                        backgroundColor: color,
                        height: '100%',
                        borderRadius: '4px',
                        transition: 'width 0.4s ease',
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Reservas Listas para Cobrar en Mostrador */}
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
              Reservas Listas para Cobro
            </h4>
            <span style={{ fontSize: '0.74rem', color: '#736B63' }}>Apartados de clientes</span>
          </div>

          {tables.reservasListasParaCobro.length === 0 ? (
            <div style={{ padding: '1.5rem', textAlign: 'center', color: '#736B63', fontSize: '0.8rem' }}>
              No hay reservas pendientes de cobro en mostrador.
            </div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.78rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #EAE6DF', color: '#736B63', textAlign: 'left' }}>
                  <th style={{ padding: '0.4rem 0' }}>Código / Cliente</th>
                  <th style={{ padding: '0.4rem 0' }}>Prendas</th>
                  <th style={{ padding: '0.4rem 0', textAlign: 'right' }}>Total</th>
                </tr>
              </thead>
              <tbody>
                {tables.reservasListasParaCobro.map((r) => (
                  <tr key={r.id_reserva} style={{ borderBottom: '1px solid #FAF8F5' }}>
                    <td style={{ padding: '0.5rem 0' }}>
                      <div style={{ fontWeight: 600, color: '#1C1510' }}>{r.cliente}</div>
                      <div style={{ fontSize: '0.7rem', color: '#8C5E35' }}>{r.codigo}</div>
                    </td>
                    <td style={{ padding: '0.5rem 0', color: '#4B433B', maxWidth: '180px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {r.prendas}
                    </td>
                    <td style={{ padding: '0.5rem 0', textAlign: 'right', fontWeight: 700, color: '#15803D' }}>
                      {formatBs(r.total)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* 4. TABLA DE ÚLTIMOS TICKETS / COMPROBANTES EMITIDOS */}
      <div
        style={{
          backgroundColor: '#FFFFFF',
          borderRadius: '12px',
          border: '1px solid #EAE6DF',
          padding: '1.25rem 1.5rem',
          boxShadow: '0 2px 8px rgba(0,0,0,0.02)',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <div>
            <h3 style={{ fontSize: '0.98rem', fontWeight: 700, margin: 0, color: '#1C1510' }}>
              Últimas Transacciones del Turno
            </h3>
            <p style={{ fontSize: '0.76rem', color: '#736B63', margin: '0.15rem 0 0 0' }}>
              Comprobantes emitidos en tu terminal
            </p>
          </div>
          <span style={{ fontSize: '0.76rem', fontWeight: 600, color: '#8C5E35' }}>
            {tables.ultimosCobros.length} comprobantes
          </span>
        </div>

        {tables.ultimosCobros.length === 0 ? (
          <div style={{ padding: '2rem', textAlign: 'center', color: '#736B63', fontSize: '0.82rem' }}>
            No se han registrado cobros en este turno.
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #EAE6DF', color: '#736B63', textAlign: 'left' }}>
                  <th style={{ padding: '0.55rem 0.5rem' }}>Comprobante</th>
                  <th style={{ padding: '0.55rem 0.5rem' }}>Hora</th>
                  <th style={{ padding: '0.55rem 0.5rem' }}>Cliente</th>
                  <th style={{ padding: '0.55rem 0.5rem' }}>Método</th>
                  <th style={{ padding: '0.55rem 0.5rem', textAlign: 'right' }}>Total</th>
                  <th style={{ padding: '0.55rem 0.5rem', textAlign: 'center' }}>Estado</th>
                </tr>
              </thead>
              <tbody>
                {tables.ultimosCobros.map((c) => (
                  <tr key={c.id_venta} style={{ borderBottom: '1px solid #FAF8F5' }}>
                    <td style={{ padding: '0.55rem 0.5rem', fontWeight: 600, color: '#1C1510' }}>
                      {c.codigo}
                    </td>
                    <td style={{ padding: '0.55rem 0.5rem', color: '#736B63' }}>{c.hora}</td>
                    <td style={{ padding: '0.55rem 0.5rem', color: '#2B231D' }}>{c.cliente}</td>
                    <td style={{ padding: '0.55rem 0.5rem' }}>
                      <span
                        style={{
                          backgroundColor: '#F4ECE1',
                          color: '#8C5E35',
                          padding: '0.15rem 0.45rem',
                          borderRadius: '4px',
                          fontSize: '0.72rem',
                          fontWeight: 600,
                        }}
                      >
                        {c.metodo}
                      </span>
                    </td>
                    <td style={{ padding: '0.55rem 0.5rem', textAlign: 'right', fontWeight: 700, color: '#1C1510' }}>
                      {formatBs(c.monto)}
                    </td>
                    <td style={{ padding: '0.55rem 0.5rem', textAlign: 'center' }}>
                      <span
                        style={{
                          backgroundColor: '#DCFCE7',
                          color: '#15803D',
                          padding: '0.15rem 0.45rem',
                          borderRadius: '4px',
                          fontSize: '0.72rem',
                          fontWeight: 600,
                        }}
                      >
                        {c.estado}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
