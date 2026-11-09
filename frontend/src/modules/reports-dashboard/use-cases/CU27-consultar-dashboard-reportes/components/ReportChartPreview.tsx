import React, { useState, useMemo } from 'react';
import { BarChart3, PieChart, TrendingUp } from 'lucide-react';

interface ReportChartPreviewProps {
  chartData: any;
  title: string;
}

const PALETTE = [
  '#8C5E35', // Warm Gold / Brown
  '#C4956A', // Sand
  '#3D5A80', // Slate Blue
  '#293241', // Deep Navy
  '#059669', // Emerald
  '#D97706', // Amber
  '#DC2626', // Crimson
  '#7C3AED', // Violet
  '#6B705C', // Olive
  '#A98467', // Taupe
];

export const ReportChartPreview: React.FC<ReportChartPreviewProps> = ({
  chartData,
  title,
}) => {
  const [chartType, setChartType] = useState<'bar' | 'donut' | 'line'>('bar');

  // Normalizar los datos en una lista uniforme de { name, value }
  const normalizedData = useMemo(() => {
    if (!chartData) return [];

    let rawList: any[] = [];
    if (Array.isArray(chartData)) {
      rawList = chartData;
    } else if (typeof chartData === 'object') {
      rawList = Object.entries(chartData).map(([key, val]) => ({
        name: key
          .replace(/([A-Z])/g, ' $1')
          .replace(/^./, (str) => str.toUpperCase()),
        total: Number(val) || 0,
      }));
    }

    return rawList
      .map((item) => {
        const name = String(item.name || item.nombre || item.fecha || item.metodo || 'General');
        const val = Number(item.total ?? item.unidades ?? item.cantidad ?? item.alertas ?? item.value ?? 0);
        return { name, value: val };
      })
      .filter((item) => !isNaN(item.value))
      .slice(0, 10); // Máximo 10 para visualización limpia
  }, [chartData]);

  if (!normalizedData.length) {
    return null;
  }

  const totalSum = normalizedData.reduce((acc, curr) => acc + curr.value, 0) || 1;
  const maxValue = Math.max(...normalizedData.map((d) => d.value), 1);

  const formatValue = (val: number): string => {
    if (val >= 1000) {
      return val.toLocaleString('es-BO', { maximumFractionDigits: 1 });
    }
    return val.toLocaleString('es-BO', { maximumFractionDigits: 2 });
  };

  return (
    <div
      style={{
        backgroundColor: '#FFFFFF',
        borderRadius: '12px',
        border: '1px solid #EAE6DF',
        padding: '1.25rem 1.5rem',
        marginBottom: '1.75rem',
        boxShadow: '0 2px 6px rgba(0,0,0,0.02)',
      }}
    >
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '1rem',
          marginBottom: '1.25rem',
        }}
      >
        <div>
          <h4
            style={{
              fontSize: '0.92rem',
              fontWeight: 700,
              color: '#1C1510',
              margin: 0,
              display: 'flex',
              alignItems: 'center',
              gap: '0.45rem',
            }}
          >
            <TrendingUp size={16} color="#8C5E35" />
            {title || 'Visualización Gráfica del Reporte'}
          </h4>
          <span style={{ fontSize: '0.75rem', color: '#736B63' }}>
            Distribución analítica calculada sobre los registros actuales
          </span>
        </div>

        {/* Selector de tipo de gráfico */}
        <div
          style={{
            display: 'flex',
            backgroundColor: '#F4ECE1',
            borderRadius: '8px',
            padding: '3px',
            gap: '2px',
          }}
        >
          <button
            type="button"
            onClick={() => setChartType('bar')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.35rem',
              padding: '0.35rem 0.65rem',
              borderRadius: '6px',
              border: 'none',
              backgroundColor: chartType === 'bar' ? '#FFFFFF' : 'transparent',
              color: chartType === 'bar' ? '#1C1510' : '#736B63',
              fontSize: '0.75rem',
              fontWeight: 600,
              cursor: 'pointer',
              boxShadow: chartType === 'bar' ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
            }}
          >
            <BarChart3 size={13} />
            Barras
          </button>

          <button
            type="button"
            onClick={() => setChartType('donut')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.35rem',
              padding: '0.35rem 0.65rem',
              borderRadius: '6px',
              border: 'none',
              backgroundColor: chartType === 'donut' ? '#FFFFFF' : 'transparent',
              color: chartType === 'donut' ? '#1C1510' : '#736B63',
              fontSize: '0.75rem',
              fontWeight: 600,
              cursor: 'pointer',
              boxShadow: chartType === 'donut' ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
            }}
          >
            <PieChart size={13} />
            Donas / Torta
          </button>
        </div>
      </div>

      {/* RENDERIZADO BARRAS */}
      {chartType === 'bar' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {normalizedData.map((item, idx) => {
            const pct = Math.max((item.value / maxValue) * 100, 2);
            const color = PALETTE[idx % PALETTE.length];
            return (
              <div key={idx} style={{ display: 'grid', gridTemplateColumns: '180px 1fr 90px', alignItems: 'center', gap: '1rem' }}>
                <span
                  style={{
                    fontSize: '0.78rem',
                    fontWeight: 600,
                    color: '#4B433B',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                  title={item.name}
                >
                  {item.name}
                </span>

                <div
                  style={{
                    height: '20px',
                    backgroundColor: '#F4ECE1',
                    borderRadius: '6px',
                    overflow: 'hidden',
                    position: 'relative',
                  }}
                >
                  <div
                    style={{
                      height: '100%',
                      width: `${pct}%`,
                      backgroundColor: color,
                      borderRadius: '6px',
                      transition: 'width 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                    }}
                  />
                </div>

                <span
                  style={{
                    fontSize: '0.8rem',
                    fontWeight: 700,
                    color: '#1C1510',
                    textAlign: 'right',
                  }}
                >
                  {formatValue(item.value)}
                </span>
              </div>
            );
          })}
        </div>
      )}

      {/* RENDERIZADO DONAS / TORTA */}
      {chartType === 'donut' && (
        <div style={{ display: 'grid', gridTemplateColumns: '180px 1fr', alignItems: 'center', gap: '2rem' }}>
          <div style={{ width: '160px', height: '160px', margin: '0 auto', position: 'relative' }}>
            <svg viewBox="0 0 42 42" style={{ transform: 'rotate(-90deg)', width: '100%', height: '100%' }}>
              <circle cx="21" cy="21" r="15.915" fill="transparent" stroke="#EFEBE4" strokeWidth="6" />
              {(() => {
                let accumulatedOffset = 0;
                return normalizedData.map((item, idx) => {
                  const share = (item.value / totalSum) * 100;
                  const strokeDasharray = `${share} ${100 - share}`;
                  const strokeDashoffset = -accumulatedOffset;
                  accumulatedOffset += share;
                  const color = PALETTE[idx % PALETTE.length];
                  return (
                    <circle
                      key={idx}
                      cx="21"
                      cy="21"
                      r="15.915"
                      fill="transparent"
                      stroke={color}
                      strokeWidth="6"
                      strokeDasharray={strokeDasharray}
                      strokeDashoffset={strokeDashoffset}
                      style={{ transition: 'stroke-dasharray 0.3s ease' }}
                    />
                  );
                });
              })()}
            </svg>
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
              <span style={{ fontSize: '0.68rem', color: '#736B63', fontWeight: 600 }}>TOTAL</span>
              <span style={{ fontSize: '0.95rem', color: '#1C1510', fontWeight: 700 }}>
                {formatValue(totalSum)}
              </span>
            </div>
          </div>

          {/* Leyenda */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '0.65rem' }}>
            {normalizedData.map((item, idx) => {
              const share = ((item.value / totalSum) * 100).toFixed(1);
              const color = PALETTE[idx % PALETTE.length];
              return (
                <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <div style={{ width: '10px', height: '10px', borderRadius: '3px', backgroundColor: color, flexShrink: 0 }} />
                  <div style={{ overflow: 'hidden' }}>
                    <div
                      style={{
                        fontSize: '0.74rem',
                        fontWeight: 600,
                        color: '#1C1510',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}
                      title={item.name}
                    >
                      {item.name}
                    </div>
                    <div style={{ fontSize: '0.68rem', color: '#736B63' }}>
                      {formatValue(item.value)} ({share}%)
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
