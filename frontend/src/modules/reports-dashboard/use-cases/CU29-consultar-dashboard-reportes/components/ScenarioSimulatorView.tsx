/**
 * @file ScenarioSimulatorView.tsx
 * @caso-de-uso CU29 — Consultar Dashboard (Business Intelligence & Machine Learning)
 * @subsistema Inteligencia de Negocios y Reportes
 * @capa Presentacion (React)
 * @descripcion Vista de Toma de Decisiones basada en Modelado Estocastico: Simulacion
 * de Monte Carlo con 1,000 iteraciones parametricas. Modela la incertidumbre del mercado
 * mediante procesos de Poisson para transacciones diarias y distribucion Normal (Box-Muller)
 * para tickets de venta, proyectando los percentiles P10 (Conservador), P50 (Base) y P90 (Optimista).
 * Diseno ejecutivo optimizado para decision rapida y libre de saturacion visual.
 */

import React, { useState, useEffect } from 'react';
import {
  RefreshCw,
  Play,
  AlertTriangle,
  Building2,
} from 'lucide-react';
import { reportsService } from '../services/reports.service';
import type { MonteCarloScenarioResult } from '../types/reports.types';
import { ExecutiveVerdictCard } from './ExecutiveVerdictCard';

interface ScenarioSimulatorViewProps {
  branches?: { id_sucursal: number; nombre: string }[];
}

