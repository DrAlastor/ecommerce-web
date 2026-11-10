/**
 * @file RfmSegmentationView.tsx
 * @caso-de-uso CU29 — Consultar Dashboard (Business Intelligence & Machine Learning)
 * @subsistema Inteligencia de Negocios y Reportes
 * @capa Presentacion (React)
 * @descripcion Vista de Toma de Decisiones basada en Modelo No Supervisado: K-Means
 * Clustering (k=4) sobre espacio vectorial RFM (Recencia, Frecuencia, Valor Monetario).
 * Agrupa clientes automaticamente en clusters homogeneos, detecta cuentas de alto valor
 * con riesgo inminente de desercion (Churn) y prescribe campanas comerciales dirigidas.
 * Diseno ejecutivo optimizado para decision rapida y libre de saturacion visual.
 */

import React, { useState, useEffect } from 'react';
import {
  Target,
  AlertCircle,
  PhoneCall,
  Mail,
  Copy,
  CheckCircle2,
  RefreshCw,
  Award,
  Zap,
  UserX,
  ScatterChart,
} from 'lucide-react';
import { reportsService } from '../services/reports.service';
import type { RfmClusterResult } from '../types/reports.types';
import { ExecutiveVerdictCard } from './ExecutiveVerdictCard';

export const RfmSegmentationView: React.FC = () => {
  const [loading, setLoading] = useState<boolean>(true);
  const [data, setData] = useState<RfmClusterResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedClusterId, setSelectedClusterId] = useState<number | null>(null);
  const [copied, setCopied] = useState<boolean>(false);
  const [showScatterPlot, setShowScatterPlot] = useState<boolean>(false);
  const [hoveredClient, setHoveredClient] = useState<any | null>(null);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await reportsService.getRfmClusters();
      setData(res);
    } catch (err: any) {
      setError(err?.message || 'Error al ejecutar clustering K-Means de clientes.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  if (loading && !data) {
    return (
      <div style={{ padding: '3.5rem 2rem', textAlign: 'center', backgroundColor: '#FFFFFF', borderRadius: '12px', border: '1px solid #EAE6DF' }}>
        <RefreshCw size={28} className="spin" style={{ color: '#8B5E34', marginBottom: '0.75rem', animation: 'spin 1s linear infinite' }} />
        <h4 style={{ margin: '0 0 0.4rem', color: '#1C1510', fontSize: '1rem', fontWeight: 600 }}>Ejecutando Agrupamiento K-Means no Supervisado...</h4>
        <p style={{ margin: 0, color: '#736B63', fontSize: '0.84rem' }}>
          Construyendo vectores RFM, normalizando con Min-Max y convergiendo centroides mediante distancia euclidiana.
        </p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center', backgroundColor: '#FEF2F2', borderRadius: '12px', border: '1px solid #FCA5A5', color: '#991B1B' }}>
        <AlertCircle size={24} style={{ marginBottom: '0.5rem' }} />
        <p style={{ margin: '0 0 1rem', fontSize: '0.9rem', fontWeight: 500 }}>{error || 'No se pudo segmentar la base de clientes.'}</p>
        <button
          onClick={loadData}
          style={{ padding: '0.4rem 1rem', backgroundColor: '#991B1B', color: '#FFFFFF', border: 'none', borderRadius: '6px', fontSize: '0.82rem', cursor: 'pointer' }}
        >
          Reintentar Clustering
        </button>
      </div>
    );
  }

  const { executiveVerdict, summary, clusters, clientSegments, churnRiskClients } = data;

  const formatBs = (val: number) =>
    `Bs. ${Number(val || 0).toLocaleString('es-BO', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;

  const handleCopyContacts = () => {
    const text = churnRiskClients
      .map((c) => `${c.nombreCompleto}\t${c.telefono || 'Sin teléfono'}\t${c.email || 'Sin email'}\t${c.diasSinCompra} días\tBs. ${c.gastoHistorico.toFixed(2)}`)
      .join('\n');
    navigator.clipboard.writeText(`Nombre\tTeléfono\tEmail\tInactividad\tGasto Total\n${text}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const getClusterIcon = (clusterId: number) => {
    if (clusterId === 0) return <Award size={15} />;
    if (clusterId === 1) return <Zap size={15} />;
    if (clusterId === 2) return <Target size={15} />;
    return <UserX size={15} />;
  };

  // Escalas para Scatter Plot Opcional
  const maxRecency = Math.max(...clientSegments.map((c) => c.recencyDays), 60);
  const maxMonetary = Math.max(...clientSegments.map((c) => c.monetaryTotal), 500);
  const svgWidth = 840;
  const svgHeight = 260;
  const padLeft = 65;
  const padRight = 30;
  const padTop = 20;
  const padBottom = 40;
  const graphWidth = svgWidth - padLeft - padRight;
  const graphHeight = svgHeight - padTop - padBottom;
  const getScatterX = (recency: number) => padLeft + (recency / (maxRecency * 1.05)) * graphWidth;
  const getScatterY = (monetary: number) => padTop + graphHeight - (monetary / (maxMonetary * 1.1)) * graphHeight;

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
        <div style={{ fontSize: '0.68rem', color: '#736B63', fontWeight: 600 }}>COEFICIENTE SILHOUETTE</div>
        <div style={{ fontSize: '1.15rem', fontWeight: 700, color: '#047857' }}>{summary.silhouetteScore.toFixed(2)} (Alta cohesión)</div>
      </div>
      <div>
        <div style={{ fontSize: '0.68rem', color: '#736B63', fontWeight: 600 }}>INERCIA WSS</div>
        <div style={{ fontSize: '1.15rem', fontWeight: 700, color: '#1C1510' }}>{summary.inertia.toFixed(2)}</div>
      </div>
      <div>
        <div style={{ fontSize: '0.68rem', color: '#736B63', fontWeight: 600 }}>CUENTAS EVALUADAS</div>
        <div style={{ fontSize: '1.15rem', fontWeight: 700, color: '#1C1510' }}>{summary.totalClientsAnalyzed} clientes</div>
      </div>
      <div>
        <div style={{ fontSize: '0.68rem', color: '#736B63', fontWeight: 600 }}>ESPACIO VECTORIAL</div>
        <div style={{ fontSize: '0.82rem', fontWeight: 600, color: '#1C1510' }}>
          Normalización Min-Max ℝ³ (Recencia, Frecuencia, Valor)
        </div>
      </div>
    </div>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.15rem', color: '#1C1510' }}>
      {/* 1. VEREDICTO EJECUTIVO DE RETENCIÓN DE CLIENTES */}
      {executiveVerdict && (
        <ExecutiveVerdictCard
          verdict={executiveVerdict}
          modelTechDetails={techDetails}
        />
      )}

      {/* 2. CABECERA COMPACTA DE ACCIONES */}
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
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
          <Target size={17} style={{ color: '#8B5E34' }} />
          <span style={{ fontSize: '0.86rem', fontWeight: 700, color: '#1C1510' }}>
            Segmentación RFM K-Means (4 Grupos Estratégicos)
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
          <button
            type="button"
            onClick={() => setShowScatterPlot((prev) => !prev)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.35rem',
              padding: '0.35rem 0.75rem',
              borderRadius: '6px',
              border: '1px solid #D1C9BF',
              backgroundColor: showScatterPlot ? '#F3EFEA' : '#FAF8F5',
              color: '#5C4033',
              fontSize: '0.78rem',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            <ScatterChart size={13} />
            <span>{showScatterPlot ? 'Ocultar Mapa 2D' : 'Ver Mapa 2D RFM'}</span>
          </button>

          <button
            onClick={loadData}
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

      {/* 3. LAS 4 TARJETAS DE SEGMENTOS LIMPIAS Y CONCISAS */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))',
          gap: '0.85rem',
        }}
      >
        {clusters.map((c) => {
          const isSelected = selectedClusterId === c.clusterId;
          return (
            <div
              key={c.clusterId}
              onClick={() => setSelectedClusterId(isSelected ? null : c.clusterId)}
              style={{
                backgroundColor: isSelected ? '#FAF8F5' : '#FFFFFF',
                borderRadius: '10px',
                border: isSelected ? `2px solid ${c.color}` : '1px solid #EAE6DF',
                padding: '0.95rem 1.05rem',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
              }}
            >
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: c.color }}>
                    {getClusterIcon(c.clusterId)}
                    <span style={{ fontWeight: 700, fontSize: '0.86rem' }}>{c.label}</span>
                  </div>
                  <span
                    style={{
                      fontSize: '0.74rem',
                      fontWeight: 700,
                      backgroundColor: `${c.color}15`,
                      color: c.color,
                      padding: '0.12rem 0.45rem',
                      borderRadius: '4px',
                    }}
                  >
                    {c.percentage}% ({c.clientCount})
                  </span>
                </div>

                <div style={{ fontSize: '0.75rem', color: '#736B63', margin: '0.45rem 0' }}>
                  Ticket prom: <strong>{formatBs(c.centroid.monetaryTotal)}</strong> · Inactividad: <strong>{Math.round(c.centroid.recencyDays)}d</strong>
                </div>
              </div>

              <div
                style={{
                  fontSize: '0.73rem',
                  color: '#374151',
                  borderTop: '1px solid #F1EFEA',
                  paddingTop: '0.45rem',
                  lineHeight: 1.35,
                }}
              >
                <strong>Acción:</strong> {c.strategicAction}
              </div>
            </div>
          );
        })}
      </div>

      {/* 4. MAPA 2D RFM (SE MUESTRA SOLO AL SOLICITARLO PARA MANTENER LA VISTA LIMPIA) */}
      {showScatterPlot && (
        <div
          style={{
            backgroundColor: '#FFFFFF',
            borderRadius: '12px',
            border: '1px solid #EAE6DF',
            padding: '1.15rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.75rem',
            animation: 'fadeIn 0.2s ease',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h4 style={{ margin: 0, fontSize: '0.9rem', fontWeight: 700, color: '#1C1510' }}>
              Mapa de Dispersión: Inactividad (X) vs Inversión Acumulada (Y)
            </h4>
            <span style={{ fontSize: '0.74rem', color: '#736B63' }}>Pasa el cursor sobre un punto para ver el cliente</span>
          </div>

          <div style={{ width: '100%', overflowX: 'auto', position: 'relative' }}>
            <svg
              viewBox={`0 0 ${svgWidth} ${svgHeight}`}
              style={{ width: '100%', minWidth: '660px', height: 'auto', display: 'block' }}
            >
              {[0, 0.5, 1].map((pct, idx) => {
                const yVal = padTop + graphHeight * (1 - pct);
                const mVal = Math.round(maxMonetary * 1.1 * pct);
                return (
                  <g key={idx}>
                    <line x1={padLeft} y1={yVal} x2={svgWidth - padRight} y2={yVal} stroke="#F3F0EA" strokeWidth="1" strokeDasharray={pct === 0 ? 'none' : '3,3'} />
                    <text x={padLeft - 8} y={yVal + 3} textAnchor="end" fontSize="10" fill="#A1978E">{formatBs(mVal)}</text>
                  </g>
                );
              })}

              <line x1={padLeft} y1={padTop + graphHeight} x2={svgWidth - padRight} y2={padTop + graphHeight} stroke="#D1C9BF" strokeWidth="1" />
              <text x={padLeft + graphWidth / 2} y={padTop + graphHeight + 30} textAnchor="middle" fontSize="10" fill="#736B63">
                Días de inactividad desde la última compra →
              </text>

              {clientSegments.map((client) => {
                const cx = getScatterX(client.recencyDays);
                const cy = getScatterY(client.monetaryTotal);
                const cluster = clusters.find((c) => c.clusterId === client.clusterId);
                const color = cluster?.color || '#8B5E34';
                const isHov = hoveredClient?.id_cliente === client.id_cliente;

                return (
                  <circle
                    key={client.id_cliente}
                    cx={cx}
                    cy={cy}
                    r={isHov ? 7 : 4.5}
                    fill={color}
                    fillOpacity={0.75}
                    stroke="#FFFFFF"
                    strokeWidth={isHov ? 2 : 1}
                    style={{ cursor: 'pointer' }}
                    onMouseEnter={() => setHoveredClient(client)}
                    onMouseLeave={() => setHoveredClient(null)}
                  />
                );
              })}
            </svg>

            {hoveredClient && (
              <div
                style={{
                  position: 'absolute',
                  top: '10px',
                  right: '16px',
                  backgroundColor: '#1C1510',
                  color: '#FFFFFF',
                  borderRadius: '6px',
                  padding: '0.5rem 0.8rem',
                  fontSize: '0.74rem',
                  pointerEvents: 'none',
                }}
              >
                <div style={{ fontWeight: 700 }}>{hoveredClient.nombreCompleto}</div>
                <div style={{ color: '#E5A96A' }}>{hoveredClient.clusterLabel}</div>
                <div>Gasto: {formatBs(hoveredClient.monetaryTotal)} · Inactividad: {hoveredClient.recencyDays}d</div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 5. TABLA PRIORITARIA: RESCATE DE CLIENTES EN RIESGO DE DESERCIÓN (CHURN) */}
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
              <UserX size={16} style={{ color: '#DC2626' }} />
              <h4 style={{ margin: 0, fontSize: '0.94rem', fontWeight: 700, color: '#1C1510' }}>
                Plan de Rescate Inmediato: Clientes de Alto Valor en Riesgo
              </h4>
            </div>
            <p style={{ margin: '0.15rem 0 0', fontSize: '0.76rem', color: '#736B63' }}>
              Cuentas valiosas con más de 45 días de inactividad comercial identificadas para acción directa.
            </p>
          </div>

          <button
            onClick={handleCopyContacts}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.35rem',
              padding: '0.35rem 0.75rem',
              borderRadius: '6px',
              border: '1px solid #D1C9BF',
              backgroundColor: copied ? '#ECFDF5' : '#FFFFFF',
              color: copied ? '#065F46' : '#1C1510',
              fontSize: '0.76rem',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            {copied ? <CheckCircle2 size={13} style={{ color: '#059669' }} /> : <Copy size={13} />}
            <span>{copied ? '¡Contactos Copiados!' : 'Copiar Lista para WhatsApp'}</span>
          </button>
        </div>

        {/* Tabla Limpia de Clientes en Riesgo */}
        <div style={{ overflowX: 'auto', border: '1px solid #EAE6DF', borderRadius: '8px' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.81rem', textAlign: 'left' }}>
            <thead>
              <tr style={{ backgroundColor: '#FAF8F5', borderBottom: '1px solid #EAE6DF', color: '#5C4033' }}>
                <th style={{ padding: '0.65rem 0.9rem', fontWeight: 600 }}>Cliente</th>
                <th style={{ padding: '0.65rem 0.9rem', fontWeight: 600 }}>Contacto</th>
                <th style={{ padding: '0.65rem 0.9rem', fontWeight: 600, textAlign: 'right' }}>Inactividad</th>
                <th style={{ padding: '0.65rem 0.9rem', fontWeight: 600, textAlign: 'right' }}>Gasto Histórico</th>
                <th style={{ padding: '0.65rem 0.9rem', fontWeight: 600 }}>Acción Comercial Sugerida</th>
              </tr>
            </thead>
            <tbody>
              {churnRiskClients.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ padding: '2rem', textAlign: 'center', color: '#059669', fontWeight: 600 }}>
                    Excelente: No hay clientes valiosos en riesgo crítico de deserción en este momento.
                  </td>
                </tr>
              ) : (
                churnRiskClients.map((client, idx) => (
                  <tr
                    key={client.id_cliente}
                    style={{
                      borderBottom: '1px solid #F3F0EA',
                      backgroundColor: idx % 2 === 0 ? '#FFFFFF' : '#FDFCFB',
                    }}
                  >
                    <td style={{ padding: '0.65rem 0.9rem' }}>
                      <div style={{ fontWeight: 600, color: '#1C1510' }}>{client.nombreCompleto}</div>
                    </td>
                    <td style={{ padding: '0.65rem 0.9rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                        {client.telefono && (
                          <a
                            href={`https://wa.me/${client.telefono.replace(/[^0-9]/g, '')}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', color: '#047857', fontWeight: 600, textDecoration: 'none', fontSize: '0.75rem' }}
                          >
                            <PhoneCall size={12} />
                            {client.telefono}
                          </a>
                        )}
                        {client.email && (
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', color: '#736B63', fontSize: '0.72rem' }}>
                            <Mail size={12} />
                            {client.email}
                          </span>
                        )}
                      </div>
                    </td>
                    <td style={{ padding: '0.65rem 0.9rem', textAlign: 'right' }}>
                      <span style={{ fontWeight: 700, color: '#DC2626', backgroundColor: '#FEF2F2', padding: '0.15rem 0.4rem', borderRadius: '4px' }}>
                        {client.diasSinCompra} días
                      </span>
                    </td>
                    <td style={{ padding: '0.65rem 0.9rem', textAlign: 'right', fontWeight: 700, color: '#1C1510' }}>
                      {formatBs(client.gastoHistorico)}
                    </td>
                    <td style={{ padding: '0.65rem 0.9rem' }}>
                      <span style={{ fontSize: '0.74rem', color: '#92400E', backgroundColor: '#FEF3C7', padding: '0.2rem 0.45rem', borderRadius: '4px' }}>
                        {client.accionRecomendada}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
