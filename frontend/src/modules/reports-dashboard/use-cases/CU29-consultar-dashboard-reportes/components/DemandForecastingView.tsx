/**
 * @file DemandForecastingView.tsx
 * @caso-de-uso CU29 — Consultar Dashboard (Business Intelligence & Machine Learning)
 * @subsistema Inteligencia de Negocios y Reportes
 * @capa Presentacion (React)
 * @descripcion Vista de Toma de Decisiones basada en Modelo Supervisado: Red Neuronal
 * Artificial (MLP) entrenada con propagacion hacia atras (Backpropagation) y activacion ReLU.
 * Proyecta la demanda de ventas para las proximas 4 semanas con intervalos de confianza
 * del 95% y genera la Matriz Prescriptiva de Reabastecimiento por Sucursal.
 * Diseno ejecutivo optimizado para decision rapida y libre de saturacion visual.
 */

import React, { useState, useEffect } from 'react';
import {
  BrainCircuit,
  AlertTriangle,
  Package,
  RefreshCw,
  Building2,
  ArrowUpRight,
} from 'lucide-react';
import { reportsService } from '../services/reports.service';
import type { DemandPredictionResult } from '../types/reports.types';
import { ExecutiveVerdictCard } from './ExecutiveVerdictCard';

interface DemandForecastingViewProps {
  branches?: { id_sucursal: number; nombre: string }[];
}