export const ScenarioSimulatorView: React.FC<ScenarioSimulatorViewProps> = ({ branches = [] }) => {
  const [horizonDays, setHorizonDays] = useState<number>(30);
  const [growthRatePercent, setGrowthRatePercent] = useState<number>(0);
  const [selectedBranchId, setSelectedBranchId] = useState<number | undefined>(undefined);
  const [loading, setLoading] = useState<boolean>(true);
  const [data, setData] = useState<MonteCarloScenarioResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const runSimulation = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await reportsService.getMonteCarloScenarios({
        horizonDays,
        growthRatePercent,
        branchId: selectedBranchId,
      });
      setData(res);
    } catch (err: any) {
      setError(err?.message || 'Error al ejecutar simulación de Monte Carlo.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    runSimulation();
  }, [horizonDays, growthRatePercent, selectedBranchId]);

  const formatBs = (val: number) =>
    `Bs. ${Number(val || 0).toLocaleString('es-BO', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;

  if (loading && !data) {
    return (
      <div style={{ padding: '3.5rem 2rem', textAlign: 'center', backgroundColor: '#FFFFFF', borderRadius: '12px', border: '1px solid #EAE6DF' }}>
        <RefreshCw size={28} className="spin" style={{ color: '#8B5E34', marginBottom: '0.75rem', animation: 'spin 1s linear infinite' }} />
        <h4 style={{ margin: '0 0 0.4rem', color: '#1C1510', fontSize: '1rem', fontWeight: 600 }}>Generando 1,000 Simulaciones de Monte Carlo...</h4>
        <p style={{ margin: 0, color: '#736B63', fontSize: '0.84rem' }}>
          Muestreando llegadas estocásticas de Poisson y tickets con transformación Box-Muller en tiempo real.
        </p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center', backgroundColor: '#FEF2F2', borderRadius: '12px', border: '1px solid #FCA5A5', color: '#991B1B' }}>
        <AlertTriangle size={24} style={{ marginBottom: '0.5rem' }} />
        <p style={{ margin: '0 0 1rem', fontSize: '0.9rem', fontWeight: 500 }}>{error || 'No se pudo completar la simulación estocástica.'}</p>
        <button
          onClick={runSimulation}
          style={{ padding: '0.4rem 1rem', backgroundColor: '#991B1B', color: '#FFFFFF', border: 'none', borderRadius: '6px', fontSize: '0.82rem', cursor: 'pointer' }}
        >
          Reintentar Simulación
        </button>
      </div>
    );
  }

  const { executiveVerdict, parameters, scenarios, densityCurvePoints } = data;
  const { conservativeP10, baseP50, optimisticP90 } = scenarios;

  // Escalas Curva Gaussiana
  const maxDensity = Math.max(...densityCurvePoints.map((p) => p.density), 0.001);
  const minRevenue = densityCurvePoints[0]?.revenue || 0;
  const maxRevenue = densityCurvePoints[densityCurvePoints.length - 1]?.revenue || 100000;
  const revenueRange = Math.max(maxRevenue - minRevenue, 1);

  const svgWidth = 840;
  const svgHeight = 220;
  const padLeft = 45;
  const padRight = 45;
  const padTop = 20;
  const padBottom = 35;
  const graphWidth = svgWidth - padLeft - padRight;
  const graphHeight = svgHeight - padTop - padBottom;

  const getCurveX = (rev: number) => padLeft + ((rev - minRevenue) / revenueRange) * graphWidth;
  const getCurveY = (dens: number) => padTop + graphHeight - (dens / (maxDensity * 1.1)) * graphHeight;

  const curvePoints = densityCurvePoints.map((pt) => ({ x: getCurveX(pt.revenue), y: getCurveY(pt.density) }));
  const curveAreaD = `
    M ${curvePoints[0]?.x || padLeft} ${padTop + graphHeight}
    ${curvePoints.map((p) => `L ${p.x} ${p.y}`).join(' ')}
    L ${curvePoints[curvePoints.length - 1]?.x || svgWidth - padRight} ${padTop + graphHeight}
    Z
  `;
  const curveLineD = curvePoints.reduce((acc, p, i) => `${acc} ${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`, '');

  const xP10 = getCurveX(conservativeP10.totalRevenue);
  const xP50 = getCurveX(baseP50.totalRevenue);
  const xP90 = getCurveX(optimisticP90.totalRevenue);

  // Detalle técnico colapsable
  const techDetails = (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
        gap: '0.65rem',
        padding: '0.85rem',
        backgroundColor: '#FFFFFF',
        borderRadius: '8px',
        border: '1px solid #EAE6DF',
      }}
    >
      <div>
        <div style={{ fontSize: '0.68rem', color: '#736B63', fontWeight: 600 }}>DISTRIBUCIÓN POISSON (λ)</div>
        <div style={{ fontSize: '1.15rem', fontWeight: 700, color: '#1C1510' }}>{parameters.dailyLambdaTransactions.toFixed(1)} pedidos/día</div>
      </div>
      <div>
        <div style={{ fontSize: '0.68rem', color: '#736B63', fontWeight: 600 }}>TICKET NORMAL (μ)</div>
        <div style={{ fontSize: '1.15rem', fontWeight: 700, color: '#1C1510' }}>{formatBs(parameters.averageTicketMean)}</div>
      </div>
      <div>
        <div style={{ fontSize: '0.68rem', color: '#736B63', fontWeight: 600 }}>DESVIACIÓN (σ)</div>
        <div style={{ fontSize: '1.15rem', fontWeight: 700, color: '#1C1510' }}>±{formatBs(parameters.averageTicketStdDev)}</div>
      </div>
      <div>
        <div style={{ fontSize: '0.68rem', color: '#736B63', fontWeight: 600 }}>ITERACIONES</div>
        <div style={{ fontSize: '0.82rem', fontWeight: 600, color: '#1C1510' }}>
          {parameters.simulationsCount} corridas pseudoaleatorias Box-Muller
        </div>
      </div>
    </div>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.15rem', color: '#1C1510' }}>
      {/* 1. VEREDICTO EJECUTIVO DE RIESGO FINANCIERO */}
      {executiveVerdict && (
        <ExecutiveVerdictCard
          verdict={executiveVerdict}
          modelTechDetails={techDetails}
        />
      )}

      {/* 2. BARRA DE SENSIBILIDAD Y PARÁMETROS LIMPIA */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1rem',
          backgroundColor: '#FFFFFF',
          padding: '0.85rem 1.15rem',
          borderRadius: '10px',
          border: '1px solid #EAE6DF',
        }}
      >
        {/* Selector de Horizonte */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
          <span style={{ fontSize: '0.76rem', fontWeight: 600, color: '#5C4033' }}>Horizonte:</span>
          <div style={{ display: 'flex', gap: '0.25rem' }}>
            {[15, 30, 60, 90].map((d) => (
              <button
                key={d}
                type="button"
                onClick={() => setHorizonDays(d)}
                style={{
                  padding: '0.25rem 0.55rem',
                  borderRadius: '5px',
                  border: horizonDays === d ? '1px solid #8B5E34' : '1px solid #EAE6DF',
                  backgroundColor: horizonDays === d ? '#8B5E34' : '#FAF8F5',
                  color: horizonDays === d ? '#FFFFFF' : '#5C4033',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                {d}d
              </button>
            ))}
          </div>
        </div>

        {/* Deslizador de Shock de Mercado */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', minWidth: '240px' }}>
          <span style={{ fontSize: '0.76rem', fontWeight: 600, color: '#5C4033' }}>
            Shock Demanda:
          </span>
          <input
            type="range"
            min="-30"
            max="50"
            step="5"
            value={growthRatePercent}
            onChange={(e) => setGrowthRatePercent(Number(e.target.value))}
            style={{ flex: 1, cursor: 'pointer', accentColor: '#8B5E34' }}
          />
          <span
            style={{
              fontSize: '0.78rem',
              fontWeight: 700,
              minWidth: '42px',
              color: growthRatePercent >= 0 ? '#059669' : '#DC2626',
            }}
          >
            {growthRatePercent > 0 ? `+${growthRatePercent}%` : `${growthRatePercent}%`}
          </span>
        </div>

        {/* Ámbito de Sucursal */}
        {branches.length > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            <Building2 size={14} style={{ color: '#8B5E34' }} />
            <select
              value={selectedBranchId ?? ''}
              onChange={(e) => setSelectedBranchId(e.target.value ? Number(e.target.value) : undefined)}
              style={{
                padding: '0.3rem 0.6rem',
                borderRadius: '6px',
                border: '1px solid #D1C9BF',
                backgroundColor: '#FAF8F5',
                fontSize: '0.76rem',
                color: '#1C1510',
                outline: 'none',
              }}
            >
              <option value="">Todas las Sucursales</option>
              {branches.map((b) => (
                <option key={b.id_sucursal} value={b.id_sucursal}>
                  {b.nombre}
                </option>
              ))}
            </select>
          </div>
        )}

        <button
          onClick={runSimulation}
          disabled={loading}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.35rem',
            padding: '0.35rem 0.75rem',
            borderRadius: '6px',
            border: '1px solid #8B5E34',
            backgroundColor: '#8B5E34',
            color: '#FFFFFF',
            fontSize: '0.78rem',
            fontWeight: 600,
            cursor: loading ? 'not-allowed' : 'pointer',
          }}
        >
          <Play size={11} fill="#FFFFFF" />
          <span>Simular</span>
        </button>
      </div>

      {/* 3. LAS 3 TARJETAS DE ESCENARIOS (P10, P50, P90) CON COMPARATIVA DIRECTA */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
          gap: '0.85rem',
        }}
      >
        {/* P10 Conservador */}
        <div
          style={{
            backgroundColor: '#FFFFFF',
            borderRadius: '10px',
            border: '1px solid #FED7AA',
            padding: '1.1rem',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
          }}
        >
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span
                style={{
                  fontSize: '0.72rem',
                  fontWeight: 700,
                  padding: '0.15rem 0.45rem',
                  borderRadius: '4px',
                  backgroundColor: '#FFF7ED',
                  color: '#C2410C',
                  border: '1px solid #FFEDD5',
                }}
              >
                PISO SEGURO (P10)
              </span>
              <span style={{ fontSize: '0.7rem', color: '#C2410C' }}>90% de superar esto</span>
            </div>

            <div style={{ margin: '0.8rem 0 0.4rem' }}>
              <div style={{ fontSize: '0.7rem', color: '#736B63', textTransform: 'uppercase' }}>Ingreso Estimado</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#9A3412', marginTop: '0.1rem' }}>
                {formatBs(conservativeP10.totalRevenue)}
              </div>
            </div>

            <div style={{ fontSize: '0.75rem', color: '#5C4033' }}>
              Margen Bruto: <strong>{formatBs(conservativeP10.grossMarginEstimated)}</strong>
            </div>
          </div>

          <div
            style={{
              marginTop: '0.8rem',
              padding: '0.55rem 0.7rem',
              backgroundColor: '#FFF7ED',
              borderRadius: '6px',
              fontSize: '0.72rem',
              color: '#9A3412',
              border: '1px solid #FFEDD5',
              lineHeight: 1.35,
            }}
          >
            <strong>Directriz P10:</strong> {conservativeP10.strategicAdvice}
          </div>
        </div>

        {/* P50 Esperado */}
        <div
          style={{
            backgroundColor: '#FFFFFF',
            borderRadius: '10px',
            border: '2px solid #8B5E34',
            padding: '1.1rem',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            boxShadow: '0 3px 10px rgba(139, 94, 52, 0.08)',
          }}
        >
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span
                style={{
                  fontSize: '0.72rem',
                  fontWeight: 700,
                  padding: '0.15rem 0.45rem',
                  borderRadius: '4px',
                  backgroundColor: '#F7F3EE',
                  color: '#8B5E34',
                  border: '1px solid #E4D8CE',
                }}
              >
                ESCENARIO BASE (P50)
              </span>
              <span style={{ fontSize: '0.7rem', color: '#8B5E34', fontWeight: 600 }}>Más probable</span>
            </div>

            <div style={{ margin: '0.8rem 0 0.4rem' }}>
              <div style={{ fontSize: '0.7rem', color: '#736B63', textTransform: 'uppercase' }}>Ingreso Estimado</div>
              <div style={{ fontSize: '1.65rem', fontWeight: 800, color: '#8B5E34', marginTop: '0.1rem' }}>
                {formatBs(baseP50.totalRevenue)}
              </div>
            </div>

            <div style={{ fontSize: '0.75rem', color: '#5C4033' }}>
              Margen Bruto: <strong>{formatBs(baseP50.grossMarginEstimated)}</strong>
            </div>
          </div>

          <div
            style={{
              marginTop: '0.8rem',
              padding: '0.55rem 0.7rem',
              backgroundColor: '#FAF8F5',
              borderRadius: '6px',
              fontSize: '0.72rem',
              color: '#5C4033',
              border: '1px solid #EAE6DF',
              lineHeight: 1.35,
            }}
          >
            <strong>Directriz P50:</strong> {baseP50.strategicAdvice}
          </div>
        </div>

        {/* P90 Optimista */}
        <div
          style={{
            backgroundColor: '#FFFFFF',
            borderRadius: '10px',
            border: '1px solid #A7F3D0',
            padding: '1.1rem',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
          }}
        >
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span
                style={{
                  fontSize: '0.72rem',
                  fontWeight: 700,
                  padding: '0.15rem 0.45rem',
                  borderRadius: '4px',
                  backgroundColor: '#ECFDF5',
                  color: '#065F46',
                  border: '1px solid #A7F3D0',
                }}
              >
                PICO FAVORABLE (P90)
              </span>
              <span style={{ fontSize: '0.7rem', color: '#047857' }}>10% probabilidad superior</span>
            </div>

            <div style={{ margin: '0.8rem 0 0.4rem' }}>
              <div style={{ fontSize: '0.7rem', color: '#736B63', textTransform: 'uppercase' }}>Ingreso Estimado</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#047857', marginTop: '0.1rem' }}>
                {formatBs(optimisticP90.totalRevenue)}
              </div>
            </div>

            <div style={{ fontSize: '0.75rem', color: '#5C4033' }}>
              Margen Bruto: <strong>{formatBs(optimisticP90.grossMarginEstimated)}</strong>
            </div>
          </div>

          <div
            style={{
              marginTop: '0.8rem',
              padding: '0.55rem 0.7rem',
              backgroundColor: '#ECFDF5',
              borderRadius: '6px',
              fontSize: '0.72rem',
              color: '#065F46',
              border: '1px solid #A7F3D0',
              lineHeight: 1.35,
            }}
          >
            <strong>Directriz P90:</strong> {optimisticP90.strategicAdvice}
          </div>
        </div>
      </div>

      {/* 4. CURVA DE DENSIDAD DE PROBABILIDAD GAUSSIANA MINIMALISTA */}
      <div
        style={{
          backgroundColor: '#FFFFFF',
          borderRadius: '12px',
          border: '1px solid #EAE6DF',
          padding: '1.15rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.75rem',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
          <div>
            <h4 style={{ margin: 0, fontSize: '0.9rem', fontWeight: 700, color: '#1C1510' }}>
              Distribución de Probabilidad de Ingresos Totales
            </h4>
            <p style={{ margin: '0.15rem 0 0', fontSize: '0.75rem', color: '#736B63' }}>
              Campana estocástica construida con las 1,000 iteraciones paramétricas.
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', fontSize: '0.73rem', fontWeight: 600 }}>
            <span style={{ color: '#EA580C' }}>P10: {formatBs(conservativeP10.totalRevenue)}</span>
            <span style={{ color: '#8B5E34' }}>P50: {formatBs(baseP50.totalRevenue)}</span>
            <span style={{ color: '#059669' }}>P90: {formatBs(optimisticP90.totalRevenue)}</span>
          </div>
        </div>

        <div style={{ width: '100%', overflowX: 'auto' }}>
          <svg
            viewBox={`0 0 ${svgWidth} ${svgHeight}`}
            style={{ width: '100%', minWidth: '660px', height: 'auto', display: 'block' }}
          >
            <defs>
              <linearGradient id="cleanGaussGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#8B5E34" stopOpacity="0.28" />
                <stop offset="100%" stopColor="#8B5E34" stopOpacity="0.03" />
              </linearGradient>
            </defs>

            <line x1={padLeft} y1={padTop + graphHeight} x2={svgWidth - padRight} y2={padTop + graphHeight} stroke="#D1C9BF" strokeWidth="1" />

            <path d={curveAreaD} fill="url(#cleanGaussGrad)" />
            <path d={curveLineD} fill="none" stroke="#8B5E34" strokeWidth="2.5" strokeLinecap="round" />

            {/* Marcador P10 */}
            <line x1={xP10} y1={padTop} x2={xP10} y2={padTop + graphHeight} stroke="#EA580C" strokeWidth="1.5" strokeDasharray="3,3" />
            <text x={xP10} y={padTop - 6} textAnchor="middle" fontSize="10" fontWeight="700" fill="#EA580C">P10</text>

            {/* Marcador P50 */}
            <line x1={xP50} y1={padTop} x2={xP50} y2={padTop + graphHeight} stroke="#8B5E34" strokeWidth="2" />
            <text x={xP50} y={padTop - 6} textAnchor="middle" fontSize="11" fontWeight="800" fill="#8B5E34">P50 (Mediana)</text>

            {/* Marcador P90 */}
            <line x1={xP90} y1={padTop} x2={xP90} y2={padTop + graphHeight} stroke="#059669" strokeWidth="1.5" strokeDasharray="3,3" />
            <text x={xP90} y={padTop - 6} textAnchor="middle" fontSize="10" fontWeight="700" fill="#059669">P90</text>

            {/* Eje de Ingresos (X) */}
            {[0, 0.5, 1].map((pct, idx) => {
              const xVal = padLeft + graphWidth * pct;
              const rVal = minRevenue + revenueRange * pct;
              return (
                <g key={idx}>
                  <line x1={xVal} y1={padTop + graphHeight} x2={xVal} y2={padTop + graphHeight + 4} stroke="#A1978E" strokeWidth="1" />
                  <text x={xVal} y={padTop + graphHeight + 16} textAnchor="middle" fontSize="10" fill="#736B63">
                    {formatBs(rVal)}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>
      </div>
    </div>
  );
};
