/**
 * @file NeuralAnalyticsTab.tsx
 * @caso-de-uso CU29 — Consultar Dashboard (Business Intelligence & Machine Learning)
 * @subsistema Inteligencia de Negocios y Reportes
 * @capa Presentacion (React)
 * @descripcion Contenedor maestro del módulo de Toma de Decisiones Empresariales con Machine Learning.
 * Consolida los 3 pilares matemáticos aprobados:
 * 1. Modelo Supervisado: Red Neuronal MLP de Demanda & Abastecimiento Crítico.
 * 2. Modelo No Supervisado: K-Means Clustering RFM & Retención de Clientes (Churn).
 * 3. Modelado Estocástico: Simulación de Monte Carlo con 1,000 iteraciones (Poisson + Gauss).
 */

import React, { useState } from 'react';
import {
  TrendingUp,
  Target,
  Dice5,
  Sparkles,
} from 'lucide-react';
import { DemandForecastingView } from './DemandForecastingView';
import { RfmSegmentationView } from './RfmSegmentationView';
import { ScenarioSimulatorView } from './ScenarioSimulatorView';

interface NeuralAnalyticsTabProps {
  branches?: { id_sucursal: number; nombre: string }[];
}

type MlSubTab = 'supervisado' | 'nosupervisado' | 'montecarlo';

export const NeuralAnalyticsTab: React.FC<NeuralAnalyticsTabProps> = ({ branches = [] }) => {
  const [activeSubTab, setActiveSubTab] = useState<MlSubTab>('supervisado');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {/* 1. SELECTOR DE SUB-MODELOS DE MACHINE LEARNING */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '0.75rem',
          backgroundColor: '#FFFFFF',
          padding: '0.65rem 0.85rem',
          borderRadius: '10px',
          border: '1px solid #EAE6DF',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', flexWrap: 'wrap' }}>
          {/* Sub-tab 1: Supervisado */}
          <button
            type="button"
            onClick={() => setActiveSubTab('supervisado')}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem',
              padding: '0.45rem 0.9rem',
              borderRadius: '7px',
              border: activeSubTab === 'supervisado' ? '1px solid #1D4ED8' : '1px solid transparent',
              backgroundColor: activeSubTab === 'supervisado' ? '#EFF6FF' : 'transparent',
              color: activeSubTab === 'supervisado' ? '#1D4ED8' : '#736B63',
              fontSize: '0.82rem',
              fontWeight: 700,
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
          >
            <TrendingUp size={15} />
            <span>Supervisado: Demanda (Red Neuronal MLP)</span>
          </button>

          {/* Sub-tab 2: No Supervisado */}
          <button
            type="button"
            onClick={() => setActiveSubTab('nosupervisado')}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem',
              padding: '0.45rem 0.9rem',
              borderRadius: '7px',
              border: activeSubTab === 'nosupervisado' ? '1px solid #059669' : '1px solid transparent',
              backgroundColor: activeSubTab === 'nosupervisado' ? '#ECFDF5' : 'transparent',
              color: activeSubTab === 'nosupervisado' ? '#047857' : '#736B63',
              fontSize: '0.82rem',
              fontWeight: 700,
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
          >
            <Target size={15} />
            <span>No Supervisado: K-Means Clientes RFM</span>
          </button>

          {/* Sub-tab 3: Monte Carlo */}
          <button
            type="button"
            onClick={() => setActiveSubTab('montecarlo')}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem',
              padding: '0.45rem 0.9rem',
              borderRadius: '7px',
              border: activeSubTab === 'montecarlo' ? '1px solid #8B5E34' : '1px solid transparent',
              backgroundColor: activeSubTab === 'montecarlo' ? '#F7F3EE' : 'transparent',
              color: activeSubTab === 'montecarlo' ? '#8B5E34' : '#736B63',
              fontSize: '0.82rem',
              fontWeight: 700,
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
          >
            <Dice5 size={15} />
            <span>Estocástico: Simulación Monte Carlo</span>
          </button>
        </div>

        {/* Badge multi-inquilino */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.74rem', color: '#8B5E34', fontWeight: 600 }}>
          <Sparkles size={13} />
          <span>Aislamiento Multi-Tenant Activo</span>
        </div>
      </div>

      {/* 2. RENDERIZADO DEL SUB-MODELO ACTIVO */}
      {activeSubTab === 'supervisado' && <DemandForecastingView branches={branches} />}
      {activeSubTab === 'nosupervisado' && <RfmSegmentationView />}
      {activeSubTab === 'montecarlo' && <ScenarioSimulatorView branches={branches} />}
    </div>
  );
};
