/**
 * @file ExecutiveVerdictCard.tsx
 * @caso-de-uso CU29 — Consultar Dashboard (Business Intelligence & Machine Learning)
 * @subsistema Inteligencia de Negocios y Reportes
 * @capa Presentacion (React)
 * @descripcion Tarjeta ejecutiva de diagnostico que interpreta inmediatamente
 * para el administrador si el rendimiento es optimo, preventivo o critico.
 * Presenta el semaforo de estado, la explicacion en lenguaje gerencial,
 * la metrica clave de decision y las 2 decisiones operativas inmediatas.
 */

import React, { useState } from 'react';
import {
  AlertTriangle,
  AlertCircle,
  CheckCircle2,
  ArrowRight,
  ChevronDown,
  ChevronUp,
  Cpu,
} from 'lucide-react';
import type { ExecutiveVerdict } from '../types/reports.types';

interface ExecutiveVerdictCardProps {
  verdict: ExecutiveVerdict;
  modelTechDetails?: React.ReactNode;
}

export const ExecutiveVerdictCard: React.FC<ExecutiveVerdictCardProps> = ({
  verdict,
  modelTechDetails,
}) => {
  const [showTechDetails, setShowTechDetails] = useState<boolean>(false);

  const isCritico = verdict.status === 'CRITICO';
  const isAlerta = verdict.status === 'ALERTA_OPERATIVA';

  let bannerBg = '#F0FDF4';
  let bannerBorder = '#BBF7D0';
  let badgeBg = '#DCFCE7';
  let badgeColor = '#15803D';
  let badgeBorder = '#86EFAC';
  let iconComponent = <CheckCircle2 size={18} style={{ color: '#15803D' }} />;

  if (isCritico) {
    bannerBg = '#FEF2F2';
    bannerBorder = '#FECACA';
    badgeBg = '#FEE2E2';
    badgeColor = '#B91C1C';
    badgeBorder = '#FCA5A5';
    iconComponent = <AlertTriangle size={18} style={{ color: '#B91C1C' }} />;
  } else if (isAlerta) {
    bannerBg = '#FFFBEB';
    bannerBorder = '#FDE68A';
    badgeBg = '#FEF3C7';
    badgeColor = '#B45309';
    badgeBorder = '#FCD34D';
    iconComponent = <AlertCircle size={18} style={{ color: '#B45309' }} />;
  }

  return (
    <div
      style={{
        backgroundColor: bannerBg,
        borderRadius: '12px',
        border: `1px solid ${bannerBorder}`,
        padding: '1.25rem 1.4rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '1rem',
        boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
        transition: 'all 0.2s ease',
      }}
    >
      {/* 1. FILA SUPERIOR: SEMÁFORO, TÍTULO DEL VEREDICTO Y MÉTRICA DESTACADA */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          flexWrap: 'wrap',
          gap: '1rem',
        }}
      >
        <div style={{ flex: 1, minWidth: '280px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.45rem' }}>
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.35rem',
                padding: '0.25rem 0.65rem',
                borderRadius: '6px',
                fontSize: '0.75rem',
                fontWeight: 700,
                backgroundColor: badgeBg,
                color: badgeColor,
                border: `1px solid ${badgeBorder}`,
                letterSpacing: '0.3px',
              }}
            >
              {iconComponent}
              <span>{verdict.statusLabel}</span>
            </span>

            <span style={{ fontSize: '0.75rem', color: '#736B63', fontWeight: 500 }}>
              Evaluación Ejecutiva Automatizada
            </span>
          </div>

          <h3
            style={{
              margin: '0 0 0.4rem',
              fontSize: '1.1rem',
              fontWeight: 800,
              color: '#1C1510',
              lineHeight: 1.3,
            }}
          >
            {verdict.verdictTitle}
          </h3>

          <p
            style={{
              margin: 0,
              fontSize: '0.84rem',
              color: '#4B5563',
              lineHeight: 1.5,
              maxWidth: '820px',
            }}
          >
            {verdict.summary}
          </p>
        </div>

        {/* Tarjeta de Métrica Clave de Decisión */}
        {verdict.highlightMetric && (
          <div
            style={{
              backgroundColor: '#FFFFFF',
              borderRadius: '10px',
              border: '1px solid #EAE6DF',
              padding: '0.75rem 1.1rem',
              minWidth: '200px',
              boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
            }}
          >
            <div style={{ fontSize: '0.72rem', color: '#736B63', fontWeight: 600, textTransform: 'uppercase' }}>
              {verdict.highlightMetric.label}
            </div>
            <div style={{ fontSize: '1.45rem', fontWeight: 800, color: badgeColor, marginTop: '0.15rem' }}>
              {verdict.highlightMetric.value}
            </div>
            <div style={{ fontSize: '0.7rem', color: '#9CA3AF', marginTop: '0.15rem' }}>
              {verdict.highlightMetric.description}
            </div>
          </div>
        )}
      </div>

      {/* 2. FILA DE DECISIONES CLAVE OPERATIVAS */}
      {verdict.keyDecisions && verdict.keyDecisions.length > 0 && (
        <div
          style={{
            backgroundColor: '#FFFFFF',
            borderRadius: '8px',
            border: '1px solid #EAE6DF',
            padding: '0.85rem 1rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.45rem',
          }}
        >
          <div style={{ fontSize: '0.74rem', fontWeight: 700, color: '#1C1510', textTransform: 'uppercase', letterSpacing: '0.3px' }}>
            Decisiones Clave Recomendadas:
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
            {verdict.keyDecisions.map((decision, idx) => (
              <div
                key={idx}
                style={{
                  display: 'flex',
                  alignItems: 'baseline',
                  gap: '0.45rem',
                  fontSize: '0.8rem',
                  color: '#374151',
                  lineHeight: 1.4,
                }}
              >
                <ArrowRight size={13} style={{ color: badgeColor, flexShrink: 0, marginTop: '3px' }} />
                <span>{decision}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 3. BOTÓN COLAPSABLE PARA DETALLES MATEMÁTICOS / TÉCNICOS (NO SATURA LA VISTA PRINCIPAL) */}
      {modelTechDetails && (
        <div>
          <button
            type="button"
            onClick={() => setShowTechDetails((prev) => !prev)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.35rem',
              backgroundColor: 'transparent',
              border: 'none',
              padding: '0.2rem 0',
              fontSize: '0.75rem',
              color: '#8B5E34',
              fontWeight: 600,
              cursor: 'pointer',
              textDecoration: 'none',
            }}
          >
            <Cpu size={13} />
            <span>{showTechDetails ? 'Ocultar detalles matemáticos del modelo' : 'Ver métricas técnicas del modelo (R², MSE, centroides)'}</span>
            {showTechDetails ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
          </button>

          {showTechDetails && (
            <div style={{ marginTop: '0.75rem', animation: 'fadeIn 0.2s ease' }}>
              {modelTechDetails}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
