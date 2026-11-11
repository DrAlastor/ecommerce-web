import React, { useState } from 'react';
import { Layers } from 'lucide-react';
import type { PlanDistributionPoint } from '../../../types/saas.types';

interface PlanDistributionChartProps {
  plans: PlanDistributionPoint[];
}

export const PlanDistributionChart: React.FC<PlanDistributionChartProps> = ({ plans }) => {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  const totalTenants = plans.reduce((acc, p) => acc + p.tenantCount, 0) || 1;
  const totalMrr = plans.reduce((acc, p) => acc + p.monthlyRevenue, 0);

  // Generar arcos de Donut SVG
  const radius = 80;
  const strokeWidth = 26;
  const center = 110;
  const circumference = 2 * Math.PI * radius;

  let accumulatedOffset = 0;

  return (
    <div className="saas-card-half">
      <div className="saas-card-header">
        <div className="saas-header-with-icon">
          <Layers size={20} className="text-indigo" />
          <h3 className="saas-card-title">Distribución por Planes de Suscripción</h3>
        </div>
        <span className="saas-card-tag">{plans.length} Planes Activos</span>
      </div>

      <div className="saas-donut-wrapper">
        <div className="saas-donut-svg-container">
          <svg viewBox="0 0 220 220" className="saas-donut-svg">
            <circle
              cx={center}
              cy={center}
              r={radius}
              fill="transparent"
              stroke="#F1F5F9"
              strokeWidth={strokeWidth}
            />

            {plans.map((p, idx) => {
              const sliceFraction = p.tenantCount / totalTenants;
              const strokeDasharray = `${sliceFraction * circumference} ${circumference}`;
              const strokeDashoffset = -accumulatedOffset;
              accumulatedOffset += sliceFraction * circumference;

              const isHovered = hoveredIdx === idx;

              return (
                <circle
                  key={p.planId}
                  cx={center}
                  cy={center}
                  r={radius}
                  fill="transparent"
                  stroke={p.color}
                  strokeWidth={isHovered ? strokeWidth + 4 : strokeWidth}
                  strokeDasharray={strokeDasharray}
                  strokeDashoffset={strokeDashoffset}
                  strokeLinecap="butt"
                  transform={`rotate(-90 ${center} ${center})`}
                  style={{
                    transition: 'stroke-width 0.2s ease, filter 0.2s ease',
                    cursor: 'pointer',
                    filter: isHovered ? 'drop-shadow(0 4px 6px rgba(0,0,0,0.15))' : 'none',
                  }}
                  onMouseEnter={() => setHoveredIdx(idx)}
                  onMouseLeave={() => setHoveredIdx(null)}
                />
              );
            })}

            {/* Texto central en el Donut */}
            <text x={center} y={center - 6} textAnchor="middle" className="donut-center-label">
              Total MRR
            </text>
            <text x={center} y={center + 16} textAnchor="middle" className="donut-center-val">
              ${totalMrr.toFixed(0)} USD
            </text>
          </svg>
        </div>

        {/* Leyenda y detalles */}
        <div className="saas-donut-legend">
          {plans.map((p, idx) => {
            const isHovered = hoveredIdx === idx;
            return (
              <div
                key={p.planId}
                className={`legend-plan-row ${isHovered ? 'highlighted' : ''}`}
                onMouseEnter={() => setHoveredIdx(idx)}
                onMouseLeave={() => setHoveredIdx(null)}
              >
                <div className="plan-color-dot" style={{ backgroundColor: p.color }} />
                <div className="plan-name-col">
                  <span className="plan-title">{p.planName}</span>
                  <span className="plan-sub">
                    {p.tenantCount} {p.tenantCount === 1 ? 'inquilino' : 'inquilinos'}
                  </span>
                </div>
                <div className="plan-mrr-col">
                  <span className="plan-mrr">${p.monthlyRevenue.toFixed(2)}/mes</span>
                  <span className="plan-pct">{p.percentage}%</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

