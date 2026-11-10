/**
 * @file ScenarioSimulatorView.tsx
 * @caso-de-uso CU29 — Consultar Dashboard (Business Intelligence & Machine Learning)
 * @subsistema Inteligencia de Negocios y Reportes
 * @capa Presentacion (React)
 * @descripcion Vista de Toma de Decisiones basada en Modelado Estocastico: Simulacion
 * de Monte Carlo con 1,000 iteraciones parametricas. Modela la incertidumbre del mercado
 * mediante procesos de Poisson para transacciones diarias y distribucion Normal (Box-Muller)
 * para tickets de venta, proyectando los percentiles P10 (Conservador), P50 (Base) y P90 (Optimista).
 */

import React, { useState, useEffect } from 'react';
import {
  Dice5,
  RefreshCw,
  Play,
  AlertTriangle,
} from 'lucide-react';
import { reportsService } from '../services/reports.service';
import type { MonteCarloScenarioResult } from '../types/reports.types';

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
    `Bs. ${Number(val || 0).toLocaleString('es-BO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  if (loading && !data) {
    return (
      <div style={{ padding: '3rem', textAlign: 'center', backgroundColor: '#FFFFFF', borderRadius: '12px', border: '1px solid #EAE6DF' }}>
        <RefreshCw size={28} className="spin" style={{ color: '#8B5E34', marginBottom: '0.75rem', animation: 'spin 1s linear infinite' }} />
        <h4 style={{ margin: '0 0 0.5rem', color: '#1C1510', fontSize: '1rem', fontWeight: 600 }}>Generando 1,000 Simulaciones de Monte Carlo...</h4>
        <p style={{ margin: 0, color: '#736B63', fontSize: '0.85rem' }}>
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

  const { parameters, scenarios, densityCurvePoints } = data;
  const { conservativeP10, baseP50, optimisticP90 } = scenarios;

  // Calculo de escalas para el Grafico SVG de Campana de Gauss (Densidad de Probabilidad)
  const maxDensity = Math.max(...densityCurvePoints.map((p) => p.density), 0.001);
  const minRevenue = densityCurvePoints[0]?.revenue || 0;
  const maxRevenue = densityCurvePoints[densityCurvePoints.length - 1]?.revenue || 100000;
  const revenueRange = Math.max(maxRevenue - minRevenue, 1);

  const svgWidth = 840;
  const svgHeight = 240;
  const padLeft = 45;
  const padRight = 45;
  const padTop = 25;
  const padBottom = 40;
  const graphWidth = svgWidth - padLeft - padRight;
  const graphHeight = svgHeight - padTop - padBottom;

  const getCurveX = (rev: number) => padLeft + ((rev - minRevenue) / revenueRange) * graphWidth;
  const getCurveY = (dens: number) => padTop + graphHeight - (dens / (maxDensity * 1.1)) * graphHeight;

  // Area poligonal de la campana
  const curvePoints = densityCurvePoints.map((pt) => ({ x: getCurveX(pt.revenue), y: getCurveY(pt.density) }));
  const curveAreaD = `
    M ${curvePoints[0]?.x || padLeft} ${padTop + graphHeight}
    ${curvePoints.map((p) => `L ${p.x} ${p.y}`).join(' ')}
    L ${curvePoints[curvePoints.length - 1]?.x || svgWidth - padRight} ${padTop + graphHeight}
    Z
  `;
  const curveLineD = curvePoints.reduce((acc, p, i) => `${acc} ${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`, '');

  // Coordenadas X para los percentiles P10, P50 y P90
  const xP10 = getCurveX(conservativeP10.totalRevenue);
  const xP50 = getCurveX(baseP50.totalRevenue);
  const xP90 = getCurveX(optimisticP90.totalRevenue);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', color: '#1C1510' }}>
      {/* 1. CABECERA TÉCNICA Y CONTROLES DE SIMULACIÓN */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1rem',
          backgroundColor: '#FFFFFF',
          padding: '1.15rem 1.35rem',
          borderRadius: '12px',
          border: '1px solid #EAE6DF',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
          <div
            style={{
              width: '42px',
              height: '42px',
              borderRadius: '10px',
              backgroundColor: '#F7F3EE',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#8B5E34',
              border: '1px solid #E4D8CE',
            }}
          >
            <Dice5 size={22} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700, color: '#1C1510' }}>
                Simulación de Monte Carlo: Proyección Estocástica de Escenarios
              </h3>
              <span
                style={{
                  fontSize: '0.68rem',
                  fontWeight: 700,
                  padding: '0.2rem 0.55rem',
                  borderRadius: '12px',
                  backgroundColor: '#FEF3C7',
                  color: '#92400E',
                  border: '1px solid #FDE68A',
                  letterSpacing: '0.3px',
                }}
              >
                1,000 ITERACIONES ESTOCÁSTICAS
              </span>
            </div>
            <p style={{ margin: '0.25rem 0 0', fontSize: '0.8rem', color: '#736B63' }}>
              Modelado paramétrico con distribución Poisson (llegadas) y Normal Box-Muller (ticket de venta) para análisis de riesgo.
            </p>
          </div>
        </div>

        <button
          onClick={runSimulation}
          disabled={loading}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.4rem',
            padding: '0.42rem 0.85rem',
            borderRadius: '8px',
            border: '1px solid #8B5E34',
            backgroundColor: '#8B5E34',
            color: '#FFFFFF',
            fontSize: '0.8rem',
            fontWeight: 600,
            cursor: loading ? 'not-allowed' : 'pointer',
            boxShadow: '0 1px 3px rgba(139,94,52,0.2)',
          }}
        >
          <Play size={13} fill="#FFFFFF" />
          <span>Re-ejecutar Simulación</span>
        </button>
      </div>

      {/* 2. BARRA INTERACTIVA DE PARÁMETROS Y SENSIBILIDAD */}
      <div
        style={{
          backgroundColor: '#FFFFFF',
          borderRadius: '12px',
          border: '1px solid #EAE6DF',
          padding: '1.15rem 1.35rem',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '1.25rem',
          alignItems: 'center',
        }}
      >
        {/* Selector de Horizonte Temporal */}
        <div>
          <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#5C4033', marginBottom: '0.35rem' }}>
            Horizonte de Proyección
          </label>
          <div style={{ display: 'flex', gap: '0.35rem' }}>
            {[15, 30, 60, 90].map((d) => (
              <button
                key={d}
                type="button"
                onClick={() => setHorizonDays(d)}
                style={{
                  flex: 1,
                  padding: '0.35rem 0.5rem',
                  borderRadius: '6px',
                  border: horizonDays === d ? '1px solid #8B5E34' : '1px solid #EAE6DF',
                  backgroundColor: horizonDays === d ? '#8B5E34' : '#FAF8F5',
                  color: horizonDays === d ? '#FFFFFF' : '#5C4033',
                  fontSize: '0.78rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
              >
                {d}d
              </button>
            ))}
          </div>
        </div>

        {/* Deslizador de Variación de Demanda / Shock de Mercado */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
            <label style={{ fontSize: '0.75rem', fontWeight: 600, color: '#5C4033' }}>
              Shock de Mercado / Crecimiento
            </label>
            <span
              style={{
                fontSize: '0.75rem',
                fontWeight: 700,
                color: growthRatePercent >= 0 ? '#059669' : '#DC2626',
              }}
            >
              {growthRatePercent > 0 ? `+${growthRatePercent}%` : `${growthRatePercent}%`}
            </span>
          </div>
          <input
            type="range"
            min="-30"
            max="50"
            step="5"
            value={growthRatePercent}
            onChange={(e) => setGrowthRatePercent(Number(e.target.value))}
            style={{ width: '100%', cursor: 'pointer', accentColor: '#8B5E34' }}
          />
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.68rem', color: '#A1978E', marginTop: '0.15rem' }}>
            <span>-30% (Crisis/Recesión)</span>
            <span>0% (Inercial)</span>
            <span>+50% (Temporada Alta)</span>
          </div>
        </div>

        {/* Filtro de Sucursal */}
        {branches.length > 0 && (
          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#5C4033', marginBottom: '0.35rem' }}>
              Ámbito de Sucursal
            </label>
            <select
              value={selectedBranchId ?? ''}
              onChange={(e) => setSelectedBranchId(e.target.value ? Number(e.target.value) : undefined)}
              style={{
                width: '100%',
                padding: '0.4rem 0.65rem',
                borderRadius: '6px',
                border: '1px solid #D1C9BF',
                backgroundColor: '#FAF8F5',
                fontSize: '0.8rem',
                color: '#1C1510',
                outline: 'none',
              }}
            >
              <option value="">Todas las Sucursales (Consolidado)</option>
              {branches.map((b) => (
                <option key={b.id_sucursal} value={b.id_sucursal}>
                  {b.nombre}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Parámetros Estocásticos Derivados */}
        <div style={{ fontSize: '0.72rem', color: '#736B63', borderLeft: '2px solid #EAE6DF', paddingLeft: '0.85rem' }}>
          <div><strong>Poisson λ:</strong> {parameters.dailyLambdaTransactions.toFixed(1)} transac/día</div>
          <div style={{ marginTop: '0.15rem' }}><strong>Normal μ:</strong> {formatBs(parameters.averageTicketMean)}</div>
          <div style={{ marginTop: '0.15rem' }}><strong>Normal σ:</strong> ±{formatBs(parameters.averageTicketStdDev)}</div>
        </div>
      </div>

      {/* 3. LAS 3 TARJETAS DE ESCENARIOS P10, P50, P90 */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '1rem',
        }}
      >
        {/* ESCENARIO CONSERVADOR (P10) */}
        <div
          style={{
            backgroundColor: '#FFFFFF',
            borderRadius: '12px',
            border: '1px solid #FED7AA',
            padding: '1.2rem',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            boxShadow: '0 2px 6px rgba(234, 88, 12, 0.04)',
          }}
        >
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span
                style={{
                  fontSize: '0.72rem',
                  fontWeight: 700,
                  padding: '0.2rem 0.55rem',
                  borderRadius: '4px',
                  backgroundColor: '#FFF7ED',
                  color: '#C2410C',
                  border: '1px solid #FFEDD5',
                }}
              >
                PERCENTIL 10 (P10)
              </span>
              <span style={{ fontSize: '0.72rem', color: '#C2410C', fontWeight: 600 }}>90% de superar este umbral</span>
            </div>

            <h4 style={{ margin: '0.6rem 0 0.2rem', fontSize: '1rem', fontWeight: 700, color: '#9A3412' }}>
              {conservativeP10.label}
            </h4>
            <p style={{ margin: 0, fontSize: '0.75rem', color: '#736B63' }}>{conservativeP10.description}</p>

            <div style={{ margin: '1rem 0 0.75rem' }}>
              <div style={{ fontSize: '0.72rem', color: '#736B63', textTransform: 'uppercase' }}>Ingresos Estimados</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#9A3412', marginTop: '0.15rem' }}>
                {formatBs(conservativeP10.totalRevenue)}
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: '#5C4033', padding: '0.5rem 0', borderTop: '1px solid #FED7AA' }}>
              <span>Margen Bruto: <strong>{formatBs(conservativeP10.grossMarginEstimated)}</strong></span>
              <span>Transacciones: <strong>{conservativeP10.projectedTransactions}</strong></span>
            </div>
          </div>

          <div
            style={{
              marginTop: '0.85rem',
              padding: '0.65rem 0.75rem',
              backgroundColor: '#FFF7ED',
              borderRadius: '6px',
              fontSize: '0.73rem',
              color: '#9A3412',
              border: '1px solid #FFEDD5',
              lineHeight: 1.35,
            }}
          >
            <strong>Consejo P10:</strong> {conservativeP10.strategicAdvice}
          </div>
        </div>

        {/* ESCENARIO BASE (P50 - MEDIANA) */}
        <div
          style={{
            backgroundColor: '#FFFFFF',
            borderRadius: '12px',
            border: '2px solid #8B5E34',
            padding: '1.2rem',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            boxShadow: '0 4px 12px rgba(139, 94, 52, 0.08)',
          }}
        >
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span
                style={{
                  fontSize: '0.72rem',
                  fontWeight: 700,
                  padding: '0.2rem 0.55rem',
                  borderRadius: '4px',
                  backgroundColor: '#F7F3EE',
                  color: '#8B5E34',
                  border: '1px solid #E4D8CE',
                }}
              >
                MEDIANA ESTOCÁSTICA (P50)
              </span>
              <span style={{ fontSize: '0.72rem', color: '#8B5E34', fontWeight: 600 }}>Escenario más probable</span>
            </div>

            <h4 style={{ margin: '0.6rem 0 0.2rem', fontSize: '1rem', fontWeight: 700, color: '#1C1510' }}>
              {baseP50.label}
            </h4>
            <p style={{ margin: 0, fontSize: '0.75rem', color: '#736B63' }}>{baseP50.description}</p>

            <div style={{ margin: '1rem 0 0.75rem' }}>
              <div style={{ fontSize: '0.72rem', color: '#736B63', textTransform: 'uppercase' }}>Ingresos Estimados</div>
              <div style={{ fontSize: '1.65rem', fontWeight: 800, color: '#8B5E34', marginTop: '0.15rem' }}>
                {formatBs(baseP50.totalRevenue)}
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: '#5C4033', padding: '0.5rem 0', borderTop: '1px solid #EAE6DF' }}>
              <span>Margen Bruto: <strong>{formatBs(baseP50.grossMarginEstimated)}</strong></span>
              <span>Transacciones: <strong>{baseP50.projectedTransactions}</strong></span>
            </div>
          </div>

          <div
            style={{
              marginTop: '0.85rem',
              padding: '0.65rem 0.75rem',
              backgroundColor: '#FAF8F5',
              borderRadius: '6px',
              fontSize: '0.73rem',
              color: '#5C4033',
              border: '1px solid #EAE6DF',
              lineHeight: 1.35,
            }}
          >
            <strong>Consejo P50:</strong> {baseP50.strategicAdvice}
          </div>
        </div>

        {/* ESCENARIO OPTIMISTA (P90) */}
        <div
          style={{
            backgroundColor: '#FFFFFF',
            borderRadius: '12px',
            border: '1px solid #A7F3D0',
            padding: '1.2rem',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            boxShadow: '0 2px 6px rgba(16, 185, 129, 0.04)',
          }}
        >
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span
                style={{
                  fontSize: '0.72rem',
                  fontWeight: 700,
                  padding: '0.2rem 0.55rem',
                  borderRadius: '4px',
                  backgroundColor: '#ECFDF5',
                  color: '#065F46',
                  border: '1px solid #A7F3D0',
                }}
              >
                PERCENTIL 90 (P90)
              </span>
              <span style={{ fontSize: '0.72rem', color: '#047857', fontWeight: 600 }}>10% probabilidad superior</span>
            </div>

            <h4 style={{ margin: '0.6rem 0 0.2rem', fontSize: '1rem', fontWeight: 700, color: '#065F46' }}>
              {optimisticP90.label}
            </h4>
            <p style={{ margin: 0, fontSize: '0.75rem', color: '#736B63' }}>{optimisticP90.description}</p>

            <div style={{ margin: '1rem 0 0.75rem' }}>
              <div style={{ fontSize: '0.72rem', color: '#736B63', textTransform: 'uppercase' }}>Ingresos Estimados</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#047857', marginTop: '0.15rem' }}>
                {formatBs(optimisticP90.totalRevenue)}
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: '#5C4033', padding: '0.5rem 0', borderTop: '1px solid #A7F3D0' }}>
              <span>Margen Bruto: <strong>{formatBs(optimisticP90.grossMarginEstimated)}</strong></span>
              <span>Transacciones: <strong>{optimisticP90.projectedTransactions}</strong></span>
            </div>
          </div>

          <div
            style={{
              marginTop: '0.85rem',
              padding: '0.65rem 0.75rem',
              backgroundColor: '#ECFDF5',
              borderRadius: '6px',
              fontSize: '0.73rem',
              color: '#065F46',
              border: '1px solid #A7F3D0',
              lineHeight: 1.35,
            }}
          >
            <strong>Consejo P90:</strong> {optimisticP90.strategicAdvice}
          </div>
        </div>
      </div>

      {/* 4. GRÁFICO SVG NATIVO: CURVA DE DENSIDAD DE PROBABILIDAD (CAMPANA DE GAUSS) */}
      <div
        style={{
          backgroundColor: '#FFFFFF',
          borderRadius: '12px',
          border: '1px solid #EAE6DF',
          padding: '1.25rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '1rem',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
          <div>
            <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700, color: '#1C1510' }}>
              Función de Densidad de Probabilidad de Ingresos (Curva Gaussiana Simulada)
            </h4>
            <p style={{ margin: '0.2rem 0 0', fontSize: '0.78rem', color: '#736B63' }}>
              Distribución de frecuencias relativas generada a partir de las 1,000 corridas de simulación estocástica.
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', fontSize: '0.75rem', fontWeight: 600 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <span style={{ width: '12px', height: '0', borderTop: '2px dashed #EA580C' }} />
              <span style={{ color: '#EA580C' }}>P10 ({formatBs(conservativeP10.totalRevenue)})</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <span style={{ width: '12px', height: '3px', backgroundColor: '#8B5E34', borderRadius: '2px' }} />
              <span style={{ color: '#8B5E34' }}>P50 ({formatBs(baseP50.totalRevenue)})</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <span style={{ width: '12px', height: '0', borderTop: '2px dashed #059669' }} />
              <span style={{ color: '#059669' }}>P90 ({formatBs(optimisticP90.totalRevenue)})</span>
            </div>
          </div>
        </div>

        {/* Lienzo SVG Gauss */}
        <div style={{ width: '100%', overflowX: 'auto' }}>
          <svg
            viewBox={`0 0 ${svgWidth} ${svgHeight}`}
            style={{ width: '100%', minWidth: '680px', height: 'auto', display: 'block' }}
          >
            <defs>
              <linearGradient id="gaussGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#8B5E34" stopOpacity="0.35" />
                <stop offset="100%" stopColor="#8B5E34" stopOpacity="0.03" />
              </linearGradient>
            </defs>

            {/* Cuadrícula base */}
            <line
              x1={padLeft}
              y1={padTop + graphHeight}
              x2={svgWidth - padRight}
              y2={padTop + graphHeight}
              stroke="#D1C9BF"
              strokeWidth="1.5"
            />

            {/* Área bajo la curva de probabilidad */}
            <path d={curveAreaD} fill="url(#gaussGrad)" />
            <path d={curveLineD} fill="none" stroke="#8B5E34" strokeWidth="2.5" strokeLinecap="round" />

            {/* Marcador Vertical P10 (Conservador) */}
            <line
              x1={xP10}
              y1={padTop}
              x2={xP10}
              y2={padTop + graphHeight}
              stroke="#EA580C"
              strokeWidth="1.5"
              strokeDasharray="4,3"
            />
            <circle cx={xP10} cy={padTop + 4} r={4} fill="#EA580C" />
            <text x={xP10} y={padTop - 8} textAnchor="middle" fontSize="10" fontWeight="700" fill="#EA580C">
              P10
            </text>

            {/* Marcador Vertical P50 (Mediana Base) */}
            <line
              x1={xP50}
              y1={padTop}
              x2={xP50}
              y2={padTop + graphHeight}
              stroke="#8B5E34"
              strokeWidth="2.5"
            />
            <circle cx={xP50} cy={padTop + 4} r={5} fill="#8B5E34" />
            <text x={xP50} y={padTop - 8} textAnchor="middle" fontSize="11" fontWeight="800" fill="#8B5E34">
              P50 (Mediana)
            </text>

            {/* Marcador Vertical P90 (Optimista) */}
            <line
              x1={xP90}
              y1={padTop}
              x2={xP90}
              y2={padTop + graphHeight}
              stroke="#059669"
              strokeWidth="1.5"
              strokeDasharray="4,3"
            />
            <circle cx={xP90} cy={padTop + 4} r={4} fill="#059669" />
            <text x={xP90} y={padTop - 8} textAnchor="middle" fontSize="10" fontWeight="700" fill="#059669">
              P90
            </text>

            {/* Eje de Ingresos (X) con 5 marcas */}
            {[0, 0.25, 0.5, 0.75, 1].map((pct, idx) => {
              const xVal = padLeft + graphWidth * pct;
              const rVal = minRevenue + revenueRange * pct;
              return (
                <g key={idx}>
                  <line x1={xVal} y1={padTop + graphHeight} x2={xVal} y2={padTop + graphHeight + 6} stroke="#A1978E" strokeWidth="1" />
                  <text
                    x={xVal}
                    y={padTop + graphHeight + 18}
                    textAnchor="middle"
                    fontSize="10"
                    fill="#736B63"
                    fontFamily="inherit"
                  >
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
