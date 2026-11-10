/**
 * @file DemandForecastingView.tsx
 * @caso-de-uso CU29 — Consultar Dashboard (Business Intelligence & Machine Learning)
 * @subsistema Inteligencia de Negocios y Reportes
 * @capa Presentacion (React)
 * @descripcion Vista de Toma de Decisiones basada en Modelo Supervisado: Red Neuronal
 * Artificial (MLP) entrenada con propagacion hacia atras (Backpropagation) y activacion ReLU.
 * Proyecta la demanda de ventas para las proximas 4 semanas con intervalos de confianza
 * del 95% y genera la Matriz Prescriptiva de Reabastecimiento por Sucursal.
 */

import React, { useState, useEffect } from 'react';
import {
  BrainCircuit,
  AlertTriangle,
  Package,
  ShieldCheck,
  RefreshCw,
  Building2,
  ArrowUpRight,
} from 'lucide-react';
import { reportsService } from '../services/reports.service';
import type { DemandPredictionResult } from '../types/reports.types';

interface DemandForecastingViewProps {
  branches?: { id_sucursal: number; nombre: string }[];
}

export const DemandForecastingView: React.FC<DemandForecastingViewProps> = ({ branches = [] }) => {
  const [selectedBranchId, setSelectedBranchId] = useState<number | undefined>(undefined);
  const [loading, setLoading] = useState<boolean>(true);
  const [data, setData] = useState<DemandPredictionResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const loadData = async (branchId?: number) => {
    try {
      setLoading(true);
      setError(null);
      const res = await reportsService.getDemandPredictions(branchId);
      setData(res);
    } catch (err: any) {
      setError(err?.message || 'Error al cargar predicciones de la red neuronal.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData(selectedBranchId);
  }, [selectedBranchId]);

  if (loading && !data) {
    return (
      <div style={{ padding: '3rem', textAlign: 'center', backgroundColor: '#FFFFFF', borderRadius: '12px', border: '1px solid #EAE6DF' }}>
        <RefreshCw size={28} className="spin" style={{ color: '#8B5E34', marginBottom: '0.75rem', animation: 'spin 1s linear infinite' }} />
        <h4 style={{ margin: '0 0 0.5rem', color: '#1C1510', fontSize: '1rem', fontWeight: 600 }}>Entrenando Red Neuronal en Tiempo Real...</h4>
        <p style={{ margin: 0, color: '#736B63', fontSize: '0.85rem' }}>
          Extrayendo series temporales multi-tenant, normalizando matrices y ejecutando descenso por gradiente.
        </p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center', backgroundColor: '#FEF2F2', borderRadius: '12px', border: '1px solid #FCA5A5', color: '#991B1B' }}>
        <AlertTriangle size={24} style={{ marginBottom: '0.5rem' }} />
        <p style={{ margin: '0 0 1rem', fontSize: '0.9rem', fontWeight: 500 }}>{error || 'No se pudieron calcular las predicciones.'}</p>
        <button
          onClick={() => loadData(selectedBranchId)}
          style={{ padding: '0.4rem 1rem', backgroundColor: '#991B1B', color: '#FFFFFF', border: 'none', borderRadius: '6px', fontSize: '0.82rem', cursor: 'pointer' }}
        >
          Reintentar Inferencia
        </button>
      </div>
    );
  }

  const { historicalWeeks, forecastWeeks, modelMetrics, replenishmentAlerts } = data;

  // Calculo de escalas para el Grafico SVG de Series Temporales y Prediccion
  const allPoints = [
    ...historicalWeeks.map((h) => ({ label: h.weekLabel, actual: h.actualUnits, predicted: null, lower: null, upper: null, isForecast: false })),
    ...forecastWeeks.map((f) => ({ label: f.weekLabel, actual: null, predicted: f.predictedUnits, lower: f.confidenceLower, upper: f.confidenceUpper, isForecast: true })),
  ];

  const maxVal = Math.max(
    ...historicalWeeks.map((h) => h.actualUnits),
    ...forecastWeeks.map((f) => f.confidenceUpper),
    10,
  );

  const svgWidth = 840;
  const svgHeight = 260;
  const padLeft = 55;
  const padRight = 35;
  const padTop = 30;
  const padBottom = 45;
  const graphWidth = svgWidth - padLeft - padRight;
  const graphHeight = svgHeight - padTop - padBottom;

  const getX = (index: number) => padLeft + (index / (allPoints.length - 1)) * graphWidth;
  const getY = (val: number) => padTop + graphHeight - (val / (maxVal * 1.15)) * graphHeight;

  // Construccion del trazo historico
  const histCoords = historicalWeeks.map((h, i) => ({ x: getX(i), y: getY(h.actualUnits) }));
  const histPathD = histCoords.reduce((acc, pt, i) => `${acc} ${i === 0 ? 'M' : 'L'} ${pt.x} ${pt.y}`, '');

  // Union entre el ultimo punto historico y el primer pronostico
  const lastHist = histCoords[histCoords.length - 1];
  const forecastCoords = forecastWeeks.map((f, i) => ({
    x: getX(historicalWeeks.length + i),
    y: getY(f.predictedUnits),
    yUpper: getY(f.confidenceUpper),
    yLower: getY(f.confidenceLower),
  }));

  const fullForecastCoords = [lastHist, ...forecastCoords.map((c) => ({ x: c.x, y: c.y }))];
  const forecastPathD = fullForecastCoords.reduce((acc, pt, i) => `${acc} ${i === 0 ? 'M' : 'L'} ${pt.x} ${pt.y}`, '');

  // Poligono del intervalo de confianza del 95%
  const confidencePolygonD = `
    M ${lastHist.x} ${lastHist.y}
    ${forecastCoords.map((c) => `L ${c.x} ${c.yUpper}`).join(' ')}
    ${[...forecastCoords].reverse().map((c) => `L ${c.x} ${c.yLower}`).join(' ')}
    Z
  `;

  // Conteo de alertas de reabastecimiento
  const criticosCount = replenishmentAlerts.filter((a) => a.urgencia === 'CRITICO').length;
  const recomendadosCount = replenishmentAlerts.filter((a) => a.urgencia === 'RECOMENDADO').length;
  const optimosCount = replenishmentAlerts.filter((a) => a.urgencia === 'OPTIMO').length;
  const sobrestockCount = replenishmentAlerts.filter((a) => a.urgencia === 'SOBRESTOCK').length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', color: '#1C1510' }}>
      {/* 1. CABECERA TECNICA Y SELECTOR DE SUCURSAL */}
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
            <BrainCircuit size={22} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700, color: '#1C1510' }}>
                Modelo Supervisado: Red Neuronal MLP de Pronóstico de Demanda
              </h3>
              <span
                style={{
                  fontSize: '0.68rem',
                  fontWeight: 700,
                  padding: '0.2rem 0.55rem',
                  borderRadius: '12px',
                  backgroundColor: '#EFF6FF',
                  color: '#1D4ED8',
                  border: '1px solid #BFDBFE',
                  letterSpacing: '0.3px',
                }}
              >
                BACKPROPAGATION + ReLU
              </span>
            </div>
            <p style={{ margin: '0.25rem 0 0', fontSize: '0.8rem', color: '#736B63' }}>
              Inferencia de ventas semanales a 4 semanas, proyecciones estocásticas con IC 95% y abastecimiento preventivo.
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
          {branches.length > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <Building2 size={15} style={{ color: '#8B5E34' }} />
              <select
                value={selectedBranchId ?? ''}
                onChange={(e) => setSelectedBranchId(e.target.value ? Number(e.target.value) : undefined)}
                style={{
                  padding: '0.4rem 0.75rem',
                  borderRadius: '8px',
                  border: '1px solid #D1C9BF',
                  backgroundColor: '#FAF8F5',
                  fontSize: '0.82rem',
                  color: '#1C1510',
                  fontWeight: 500,
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

          <button
            onClick={() => loadData(selectedBranchId)}
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
            <RefreshCw size={13} className={loading ? 'spin' : ''} />
            <span>Re-entrenar Red</span>
          </button>
        </div>
      </div>

      {/* 2. BARRA DE MÉTRICAS MATEMÁTICAS DEL MODELO */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: '0.85rem',
        }}
      >
        <div style={{ backgroundColor: '#FFFFFF', padding: '0.9rem 1.1rem', borderRadius: '10px', border: '1px solid #EAE6DF' }}>
          <div style={{ fontSize: '0.72rem', color: '#736B63', fontWeight: 600, textTransform: 'uppercase' }}>Precisión R² Score</div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.4rem', marginTop: '0.25rem' }}>
            <span style={{ fontSize: '1.4rem', fontWeight: 700, color: '#047857' }}>
              {(modelMetrics.r2Score * 100).toFixed(1)}%
            </span>
            <span style={{ fontSize: '0.7rem', color: '#059669', fontWeight: 600 }}>Alta correlación</span>
          </div>
          <div style={{ fontSize: '0.72rem', color: '#A1978E', marginTop: '0.2rem' }}>Coeficiente de Determinación</div>
        </div>

        <div style={{ backgroundColor: '#FFFFFF', padding: '0.9rem 1.1rem', borderRadius: '10px', border: '1px solid #EAE6DF' }}>
          <div style={{ fontSize: '0.72rem', color: '#736B63', fontWeight: 600, textTransform: 'uppercase' }}>Error Cuadrático Medio (MSE)</div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.4rem', marginTop: '0.25rem' }}>
            <span style={{ fontSize: '1.4rem', fontWeight: 700, color: '#1C1510' }}>
              {modelMetrics.mseLoss.toFixed(4)}
            </span>
          </div>
          <div style={{ fontSize: '0.72rem', color: '#A1978E', marginTop: '0.2rem' }}>Pérdida de entrenamiento</div>
        </div>

        <div style={{ backgroundColor: '#FFFFFF', padding: '0.9rem 1.1rem', borderRadius: '10px', border: '1px solid #EAE6DF' }}>
          <div style={{ fontSize: '0.72rem', color: '#736B63', fontWeight: 600, textTransform: 'uppercase' }}>Desviación RMSE</div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.4rem', marginTop: '0.25rem' }}>
            <span style={{ fontSize: '1.4rem', fontWeight: 700, color: '#1C1510' }}>
              ±{modelMetrics.rmse.toFixed(1)} u.
            </span>
          </div>
          <div style={{ fontSize: '0.72rem', color: '#A1978E', marginTop: '0.2rem' }}>Error medio por semana</div>
        </div>

        <div style={{ backgroundColor: '#FFFFFF', padding: '0.9rem 1.1rem', borderRadius: '10px', border: '1px solid #EAE6DF' }}>
          <div style={{ fontSize: '0.72rem', color: '#736B63', fontWeight: 600, textTransform: 'uppercase' }}>Topología Neuronal</div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.4rem', marginTop: '0.25rem' }}>
            <span style={{ fontSize: '1.1rem', fontWeight: 700, color: '#1C1510' }}>
              3 → 6 → 1
            </span>
            <span style={{ fontSize: '0.72rem', color: '#736B63' }}>MLP ReLU</span>
          </div>
          <div style={{ fontSize: '0.72rem', color: '#A1978E', marginTop: '0.2rem' }}>
            {modelMetrics.epochsTrained} épocas · {modelMetrics.trainingSamples} registros
          </div>
        </div>
      </div>

      {/* 3. GRÁFICO SVG NATIVO: HISTÓRICO REAL VS PREDICCIÓN CON BANDA DE CONFIANZA */}
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
              Trayectoria de Demanda: 8 Semanas Históricas vs. 4 Semanas de Pronóstico Neuronal
            </h4>
            <p style={{ margin: '0.2rem 0 0', fontSize: '0.78rem', color: '#736B63' }}>
              Área azul difuminada representa el intervalo de confianza estocástico del 95% (±1.96 σ).
            </p>
          </div>

          {/* Leyenda interactiva */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', fontSize: '0.75rem', fontWeight: 600 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <span style={{ width: '12px', height: '3px', backgroundColor: '#8B5E34', borderRadius: '2px' }} />
              <span style={{ color: '#5C4033' }}>Histórico Real</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <span style={{ width: '12px', height: '0', borderTop: '2px dashed #2563EB' }} />
              <span style={{ color: '#1D4ED8' }}>Inferencia MLP (Futuro)</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <span style={{ width: '12px', height: '10px', backgroundColor: '#DBEAFE', border: '1px solid #93C5FD', borderRadius: '2px' }} />
              <span style={{ color: '#1E40AF' }}>Banda Confianza 95%</span>
            </div>
          </div>
        </div>

        {/* Lienzo SVG */}
        <div style={{ width: '100%', overflowX: 'auto' }}>
          <svg
            viewBox={`0 0 ${svgWidth} ${svgHeight}`}
            style={{ width: '100%', minWidth: '680px', height: 'auto', display: 'block' }}
          >
            <defs>
              <linearGradient id="confidenceGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#3B82F6" stopOpacity="0.25" />
                <stop offset="100%" stopColor="#3B82F6" stopOpacity="0.06" />
              </linearGradient>
            </defs>

            {/* Líneas de cuadrícula horizontal */}
            {[0, 0.25, 0.5, 0.75, 1].map((pct, idx) => {
              const yVal = padTop + graphHeight * (1 - pct);
              const unitVal = Math.round(maxVal * 1.15 * pct);
              return (
                <g key={idx}>
                  <line
                    x1={padLeft}
                    y1={yVal}
                    x2={svgWidth - padRight}
                    y2={yVal}
                    stroke="#F1EFEA"
                    strokeWidth="1"
                    strokeDasharray={pct === 0 ? 'none' : '3,3'}
                  />
                  <text
                    x={padLeft - 8}
                    y={yVal + 3}
                    textAnchor="end"
                    fontSize="10"
                    fill="#A1978E"
                    fontFamily="inherit"
                  >
                    {unitVal} u.
                  </text>
                </g>
              );
            })}

            {/* Separador vertical: Histórico | Pronóstico */}
            <line
              x1={lastHist.x}
              y1={padTop - 10}
              x2={lastHist.x}
              y2={padTop + graphHeight + 10}
              stroke="#D1C9BF"
              strokeWidth="1.5"
              strokeDasharray="4,4"
            />
            <text
              x={lastHist.x - 6}
              y={padTop + 14}
              textAnchor="end"
              fontSize="9"
              fontWeight="600"
              fill="#8B5E34"
            >
              Cierre Histórico
            </text>
            <text
              x={lastHist.x + 6}
              y={padTop + 14}
              textAnchor="start"
              fontSize="9"
              fontWeight="700"
              fill="#2563EB"
            >
              Proyección IA →
            </text>

            {/* Polígono de Banda de Confianza 95% */}
            <path d={confidencePolygonD} fill="url(#confidenceGrad)" stroke="#BFDBFE" strokeWidth="1" />

            {/* Trazo Histórico Real */}
            <path d={histPathD} fill="none" stroke="#8B5E34" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />

            {/* Puntos Históricos */}
            {histCoords.map((pt, i) => {
              const isHovered = hoveredIndex === i;
              const h = historicalWeeks[i];
              return (
                <g key={`h-${i}`}>
                  <circle
                    cx={pt.x}
                    cy={pt.y}
                    r={isHovered ? 6 : 4}
                    fill="#FFFFFF"
                    stroke="#8B5E34"
                    strokeWidth="2.5"
                    style={{ cursor: 'pointer', transition: 'all 0.15s ease' }}
                    onMouseEnter={() => setHoveredIndex(i)}
                    onMouseLeave={() => setHoveredIndex(null)}
                  />
                  <text
                    x={pt.x}
                    y={pt.y - 8}
                    textAnchor="middle"
                    fontSize="10"
                    fontWeight="700"
                    fill="#5C4033"
                  >
                    {h.actualUnits}
                  </text>
                  <text
                    x={pt.x}
                    y={padTop + graphHeight + 20}
                    textAnchor="middle"
                    fontSize="10"
                    fill="#736B63"
                  >
                    {h.weekLabel}
                  </text>
                </g>
              );
            })}

            {/* Trazo Pronóstico Neuronal */}
            <path
              d={forecastPathD}
              fill="none"
              stroke="#2563EB"
              strokeWidth="2.5"
              strokeDasharray="5,4"
              strokeLinecap="round"
              strokeLinejoin="round"
            />

            {/* Puntos de Pronóstico Neuronal (Diamantes) */}
            {forecastCoords.map((c, i) => {
              const globalIdx = historicalWeeks.length + i;
              const isHovered = hoveredIndex === globalIdx;
              const f = forecastWeeks[i];
              return (
                <g key={`f-${i}`}>
                  {/* Marcadores de intervalo superior e inferior */}
                  <line x1={c.x - 3} y1={c.yUpper} x2={c.x + 3} y2={c.yUpper} stroke="#93C5FD" strokeWidth="1.5" />
                  <line x1={c.x - 3} y1={c.yLower} x2={c.x + 3} y2={c.yLower} stroke="#93C5FD" strokeWidth="1.5" />
                  <line x1={c.x} y1={c.yUpper} x2={c.x} y2={c.yLower} stroke="#93C5FD" strokeWidth="1" strokeDasharray="2,2" />

                  {/* Diamante central de la prediccion */}
                  <polygon
                    points={`${c.x},${c.y - (isHovered ? 7 : 5)} ${c.x + (isHovered ? 7 : 5)},${c.y} ${c.x},${c.y + (isHovered ? 7 : 5)} ${c.x - (isHovered ? 7 : 5)},${c.y}`}
                    fill="#FFFFFF"
                    stroke="#2563EB"
                    strokeWidth="2.5"
                    style={{ cursor: 'pointer', transition: 'all 0.15s ease' }}
                    onMouseEnter={() => setHoveredIndex(globalIdx)}
                    onMouseLeave={() => setHoveredIndex(null)}
                  />
                  <text
                    x={c.x}
                    y={c.y - 10}
                    textAnchor="middle"
                    fontSize="11"
                    fontWeight="700"
                    fill="#1D4ED8"
                  >
                    {f.predictedUnits} u.
                  </text>
                  <text
                    x={c.x}
                    y={padTop + graphHeight + 20}
                    textAnchor="middle"
                    fontSize="10"
                    fontWeight="600"
                    fill="#1D4ED8"
                  >
                    {f.weekLabel}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>
      </div>

      {/* 4. MATRIZ PRESCRIPTIVA DE REABASTECIMIENTO CRÍTICO */}
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
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
              <Package size={17} style={{ color: '#8B5E34' }} />
              <h4 style={{ margin: 0, fontSize: '0.98rem', fontWeight: 700, color: '#1C1510' }}>
                Matriz Prescriptiva de Reorden y Cobertura de Stock por Sucursal
              </h4>
            </div>
            <p style={{ margin: '0.2rem 0 0', fontSize: '0.78rem', color: '#736B63' }}>
              Calculada dinámicamente mediante el consumo proyectado por la red neuronal sobre el inventario físico actual.
            </p>
          </div>

          {/* Badges de Conteo de Urgencia */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
            <span
              style={{
                fontSize: '0.73rem',
                fontWeight: 700,
                padding: '0.25rem 0.6rem',
                borderRadius: '6px',
                backgroundColor: '#FEF2F2',
                color: '#DC2626',
                border: '1px solid #FECACA',
              }}
            >
              {criticosCount} Críticos (≤ 7 días)
            </span>
            <span
              style={{
                fontSize: '0.73rem',
                fontWeight: 700,
                padding: '0.25rem 0.6rem',
                borderRadius: '6px',
                backgroundColor: '#FFFBEB',
                color: '#D97706',
                border: '1px solid #FDE68A',
              }}
            >
              {recomendadosCount} Recomendados (8-14 días)
            </span>
            <span
              style={{
                fontSize: '0.73rem',
                fontWeight: 700,
                padding: '0.25rem 0.6rem',
                borderRadius: '6px',
                backgroundColor: '#ECFDF5',
                color: '#059669',
                border: '1px solid #A7F3D0',
              }}
            >
              {optimosCount} Óptimos
            </span>
            <span
              style={{
                fontSize: '0.73rem',
                fontWeight: 700,
                padding: '0.25rem 0.6rem',
                borderRadius: '6px',
                backgroundColor: '#EFF6FF',
                color: '#2563EB',
                border: '1px solid #BFDBFE',
              }}
            >
              {sobrestockCount} Sobrestock
            </span>
          </div>
        </div>

        {/* Tabla de Reorden */}
        <div style={{ overflowX: 'auto', border: '1px solid #EAE6DF', borderRadius: '8px' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem', textAlign: 'left' }}>
            <thead>
              <tr style={{ backgroundColor: '#FAF8F5', borderBottom: '1px solid #EAE6DF', color: '#5C4033' }}>
                <th style={{ padding: '0.75rem 1rem', fontWeight: 600 }}>Producto & Código SKU</th>
                <th style={{ padding: '0.75rem 1rem', fontWeight: 600 }}>Sucursal</th>
                <th style={{ padding: '0.75rem 1rem', fontWeight: 600, textAlign: 'right' }}>Stock Físico</th>
                <th style={{ padding: '0.75rem 1rem', fontWeight: 600, textAlign: 'right' }}>Consumo Diario Est.</th>
                <th style={{ padding: '0.75rem 1rem', fontWeight: 600, textAlign: 'right' }}>Cobertura</th>
                <th style={{ padding: '0.75rem 1rem', fontWeight: 600, textAlign: 'center' }}>Urgencia</th>
                <th style={{ padding: '0.75rem 1rem', fontWeight: 600, textAlign: 'right' }}>Sugerencia Reorden</th>
              </tr>
            </thead>
            <tbody>
              {replenishmentAlerts.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ padding: '2rem', textAlign: 'center', color: '#736B63' }}>
                    No hay alertas de inventario registradas para esta selección.
                  </td>
                </tr>
              ) : (
                replenishmentAlerts.map((row, idx) => {
                  let badgeBg = '#ECFDF5';
                  let badgeColor = '#059669';
                  let badgeBorder = '#A7F3D0';
                  if (row.urgencia === 'CRITICO') {
                    badgeBg = '#FEF2F2';
                    badgeColor = '#DC2626';
                    badgeBorder = '#FECACA';
                  } else if (row.urgencia === 'RECOMENDADO') {
                    badgeBg = '#FFFBEB';
                    badgeColor = '#D97706';
                    badgeBorder = '#FDE68A';
                  } else if (row.urgencia === 'SOBRESTOCK') {
                    badgeBg = '#EFF6FF';
                    badgeColor = '#2563EB';
                    badgeBorder = '#BFDBFE';
                  }

                  return (
                    <tr
                      key={`${row.id_producto}-${idx}`}
                      style={{
                        borderBottom: '1px solid #F1EFEA',
                        backgroundColor: idx % 2 === 0 ? '#FFFFFF' : '#FDFCFB',
                      }}
                    >
                      <td style={{ padding: '0.75rem 1rem' }}>
                        <div style={{ fontWeight: 600, color: '#1C1510' }}>{row.productoNombre}</div>
                        <div style={{ fontSize: '0.72rem', color: '#8B5E34', fontFamily: 'monospace' }}>SKU: {row.sku}</div>
                      </td>
                      <td style={{ padding: '0.75rem 1rem', color: '#5C4033' }}>{row.sucursalNombre}</td>
                      <td style={{ padding: '0.75rem 1rem', textAlign: 'right', fontWeight: 600, color: '#1C1510' }}>
                        {row.stockActual} u.
                      </td>
                      <td style={{ padding: '0.75rem 1rem', textAlign: 'right', color: '#736B63' }}>
                        {row.demandaDiariaEstimada.toFixed(1)} u./día
                      </td>
                      <td style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>
                        <span style={{ fontWeight: 700, color: row.diasCobertura <= 7 ? '#DC2626' : '#1C1510' }}>
                          {row.diasCobertura} días
                        </span>
                      </td>
                      <td style={{ padding: '0.75rem 1rem', textAlign: 'center' }}>
                        <span
                          style={{
                            display: 'inline-block',
                            padding: '0.2rem 0.55rem',
                            borderRadius: '4px',
                            fontSize: '0.72rem',
                            fontWeight: 700,
                            backgroundColor: badgeBg,
                            color: badgeColor,
                            border: `1px solid ${badgeBorder}`,
                          }}
                        >
                          {row.urgencia}
                        </span>
                      </td>
                      <td style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>
                        {row.unidadesSugeridasReorden > 0 ? (
                          <span
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '0.25rem',
                              fontWeight: 700,
                              color: '#B45309',
                              backgroundColor: '#FEF3C7',
                              padding: '0.2rem 0.5rem',
                              borderRadius: '4px',
                            }}
                          >
                            <ArrowUpRight size={13} />
                            +{row.unidadesSugeridasReorden} u.
                          </span>
                        ) : (
                          <span style={{ color: '#059669', fontWeight: 600 }}>Stock cubierto</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Consejo Prescriptivo Automático */}
        <div
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: '0.75rem',
            padding: '0.9rem 1.1rem',
            backgroundColor: '#F7F3EE',
            borderRadius: '8px',
            border: '1px solid #E4D8CE',
            fontSize: '0.8rem',
            color: '#5C4033',
            lineHeight: 1.45,
          }}
        >
          <ShieldCheck size={18} style={{ color: '#8B5E34', flexShrink: 0, marginTop: '2px' }} />
          <div>
            <strong style={{ color: '#1C1510' }}>Regla de Decisión Operativa:</strong> Para garantizar un nivel de
            servicio superior al 95% y evitar ventas perdidas, los artículos con cobertura menor o igual a 7 días
            deben emitir una orden de compra o transferencia inter-sucursal inmediata hacia el proveedor registrado.
          </div>
        </div>
      </div>
    </div>
  );
};
