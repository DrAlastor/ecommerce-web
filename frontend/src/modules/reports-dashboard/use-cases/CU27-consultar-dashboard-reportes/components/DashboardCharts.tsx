import React, { useState } from 'react';
import {
  BarChart3,
  PieChart,
  TrendingUp,
  Clock,
} from 'lucide-react';
import type { DashboardMetrics } from '../types/reports.types';

interface DashboardChartsProps {
  metrics: DashboardMetrics;
}

type DiagramType = 'bar' | 'sector' | 'line' | 'timeline';

const sectionCardStyle: React.CSSProperties = {
  backgroundColor: '#FFFFFF',
  borderRadius: '14px',
  padding: '1.5rem',
  border: '1px solid #EAE6DF',
  boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
  marginBottom: '2rem',
};

const SECTOR_COLORS = [
  '#8C5E35',
  '#C4956A',
  '#D4A373',
  '#E0A96D',
  '#A98467',
  '#6B705C',
  '#3D5A80',
  '#293241',
];

export const DashboardCharts: React.FC<DashboardChartsProps> = ({ metrics }) => {
  const { charts } = metrics;
  const [diagramType, setDiagramType] = useState<DiagramType>('bar');

  // Cálculos comunes para gráficos de tiempo
  const periodData = charts.ventasPorPeriodo;
  const totalPeriodRevenue = periodData.reduce((acc, curr) => acc + curr.total, 0) || 1;
  const maxRevenue = Math.max(...periodData.map((p) => p.total), 1);

  // Formateador monetario limpio (evita decimales infinitos tipo 404.71000000000004)
  const formatBs = (val: number): string => {
    if (val >= 1000) {
      return `Bs. ${(val / 1000).toFixed(1)}k`;
    }
    return `Bs. ${Number(val.toFixed(2)).toLocaleString('es-BO', { minimumFractionDigits: 2 })}`;
  };

  const formatBsFull = (val: number): string => {
    return `Bs. ${Number(val.toFixed(2)).toLocaleString('es-BO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(450px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
        {/* ========================================================================= */}
        {/* GRÁFICO 1: EVOLUCIÓN CON SELECTOR DE 4 DIAGRAMAS */}
        {/* ========================================================================= */}
        <div style={sectionCardStyle}>
          {/* Header con Switcher de Diagramas */}
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              justifyContent: 'space-between',
              alignItems: 'center',
              gap: '0.75rem',
              marginBottom: '1.25rem',
              borderBottom: '1px solid #F4ECE1',
              paddingBottom: '1rem',
            }}
          >
            <div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, margin: 0, color: '#1C1510' }}>
                Evolución Temporal de Ingresos
              </h3>
              <p style={{ fontSize: '0.82rem', color: '#736B63', margin: '0.2rem 0 0 0' }}>
                Ingresos diarios registrados en el período seleccionado
              </p>
            </div>

            {/* Selector de tipo de diagrama */}
            <div
              style={{
                display: 'inline-flex',
                backgroundColor: '#F4ECE1',
                borderRadius: '10px',
                padding: '3px',
                gap: '2px',
                flexWrap: 'wrap',
              }}
            >
              <button
                onClick={() => setDiagramType('bar')}
                title="Diagrama de Barra"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  padding: '0.45rem 0.8rem',
                  borderRadius: '7px',
                  border: 'none',
                  backgroundColor: diagramType === 'bar' ? '#8C5E35' : 'transparent',
                  color: diagramType === 'bar' ? '#FFFFFF' : '#736B63',
                  fontSize: '0.78rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
              >
                <BarChart3 size={15} />
                Diagrama de Barra
              </button>

              <button
                onClick={() => setDiagramType('sector')}
                title="Diagrama de Sector (Circular)"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  padding: '0.45rem 0.8rem',
                  borderRadius: '7px',
                  border: 'none',
                  backgroundColor: diagramType === 'sector' ? '#8C5E35' : 'transparent',
                  color: diagramType === 'sector' ? '#FFFFFF' : '#736B63',
                  fontSize: '0.78rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
              >
                <PieChart size={15} />
                Diagrama de Sector
              </button>

              <button
                onClick={() => setDiagramType('line')}
                title="Diagrama de Líneas"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  padding: '0.45rem 0.8rem',
                  borderRadius: '7px',
                  border: 'none',
                  backgroundColor: diagramType === 'line' ? '#8C5E35' : 'transparent',
                  color: diagramType === 'line' ? '#FFFFFF' : '#736B63',
                  fontSize: '0.78rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
              >
                <TrendingUp size={15} />
                Diagrama de Líneas
              </button>

              <button
                onClick={() => setDiagramType('timeline')}
                title="Diagrama de Tiempo"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  padding: '0.45rem 0.8rem',
                  borderRadius: '7px',
                  border: 'none',
                  backgroundColor: diagramType === 'timeline' ? '#8C5E35' : 'transparent',
                  color: diagramType === 'timeline' ? '#FFFFFF' : '#736B63',
                  fontSize: '0.78rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
              >
                <Clock size={15} />
                Diagrama de Tiempo
              </button>
            </div>
          </div>

          {/* Renderizado Condicional del Diagrama Seleccionado */}
          {periodData.length === 0 ? (
            <div style={{ padding: '3.5rem', textAlign: 'center', color: '#8C5E35' }}>
              No se registraron ventas en el período seleccionado.
            </div>
          ) : (
            <div>
              {/* ------------------------------------------------------------- */}
              {/* 1. DIAGRAMA DE BARRA */}
              {/* ------------------------------------------------------------- */}
              {diagramType === 'bar' && (
                <div style={{ height: '240px', display: 'flex', alignItems: 'flex-end', gap: '0.75rem', padding: '1rem 0' }}>
                  {periodData.map((p, idx) => {
                    const heightPct = Math.round((p.total / maxRevenue) * 100);
                    return (
                      <div
                        key={idx}
                        style={{
                          flex: 1,
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          gap: '0.4rem',
                          height: '100%',
                          justifyContent: 'flex-end',
                        }}
                        title={`${p.fecha}: ${formatBsFull(p.total)} (${p.ventas} ventas)`}
                      >
                        <span style={{ fontSize: '0.74rem', fontWeight: 700, color: '#8C5E35', whiteSpace: 'nowrap' }}>
                          {formatBs(p.total)}
                        </span>
                        <div
                          style={{
                            width: '100%',
                            maxWidth: '46px',
                            height: `${Math.max(heightPct, 10)}%`,
                            backgroundColor: '#C4956A',
                            borderRadius: '8px 8px 0 0',
                            transition: 'height 0.3s ease, background-color 0.2s',
                            cursor: 'pointer',
                            boxShadow: '0 2px 4px rgba(196,149,106,0.25)',
                          }}
                          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#8C5E35')}
                          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#C4956A')}
                        />
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                          <span style={{ fontSize: '0.72rem', fontWeight: 600, color: '#4B433B' }}>
                            {p.fecha.split('-').slice(1).join('/')}
                          </span>
                          <span style={{ fontSize: '0.66rem', color: '#736B63' }}>
                            {p.ventas} v.
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* ------------------------------------------------------------- */}
              {/* 2. DIAGRAMA DE SECTOR (CIRCULAR / DONUT) */}
              {/* ------------------------------------------------------------- */}
              {diagramType === 'sector' && (
                <div style={{ minHeight: '240px', display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'center', gap: '2rem', padding: '0.5rem 0' }}>
                  {/* Donut SVG */}
                  <div style={{ position: 'relative', width: '180px', height: '180px' }}>
                    <svg viewBox="0 0 100 100" style={{ transform: 'rotate(-90deg)', width: '100%', height: '100%' }}>
                      {(() => {
                        let cumulativePct = 0;
                        const radius = 38;
                        const circumference = 2 * Math.PI * radius;

                        return periodData.map((p, idx) => {
                          const pct = p.total / totalPeriodRevenue;
                          const strokeDasharray = `${pct * circumference} ${circumference}`;
                          const strokeDashoffset = -cumulativePct * circumference;
                          cumulativePct += pct;
                          const color = SECTOR_COLORS[idx % SECTOR_COLORS.length];

                          return (
                            <circle
                              key={idx}
                              cx="50"
                              cy="50"
                              r={radius}
                              fill="transparent"
                              stroke={color}
                              strokeWidth="18"
                              strokeDasharray={strokeDasharray}
                              strokeDashoffset={strokeDashoffset}
                              style={{ transition: 'stroke-width 0.2s ease', cursor: 'pointer' }}
                              onMouseEnter={(e) => e.currentTarget.setAttribute('stroke-width', '22')}
                              onMouseLeave={(e) => e.currentTarget.setAttribute('stroke-width', '18')}
                            >
                              <title>{`${p.fecha}: ${formatBsFull(p.total)} (${(pct * 100).toFixed(1)}%)`}</title>
                            </circle>
                          );
                        });
                      })()}
                    </svg>
                    {/* Centro del Donut */}
                    <div
                      style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        pointerEvents: 'none',
                      }}
                    >
                      <span style={{ fontSize: '0.72rem', color: '#736B63', fontWeight: 600 }}>Total Período</span>
                      <span style={{ fontSize: '1rem', fontWeight: 700, color: '#1C1510' }}>
                        {formatBs(totalPeriodRevenue)}
                      </span>
                    </div>
                  </div>

                  {/* Leyenda de Sectores */}
                  <div style={{ flex: 1, minWidth: '220px', display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '220px', overflowY: 'auto' }}>
                    {periodData.map((p, idx) => {
                      const pct = ((p.total / totalPeriodRevenue) * 100).toFixed(1);
                      const color = SECTOR_COLORS[idx % SECTOR_COLORS.length];
                      return (
                        <div key={idx} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.82rem' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <div style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: color }} />
                            <span style={{ color: '#2E2722', fontWeight: 600 }}>{p.fecha}</span>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                            <span style={{ color: '#736B63' }}>{formatBsFull(p.total)}</span>
                            <span style={{ backgroundColor: '#F4ECE1', color: '#8C5E35', padding: '0.1rem 0.4rem', borderRadius: '4px', fontWeight: 700, fontSize: '0.75rem' }}>
                              {pct}%
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* ------------------------------------------------------------- */}
              {/* 3. DIAGRAMA DE LÍNEAS (ÁREA CURVA) */}
              {/* ------------------------------------------------------------- */}
              {diagramType === 'line' && (
                <div style={{ height: '240px', position: 'relative', padding: '1rem 0 0.5rem 0' }}>
                  <svg viewBox="0 0 500 180" preserveAspectRatio="none" style={{ width: '100%', height: '160px', overflow: 'visible' }}>
                    <defs>
                      <linearGradient id="lineGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#8C5E35" stopOpacity="0.35" />
                        <stop offset="100%" stopColor="#8C5E35" stopOpacity="0.0" />
                      </linearGradient>
                    </defs>

                    {/* Guías de referencia horizontal */}
                    <line x1="0" y1="30" x2="500" y2="30" stroke="#F4ECE1" strokeDasharray="3 3" />
                    <line x1="0" y1="80" x2="500" y2="80" stroke="#F4ECE1" strokeDasharray="3 3" />
                    <line x1="0" y1="130" x2="500" y2="130" stroke="#F4ECE1" strokeDasharray="3 3" />

                    {(() => {
                      const count = periodData.length;
                      const stepX = count > 1 ? 500 / (count - 1) : 250;

                      // Calcular puntos
                      const points = periodData.map((p, i) => {
                        const x = count > 1 ? i * stepX : 250;
                        const y = 160 - (p.total / maxRevenue) * 130;
                        return { x, y, ...p };
                      });

                      const polyPoints = points.map((pt) => `${pt.x},${pt.y}`).join(' ');
                      const areaPoints = `${points[0].x},160 ` + polyPoints + ` ${points[points.length - 1].x},160`;

                      return (
                        <>
                          {/* Área con gradiente */}
                          <polygon points={areaPoints} fill="url(#lineGrad)" />

                          {/* Línea conectora */}
                          <polyline points={polyPoints} fill="none" stroke="#8C5E35" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />

                          {/* Nodos interactivos */}
                          {points.map((pt, i) => (
                            <g key={i} style={{ cursor: 'pointer' }}>
                              <circle cx={pt.x} cy={pt.y} r="5" fill="#FFFFFF" stroke="#8C5E35" strokeWidth="3" />
                              <text x={pt.x} y={pt.y - 10} textAnchor="middle" fontSize="10" fontWeight="700" fill="#8C5E35">
                                {formatBs(pt.total)}
                              </text>
                            </g>
                          ))}
                        </>
                      );
                    })()}
                  </svg>

                  {/* Etiquetas de fechas en eje X */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.5rem', fontSize: '0.72rem', color: '#736B63', fontWeight: 600 }}>
                    {periodData.map((p, i) => (
                      <span key={i}>{p.fecha.split('-').slice(1).join('/')}</span>
                    ))}
                  </div>
                </div>
              )}

              {/* ------------------------------------------------------------- */}
              {/* 4. DIAGRAMA DE TIEMPO (CHRONOLOGICAL TIMELINE) */}
              {/* ------------------------------------------------------------- */}
              {diagramType === 'timeline' && (
                <div style={{ minHeight: '240px', padding: '0.5rem 0', overflowX: 'auto' }}>
                  <div style={{ display: 'flex', gap: '1rem', minWidth: '550px', paddingBottom: '0.75rem' }}>
                    {periodData.map((p, idx) => {
                      const pctOfMax = Math.round((p.total / maxRevenue) * 100);
                      return (
                        <div
                          key={idx}
                          style={{
                            flex: 1,
                            backgroundColor: '#FAF8F5',
                            borderRadius: '12px',
                            border: '1px solid #EAE6DF',
                            padding: '1rem',
                            display: 'flex',
                            flexDirection: 'column',
                            justifyContent: 'space-between',
                            minWidth: '130px',
                            position: 'relative',
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', marginBottom: '0.5rem' }}>
                            <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#8C5E35' }} />
                            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#736B63' }}>
                              {p.fecha}
                            </span>
                          </div>

                          <div style={{ fontSize: '1.15rem', fontWeight: 700, color: '#1C1510', margin: '0.2rem 0' }}>
                            {formatBsFull(p.total)}
                          </div>

                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.72rem', color: '#8C5E35', fontWeight: 600, margin: '0.35rem 0' }}>
                            <span>{p.ventas} transacciones</span>
                            <span>{pctOfMax}% volumen</span>
                          </div>

                          {/* Mini barra de progreso diaria */}
                          <div style={{ height: '4px', backgroundColor: '#EFEBE4', borderRadius: '999px', overflow: 'hidden', marginTop: '0.35rem' }}>
                            <div style={{ width: `${pctOfMax}%`, height: '100%', backgroundColor: '#8C5E35', borderRadius: '999px' }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* ========================================================================= */}
        {/* GRÁFICO 2: RENDIMIENTO POR SUCURSAL */}
        {/* ========================================================================= */}
        <div style={sectionCardStyle}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
            <div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, margin: 0, color: '#1C1510' }}>
                Rendimiento por Sucursal
              </h3>
              <p style={{ fontSize: '0.82rem', color: '#736B63', margin: '0.2rem 0 0 0' }}>
                Participación de ingresos por punto de venta físico y canal digital
              </p>
            </div>
          </div>

          {charts.ventasPorSucursal.length === 0 ? (
            <div style={{ padding: '3rem', textAlign: 'center', color: '#8C5E35' }}>
              No hay datos disponibles para las sucursales filtradas.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {(() => {
                const totalBranchSales = charts.ventasPorSucursal.reduce((acc, curr) => acc + curr.total, 0) || 1;
                return charts.ventasPorSucursal.map((b, idx) => {
                  const pct = Math.round((b.total / totalBranchSales) * 100);
                  return (
                    <div key={idx}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '0.35rem' }}>
                        <span style={{ fontWeight: 600, color: '#2E2722' }}>{b.sucursal}</span>
                        <span style={{ fontWeight: 700, color: '#8C5E35' }}>
                          {formatBsFull(b.total)} ({pct}%)
                        </span>
                      </div>
                      <div style={{ height: '8px', backgroundColor: '#EFEBE4', borderRadius: '999px', overflow: 'hidden' }}>
                        <div
                          style={{
                            width: `${pct}%`,
                            height: '100%',
                            backgroundColor: idx % 2 === 0 ? '#8C5E35' : '#C4956A',
                            borderRadius: '999px',
                            transition: 'width 0.4s ease',
                          }}
                        />
                      </div>
                      <span style={{ fontSize: '0.72rem', color: '#736B63' }}>{b.cantidad} ventas procesadas</span>
                    </div>
                  );
                });
              })()}
            </div>
          )}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* GRÁFICOS INFERIORES: DISTRIBUCIÓN POR CANAL & TOP PRENDAS */}
      {/* ========================================================================= */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
        {/* Ventas por Canal */}
        <div style={sectionCardStyle}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, margin: '0 0 0.25rem 0', color: '#1C1510' }}>
            Distribución por Canal
          </h3>
          <p style={{ fontSize: '0.82rem', color: '#736B63', margin: '0 0 1.25rem 0' }}>
            Canal Presencial (Sucursales) vs Canal Digital (E-Commerce)
          </p>

          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
            {charts.ventasPorCanal.map((c, idx) => {
              const totalGeneral = charts.ventasPorCanal.reduce((a, b) => a + b.total, 0) || 1;
              const pct = Math.round((c.total / totalGeneral) * 100);
              return (
                <div
                  key={idx}
                  style={{
                    flex: 1,
                    backgroundColor: '#FAF8F5',
                    padding: '1.25rem',
                    borderRadius: '12px',
                    border: '1px solid #EAE6DF',
                  }}
                >
                  <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#736B63' }}>{c.canal}</span>
                  <div style={{ fontSize: '1.4rem', fontWeight: 700, color: '#1C1510', margin: '0.35rem 0' }}>
                    {formatBsFull(c.total)}
                  </div>
                  <div style={{ fontSize: '0.8rem', fontWeight: 600, color: '#8C5E35' }}>
                    {pct}% del total ({c.cantidad} pedidos)
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Top 5 Prendas Más Vendidas */}
        <div style={sectionCardStyle}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, margin: '0 0 0.25rem 0', color: '#1C1510' }}>
            Prendas Más Vendidas
          </h3>
          <p style={{ fontSize: '0.82rem', color: '#736B63', margin: '0 0 1.25rem 0' }}>
            Ranking por volumen de unidades comercializadas
          </p>

          {charts.productosMasVendidos.length === 0 ? (
            <div style={{ padding: '2rem', textAlign: 'center', color: '#8C5E35' }}>
              No hay rotación registrada para este período.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              {charts.productosMasVendidos.map((prod, idx) => (
                <div
                  key={idx}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    paddingBottom: '0.5rem',
                    borderBottom: idx < charts.productosMasVendidos.length - 1 ? '1px solid #F4ECE1' : 'none',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <span
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: '24px',
                        height: '24px',
                        borderRadius: '50%',
                        backgroundColor: idx === 0 ? '#FEF3C7' : '#EFEBE4',
                        color: idx === 0 ? '#B45309' : '#4B433B',
                        fontSize: '0.75rem',
                        fontWeight: 700,
                      }}
                    >
                      {idx + 1}
                    </span>
                    <div>
                      <div style={{ fontSize: '0.88rem', fontWeight: 600, color: '#1C1510' }}>{prod.nombre}</div>
                      <div style={{ fontSize: '0.75rem', color: '#736B63' }}>{formatBsFull(prod.total)} facturados</div>
                    </div>
                  </div>
                  <span
                    style={{
                      backgroundColor: '#F4ECE1',
                      padding: '0.2rem 0.6rem',
                      borderRadius: '6px',
                      fontSize: '0.78rem',
                      fontWeight: 700,
                      color: '#8C5E35',
                    }}
                  >
                    {prod.unidades} u.
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
