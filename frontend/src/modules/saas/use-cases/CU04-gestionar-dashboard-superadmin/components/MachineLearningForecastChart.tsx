import React, { useState } from 'react';
import { Sparkles, Brain, CheckCircle2 } from 'lucide-react';
import type { MlPredictionModel, RevenueTimeSeriesPoint } from '../../../types/saas.types';

interface MachineLearningForecastChartProps {
  mlModel: MlPredictionModel;
  timeSeries: RevenueTimeSeriesPoint[];
}

export const MachineLearningForecastChart: React.FC<MachineLearningForecastChartProps> = ({
  mlModel,
  timeSeries,
}) => {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  if (!timeSeries || timeSeries.length === 0) {
    return <div className="saas-chart-empty">No hay datos suficientes para el modelo de Machine Learning.</div>;
  }

  // Dimensiones del canvas SVG
  const width = 800;
  const height = 300;
  const padLeft = 60;
  const padRight = 30;
  const padTop = 25;
  const padBottom = 45;

  const chartW = width - padLeft - padRight;
  const chartH = height - padTop - padBottom;

  // Encontrar valores máximos y mínimos para la escala Y
  const allValues: number[] = [];
  timeSeries.forEach((p) => {
    if (p.actualRevenue !== null) allValues.push(p.actualRevenue);
    allValues.push(p.predictedRevenue);
    allValues.push(p.upperConfidence);
    allValues.push(p.lowerConfidence);
  });

  const maxVal = Math.max(...allValues, 1000) * 1.08;
  const minVal = 0;

  const getX = (idx: number) => padLeft + (idx / (timeSeries.length - 1)) * chartW;
  const getY = (val: number) => padTop + chartH - ((val - minVal) / (maxVal - minVal)) * chartH;

  // Generar path para la banda de confianza 95% (polígono sombreado)
  const confidenceArea = timeSeries
    .map((p, i) => `${getX(i)},${getY(p.upperConfidence)}`)
    .join(' ')
    .concat(' ')
    .concat(
      timeSeries
        .slice()
        .reverse()
        .map((p, i) => {
          const revIdx = timeSeries.length - 1 - i;
          return `${getX(revIdx)},${getY(p.lowerConfidence)}`;
        })
        .join(' '),
    );

  // Línea de regresión predictiva (ML)
  const mlPath = timeSeries
    .map((p, i) => `${i === 0 ? 'M' : 'L'} ${getX(i)} ${getY(p.predictedRevenue)}`)
    .join(' ');

  // Línea real (hasta el último dato histórico que tiene actualRevenue !== null)
  const historicalPoints = timeSeries.filter((p) => p.actualRevenue !== null);
  const actualPath = historicalPoints
    .map((p, i) => `${i === 0 ? 'M' : 'L'} ${getX(i)} ${getY(p.actualRevenue!)}`)
    .join(' ');

  // Guías horizontales
  const yTicks = [0, 0.25, 0.5, 0.75, 1].map((frac) => minVal + frac * (maxVal - minVal));

  return (
    <div className="saas-chart-card">
      <div className="saas-chart-header">
        <div className="saas-chart-title-group">
          <div className="saas-ai-badge">
            <Brain size={16} />
            <span>MACHINE LEARNING ENGINE</span>
          </div>
          <h3 className="saas-chart-title">Proyección Predictiva de Ingresos & Crecimiento</h3>
          <p className="saas-chart-subtitle">
            Modelo de Regresión Lineal de Mínimos Cuadrados (OLS) con Intervalo de Confianza al 95%.
          </p>
        </div>

        <div className="saas-ml-stats-pills">
          <div className="saas-stat-pill">
            <span className="pill-label">Bondad de Ajuste</span>
            <span className="pill-val">R² = {(mlModel.rSquared * 100).toFixed(1)}%</span>
          </div>
          <div className="saas-stat-pill highlight">
            <Sparkles size={14} />
            <span className="pill-label">Crecimiento Proyectado</span>
            <span className="pill-val">+{mlModel.projectedGrowthRate}% / mes</span>
          </div>
        </div>
      </div>

      <div className="saas-svg-container">
        <svg viewBox={`0 0 ${width} ${height}`} className="saas-forecast-svg" preserveAspectRatio="none">
          <defs>
            <linearGradient id="confidenceBandGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#C4956A" stopOpacity="0.28" />
              <stop offset="100%" stopColor="#C4956A" stopOpacity="0.04" />
            </linearGradient>
            <linearGradient id="actualLineGrad" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#1E3A8A" />
              <stop offset="100%" stopColor="#3B82F6" />
            </linearGradient>
          </defs>

          {/* Líneas de cuadrícula horizontal */}
          {yTicks.map((tick, i) => (
            <g key={i}>
              <line
                x1={padLeft}
                y1={getY(tick)}
                x2={width - padRight}
                y2={getY(tick)}
                stroke="#E2E8F0"
                strokeDasharray="4 4"
                strokeWidth="1"
              />
              <text
                x={padLeft - 8}
                y={getY(tick) + 4}
                textAnchor="end"
                fontSize="11"
                fill="#94A3B8"
              >
                Bs. {Math.round(tick).toLocaleString()}
              </text>
            </g>
          ))}

          {/* Banda de Intervalo de Confianza (95%) */}
          <polygon points={confidenceArea} fill="url(#confidenceBandGrad)" />

          {/* Línea de Machine Learning (Proyección de Tendencia) */}
          <path
            d={mlPath}
            fill="none"
            stroke="#C4956A"
            strokeWidth="2.5"
            strokeDasharray="6 4"
          />

          {/* Línea de Ingresos Reales Históricos */}
          <path
            d={actualPath}
            fill="none"
            stroke="url(#actualLineGrad)"
            strokeWidth="3.5"
            strokeLinecap="round"
          />

          {/* Puntos y Vértices */}
          {timeSeries.map((p, idx) => {
            const x = getX(idx);
            const isFuture = p.actualRevenue === null;
            const y = isFuture ? getY(p.predictedRevenue) : getY(p.actualRevenue!);
            const isHovered = hoveredIndex === idx;

            return (
              <g
                key={idx}
                onMouseEnter={() => setHoveredIndex(idx)}
                onMouseLeave={() => setHoveredIndex(null)}
                style={{ cursor: 'pointer' }}
              >
                {/* Zona de hover ampliada */}
                <circle cx={x} cy={y} r={14} fill="transparent" />

                {/* Punto visual */}
                <circle
                  cx={x}
                  cy={y}
                  r={isHovered ? 6 : isFuture ? 4.5 : 5}
                  fill={isFuture ? '#C4956A' : '#1D4ED8'}
                  stroke="#FFFFFF"
                  strokeWidth="2"
                />

                {/* Etiquetas de eje X */}
                <text
                  x={x}
                  y={height - 12}
                  textAnchor="middle"
                  fontSize="11"
                  fill={isFuture ? '#C4956A' : '#64748B'}
                  fontWeight={isFuture ? '600' : '400'}
                >
                  {p.period}
                </text>
              </g>
            );
          })}
        </svg>

        {/* Tooltip Dinámico Flotante */}
        {hoveredIndex !== null && (
          <div
            className="saas-chart-tooltip"
            style={{
              left: `${(getX(hoveredIndex) / width) * 100}%`,
              top: `${(getY(timeSeries[hoveredIndex].predictedRevenue) / height) * 100}%`,
            }}
          >
            <div className="tooltip-title">{timeSeries[hoveredIndex].period}</div>
            {timeSeries[hoveredIndex].actualRevenue !== null ? (
              <div className="tooltip-row">
                <span className="dot actual" />
                <span>Real: </span>
                <strong>Bs. {timeSeries[hoveredIndex].actualRevenue?.toLocaleString()}</strong>
              </div>
            ) : (
              <div className="tooltip-row future-tag">
                <Sparkles size={12} />
                <span>Predicción por Algoritmo de ML</span>
              </div>
            )}
            <div className="tooltip-row">
              <span className="dot ml" />
              <span>Ajuste OLS: </span>
              <strong>Bs. {timeSeries[hoveredIndex].predictedRevenue.toLocaleString()}</strong>
            </div>
            <div className="tooltip-row text-muted">
              <span>Banda 95%: </span>
              <span>
                Bs. {timeSeries[hoveredIndex].lowerConfidence.toLocaleString()} -{' '}
                {timeSeries[hoveredIndex].upperConfidence.toLocaleString()}
              </span>
            </div>
          </div>
        )}
      </div>

      <div className="saas-chart-footer">
        <div className="saas-chart-legend">
          <div className="legend-item">
            <span className="legend-line actual" />
            <span>Ingresos Reales Consolidados</span>
          </div>
          <div className="legend-item">
            <span className="legend-line ml" />
            <span>Tendencia & Proyección ML (OLS)</span>
          </div>
          <div className="legend-item">
            <span className="legend-box confidence" />
            <span>Banda de Confianza 95%</span>
          </div>
        </div>

        <div className="saas-model-interpretation">
          <CheckCircle2 size={16} className="text-emerald" />
          <span>{mlModel.interpretation}</span>
        </div>
      </div>
    </div>
  );
};

