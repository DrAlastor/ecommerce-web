/**
 * @file RfmSegmentationView.tsx
 * @caso-de-uso CU29 — Consultar Dashboard (Business Intelligence & Machine Learning)
 * @subsistema Inteligencia de Negocios y Reportes
 * @capa Presentacion (React)
 * @descripcion Vista de Toma de Decisiones basada en Modelo No Supervisado: K-Means
 * Clustering (k=4) sobre espacio vectorial RFM (Recencia, Frecuencia, Valor Monetario).
 * Agrupa clientes automaticamente en clusters homogeneos, detecta cuentas de alto valor
 * con riesgo inminente de desercion (Churn) y prescribe campanas comerciales dirigidas.
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
} from 'lucide-react';
import { reportsService } from '../services/reports.service';
import type { RfmClusterResult } from '../types/reports.types';

export const RfmSegmentationView: React.FC = () => {
  const [loading, setLoading] = useState<boolean>(true);
  const [data, setData] = useState<RfmClusterResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedClusterId, setSelectedClusterId] = useState<number | null>(null);
  const [copied, setCopied] = useState<boolean>(false);
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
      <div style={{ padding: '3rem', textAlign: 'center', backgroundColor: '#FFFFFF', borderRadius: '12px', border: '1px solid #EAE6DF' }}>
        <RefreshCw size={28} className="spin" style={{ color: '#8B5E34', marginBottom: '0.75rem', animation: 'spin 1s linear infinite' }} />
        <h4 style={{ margin: '0 0 0.5rem', color: '#1C1510', fontSize: '1rem', fontWeight: 600 }}>Ejecutando Agrupamiento K-Means no Supervisado...</h4>
        <p style={{ margin: 0, color: '#736B63', fontSize: '0.85rem' }}>
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

  const { summary, clusters, clientSegments, churnRiskClients } = data;

  // Filtrado opcional por cluster seleccionado
  const displayClients = selectedClusterId !== null
    ? clientSegments.filter((c) => c.clusterId === selectedClusterId)
    : clientSegments;

  // Calculo de escalas para el Grafico SVG de Dispersion 2D (Scatter Plot)
  const maxRecency = Math.max(...clientSegments.map((c) => c.recencyDays), 60);
  const maxMonetary = Math.max(...clientSegments.map((c) => c.monetaryTotal), 500);

  const svgWidth = 840;
  const svgHeight = 320;
  const padLeft = 70;
  const padRight = 35;
  const padTop = 30;
  const padBottom = 45;
  const graphWidth = svgWidth - padLeft - padRight;
  const graphHeight = svgHeight - padTop - padBottom;

  const getScatterX = (recency: number) => padLeft + (recency / (maxRecency * 1.05)) * graphWidth;
  const getScatterY = (monetary: number) => padTop + graphHeight - (monetary / (maxMonetary * 1.1)) * graphHeight;

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

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', color: '#1C1510' }}>
      {/* 1. CABECERA TÉCNICA Y RESUMEN K-MEANS */}
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
            <Target size={22} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700, color: '#1C1510' }}>
                Modelo No Supervisado: Agrupamiento K-Means RFM (k=4)
              </h3>
              <span
                style={{
                  fontSize: '0.68rem',
                  fontWeight: 700,
                  padding: '0.2rem 0.55rem',
                  borderRadius: '12px',
                  backgroundColor: '#ECFDF5',
                  color: '#065F46',
                  border: '1px solid #A7F3D0',
                  letterSpacing: '0.3px',
                }}
              >
                APRENDIZAJE NO SUPERVISADO
              </span>
            </div>
            <p style={{ margin: '0.25rem 0 0', fontSize: '0.8rem', color: '#736B63' }}>
              Clasificación multi-dimensional de clientes en base a Recencia (días), Frecuencia (visitas) y Valor Monetario (Bs.).
            </p>
          </div>
        </div>

        <button
          onClick={loadData}
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
          <span>Recalcular K-Means</span>
        </button>
      </div>

      {/* 2. KPIS DE CALIDAD DEL CLUSTERING */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '0.85rem',
        }}
      >
        <div style={{ backgroundColor: '#FFFFFF', padding: '0.9rem 1.1rem', borderRadius: '10px', border: '1px solid #EAE6DF' }}>
          <div style={{ fontSize: '0.72rem', color: '#736B63', fontWeight: 600, textTransform: 'uppercase' }}>Clientes Analizados</div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.4rem', marginTop: '0.25rem' }}>
            <span style={{ fontSize: '1.4rem', fontWeight: 700, color: '#1C1510' }}>
              {summary.totalClientsAnalyzed}
            </span>
            <span style={{ fontSize: '0.72rem', color: '#736B63' }}>cuentas activas</span>
          </div>
          <div style={{ fontSize: '0.72rem', color: '#A1978E', marginTop: '0.2rem' }}>Espacio vectorial ℝ³ normalizado</div>
        </div>

        <div style={{ backgroundColor: '#FFFFFF', padding: '0.9rem 1.1rem', borderRadius: '10px', border: '1px solid #EAE6DF' }}>
          <div style={{ fontSize: '0.72rem', color: '#736B63', fontWeight: 600, textTransform: 'uppercase' }}>Coeficiente Silhouette</div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.4rem', marginTop: '0.25rem' }}>
            <span style={{ fontSize: '1.4rem', fontWeight: 700, color: '#047857' }}>
              {summary.silhouetteScore.toFixed(2)}
            </span>
            <span style={{ fontSize: '0.7rem', color: '#059669', fontWeight: 600 }}>Alta cohesión</span>
          </div>
          <div style={{ fontSize: '0.72rem', color: '#A1978E', marginTop: '0.2rem' }}>Separabilidad entre clusters (s &gt; 0.5)</div>
        </div>

        <div style={{ backgroundColor: '#FFFFFF', padding: '0.9rem 1.1rem', borderRadius: '10px', border: '1px solid #EAE6DF' }}>
          <div style={{ fontSize: '0.72rem', color: '#736B63', fontWeight: 600, textTransform: 'uppercase' }}>Inercia WSS (Within-Cluster)</div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.4rem', marginTop: '0.25rem' }}>
            <span style={{ fontSize: '1.4rem', fontWeight: 700, color: '#1C1510' }}>
              {summary.inertia.toFixed(2)}
            </span>
          </div>
          <div style={{ fontSize: '0.72rem', color: '#A1978E', marginTop: '0.2rem' }}>Suma de distancias cuadradas mínimas</div>
        </div>

        <div style={{ backgroundColor: '#FFFFFF', padding: '0.9rem 1.1rem', borderRadius: '10px', border: '1px solid #EAE6DF' }}>
          <div style={{ fontSize: '0.72rem', color: '#736B63', fontWeight: 600, textTransform: 'uppercase' }}>Alertas de Fuga (Churn)</div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.4rem', marginTop: '0.25rem' }}>
            <span style={{ fontSize: '1.4rem', fontWeight: 700, color: '#DC2626' }}>
              {churnRiskClients.length}
            </span>
            <span style={{ fontSize: '0.7rem', color: '#DC2626', fontWeight: 600 }}>Requieren rescate</span>
          </div>
          <div style={{ fontSize: '0.72rem', color: '#A1978E', marginTop: '0.2rem' }}>Clientes valiosos inactivos</div>
        </div>
      </div>

      {/* 3. TARJETAS DE CLUSTERS CON ACCIÓN ESTRATÉGICA */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
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
                padding: '1rem',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
                boxShadow: isSelected ? '0 3px 8px rgba(0,0,0,0.06)' : 'none',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
              }}
            >
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: c.color }}>
                    {getClusterIcon(c.clusterId)}
                    <span style={{ fontWeight: 700, fontSize: '0.88rem' }}>{c.label}</span>
                  </div>
                  <span
                    style={{
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      backgroundColor: `${c.color}15`,
                      color: c.color,
                      padding: '0.15rem 0.45rem',
                      borderRadius: '4px',
                    }}
                  >
                    {c.percentage}% ({c.clientCount})
                  </span>
                </div>

                <p style={{ margin: '0.4rem 0 0.6rem', fontSize: '0.77rem', color: '#736B63', lineHeight: 1.4 }}>
                  {c.description}
                </p>

                {/* Métricas del Centroide */}
                <div
                  style={{
                    backgroundColor: '#FAF9F7',
                    padding: '0.45rem 0.65rem',
                    borderRadius: '6px',
                    fontSize: '0.72rem',
                    display: 'flex',
                    justifyContent: 'space-between',
                    color: '#5C4033',
                    marginBottom: '0.65rem',
                  }}
                >
                  <span><strong>Recencia:</strong> {Math.round(c.centroid.recencyDays)}d</span>
                  <span><strong>Frecuencia:</strong> {c.centroid.frequencyCount.toFixed(1)} ord</span>
                  <span><strong>Ticket:</strong> {formatBs(c.centroid.monetaryTotal)}</span>
                </div>
              </div>

              <div
                style={{
                  fontSize: '0.72rem',
                  color: '#4B5563',
                  borderTop: '1px solid #EAE6DF',
                  paddingTop: '0.5rem',
                  lineHeight: 1.35,
                }}
              >
                <strong style={{ color: '#1C1510' }}>Acción:</strong> {c.strategicAction}
              </div>
            </div>
          );
        })}
      </div>

      {/* 4. DISPERSIÓN 2D RFM (SCATTER PLOT SVG) */}
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
              Distribución Vectorial RFM: Recencia (Eje X) vs. Inversión Total (Eje Y)
            </h4>
            <p style={{ margin: '0.2rem 0 0', fontSize: '0.78rem', color: '#736B63' }}>
              El radio del punto representa la frecuencia acumulada de compras. Pasa el cursor sobre un punto para ver detalles del cliente.
            </p>
          </div>

          {selectedClusterId !== null && (
            <button
              onClick={() => setSelectedClusterId(null)}
              style={{
                fontSize: '0.75rem',
                padding: '0.25rem 0.6rem',
                borderRadius: '6px',
                border: '1px solid #D1C9BF',
                backgroundColor: '#FAF8F5',
                color: '#5C4033',
                cursor: 'pointer',
              }}
            >
              Mostrar Todos los Clusters
            </button>
          )}
        </div>

        {/* Lienzo SVG Scatter */}
        <div style={{ width: '100%', overflowX: 'auto', position: 'relative' }}>
          <svg
            viewBox={`0 0 ${svgWidth} ${svgHeight}`}
            style={{ width: '100%', minWidth: '680px', height: 'auto', display: 'block' }}
          >
            {/* Cuadrícula horizontal (Monetary) */}
            {[0, 0.25, 0.5, 0.75, 1].map((pct, idx) => {
              const yVal = padTop + graphHeight * (1 - pct);
              const mVal = Math.round(maxMonetary * 1.1 * pct);
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
                    {formatBs(mVal)}
                  </text>
                </g>
              );
            })}

            {/* Cuadrícula vertical (Recency) */}
            {[0, 0.25, 0.5, 0.75, 1].map((pct, idx) => {
              const xVal = padLeft + graphWidth * pct;
              const rVal = Math.round(maxRecency * 1.05 * pct);
              return (
                <g key={idx}>
                  <line
                    x1={xVal}
                    y1={padTop}
                    x2={xVal}
                    y2={padTop + graphHeight}
                    stroke="#F1EFEA"
                    strokeWidth="1"
                    strokeDasharray="3,3"
                  />
                  <text
                    x={xVal}
                    y={padTop + graphHeight + 18}
                    textAnchor="middle"
                    fontSize="10"
                    fill="#736B63"
                    fontFamily="inherit"
                  >
                    {rVal} días
                  </text>
                </g>
              );
            })}

            {/* Etiquetas de ejes */}
            <text
              x={padLeft + graphWidth / 2}
              y={padTop + graphHeight + 35}
              textAnchor="middle"
              fontSize="11"
              fontWeight="600"
              fill="#5C4033"
            >
              Recencia: Días transcurridos desde la última compra (Menor es mejor) →
            </text>
            <text
              x={15}
              y={padTop + graphHeight / 2}
              textAnchor="middle"
              fontSize="11"
              fontWeight="600"
              fill="#5C4033"
              transform={`rotate(-90 15 ${padTop + graphHeight / 2})`}
            >
              Valor Monetario Total (Bs.)
            </text>

            {/* Puntos de dispersión (Clientes) */}
            {displayClients.map((client) => {
              const cx = getScatterX(client.recencyDays);
              const cy = getScatterY(client.monetaryTotal);
              const r = Math.min(Math.max(client.frequencyCount * 2 + 3, 4), 14);
              const cluster = clusters.find((c) => c.clusterId === client.clusterId);
              const color = cluster?.color || '#8B5E34';
              const isHovered = hoveredClient?.id_cliente === client.id_cliente;

              return (
                <g key={client.id_cliente}>
                  <circle
                    cx={cx}
                    cy={cy}
                    r={isHovered ? r + 3 : r}
                    fill={color}
                    fillOpacity={isHovered ? 0.9 : 0.65}
                    stroke="#FFFFFF"
                    strokeWidth={isHovered ? 2.5 : 1}
                    style={{ cursor: 'pointer', transition: 'all 0.15s ease' }}
                    onMouseEnter={() => setHoveredClient(client)}
                    onMouseLeave={() => setHoveredClient(null)}
                  />
                </g>
              );
            })}
          </svg>

          {/* Tooltip flotante al pasar sobre un cliente */}
          {hoveredClient && (
            <div
              style={{
                position: 'absolute',
                top: '12px',
                right: '16px',
                backgroundColor: '#1C1510',
                color: '#FFFFFF',
                borderRadius: '8px',
                padding: '0.65rem 0.9rem',
                fontSize: '0.75rem',
                boxShadow: '0 4px 12px rgba(0,0,0,0.25)',
                pointerEvents: 'none',
                maxWidth: '280px',
                border: '1px solid #8B5E34',
              }}
            >
              <div style={{ fontWeight: 700, fontSize: '0.82rem', marginBottom: '0.2rem' }}>
                {hoveredClient.nombreCompleto}
              </div>
              <div style={{ color: '#E5A96A', fontWeight: 600, marginBottom: '0.35rem' }}>
                Segmento: {hoveredClient.clusterLabel}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.3rem', color: '#D1C9BF' }}>
                <span>Inactividad: {hoveredClient.recencyDays}d</span>
                <span>Frecuencia: {hoveredClient.frequencyCount} compras</span>
                <span>Gasto Total: {formatBs(hoveredClient.monetaryTotal)}</span>
                <span>Puntos: {hoveredClient.puntosFidelidad} pts</span>
              </div>
              {hoveredClient.telefono && (
                <div style={{ marginTop: '0.35rem', color: '#93C5FD' }}>
                  Tel: {hoveredClient.telefono}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* 5. TABLA PRIORITARIA: CLIENTES EN RIESGO DE CHURN Y ACCIÓN INMEDIATA */}
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
              <UserX size={17} style={{ color: '#DC2626' }} />
              <h4 style={{ margin: 0, fontSize: '0.98rem', fontWeight: 700, color: '#1C1510' }}>
                Matriz de Retención: Clientes de Alto Valor en Riesgo de Deserción (Churn)
              </h4>
            </div>
            <p style={{ margin: '0.2rem 0 0', fontSize: '0.78rem', color: '#736B63' }}>
              Identificados automáticamente por el modelo K-Means al detectar compras históricas elevadas pero inactividad prolongada (&gt; 45 días).
            </p>
          </div>

          <button
            onClick={handleCopyContacts}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem',
              padding: '0.4rem 0.8rem',
              borderRadius: '6px',
              border: '1px solid #D1C9BF',
              backgroundColor: copied ? '#ECFDF5' : '#FFFFFF',
              color: copied ? '#065F46' : '#1C1510',
              fontSize: '0.78rem',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
          >
            {copied ? <CheckCircle2 size={13} style={{ color: '#059669' }} /> : <Copy size={13} />}
            <span>{copied ? '¡Contactos Copiados!' : 'Copiar Lista para WhatsApp/Email'}</span>
          </button>
        </div>

        {/* Tabla de Clientes en Riesgo */}
        <div style={{ overflowX: 'auto', border: '1px solid #EAE6DF', borderRadius: '8px' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem', textAlign: 'left' }}>
            <thead>
              <tr style={{ backgroundColor: '#FAF8F5', borderBottom: '1px solid #EAE6DF', color: '#5C4033' }}>
                <th style={{ padding: '0.75rem 1rem', fontWeight: 600 }}>Cliente</th>
                <th style={{ padding: '0.75rem 1rem', fontWeight: 600 }}>Canal de Contacto</th>
                <th style={{ padding: '0.75rem 1rem', fontWeight: 600, textAlign: 'right' }}>Días sin Compra</th>
                <th style={{ padding: '0.75rem 1rem', fontWeight: 600, textAlign: 'right' }}>Inversión Histórica</th>
                <th style={{ padding: '0.75rem 1rem', fontWeight: 600, textAlign: 'right' }}>Compras Totales</th>
                <th style={{ padding: '0.75rem 1rem', fontWeight: 600 }}>Acción Prescriptiva Sugerida</th>
              </tr>
            </thead>
            <tbody>
              {churnRiskClients.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ padding: '2rem', textAlign: 'center', color: '#736B63' }}>
                    Excelente: No se registran clientes de alto valor en riesgo de abandono en este momento.
                  </td>
                </tr>
              ) : (
                churnRiskClients.map((client, idx) => (
                  <tr
                    key={client.id_cliente}
                    style={{
                      borderBottom: '1px solid #F1EFEA',
                      backgroundColor: idx % 2 === 0 ? '#FFFFFF' : '#FDFCFB',
                    }}
                  >
                    <td style={{ padding: '0.75rem 1rem' }}>
                      <div style={{ fontWeight: 600, color: '#1C1510' }}>{client.nombreCompleto}</div>
                      <div style={{ fontSize: '0.72rem', color: '#736B63' }}>ID: #{client.id_cliente}</div>
                    </td>
                    <td style={{ padding: '0.75rem 1rem' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.15rem' }}>
                        {client.telefono && (
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', color: '#1E40AF', fontSize: '0.75rem' }}>
                            <PhoneCall size={12} />
                            {client.telefono}
                          </span>
                        )}
                        {client.email && (
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', color: '#736B63', fontSize: '0.72rem' }}>
                            <Mail size={12} />
                            {client.email}
                          </span>
                        )}
                      </div>
                    </td>
                    <td style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>
                      <span
                        style={{
                          fontWeight: 700,
                          color: '#DC2626',
                          backgroundColor: '#FEF2F2',
                          padding: '0.2rem 0.45rem',
                          borderRadius: '4px',
                        }}
                      >
                        {client.diasSinCompra} días
                      </span>
                    </td>
                    <td style={{ padding: '0.75rem 1rem', textAlign: 'right', fontWeight: 600, color: '#1C1510' }}>
                      {formatBs(client.gastoHistorico)}
                    </td>
                    <td style={{ padding: '0.75rem 1rem', textAlign: 'right', color: '#736B63' }}>
                      {client.comprasTotales} pedidos
                    </td>
                    <td style={{ padding: '0.75rem 1rem' }}>
                      <span
                        style={{
                          display: 'inline-block',
                          fontSize: '0.75rem',
                          color: '#92400E',
                          backgroundColor: '#FEF3C7',
                          padding: '0.25rem 0.55rem',
                          borderRadius: '4px',
                          border: '1px solid #FDE68A',
                          lineHeight: 1.3,
                        }}
                      >
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