export const DemandForecastingView: React.FC<DemandForecastingViewProps> = ({ branches = [] }) => {
  const [selectedBranchId, setSelectedBranchId] = useState<number | undefined>(undefined);
  const [loading, setLoading] = useState<boolean>(true);
  const [data, setData] = useState<DemandPredictionResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [urgencyFilter, setUrgencyFilter] = useState<'ALL' | 'CRITICO' | 'RECOMENDADO'>('ALL');

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
      <div style={{ padding: '3.5rem 2rem', textAlign: 'center', backgroundColor: '#FFFFFF', borderRadius: '12px', border: '1px solid #EAE6DF' }}>
        <RefreshCw size={28} className="spin" style={{ color: '#8B5E34', marginBottom: '0.75rem', animation: 'spin 1s linear infinite' }} />
        <h4 style={{ margin: '0 0 0.4rem', color: '#1C1510', fontSize: '1rem', fontWeight: 600 }}>Entrenando Red Neuronal en Tiempo Real...</h4>
        <p style={{ margin: 0, color: '#736B63', fontSize: '0.84rem' }}>
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

  const { executiveVerdict, historicalWeeks, forecastWeeks, modelMetrics, replenishmentAlerts } = data;

  // Filtrado de la tabla según urgencia para evitar saturación de filas innecesarias
  const filteredAlerts = replenishmentAlerts.filter((row) => {
    if (urgencyFilter === 'CRITICO') return row.urgencia === 'CRITICO';
    if (urgencyFilter === 'RECOMENDADO') return row.urgencia === 'RECOMENDADO' || row.urgencia === 'CRITICO';
    return true;
  });

  // Conteo de alertas
  const criticosCount = replenishmentAlerts.filter((a) => a.urgencia === 'CRITICO').length;
  const recomendadosCount = replenishmentAlerts.filter((a) => a.urgencia === 'RECOMENDADO').length;

  // Escalas del Gráfico SVG
  const allPoints = [
    ...historicalWeeks.map((h) => ({ label: h.weekLabel, actual: h.actualUnits, predicted: null, lower: null, upper: null })),
    ...forecastWeeks.map((f) => ({ label: f.weekLabel, actual: null, predicted: f.predictedUnits, lower: f.confidenceLower, upper: f.confidenceUpper })),
  ];

  const maxVal = Math.max(
    ...historicalWeeks.map((h) => h.actualUnits),
    ...forecastWeeks.map((f) => f.confidenceUpper),
    10,
  );

  const svgWidth = 840;
  const svgHeight = 230;
  const padLeft = 50;
  const padRight = 30;
  const padTop = 25;
  const padBottom = 35;
  const graphWidth = svgWidth - padLeft - padRight;
  const graphHeight = svgHeight - padTop - padBottom;

  const getX = (index: number) => padLeft + (index / (allPoints.length - 1)) * graphWidth;
  const getY = (val: number) => padTop + graphHeight - (val / (maxVal * 1.15)) * graphHeight;

  const histCoords = historicalWeeks.map((h, i) => ({ x: getX(i), y: getY(h.actualUnits) }));
  const histPathD = histCoords.reduce((acc, pt, i) => `${acc} ${i === 0 ? 'M' : 'L'} ${pt.x} ${pt.y}`, '');

  const lastHist = histCoords[histCoords.length - 1];
  const forecastCoords = forecastWeeks.map((f, i) => ({
    x: getX(historicalWeeks.length + i),
    y: getY(f.predictedUnits),
    yUpper: getY(f.confidenceUpper),
    yLower: getY(f.confidenceLower),
  }));

  const fullForecastCoords = [lastHist, ...forecastCoords.map((c) => ({ x: c.x, y: c.y }))];
  const forecastPathD = fullForecastCoords.reduce((acc, pt, i) => `${acc} ${i === 0 ? 'M' : 'L'} ${pt.x} ${pt.y}`, '');

  const confidencePolygonD = `
    M ${lastHist.x} ${lastHist.y}
    ${forecastCoords.map((c) => `L ${c.x} ${c.yUpper}`).join(' ')}
    ${[...forecastCoords].reverse().map((c) => `L ${c.x} ${c.yLower}`).join(' ')}
    Z
  `;

  // Detalle técnico que se muestra solo si el usuario despliega la opción (evita saturar)
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
        <div style={{ fontSize: '0.68rem', color: '#736B63', fontWeight: 600 }}>R² SCORE</div>
        <div style={{ fontSize: '1.15rem', fontWeight: 700, color: '#047857' }}>{(modelMetrics.r2Score * 100).toFixed(1)}%</div>
      </div>
      <div>
        <div style={{ fontSize: '0.68rem', color: '#736B63', fontWeight: 600 }}>ERROR MSE</div>
        <div style={{ fontSize: '1.15rem', fontWeight: 700, color: '#1C1510' }}>{modelMetrics.mseLoss.toFixed(4)}</div>
      </div>
      <div>
        <div style={{ fontSize: '0.68rem', color: '#736B63', fontWeight: 600 }}>DESVIACIÓN RMSE</div>
        <div style={{ fontSize: '1.15rem', fontWeight: 700, color: '#1C1510' }}>±{modelMetrics.rmse.toFixed(1)} u.</div>
      </div>
      <div>
        <div style={{ fontSize: '0.68rem', color: '#736B63', fontWeight: 600 }}>CONFIGURACIÓN</div>
        <div style={{ fontSize: '0.82rem', fontWeight: 600, color: '#1C1510' }}>
          MLP ReLU ({modelMetrics.epochsTrained} épocas, {modelMetrics.trainingSamples} registros)
        </div>
      </div>
    </div>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.15rem', color: '#1C1510' }}>
      {/* 1. VEREDICTO EJECUTIVO DE DIAGNÓSTICO (INTERPRETACIÓN CLARA PARA EL ADMIN) */}
      {executiveVerdict && (
        <ExecutiveVerdictCard
          verdict={executiveVerdict}
          modelTechDetails={techDetails}
        />
      )}

      {/* 2. BARRA DE CONTROL COMPACTA: SUCURSAL Y ACCIONES */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '0.75rem',
          backgroundColor: '#FFFFFF',
          padding: '0.75rem 1.15rem',
          borderRadius: '10px',
          border: '1px solid #EAE6DF',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <BrainCircuit size={17} style={{ color: '#8B5E34' }} />
          <span style={{ fontSize: '0.86rem', fontWeight: 700, color: '#1C1510' }}>
            Pronóstico de Demanda a 4 Semanas (MLP Supervisado)
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
          {branches.length > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <Building2 size={14} style={{ color: '#8B5E34' }} />
              <select
                value={selectedBranchId ?? ''}
                onChange={(e) => setSelectedBranchId(e.target.value ? Number(e.target.value) : undefined)}
                style={{
                  padding: '0.35rem 0.65rem',
                  borderRadius: '6px',
                  border: '1px solid #D1C9BF',
                  backgroundColor: '#FAF8F5',
                  fontSize: '0.78rem',
                  color: '#1C1510',
                  fontWeight: 500,
                  outline: 'none',
                }}
              >
                <option value="">Consolidado Nacional (Todas)</option>
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
            <RefreshCw size={12} className={loading ? 'spin' : ''} />
            <span>Recalcular</span>
          </button>
        </div>
      </div>

      {/* 3. GRÁFICO SVG NATIVO LIMPIO (TRAYECTORIA HISTÓRICA VS PRONÓSTICO) */}
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
            <h4 style={{ margin: 0, fontSize: '0.92rem', fontWeight: 700, color: '#1C1510' }}>
              Tendencia de Ventas: 8 Semanas Previas vs. 4 Semanas de Pronóstico
            </h4>
            <p style={{ margin: '0.15rem 0 0', fontSize: '0.76rem', color: '#736B63' }}>
              La franja azul representa el rango estadístico esperado con un 95% de confianza.
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', fontSize: '0.74rem', fontWeight: 600 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <span style={{ width: '12px', height: '3px', backgroundColor: '#8B5E34', borderRadius: '2px' }} />
              <span style={{ color: '#5C4033' }}>Histórico Real</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <span style={{ width: '12px', height: '0', borderTop: '2px dashed #2563EB' }} />
              <span style={{ color: '#1D4ED8' }}>Inferencia Futura</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <span style={{ width: '10px', height: '10px', backgroundColor: '#DBEAFE', border: '1px solid #93C5FD', borderRadius: '2px' }} />
              <span style={{ color: '#1E40AF' }}>Rango 95%</span>
            </div>
          </div>
        </div>

        <div style={{ width: '100%', overflowX: 'auto' }}>
          <svg
            viewBox={`0 0 ${svgWidth} ${svgHeight}`}
            style={{ width: '100%', minWidth: '660px', height: 'auto', display: 'block' }}
          >
            <defs>
              <linearGradient id="cleanConfidenceGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#3B82F6" stopOpacity="0.2" />
                <stop offset="100%" stopColor="#3B82F6" stopOpacity="0.04" />
              </linearGradient>
            </defs>

            {/* Cuadrícula limpia con 3 líneas de referencia */}
            {[0, 0.5, 1].map((pct, idx) => {
              const yVal = padTop + graphHeight * (1 - pct);
              const unitVal = Math.round(maxVal * 1.15 * pct);
              return (
                <g key={idx}>
                  <line
                    x1={padLeft}
                    y1={yVal}
                    x2={svgWidth - padRight}
                    y2={yVal}
                    stroke="#F3F0EA"
                    strokeWidth="1"
                    strokeDasharray={pct === 0 ? 'none' : '3,3'}
                  />
                  <text x={padLeft - 8} y={yVal + 3} textAnchor="end" fontSize="10" fill="#A1978E">
                    {unitVal} u.
                  </text>
                </g>
              );
            })}

            {/* Separador de Histórico a Pronóstico */}
            <line
              x1={lastHist.x}
              y1={padTop}
              x2={lastHist.x}
              y2={padTop + graphHeight}
              stroke="#D1C9BF"
              strokeWidth="1.5"
              strokeDasharray="4,4"
            />
            <text x={lastHist.x + 6} y={padTop + 14} textAnchor="start" fontSize="9" fontWeight="700" fill="#2563EB">
              Futuro →
            </text>

            {/* Polígono de Banda 95% */}
            <path d={confidencePolygonD} fill="url(#cleanConfidenceGrad)" stroke="#BFDBFE" strokeWidth="1" />

            {/* Línea Histórica */}
            <path d={histPathD} fill="none" stroke="#8B5E34" strokeWidth="2.5" strokeLinecap="round" />

            {/* Puntos Históricos */}
            {histCoords.map((pt, i) => (
              <circle
                key={`h-${i}`}
                cx={pt.x}
                cy={pt.y}
                r={hoveredIndex === i ? 5 : 3.5}
                fill="#FFFFFF"
                stroke="#8B5E34"
                strokeWidth="2"
                onMouseEnter={() => setHoveredIndex(i)}
                onMouseLeave={() => setHoveredIndex(null)}
                style={{ cursor: 'pointer' }}
              />
            ))}

            {/* Línea Pronóstico */}
            <path
              d={forecastPathD}
              fill="none"
              stroke="#2563EB"
              strokeWidth="2.5"
              strokeDasharray="5,4"
              strokeLinecap="round"
            />

            {/* Puntos Pronóstico */}
            {forecastCoords.map((c, i) => {
              const f = forecastWeeks[i];
              return (
                <g key={`f-${i}`}>
                  <circle
                    cx={c.x}
                    cy={c.y}
                    r={5}
                    fill="#FFFFFF"
                    stroke="#2563EB"
                    strokeWidth="2.5"
                    style={{ cursor: 'pointer' }}
                  />
                  <text x={c.x} y={c.y - 9} textAnchor="middle" fontSize="10" fontWeight="700" fill="#1D4ED8">
                    {f.predictedUnits} u.
                  </text>
                  <text x={c.x} y={padTop + graphHeight + 16} textAnchor="middle" fontSize="10" fontWeight="600" fill="#1D4ED8">
                    {f.weekLabel}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>
      </div>

      {/* 4. MATRIZ DE REABASTECIMIENTO ACCIONABLE (CON FILTRO RÁPIDO PARA DECIDIR SIN SATURAR) */}
      <div
        style={{
          backgroundColor: '#FFFFFF',
          borderRadius: '12px',
          border: '1px solid #EAE6DF',
          padding: '1.15rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.85rem',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.65rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <Package size={16} style={{ color: '#8B5E34' }} />
              <h4 style={{ margin: 0, fontSize: '0.94rem', fontWeight: 700, color: '#1C1510' }}>
                Matriz de Abastecimiento Prioritario
              </h4>
            </div>
            <p style={{ margin: '0.15rem 0 0', fontSize: '0.76rem', color: '#736B63' }}>
              Enfócate en los productos con menos días de cobertura para evitar perder ventas.
            </p>
          </div>

          {/* Filtros rápidos: Solo lo necesario para tomar la decisión */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            <span style={{ fontSize: '0.74rem', color: '#736B63', marginRight: '0.2rem' }}>Filtrar por:</span>
            <button
              type="button"
              onClick={() => setUrgencyFilter('CRITICO')}
              style={{
                padding: '0.25rem 0.6rem',
                borderRadius: '6px',
                border: urgencyFilter === 'CRITICO' ? '1px solid #DC2626' : '1px solid #EAE6DF',
                backgroundColor: urgencyFilter === 'CRITICO' ? '#FEF2F2' : '#FAF8F5',
                color: urgencyFilter === 'CRITICO' ? '#DC2626' : '#5C4033',
                fontSize: '0.74rem',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              Solo Críticos ({criticosCount})
            </button>

            <button
              type="button"
              onClick={() => setUrgencyFilter('RECOMENDADO')}
              style={{
                padding: '0.25rem 0.6rem',
                borderRadius: '6px',
                border: urgencyFilter === 'RECOMENDADO' ? '1px solid #D97706' : '1px solid #EAE6DF',
                backgroundColor: urgencyFilter === 'RECOMENDADO' ? '#FFFBEB' : '#FAF8F5',
                color: urgencyFilter === 'RECOMENDADO' ? '#D97706' : '#5C4033',
                fontSize: '0.74rem',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              Críticos + Recomendados ({criticosCount + recomendadosCount})
            </button>

            <button
              type="button"
              onClick={() => setUrgencyFilter('ALL')}
              style={{
                padding: '0.25rem 0.6rem',
                borderRadius: '6px',
                border: urgencyFilter === 'ALL' ? '1px solid #8B5E34' : '1px solid #EAE6DF',
                backgroundColor: urgencyFilter === 'ALL' ? '#8B5E34' : '#FAF8F5',
                color: urgencyFilter === 'ALL' ? '#FFFFFF' : '#5C4033',
                fontSize: '0.74rem',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Ver Todos ({replenishmentAlerts.length})
            </button>
          </div>
        </div>

        {/* Tabla Limpia y Enfocada en la Decisión */}
        <div style={{ overflowX: 'auto', border: '1px solid #EAE6DF', borderRadius: '8px' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.81rem', textAlign: 'left' }}>
            <thead>
              <tr style={{ backgroundColor: '#FAF8F5', borderBottom: '1px solid #EAE6DF', color: '#5C4033' }}>
                <th style={{ padding: '0.65rem 0.9rem', fontWeight: 600 }}>Prenda</th>
                <th style={{ padding: '0.65rem 0.9rem', fontWeight: 600 }}>Sucursal</th>
                <th style={{ padding: '0.65rem 0.9rem', fontWeight: 600, textAlign: 'right' }}>Stock Físico</th>
                <th style={{ padding: '0.65rem 0.9rem', fontWeight: 600, textAlign: 'right' }}>Cobertura</th>
                <th style={{ padding: '0.65rem 0.9rem', fontWeight: 600, textAlign: 'center' }}>Estado</th>
                <th style={{ padding: '0.65rem 0.9rem', fontWeight: 600, textAlign: 'right' }}>Acción a Ejecutar</th>
              </tr>
            </thead>
            <tbody>
              {filteredAlerts.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ padding: '2rem', textAlign: 'center', color: '#059669', fontWeight: 600 }}>
                    Excelente: No hay artículos en estado crítico para el filtro seleccionado.
                  </td>
                </tr>
              ) : (
                filteredAlerts.map((row, idx) => {
                  const isCrit = row.urgencia === 'CRITICO';
                  const isRec = row.urgencia === 'RECOMENDADO';

                  return (
                    <tr
                      key={`${row.id_producto}-${idx}`}
                      style={{
                        borderBottom: '1px solid #F3F0EA',
                        backgroundColor: idx % 2 === 0 ? '#FFFFFF' : '#FDFCFB',
                      }}
                    >
                      <td style={{ padding: '0.65rem 0.9rem' }}>
                        <div style={{ fontWeight: 600, color: '#1C1510' }}>{row.productoNombre}</div>
                        <div style={{ fontSize: '0.71rem', color: '#8B5E34' }}>{row.sku}</div>
                      </td>
                      <td style={{ padding: '0.65rem 0.9rem', color: '#5C4033' }}>{row.sucursalNombre}</td>
                      <td style={{ padding: '0.65rem 0.9rem', textAlign: 'right', fontWeight: 700, color: '#1C1510' }}>
                        {row.stockActual} u.
                      </td>
                      <td style={{ padding: '0.65rem 0.9rem', textAlign: 'right' }}>
                        <span style={{ fontWeight: 700, color: isCrit ? '#DC2626' : isRec ? '#D97706' : '#059669' }}>
                          {row.diasCobertura} días
                        </span>
                      </td>
                      <td style={{ padding: '0.65rem 0.9rem', textAlign: 'center' }}>
                        <span
                          style={{
                            display: 'inline-block',
                            padding: '0.18rem 0.5rem',
                            borderRadius: '4px',
                            fontSize: '0.71rem',
                            fontWeight: 700,
                            backgroundColor: isCrit ? '#FEF2F2' : isRec ? '#FFFBEB' : '#ECFDF5',
                            color: isCrit ? '#DC2626' : isRec ? '#D97706' : '#059669',
                            border: `1px solid ${isCrit ? '#FECACA' : isRec ? '#FDE68A' : '#A7F3D0'}`,
                          }}
                        >
                          {row.urgencia}
                        </span>
                      </td>
                      <td style={{ padding: '0.65rem 0.9rem', textAlign: 'right' }}>
                        {row.unidadesSugeridasReorden > 0 ? (
                          <span
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '0.2rem',
                              fontWeight: 700,
                              color: '#92400E',
                              backgroundColor: '#FEF3C7',
                              padding: '0.2rem 0.5rem',
                              borderRadius: '4px',
                              fontSize: '0.74rem',
                            }}
                          >
                            <ArrowUpRight size={13} />
                            Pedir +{row.unidadesSugeridasReorden} u.
                          </span>
                        ) : (
                          <span style={{ color: '#059669', fontSize: '0.75rem', fontWeight: 600 }}>Stock cubierto</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
